"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, ShoppingBag, Tags, ShieldCheck } from "lucide-react"
import type { Screen } from "@/app/page"
import { carouselService } from "@/lib/api"
import type { Carrusel, Flyer } from "@/lib/types"

type DownloadSlide =
  | {
      id: string
      title: string
      image: string
      type: "price-list"
    }
  | {
      id: string
      title: string
      image: string
      type: "flyer"
      flyer: Flyer
    }

const NOVEDADES_TILES: Array<{
  id: string
  title: string
  image: string
  action: "promotions" | "afp" | "all"
}> = [
  {
    id: "novedades-promociones",
    title: "Promociones",
    image: "/images/novedades/promociones.png",
    action: "promotions",
  },
  {
    id: "novedades-afp",
    title: "Linea AFP",
    image: "/images/novedades/afp.png",
    action: "afp",
  },
  {
    id: "novedades-catalogo",
    title: "Catalogo completo",
    image: "/images/novedades/catalogo.png",
    action: "all",
  },
]

const PRICE_LIST_SLIDE: DownloadSlide = {
  id: "price-list-static",
  title: "Lista de precios",
  image: "/images/flyers/lista-precios.png",
  type: "price-list",
}

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void
  onSearchNavigate: (search: string) => void
  onCatalogPresetNavigate: (preset: "promotions" | "afp" | "all") => void
  onOpenMenu: () => void
  cartCount: number
  isLoggedIn: boolean
}

