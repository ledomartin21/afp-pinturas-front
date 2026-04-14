import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { Order } from "../types"
import { productsService } from "./products.service"

export type CreatePedidoPayload = {
  usuarioId?: number
  metodoEntrega: "delivery" | "pickup"
  metodoPago: "transfer" | "cash"
  subtotal: number
  descuentoTotal?: number
  costoEnvio?: number
  total: number
  observaciones?: string
  direccionEntrega?: {
    calle: string
    ciudad: string
    codigoPostal: string
    provincia?: string
  }
  detalles: Array<{
    productoId: string
    cantidad: number
    descuentoPorcentaje?: number
  }>
}

export type PedidoResponse = {
  id: string
  usuarioId?: number | null
  creadoEn?: string
  metodoEntrega: "delivery" | "pickup"
  metodoPago: "transfer" | "cash" | "card"
  estado: "pendiente" | "procesando" | "en_camino" | "entregado" | "pending" | "processing" | "shipped" | "delivered"
  estadoPago: "pendiente" | "pagado" | "rechazado" | "pending" | "paid" | "rejected"
  subtotal: number
  descuentoTotal: number
  costoEnvio: number
  total: number
  direccionEntrega?: {
    calle: string
    ciudad: string
    codigoPostal: string
    provincia?: string
  } | null
  detalles?: Array<{
    id: string
    pedidoId?: string
    productoId: string
    cantidad: number
    precioUnitario: number
    descuentoPorcentaje: number
    subtotalLinea: number
  }>
}

const STATUS_MAP: Record<string, Order["status"]> = {
  pendiente: "pending",
  procesando: "processing",
  en_camino: "shipped",
  entregado: "delivered",
  pending: "pending",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
}

const PAYMENT_STATUS_MAP: Record<string, NonNullable<Order["paymentStatus"]>> = {
  pendiente: "pending",
  pagado: "paid",
  rechazado: "rejected",
  pending: "pending",
  paid: "paid",
  rejected: "rejected",
}

function mapPedidoToOrder(
  pedido: PedidoResponse,
  productsById: Map<string, Awaited<ReturnType<typeof productsService.getProducts>>[number]>,
): Order {
  const items = (pedido.detalles || []).map((detalle) => {
    const product = productsById.get(detalle.productoId.trim())
    return {
      id: detalle.productoId.trim(),
      name: product?.name || `Producto ${detalle.productoId.trim()}`,
      price: Number(detalle.precioUnitario || 0),
      stock: product?.stock || 0,
      image: product?.image || "/placeholder.svg",
      category: product?.category || "General",
      brand: product?.brand,
      quantity: detalle.cantidad,
      discount: Number(detalle.descuentoPorcentaje || 0),
    }
  })

  return {
    id: pedido.id,
    date: pedido.creadoEn || new Date().toISOString(),
    total: Number(pedido.total || 0),
    status: STATUS_MAP[pedido.estado] || "pending",
    items,
    deliveryMethod: pedido.metodoEntrega,
    paymentMethod: pedido.metodoPago,
    paymentStatus: PAYMENT_STATUS_MAP[pedido.estadoPago] || "pending",
    address: pedido.direccionEntrega || null,
  }
}

export const ordersService = {
  /**
   * Crea un nuevo pedido
   */
  async createOrder(data: CreatePedidoPayload): Promise<PedidoResponse> {
    try {
      return await apiClient.post<PedidoResponse>(API_ENDPOINTS.ORDERS.CREATE, data)
    } catch (error) {
      console.error("[v0] Error creando pedido:", error)
      throw error
    }
  },

  /**
   * Obtiene todos los pedidos del usuario
   */
  async getOrders(): Promise<Order[]> {
    try {
      const [pedidos, productos] = await Promise.all([
        apiClient.get<PedidoResponse[]>(API_ENDPOINTS.ORDERS.LIST),
        productsService.getProducts().catch(() => []),
      ])

      const productsById = new Map(productos.map((p) => [p.id.trim(), p]))

      return pedidos.map((pedido) => mapPedidoToOrder(pedido, productsById))
    } catch (error) {
      console.error("[v0] Error obteniendo pedidos:", error)
      throw error
    }
  },

  /**
   * Obtiene el detalle de un pedido
   */
  async getOrderById(id: string): Promise<Order> {
    const [pedido, productos] = await Promise.all([
      apiClient.get<PedidoResponse>(API_ENDPOINTS.ORDERS.DETAIL(id)),
      productsService.getProducts().catch(() => []),
    ])
    const productsById = new Map(productos.map((p) => [p.id.trim(), p]))
    return mapPedidoToOrder(pedido, productsById)
  },

  /**
   * Actualiza el estado de un pedido (solo admin)
   */
  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order> {
    return apiClient.put<Order>(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status })
  },
}
