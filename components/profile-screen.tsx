"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin, Bell, LogOut, ShieldCheck, Package, Heart, Loader2 } from "lucide-react"
import Image from "next/image"
import { userService } from "@/lib/api"
import type { UserProfile } from "@/lib/types"

interface ProfileScreenProps {
  onLogout: () => void
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Form fields
  const [razonSocial, setRazonSocial] = useState("")
  const [mail, setMail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [domicilio, setDomicilio] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const data = await userService.getProfile()
        setProfile(data)
        setRazonSocial(data.razonSocial || "")
        setMail(data.mail || "")
        setTelefono(data.telefono || "")
        setDomicilio(data.domicilio || "")
      } catch {
        setErrorMessage("No se pudo cargar el perfil")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setErrorMessage("")
      setSuccessMessage("")
      const updated = await userService.updateProfile({
        razonSocial,
        mail,
        telefono,
        domicilio,
      })
      setProfile(updated)
      setSuccessMessage("Perfil actualizado correctamente")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch {
      setErrorMessage("No se pudo guardar los cambios")
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-card border-b sticky top-0 z-10">
          <div className="h-1 bg-accent" />
          <div className="px-4 py-4 flex items-center gap-3">
            <Image src="/images/logo-afp.png" alt="AFP Pinturas" width={36} height={36} className="rounded" />
            <div>
              <h1 className="text-lg font-bold">Mi Perfil</h1>
              <p className="text-xs text-muted-foreground">Gestiona tu informacion personal</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="px-4 py-4 flex items-center gap-3">
          <Image src="/images/logo-afp.png" alt="AFP Pinturas" width={36} height={36} className="rounded" />
          <div>
            <h1 className="text-lg font-bold">Mi Perfil</h1>
            <p className="text-xs text-muted-foreground">Gestiona tu informacion personal</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Profile banner */}
        <div className="bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold border-2 border-white/40">
              {profile ? getInitials(profile.razonSocial || profile.nombreUsuario) : "?"}
            </div>
            <div>
              <h2 className="text-lg font-bold">{profile?.razonSocial || profile?.nombreUsuario || "Usuario"}</h2>
              <p className="text-sm text-white/80">{profile?.mail || ""}</p>
              <div className="flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-accent font-medium">Cliente verificado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 -mt-3">
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border">
            <Package className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">-</p>
            <p className="text-[10px] text-muted-foreground">Pedidos</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border">
            <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold">-</p>
            <p className="text-[10px] text-muted-foreground">Favoritos</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border">
            <ShieldCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">-</p>
            <p className="text-[10px] text-muted-foreground">Antiguedad</p>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {successMessage}
            </div>
          )}

          {/* Datos Personales */}
          <Card className="border overflow-hidden">
            <CardHeader className="bg-blue-50 border-b border-blue-100 py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs">Usuario</Label>
                <Input id="username" value={profile?.nombreUsuario || ""} disabled className="h-11 bg-muted/50" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs">Razon Social / Nombre</Label>
                <Input id="name" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" value={mail} onChange={(e) => setMail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Telefono</Label>
                <Input id="phone" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-11" />
              </div>
              <Button
                className="w-full h-11 bg-blue-500 text-white hover:bg-blue-600 font-semibold text-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Direccion */}
          <Card className="border overflow-hidden">
            <CardHeader className="bg-green-50 border-b border-green-100 py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Direccion de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs">Direccion</Label>
                <Input id="address" value={domicilio} onChange={(e) => setDomicilio(e.target.value)} className="h-11" />
              </div>
              <Button
                variant="outline"
                className="w-full h-11 border-green-300 text-green-700 hover:bg-green-50 font-semibold text-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  "Actualizar Direccion"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preferencias */}
          <Card className="border overflow-hidden">
            <CardHeader className="bg-amber-50 border-b border-amber-100 py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                Preferencias
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Notificaciones de Ofertas</p>
                  <p className="text-xs text-muted-foreground">Recibi novedades sobre promociones</p>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" id="notif-offers" />
                  <label htmlFor="notif-offers" className="block w-11 h-6 bg-muted rounded-full cursor-pointer peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Actualizaciones de Pedidos</p>
                  <p className="text-xs text-muted-foreground">Segui el estado de tus compras</p>
                </div>
                <div className="relative">
                  <input type="checkbox" defaultChecked className="peer sr-only" id="notif-orders" />
                  <label htmlFor="notif-orders" className="block w-11 h-6 bg-muted rounded-full cursor-pointer peer-checked:bg-accent transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cerrar sesion */}
          <Button
            variant="outline"
            className="w-full h-13 text-base font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesion
          </Button>

          <div className="pb-4" />
        </div>
      </div>
    </div>
  )
}
