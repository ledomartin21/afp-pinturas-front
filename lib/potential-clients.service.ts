import { apiClient } from "./api/client"
import { API_ENDPOINTS } from "./config/api"
import type { CreatePotentialClientPayload, PotentialClient } from "./types"

export const potentialClientsService = {
  async create(payload: CreatePotentialClientPayload): Promise<PotentialClient> {
    return apiClient.post<PotentialClient>(API_ENDPOINTS.CLIENTE_POTENCIAL.CREATE, payload)
  },
}