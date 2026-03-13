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
