"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { QuickAddModal } from "@/components/modals/quick-add-modal"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
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
  onViewPromotion: (product: Product) => void
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cart: CartItem[]
  onAddToCart: (product: Product, quantity?: number) => void
  onUpdateQuantity: (cartKey: string, quantity: number) => void
  isReserveApproved: (productId: string) => boolean
  onApproveReserve: (productId: string) => void
}

const ITEMS_PER_PAGE = APP_CONSTANTS.ITEMS_PER_PAGE

function getComboItemsFromPromotion(promotion?: Product["promotion"]) {
  if (!promotion) return []

  if (promotion.comboItems && promotion.comboItems.length > 0) {
    return promotion.comboItems
      .map((item) => ({
        productoCodigo: (item.productoCodigo || "").trim(),
        cantidad: Number(item.cantidad || 1),
      }))
      .filter((item) => item.productoCodigo)
  }

  return [
    promotion.comboProductoCodigoA ? { productoCodigo: promotion.comboProductoCodigoA.trim(), cantidad: 1 } : null,
    promotion.comboProductoCodigoB ? { productoCodigo: promotion.comboProductoCodigoB.trim(), cantidad: 1 } : null,
  ].filter((item): item is { productoCodigo: string; cantidad: number } => Boolean(item))
}

function buildPromotionListing(products: Product[]) {
  const uniqueCombos = new Set<string>()
  const result: Product[] = []

  for (const product of products) {
    if (!product.isPromo || !product.promotion) continue

    if (product.promotion.tipo === "combo_fijo") {
      const comboKey = `combo:${product.promotion.id}`
      if (uniqueCombos.has(comboKey)) {
        continue
      }
      uniqueCombos.add(comboKey)
    }

    result.push(product)
  }

  return result
}

