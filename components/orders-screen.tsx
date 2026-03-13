"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Truck, CheckCircle, Loader2, ChevronRight } from "lucide-react"
import type { Order } from "@/app/page"
import Image from "next/image"
import { ordersService } from "@/lib/api"

const STATUS_CONFIG = {
  pending: { label: "Pendiente", icon: Clock, bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  processing: { label: "Procesando", icon: Package, bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  shipped: { label: "En Camino", icon: Truck, bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  delivered: { label: "Entregado", icon: CheckCircle, bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
}

interface OrdersScreenProps {
  onOrderClick: (order: Order) => void
}

export function OrdersScreen({ onOrderClick }: OrdersScreenProps) {
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

  const processingCount = orders.filter((o) => o.status === "processing").length
  const shippedCount = orders.filter((o) => o.status === "shipped").length
  const deliveredCount = orders.filter((o) => o.status === "delivered").length

  if (isLoading) {
    return (
      <div className="space-y-0">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="h-1 bg-accent" />
          <div className="px-4 py-4 flex items-center gap-3">
            <Image src="/images/logo-afp.png" alt="AFP Pinturas" width={36} height={36} className="rounded" />
            <div>
              <h1 className="text-lg font-bold">Mis Pedidos</h1>
              <p className="text-xs text-muted-foreground">Segui el estado de tus compras</p>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-180px)]">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando pedidos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="px-4 py-4 flex items-center gap-3">
          <Image src="/images/logo-afp.png" alt="AFP Pinturas" width={36} height={36} className="rounded" />
          <div>
            <h1 className="text-lg font-bold">Mis Pedidos</h1>
            <p className="text-xs text-muted-foreground">Segui el estado de tus compras</p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 p-4 bg-muted/40">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
          <p className="text-xl font-bold text-blue-700">{processingCount}</p>
          <p className="text-[10px] text-blue-600 font-medium">En proceso</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
          <p className="text-xl font-bold text-purple-700">{shippedCount}</p>
          <p className="text-[10px] text-purple-600 font-medium">En camino</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <p className="text-xl font-bold text-green-700">{deliveredCount}</p>
          <p className="text-[10px] text-green-600 font-medium">Entregados</p>
        </div>
      </div>

      {/* Orders */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {orders.map((order) => {
          const status = STATUS_CONFIG[order.status]
          const StatusIcon = status.icon
          const isExpanded = expanded === order.id

          return (
            <Card
              key={order.id}
              className={`overflow-hidden border transition-all cursor-pointer ${isExpanded ? "shadow-md" : "hover:shadow-sm"}`}
              onClick={() => setExpanded(isExpanded ? null : order.id)}
            >
              <CardContent className="p-0">
                {/* Top colored bar */}
                <div className={`h-1 ${status.bg.replace("100", "400").replace("bg-", "bg-")}`}
                  style={{
                    background: order.status === "pending" ? "#f59e0b" :
                                order.status === "processing" ? "#3b82f6" :
                                order.status === "shipped" ? "#8b5cf6" : "#22c55e"
                  }}
                />

                {/* Main row */}
                <div className="p-3 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">{order.id}</p>
                      <Badge className={`${status.bg} ${status.text} border ${status.border} text-[10px] px-1.5 py-0`}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                      {" - "}{order.items.length} {order.items.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm">${order.total.toLocaleString("es-AR")}</p>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                  </div>
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
          <div className="py-12 text-center text-sm text-muted-foreground">Todavia no tenes pedidos</div>
        )}
      </div>
    </div>
  )
}
