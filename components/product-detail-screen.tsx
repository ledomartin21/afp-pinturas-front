"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Percent, AlertTriangle, CalendarClock, Loader2 } from "lucide-react"
import type { Product, Screen } from "@/app/page"
import { productsService } from "@/lib/api"

interface ProductDetailScreenProps {
  product: Product | null
  onAddToCart: (product: Product, quantity: number, discount: number) => void
  onViewPromotion: (product: Product) => void
  onBack: () => void
  onProductClick: (product: Product) => void
  onNavigate: (screen: Screen) => void
  cartCount: number
  isAdmin: boolean
  isReserveApproved: (productId: string) => boolean
  onApproveReserve: (productId: string) => void
}

export function ProductDetailScreen({ product, onAddToCart, onViewPromotion, onBack, onProductClick, onNavigate, cartCount, isAdmin, isReserveApproved, onApproveReserve }: ProductDetailScreenProps) {
  const ADMIN_DISCOUNT_OPTIONS = [10, 15, 20] as const
  const [quantity, setQuantity] = useState(1)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showReserveDialog, setShowReserveDialog] = useState(false)
  const [showReserveConfirm, setShowReserveConfirm] = useState(false)
  const [discount, setDiscount] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([])
  const [suggestedLoading, setSuggestedLoading] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [comboPreviewItems, setComboPreviewItems] = useState<Array<{ code: string; name: string; image: string; quantity: number }>>([])
  const [feedbackMessage, setFeedbackMessage] = useState("Producto agregado al carrito")

  // Scroll al tope cuando cambia el producto
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "instant" })
    setQuantity(1)
    setDiscount(product?.promotion?.aplicaEnCheckout && product.promotion.tipo === "porcentaje" ? product.promotion.valor : 0)
    setShowFeedback(false)
    setShowReserveConfirm(false)
    setActiveImageIndex(0)
  }, [product?.id])

  useEffect(() => {
    if (!product) return

    const loadImages = async () => {
      try {
        setGalleryLoading(true)
        const urls = await productsService.getProductImages(product.id)
        if (urls.length > 0) {
          setGalleryImages(urls.slice(0, 10))
        } else if (product.image) {
          setGalleryImages([product.image])
        } else {
          setGalleryImages(["/placeholder.svg"])
        }
      } catch {
        setGalleryImages(product.image ? [product.image] : ["/placeholder.svg"])
      } finally {
        setGalleryLoading(false)
      }
    }

    loadImages()
  }, [product?.id, product?.image])

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

  useEffect(() => {
    if (!product || product.promotion?.tipo !== "combo_fijo") {
      setComboPreviewItems([])
      return
    }

    const comboItems = product.promotion.comboItems && product.promotion.comboItems.length > 0
      ? product.promotion.comboItems
      : [
          product.promotion.comboProductoCodigoA ? { productoCodigo: product.promotion.comboProductoCodigoA, cantidad: 1 } : null,
          product.promotion.comboProductoCodigoB ? { productoCodigo: product.promotion.comboProductoCodigoB, cantidad: 1 } : null,
        ].filter((item): item is { productoCodigo: string; cantidad: number } => Boolean(item))

    if (comboItems.length === 0) {
      setComboPreviewItems([])
      return
    }

    let cancelled = false

    const loadComboPreview = async () => {
      const resolved = await Promise.all(
        comboItems.map(async (comboItem) => {
          const code = (comboItem.productoCodigo || "").trim()
          if (!code) return null

          if (code === product.id.trim()) {
            return {
              code,
              name: product.name,
              image: product.image || "/placeholder.svg",
              quantity: Number(comboItem.cantidad || 1),
            }
          }

          try {
            const partner = await productsService.getProductByCode(code)
            return {
              code,
              name: partner.name || code,
              image: partner.image || "/placeholder.svg",
              quantity: Number(comboItem.cantidad || 1),
            }
          } catch {
            return {
              code,
              name: code,
              image: "/placeholder.svg",
              quantity: Number(comboItem.cantidad || 1),
            }
          }
        }),
      )

      if (!cancelled) {
        setComboPreviewItems(resolved.filter((item): item is { code: string; name: string; image: string; quantity: number } => Boolean(item)))
      }
    }

    void loadComboPreview()

    return () => {
      cancelled = true
    }
  }, [product?.id, product?.name, product?.image, product?.promotion?.tipo, product?.promotion?.comboProductoCodigoA, product?.promotion?.comboProductoCodigoB, JSON.stringify(product?.promotion?.comboItems || [])])

  if (!product) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Producto no encontrado</p>
      </div>
    )
  }

  const isOutOfStock = product.stock === 0
  const exceedsStock = quantity > product.stock && product.stock > 0
  const displayPrice = discount > 0 ? product.price * (1 - discount / 100) : product.price

  const handleAddToCart = () => {
    const approved = isReserveApproved(product.id)

    if (isOutOfStock) {
      if (approved) {
        onAddToCart(product, quantity, discount)
        setFeedbackMessage("Producto agregado al carrito")
        setShowFeedback(true)
        setTimeout(() => setShowFeedback(false), 2000)
        return
      }
      setShowReserveDialog(true)
      return
    }
    if (exceedsStock) {
      if (approved) {
        onAddToCart(product, quantity, discount)
        setFeedbackMessage("Producto agregado al carrito")
        setShowFeedback(true)
        setTimeout(() => setShowFeedback(false), 2000)
        return
      }
      setShowReserveDialog(true)
      return
    }

    onAddToCart(product, quantity, discount)
    setFeedbackMessage("Producto agregado al carrito")
    setShowFeedback(true)
    setTimeout(() => setShowFeedback(false), 2000)
  }

  const handleReserve = () => {
    setShowReserveDialog(false)
    onApproveReserve(product.id)
    onAddToCart(product, quantity, discount)
    setShowReserveConfirm(true)
    setTimeout(() => setShowReserveConfirm(false), 3000)
  }

  const incrementQuantity = () => setQuantity(quantity + 1)
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const discountedPrice = product.price * (1 - discount / 100)
  const subtotal = discountedPrice * quantity
  const currentImage = galleryImages[activeImageIndex] || product.image || "/placeholder.svg"
  const canMoveGallery = galleryImages.length > 1

  const goPrev = () => {
    if (galleryImages.length <= 1) return
    setActiveImageIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length)
  }

  const goNext = () => {
    if (galleryImages.length <= 1) return
    setActiveImageIndex((i) => (i + 1) % galleryImages.length)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header dorado consistente con el resto de la app */}
      <header className="bg-primary px-4 pt-6 pb-4 rounded-b-xl shadow-lg relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"
            aria-label="Volver"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <img
            src="/images/logo.png"
            alt="AFP Pinturas"
            className="h-11 w-auto object-contain drop-shadow-md"
          />

          <button
            onClick={() => onNavigate("cart")}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative"
            aria-label="Carrito"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        {/* Imagen */}
        <div className="relative bg-card">
          <img
            src={currentImage}
            alt={product.name}
            className={`w-full aspect-square object-cover ${isOutOfStock ? "opacity-50" : ""}`}
          />
          {galleryLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {canMoveGallery && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center"
                aria-label="Imagen siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
                {activeImageIndex + 1} / {galleryImages.length}
              </div>
            </>
          )}
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

        {galleryImages.length > 1 && (
          <div className="bg-card border-b px-3 py-2">
            <div className="flex gap-2 overflow-x-auto">
              {galleryImages.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${
                    idx === activeImageIndex ? "border-primary" : "border-border"
                  }`}
                >
                  <img src={img} alt={`Miniatura ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-4 pt-4 space-y-4">
          {/* SKU + Info */}
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">{product.id}</p>
            <h1 className="text-xl font-bold text-balance">{product.name}</h1>
            <p className="text-muted-foreground text-sm">
              {product.category} {product.brand ? `- ${product.brand}` : ""}
            </p>
          </div>

          {/* Precio y Stock */}
          <Card className="border-0 shadow-sm">
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
                        ${displayPrice.toLocaleString("es-AR")}
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

          {product.promotion && (
            <Card className="border border-amber-200 bg-amber-50/70 shadow-sm">
              <CardContent className="p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {product.promotion.tipo === "combo_fijo"
                    ? "Promocion combo"
                    : product.promotion.tipo === "nxm"
                      ? "Promocion llevas mas pagas menos"
                      : "Promocion porcentual"}
                </p>
                <p className="mt-2 text-sm text-amber-900">
                  {product.promotion.descripcion || "Descuento activo disponible en este producto."}
                </p>
                {product.promotion.tipo === "combo_fijo" ? (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      {comboPreviewItems.slice(0, 3).map((item, index) => (
                        <div key={`${item.code}-${index}`} className="flex items-center gap-2">
                          {index > 0 && <span className="text-sm font-bold text-amber-800">+</span>}
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            className="h-9 w-9 rounded-md border border-amber-200 bg-white object-cover"
                          />
                        </div>
                      ))}
                      {comboPreviewItems.length > 3 && <span className="text-xs font-semibold text-amber-700">+{comboPreviewItems.length - 3}</span>}
                    </div>
                    <p className="mt-1 text-sm text-amber-900">
                      Incluye {comboPreviewItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)} unidad(es):
                      {" "}
                      {comboPreviewItems
                        .map((item) => (item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name))
                        .join(" + ") || product.name}
                      . Precio final del combo: ${Number(product.promotion.comboPrecioFijo || 0).toLocaleString("es-AR")}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-amber-900">
                    {product.promotion.ambitoTipo === "rubro"
                      ? "Aplica a productos del mismo rubro."
                      : product.promotion.ambitoTipo === "marca"
                        ? "Aplica a productos de la misma marca."
                        : "Aplica al producto seleccionado."}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 h-9 rounded-xl border-amber-300 bg-white text-amber-800 hover:bg-amber-100"
                  onClick={() => onViewPromotion(product)}
                >
                  Ver promoción
                </Button>
              </CardContent>
            </Card>
          )}

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
            <Card className="border-0 shadow-sm bg-accent/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Percent className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm">Descuento Administrativo</h3>
                </div>
                {product.promotion?.aplicaEnCheckout && (
                  <p className="text-xs text-muted-foreground">
                    {product.promotion.tipo === "combo_fijo"
                      ? "La promo combo es informativa y no se aplica como descuento porcentual en este item."
                      : "La promocion activa ya viene precargada y podes ajustarla manualmente para este pedido."}
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscount(0)}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      discount === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                    }`}
                  >
                    Sin desc.
                  </button>
                  {ADMIN_DISCOUNT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDiscount(option)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        discount === option ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                      }`}
                    >
                      {option}%
                    </button>
                  ))}
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
                    className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm overflow-hidden active:scale-[0.97]"
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
                      <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">{sp.id}</p>
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
            {feedbackMessage}
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
