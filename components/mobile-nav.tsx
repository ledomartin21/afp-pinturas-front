"use client"

import { Home, ShoppingCart, Package, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Screen } from "@/app/page"

interface MobileNavProps {
  currentScreen: Screen
  onNavigate: (screen: Screen) => void
  cartCount: number
}

export function MobileNav({ currentScreen, onNavigate, cartCount }: MobileNavProps) {
  const navItems = [
    { screen: "catalog" as Screen, icon: Home, label: "Inicio" },
    { screen: "cart" as Screen, icon: ShoppingCart, label: "Carrito", badge: cartCount },
    { screen: "orders" as Screen, icon: Package, label: "Pedidos" },
    { screen: "profile" as Screen, icon: User, label: "Perfil" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-40">
      <div className="h-0.5 bg-accent" />
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentScreen === item.screen
            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-3 h-4 min-w-4 px-1 flex items-center justify-center bg-accent text-accent-foreground text-[10px] font-bold">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-accent rounded-b-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
