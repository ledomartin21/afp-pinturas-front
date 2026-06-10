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
  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    const error = await parseErrorResponse(response)
    throw new ApiError(error.message, response.status, error.data)
  }

  return response.json()
}

async function parseErrorResponse(response: Response): Promise<{ message: string; data?: unknown }> {
  const contentType = response.headers.get("content-type") || ""
  const fallbackMessage = getStatusFallbackMessage(response.status)

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => undefined)
    return {
      message: extractErrorMessage(data) || fallbackMessage,
      data,
    }
  }

  const text = await response.text().catch(() => "")
  if (text && !looksLikeHtml(text)) {
    const extracted = extractErrorMessage(text)
    if (extracted) {
      return {
        message: extracted,
        data: text,
      }
    }
  }

  return {
    message: fallbackMessage,
    data: text,
  }
}

function extractErrorMessage(data: unknown): string | null {
  if (!data) return null

  if (typeof data === "string") {
    const normalized = data.trim()
    if (!normalized || looksLikeHtml(normalized)) return null
    return normalized
  }

  if (Array.isArray(data)) {
    const parts = data
      .map((item) => extractErrorMessage(item))
      .filter((item): item is string => Boolean(item))
    return parts.length > 0 ? parts.join(". ") : null
  }

  if (typeof data === "object") {
    const payload = data as {
      message?: unknown
      error?: unknown
      details?: unknown
      errors?: unknown
    }

    const fromMessage = extractErrorMessage(payload.message)
    if (fromMessage) return fromMessage

    const fromErrors = extractErrorMessage(payload.errors)
    if (fromErrors) return fromErrors

    const fromDetails = extractErrorMessage(payload.details)
    if (fromDetails) return fromDetails

    const fromError = extractErrorMessage(payload.error)
    if (fromError) return fromError

    for (const value of Object.values(payload)) {
      const nested = extractErrorMessage(value)
      if (nested) return nested
    }
  }

  return null
}

function looksLikeHtml(value: string) {
  return /^\s*<!doctype html|^\s*<html/i.test(value)
}

function getStatusFallbackMessage(status: number) {
  if (status === 0) return "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente."
  if (status === 400) return "La solicitud es inválida. Revisa los datos e intenta nuevamente."
  if (status === 401) return "Tu sesión venció o las credenciales son inválidas. Vuelve a iniciar sesión."
  if (status === 403) return "No tienes permisos para realizar esta acción."
  if (status === 404) return "No se encontró el recurso solicitado."
  if (status === 409) return "No se pudo completar la acción porque ya existe un conflicto de datos."
  if (status >= 500) return "Hubo un problema en el servidor. Intenta nuevamente en unos minutos."
  return `Error en la petición (HTTP ${status})`
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

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

async function request<T>(method: HttpMethod, url: string, data?: any, hasRetried = false): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
      method,
      headers: API_CONFIG.HEADERS,
      credentials: "include",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  } catch {
    throw new ApiError(getStatusFallbackMessage(0), 0)
  }

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

  async patch<T>(url: string, data?: any): Promise<T> {
    return request<T>("PATCH", url, data)
  },

  async upload<T>(url: string, formData: FormData, hasRetried = false): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${API_CONFIG.BASE_URL}${url}`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })
    } catch {
      throw new ApiError(getStatusFallbackMessage(0), 0)
    }

    if (response.status === 401 && !hasRetried) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiClient.upload<T>(url, formData, true)
      }
    }

    return handleResponse<T>(response)
  },
}
