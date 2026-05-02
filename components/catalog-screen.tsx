"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { QuickAddModal } from "@/components/modals/quick-add-modal"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  ScanSearch,
  SlidersHorizontal,
  Loader2,
  Menu,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  AlertTriangle,
  CalendarClock,
  Percent,
} from "lucide-react"
import type { Product, Screen, CartItem } from "@/app/page"
import { productsService } from "@/lib/api"
import { APP_CONSTANTS } from "@/lib/config/constants"
import { toast } from "@/hooks/use-toast"

interface CatalogScreenProps {
  onProductClick: (product: Product) => void
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cart: CartItem[]
  onAddToCart: (product: Product, quantity?: number) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  initialCategory?: string
  initialSearch?: string
  initialPreset?: "promotions" | "default"
  navigationToken?: number
  isReserveApproved: (productId: string) => boolean
  onApproveReserve: (productId: string) => void
}

const ITEMS_PER_PAGE = APP_CONSTANTS.ITEMS_PER_PAGE

function getComboPartnerCode(productId: string, codeA?: string | null, codeB?: string | null) {
  const current = (productId || "").trim()
  const a = (codeA || "").trim()
  const b = (codeB || "").trim()

  if (!current) return a || b || null
  if (current === a) return b || null
  if (current === b) return a || null
  return a || b || null
}

