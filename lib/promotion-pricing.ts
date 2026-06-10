import type { CartItem } from "@/app/page"

type LinePricing = {
  baseTotal: number
  finalTotal: number
  discountAmount: number
  effectiveDiscountPercent: number
  unitPrice: number
}

export function calculateLinePricing(item: CartItem, quantity = item.quantity): LinePricing {
  const qty = Math.max(0, Number(quantity || 0))
  const price = Number(item.price || 0)
  const baseTotal = Number((price * qty).toFixed(2))

  if (item.type === "promotion") {
    return {
      baseTotal,
      finalTotal: baseTotal,
      discountAmount: 0,
      effectiveDiscountPercent: 0,
      unitPrice: price,
    }
  }

  if (qty === 0 || price <= 0) {
    return { baseTotal, finalTotal: 0, discountAmount: 0, effectiveDiscountPercent: 0, unitPrice: 0 }
  }

  const manualDiscount = Number(item.discount || 0)
  if (manualDiscount > 0) {
    const discountAmount = Number((baseTotal * (manualDiscount / 100)).toFixed(2))
    const finalTotal = Number((baseTotal - discountAmount).toFixed(2))
    return {
      baseTotal,
      finalTotal,
      discountAmount,
      effectiveDiscountPercent: Number(((discountAmount / baseTotal) * 100).toFixed(4)),
      unitPrice: Number((finalTotal / qty).toFixed(2)),
    }
  }

  const promo = item.promotion
  if (!promo?.aplicaEnCheckout) {
    return { baseTotal, finalTotal: baseTotal, discountAmount: 0, effectiveDiscountPercent: 0, unitPrice: price }
  }

  if (promo.tipo === "porcentaje") {
    const discountAmount = Number((baseTotal * (Number(promo.valor || 0) / 100)).toFixed(2))
    const finalTotal = Number((baseTotal - discountAmount).toFixed(2))
    return {
      baseTotal,
      finalTotal,
      discountAmount,
      effectiveDiscountPercent: Number(((discountAmount / baseTotal) * 100).toFixed(4)),
      unitPrice: Number((finalTotal / qty).toFixed(2)),
    }
  }

  if (promo.tipo === "nxm") {
    const lleva = Number(promo.cantidadLleva || 0)
    const paga = Number(promo.cantidadPaga || 0)
    if (lleva > paga && paga > 0) {
      const packs = Math.floor(qty / lleva)
      const remainder = qty % lleva
      const payableUnits = packs * paga + remainder
      const finalTotal = Number((payableUnits * price).toFixed(2))
      const discountAmount = Number((baseTotal - finalTotal).toFixed(2))
      return {
        baseTotal,
        finalTotal,
        discountAmount,
        effectiveDiscountPercent: Number(((discountAmount / baseTotal) * 100).toFixed(4)),
        unitPrice: Number((finalTotal / qty).toFixed(2)),
      }
    }
  }

  if (promo.tipo === "combo_fijo") {
    const comboPrice = Number(promo.comboPrecioFijo || 0)
    if (comboPrice > 0) {
      const pairs = Math.floor(qty / 2)
      const remainder = qty % 2
      const finalTotal = Number((pairs * comboPrice + remainder * price).toFixed(2))
      const discountAmount = Number((baseTotal - finalTotal).toFixed(2))
      return {
        baseTotal,
        finalTotal,
        discountAmount,
        effectiveDiscountPercent: Number(((discountAmount / baseTotal) * 100).toFixed(4)),
        unitPrice: Number((finalTotal / qty).toFixed(2)),
      }
    }
  }

  return { baseTotal, finalTotal: baseTotal, discountAmount: 0, effectiveDiscountPercent: 0, unitPrice: price }
}
