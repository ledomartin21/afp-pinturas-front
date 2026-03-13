"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Percent } from "lucide-react"
import type { CartItem, Screen } from "@/app/page"

interface CartScreenProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onCheckout: () => void
  onBack: () => void
  onNavigate: (screen: Screen) => void
}

export function CartScreen({ items, onUpdateQuantity, onCheckout, onBack, onNavigate }: CartScreenProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalDiscount = items.reduce((sum, item) => sum + (item.price * item.quantity * (item.discount || 0)) / 100, 0)
  const total = subtotal - totalDiscount

  return (
    <div className="flex flex-col h-full">
      <div className="bg-card px-4 py-3 border-b">
        <div className="h-0.5 bg-accent absolute top-0 left-0 right-0" />
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Mi Carrito</h1>
          <span className="ml-auto text-sm font-medium text-muted-foreground">
            {items.length} {items.length === 1 ? "producto" : "productos"}
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mb-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6 text-pretty">{"Agregá productos para comenzar tu pedido"}</p>
          <Button onClick={() => onNavigate("catalog")} className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            Ver Productos
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {items.map((item) => {
              const itemPrice = item.price * (1 - (item.discount || 0) / 100)
              const itemTotal = itemPrice * item.quantity

              return (
                <Card key={item.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 flex flex-col gap-2">
                        <div>
                          <h3 className="font-semibold text-balance leading-tight">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.discount && item.discount > 0 ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-accent text-white text-xs">
                                <Percent className="w-3 h-3 mr-1" />-{item.discount}%
                              </Badge>
                              <div>
                                <p className="text-xs text-muted-foreground line-through">
                                  ${item.price.toLocaleString("es-AR")}
                                </p>
                                <p className="text-lg font-bold text-accent">${itemPrice.toLocaleString("es-AR")}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-lg font-bold text-accent-foreground">
                              ${item.price.toLocaleString("es-AR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent border-2"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-transparent border-2"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-accent-foreground">${itemTotal.toLocaleString("es-AR")}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onUpdateQuantity(item.id, 0)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="sticky bottom-0 bg-card border-t p-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">${subtotal.toLocaleString("es-AR")}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    Descuentos
                  </span>
                  <span className="font-semibold text-accent">-${totalDiscount.toLocaleString("es-AR")}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="font-semibold text-accent-foreground">A calcular</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-accent-foreground">${total.toLocaleString("es-AR")}</span>
              </div>
            </div>
            <Button
              className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onCheckout}
            >
              Continuar con la Compra
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
