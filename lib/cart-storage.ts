import type { CartItem } from "@/lib/types"

export function readCart(owner: string): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`afp-cart:v1:${owner}`) || "[]")
    if (!Array.isArray(saved)) return []
    return saved.filter((item): item is CartItem => item && ["product", "promotion"].includes(item.type) &&
      typeof item.cartKey === "string" && typeof item.id === "string" && typeof item.name === "string" &&
      Number.isFinite(item.price) && Number.isInteger(item.quantity) && item.quantity > 0 &&
      (item.type !== "promotion" || Array.isArray(item.includedItems)))
  } catch { return [] }
}
export function writeCart(owner: string, cart: CartItem[]) {
  try { localStorage.setItem(`afp-cart:v1:${owner}`, JSON.stringify(cart)) } catch { /* Shopping still works without storage. */ }
}
