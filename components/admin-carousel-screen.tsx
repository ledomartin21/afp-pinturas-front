"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react"
import { carouselService } from "@/lib/api"
import type { Carrusel, Flyer } from "@/lib/types"

interface AdminCarouselScreenProps {
  onBack: () => void
}

type AdminView = "list" | "detail" | "create"

export function AdminCarouselScreen({ onBack }: AdminCarouselScreenProps) {
  const [view, setView] = useState<AdminView>("list")
  const [carousels, setCarousels] = useState<Carrusel[]>([])
  const [selectedCarousel, setSelectedCarousel] = useState<Carrusel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Create form
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Edit inline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Upload
  const [isUploading, setIsUploading] = useState(false)
  const [flyerTitle, setFlyerTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: "carousel" | "flyer"; id: number; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(""), 3000)
  }

  const loadCarousels = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await carouselService.getCarousels()
      setCarousels(data)
    } catch {
      setError("No se pudieron cargar los carruseles")
    } finally {
      setIsLoading(false)
    }
  }

  const loadCarouselDetail = async (id: number) => {
    try {
      setIsLoading(true)
      setError("")
      const data = await carouselService.getCarouselById(id)
      setSelectedCarousel(data)
    } catch {
      setError("No se pudo cargar el carrusel")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCarousels()
  }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      setIsCreating(true)
      setError("")
      await carouselService.createCarousel({
        nombre: newName.trim(),
        descripcion: newDescription.trim() || undefined,
      })
      setNewName("")
      setNewDescription("")
      setView("list")
      showSuccess("Carrusel creado")
      await loadCarousels()
    } catch {
      setError("No se pudo crear el carrusel")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (carousel: Carrusel) => {
    try {
      setError("")
      await carouselService.updateCarousel(carousel.id, { activo: !carousel.activo })
      showSuccess(carousel.activo ? "Carrusel desactivado" : "Carrusel activado")
      await loadCarousels()
      if (selectedCarousel?.id === carousel.id) {
        setSelectedCarousel({ ...carousel, activo: !carousel.activo })
      }
    } catch {
      setError("No se pudo actualizar el carrusel")
    }
  }

  const handleSaveEdit = async (id: number) => {
    try {
      setIsSavingEdit(true)
      setError("")
      await carouselService.updateCarousel(id, {
        nombre: editName.trim(),
        descripcion: editDescription.trim() || undefined,
      })
      setEditingId(null)
      showSuccess("Carrusel actualizado")
      await loadCarousels()
    } catch {
      setError("No se pudo actualizar el carrusel")
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      setError("")
      if (deleteTarget.type === "carousel") {
        await carouselService.deleteCarousel(deleteTarget.id)
        showSuccess("Carrusel eliminado")
        if (selectedCarousel?.id === deleteTarget.id) {
          setView("list")
          setSelectedCarousel(null)
        }
        await loadCarousels()
      } else {
        await carouselService.deleteFlyer(deleteTarget.id)
        showSuccess("Flyer eliminado")
        if (selectedCarousel) {
          await loadCarouselDetail(selectedCarousel.id)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo eliminar"
      setError(message.includes("409") || message.includes("Conflict")
        ? "Elimina los flyers del carrusel antes de eliminarlo"
        : message)
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleUploadFlyer = async (file: File) => {
    if (!selectedCarousel) return
    try {
      setIsUploading(true)
      setError("")
      await carouselService.uploadFlyer(file, selectedCarousel.id, flyerTitle.trim() || undefined)
      setFlyerTitle("")
      showSuccess("Flyer subido")
      await loadCarouselDetail(selectedCarousel.id)
    } catch {
      setError("No se pudo subir el flyer")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUploadFlyer(file)
    }
    e.target.value = ""
  }

  const openCarouselDetail = async (carousel: Carrusel) => {
    setView("detail")
    await loadCarouselDetail(carousel.id)
  }

  // --- RENDERS ---

  const renderHeader = (title: string, showBack = true) => (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="h-1 bg-accent" />
      <div className="p-3 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => {
              if (view === "detail" || view === "create") {
                setView("list")
                setSelectedCarousel(null)
                setEditingId(null)
              } else {
                onBack()
              }
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-bold flex-1">{title}</h1>
      </div>
    </header>
  )

  const renderMessages = () => (
    <>
      {error && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}
    </>
  )

  // LIST VIEW
  if (view === "list") {
    return (
      <div className="flex flex-col h-full">
        {renderHeader("Carruseles")}
        {renderMessages()}

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {carousels.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No hay carruseles creados</p>
                </div>
              ) : (
                carousels.map((carousel) => (
                  <Card
                    key={carousel.id}
                    className="border overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
                    onClick={() => openCarouselDetail(carousel)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">{carousel.nombre}</h3>
                          <Badge
                            variant={carousel.activo ? "default" : "secondary"}
                            className="text-[10px] shrink-0"
                          >
                            {carousel.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        {carousel.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{carousel.descripcion}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-card border-t p-4">
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={() => setView("create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Carrusel
          </Button>
        </div>
      </div>
    )
  }

  // CREATE VIEW
  if (view === "create") {
    return (
      <div className="flex flex-col h-full">
        {renderHeader("Nuevo Carrusel")}
        {renderMessages()}

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="carousel-name" className="text-xs">Nombre *</Label>
            <Input
              id="carousel-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej: Hero principal"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="carousel-desc" className="text-xs">Descripcion (opcional)</Label>
            <Input
              id="carousel-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ej: Banner principal de la tienda"
              className="h-11"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t p-4">
          <Button
            className="w-full h-12 text-sm font-semibold"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creando...
              </span>
            ) : (
              "Crear Carrusel"
            )}
          </Button>
        </div>
      </div>
    )
  }

  // DETAIL VIEW
  return (
    <div className="flex flex-col h-full">
      {renderHeader(selectedCarousel?.nombre || "Carrusel")}
      {renderMessages()}

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : selectedCarousel ? (
          <div className="p-4 space-y-4">
            {/* Info del carrusel */}
            <Card className="border overflow-hidden">
              <CardHeader className="bg-blue-50 border-b border-blue-100 py-3 px-4">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Informacion
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (editingId === selectedCarousel.id) {
                          setEditingId(null)
                        } else {
                          setEditingId(selectedCarousel.id)
                          setEditName(selectedCarousel.nombre)
                          setEditDescription(selectedCarousel.descripcion || "")
                        }
                      }}
                      className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(selectedCarousel)}
                      className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
                      title={selectedCarousel.activo ? "Desactivar" : "Activar"}
                    >
                      {selectedCarousel.activo ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {editingId === selectedCarousel.id ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nombre</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Descripcion</Label>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSaveEdit(selectedCarousel.id)}
                        disabled={isSavingEdit}
                      >
                        {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground">Nombre</p>
                      <p className="font-medium text-sm">{selectedCarousel.nombre}</p>
                    </div>
                    {selectedCarousel.descripcion && (
                      <div>
                        <p className="text-xs text-muted-foreground">Descripcion</p>
                        <p className="text-sm">{selectedCarousel.descripcion}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedCarousel.activo ? "default" : "secondary"}>
                        {selectedCarousel.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedCarousel.flyers?.length || 0} flyers
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subir flyer */}
            <Card className="border overflow-hidden">
              <CardHeader className="bg-green-50 border-b border-green-100 py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  Subir Flyer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Titulo (opcional)</Label>
                  <Input
                    value={flyerTitle}
                    onChange={(e) => setFlyerTitle(e.target.value)}
                    placeholder="Ej: Banner verano"
                    className="h-10"
                  />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full h-11 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Subiendo...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Seleccionar Imagen
                    </span>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Formatos: JPEG, PNG, WebP, GIF. Max 10 MB.
                </p>
              </CardContent>
            </Card>

            {/* Lista de flyers */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold">
                Flyers ({selectedCarousel.flyers?.length || 0})
              </h3>
              {!selectedCarousel.flyers || selectedCarousel.flyers.length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-xl">
                  <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay flyers en este carrusel</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {selectedCarousel.flyers.map((flyer) => (
                    <Card key={flyer.id} className="border overflow-hidden">
                      <div className="relative">
                        <img
                          src={flyer.url}
                          alt={flyer.titulo || "Flyer"}
                          className="w-full aspect-video object-cover"
                        />
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: "flyer",
                              id: flyer.id,
                              name: flyer.titulo || `Flyer #${flyer.id}`,
                            })
                          }
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg shadow-md hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate">
                          {flyer.titulo || `Flyer #${flyer.id}`}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Eliminar carrusel */}
            <Button
              variant="outline"
              className="w-full h-11 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() =>
                setDeleteTarget({
                  type: "carousel",
                  id: selectedCarousel.id,
                  name: selectedCarousel.nombre,
                })
              }
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Carrusel
            </Button>
          </div>
        ) : null}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "carousel"
                ? `Vas a eliminar el carrusel "${deleteTarget.name}". Esta accion no se puede deshacer. El carrusel debe estar vacio (sin flyers).`
                : `Vas a eliminar "${deleteTarget?.name}". La imagen se eliminara de Cloudinary y no se puede recuperar.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 mt-0" disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
