"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Menu, Search, ShoppingCart, UserRound, LogOut, ArrowRight, BadgePercent, Truck, ShieldCheck, Home, Store, ClipboardList, ReceiptText, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { APP_CONSTANTS } from "@/lib/config/constants"

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/catalogo", label: "Catálogo", icon: Store },
  { href: "/promociones", label: "Promociones", icon: Sparkles },
  { href: "/mi-cuenta/pedidos", label: "Mis pedidos", icon: ClipboardList },
  { href: "/mi-cuenta/cuenta-corriente", label: "Cuenta corriente", icon: ReceiptText },
]

export function StoreHeader({ isLoggedIn, cartCount, onLogout }: {
  isLoggedIn: boolean
  cartCount: number
  onLogout: () => Promise<void>
}) {
  const pathname = usePathname()
  const router = useRouter()
  const params = useSearchParams()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState(params.get("buscar") || "")
  const [loggingOut, setLoggingOut] = useState(false)
  useEffect(() => { setMenuOpen(false); setSearch(params.get("buscar") || "") }, [pathname, params])

  const navigation = (mobile = false) => links.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} onClick={() => setMenuOpen(false)}
      aria-current={pathname === href ? "page" : undefined}
      className={`${mobile ? "flex min-h-12 items-center gap-3 rounded-xl px-3" : "inline-flex min-h-11 items-center gap-2 rounded-lg border px-4"} text-sm font-bold transition-colors ${pathname === href ? "border-primary bg-primary text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      <Icon className="size-4" />
      {label}
    </Link>
  ))

  return (
    <>
      <a href="#contenido" className="store-skip-link">Saltar al contenido</a>
      <header className="store-header sticky top-0 z-40 border-b border-border/70 bg-card/92 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl supports-[backdrop-filter]:bg-card/86">
        <div className="bg-[linear-gradient(90deg,var(--foreground),color-mix(in_oklch,var(--foreground)_86%,var(--primary)))] text-background">
          <div className="store-container flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-2 text-center text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5"><Truck className="size-3.5" /> Envíos y retiro en local</span>
            <span className="hidden sm:inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Compra mayorista segura</span>
            <span className="hidden md:inline-flex items-center gap-1.5"><BadgePercent className="size-3.5" /> Promos para clientes AFP</span>
          </div>
        </div>
        <div className="store-container flex flex-wrap items-center gap-3 py-3 lg:gap-6 lg:py-4">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild><button className="store-icon-button rounded-2xl border bg-background shadow-sm lg:hidden" aria-label="Abrir menú"><Menu className="size-5" /></button></SheetTrigger>
            <SheetContent side="left" className="w-[min(85vw,22rem)] overflow-y-auto bg-background p-0">
              <div className="bg-primary px-5 py-5 text-foreground">
                <SheetHeader className="text-left"><SheetTitle className="text-foreground">AFP Pinturas</SheetTitle><SheetDescription className="text-foreground/75">Explorá la tienda y accedé a tu cuenta.</SheetDescription></SheetHeader>
              </div>
              <nav aria-label="Navegación móvil" className="space-y-2 p-4">{navigation(true)}
                <Link className="flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm font-bold hover:bg-muted" href={isLoggedIn ? "/mi-cuenta/perfil" : "/login"}><UserRound className="size-4" />{isLoggedIn ? "Mi perfil" : "Ingresar"}</Link>
              </nav>
            </SheetContent>
          </Sheet>
          <Link href="/" aria-label="AFP Pinturas, inicio" className="flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2 shadow-sm ring-1 ring-primary/25 transition-transform hover:-translate-y-0.5">
            <img src="/images/logo.png" alt="AFP Pinturas" className="h-9 w-auto object-contain lg:h-12" />
            <span className="hidden text-base font-bold leading-tight lg:block">AFP<br />Pinturas</span>
          </Link>
          <form action="/catalogo" role="search" onSubmit={(event) => { event.preventDefault(); router.push(`/catalogo?buscar=${encodeURIComponent(search.trim())}`) }} className={`order-last ${pathname === "/catalogo" || pathname === "/promociones" ? "hidden lg:flex" : "flex"} w-full items-center rounded-xl border border-primary/30 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_22px_rgba(15,23,42,0.06)] focus-within:ring-2 focus-within:ring-ring lg:order-none lg:w-auto lg:flex-1`}>
            <label htmlFor="store-search" className="sr-only">Buscar por producto, marca o código</label>
            <Search className="ml-4 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input id="store-search" name="buscar" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar código, marca o producto" className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base font-medium outline-none placeholder:text-muted-foreground" />
            <button type="submit" aria-label="Buscar productos" className="store-icon-button mr-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"><ArrowRight className="size-5" /></button>
          </form>
          <div className="ml-auto flex items-center gap-2 lg:gap-4">
            <Link href={isLoggedIn ? "/mi-cuenta/perfil" : "/login"} className="store-icon-button gap-2 rounded-lg px-2 text-sm font-bold hover:bg-muted" aria-label={isLoggedIn ? "Mi perfil" : "Ingresar"}>
              <UserRound className="size-5" /><span className="hidden sm:inline">{isLoggedIn ? "Mi perfil" : "Ingresar"}</span>
            </Link>
            <Link href="/carrito" className="store-icon-button relative gap-2 rounded-lg bg-primary px-3 text-sm font-black shadow-sm ring-1 ring-primary/25 hover:bg-primary/85" aria-label={`Carrito, ${cartCount} unidades`}>
              <ShoppingCart className="size-5" /><span className="hidden xl:inline">Mi carrito</span>
              <span className="flex min-w-6 items-center justify-center rounded-full bg-card px-1.5 text-xs font-bold text-foreground">{cartCount > 99 ? "99+" : cartCount}</span>
            </Link>
          </div>
        </div>
        <div className="hidden border-t border-border/70 bg-background/70 lg:block"><nav aria-label="Navegación principal" className="store-container flex items-center gap-2 py-2">
          {navigation()}
          {isLoggedIn && <button disabled={loggingOut} onClick={async () => { setLoggingOut(true); try { await onLogout() } finally { setLoggingOut(false) } }} className="ml-auto flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"><LogOut className="size-4" />{loggingOut ? "Saliendo…" : "Salir"}</button>}
        </nav></div>
      </header>
    </>
  )
}

export function StoreFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="store-container grid gap-6 py-8 pb-24 text-sm md:grid-cols-3 md:pb-10">
        <div><p className="text-lg font-bold">AFP Pinturas</p><p className="mt-2 max-w-xs text-muted-foreground">Encontrá los productos para tu próximo proyecto y armá tu pedido online.</p></div>
        <nav aria-label="Enlaces del pie" className="flex flex-col items-start gap-1"><Link className="inline-flex min-h-11 items-center hover:underline" href="/catalogo">Ver catálogo</Link><Link className="inline-flex min-h-11 items-center hover:underline" href="/mi-cuenta/pedidos">Consultar mis pedidos</Link></nav>
        <div><p className="font-semibold">¿Necesitás asesoramiento?</p><a className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4" href={`https://wa.me/${APP_CONSTANTS.WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">Consultanos por WhatsApp</a></div>
      </div>
    </footer>
  )
}