export function CatalogScreen({ onProductClick, onViewPromotion, onNavigate, onOpenMenu, cart, onAddToCart, onUpdateQuantity, isReserveApproved, onApproveReserve }: CatalogScreenProps) {
  const maxPrice = 50000
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const navigationRef = useRef({ pathname, params })
  navigationRef.current = { pathname, params }
  const updateFilters = (values: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(navigationRef.current.params.toString())
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (resetPage) next.delete("pagina")
    router.replace(`${navigationRef.current.pathname}?${next}`, { scroll: false })
  }
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const search = params.get("buscar") || ""
  const [searchInput, setSearchInput] = useState(search)
  const filterPreset = pathname === "/promociones" ? "promotions" : "default"
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadRequestIdRef = useRef(0)
  const promotionsCacheRef = useRef<Map<string, Product[]>>(new Map())
  const selectedCategory = params.get("categoria") || "Todas"
  const brandsParam = params.get("marcas") || ""
  const selectedBrands = useMemo(() => brandsParam.split("|").filter(Boolean), [brandsParam])
  const minParam = params.get("min")
  const maxParam = params.get("max")
  const priceRange = useMemo(() => {
    const min = Math.min(maxPrice, Math.max(0, Number(minParam) || 0))
    const max = maxParam === null || !Number.isFinite(Number(maxParam)) ? maxPrice : Math.min(maxPrice, Math.max(min, Number(maxParam)))
    return [min, max]
  }, [minParam, maxParam])
  const setSelectedCategory = (category: string) => updateFilters({ categoria: category === "Todas" ? null : category })
  const setPriceRange = (range: number[]) => updateFilters({ min: range[0] ? String(range[0]) : null, max: range[1] < maxPrice ? String(range[1]) : null })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const requestedPage = Number(params.get("pagina"))
  const currentPage = Number.isFinite(requestedPage) ? Math.max(1, Math.floor(requestedPage)) : 1
  const setCurrentPage = (page: number | ((previous: number) => number)) => {
    const nextPage = typeof page === "function" ? page(currentPage) : page
    updateFilters({ pagina: nextPage > 1 ? String(nextPage) : null }, false)
  }
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
          .flatMap((product) =>
            getComboItemsFromPromotion(product.promotion)
              .map((item) => item.productoCodigo)
              .filter((code) => code && !productMetaByCode.has(code) && !comboPartnerPreviewByCode[code]),
          ),
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
    setSearchInput(search)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
  }, [search, pathname])

  useEffect(() => {
    const loadProducts = async () => {
      const requestId = ++loadRequestIdRef.current

      try {
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(true)
        }

        if (filterPreset === "promotions") {
          const promotionsCacheKey = JSON.stringify({
            search,
            selectedCategory,
            selectedBrands: [...selectedBrands].sort(),
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          })

          let promoProducts = promotionsCacheRef.current.get(promotionsCacheKey)

          if (!promoProducts) {
            const allProducts = await productsService.getProducts({
              search,
              category: selectedCategory === "Todas" ? undefined : selectedCategory,
              brands: selectedBrands,
              minPrice: priceRange[0],
              maxPrice: priceRange[1],
            })
            promoProducts = buildPromotionListing(allProducts)
            promotionsCacheRef.current.set(promotionsCacheKey, promoProducts)
          }

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          const promoTotal = promoProducts.length
          const promoPages = Math.max(1, Math.ceil(promoTotal / ITEMS_PER_PAGE))
          const safePage = Math.min(currentPage, promoPages)
          const start = (safePage - 1) * ITEMS_PER_PAGE
          const end = start + ITEMS_PER_PAGE

          setProducts(promoProducts.slice(start, end))
          setTotalProducts(promoTotal)
          setTotalPages(promoPages)
          if (safePage !== currentPage) {
            setCurrentPage(safePage)
          }
        } else {
          const result = await productsService.getProductsPaginated(currentPage, ITEMS_PER_PAGE, {
            search,
            category: selectedCategory,
            brands: selectedBrands,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
          })

          if (requestId !== loadRequestIdRef.current) {
            return
          }

          setProducts(result.items)
          setTotalProducts(result.total)
          const validPages = Math.max(1, result.totalPages)
          setTotalPages(validPages)
          if (currentPage > validPages) setCurrentPage(validPages)
        }

        if (requestId === loadRequestIdRef.current) {
          setErrorMessage("")
        }
      } catch {
        if (requestId === loadRequestIdRef.current) {
          setErrorMessage("No se pudo cargar el catálogo")
        }
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setIsLoading(false)
        }
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
    const next = selectedBrands.includes(brand) ? selectedBrands.filter((b) => b !== brand) : [...selectedBrands, brand]
    updateFilters({ marcas: next.join("|") || null })
  }

  const clearFilters = () => {
    updateFilters({ marcas: null, min: null, max: null, categoria: null })
  }

  // Scroll to top on page change
  const previousPageRef = useRef(currentPage)
  useEffect(() => {
    if (previousPageRef.current !== currentPage) mainRef.current?.scrollIntoView({ block: "start" })
    previousPageRef.current = currentPage
  }, [currentPage])

  const activeFiltersCount =
    (selectedBrands.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (selectedCategory !== "Todas" ? 1 : 0)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const getCartQuantity = (productId: string) => {
    const item = cart.find((i) => i.type === "product" && i.id === productId)
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
      onUpdateQuantity(`product:${product.id}`, qty + 1)
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
      onUpdateQuantity(`product:${reserveProduct.id}`, qty + reserveRequestedQuantity)
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
    searchTimerRef.current = setTimeout(() => updateFilters({ buscar: value || null }), 400)
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
      <header className="commerce-card relative z-10 overflow-hidden rounded-xl border-l-4 border-l-primary px-4 pb-4 pt-4 lg:flex lg:items-center lg:justify-between lg:gap-4 lg:p-5">
        <div className="relative mb-4 lg:mb-0">
          <p className="text-sm font-bold text-muted-foreground">Pedido online AFP</p>
          <h1 className="text-2xl font-black tracking-[-0.035em] lg:text-3xl">{filterPreset === "promotions" ? "Promociones disponibles" : "Encontrá lo que necesitás"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Buscá, revisá stock y sumá productos a tu pedido.</p>
        </div>
        <div className="hidden">
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
              className="mt-1 h-10 w-auto object-contain drop-shadow-md"
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
        <div className="relative flex gap-2 lg:hidden">
          <div className="relative flex-1 rounded-[1.25rem] bg-white">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary/70" />
            <Input
              placeholder="Buscar producto"
              aria-label="Buscar en el catálogo"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
                className="w-full h-11 rounded-xl border bg-transparent pl-11 pr-4 text-base font-medium shadow-none placeholder:text-muted-foreground"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                aria-label="Abrir filtros"
                  className="relative h-11 w-11 shrink-0 rounded-xl bg-primary text-foreground lg:hidden"
              >
                <SlidersHorizontal className="w-5 h-5 text-foreground" />
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white text-primary font-bold">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
              <SheetContent side="bottom" className="h-[85dvh] rounded-t-3xl">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-xl">Filtros</SheetTitle>
                <SheetDescription>Filtrá por categoría, marca y precio.</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-24">
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
        <div className="relative mt-2 flex justify-end lg:mt-0">
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border bg-card px-3 py-2 text-sm font-bold text-foreground shadow-sm hover:bg-muted"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary">
              <ScanSearch className="h-3.5 w-3.5" />
            </span>
            Carga rapida por codigo
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="lg:mt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
      <aside aria-label="Filtros del catálogo" className="commerce-card sticky top-40 hidden rounded-[1.4rem] p-5 lg:block">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</h2><button onClick={clearFilters} className="min-h-11 text-sm underline underline-offset-4">Limpiar</button></div>
        <label htmlFor="desktop-category" className="mb-2 block text-sm font-semibold">Categoría</label>
        <select id="desktop-category" value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="mb-6 w-full min-w-0 rounded-lg border bg-background px-2 text-sm">
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <fieldset className="mb-6"><legend className="mb-2 text-sm font-semibold">Marcas</legend>
          <div className="max-h-72 overflow-y-auto pr-2">{brands.map((brand) => <label key={brand} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm"><Checkbox checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} /><span className="min-w-0 break-words">{brand}</span></label>)}</div>
        </fieldset>
        <fieldset><legend className="mb-3 text-sm font-semibold">Rango de precio</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-muted-foreground">Desde<input key={`min-${priceRange[0]}`} type="number" min={0} max={priceRange[1]} step={1000} defaultValue={priceRange[0]} onBlur={(event) => setPriceRange([Math.min(priceRange[1], Math.max(0, Number(event.target.value))), priceRange[1]])} className="mt-1 w-full rounded-lg border bg-background px-2 text-sm text-foreground" /></label>
            <label className="text-xs text-muted-foreground">Hasta<input key={`max-${priceRange[1]}`} type="number" min={priceRange[0]} max={maxPrice} step={1000} defaultValue={priceRange[1]} onBlur={(event) => setPriceRange([priceRange[0], Math.min(maxPrice, Math.max(priceRange[0], Number(event.target.value)))])} className="mt-1 w-full rounded-lg border bg-background px-2 text-sm text-foreground" /></label>
          </div>
        </fieldset>
      </aside>
      <section ref={mainRef} aria-label="Resultados del catálogo" aria-busy={isLoading} className="min-w-0 flex-1 px-4 pb-8 pt-3 lg:p-0">
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

            {/* Info de resultados */}
             {totalProducts > 0 && (
                <p role="status" className="commerce-chip pt-2 lg:pt-0">
                  {filterPreset === "promotions"
                    ? `${totalProducts} promoción${totalProducts !== 1 ? "es" : ""} encontrada${totalProducts !== 1 ? "s" : ""}`
                    : `${totalProducts} producto${totalProducts !== 1 ? "s" : ""} encontrado${totalProducts !== 1 ? "s" : ""}`}
                </p>
              )}

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                 {products.map((product) => {
                 const qty = getCartQuantity(product.id)
                 const hasCheckoutPromo = product.promotion?.aplicaEnCheckout && product.promoPrice && product.promotion?.tipo === "porcentaje"
                 const effectivePrice = hasCheckoutPromo ? (product.promoPrice ?? product.price) : product.price
                 const isHighlighted = recentlyAddedId === product.id
                 return (
                    <article
                      key={product.id}
                        className={`commerce-card group flex min-h-full flex-col overflow-hidden rounded-xl transition-all hover:-translate-y-0.5 ${
                         isHighlighted ? "border-primary/40 ring-2 ring-primary/15" : "border-border"
                       }`}
                    >
                       <button
                        aria-label={`Ver ${product.name}`}
                        className="relative aspect-[4/3] w-full overflow-hidden bg-white cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                      <img
                        alt={product.name}
                        className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
                         src={product.image || "/placeholder.svg"}
                         loading="lazy"
                       />
                      {product.isPromo && product.promotion && (
                        <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-black text-background shadow-sm">
                          PROMO
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute right-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-black text-white shadow-sm">Sin stock</span>
                      )}
                    </button>
                     <div className="min-w-0 flex flex-1 flex-col justify-between p-3 pt-3">
                      <div
                        className="cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                          <p className="mb-1 text-[10px] font-bold tracking-wider text-destructive">
                          {product.id}
                        </p>
                        <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-black leading-tight text-foreground">
                          <button className="text-left hover:underline" onClick={(event) => { event.stopPropagation(); onProductClick(product) }}>{product.name}</button>
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.category}{product.brand ? ` · ${product.brand}` : ""}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <div>
                            {hasCheckoutPromo ? (
                              <>
                                <p className="text-[10px] text-muted-foreground line-through">
                                  ${product.price.toLocaleString("es-AR")}
                                </p>
                                <p className="text-2xl font-black text-primary">
                                  ${effectivePrice.toLocaleString("es-AR")}
                                </p>
                              </>
                            ) : (
                              <p className="text-2xl font-black text-foreground">
                                ${product.price.toLocaleString("es-AR")}
                              </p>
                            )}
                          </div>
                          {product.isPromo && product.promotion && (
                            <Badge className="bg-primary text-foreground text-[10px] font-black">
                              {product.promotion.tipo === "nxm"
                                ? `${product.promotion.cantidadLleva}x${product.promotion.cantidadPaga}`
                                : product.promotion.tipo === "combo_fijo"
                                  ? "COMBO"
                                  : (<><Percent className="mr-1 h-3 w-3" />-{product.promotion.valor}%</>)}
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Reservable</span>
                          )}
                        </div>
                        {product.promotion?.tipo === "combo_fijo" && (
                          <>
                            {(() => {
                              const comboItems = getComboItemsFromPromotion(product.promotion)
                              const previewItems = comboItems.map((comboItem) => {
                                const meta = productMetaByCode.get(comboItem.productoCodigo) || comboPartnerPreviewByCode[comboItem.productoCodigo]
                                return {
                                  ...comboItem,
                                  name: meta?.name || comboItem.productoCodigo,
                                  image: meta?.image || "/placeholder.svg",
                                }
                              })

                              return (
                                <>
                                  <div className="mt-1 flex items-center gap-2">
                                    {previewItems.slice(0, 3).map((item, index) => (
                                      <div key={`${product.id}-${item.productoCodigo}-${index}`} className="flex items-center gap-1.5">
                                        {index > 0 && <span className="text-[10px] font-semibold text-amber-800">+</span>}
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="h-6 w-6 rounded-md border border-amber-200 bg-white object-cover"
                                        />
                                      </div>
                                    ))}
                                    {previewItems.length > 3 && <span className="text-[10px] font-semibold text-amber-700">+{previewItems.length - 3}</span>}
                                  </div>

                                  <p className="mt-1 text-[10px] font-medium text-amber-700">
                                    Incluye {previewItems.reduce((sum, item) => sum + Number(item.cantidad || 0), 0)} unidad(es):{" "}
                                    {previewItems
                                      .map((item) => (item.cantidad > 1 ? `${item.cantidad}x ${item.name}` : item.name))
                                      .join(" + ")} por ${Number(product.promotion.comboPrecioFijo || 0).toLocaleString("es-AR")}
                                  </p>
                                </>
                              )
                            })()}
                          </>
                        )}
                      </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                         {qty > 0 ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                              {qty} agregado{qty > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Agregar al pedido</span>
                          )}

                         <div className="flex items-center gap-1.5">
                         {qty > 0 && qty >= product.stock && (
                           <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                         )}
                           <div className="flex items-center rounded-2xl border border-border bg-muted/60 p-0.5 shadow-inner">
                            <button
                              aria-label={`Quitar una unidad de ${product.name}`}
                              disabled={qty === 0}
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-destructive hover:bg-card disabled:opacity-40"
                              onClick={() => {
                                if (qty > 0) onUpdateQuantity(`product:${product.id}`, qty - 1)
                              }}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold select-none">
                              {qty}
                            </span>
                             <button
                              aria-label={`Agregar una unidad de ${product.name}`}
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-foreground hover:bg-muted"
                              onClick={() => handlePlusClick(product, qty)}
                             >
                               <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          </div>
                        </div>
                        {product.promotion && (
                          <button
                            type="button"
                            className="mt-2 rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[10px] font-black text-amber-800"
                            onClick={() => onViewPromotion(product)}
                          >
                            Ver promoción
                          </button>
                        )}
                      </div>
                    </article>
                 )
               })}
             </div>

            {products.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 py-4">
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Página anterior"
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
                       aria-label={`Página ${item}`}
                       aria-current={currentPage === item ? "page" : undefined}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm transition-colors ${
                        currentPage === item ? "bg-primary text-foreground" : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setCurrentPage(item)}
                    >
                      {item}
                    </button>
                  ),
                )}
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Página siguiente"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

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
      </section>
      </div>

      {/* Dialog de reserva */}
      <AlertDialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl sm:max-w-lg">
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
