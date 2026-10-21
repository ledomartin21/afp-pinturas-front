"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { StoreHeader, StoreFooter } from "@/components/layout/store-layout"
import { screenPath, screenFromPath, privateScreens, isStorePath } from "@/lib/navigation"
import { readCart, writeCart } from "@/lib/cart-storage"
import { Toaster } from "@/components/ui/toaster"
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
import { authService, ordersService, productsService } from "@/lib/api"
import type { CreatePedidoPayload } from "@/lib/api/orders.service"
import { APP_CONSTANTS } from "@/lib/config/constants"

import type { Screen, Product, CartItem, ProductCartItem, PromotionCartItem, PromotionCartComponent, Order } from "@/lib/types"

export default function Storefront() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentScreen = screenFromPath(pathname)
  const [storageReady, setStorageReady] = useState(false)
  const [cartOwner, setCartOwner] = useState("guest")
  const [routeLoading, setRouteLoading] = useState(false)
  const [routeError, setRouteError] = useState("")
  const lastCatalogUrl = useRef("/catalogo")
  const submitInFlight = useRef(false)
  const ADMIN_ROLE_NAMES = ["administrador", "root"]
  const PRIVILEGED_ORDER_ROLE_NAMES = ["administrador", "root", "empleado"]
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [canManageSpecialOrders, setCanManageSpecialOrders] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(true)
  const [lastOrderTotal, setLastOrderTotal] = useState(0)
  const [pendingTransferOrder, setPendingTransferOrder] = useState<CreatePedidoPayload | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionCartItem | null>(null)
  const [approvedReserveProducts, setApprovedReserveProducts] = useState<string[]>([])

  const resolveRoleFlags = (rolId: number, rolNombreRaw?: string) => {
    const roleName = (rolNombreRaw || "").trim().toLowerCase()
    return {
      isAdminRole: roleName ? ADMIN_ROLE_NAMES.includes(roleName) : rolId === 1 || rolId === 3,
      canManageOrders: roleName ? PRIVILEGED_ORDER_ROLE_NAMES.includes(roleName) : rolId === 1 || rolId === 3,
    }
  }

  useEffect(() => {
    const bootstrapSession = async () => {
      const refreshed = await authService.refresh()
      if (!refreshed) {
        localStorage.removeItem("rolId")
        localStorage.removeItem("rolNombre")
        localStorage.removeItem("usuarioId")
        setIsLoggedIn(false)
        setIsAdmin(false)
        setCanManageSpecialOrders(false)
        setCart(readCart("guest"))
        setCartOwner("guest")
        setStorageReady(true)
        setIsBootstrappingSession(false)
        return
      }

      const rolId = Number(localStorage.getItem("rolId") || 0)
      const rolNombre = (localStorage.getItem("rolNombre") || "").toLowerCase()
      const { isAdminRole, canManageOrders } = resolveRoleFlags(rolId, rolNombre)
      setIsLoggedIn(true)
      setIsAdmin(isAdminRole)
      setCanManageSpecialOrders(canManageOrders)
      const owner = localStorage.getItem("usuarioId") || "guest"
      setCartOwner(owner)
      setCart(readCart(owner))
      setStorageReady(true)
      try {
        const pending = JSON.parse(sessionStorage.getItem(`afp-transfer:${owner}`) || "null")
        if (pending?.detalles?.length) {
          setPendingTransferOrder(pending)
          setLastOrderTotal(Number(pending.total || 0))
        }
      } catch { /* Invalid draft. */ }
      setIsBootstrappingSession(false)
    }

    bootstrapSession()
  }, [])

  useEffect(() => {
    if (storageReady) writeCart(cartOwner, cart)
  }, [cart, cartOwner, storageReady])

  useEffect(() => {
    if (!storageReady) return
    try {
      const key = `afp-transfer:${cartOwner}`
      if (pendingTransferOrder) sessionStorage.setItem(key, JSON.stringify(pendingTransferOrder))
      else sessionStorage.removeItem(key)
    } catch { /* Storage may be unavailable. */ }
  }, [pendingTransferOrder, cartOwner, storageReady])

  useEffect(() => {
    if (!isBootstrappingSession && privateScreens.includes(currentScreen) && !isLoggedIn) {
      router.replace(`/login?volver=${encodeURIComponent(pathname)}`)
    }
  }, [currentScreen, isLoggedIn, isBootstrappingSession, pathname, router])

  useEffect(() => {
    if (currentScreen === "catalog") lastCatalogUrl.current = `${pathname}?${searchParams.toString()}`
  }, [pathname, searchParams, currentScreen])

  useEffect(() => {
    let active = true
    setRouteError("")
    const code = pathname.split("/")[2]
    const load = async () => {
      if (!code || (privateScreens.includes(currentScreen) && !isLoggedIn)) return
      if (!["product-detail", "promotion-detail", "order-detail", "order-pdf"].includes(currentScreen)) return
      setRouteLoading(true)
      try {
        if (currentScreen === "product-detail") {
          const product = await productsService.getProductByCode(decodeURIComponent(code), true)
          if (active) setSelectedProduct(product)
        } else if (currentScreen === "promotion-detail") {
          const product = await productsService.getProductByCode(searchParams.get("producto") || "", true)
          if (!product.promotion || String(product.promotion.id) !== code) throw new Error("Promoción no disponible")
          if (active) await handleViewPromotion(product, false)
        } else {
          const orderId = pathname.split("/")[3]
          const order = await ordersService.getOrderById(decodeURIComponent(orderId || ""))
          if (active) setSelectedOrder(order as Order)
        }
      } catch {
        if (active) setRouteError("El contenido no está disponible o tu sesión venció. Intentá nuevamente.")
      } finally {
        if (active) setRouteLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [pathname, isLoggedIn, searchParams])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    document.getElementById("contenido")?.focus({ preventScroll: true })
  }, [pathname])

  const handleLogin = (rolId: number, usuarioId: string | number, rolNombre?: string) => {
    localStorage.setItem("rolId", String(rolId))
    localStorage.setItem("usuarioId", String(usuarioId))
    if (rolNombre) {
      localStorage.setItem("rolNombre", rolNombre)
    } else {
      localStorage.removeItem("rolNombre")
    }
    const { isAdminRole, canManageOrders } = resolveRoleFlags(rolId, rolNombre)
    setIsLoggedIn(true)
    setIsAdmin(isAdminRole)
    setCanManageSpecialOrders(canManageOrders)
    const owner = String(usuarioId)
    const merged = [...readCart(owner)]
    for (const item of cartOwner === "guest" ? cart : []) {
      const existing = merged.find((candidate) => candidate.cartKey === item.cartKey)
      if (existing) existing.quantity += item.quantity
      else merged.push(item)
    }
    writeCart(owner, merged)
    writeCart("guest", [])
    setCartOwner(owner)
    setCart(merged)
    const returnTo = searchParams.get("volver")
    router.replace(returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/")
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
    if (product !== undefined) {
      setSelectedProduct(product)
    }

    if (screen === "catalog") { router.push(lastCatalogUrl.current); return }
    router.push(screenPath(screen, product?.id))
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    navigateToScreen("product-detail", product)
  }

  const handleViewPromotion = async (product: Product, navigate = true) => {
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
    if (navigate) router.push(`/promociones/${product.promotion.id}?producto=${encodeURIComponent(product.id)}`)
  }

  const isReserveApproved = (productId: string) => approvedReserveProducts.includes(productId)

  const approveReserveForProduct = (productId: string) => {
    setApprovedReserveProducts((prev) => (prev.includes(productId) ? prev : [...prev, productId]))
  }

  const openCatalog = (category?: string, search?: string, preset: "promotions" | "default" = "default") => {
    const params = new URLSearchParams()
    if (category) params.set("categoria", category)
    if (search) params.set("buscar", search)
    router.push(`${preset === "promotions" ? "/promociones" : "/catalogo"}?${params}`)
  }

  const handleCheckout = async (payload: CreatePedidoPayload) => {
    if (submitInFlight.current) return
    submitInFlight.current = true
    try {
    const usuarioId = Number(localStorage.getItem("usuarioId") || 0)
    const payloadConUsuario = {
      ...payload,
      usuarioId: usuarioId > 0 ? usuarioId : undefined,
    }
    await ordersService.createOrder(payloadConUsuario)
    setLastOrderTotal(payload.total)
    setCart([])
    writeCart(cartOwner, [])
    navigateToScreen("orders")
    } finally { submitInFlight.current = false }
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

  const handleLogout = async () => {
    await authService.logout()
    localStorage.removeItem("rolId")
    localStorage.removeItem("rolNombre")
    localStorage.removeItem("usuarioId")
    setIsLoggedIn(false)
    setIsAdmin(false)
    setCanManageSpecialOrders(false)
    setApprovedReserveProducts([])
    setSelectedPromotion(null)
    setSelectedOrder(null)
    setPendingTransferOrder(null)
    setCartOwner("guest")
    setCart(readCart("guest"))
    router.push("/")
  }

  const renderScreen = () => {
    if (isBootstrappingSession && privateScreens.includes(currentScreen)) {
      return (
        <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Cargando sesion...
        </div>
      )
    }

    if (currentScreen === "login") {
      return <LoginScreen key={pathname} onLogin={handleLogin} initialRegister={pathname === "/solicitar-cuenta"} />
    }
    if (privateScreens.includes(currentScreen) && !isLoggedIn) return null
    if (currentScreen === "admin-carousel" && !isAdmin) return <p>No tenés permisos para administrar el contenido.</p>
    if (routeError) return <div className="store-empty" role="alert"><h1>No pudimos cargar el contenido</h1><p>{routeError}</p><Link href="/catalogo">Volver al catálogo</Link></div>
    if (routeLoading) return <div className="store-empty" role="status">Cargando contenido…</div>
    if (currentScreen === "checkout" && cart.length === 0) return <div className="store-empty"><h1>Tu carrito está vacío</h1><Link href="/catalogo">Explorar productos</Link></div>
    if (currentScreen === "transfer-payment" && !pendingTransferOrder) return <div className="store-empty"><h1>No hay una transferencia pendiente</h1><Link href="/carrito">Volver al carrito</Link></div>

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
            onOpenMenu={() => router.push("/catalogo")}
            isLoggedIn={isLoggedIn}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "catalog":
        return (
          <CatalogScreen
            onProductClick={handleProductClick}
            onNavigate={navigateToScreen}
            onOpenMenu={() => router.push("/catalogo")}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
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
            isAdmin={canManageSpecialOrders}
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
            canSelectCustomerAccount={canManageSpecialOrders}
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
              router.push(`/mi-cuenta/pedidos/${encodeURIComponent(order.id)}`)
            }}
            onOrderPdfClick={(order) => {
              setSelectedOrder(order)
              router.push(`/mi-cuenta/pedidos/${encodeURIComponent(order.id)}/pdf`)
            }}
            onNavigate={navigateToScreen}
            onOpenMenu={() => router.push("/catalogo")}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          />
        )
      case "account":
        return (
          <AccountScreen
            onNavigate={navigateToScreen}
            onOpenMenu={() => router.push("/catalogo")}
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
            onOpenMenu={() => router.push("/catalogo")}
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

  if (!isStorePath(pathname)) return null

  return (
    <div className="storefront min-h-screen bg-background">
      <StoreHeader isLoggedIn={isLoggedIn} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onLogout={handleLogout} />
      <main id="contenido" className={`store-content screen-${currentScreen}`} tabIndex={-1}>{renderScreen()}</main>
      <StoreFooter />
      <Toaster />

      {/* WhatsApp flotante global */}
      {currentScreen !== "login" && (
        <a
          href={`https://wa.me/${APP_CONSTANTS.WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola! Quiero consultar sobre productos de AFP Pinturas")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="store-whatsapp fixed w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-30 active:scale-95 transition-transform hover:scale-105"
          aria-label="Contactar por WhatsApp"
        >
          <img src="/images/whatsapp.svg" alt="WhatsApp" className="w-14 h-14" />
        </a>
      )}
    </div>
  )
}
