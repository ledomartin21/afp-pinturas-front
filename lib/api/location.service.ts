import { apiClient } from "./client"

export type LocationOption = {
  id: number
  nombre: string
}

type CityResponse = {
  data: LocationOption[]
}

class LocationService {
  async getProvinces(): Promise<LocationOption[]> {
    return apiClient.get<LocationOption[]>("/provincia?skip=0&take=500")
  }

  async getCitiesForProvince(provinceId: number): Promise<LocationOption[]> {
    const response = await apiClient.get<CityResponse>(`/ciudad/find-all-for/${provinceId}/select`)
    return response.data || []
  }
}

export const locationService = new LocationService()
