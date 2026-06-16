"use client"

import { useEffect, useState } from "react"
import { ClipboardList, Menu, ReceiptText, Search, ShoppingBag, ShoppingCart } from "lucide-react"
import type { Screen } from "@/app/page"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { carouselService, userService } from "@/lib/api"
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
}

export function HomeScreen({ onNavigate, onSearchNavigate, onCatalogPresetNavigate, onOpenMenu, cartCount }: HomeScreenProps) {
  const [greetingName, setGreetingName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [downloadsCarousel, setDownloadsCarousel] = useState<Carrusel | null>(null)
  const [downloadIndex, setDownloadIndex] = useState(0)

  useEffect(() => {
    const loadHeaderData = async () => {
      try {
        const profile = await userService.getProfile().catch(() => null)

        const sourceName = profile?.razonSocial?.trim() || profile?.nombreUsuario?.trim() || ""
        setGreetingName(sourceName.split(" ").slice(0, 2).join(" "))
      } catch {
        setGreetingName("")
      }
    }

    void loadHeaderData()
  }, [])

  useEffect(() => {
    const loadCarousels = async () => {
      try {
        const allCarousels = await carouselService.getCarousels()
        const targetCarousel = allCarousels.find((carousel) => carousel.id === 1)

        const [detailed, downloadsDetailed] = await Promise.all([
          targetCarousel ? carouselService.getCarouselById(targetCarousel.id) : Promise.resolve(null),
          (() => {
            const explicitDownloads = allCarousels.find((carousel) => carousel.id === 1)
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
    if (downloadSlides.length <= 1) return

    const timer = window.setInterval(() => {
      setDownloadIndex((prev) => (prev + 1) % downloadSlides.length)
    }, 4500)

    return () => window.clearInterval(timer)
  }, [downloadSlides.length])

  useEffect(() => {
    setDownloadIndex(0)
  }, [downloadsCarousel?.id, downloadSlides.length])

  const handleTileNavigate = (action: "promotions" | "afp" | "all") => {
    onCatalogPresetNavigate(action)
  }

  const handleSearchSubmit = () => {
    onSearchNavigate(searchTerm.trim())
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
      <div className="flex-1 overflow-auto pb-5">
        <section className="rounded-b-[1.8rem] bg-primary px-4 pb-6 pt-5 text-primary-foreground shadow-lg">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenMenu}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>

            <img src="/images/logo.png" alt="AFP Pinturas" className="h-11 w-auto object-contain drop-shadow-md" />

            <button
              onClick={() => onNavigate("cart")}
              className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm"
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-5 space-y-1.5">
            <p className="text-[1.75rem] font-bold leading-none tracking-tight">
              Hola{greetingName ? ` ${greetingName.toUpperCase()}` : ""},
            </p>
            <p className="max-w-[18rem] text-sm text-primary-foreground/85">¿En qué podemos ayudarte hoy?</p>
          </div>

          <div className="mt-5 rounded-[1.75rem] bg-white/14 p-1 shadow-[0_14px_28px_rgba(0,0,0,0.16)] backdrop-blur">
            <div className="relative flex items-center gap-2 rounded-[1.4rem] bg-white px-3 py-1.5">
              <Search className="h-4.5 w-4.5 text-primary/70" />
              <Input
                placeholder="Buscar producto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSearchSubmit()
                  }
                }}
                className="h-11 border-none bg-transparent px-0 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="rounded-2xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm"
              >
                Buscar
              </button>
            </div>
          </div>
        </section>

        <section className="-mt-2 px-4">
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => onCatalogPresetNavigate("all")}
              className="group flex items-center justify-between rounded-2xl border border-primary/20 bg-card px-4 py-3.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-all hover:border-primary/30 hover:shadow-[0_12px_24px_rgba(15,23,42,0.1)] active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Hacer pedido</p>
                  <p className="text-[11px] text-muted-foreground">Entrá al catálogo general.</p>
                </div>
              </div>
              <span className="rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                Ir ahora
              </span>
            </button>
          </div>
        </section>

        {downloadSlides.length > 0 && (
          <section className="mt-5 px-4">
            <div className="relative w-full overflow-hidden rounded-[1.35rem] bg-muted shadow-[0_12px_26px_rgba(15,23,42,0.12)] aspect-[16/7]">
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
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                  </button>
                ))}
              </div>
            </div>
            {downloadSlides.length > 1 && (
              <div className="mt-2.5 flex items-center justify-center gap-1.5">
                {downloadSlides.map((slide, idx) => (
                  <button
                    key={`dot-${slide.id}`}
                    type="button"
                    aria-label={`Ver flyer ${idx + 1}`}
                    onClick={() => setDownloadIndex(idx)}
                    className={`h-2.5 rounded-full transition-all ${idx === downloadIndex ? "w-6 bg-primary" : "w-2.5 bg-primary/35"}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="mt-5 px-4">
          <div className="mb-2.5">
            <p className="text-base font-bold uppercase tracking-wide text-primary">Novedades</p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {NOVEDADES_TILES.map((tile) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => handleTileNavigate(tile.action)}
                className="relative aspect-square overflow-hidden rounded-[1.3rem] bg-card text-left shadow-[0_10px_22px_rgba(15,23,42,0.06)] transition-transform active:scale-[0.98]"
              >
                <div className="absolute inset-0 overflow-hidden rounded-[1.3rem] bg-muted leading-none">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="absolute inset-[-1px] block h-[calc(100%+2px)] w-[calc(100%+2px)] object-cover"
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 px-4">
          <Card className="rounded-[1.7rem] border-none bg-card shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
            <CardContent className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => onNavigate("orders")}
                className="flex w-full items-center gap-3 rounded-[1.3rem] border border-border/70 bg-[linear-gradient(135deg,white_0%,hsl(var(--accent)/0.35)_100%)] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">Mis actividades</p>
                  <p className="mt-1 text-base font-bold text-foreground">Mis pedidos</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Consultá estados, detalle y seguimiento de compras.</p>
                </div>
                <div className="rounded-full border border-primary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Ver
                </div>
              </button>
              <button
                type="button"
                onClick={() => onNavigate("account")}
                className="flex w-full items-center gap-3 rounded-[1.3rem] border border-border/70 bg-[linear-gradient(135deg,white_0%,hsl(var(--accent)/0.28)_100%)] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/75">Cuenta corriente</p>
                  <p className="mt-1 text-base font-bold text-foreground">Mi cuenta</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Revisá comprobantes y saldos pendientes.</p>
                </div>
                <div className="rounded-full border border-primary/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-primary">
                  Ver
                </div>
              </button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}
