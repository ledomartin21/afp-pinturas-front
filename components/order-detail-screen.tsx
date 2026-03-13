"use client"

import { ArrowLeft, Banknote, CreditCard, Store, Truck, CheckCircle, Clock, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Order } from "@/app/page"

type StepStatus = "pending" | "processing" | "shipped" | "delivered"

const STATUS_META = {
  pending: { label: "Pendiente", icon: Clock, color: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200" },
  processing: { label: "Procesando", icon: Package, color: "text-blue-700", bg: "bg-blue-100", border: "border-blue-200" },
  shipped: { label: "En camino", icon: Truck, color: "text-purple-700", bg: "bg-purple-100", border: "border-purple-200" },
  delivered: { label: "Entregado", icon: CheckCircle, color: "text-green-700", bg: "bg-green-100", border: "border-green-200" },
}

const STATUS_STEPS: StepStatus[] = ["pending", "processing", "shipped", "delivered"]

interface OrderDetailScreenProps {
  order: Order | null
  onBack: () => void
}

function paymentLabel(paymentMethod?: Order["paymentMethod"]) {
  if (paymentMethod === "transfer") return "Transferencia"
  if (paymentMethod === "cash") return "Efectivo"
  if (paymentMethod === "card") return "Tarjeta"
  return "Sin definir"
}

function paymentIcon(paymentMethod?: Order["paymentMethod"]) {
  if (paymentMethod === "card") return CreditCard
  return Banknote
}

function deliveryLabel(deliveryMethod?: Order["deliveryMethod"]) {
  if (deliveryMethod === "pickup") return "Retiro en sucursal"
  if (deliveryMethod === "delivery") return "Envio a domicilio"
  return "Sin definir"
}

export function OrderDetailScreen({ order, onBack }: OrderDetailScreenProps) {
  if (!order) {
    return (
      <div className="flex h-full flex-col">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="h-1 bg-accent" />
          <div className="p-3 flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">Detalle del pedido</h1>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">No se encontro el pedido seleccionado</div>
      </div>
    )
  }

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const statusMeta = STATUS_META[order.status]
  const StatusIcon = statusMeta.icon
  const PaymentIcon = paymentIcon(order.paymentMethod)

  return (
    <div className="flex h-full flex-col">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="p-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Detalle del pedido</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto space-y-4 p-4">
        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Pedido</p>
                <p className="text-sm font-bold break-all">{order.id}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(order.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <Badge className={`${statusMeta.bg} ${statusMeta.color} border ${statusMeta.border} text-xs px-2 py-1`}>
                <StatusIcon className="w-3.5 h-3.5 mr-1" />
                {statusMeta.label}
              </Badge>
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-3">Seguimiento</p>
              <div className="space-y-2">
                {STATUS_STEPS.map((step, idx) => {
                  const done = idx <= currentStep
                  const meta = STATUS_META[step]
                  const Icon = meta.icon
                  return (
                    <div key={step} className="flex items-center gap-2.5">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                          done ? `${meta.bg} ${meta.border}` : "bg-muted border-border"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${done ? meta.color : "text-muted-foreground"}`} />
                      </div>
                      <p className={`text-sm ${done ? "font-semibold" : "text-muted-foreground"}`}>{meta.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-base">Entrega y pago</h2>
            <div className="flex items-center gap-2 text-sm">
              {order.deliveryMethod === "delivery" ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              <span>{deliveryLabel(order.deliveryMethod)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PaymentIcon className="w-4 h-4" />
              <span>{paymentLabel(order.paymentMethod)}</span>
            </div>
            {order.address && (
              <div className="rounded-lg bg-muted/40 p-3 text-sm">
                <p className="font-medium">Direccion</p>
                <p className="text-muted-foreground">
                  {order.address.calle}, {order.address.ciudad} ({order.address.codigoPostal})
                </p>
                {order.address.provincia && <p className="text-muted-foreground">{order.address.provincia}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-base">Productos</h2>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.id}`} className="flex items-center gap-3 rounded-lg bg-muted/30 p-2">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-12 w-12 rounded-md object-cover bg-muted" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Cant: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold">${(item.price * item.quantity).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold">${order.total.toLocaleString("es-AR")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
