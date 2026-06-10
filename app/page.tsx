"use client"

import { useState, useEffect, useRef } from "react"
import { LoginScreen } from "@/components/login-screen"
import { HomeScreen } from "@/components/home-screen"
import { CatalogScreen } from "@/components/catalog-screen"
import { ProductDetailScreen } from "@/components/product-detail-screen"
import { CartScreen } from "@/components/cart-screen"
import { CheckoutScreen } from "@/components/checkout-screen"
import { TransferPaymentScreen } from "@/components/transfer-payment-screen"
import { OrdersScreen } from "@/components/orders-screen"
import { OrderDetailScreen } from "@/components/order-detail-screen"
import { OrderPdfScreen } from "@/components/order-pdf-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { AdminCarouselScreen } from "@/components/admin-carousel-screen"
import { PromotionDetailScreen } from "@/components/promotion-detail-screen"
import { AccountScreen } from "@/components/account-screen"
import { SidebarMenu } from "@/components/sidebar-menu"
import { authService, ordersService, productsService } from "@/lib/api"
import type { CreatePedidoPayload } from "@/lib/api/orders.service"
import { APP_CONSTANTS } from "@/lib/config/constants"

export type Screen =
  | "login"
  | "home"
  | "catalog"
  | "product-detail"
  | "cart"
  | "checkout"
  | "transfer-payment"
  | "orders"
  | "account"
  | "order-detail"
  | "order-pdf"
  | "promotion-detail"
  | "profile"
  | "admin-carousel"

export type Product = {
  id: string
  name: string
  price: number
  promoPrice?: number
  stock: number
  image: string
  images?: string[]
  category: string
  brand?: string
  isPromo?: boolean
  promotion?: {
    id: number
    nombre: string
    descripcion?: string | null
    tipo: "porcentaje" | "nxm" | "combo_fijo"
    valor: number
    cantidadLleva?: number | null
    cantidadPaga?: number | null
    comboProductoCodigoA?: string | null
    comboProductoCodigoB?: string | null
    comboPrecioFijo?: number | null
    comboItems?: Array<{ productoCodigo: string; cantidad: number; nombre?: string; marca?: string }>
    comboStockDisponible?: number | null
    soloVisual: boolean
    aplicaEnCheckout: boolean
    prioridad: number
    ambitoTipo: "producto" | "rubro" | "marca" | "combo"
    precioPromocional?: number | null
  }
  description?: string
}

export type PromotionCartComponent = {
  productId: string
  name: string
  quantity: number
  brand?: string
  image?: string
}

export type ProductCartItem = Product & {
  type: "product"
  cartKey: string
  quantity: number
  discount?: number
}

export type PromotionCartItem = {
  type: "promotion"
  cartKey: string
  id: string
  promotionId: number
  promotionName: string
  promotionDescription?: string | null
  promotionType: "porcentaje" | "nxm" | "combo_fijo"
  promotionScope: "producto" | "rubro" | "marca" | "combo"
  name: string
  price: number
  stock: number
  image: string
  category: string
  quantity: number
  includedItems: PromotionCartComponent[]
}

export type CartItem = ProductCartItem | PromotionCartItem

export type Order = {
  id: string
  date: string
  total: number
  status: "pending" | "processing" | "shipped" | "delivered"
  items: CartItem[]
  deliveryMethod?: "delivery" | "pickup"
  paymentMethod?: "transfer" | "cash" | "card"
  paymentStatus?: "pending" | "paid" | "rejected"
  address?: {
    calle: string
    ciudad: string
    codigoPostal: string
    provincia?: string
  } | null
  comisionistaNombre?: string
  comisionistaTelefono?: string
}

type CatalogNavigationState = {
  category?: string
  search?: string
  preset?: "promotions" | "default"
  token: number
}

