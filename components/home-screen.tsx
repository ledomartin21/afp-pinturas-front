"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, ShoppingBag, ClipboardList, Menu, ShoppingCart, ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { getCategoryIcon } from "@/lib/config/category-icons"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import type { Screen } from "@/app/page"
import { carouselService, productsService } from "@/lib/api"
import type { Carrusel } from "@/lib/types"

const VISIBLE_CATEGORIES = 3

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cartCount: number
}

export function HomeScreen({ onNavigate, onOpenMenu, cartCount }: HomeScreenProps) {
  const [carousels, setCarousels] = useState<Carrusel[]>([])
  const [carouselsLoading, setCarouselsLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [carouselApis, setCarouselApis] = useState<Map<number, CarouselApi>>(new Map())
  const [activeSlides, setActiveSlides] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catalogs = await productsService.getCatalogs()
        setCategories(Array.from(catalogs.rubroMap.values()))
      } catch {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const loadCarousels = async () => {
      try {
        setCarouselsLoading(true)
        const allCarousels = await carouselService.getCarousels()
        const activeCarousels = allCarousels.filter((c) => c.activo)
        const carouselsWithFlyers = await Promise.all(
          activeCarousels.map((c) => carouselService.getCarouselById(c.id))
        )
        setCarousels(carouselsWithFlyers.filter((c) => c.flyers && c.flyers.length > 0))
      } catch {
        setCarousels([])
      } finally {
        setCarouselsLoading(false)
      }
    }
    loadCarousels()
  }, [])

  const onCarouselApi = useCallback((carouselId: number, api: CarouselApi) => {
    if (!api) return
    setCarouselApis((prev) => new Map(prev).set(carouselId, api))

    const onSelect = () => {
      setActiveSlides((prev) => new Map(prev).set(carouselId, api.selectedScrollSnap()))
    }
    api.on("select", onSelect)
    onSelect()
  }, [])

  // Auto-advance all carousels
  useEffect(() => {
    if (carouselApis.size === 0) return
    const interval = setInterval(() => {
      carouselApis.forEach((api) => {
        if (!api) return
        if (api.canScrollNext()) {
          api.scrollNext()
        } else {
          api.scrollTo(0)
        }
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [carouselApis])

  const visibleCategories = showAllCategories ? categories : categories.slice(0, VISIBLE_CATEGORIES)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header amarillo sólido estilo Stitch */}
      <div className="bg-primary px-4 pt-6 pb-8 rounded-b-xl shadow-lg">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onOpenMenu}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          {/* Logo central */}
          <img
            src="/images/logo.png"
            alt="AFP Pinturas"
            className="h-12 w-auto object-contain drop-shadow-md"
          />

          {/* Carrito */}
          <button
            onClick={() => onNavigate("cart")}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Barra de busqueda */}
        <div
          className="relative cursor-pointer shadow-xl"
          onClick={() => onNavigate("catalog")}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <Input
            placeholder="¿Qué estás buscando hoy?"
            readOnly
            className="pl-12 h-14 bg-white border-none text-foreground rounded-2xl font-medium shadow-inner cursor-pointer placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-auto px-4 pb-6">
        {/* Acciones rapidas */}
        <div className="grid grid-cols-2 gap-3 -mt-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.97] border-0 shadow-sm"
            onClick={() => onNavigate("catalog")}
          >
            <CardContent className="flex flex-col items-center justify-center py-5 gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Hacer pedido</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all active:scale-[0.97] border-0 shadow-sm"
            onClick={() => onNavigate("orders")}
          >
            <CardContent className="flex flex-col items-center justify-center py-5 gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Mis pedidos</span>
            </CardContent>
          </Card>
        </div>

        {/* Explorar Catalogo */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Explorar Catálogo</h2>
            <button
              onClick={() => onNavigate("catalog")}
              className="flex items-center text-sm font-medium text-primary hover:underline"
            >
              Ver todo
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>

          <div className="grid gap-3 grid-cols-3">
            {visibleCategories.map((cat) => {
              const CategoryIcon = getCategoryIcon(cat)
              return (
                <Card
                  key={cat}
                  className="cursor-pointer hover:shadow-md transition-all active:scale-[0.97] border-0 shadow-sm"
                  onClick={() => onNavigate("catalog")}
                >
                  <CardContent className="flex flex-col items-center justify-center py-4 gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-foreground text-center line-clamp-2">{cat}</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {categories.length > VISIBLE_CATEGORIES && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center justify-center gap-1 w-full mt-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {showAllCategories ? "Mostrar menos" : `Mostrar más (${categories.length - VISIBLE_CATEGORIES})`}
              <ChevronDown className={`w-4 h-4 transition-transform ${showAllCategories ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>

        {/* Novedades */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-foreground mb-3">Novedades</h2>

          {carouselsLoading ? (
            <div className="h-44 rounded-2xl bg-muted animate-pulse flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : carousels.length > 0 ? (
            <div className="space-y-4">
              {carousels.map((carousel) => {
                const flyers = carousel.flyers || []
                const activeIdx = activeSlides.get(carousel.id) || 0

                if (flyers.length === 0) return null

                if (flyers.length === 1) {
                  return (
                    <img
                      key={carousel.id}
                      src={flyers[0].url}
                      alt={flyers[0].titulo || carousel.nombre}
                      className="w-full h-44 object-cover rounded-2xl shadow-md"
                    />
                  )
                }

                return (
                  <div key={carousel.id}>
                    <Carousel
                      opts={{ loop: true }}
                      setApi={(api) => onCarouselApi(carousel.id, api)}
                      className="w-full"
                    >
                      <CarouselContent className="ml-0">
                        {flyers.map((flyer) => (
                          <CarouselItem key={flyer.id} className="pl-0">
                            <img
                              src={flyer.url}
                              alt={flyer.titulo || carousel.nombre}
                              className="w-full h-44 object-cover rounded-2xl"
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                    <div className="flex justify-center gap-1.5 mt-2">
                      {flyers.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => carouselApis.get(carousel.id)?.scrollTo(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === activeIdx
                              ? "bg-primary w-4"
                              : "bg-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-5 rounded-2xl">
                <h3 className="text-lg font-bold text-primary-foreground mb-1">Bienvenido a AFP Pinturas</h3>
                <p className="text-sm text-primary-foreground/80">Encontrá todo lo que necesitás para tu obra</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
