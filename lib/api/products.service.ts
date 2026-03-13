import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { Product } from "../types"

type ProductoApi = {
  id?: number
  codigo?: string
  nombre?: string
  precio?: number
  stock?: number
  rubroId?: number
  marcaId?: number
  urlImagen?: string
}

type RubroApi = { id: number; nombre: string }
type MarcaApi = { id: number; nombre: string }

export type ProductFilters = {
  category?: string
  brands?: string[]
  minPrice?: number
  maxPrice?: number
  search?: string
}

type PaginatedProductoApiResponse = {
  items: ProductoApi[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type PaginatedProductsResult = {
  items: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const productsService = {
  async getCatalogs() {
    const [rubros, marcas] = await Promise.all([
      apiClient.get<RubroApi[]>("/rubro").catch(() => []),
      apiClient.get<MarcaApi[]>("/marca").catch(() => []),
    ])

    const rubroMap = new Map(rubros.map((r) => [r.id, r.nombre]))
    const marcaMap = new Map(marcas.map((m) => [m.id, m.nombre]))
    return { rubroMap, marcaMap }
  },

  mapProducto(api: ProductoApi, rubroMap: Map<number, string>, marcaMap: Map<number, string>): Product {
    const category = api.rubroId ? rubroMap.get(api.rubroId) || `Rubro ${api.rubroId}` : "General"
    const brand = api.marcaId ? marcaMap.get(api.marcaId) || `Marca ${api.marcaId}` : "Sin marca"

    return {
      id: api.codigo || String(api.id || ""),
      name: api.nombre || "Producto sin nombre",
      price: Number(api.precio || 0),
      stock: Number(api.stock || 0),
      image: api.urlImagen || "/placeholder.svg",
      category,
      brand,
    }
  },

  async getProductsPaginated(page: number, limit: number, filters?: ProductFilters): Promise<PaginatedProductsResult> {
    const catalogs = await this.getCatalogs()

    const rubroByName = new Map(Array.from(catalogs.rubroMap.entries()).map(([id, name]) => [name, id]))
    const marcaByName = new Map(Array.from(catalogs.marcaMap.entries()).map(([id, name]) => [name, id]))

    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })

    if (filters?.search) {
      query.set("search", filters.search)
    }

    if (filters?.category && filters.category !== "Todas") {
      const rubroId = rubroByName.get(filters.category)
      if (rubroId) {
        query.set("rubroId", String(rubroId))
      }
    }

    if (filters?.brands && filters.brands.length > 0) {
      const marcaIds = filters.brands
        .map((brand) => marcaByName.get(brand))
        .filter((id): id is number => typeof id === "number")

      if (marcaIds.length > 0) {
        query.set("marcaIds", marcaIds.join(","))
      }
    }

    if (filters?.minPrice !== undefined) {
      query.set("minPrice", String(filters.minPrice))
    }

    if (filters?.maxPrice !== undefined) {
      query.set("maxPrice", String(filters.maxPrice))
    }

    const response = await apiClient.get<PaginatedProductoApiResponse>(`${API_ENDPOINTS.PRODUCTS.PAGINATED}?${query.toString()}`)

    return {
      items: response.items.map((p) => this.mapProducto(p, catalogs.rubroMap, catalogs.marcaMap)),
      total: response.total,
      page: response.page,
      limit: response.limit,
      totalPages: response.totalPages,
    }
  },

  /**
   * Obtiene todos los productos con filtros opcionales
   */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const [productosApi, catalogs] = await Promise.all([
        apiClient.get<ProductoApi[]>(API_ENDPOINTS.PRODUCTS.LIST),
        this.getCatalogs(),
      ])

      let productos = productosApi.map((p) => this.mapProducto(p, catalogs.rubroMap, catalogs.marcaMap))

      if (filters?.search) {
        const q = filters.search.toLowerCase()
        productos = productos.filter((p) => p.name.toLowerCase().includes(q))
      }

      if (filters?.category) {
        productos = productos.filter((p) => p.category === filters.category)
      }

      if (filters?.brands && filters.brands.length > 0) {
        productos = productos.filter((p) => filters.brands!.includes(p.brand || ""))
      }

      if (filters?.minPrice !== undefined) {
        productos = productos.filter((p) => p.price >= filters.minPrice!)
      }

      if (filters?.maxPrice !== undefined) {
        productos = productos.filter((p) => p.price <= filters.maxPrice!)
      }

      return productos
    } catch (error) {
      console.error("[v0] Error obteniendo productos:", error)
      throw error
    }
  },

  /**
   * Obtiene el detalle de un producto
   */
  async getProductById(id: string): Promise<Product> {
    const [productoApi, catalogs] = await Promise.all([
      apiClient.get<ProductoApi>(API_ENDPOINTS.PRODUCTS.DETAIL(id)),
      this.getCatalogs(),
    ])

    return this.mapProducto(productoApi, catalogs.rubroMap, catalogs.marcaMap)
  },

  /**
   * Busca productos por término
   */
  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ search: query })
  },

  /**
   * Obtiene productos por categoría
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.getProducts({ category })
  },

  /**
   * Obtiene productos por marca
   */
  async getProductsByBrand(brand: string): Promise<Product[]> {
    return this.getProducts({ brands: [brand] })
  },
}
