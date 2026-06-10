"use client"

import { useEffect, useState } from "react"

export default function RecuperarPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const mail = params?.get('mail') || ''
  const token = params?.get('token') || ''

  const [step, setStep] = useState<'verifying'|'set'|'success'|'error'>('verifying')
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!mail || !token) {
      setError('Faltan parámetros en el enlace.')
      setStep('error')
      return
    }

    // Verificar el token
    fetch('/api/auth/verificar-codigo', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mail, token }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token inválido o expirado')
        setStep('set')
      })
      .catch((err) => {
        setError(err?.message || 'No se pudo verificar el token')
        setStep('error')
      })
  }, [mail, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      const resp = await fetch('/api/auth/cambiar-contrasena', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mail, nuevaContrasena: password }),
      })

      if (!resp.ok) throw new Error('No se pudo cambiar la contraseña')
      setStep('success')
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar la contraseña')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-6 rounded shadow">
        {step === 'verifying' && <p>Verificando enlace...</p>}
        {step === 'error' && (
          <div>
            <h2 className="text-lg font-semibold">Enlace inválido</h2>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {step === 'set' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold">Establecer contraseña</h2>
            <p className="text-sm text-muted-foreground">Ingresa una nueva contraseña para tu cuenta ({mail}).</p>
            <div>
              <label className="block text-sm">Nueva contraseña</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" minLength={8} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Establecer</button>
            </div>
          </form>
        )}
        {step === 'success' && (
          <div>
            <h2 className="text-lg font-semibold">Contraseña actualizada</h2>
            <p className="text-sm">Ya podés ingresar con tu nueva contraseña.</p>
          </div>
        )}
      </div>
    </div>
  )
}
