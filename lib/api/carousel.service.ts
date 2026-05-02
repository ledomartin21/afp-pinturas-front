import { apiClient } from "./client"
import { API_CONFIG, API_ENDPOINTS } from "../config/api"
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

  async uploadFlyer(file: File, carruselId: number, titulo?: string, archivo?: File): Promise<Flyer> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("carruselId", String(carruselId))
    if (titulo) {
      formData.append("titulo", titulo)
    }
    if (archivo) {
      formData.append("archivo", archivo)
    }
    return apiClient.upload<Flyer>(API_ENDPOINTS.FLYER.CREATE, formData)
  }

  getFlyerDownloadUrl(flyer: Pick<Flyer, "id">): string {
    const path = API_ENDPOINTS.FLYER.DOWNLOAD(flyer.id)
    return `${API_CONFIG.DOWNLOAD_BASE_URL}${path}`
  }

  async downloadFlyerFile(flyer: Pick<Flyer, "id" | "archivoNombreOriginal">): Promise<void> {
    const response = await fetch(this.getFlyerDownloadUrl(flyer), {
      method: "GET",
      credentials: "include",
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      throw new Error(text || "No se pudo descargar el archivo")
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = flyer.archivoNombreOriginal || `flyer-${flyer.id}`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
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
