import { API_CONFIG } from "../config/api"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error desconocido" }))
    throw new ApiError(error.message || "Error en la petición", response.status, error)
  }

  return response.json()
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/refresh`, {
      method: "GET",
      headers: API_CONFIG.HEADERS,
      credentials: "include",
    })
    return response.ok
  } catch {
    return false
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

async function request<T>(method: HttpMethod, url: string, data?: any, hasRetried = false): Promise<T> {
  const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
    method,
    headers: API_CONFIG.HEADERS,
    credentials: "include",
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })

  if (response.status === 401 && !hasRetried) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(method, url, data, true)
    }
  }

  return handleResponse<T>(response)
}

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    return request<T>("GET", url)
  },

  async post<T>(url: string, data?: any): Promise<T> {
    return request<T>("POST", url, data)
  },

  async put<T>(url: string, data?: any): Promise<T> {
    return request<T>("PUT", url, data)
  },

  async delete<T>(url: string): Promise<T> {
    return request<T>("DELETE", url)
  },
}
