"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Home, Grid2X2, ClipboardList, User, LogOut, ChevronDown, ChevronRight } from "lucide-react"
import type { Screen } from "@/app/page"
import { productsService } from "@/lib/api"

interface SidebarMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: (screen: Screen) => void
  onCategoryNavigate?: (category: string) => void
  onLogout: () => void
}

const SIDEBAR_VISIBLE_CATEGORIES = 3

export function SidebarMenu({ open, onOpenChange, onNavigate, onCategoryNavigate, onLogout }: SidebarMenuProps) {
  const [catalogExpanded, setCatalogExpanded] = useState(false)
  const [showAllSubCategories, setShowAllSubCategories] = useState(false)
  const [subCategories, setSubCategories] = useState<string[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catalogs = await productsService.getCatalogs()
        setSubCategories(Array.from(catalogs.rubroMap.values()))
      } catch {
        setSubCategories([])
      }
    }
    loadCategories()
  }, [])

  const handleNavigate = (screen: Screen) => {
    onOpenChange(false)
    onNavigate(screen)
  }

  const handleLogout = () => {
    onOpenChange(false)
    onLogout()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-4/5 max-w-[300px] p-0 flex flex-col [&>button]:hidden">
        {/* Header dorado */}
        <header className="bg-primary p-6 pt-10 flex items-center gap-4">
          <img
            src="/images/logo.png"
            alt="AFP Pinturas"
            className="h-14 w-auto object-contain drop-shadow-md"
          />
          <div>
            <h2 className="font-bold text-xl leading-tight text-white">AFP Pinturas</h2>
            <p className="text-xs text-white/90 font-medium">Menu de Navegación</p>
          </div>
        </header>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1 overflow-auto">
          {/* Inicio */}
          <button
            onClick={() => handleNavigate("home")}
            className="flex items-center gap-4 p-3 transition-colors hover:bg-primary/10 rounded-lg"
          >
            <Home className="w-5 h-5 text-foreground" />
            <span className="font-bold text-sm text-foreground">Inicio</span>
          </button>

          {/* Catálogo (expandible) */}
          <div className="flex flex-col">
            <button
              onClick={() => setCatalogExpanded(!catalogExpanded)}
              className="flex items-center justify-between w-full p-3 transition-colors hover:bg-primary/10 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Grid2X2 className="w-5 h-5 text-foreground" />
                <span className="font-bold text-sm text-foreground">Catálogo</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-foreground/40 transition-transform ${catalogExpanded ? "rotate-180" : ""}`}
              />
            </button>
            {catalogExpanded && (
              <div className="pl-12 flex flex-col gap-1 pb-2">
                {(showAllSubCategories ? subCategories : subCategories.slice(0, SIDEBAR_VISIBLE_CATEGORIES)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      onOpenChange(false)
                      onCategoryNavigate?.(cat)
                    }}
                    className="text-sm py-2 font-medium text-foreground/70 hover:text-foreground text-left transition-colors"
                  >
                    {cat}
                  </button>
                ))}
                {subCategories.length > SIDEBAR_VISIBLE_CATEGORIES && (
                  <button
                    onClick={() => setShowAllSubCategories(!showAllSubCategories)}
                    className="flex items-center gap-1 text-xs py-2 font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    {showAllSubCategories ? "Mostrar menos" : `Mostrar más (${subCategories.length - SIDEBAR_VISIBLE_CATEGORIES})`}
                    <ChevronRight className={`w-3 h-3 transition-transform ${showAllSubCategories ? "rotate-90" : ""}`} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Mis Pedidos */}
          <button
            onClick={() => handleNavigate("orders")}
            className="flex items-center gap-4 p-3 transition-colors hover:bg-primary/10 rounded-lg"
          >
            <ClipboardList className="w-5 h-5 text-foreground" />
            <span className="font-bold text-sm text-foreground">Mis Pedidos</span>
          </button>

          {/* Mi Perfil */}
          <button
            onClick={() => handleNavigate("profile")}
            className="flex items-center gap-4 p-3 transition-colors hover:bg-primary/10 rounded-lg"
          >
            <User className="w-5 h-5 text-foreground" />
            <span className="font-bold text-sm text-foreground">Mi Perfil</span>
          </button>

          {/* Separator */}
          <div className="my-4 border-t border-border" />

          {/* Cerrar Sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-bold text-sm">Cerrar Sesión</span>
          </button>
        </nav>

        {/* Footer */}
        <footer className="p-6 mt-auto border-t border-border">
          <p className="text-[10px] font-bold text-destructive tracking-wider uppercase mb-4">Síguenos</p>
          <div className="flex gap-4">
            {/* Facebook */}
            <a
              href="#"
              aria-label="Facebook"
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-foreground hover:bg-muted/80 transition-all"
            >
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
            {/* Instagram */}
            <a
              href="#"
              aria-label="Instagram"
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-foreground hover:bg-muted/80 transition-all"
            >
              <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
          </div>
          <p className="text-[10px] mt-6 text-muted-foreground font-medium">© 2026 AFP Pinturas S.L.</p>
        </footer>
      </SheetContent>
    </Sheet>
  )
}