export default function Home() {
  const ADMIN_ROLE_NAME = "administrador"
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true)
  const [lastOrderTotal, setLastOrderTotal] = useState(0)
  const [pendingTransferOrder, setPendingTransferOrder] = useState<CreatePedidoPayload | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionCartItem | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [catalogNavigation, setCatalogNavigation] = useState<CatalogNavigationState | null>(null)
  const [approvedReserveProducts, setApprovedReserveProducts] = useState<string[]>([])
  const catalogNavigationTokenRef = useRef(0)

  useEffect(() => {
    const bootstrapSession = async () => {
      const refreshed = await authService.refresh()
      if (!refreshed) {
        localStorage.removeItem("rolId")
        localStorage.removeItem("rolNombre")
        localStorage.removeItem("usuarioId")
        setIsLoggedIn(false)
        setIsAdmin(false)
        setCurrentScreen("login")
        setIsBootstrappingSession(false)
        return
      }

      const rolId = Number(localStorage.getItem("rolId") || 0)
      const rolNombre = (localStorage.getItem("rolNombre") || "").toLowerCase()
      setIsLoggedIn(true)
      setIsAdmin(rolNombre ? rolNombre === ADMIN_ROLE_NAME : rolId === 1)
      setCurrentScreen("home")
      setIsBootstrappingSession(false)
    }

    bootstrapSession()
  }, [])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state) {
        setCurrentScreen(event.state.screen)
        if (event.state.product) {
          setSelectedProduct(event.state.product)
        }
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const handleLogin = (rolId: number, usuarioId: string | number, rolNombre?: string) => {
    localStorage.setItem("rolId", String(rolId))
    localStorage.setItem("usuarioId", String(usuarioId))
    if (rolNombre) {
      localStorage.setItem("rolNombre", rolNombre)
    } else {
      localStorage.removeItem("rolNombre")
    }
    setIsLoggedIn(true)
    setIsAdmin((rolNombre || "").toLowerCase() === ADMIN_ROLE_NAME || (!rolNombre && rolId === 1))
    navigateToScreen("home")
  }

  const handleAddToCart = (product: Product, quantity = 1, discount = 0) => {
    const effectiveDiscount =
      discount > 0
        ? discount
        : product.promotion?.aplicaEnCheckout && product.promotion.tipo === "porcentaje"
          ? product.promotion.valor
          : 0

    setCart((prev) => {
      const cartKey = `product:${product.id}`
      const existingItem = prev.find((item) => item.cartKey === cartKey && item.type === "product") as ProductCartItem | undefined
      if (existingItem) {
        const previousDiscount = existingItem.discount || 0
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + quantity, discount: effectiveDiscount || previousDiscount }
            : item,
        )
      }
      return [...prev, { ...product, type: "product", cartKey, quantity, discount: effectiveDiscount }]
    })
  }

  const handleAddPromotionToCart = (promotion: PromotionCartItem, quantity = 1) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.cartKey === promotion.cartKey)
      if (existingItem && existingItem.type === "promotion") {
        return prev.map((item) =>
          item.cartKey === promotion.cartKey ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      return [...prev, { ...promotion, quantity }]
    })
  }

  const handleUpdateQuantity = (cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartKey !== cartKey))
    } else {
      setCart((prev) => prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity } : item)))
    }
  }

  const navigateToScreen = (screen: Screen, product?: Product | null) => {
    setCurrentScreen(screen)
    if (product !== undefined) {
      setSelectedProduct(product)
    }

    window.history.pushState({ screen, product: product || null }, "", `#${screen}`)
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    navigateToScreen("product-detail", product)
  }

  const handleViewPromotion = async (product: Product) => {
    if (!product.promotion) {
      return
    }

    let includedItems: PromotionCartComponent[] = [
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        brand: product.brand,
        image: product.image,
      },
    ]
    let stock = product.stock
    let promoPrice = product.price
    let partnerProduct: Product | null = null

    if (product.promotion.tipo === "combo_fijo") {
      const comboItems = product.promotion.comboItems && product.promotion.comboItems.length > 0
        ? product.promotion.comboItems
        : [
            product.promotion.comboProductoCodigoA ? { productoCodigo: product.promotion.comboProductoCodigoA, cantidad: 1 } : null,
            product.promotion.comboProductoCodigoB ? { productoCodigo: product.promotion.comboProductoCodigoB, cantidad: 1 } : null,
          ].filter((item): item is { productoCodigo: string; cantidad: number } => Boolean(item))

      const comboPrice = Number(product.promotion.comboPrecioFijo || 0)
      if (comboPrice <= 0 || comboItems.length === 0) {
        return
      }

      const currentCode = product.id.trim()
      const resolvedItems = await Promise.all(
        comboItems.map(async (comboItem) => {
          const comboCode = (comboItem.productoCodigo || "").trim()
          if (!comboCode) return null

          if (comboCode === currentCode) {
            return {
              product: product,
              quantity: Number(comboItem.cantidad || 1),
            }
          }

          const fetched = await productsService.getProductByCode(comboCode).catch(() => null)
          if (!fetched) {
            return null
          }

          return {
            product: fetched,
            quantity: Number(comboItem.cantidad || 1),
          }
        }),
      )

      const validItems = resolvedItems.filter((item): item is { product: Product; quantity: number } => Boolean(item))
      if (validItems.length === 0) {
        return
      }

      includedItems = validItems.map(({ product: comboProduct, quantity }) => ({
        productId: comboProduct.id,
        name: comboProduct.name,
        quantity,
        brand: comboProduct.brand,
        image: comboProduct.image,
      }))

      const stockValues = validItems.map(({ product: comboProduct, quantity }) => {
        const qty = quantity > 0 ? quantity : 1
        return Math.floor(Number(comboProduct.stock || 0) / qty)
      })

      partnerProduct = validItems.find((item) => item.product.id !== product.id)?.product || null
      stock = product.promotion.comboStockDisponible != null
        ? Math.max(0, Number(product.promotion.comboStockDisponible || 0))
        : stockValues.length > 0
          ? Math.max(0, Math.min(...stockValues))
          : 0
      promoPrice = comboPrice
    }

    setSelectedPromotion({
      type: "promotion",
      cartKey: `promotion:${product.promotion.id}`,
      id: `PROMO${product.promotion.id}`,
      promotionId: product.promotion.id,
      promotionName: product.promotion.nombre,
      promotionDescription: product.promotion.descripcion,
      promotionType: product.promotion.tipo,
      promotionScope: product.promotion.ambitoTipo,
      name: product.promotion.nombre || `Combo ${product.name}`,
      price: promoPrice,
      stock,
      image: product.image || partnerProduct?.image || "/placeholder.svg",
      category: product.category || "Promociones",
      quantity: 1,
      includedItems,
    })
    navigateToScreen("promotion-detail")
  }

  const isReserveApproved = (productId: string) => approvedReserveProducts.includes(productId)

  const approveReserveForProduct = (productId: string) => {
    setApprovedReserveProducts((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
  }

  const openCatalog = (category?: string, search?: string, preset: "promotions" | "default" = "default") => {
    catalogNavigationTokenRef.current += 1
    setCatalogNavigation({
      category,
      search,
      preset,
      token: catalogNavigationTokenRef.current,
    })
    navigateToScreen("catalog")
  }

  const handleCheckout = async (payload: CreatePedidoPayload) => {
    const usuarioId = Number(localStorage.getItem("usuarioId") || 0)
    const payloadConUsuario = {
      ...payload,
      usuarioId: usuarioId > 0 ? usuarioId : undefined,
    }
    await ordersService.createOrder(payloadConUsuario)
    setLastOrderTotal(payload.total)
    setCart([])
    navigateToScreen("orders")
  }

  const handleTransferPayment = async (payload: CreatePedidoPayload) => {
    setPendingTransferOrder(payload)
    setLastOrderTotal(payload.total)
    navigateToScreen("transfer-payment")
  }

  const handleTransferConfirm = async () => {
    if (!pendingTransferOrder) {
      throw new Error("No hay pedido pendiente para confirmar")
    }

    const usuarioId = Number(localStorage.getItem("usuarioId") || 0)
    const payloadConUsuario = {
      ...pendingTransferOrder,
      usuarioId: usuarioId > 0 ? usuarioId : undefined,
    }

    await ordersService.createOrder(payloadConUsuario)
    setPendingTransferOrder(null)
    setCart([])
    navigateToScreen("orders")
  }

  const handleLogout = () => {
    authService.logout()
    localStorage.removeItem("rolId")
    localStorage.removeItem("rolNombre")
    localStorage.removeItem("usuarioId")
    setIsLoggedIn(false)
    setIsAdmin(false)
    setApprovedReserveProducts([])
    setSelectedPromotion(null)
    navigateToScreen("login")
  }

  const renderScreen = () => {
    if (isBootstrappingSession) {
      return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Cargando sesion...
        </div>
      )
    }

    if (!isLoggedIn) {
      return <LoginScreen onLogin={handleLogin} />
    }

    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onNavigate={navigateToScreen}
            onSearchNavigate={(search) => openCatalog(undefined, search)}
            onCatalogPresetNavigate={(preset) => {
              if (preset === "promotions") {
                openCatalog(undefined, undefined, "promotions")
                return
              }
              if (preset === "afp") {
                openCatalog(undefined, "AFP", "default")
                return
              }
              openCatalog(undefined, undefined, "default")
            }}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "catalog":
        return (
          <CatalogScreen
            onProductClick={handleProductClick}
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            initialCategory={catalogNavigation?.category}
            initialSearch={catalogNavigation?.search}
            initialPreset={catalogNavigation?.preset}
            navigationToken={catalogNavigation?.token}
            isReserveApproved={isReserveApproved}
            onApproveReserve={approveReserveForProduct}
            onViewPromotion={handleViewPromotion}
          />
        )
      case "product-detail":
        return (
          <ProductDetailScreen
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onBack={() => navigateToScreen("catalog")}
            onProductClick={handleProductClick}
            onNavigate={navigateToScreen}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            isAdmin={isAdmin}
            isReserveApproved={isReserveApproved}
            onApproveReserve={approveReserveForProduct}
            onViewPromotion={handleViewPromotion}
          />
        )
      case "cart":
        return (
          <CartScreen
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={() => navigateToScreen("checkout")}
            onBack={() => navigateToScreen("catalog")}
            onNavigate={navigateToScreen}
          />
        )
      case "checkout":
        return (
          <CheckoutScreen
            items={cart}
            onConfirm={handleCheckout}
            onTransferPayment={handleTransferPayment}
            onBack={() => navigateToScreen("cart")}
          />
        )
      case "transfer-payment":
        return (
          <TransferPaymentScreen
            total={lastOrderTotal}
            onConfirm={handleTransferConfirm}
            onBack={() => navigateToScreen("checkout")}
          />
        )
      case "orders":
        return (
          <OrdersScreen
            onOrderClick={(order) => {
              setSelectedOrder(order)
              navigateToScreen("order-detail")
            }}
            onOrderPdfClick={(order) => {
              setSelectedOrder(order)
              navigateToScreen("order-pdf")
            }}
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "account":
        return (
          <AccountScreen
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "order-detail":
        return <OrderDetailScreen order={selectedOrder} onBack={() => navigateToScreen("orders")} />
      case "order-pdf":
        return <OrderPdfScreen order={selectedOrder} onBack={() => navigateToScreen("orders")} />
      case "promotion-detail":
        return (
          <PromotionDetailScreen
            promotion={selectedPromotion}
            onAddPromotion={(promotion, quantity) => {
              handleAddPromotionToCart(promotion, quantity)
              navigateToScreen("cart")
            }}
            onBack={() => navigateToScreen("catalog")}
            onNavigate={navigateToScreen}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "profile":
        return (
          <ProfileScreen
            onLogout={handleLogout}
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            isAdmin={isAdmin}
          />
        )
      case "admin-carousel":
        return (
          <AdminCarouselScreen
            onBack={() => navigateToScreen("profile")}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md h-screen flex flex-col">
        <div className="flex-1 overflow-auto">{renderScreen()}</div>
      </div>

      {/* Sidebar menu global */}
      {isLoggedIn && (
        <SidebarMenu
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
          onNavigate={navigateToScreen}
          onCategoryNavigate={(category) => openCatalog(category)}
          onLogout={handleLogout}
        />
      )}

      {/* WhatsApp flotante global */}
      {isLoggedIn && currentScreen !== "login" && (
        <a
          href={`https://wa.me/${APP_CONSTANTS.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Quiero consultar sobre productos de AFP Pinturas")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50 active:scale-95 transition-transform hover:scale-105"
          aria-label="Contactar por WhatsApp"
        >
          <img src="/images/whatsapp.svg" alt="WhatsApp" className="w-14 h-14" />
        </a>
      )}
    </div>
  )
}
