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
  const [mail, setMail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [domicilio, setDomicilio] = useState("")
  const [contrasena, setContrasena] = useState("")
  const [confirmContrasena, setConfirmContrasena] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    try {
      setIsSubmitting(true)

      if (isRegister) {
        if (contrasena.length < 8) {
          setErrorMessage("La contrasena debe tener al menos 8 caracteres")
          return
        }

        if (contrasena !== confirmContrasena) {
          setErrorMessage("Las contrasenas no coinciden")
          return
        }

        await authService.register({
          nombreUsuario,
          razonSocial,
          mail,
          telefono,
          domicilio,
          contrasena,
        })
      }

      const response = await authService.login({ nombreUsuario, contrasena })
      onLogin(response.rolId, response.usuarioId)
    } catch {
      setErrorMessage(
        isRegister
          ? "No se pudo completar el registro. Verifica los datos."
          : "Credenciales inválidas o servidor no disponible",
      )
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
            {isRegister && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razon Social</Label>
                  <Input
                    id="razonSocial"
                    type="text"
                    placeholder="Tu empresa o nombre"
                    value={razonSocial}
                    onChange={(e) => setRazonSocial(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mail">Email</Label>
                  <Input
                    id="mail"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={mail}
                    onChange={(e) => setMail(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono</Label>
                  <Input
                    id="telefono"
                    type="text"
                    placeholder="11xxxxxxxx"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domicilio">Domicilio</Label>
                  <Input
                    id="domicilio"
                    type="text"
                    placeholder="Calle y numero"
                    value={domicilio}
                    onChange={(e) => setDomicilio(e.target.value)}
                    className="h-12"
                    required
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="contrasena">Contrasena</Label>
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
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contrasena</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="--------"
                  className="h-12"
                  value={confirmContrasena}
                  onChange={(e) => setConfirmContrasena(e.target.value)}
                  required
                />
              </div>
            )}
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (isRegister ? "Registrando..." : "Ingresando...") : isRegister ? "Registrarse" : "Ingresar"}
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
