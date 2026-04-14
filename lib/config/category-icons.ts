import {
  Paintbrush,
  Home,
  Package,
  Wrench,
  HardHat,
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
  Grid2X2,
  type LucideIcon,
} from "lucide-react"

/**
 * Mapa de nombre de categoría (rubro) a ícono de Lucide.
 * Las keys se normalizan a minúsculas para comparar.
 *
 * Categorías actuales del backend (marzo 2026):
 *   ferretería, pintura, construcción, varios, hogar,
 *   productos varios, conceptos de compras, conceptos de ventas.
 *
 * Si las categorías cambian en el backend, actualizar este mapa.
 * Cualquier categoría no mapeada usará el ícono por defecto (Grid2X2).
 */
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  ferretería: Wrench,
  ferreteria: Wrench,
  pintura: Paintbrush,
  pinturas: Paintbrush,
  construcción: HardHat,
  construccion: HardHat,
  varios: Package,
  hogar: Home,
  "productos varios": Boxes,
  "conceptos de compras": ArrowDownCircle,
  "conceptos de ventas": ArrowUpCircle,
}

const DEFAULT_ICON: LucideIcon = Grid2X2

export function getCategoryIcon(categoryName: string): LucideIcon {
  const key = categoryName.toLowerCase().trim()
  return CATEGORY_ICON_MAP[key] || DEFAULT_ICON
}
