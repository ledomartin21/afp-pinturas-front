import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { UserProfile, UpdateProfilePayload } from "../types"

class UserService {
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE)
  }

  async updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    return apiClient.put<UserProfile>(API_ENDPOINTS.USER.UPDATE, data)
  }
}

export const userService = new UserService()
