"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Search,
  ScanLine,
  Tag,
  SlidersHorizontal,
  Loader2,
  MessageCircle,
  Flame,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Product, Screen } from "@/app/page"
import { productsService } from "@/lib/api"

interface CatalogScreenProps {
  onProductClick: (product: Product) => void
  onNavigate: (screen: Screen) => void
}

const FEATURED_BANNERS = [
  {
    id: "banner-1",
    title: "HIDROLAVADORAS",
    subtitle: "GX-H90P / 160B",
    description: "1700W | 1350W / 1680bar | 2150w",
    image: "/industrial-power-washer-hydrolavadora.jpg",
  },
  {
    id: "banner-2",
    title: "LISTA de PRECIOS",
    subtitle: "ACTUALIZADA!",
    description: "Consulta nuestros mejores precios",
    image: "/price-list-hardware-store.jpg",
  },
]

const WSP_NUMBER = "5491112345678"
const ITEMS_PER_PAGE = 20
const PAGE_WINDOW_SIZE = 5

export function CatalogScreen({ onProductClick, onNavigate }: CatalogScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [errorMessage, setErrorMessage] = useState("")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todas")
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

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

  const promoProducts = products.filter((p) => p.isPromo)
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

  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE
  const pageWindowStart = Math.floor((currentPage - 1) / PAGE_WINDOW_SIZE) * PAGE_WINDOW_SIZE + 1
  const pageWindowEnd = Math.min(pageWindowStart + PAGE_WINDOW_SIZE - 1, totalPages)
  const visiblePages = Array.from(
    { length: pageWindowEnd - pageWindowStart + 1 },
    (_, idx) => pageWindowStart + idx,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, selectedCategory, selectedBrands, priceRange])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const activeFiltersCount =
    (selectedBrands.length > 0 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
    (selectedCategory !== "Todas" ? 1 : 0)

  const openWhatsApp = () => {
    window.open(`https://wa.me/${WSP_NUMBER}?text=Hola! Quiero consultar sobre productos de AFP Pinturas`, "_blank")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header con logo */}
      <div className="bg-card px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <img
            src="/images/logo-afp.png"
            alt="AFP Pinturas"
            className="h-10 w-auto"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={openWhatsApp}
              className="bg-[#25D366] w-9 h-9 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform active:scale-95"
              aria-label="Contactar por WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
      {/* Barra accent */}
      <div className="h-1 bg-accent" />

      {isLoading ? (
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="text-center space-y-3">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando catalogo...</p>
          </div>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div className="px-3 pt-3">
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
            </div>
          )}
          {/* Barra de busqueda */}
          <div className="p-3 space-y-3 bg-card">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar productos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 border-2 focus-visible:border-accent"
                />
              </div>
              <Button size="icon" className="h-11 w-11 bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
                <ScanLine className="w-5 h-5" />
              </Button>
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 shrink-0 relative bg-transparent border-2"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground font-bold">
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

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap text-xs ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent"
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-muted/30">
            {/* Banners / Flyers */}
            <div className="p-3 space-y-3">
              {FEATURED_BANNERS.map((banner) => (
                <div
                  key={banner.id}
                  className="relative rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-primary to-primary/80 text-primary-foreground cursor-pointer hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex-1 z-10">
                      <h2 className="text-lg font-bold text-accent mb-0.5">{banner.title}</h2>
                      <p className="text-sm font-semibold mb-0.5">{banner.subtitle}</p>
                      <p className="text-[11px] opacity-80">{banner.description}</p>
                    </div>
                    <div className="w-24 h-24 relative z-10">
                      <img
                        src={banner.image || "/placeholder.svg"}
                        alt={banner.title}
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
                </div>
              ))}
            </div>

            {/* Promociones */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-500 p-1.5 rounded-lg">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold">PROMOCIONES</h3>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
                {promoProducts.map((product) => (
                  <Card
                    key={`promo-${product.id}`}
                    className="cursor-pointer hover:shadow-lg transition-all border-2 border-accent/40 overflow-hidden shrink-0 w-40 active:scale-[0.97]"
                    onClick={() => onProductClick(product)}
                  >
                    <div className="relative">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-32 object-cover bg-muted"
                      />
                      <Badge className="absolute top-1.5 right-1.5 bg-red-500 text-white font-bold text-[10px] px-1.5">
                        PROMO
                      </Badge>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">SIN STOCK</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2.5 space-y-1">
                      <h4 className="font-semibold text-xs leading-tight line-clamp-2">{product.name}</h4>
                      <p className="text-sm font-bold">${product.price.toLocaleString("es-AR")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Seccion productos */}
            <div className="px-3 pt-1 pb-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-primary p-1.5 rounded-lg">
                  <Tag className="w-4 h-4 text-primary-foreground" />
                </div>
                <h3 className="text-base font-bold">CATALOGO</h3>
              </div>
            </div>

            {/* Grilla de productos */}
            <div className="px-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-all border overflow-hidden active:scale-[0.97]"
                    onClick={() => onProductClick(product)}
                  >
                    <div className="relative">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className={`w-full aspect-square object-cover bg-muted ${product.stock === 0 ? "opacity-60" : ""}`}
                      />
                      {product.isPromo && product.stock > 0 && (
                        <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground font-bold text-xs">
                          OFERTA
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 flex items-end justify-center pb-3">
                          <div className="flex items-center gap-1 bg-red-500/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            SIN STOCK
                          </div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1.5">
                      <h3 className="font-semibold text-sm leading-tight text-balance line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <div className="flex items-end justify-between">
                        <p className="text-base font-bold">${product.price.toLocaleString("es-AR")}</p>
                        <p className={`text-xs ${product.stock === 0 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                          {product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {totalProducts > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-center text-xs text-muted-foreground">
                    Mostrando {pageStart + 1}-{Math.min(pageStart + ITEMS_PER_PAGE, totalProducts)} de {totalProducts} productos
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        aria-label="Pagina anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {visiblePages.map((page) => (
                        <Button
                          key={`page-${page}`}
                          size="sm"
                          variant={currentPage === page ? "default" : "outline"}
                          className="h-8 min-w-8 px-2"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}

                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        aria-label="Pagina siguiente"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {totalProducts === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </div>
              )}
            </div>
          </div>

          {/* WhatsApp flotante */}
          <button
            onClick={openWhatsApp}
            className="fixed bottom-24 right-4 bg-[#25D366] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 z-50"
            aria-label="Contactar por WhatsApp"
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </button>
        </>
      )}
    </div>
  )
}
