"use client"

import { useState, useEffect } from "react"
import { LoginScreen } from "@/components/login-screen"
import { HomeScreen } from "@/components/home-screen"
import { CatalogScreen } from "@/components/catalog-screen"
import { ProductDetailScreen } from "@/components/product-detail-screen"
import { CartScreen } from "@/components/cart-screen"
import { CheckoutScreen } from "@/components/checkout-screen"
import { TransferPaymentScreen } from "@/components/transfer-payment-screen"
import { OrdersScreen } from "@/components/orders-screen"
import { OrderDetailScreen } from "@/components/order-detail-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { AdminCarouselScreen } from "@/components/admin-carousel-screen"
import { SidebarMenu } from "@/components/sidebar-menu"
import { authService, ordersService } from "@/lib/api"
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
  | "order-detail"
  | "profile"
  | "admin-carousel"

export type Product = {
  id: string
  name: string
  price: number
  stock: number
  image: string
  images?: string[]
  category: string
  brand?: string
  isPromo?: boolean
  description?: string
}

export type CartItem = Product & {
  quantity: number
  discount?: number
}

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
}

export default function Home() {
  const ADMIN_ROL_ID = 1
  const [currentScreen, setCurrentScreen] = useState<Screen>("login")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true)
  const [lastOrderTotal, setLastOrderTotal] = useState(0)
  const [pendingTransferOrder, setPendingTransferOrder] = useState<CreatePedidoPayload | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [initialCategory, setInitialCategory] = useState<string | undefined>(undefined)

  useEffect(() => {
    const bootstrapSession = async () => {
      const refreshed = await authService.refresh()
      if (!refreshed) {
        localStorage.removeItem("rolId")
        localStorage.removeItem("usuarioId")
        setIsLoggedIn(false)
        setIsAdmin(false)
        setCurrentScreen("login")
        setIsBootstrappingSession(false)
        return
      }

      const rolId = Number(localStorage.getItem("rolId") || 0)
      setIsLoggedIn(true)
      setIsAdmin(rolId === ADMIN_ROL_ID)
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

  const handleLogin = (rolId: number, usuarioId: string | number) => {
    localStorage.setItem("rolId", String(rolId))
    localStorage.setItem("usuarioId", String(usuarioId))
    setIsLoggedIn(true)
    setIsAdmin(rolId === ADMIN_ROL_ID)
    navigateToScreen("home")
  }

  const handleAddToCart = (product: Product, quantity = 1, discount = 0) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, discount: discount || item.discount }
            : item,
        )
      }
      return [...prev, { ...product, quantity, discount }]
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== productId))
    } else {
      setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
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
    localStorage.removeItem("usuarioId")
    setIsLoggedIn(false)
    setIsAdmin(false)
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
            initialCategory={initialCategory}
            onCategoryApplied={() => setInitialCategory(undefined)}
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
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            isAdmin={isAdmin}
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
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "order-detail":
        return <OrderDetailScreen order={selectedOrder} onBack={() => navigateToScreen("orders")} />
      case "profile":
        return (
          <ProfileScreen
            onLogout={handleLogout}
            onNavigate={navigateToScreen}
            onOpenMenu={() => setSidebarOpen(true)}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
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
          onCategoryNavigate={(category) => {
            setInitialCategory(category)
            navigateToScreen("catalog")
          }}
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
