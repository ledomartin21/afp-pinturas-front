"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { ArrowLeft, Minus, Plus, ShoppingCart, Percent, MessageCircle, AlertTriangle, CalendarClock, Loader2 } from "lucide-react"
import type { Product } from "@/app/page"
import { productsService } from "@/lib/api"

interface ProductDetailScreenProps {
  product: Product | null
  onAddToCart: (product: Product, quantity: number, discount: number) => void
  onBack: () => void
  onProductClick: (product: Product) => void
  isAdmin: boolean
}

import { APP_CONSTANTS } from "@/lib/config/constants"

const WSP_NUMBER = APP_CONSTANTS.WHATSAPP_NUMBER

export function ProductDetailScreen({ product, onAddToCart, onBack, onProductClick, isAdmin }: ProductDetailScreenProps) {
  const [quantity, setQuantity] = useState(1)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showReserveDialog, setShowReserveDialog] = useState(false)
  const [showReserveConfirm, setShowReserveConfirm] = useState(false)
  const [discount, setDiscount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)

  // Scroll al tope cuando cambia el producto
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
    setQuantity(1)
    setDiscount(0)
    setShowFeedback(false)
    setShowReserveConfirm(false)
  }, [product?.id])

  // Cargar productos relacionados desde el backend
  useEffect(() => {
    if (!product) return

    const loadRelated = async () => {
      try {
        setSuggestedLoading(true)
        const result = await productsService.getProductsPaginated(1, 6, {
          category: product.category,
        })
        setSuggestedProducts(result.items.filter((p) => p.id !== product.id).slice(0, 4))
      } catch {
        setSuggestedProducts([])
      } finally {
        setSuggestedLoading(false)
      }
    }

    loadRelated()
  }, [product?.id, product?.category])

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    )
  }

  const isOutOfStock = product.stock === 0
  const exceedsStock = quantity > product.stock && product.stock > 0

  const handleAddToCart = () => {
    if (isOutOfStock) {
      setShowReserveDialog(true)
      return
    }
    if (exceedsStock) {
      setShowReserveDialog(true)
      return
    }
    onAddToCart(product, quantity, discount)
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 2000)
  }

  const handleReserve = () => {
    setShowReserveDialog(false)
    setShowReserveConfirm(true)
    setTimeout(() => setShowReserveConfirm(false), 3000)
  }

  const incrementQuantity = () => setQuantity(quantity + 1)
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const discountedPrice = product.price * (1 - discount / 100)
  const subtotal = discountedPrice * quantity

  const openWhatsApp = () => {
    window.open(
      `https://wa.me/${WSP_NUMBER}?text=Hola! Quiero consultar sobre: ${product.name} ($${product.price.toLocaleString("es-AR")})`,
      "_blank",
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="p-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold flex-1">Detalle del Producto</h1>
          <button
            onClick={openWhatsApp}
            className="bg-[#25D366] w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Consultar por WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto bg-muted/30">
        {/* Imagen */}
        <div className="relative bg-card">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className={`w-full aspect-square object-cover ${isOutOfStock ? "opacity-50" : ""}`}
          />
          {product.isPromo && !isOutOfStock && (
            <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground text-sm px-3 py-1.5 font-bold">
              OFERTA
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-red-500/90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-lg shadow-lg">
                <AlertTriangle className="w-5 h-5" />
                SIN STOCK
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Info */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-balance">{product.name}</h1>
            <p className="text-muted-foreground text-sm">
              {product.category} {product.brand ? `- ${product.brand}` : ""}
            </p>
          </div>

          {/* Precio */}
          <Card className="border">
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Precio</p>
                  {discount > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground line-through">
                        ${product.price.toLocaleString("es-AR")}
                      </p>
                      <p className="text-2xl font-bold">
                        ${discountedPrice.toLocaleString("es-AR")}
                      </p>
                      <Badge className="mt-1 bg-accent text-accent-foreground font-bold">-{discount}%</Badge>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold">${product.price.toLocaleString("es-AR")}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Stock</p>
                  <p className={`text-lg font-semibold ${isOutOfStock ? "text-red-500" : ""}`}>
                    {isOutOfStock ? "Agotado" : `${product.stock} ud.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descripcion */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold">Descripcion</h2>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              {product.description ||
                `${product.name} de excelente calidad. Ideal para uso profesional y domestico. Garantia de 12 meses.`}
            </p>
          </div>

          {/* Descuento admin */}
          {isAdmin && (
            <Card className="bg-accent/10 border border-accent/30">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-accent-foreground" />
                  <h3 className="font-semibold text-sm">Descuento Administrativo</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                    className="h-11"
                    placeholder="0"
                  />
                  <span className="text-xl font-bold">%</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cantidad */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Cantidad</h3>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 bg-transparent border-2"
                onClick={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <div className="flex-1 text-center">
                <p className="text-2xl font-bold">{quantity}</p>
                {exceedsStock && (
                  <p className="text-xs text-red-500 font-medium mt-0.5">Supera el stock disponible</p>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 bg-transparent border-2"
                onClick={incrementQuantity}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* WhatsApp */}
          <button
            onClick={openWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-3 font-semibold hover:bg-[#20BD5A] transition-colors active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5" />
            Consultar por WhatsApp
          </button>

          {/* Sugerencias - Grid como en catalogo */}
          {suggestedLoading ? (
            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-bold">Productos Relacionados</h3>
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </div>
          ) : suggestedProducts.length > 0 ? (
            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-bold">Productos Relacionados</h3>
              <div className="grid grid-cols-2 gap-3">
                {suggestedProducts.map((sp) => (
                  <Card
                    key={sp.id}
                    className="cursor-pointer hover:shadow-lg transition-all border overflow-hidden active:scale-[0.97]"
                    onClick={() => onProductClick(sp)}
                  >
                    <div className="relative">
                      <img
                        src={sp.image || "/placeholder.svg"}
                        alt={sp.name}
                        className={`w-full aspect-square object-cover bg-muted ${sp.stock === 0 ? "opacity-50" : ""}`}
                      />
                      {sp.stock === 0 && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
                          SIN STOCK
                        </Badge>
                      )}
                      {sp.isPromo && sp.stock > 0 && (
                        <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5">
                          OFERTA
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">{sp.brand || sp.category}</p>
                      <h4 className="font-semibold text-sm leading-tight line-clamp-2">{sp.name}</h4>
                      <p className="text-base font-bold">${sp.price.toLocaleString("es-AR")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-card border-t p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Subtotal ({quantity} {quantity === 1 ? "unidad" : "unidades"})
          </span>
          <span className="text-xl font-bold">${subtotal.toLocaleString("es-AR")}</span>
        </div>
        <Button
          className={`w-full h-13 text-base font-semibold ${
            isOutOfStock
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? (
            <>
              <CalendarClock className="w-5 h-5 mr-2" />
              Reservar Producto
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              Agregar al Carrito
            </>
          )}
        </Button>
        {showFeedback && (
          <div className="text-center text-sm font-medium text-primary animate-in fade-in slide-in-from-bottom-2">
            Producto agregado al carrito
          </div>
        )}
        {showReserveConfirm && (
          <div className="text-center text-sm font-medium text-amber-600 animate-in fade-in slide-in-from-bottom-2">
            Reserva registrada. Te notificaremos cuando haya stock.
          </div>
        )}
      </div>

      {/* Dialog de reserva */}
      <AlertDialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isOutOfStock ? "Producto sin stock" : "Stock insuficiente"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              {isOutOfStock
                ? `"${product.name}" no tiene stock disponible actualmente. Deseas reservarlo? Te avisaremos cuando este disponible.`
                : `Solo hay ${product.stock} unidades de "${product.name}" y solicitaste ${quantity}. Deseas reservar las unidades faltantes?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReserve}
              className="flex-1 bg-amber-500 text-white hover:bg-amber-600"
            >
              Si, reservar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
