"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiError, authService, potentialClientsService } from "@/lib/api"

interface LoginScreenProps {
  onLogin: (rolId: number, usuarioId: string | number, rolNombre?: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [cuit, setCuit] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    try {
      setIsSubmitting(true)

      if (isRegister) {
        const normalizedCuit = cuit.replace(/\D/g, "")

        if (!nombreUsuario.trim() || !razonSocial.trim() || !normalizedCuit) {
          setErrorMessage("Por favor completa usuario, razón social/nombre y CUIT")
          return
        }

        if (normalizedCuit.length !== 11) {
          setErrorMessage("El CUIT debe tener 11 dígitos")
          return
        }

        if (!email.trim() && !telefono.trim()) {
          setErrorMessage("Debe proporcionar correo o teléfono (al menos uno).")
          return
        }

        await potentialClientsService.create({
          nombre: nombreUsuario.trim(),
          razonSocial: razonSocial.trim(),
          cuit: normalizedCuit,
          email: email.trim() || undefined,
          telefono: telefono.trim() || undefined,
        })

        setSuccessMessage("Solicitud enviada. El equipo te va a contactar para crear tu usuario.")
        setIsRegister(false)
        setNombreUsuario("")
        setRazonSocial("")
        setCuit("")
        setEmail("")
        setTelefono("")
        return
      }

      const response = await authService.login({ nombreUsuario, contrasena })
      onLogin(response.rolId, response.usuarioId, response.rolNombre)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message)
        return
      }

      setErrorMessage(isRegister ? "No se pudo enviar la solicitud" : "Credenciales inválidas o servidor no disponible")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-b from-muted to-background">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-accent">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img
              src="/images/logo-afp.png"
              alt="AFP Pinturas"
              className="h-24 w-auto mx-auto"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">Bienvenido</CardTitle>
            <CardDescription className="text-base mt-2">
              {isRegister ? "Deja tus datos para que te creen el acceso" : "Ingresa a tu cuenta"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombreUsuario">Usuario</Label>
                  <Input
                    id="nombreUsuario"
                    type="text"
                    placeholder="Usuario (ej: juan.perez)"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón social / Nombre</Label>
                  <Input
                    id="razonSocial"
                    type="text"
                    placeholder="Razón social o nombre"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cuit">CUIT</Label>
                  <Input
                    id="cuit"
                    type="text"
                    inputMode="numeric"
                    placeholder="11 dígitos"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value.replace(/\D/g, ""))}
                    className="h-12"
                    maxLength={11}
                    pattern="[0-9]{11}"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Ingresá solo números, sin guiones.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    inputMode="tel"
                    placeholder="Ej: 3411234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/[^0-9+]/g, ''))}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Ingresá el teléfono sin prefijo obligatorio.</p>
                </div>
                <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                  Enviá esta solicitud y el admin te dará de alta en la app.
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombreUsuario">Usuario</Label>
                  <Input
                    id="nombreUsuario"
                    type="text"
                    placeholder="nombre de usuario"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contrasena">Contraseña</Label>
                  <Input
                    id="contrasena"
                    type="password"
                    placeholder="--------"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </>
            )}
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (isRegister ? "Enviando..." : "Ingresando...") : isRegister ? "Solicitar acceso" : "Ingresar"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage("")
                  setSuccessMessage("")
                  setIsRegister(!isRegister)
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isRegister ? "Ya tenés cuenta? Ingresa" : "No tenés cuenta? Solicita acceso"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
