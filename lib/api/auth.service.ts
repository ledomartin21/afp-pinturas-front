import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { LoginCredentials, LoginResponse, RegisterPayload, User } from "../types"

export const authService = {
  /**
   * Inicia sesión con nombreUsuario y contrasena
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      return await apiClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
    } catch (error) {
      console.error("[v0] Error en login:", error)
      throw error
    }
  },

  async register(payload: RegisterPayload): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload)
    } catch (error) {
      console.error("[v0] Error en registro:", error)
      throw error
    }
  },

  async refresh(): Promise<boolean> {
    try {
      return await apiClient.get<boolean>(API_ENDPOINTS.AUTH.REFRESH)
    } catch {
      return false
    }
  },

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error("[v0] Error en logout:", error)
    }
  },

  /**
   * Verifica si el token es válido
   */
  async verifyToken(): Promise<User> {
    return apiClient.get<User>(API_ENDPOINTS.AUTH.VERIFY)
  },
}
