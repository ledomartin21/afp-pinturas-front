"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MapPin, Bell, LogOut, ShieldCheck, Package, Heart } from "lucide-react"
import Image from "next/image"

interface ProfileScreenProps {
  onLogout: () => void
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
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
              JP
            </div>
            <div>
              <h2 className="text-lg font-bold">Juan Perez</h2>
              <p className="text-sm text-white/80">juan.perez@email.com</p>
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
            <p className="text-lg font-bold">12</p>
            <p className="text-[10px] text-muted-foreground">Pedidos</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border">
            <Heart className="w-5 h-5 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold">5</p>
            <p className="text-[10px] text-muted-foreground">Favoritos</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center shadow-sm border">
            <ShieldCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">2a</p>
            <p className="text-[10px] text-muted-foreground">Antiguedad</p>
          </div>
        </div>

        <div className="p-4 pt-0 space-y-4">
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
                <Label htmlFor="name" className="text-xs">Nombre Completo</Label>
                <Input id="name" defaultValue="Juan Perez" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" defaultValue="juan.perez@email.com" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Telefono</Label>
                <Input id="phone" type="tel" defaultValue="+54 9 11 1234-5678" className="h-11" />
              </div>
              <Button className="w-full h-11 bg-blue-500 text-white hover:bg-blue-600 font-semibold text-sm">
                Guardar Cambios
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
                <Input id="address" defaultValue="Av. Corrientes 1234" className="h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">Ciudad</Label>
                  <Input id="city" defaultValue="CABA" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal" className="text-xs">C.P.</Label>
                  <Input id="postal" defaultValue="C1043" className="h-11" />
                </div>
              </div>
              <Button variant="outline" className="w-full h-11 border-green-300 text-green-700 hover:bg-green-50 font-semibold text-sm">
                Actualizar Direccion
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
