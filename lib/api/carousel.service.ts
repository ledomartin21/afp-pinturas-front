import { apiClient } from "./client"
import { API_ENDPOINTS } from "../config/api"
import type { Carrusel, Flyer, CreateCarruselPayload, UpdateCarruselPayload } from "../types"

class CarouselService {
  async getCarousels(): Promise<Carrusel[]> {
    return apiClient.get<Carrusel[]>(API_ENDPOINTS.CAROUSEL.LIST)
  }

  async getCarouselById(id: number): Promise<Carrusel> {
    return apiClient.get<Carrusel>(API_ENDPOINTS.CAROUSEL.DETAIL(id))
  }

  async createCarousel(data: CreateCarruselPayload): Promise<Carrusel> {
    return apiClient.post<Carrusel>(API_ENDPOINTS.CAROUSEL.CREATE, data)
  }

  async updateCarousel(id: number, data: UpdateCarruselPayload): Promise<Carrusel> {
    return apiClient.patch<Carrusel>(API_ENDPOINTS.CAROUSEL.UPDATE(id), data)
  }

  async deleteCarousel(id: number): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CAROUSEL.DELETE(id))
  }

  async uploadFlyer(file: File, carruselId: number, titulo?: string): Promise<Flyer> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("carruselId", String(carruselId))
    if (titulo) {
      formData.append("titulo", titulo)
    }
    return apiClient.upload<Flyer>(API_ENDPOINTS.FLYER.CREATE, formData)
  }

  async getFlyers(): Promise<Flyer[]> {
    return apiClient.get<Flyer[]>(API_ENDPOINTS.FLYER.LIST)
  }

  async getFlyerById(id: number): Promise<Flyer> {
    return apiClient.get<Flyer>(API_ENDPOINTS.FLYER.DETAIL(id))
  }

  async deleteFlyer(id: number): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.FLYER.DELETE(id))
  }
}

export const carouselService = new CarouselService()
