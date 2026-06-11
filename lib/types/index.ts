export type Screen =
  | "login"
  | "dashboard"
  | "catalog"
  | "product-detail"
  | "cart"
  | "checkout"
  | "orders"
  | "account"
  | "profile"
  | "invoices"

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
  promotion?: PromotionSummary
  description?: string
}

export type PromotionSummary = {
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

export type Invoice = {
  id: string
  orderNumber: string
  date: string
  total: number
  subtotal: number
  tax: number
  items: {
    id: string
    name: string
    quantity: number
    price: number
  }[]
  customerInfo: {
    name: string
    email: string
    address: string
  }
}

export type User = {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

export type LoginCredentials = {
  nombreUsuario: string
  contrasena: string
}

export type RegisterPayload = {
  nombreUsuario: string
  razonSocial: string
  mail: string
  telefono: string
  domicilio: string
  contrasena: string
}

export type LoginResponse = {
  usuarioId: string | number
  rolId: number
  rolNombre?: string
}

export type CustomerAccountOption = {
  cuenta: string
  nombre: string
  label: string
}

export type PotentialClient = {
  id: number
  nombre: string
  razonSocial: string
  cuit: string
  email?: string | null
  telefono?: string | null
  domicilio?: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePotentialClientPayload = {
  nombre: string
  razonSocial: string
  cuit: string
  email?: string
  telefono?: string
  domicilio?: string
}

// Carruseles y Flyers
export type Flyer = {
  id: number
  titulo: string | null
  url: string
  publicId: string
  archivoNombreOriginal?: string | null
  archivoRuta?: string | null
  carruselId: number
  createdAt: string
}

export type Carrusel = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  createdAt: string
  flyers?: Flyer[]
}

export type CreateCarruselPayload = {
  nombre: string
  descripcion?: string
  activo?: boolean
}

export type UpdateCarruselPayload = {
  nombre?: string
  descripcion?: string
  activo?: boolean
}

// Perfil de usuario
export type UserProfile = {
  id: number | string
  nombreUsuario: string
  razonSocial: string
  mail: string
  telefono: string
  domicilio: string
  cuenta?: string | null
  provinciaId?: number
  ciudadId?: number
  rolId: number
}

export type UpdateProfilePayload = {
  razonSocial?: string
  mail?: string
  telefono?: string
  domicilio?: string
  provinciaId?: number
  ciudadId?: number
  contrasena?: string
}

export type AccountComprobante = {
  cuenta: string
  fecha: string | null
  abreviatura: string
  comprobante: string
  importeCbte: number
  saldo: number
}

export type AccountStatus = {
  cuenta: string
  totalComprobantes: number
  totalSaldoAbierto: number
  comprobantes: AccountComprobante[]
}