export function HomeScreen({ onNavigate, onCatalogPresetNavigate }: HomeScreenProps) {
  const [downloadsCarousel, setDownloadsCarousel] = useState<Carrusel | null>(null)
  const [downloadIndex, setDownloadIndex] = useState(0)
  const [carouselPaused, setCarouselPaused] = useState(false)

  useEffect(() => {
    const loadCarousels = async () => {
      try {
        const allCarousels = await carouselService.getCarousels()
        const targetCarousel = allCarousels.find((carousel) => carousel.nombre?.trim().toLowerCase() === "general")

        const [detailed, downloadsDetailed] = await Promise.all([
          targetCarousel ? carouselService.getCarouselById(targetCarousel.id) : Promise.resolve(null),
          (() => {
            const explicitDownloads = allCarousels.find((carousel) => carousel.nombre?.trim().toLowerCase() === "general")
            if (!explicitDownloads) return Promise.resolve(null)
            return carouselService.getCarouselById(explicitDownloads.id)
          })(),
        ])

        setDownloadsCarousel((downloadsDetailed?.flyers || detailed?.flyers || []).length > 0 ? (downloadsDetailed ?? detailed) : null)
      } catch {
        setDownloadsCarousel(null)
      }
    }

    void loadCarousels()
  }, [])

  const downloadSlides: DownloadSlide[] = [
    PRICE_LIST_SLIDE,
    ...((downloadsCarousel?.flyers ?? []).map((flyer) => ({
      id: `flyer-${flyer.id}`,
      title: flyer.titulo || "Flyer",
      image: flyer.url,
      type: "flyer" as const,
      flyer,
    })) as DownloadSlide[]),
  ]

  useEffect(() => {
    if (downloadSlides.length <= 1 || carouselPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const timer = window.setInterval(() => {
      setDownloadIndex((prev) => (prev + 1) % downloadSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [downloadSlides.length, carouselPaused])

  useEffect(() => {
    setDownloadIndex(0)
  }, [downloadsCarousel?.id, downloadSlides.length])

  const handleTileNavigate = (action: "promotions" | "afp" | "all") => {
    onCatalogPresetNavigate(action)
  }

  const handleDownloadSlide = async (slide: DownloadSlide) => {
    if (slide.type === "price-list") {
      try {
        await carouselService.downloadPriceListExcel()
      } catch {
        // noop
      }
      return
    }

    const flyer = slide.flyer
    if (!flyer.archivoNombreOriginal && !flyer.archivoRuta) {
      return
    }

    try {
      await carouselService.downloadFlyerFile(flyer)
    } catch {
      // noop
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="home-layout flex-1 pb-8">
        {downloadSlides.length > 0 && (
          <section className="home-carousel-bleed">
              <div className="home-carousel relative w-full overflow-hidden bg-secondary">
                <div
                  className="absolute inset-0 flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{ transform: `translateX(-${downloadIndex * 100}%)` }}
                >
                  {downloadSlides.map((slide) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => void handleDownloadSlide(slide)}
                      className={`relative min-w-full ${slide.type === "price-list" || slide.flyer.archivoNombreOriginal || slide.flyer.archivoRuta ? "cursor-pointer" : "cursor-default"}`}
                      aria-label={slide.type === "price-list" ? "Descargar lista de precios" : slide.flyer.archivoNombreOriginal || slide.flyer.archivoRuta ? `Descargar archivo de ${slide.title}` : slide.title}
                    >
                      <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/15" />
                    </button>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6 lg:p-8">
                  <div className="hidden rounded-full bg-black/35 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md sm:block">Novedades AFP Pinturas</div>
                  <button type="button" onClick={() => onCatalogPresetNavigate("all")} className="pointer-events-auto ml-auto inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5">
                    Ver catálogo <ArrowRight className="size-4" />
                  </button>
                </div>
                {downloadSlides.length > 1 && (
                  <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center sm:left-5">
                    <button type="button" onClick={() => setDownloadIndex((index) => (index - 1 + downloadSlides.length) % downloadSlides.length)} className="flex size-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45" aria-label="Flyer anterior"><ArrowLeft className="size-5" /></button>
                  </div>
                )}
                {downloadSlides.length > 1 && (
                  <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center sm:right-5">
                    <button type="button" onClick={() => setDownloadIndex((index) => (index + 1) % downloadSlides.length)} className="flex size-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/45" aria-label="Siguiente flyer"><ArrowRight className="size-5" /></button>
                  </div>
                )}
                {downloadSlides.length > 1 && (
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5 sm:bottom-3">
                    {downloadSlides.map((slide, idx) => (
                      <button
                        key={`dot-${slide.id}`}
                        type="button"
                        aria-label={`Ver flyer ${idx + 1}`}
                        onClick={() => setDownloadIndex(idx)}
                        aria-pressed={idx === downloadIndex}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm"
                      ><span className={`h-2 rounded-full ${idx === downloadIndex ? "w-6 bg-white" : "w-2 bg-white/65"}`} /></button>
                    ))}
                    <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm" onClick={() => setCarouselPaused((paused) => !paused)} aria-label={carouselPaused ? "Reanudar carrusel" : "Pausar carrusel"}>{carouselPaused ? <Play className="size-4" /> : <Pause className="size-4" />}</button>
                  </div>
                )}
              </div>
          </section>
        )}

        <section className="mx-auto mt-4 w-full max-w-5xl px-4 sm:mt-6 lg:px-0">
          <div className="home-entry-points grid overflow-hidden rounded-[1.6rem] md:grid-cols-3">
            <button
              type="button"
              onClick={() => onCatalogPresetNavigate("all")}
              className="group flex min-h-20 items-center justify-between px-5 py-4 text-left transition-colors hover:bg-primary/15 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Hacer pedido</p>
                  <p className="text-xs text-muted-foreground">Catálogo general</p>
                </div>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => onCatalogPresetNavigate("promotions")}
              className="group flex min-h-20 items-center justify-between px-5 py-4 text-left transition-colors hover:bg-primary/15 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
                  <Tags className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Promociones</p>
                  <p className="text-xs text-muted-foreground">Ofertas y combos</p>
                </div>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => onCatalogPresetNavigate("afp")}
              className="group flex min-h-20 items-center justify-between px-5 py-4 text-left transition-colors hover:bg-primary/15 active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">Línea AFP</p>
                  <p className="text-xs text-muted-foreground">Productos seleccionados</p>
                </div>
              </div>
              <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          </div>
        </section>

        <section className="mx-auto mt-8 w-full max-w-5xl px-4 lg:px-0">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Comprar por categoría</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">Explorá las líneas</h2>
            </div>
            <button type="button" onClick={() => onCatalogPresetNavigate("all")} className="hidden items-center gap-1 rounded-full border bg-card px-4 py-2 text-xs font-bold shadow-sm transition-colors hover:bg-muted sm:inline-flex">Ver catálogo <ArrowRight className="size-3.5" /></button>
          </div>

          <div className="home-line-grid grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-5">
            {NOVEDADES_TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileNavigate(tile.action)}
                className="home-line-card commerce-card group relative aspect-[16/9] overflow-hidden rounded-[1.4rem] text-left transition-all hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] sm:aspect-square"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[1.3rem] bg-muted leading-none">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-[-1px] block h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <p className="text-base font-black text-white drop-shadow">{tile.title}</p>
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight className="size-4" /></span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
