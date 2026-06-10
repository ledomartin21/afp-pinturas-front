import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { UserProfile, UpdateProfilePayload, AccountStatus } from "../types"

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
}

export const userService = new UserService()
