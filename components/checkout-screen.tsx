"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, MapPin, Truck, Store, Banknote } from "lucide-react"
import type { CartItem } from "@/app/page"
import type { CreatePedidoPayload } from "@/lib/api/orders.service"
import { locationService, userService } from "@/lib/api"
import { calculateLinePricing } from "@/lib/promotion-pricing"

interface CheckoutScreenProps {
  items: CartItem[]
  onConfirm: (payload: CreatePedidoPayload) => Promise<void> | void
  onTransferPayment: (payload: CreatePedidoPayload) => Promise<void> | void
  onBack: () => void
}

type AddressDraft = {
  address: string
  city: string
  postalCode: string
  province: string
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function parseDomicilio(domicilio?: string | null): { address: string; postalCode: string } {
  if (!domicilio) {
    return { address: "", postalCode: "" }
  }

  const parts = domicilio.split(",").map((segment) => segment.trim()).filter(Boolean)
  return {
    address: parts[0] || "",
    postalCode: parts.length > 1 ? parts[parts.length - 1] : "",
  }
}

export function CheckoutScreen({ items, onConfirm, onTransferPayment, onBack }: CheckoutScreenProps) {
  const [deliveryMethod, setDeliveryMethod] = useState<"delivery" | "pickup">("delivery")
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "cash">("transfer")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [province, setProvince] = useState("")
  const [comisionistaNombre, setComisionistaNombre] = useState("")
  const [comisionistaTelefono, setComisionistaTelefono] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showAddressDecision, setShowAddressDecision] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<CreatePedidoPayload | null>(null)
  const [baseAddress, setBaseAddress] = useState<AddressDraft | null>(null)

  const subtotal = items.reduce((sum, item) => sum + calculateLinePricing(item).finalTotal, 0)
  const deliveryFee = 0
  const total = subtotal + deliveryFee

  useEffect(() => {
    let mounted = true

    const loadProfileAddress = async () => {
      const profile = await userService.getProfile().catch(() => null)
      if (!profile || !mounted) {
        return
      }

      const parsed = parseDomicilio(profile.domicilio)
      let provinceName = ""
      let cityName = ""

      if (profile.provinciaId) {
        const provinces = await locationService.getProvinces().catch(() => [])
        const provinceMatch = provinces.find((candidate) => candidate.id === profile.provinciaId)
        provinceName = provinceMatch?.nombre || ""

        if (profile.ciudadId) {
          const cities = await locationService.getCitiesForProvince(profile.provinciaId).catch(() => [])
          const cityMatch = cities.find((candidate) => candidate.id === profile.ciudadId)
          cityName = cityMatch?.nombre || ""
        }
      }

      if (!mounted) {
        return
      }

      setAddress(parsed.address)
      setPostalCode(parsed.postalCode)
      setCity(cityName)
      setProvince(provinceName)
      setBaseAddress({
        address: parsed.address,
        city: cityName,
        postalCode: parsed.postalCode,
        province: provinceName,
      })
    }

    void loadProfileAddress()

    return () => {
      mounted = false
    }
  }, [])

  const isAddressChanged = () => {
    if (!baseAddress) return false

    return (
      normalize(address) !== normalize(baseAddress.address) ||
      normalize(city) !== normalize(baseAddress.city) ||
      normalize(postalCode) !== normalize(baseAddress.postalCode) ||
      normalize(province) !== normalize(baseAddress.province)
    )
  }

  const buildPayload = (): CreatePedidoPayload => {
    const grossSubtotal = items.reduce((sum, item) => sum + calculateLinePricing(item).baseTotal, 0)
    const discountTotal = items.reduce((sum, item) => sum + calculateLinePricing(item).discountAmount, 0)

    const payload: CreatePedidoPayload = {
      metodoEntrega: deliveryMethod,
      metodoPago: paymentMethod,
      subtotal,
      descuentoTotal: discountTotal,
      total,
      detalles: items.map((item) => {
        if (item.type === "promotion") {
          return {
            productoId: item.id,
            tipoItem: "promotion",
            promocionId: item.promotionId,
            descripcionItem: item.promotionName || item.name,
            precioUnitario: item.price,
            cantidad: item.quantity,
            descuentoPorcentaje: 0,
            componentes: item.includedItems.map((component) => ({
              productoId: component.productId,
              nombre: component.name,
              cantidad: component.quantity,
              marca: component.brand,
            })),
          }
        }

        const pricing = calculateLinePricing(item)
        return {
          productoId: item.id,
          tipoItem: "product",
          cantidad: item.quantity,
          descuentoPorcentaje: Number(pricing.effectiveDiscountPercent.toFixed(2)),
        }
      }),
    }

    if (deliveryMethod === "delivery") {
      payload.direccionEntrega = {
        calle: address.trim(),
        ciudad: city.trim(),
        codigoPostal: postalCode.trim(),
        provincia: province.trim(),
      }
      payload.comisionistaNombre = comisionistaNombre.trim()
      payload.comisionistaTelefono = comisionistaTelefono.trim()
    }

    if (grossSubtotal > subtotal) {
      payload.descuentoTotal = discountTotal
    }

    return payload
  }

  const submitWithStrategy = async (payload: CreatePedidoPayload, updateProfileAddress: boolean) => {
    try {
      setErrorMessage("")
      setIsSubmitting(true)

      if (updateProfileAddress && payload.direccionEntrega) {
        const domicilio = [
          payload.direccionEntrega.calle,
          payload.direccionEntrega.ciudad,
          payload.direccionEntrega.codigoPostal,
          payload.direccionEntrega.provincia,
        ]
          .filter((value) => value && value.trim().length > 0)
          .join(", ")

        await userService.updateProfile({ domicilio })
      }

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

  const handleConfirm = async () => {
    if (deliveryMethod === "delivery") {
      if (!address.trim() || !city.trim() || !postalCode.trim()) {
        setErrorMessage("Completá dirección, ciudad y código postal para envío a domicilio.")
        return
      }
      if (!comisionistaNombre.trim() || !comisionistaTelefono.trim()) {
        setErrorMessage("Completá nombre y teléfono del comisionista para el envío a domicilio.")
        return
      }
    }

    const payload = buildPayload()
    if (deliveryMethod === "delivery" && isAddressChanged()) {
      setPendingPayload(payload)
      setShowAddressDecision(true)
      return
    }

    await submitWithStrategy(payload, false)
  }

  const handleAddressDecision = async (updateProfileAddress: boolean) => {
    if (!pendingPayload) {
      return
    }

    setShowAddressDecision(false)
    const payload = pendingPayload
    setPendingPayload(null)
    await submitWithStrategy(payload, updateProfileAddress)
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
        <Card className="border-2">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Metodo de Entrega</h2>
            <RadioGroup value={deliveryMethod} onValueChange={(value) => setDeliveryMethod(value as "delivery" | "pickup")}>
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
                  <p className="text-sm font-semibold mt-1">Sin cargo</p>
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
          <>
            <Card className="border-2">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent-foreground" />
                  <h2 className="font-semibold text-lg">Direccion de Entrega</h2>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Direccion</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ingresa tu direccion" className="h-12" />
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

            <Card className="border-2">
              <CardContent className="p-4 space-y-4">
                <h2 className="font-semibold text-lg">Datos del Comisionista</h2>
                <div className="space-y-2">
                  <Label htmlFor="delivery-agent-name">Nombre del comisionista</Label>
                  <Input
                    id="delivery-agent-name"
                    value={comisionistaNombre}
                    onChange={(e) => setComisionistaNombre(e.target.value)}
                    placeholder="Ej: Juan Perez"
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-agent-phone">Telefono del comisionista</Label>
                  <Input
                    id="delivery-agent-phone"
                    value={comisionistaTelefono}
                    onChange={(e) => setComisionistaTelefono(e.target.value)}
                    placeholder="Ej: 3511234567"
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="border-2">
          <CardContent className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Metodo de Pago</h2>
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "transfer" | "cash")}>
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

        <Card className="border-2">
          <CardContent className="p-4 space-y-3">
            <h2 className="font-semibold text-lg">Resumen del Pedido</h2>
            <div className="space-y-2">
              {items.map((item) => {
                const pricing = calculateLinePricing(item)
                const itemPrice = pricing.unitPrice
                return (
                  <div key={item.cartKey} className="flex justify-between text-sm">
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
                <span className="font-semibold">{deliveryFee === 0 ? "Gratis" : `$${deliveryFee.toLocaleString("es-AR")}`}</span>
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
        <Button className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : paymentMethod === "transfer" ? "Continuar con Transferencia" : "Confirmar Pedido"}
        </Button>
      </div>

      <AlertDialog open={showAddressDecision} onOpenChange={setShowAddressDecision}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Dirección modificada</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Querés actualizar también la dirección del cliente o usar esta dirección solo para este pedido?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                void handleAddressDecision(true)
              }}
            >
              Actualizar dirección del cliente
            </AlertDialogAction>
            <AlertDialogAction
              className="w-full border border-border bg-card text-foreground hover:bg-muted"
              onClick={() => {
                void handleAddressDecision(false)
              }}
            >
              Usar solo para este pedido
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 w-full">Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
