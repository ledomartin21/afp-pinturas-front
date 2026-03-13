export const API_CONFIG = {
  BASE_URL: "/api",
  TIMEOUT: 30000,
  HEADERS: {
    "Content-Type": "application/json",
  },
};

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REGISTER: "/auth/registrar",
    REFRESH: "/auth/refresh",
    VERIFY: "/auth/verify",
  },
  // Productos
  PRODUCTS: {
    LIST: "/producto",
    PAGINATED: "/producto/paginado",
    DETAIL: (id: string) => `/producto/${id}`,
    SEARCH: "/producto",
    BY_CATEGORY: (_category: string) => `/producto`,
    BY_BRAND: (_brand: string) => `/producto`,
  },
  // Carrito y Pedidos
  ORDERS: {
    CREATE: "/pedido",
    LIST: "/pedido",
    DETAIL: (id: string) => `/pedido/${id}`,
    UPDATE_STATUS: (id: string) => `/pedido/${id}`,
  },
  // Facturas
  INVOICES: {
    LIST: "/invoices",
    DETAIL: (id: string) => `/invoices/${id}`,
    DOWNLOAD_PDF: (id: string) => `/invoices/${id}/pdf`,
  },
  // Usuario
  USER: {
    PROFILE: "/user/profile",
    UPDATE: "/user/profile",
  },
  // Carruseles
  CAROUSEL: {
    LIST: "/carrusel",
    DETAIL: (id: number) => `/carrusel/${id}`,
    CREATE: "/carrusel",
    UPDATE: (id: number) => `/carrusel/${id}`,
    DELETE: (id: number) => `/carrusel/${id}`,
  },
  // Flyers
  FLYER: {
    LIST: "/flyer",
    DETAIL: (id: number) => `/flyer/${id}`,
    CREATE: "/flyer",
    DELETE: (id: number) => `/flyer/${id}`,
  },
};
