import type { Screen } from "@/lib/types"

const paths: Partial<Record<Screen, string>> = {
  home: "/", login: "/login", catalog: "/catalogo", cart: "/carrito", checkout: "/checkout",
  "transfer-payment": "/checkout/transferencia", orders: "/mi-cuenta/pedidos",
  account: "/mi-cuenta/cuenta-corriente", profile: "/mi-cuenta/perfil", "admin-carousel": "/admin/carruseles",
}
export const privateScreens: Screen[] = ["checkout", "transfer-payment", "orders", "order-detail", "order-pdf", "account", "profile", "admin-carousel"]
export function screenPath(screen: Screen, id?: string) {
  if (screen === "product-detail" && id) return `/productos/${encodeURIComponent(id)}`
  return paths[screen] || "/catalogo"
}
export function isStorePath(path: string) {
  return Object.values(paths).includes(path) || ["/promociones", "/solicitar-cuenta"].includes(path) ||
    /^\/(productos|promociones)\/[^/]+$/.test(path) || /^\/mi-cuenta\/pedidos\/[^/]+(\/pdf)?$/.test(path)
}
export function screenFromPath(path: string): Screen {
  if (path === "/promociones") return "catalog"
  if (path === "/solicitar-cuenta") return "login"
  if (/^\/productos\/[^/]+$/.test(path)) return "product-detail"
  if (/^\/promociones\/[^/]+$/.test(path)) return "promotion-detail"
  if (/^\/mi-cuenta\/pedidos\/[^/]+\/pdf$/.test(path)) return "order-pdf"
  if (/^\/mi-cuenta\/pedidos\/[^/]+$/.test(path)) return "order-detail"
  return (Object.entries(paths).find(([, value]) => value === path)?.[0] as Screen) || "home"
}
