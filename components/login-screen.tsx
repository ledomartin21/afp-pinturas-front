"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "@/lib/api"

interface LoginScreenProps {
  onLogin: (rolId: number, usuarioId: string | number) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    try {
      setIsSubmitting(true)

      if (isRegister) {
        if (!nombreUsuario || !razonSocial) {
          setErrorMessage("Por favor complete todos los datos solicitados")
          return
        }
        
        const telefonoEmpresa = "5493535082493"
        const mensaje = `Hola! quiero tener una cuenta para AFP pinturas\nmis datos:\nnombre: ${nombreUsuario}\nrazon social: ${razonSocial}`
        
        window.open(`https://wa.me/${telefonoEmpresa}?text=${encodeURIComponent(mensaje)}`, '_blank')
        return
      }

      const response = await authService.login({ nombreUsuario, contrasena })
      onLogin(response.rolId, response.usuarioId)
    } catch {
      setErrorMessage("Credenciales inválidas o servidor no disponible")
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
              {isRegister ? "Crea tu cuenta para empezar" : "Ingresa a tu cuenta"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombreUsuario">Nombre Completo</Label>
                  <Input
                    id="nombreUsuario"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razón Social o Empresa</Label>
                  <Input
                    id="razonSocial"
                    type="text"
                    placeholder="El nombre de tu empresa"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="h-12"
                    required
                  />
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (isRegister ? "Redirigiendo..." : "Ingresando...") : isRegister ? "Solicitar Cuenta por WhatsApp" : "Ingresar"}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isRegister ? "Ya tenes cuenta? Ingresa" : "No tenes cuenta? Registrate"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
