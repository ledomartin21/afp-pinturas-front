import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { UserProfile, UpdateProfilePayload, AccountStatus, CustomerAccountOption } from "../types"

class UserService {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE)
  }

  async updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    return apiClient.put<UserProfile>(API_ENDPOINTS.USER.UPDATE, data)
  }

  async getAccountStatus(): Promise<AccountStatus> {
    return apiClient.get<AccountStatus>(API_ENDPOINTS.USER.ACCOUNT)
  }

  async searchCustomerAccounts(query: string, limit = 10): Promise<CustomerAccountOption[]> {
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set("q", query.trim())
    }
    params.set("limit", String(limit))

    return apiClient.get<CustomerAccountOption[]>(`${API_ENDPOINTS.USER.CUSTOMER_ACCOUNTS}?${params.toString()}`)
  }
}

export const userService = new UserService()
