"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, MapPin, Truck, Store, Banknote } from "lucide-react"
import type { CartItem } from "@/app/page"
import type { CreatePedidoPayload } from "@/lib/api/orders.service"

interface CheckoutScreenProps {
  items: CartItem[]
  onConfirm: (payload: CreatePedidoPayload) => Promise<void> | void
  onTransferPayment: (payload: CreatePedidoPayload) => Promise<void> | void
  onBack: () => void
}

export function CheckoutScreen({ items, onConfirm, onTransferPayment, onBack }: CheckoutScreenProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery")
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">("transfer")
  const [address, setAddress] = useState("Av. Corrientes 1234, CABA")
  const [city, setCity] = useState("CABA")
  const [postalCode, setPostalCode] = useState("1000")
  const [province, setProvince] = useState("Buenos Aires")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const subtotal = items.reduce((sum, item) => {
    const price = item.price * (1 - (item.discount || 0) / 100)
    return sum + price * item.quantity
  }, 0)
  const deliveryFee = deliveryMethod === "delivery" ? 2500 : 0
  const total = subtotal + deliveryFee

  const buildPayload = (): CreatePedidoPayload => {
    const grossSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const discountTotal = items.reduce(
      (sum, item) => sum + (item.price * item.quantity * (item.discount || 0)) / 100,
      0,
    )

    const payload: CreatePedidoPayload = {
      metodoEntrega: deliveryMethod,
      metodoPago: paymentMethod,
      subtotal,
      descuentoTotal: discountTotal,
      costoEnvio: deliveryFee,
      total,
      detalles: items.map((item) => ({
        productoId: item.id,
        cantidad: item.quantity,
        descuentoPorcentaje: item.discount || 0,
      })),
    }

    if (deliveryMethod === "delivery") {
      payload.direccionEntrega = {
        calle: address,
        ciudad: city,
        codigoPostal: postalCode,
        provincia: province,
      }
    }

    if (grossSubtotal > subtotal) {
      payload.descuentoTotal = discountTotal
    }

    return payload
  }

  const handleConfirm = async () => {
    try {
      setErrorMessage("")
      setIsSubmitting(true)

      const payload = buildPayload()
      if (paymentMethod === "transfer") {
        await onTransferPayment(payload)
      } else {
        await onConfirm(payload)
      }
    } catch {
      setErrorMessage("No se pudo crear el pedido. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="p-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Checkout</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Metodo de entrega */}
        <Card className="border-2">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Metodo de Entrega</h2>
            <RadioGroup
              value={deliveryMethod}
              onValueChange={(value) => setDeliveryMethod(value as "delivery" | "pickup")}
            >
              <label
                htmlFor="delivery"
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  deliveryMethod === "delivery" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="w-5 h-5 text-accent-foreground" />
                    <span className="font-semibold">Envio a Domicilio</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{"Recibilo en 2-3 dias habiles"}</p>
                  <p className="text-sm font-semibold mt-1">$2.500</p>
                </div>
              </label>

              <label
                htmlFor="pickup"
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  deliveryMethod === "pickup" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-5 h-5 text-accent-foreground" />
                    <span className="font-semibold">Retiro en Sucursal</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{"Retira en 24hs en nuestra sucursal"}</p>
                  <p className="text-sm font-semibold text-accent-foreground mt-1">Gratis</p>
                </div>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {deliveryMethod === "delivery" && (
          <Card className="border-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent-foreground" />
                <h2 className="font-semibold text-lg">Direccion de Entrega</h2>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Direccion</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ingresa tu direccion"
                  className="h-12"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" placeholder="Ciudad" className="h-12" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal">C.P.</Label>
                  <Input id="postal" placeholder="Codigo Postal" className="h-12" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Provincia</Label>
                <Input id="province" placeholder="Provincia" className="h-12" value={province} onChange={(e) => setProvince(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metodo de pago */}
        <Card className="border-2">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Metodo de Pago</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "transfer" | "cash")}
            >
              <label
                htmlFor="transfer"
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  paymentMethod === "transfer" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="transfer" id="transfer" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-5 h-5 text-accent-foreground" />
                    <span className="font-semibold">Pagar con Transferencia</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{"Transferencia bancaria o billetera virtual"}</p>
                </div>
              </label>

              <label
                htmlFor="cash"
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  paymentMethod === "cash" ? "border-accent bg-accent/5" : "border-border hover:bg-muted/50"
                }`}
              >
                <RadioGroupItem value="cash" id="cash" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Banknote className="w-5 h-5 text-accent-foreground" />
                    <span className="font-semibold">Efectivo al retirar/recibir</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{"Paga al momento de la entrega"}</p>
                </div>
              </label>

            </RadioGroup>
          </CardContent>
        </Card>

        {/* Resumen */}
        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-lg">Resumen del Pedido</h2>
            <div className="space-y-2">
              {items.map((item) => {
                const itemPrice = item.price * (1 - (item.discount || 0) / 100)
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-medium">${(itemPrice * item.quantity).toLocaleString("es-AR")}</span>
                  </div>
                )
              })}
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${subtotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envio</span>
                <span className="font-semibold">
                  {deliveryFee === 0 ? "Gratis" : `$${deliveryFee.toLocaleString("es-AR")}`}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold">${total.toLocaleString("es-AR")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 bg-card border-t p-4">
        {errorMessage && <p className="mb-2 text-sm text-red-600">{errorMessage}</p>}
        <Button
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Procesando..."
            : paymentMethod === "transfer"
              ? "Continuar con Transferencia"
              : "Confirmar Pedido"}
        </Button>
      </div>
    </div>
  )
}
