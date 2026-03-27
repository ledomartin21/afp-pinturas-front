"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Truck, CheckCircle, Loader2, ChevronRight, Menu, ShoppingCart } from "lucide-react"
import type { Order, Screen } from "@/app/page"
import { ordersService } from "@/lib/api"

const STATUS_CONFIG = {
  pending: { label: "Pendiente", icon: Clock, bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  processing: { label: "Procesando", icon: Package, bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  shipped: { label: "En Camino", icon: Truck, bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  delivered: { label: "Entregado", icon: CheckCircle, bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
}

interface OrdersScreenProps {
  onOrderClick: (order: Order) => void
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cartCount: number
}

export function OrdersScreen({ onOrderClick, onNavigate, onOpenMenu, cartCount }: OrdersScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoading(true)
        const result = await ordersService.getOrders()
        setOrders(result)
        setErrorMessage("")
      } catch {
        setErrorMessage("No se pudieron cargar los pedidos")
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  const header = (
    <div className="bg-primary px-4 pt-6 pb-8 rounded-b-xl shadow-lg">
      <div className="flex items-center justify-between mb-5">
        <button onClick={onOpenMenu} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
          <Menu className="w-5 h-5 text-white" />
        </button>
        <img src="/images/logo.png" alt="AFP Pinturas" className="h-12 w-auto object-contain drop-shadow-md" />
        <button onClick={() => onNavigate("cart")} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative">
          <ShoppingCart className="w-5 h-5 text-white" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>
      <h1 className="text-xl font-bold text-white text-center">Mis Pedidos</h1>
      <p className="text-sm text-white/80 text-center">Seguí el estado de tus compras</p>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        {header}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {header}

      <div className="flex-1 overflow-auto px-4 pb-6">
        {/* Orders */}
        <div className="mt-4 space-y-3">
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {orders.map((order) => {
            const status = STATUS_CONFIG[order.status]
            const StatusIcon = status.icon
            const isExpanded = expanded === order.id

            return (
              <Card
                key={order.id}
                className={`overflow-hidden border-0 shadow-sm transition-all cursor-pointer ${isExpanded ? "shadow-md" : "hover:shadow-sm"}`}
                onClick={() => setExpanded(isExpanded ? null : order.id)}
              >
                <CardContent className="p-0">
                  {/* Main row */}
                  <div className="p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center shrink-0`}>
                      <StatusIcon className={`w-5 h-5 ${status.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm truncate">Pedido #{order.id}</p>
                        <Badge className={`${status.bg} ${status.text} border ${status.border} text-[10px] px-1.5 py-0 shrink-0`}>
                          {status.label}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                          {" · "}{order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                        </p>
                        <p className="font-bold text-sm shrink-0">${order.total.toLocaleString("es-AR")}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>

                  {/* Expanded items */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 p-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-3 bg-card rounded-lg p-2">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-xs truncate">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">Cant: {item.quantity}</p>
                          </div>
                          <p className="text-xs font-bold whitespace-nowrap self-center">
                            ${(item.price * item.quantity).toLocaleString("es-AR")}
                          </p>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total del pedido</span>
                        <span className="text-base font-bold">${order.total.toLocaleString("es-AR")}</span>
                      </div>
                      <button
                        type="button"
                        className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          onOrderClick(order)
                        }}
                      >
                        Ver detalle
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {!isLoading && !errorMessage && orders.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Todavía no tenés pedidos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