export function CatalogScreen({ onProductClick, onNavigate, onOpenMenu, cart, onAddToCart, onUpdateQuantity, initialCategory, initialSearch, initialPreset = "default", navigationToken, isReserveApproved, onApproveReserve }: CatalogScreenProps) {
  const maxPrice = 50000
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [filterPreset, setFilterPreset] = useState<"promotions" | "default">("default")
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [comboPartnerPreviewByCode, setComboPartnerPreviewByCode] = useState<Record<string, { name: string; image: string }>>({})

  const productMetaByCode = useMemo(() => {
    const map = new Map<string, { name: string; image: string }>()
    for (const product of products) {
      const code = (product.id || "").trim()
      if (!code || map.has(code)) continue
      map.set(code, { name: product.name, image: product.image || "/placeholder.svg" })
    }
    return map
  }, [products])

  useEffect(() => {
    const missingPartnerCodes = Array.from(
      new Set(
        products
          .filter((product) => product.promotion?.tipo === "combo_fijo")
          .map((product) =>
            getComboPartnerCode(product.id, product.promotion?.comboProductoCodigoA, product.promotion?.comboProductoCodigoB),
          )
          .filter((code): code is string => Boolean(code && !productMetaByCode.has(code) && !comboPartnerPreviewByCode[code])),
      ),
    )

    if (missingPartnerCodes.length === 0) return

    let cancelled = false

    const loadMissingPartners = async () => {
      const entries = await Promise.all(
        missingPartnerCodes.map(async (code) => {
          try {
            const partner = await productsService.getProductByCode(code)
            return [code, { name: partner.name || code, image: partner.image || "/placeholder.svg" }] as const
          } catch {
            return [code, { name: code, image: "/placeholder.svg" }] as const
          }
        }),
      )

      if (cancelled) return

      setComboPartnerPreviewByCode((prev) => {
        const next = { ...prev }
        for (const [code, preview] of entries) {
          next[code] = preview
        }
        return next
      })
    }

    void loadMissingPartners()

    return () => {
      cancelled = true
    }
  }, [products, productMetaByCode, comboPartnerPreviewByCode])

  useEffect(() => {
    if (!navigationToken) return

    setCurrentPage(1)
    setSearch(initialSearch || "")
    setSearchInput(initialSearch || "")
    setFilterPreset(initialPreset)
    setSelectedBrands([])
    setPriceRange([0, maxPrice])
    setSelectedCategory(initialCategory || "Todas")
    setFiltersOpen(false)
  }, [initialCategory, initialSearch, initialPreset, navigationToken])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        if (filterPreset === "promotions") {
          const allProducts = await productsService.getProducts({
            search,
            category: selectedCategory === "Todas" ? undefined : selectedCategory,
            brands: selectedBrands,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          })
          const promoProducts = allProducts.filter((product) => product.isPromo)
          const promoTotal = promoProducts.length
          const promoPages = Math.max(1, Math.ceil(promoTotal / ITEMS_PER_PAGE))
          const start = (currentPage - 1) * ITEMS_PER_PAGE
          const end = start + ITEMS_PER_PAGE

          setProducts(promoProducts.slice(start, end))
          setTotalProducts(promoTotal)
          setTotalPages(promoPages)
        } else {
          const result = await productsService.getProductsPaginated(currentPage, ITEMS_PER_PAGE, {
            search,
            category: selectedCategory,
            brands: selectedBrands,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          })

          setProducts(result.items)
          setTotalProducts(result.total)
          setTotalPages(result.totalPages)
        }
        setErrorMessage("")
      } catch {
        setErrorMessage("No se pudo cargar el catálogo")
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [currentPage, search, selectedCategory, selectedBrands, priceRange, filterPreset])

  const [categories, setCategories] = useState<string[]>(["Todas"])
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    const loadCatalogs = async () => {
      const catalogs = await productsService.getCatalogs()
      const categoryList = ["Todas", ...Array.from(catalogs.rubroMap.values())]
      const brandList = Array.from(catalogs.marcaMap.values())
      setCategories(categoryList)
      setBrands(brandList)
    }
    loadCatalogs()
  }, [])

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => (prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]))
  }

  const clearFilters = () => {
    setSelectedBrands([])
    setPriceRange([0, maxPrice])
    setSelectedCategory("Todas")
    setFilterPreset("default")
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, selectedBrands, priceRange])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // Scroll to top on page change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [currentPage])

  const activeFiltersCount =
    (selectedBrands.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (selectedCategory !== "Todas" ? 1 : 0)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const getCartQuantity = (productId: string) => {
    const item = cart.find((i) => i.id === productId)
    return item ? item.quantity : 0
  }

  const [showReserveDialog, setShowReserveDialog] = useState(false)
  const [reserveProduct, setReserveProduct] = useState<Product | null>(null)
  const [reserveAction, setReserveAction] = useState<"add" | "increment">("add")
  const [reserveRequestedQuantity, setReserveRequestedQuantity] = useState(1)

  const handlePlusClick = (product: Product, qty: number) => {
    const isOutOfStock = product.stock === 0
    const exceedsStock = qty >= product.stock && product.stock > 0
    const approved = isReserveApproved(product.id)

    if ((isOutOfStock || exceedsStock) && !approved) {
      setReserveProduct(product)
      setReserveAction(qty === 0 ? "add" : "increment")
      setReserveRequestedQuantity(1)
      setShowReserveDialog(true)
      return
    }

    if (qty === 0) {
      onAddToCart(product, 1)
    } else {
      onUpdateQuantity(product.id, qty + 1)
    }

    setRecentlyAddedId(product.id)
  }

  const handleReserveConfirm = () => {
    if (!reserveProduct) return
    onApproveReserve(reserveProduct.id)
    const qty = getCartQuantity(reserveProduct.id)
    if (reserveAction === "add") {
      onAddToCart(reserveProduct, reserveRequestedQuantity)
    } else {
      onUpdateQuantity(reserveProduct.id, qty + reserveRequestedQuantity)
    }
    setShowReserveDialog(false)
    setReserveProduct(null)
    setReserveRequestedQuantity(1)
  }

  const mainRef = useRef<HTMLElement>(null)

  const handleQuickAddProduct = (product: Product, quantity: number) => {
    const currentQty = getCartQuantity(product.id)
    const nextQty = currentQty + quantity

    if ((product.stock === 0 || nextQty > product.stock) && !isReserveApproved(product.id)) {
      setReserveProduct(product)
      setReserveAction(currentQty === 0 ? "add" : "increment")
      setReserveRequestedQuantity(quantity)
      setShowReserveDialog(true)
      return false
    }

    onAddToCart(product, quantity)
    toast({
      title: "Producto agregado",
      description: `${product.name} se sumó al carrito.`,
    })
    return true
  }

  const handleSearchInput = (value: string) => {
    setSearchInput(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSearch(value), 400)
  }

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!recentlyAddedId) return
    const timer = window.setTimeout(() => setRecentlyAddedId(null), 1200)
    return () => window.clearTimeout(timer)
  }, [recentlyAddedId])

  // Pagination - Stitch style with ellipsis
  const getPaginationItems = () => {
    const items: (number | "...")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) items.push(i)
    } else {
      items.push(1, 2, 3)
      if (currentPage > 3 && currentPage < totalPages - 1) {
        items.push("...", currentPage)
      }
      if (totalPages > 4) items.push("...")
      items.push(totalPages)
    }
    // deduplicate
    const unique: (number | "...")[] = []
    for (const item of items) {
      if (unique[unique.length - 1] !== item) unique.push(item)
    }
    return unique
  }

  return (
    <div className="flex flex-col h-full">
      <header className="relative z-10 overflow-hidden rounded-b-[1.7rem] bg-primary px-4 pb-5 pt-5 shadow-lg">
        <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_45%)]" />
        <div className="relative mb-3.5 grid w-full grid-cols-3 items-center gap-3">
          <div className="flex justify-start">
            <button
              onClick={onOpenMenu}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/logo.png"
              alt="AFP Pinturas"
              className="h-10 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onNavigate("cart")}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm"
              aria-label="Carrito"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="relative flex gap-2 rounded-[1.6rem] bg-white/14 p-1 shadow-[0_14px_28px_rgba(0,0,0,0.16)] backdrop-blur">
          <div className="relative flex-1 rounded-[1.25rem] bg-white">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary/70" />
            <Input
              placeholder="Buscar producto"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full h-11 rounded-[1.25rem] border-none bg-transparent pl-11 pr-4 text-sm font-medium shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                  className="relative h-11 w-11 shrink-0 rounded-[1.25rem] border border-white/25 bg-white/15 hover:bg-white/20"
              >
                <SlidersHorizontal className="w-5 h-5 text-white" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white text-primary font-bold">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-xl">Filtros</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6 overflow-auto h-[calc(85vh-140px)] pb-4">
                <div>
                  <Label className="text-base font-semibold mb-3 block">Categoria</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className={
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-transparent"
                        }
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Marca</Label>
                  <div className="space-y-3 bg-muted/30 p-3 rounded-xl">
                    {brands.map((brand) => (
                      <div key={brand} className="flex items-center space-x-3">
                        <Checkbox
                          id={brand}
                          checked={selectedBrands.includes(brand)}
                          onCheckedChange={() => toggleBrand(brand)}
                        />
                        <label htmlFor={brand} className="text-sm font-medium leading-none cursor-pointer flex-1">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Rango de Precio</Label>
                  <div className="bg-muted/30 p-4 rounded-xl space-y-4">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>${priceRange[0].toLocaleString("es-AR")}</span>
                      <span>${priceRange[1].toLocaleString("es-AR")}</span>
                    </div>
                    <Slider min={0} max={maxPrice} step={1000} value={priceRange} onValueChange={setPriceRange} />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={clearFilters}>
                  Limpiar
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setFiltersOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="mt-2 flex justify-end pr-1">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/18 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] backdrop-blur-sm transition-transform active:scale-[0.98]"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary">
              <ScanSearch className="h-3.5 w-3.5" />
            </span>
            Carga rapida por codigo
          </button>
        </div>
      </header>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-auto px-4 pb-20 pt-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-3">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Cargando catálogo...</p>
            </div>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="pt-3">
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
              </div>
            )}

            {/* Info de resultados + Paginación */}
             {totalProducts > 0 && (
               <p className="text-xs text-muted-foreground text-center pt-2">
                 {filterPreset === "promotions"
                   ? `${totalProducts} promoción${totalProducts !== 1 ? "es" : ""} encontrada${totalProducts !== 1 ? "s" : ""}`
                   : `${totalProducts} producto${totalProducts !== 1 ? "s" : ""} encontrado${totalProducts !== 1 ? "s" : ""}`}
               </p>
             )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center py-4 gap-1">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {getPaginationItems().map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-1 text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                        currentPage === item
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

              <div className="space-y-2.5">
                {products.map((product) => {
                 const qty = getCartQuantity(product.id)
                 const hasCheckoutPromo = product.promotion?.aplicaEnCheckout && product.promoPrice && product.promotion?.tipo === "porcentaje"
                 const effectivePrice = hasCheckoutPromo ? product.promoPrice : product.price
                 const isHighlighted = recentlyAddedId === product.id
                 return (
                   <div
                     key={product.id}
                      className={`flex gap-2.5 rounded-[1.35rem] border bg-card p-2.5 shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-all ${
                        isHighlighted ? "border-primary/40 ring-2 ring-primary/15" : "border-border"
                      }`}
                    >
                      <div
                        className="h-[5.25rem] w-[5.25rem] shrink-0 overflow-hidden rounded-[1rem] bg-muted cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                      <img
                        alt={product.name}
                        className="h-full w-full object-contain"
                        src={product.image || "/placeholder.svg"}
                      />
                    </div>
                     <div className="flex flex-1 flex-col justify-between">
                      <div
                        className="cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive">
                          {product.id}
                        </p>
                        <h3 className="text-[13px] font-semibold leading-tight line-clamp-2 text-foreground">
                          {product.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <div>
                            {hasCheckoutPromo ? (
                              <>
                                <p className="text-[10px] text-muted-foreground line-through">
                                  ${product.price.toLocaleString("es-AR")}
                                </p>
                                <p className="text-lg font-extrabold text-primary">
                                  ${effectivePrice.toLocaleString("es-AR")}
                                </p>
                              </>
                            ) : (
                              <p className="text-lg font-extrabold text-foreground">
                                ${product.price.toLocaleString("es-AR")}
                              </p>
                            )}
                          </div>
                          {product.isPromo && product.promotion && (
                            <Badge className="bg-accent text-white text-[10px] font-bold">
                              {product.promotion.tipo === "nxm"
                                ? `${product.promotion.cantidadLleva}x${product.promotion.cantidadPaga}`
                                : product.promotion.tipo === "combo_fijo"
                                  ? "COMBO x2"
                                  : (<><Percent className="mr-1 h-3 w-3" />-{product.promotion.valor}%</>)}
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Sin stock</span>
                          )}
                        </div>
                        {product.promotion?.tipo === "combo_fijo" && (
                          <>
                            {(() => {
                              const partnerCode = getComboPartnerCode(
                                product.id,
                                product.promotion?.comboProductoCodigoA,
                                product.promotion?.comboProductoCodigoB,
                              )
                              const partnerMeta = partnerCode
                                ? productMetaByCode.get(partnerCode) || comboPartnerPreviewByCode[partnerCode]
                                : null

                              return (
                                <div className="mt-1 flex items-center gap-2">
                                  <img
                                    src={product.image || "/placeholder.svg"}
                                    alt={product.name}
                                    className="h-6 w-6 rounded-md border border-amber-200 bg-white object-cover"
                                  />
                                  <span className="text-[10px] font-semibold text-amber-800">+</span>
                                  <img
                                    src={partnerMeta?.image || "/placeholder.svg"}
                                    alt={partnerMeta?.name || "Producto combo"}
                                    className="h-6 w-6 rounded-md border border-amber-200 bg-white object-cover"
                                  />
                                </div>
                              )
                            })()}
                            <p className="mt-1 text-[10px] font-medium text-amber-700">
                              Incluye 2 productos: {product.name}
                              {(() => {
                                const partnerCode = getComboPartnerCode(
                                  product.id,
                                  product.promotion?.comboProductoCodigoA,
                                  product.promotion?.comboProductoCodigoB,
                                )
                                if (!partnerCode) return ""
                                const partnerMeta = productMetaByCode.get(partnerCode) || comboPartnerPreviewByCode[partnerCode]
                                return ` + ${partnerMeta?.name || partnerCode}`
                              })()} por ${Number(product.promotion.comboPrecioFijo || 0).toLocaleString("es-AR")}
                            </p>
                          </>
                        )}
                      </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                         {qty > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                              {qty} agregado{qty > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-muted-foreground">Sumalo en un toque</span>
                          )}

                         <div className="flex items-center gap-1.5">
                         {qty > 0 && qty >= product.stock && (
                           <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                         )}
                          <div className="flex items-center rounded-2xl border border-border bg-muted/60 p-0.5 shadow-inner">
                            <button
                              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-destructive hover:bg-card"
                              onClick={() => {
                                if (qty > 0) onUpdateQuantity(product.id, qty - 1)
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold select-none">
                              {qty}
                            </span>
                            <button
                              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl text-primary hover:bg-card"
                              onClick={() => handlePlusClick(product, qty)}
                            >
                              <Plus className="w-4 h-4" />
                           </button>
                         </div>
                         </div>
                       </div>
                     </div>
                   </div>
                )
              })}
            </div>

            {totalProducts === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {filterPreset === "promotions"
                    ? "No se encontraron promociones"
                    : "No se encontraron productos"}
                </p>
              </div>
            )}

          </>
        )}
      </main>

      {/* Dialog de reserva */}
      <AlertDialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {reserveProduct?.stock === 0 ? "Producto sin stock" : "Stock insuficiente"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {reserveProduct?.stock === 0
                ? `"${reserveProduct?.name}" no tiene stock disponible actualmente. ¿Deseas reservarlo? Te avisaremos cuando esté disponible.`
                : `Solo hay ${reserveProduct?.stock} unidades de "${reserveProduct?.name}". ¿Deseas reservar las unidades faltantes?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReserveConfirm}
              className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
            >
              Sí, reservar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <QuickAddModal open={quickAddOpen} onOpenChange={setQuickAddOpen} onProductAdded={handleQuickAddProduct} />
    </div>
  )
}
