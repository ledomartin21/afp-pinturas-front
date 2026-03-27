"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin, LogOut, ShieldCheck, Loader2, Menu, ShoppingCart } from "lucide-react"
import { userService } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import type { Screen } from "@/app/page"

interface ProfileScreenProps {
  onLogout: () => void
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cartCount: number
}

export function ProfileScreen({ onLogout, onNavigate, onOpenMenu, cartCount }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Form fields
  const [razonSocial, setRazonSocial] = useState("")
  const [mail, setMail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [province, setProvince] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const data = await userService.getProfile()
        setProfile(data)
        setRazonSocial(data.razonSocial || "")
        setMail(data.mail || "")
        setTelefono(data.telefono || "")
        // El backend almacena la dirección en un solo campo "domicilio".
        // Para igualar el formulario del checkout (4 campos separados),
        // se parsea como: "calle, ciudad, cp, provincia" al cargar
        // y se concatena con comas al guardar (ver handleSave).
        if (data.domicilio) {
          const parts = data.domicilio.split(",").map((p) => p.trim())
          setAddress(parts[0] || "")
          setCity(parts[1] || "")
          setPostalCode(parts[2] || "")
          setProvince(parts[3] || "")
        }
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
      const domicilio = [address, city, postalCode, province].filter(Boolean).join(", ")
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
      <div className="flex flex-col h-full bg-background">
        <div className="bg-primary px-4 pt-6 pb-8 rounded-b-xl shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <button onClick={onOpenMenu} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
              <Menu className="w-5 h-5 text-white" />
            </button>
            <img src="/images/logo.png" alt="AFP Pinturas" className="h-12 w-auto object-contain drop-shadow-md" />
            <button onClick={() => onNavigate("cart")} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative">
              <ShoppingCart className="w-5 h-5 text-white" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
          <h1 className="text-xl font-bold text-white text-center">Mi Perfil</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header dorado */}
      <div className="bg-primary px-4 pt-6 pb-8 rounded-b-xl shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <button onClick={onOpenMenu} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
            <Menu className="w-5 h-5 text-white" />
          </button>
          <img src="/images/logo.png" alt="AFP Pinturas" className="h-12 w-auto object-contain drop-shadow-md" />
          <button onClick={() => onNavigate("cart")} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30 relative">
            <ShoppingCart className="w-5 h-5 text-white" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Avatar y nombre en el header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold text-white border-2 border-white/40">
            {profile ? getInitials(profile.razonSocial || profile.nombreUsuario) : "?"}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{profile?.razonSocial || profile?.nombreUsuario || "Usuario"}</h2>
            <p className="text-sm text-white/80">{profile?.mail || ""}</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-white/90" />
              <span className="text-xs text-white/90 font-medium">Cliente verificado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6">
        <div className="mt-4 space-y-4">
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
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/15 py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
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
                <Label htmlFor="name" className="text-xs">Razón Social / Nombre</Label>
                <Input id="name" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" value={mail} onChange={(e) => setMail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                <Input id="phone" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="h-11" />
              </div>
              <Button
                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-sm"
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
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/10 border-b border-primary/15 py-3 px-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                Dirección de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="profile-address" className="text-xs">Dirección</Label>
                <Input id="profile-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ingresa tu dirección" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-city" className="text-xs">Ciudad</Label>
                  <Input id="profile-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ciudad" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-postal" className="text-xs">C.P.</Label>
                  <Input id="profile-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="Código Postal" className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-province" className="text-xs">Provincia</Label>
                <Input id="profile-province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Provincia" className="h-11" />
              </div>
              <Button
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 font-semibold text-sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </span>
                ) : (
                  "Actualizar Dirección"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cerrar sesion */}
          <Button
            variant="outline"
            className="w-full h-13 text-base font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>

          <div className="pb-4" />
        </div>
      </div>
    </div>
  )
}
