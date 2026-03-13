export type Screen =
  | "login"
  | "dashboard"
  | "catalog"
  | "product-detail"
  | "cart"
  | "checkout"
  | "orders"
  | "profile"
  | "invoices"

export type Product = {
  id: string
  name: string
  price: number
  stock: number
  image: string
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
}

// Carruseles y Flyers
export type Flyer = {
  id: number
  titulo: string | null
  url: string
  publicId: string
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
  rolId: number
}

export type UpdateProfilePayload = {
  razonSocial?: string
  mail?: string
  telefono?: string
  domicilio?: string
}
