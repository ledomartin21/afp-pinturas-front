"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import type { Product, Screen, CartItem } from "@/app/page"
import { productsService } from "@/lib/api"
import { APP_CONSTANTS } from "@/lib/config/constants"

interface CatalogScreenProps {
  onProductClick: (product: Product) => void
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cart: CartItem[]
  onAddToCart: (product: Product, quantity?: number) => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  initialCategory?: string
  onCategoryApplied?: () => void
}

const ITEMS_PER_PAGE = APP_CONSTANTS.ITEMS_PER_PAGE

export function CatalogScreen({ onProductClick, onNavigate, onOpenMenu, cart, onAddToCart, onUpdateQuantity, initialCategory, onCategoryApplied }: CatalogScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory)
      onCategoryApplied?.()
    }
  }, [initialCategory, onCategoryApplied])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
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
        setErrorMessage("")
      } catch {
        setErrorMessage("No se pudo cargar el catálogo")
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [currentPage, search, selectedCategory, selectedBrands, priceRange])

  const maxPrice = 50000
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

  const handlePlusClick = (product: Product, qty: number) => {
    const isOutOfStock = product.stock === 0
    const exceedsStock = qty >= product.stock && product.stock > 0

    if (isOutOfStock || exceedsStock) {
      setReserveProduct(product)
      setReserveAction(qty === 0 ? "add" : "increment")
      setShowReserveDialog(true)
      return
    }

    if (qty === 0) {
      onAddToCart(product, 1)
    } else {
      onUpdateQuantity(product.id, qty + 1)
    }
  }

  const handleReserveConfirm = () => {
    if (!reserveProduct) return
    const qty = getCartQuantity(reserveProduct.id)
    if (reserveAction === "add") {
      onAddToCart(reserveProduct, 1)
    } else {
      onUpdateQuantity(reserveProduct.id, qty + 1)
    }
    setShowReserveDialog(false)
    setReserveProduct(null)
  }

  const mainRef = useRef<HTMLElement>(null)

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
      {/* Header dorado estilo Stitch */}
      <header className="bg-primary pt-6 pb-8 px-6 shadow-lg rounded-b-xl relative z-10">
        <div className="grid grid-cols-3 items-center w-full mb-6">
          <div className="flex justify-start">
            <button
              onClick={onOpenMenu}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/logo.png"
              alt="AFP Pinturas"
              className="h-11 w-auto object-contain drop-shadow-md"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => onNavigate("cart")}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative"
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
        {/* Barra de búsqueda */}
        <div className="relative shadow-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
            <Input
              placeholder="¿Qué estás buscando hoy?"
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full h-14 pl-14 pr-6 rounded-2xl border-none bg-white text-foreground font-medium shadow-inner placeholder:text-muted-foreground"
            />
          </div>
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="h-14 w-14 shrink-0 relative bg-white/20 border border-white/30 hover:bg-white/30 rounded-2xl"
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
      </header>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-auto px-4 pb-24">
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
              <p className="text-xs text-muted-foreground text-center pt-4">
                {totalProducts} producto{totalProducts !== 1 ? "s" : ""} encontrado{totalProducts !== 1 ? "s" : ""}
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

            {/* Lista de productos horizontal - estilo Stitch */}
            <div className="space-y-2">
              {products.map((product) => {
                const qty = getCartQuantity(product.id)
                return (
                  <div
                    key={product.id}
                    className="flex gap-3 rounded-lg bg-card p-2.5 shadow-sm border border-border"
                  >
                    {/* Imagen */}
                    <div
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer"
                      onClick={() => onProductClick(product)}
                    >
                      <img
                        alt={product.name}
                        className="h-full w-full object-contain"
                        src={product.image || "/placeholder.svg"}
                      />
                    </div>
                    {/* Info */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div
                        className="cursor-pointer"
                        onClick={() => onProductClick(product)}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-destructive mb-0.5">
                          {product.id}
                        </p>
                        <h3 className="text-xs font-semibold leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-base font-extrabold">
                            ${product.price.toLocaleString("es-AR")}
                          </p>
                          {product.stock === 0 && (
                            <span className="text-[10px] font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">Sin stock</span>
                          )}
                        </div>
                      </div>
                      {/* Controles de cantidad */}
                      <div className="flex items-center justify-end mt-1 gap-1.5">
                        {qty > 0 && qty >= product.stock && (
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <div className="flex items-center rounded-md bg-muted p-0.5 border border-border">
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded hover:bg-card text-foreground/60"
                            onClick={() => {
                              if (qty > 0) onUpdateQuantity(product.id, qty - 1)
                            }}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold select-none">
                            {qty}
                          </span>
                          <button
                            className="flex h-7 w-7 items-center justify-center rounded hover:bg-card text-foreground/60"
                            onClick={() => handlePlusClick(product, qty)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalProducts === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron productos</p>
              </div>
            )}

            {/* Footer */}
            <footer className="flex flex-col items-center py-12">
              <p className="text-[10px] font-medium text-muted-foreground">© 2026 AFP Pinturas S.L.</p>
            </footer>
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
    </div>
  )
}
