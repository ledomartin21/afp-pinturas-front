"use client"

import { useState } from "react"
import { ArrowLeft, BadgePercent, Layers3, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { PromotionCartItem, Screen } from "@/app/page"

interface PromotionDetailScreenProps {
  promotion: PromotionCartItem | null
  onAddPromotion: (promotion: PromotionCartItem, quantity: number) => void
  onBack: () => void
  onNavigate: (screen: Screen) => void
  cartCount: number
}

export function PromotionDetailScreen({ promotion, onAddPromotion, onBack, onNavigate, cartCount }: PromotionDetailScreenProps) {
  const [quantity, setQuantity] = useState(1)

  if (!promotion) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Promoción no disponible.
      </div>
    )
  }

  const individualTotal = promotion.includedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const estimatedUnitBase = individualTotal > 0 ? promotion.price * 1.18 : promotion.price
  const estimatedSavings = Math.max(0, estimatedUnitBase - promotion.price)
  const total = promotion.price * quantity
  const typeLabels: Record<PromotionCartItem["promotionType"], string> = {
    porcentaje: "Descuento porcentual",
    nxm: "Llevá N pagá M",
    combo_fijo: "Combo de precio fijo",
  }
  const scopeLabels: Record<PromotionCartItem["promotionScope"], string> = {
    producto: "Producto",
    rubro: "Rubro",
    marca: "Marca",
    combo: "Combo",
  }

  return (
    <div className="flex flex-col h-full">
      <header className="bg-primary px-4 pt-6 pb-4 rounded-b-xl shadow-lg relative z-10">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30" aria-label="Volver">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <img src="/images/logo.png" alt="AFP Pinturas" className="h-11 w-auto object-contain drop-shadow-md" />

          <button onClick={() => onNavigate("cart")} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative" aria-label="Carrito">
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Card className="border border-amber-200 bg-amber-50/70 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Detalle de promoción</p>
            <h1 className="text-xl font-bold text-amber-900">{promotion.promotionName || promotion.name}</h1>
            <p className="text-sm text-amber-800">{promotion.promotionDescription || "Promoción activa disponible en el catálogo."}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-amber-800">
                <BadgePercent className="h-3.5 w-3.5" />
                {typeLabels[promotion.promotionType]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-amber-800">
                <Layers3 className="h-3.5 w-3.5" />
                Aplica a {scopeLabels[promotion.promotionScope]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 text-sm text-amber-900">
              <div className="rounded-2xl bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-amber-700">Precio final</p>
                <p className="mt-1 font-bold">{`$${promotion.price.toLocaleString("es-AR")}`}</p>
              </div>
              <div className="rounded-2xl bg-white/80 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-amber-700">Stock informado</p>
                <p className="mt-1 font-bold">{promotion.stock}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Productos incluidos</h2>
            <p className="text-xs text-muted-foreground">
              {promotion.includedItems.length > 1
                ? "Este combo agrupa los siguientes productos."
                : "Esta promoción se aplica sobre el producto seleccionado."}
            </p>
            {promotion.includedItems.map((item) => (
              <div key={`${promotion.cartKey}-${item.productId}`} className="flex items-center gap-3 rounded-lg border border-border p-2">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-12 w-12 rounded-md object-cover bg-muted" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} unidad(es){item.brand ? ` · ${item.brand}` : ""}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-semibold">Resumen</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio promo</span>
              <span className="font-semibold">{`$${promotion.price.toLocaleString("es-AR")}`}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ahorro estimado</span>
              <span className="font-semibold text-emerald-700">{`$${estimatedSavings.toLocaleString("es-AR")}`}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 bg-card border-t p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
            -
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm text-muted-foreground">Cantidad de combos</p>
            <p className="text-xl font-bold">{quantity}</p>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setQuantity((prev) => prev + 1)}>
            +
          </Button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span>Total</span>
          <span className="text-xl font-bold">{`$${total.toLocaleString("es-AR")}`}</span>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => onAddPromotion(promotion, quantity)}
        >
          Agregar promoción al carrito
        </Button>
      </div>
    </div>
  )
}
