"use client"

import React, { useEffect, useState } from "react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handler as EventListener)

    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener)
  }, [])

  const onInstallClick = async () => {
    if (!deferredPrompt) return
    setVisible(false)
    try {
      await deferredPrompt.prompt()
      await deferredPrompt.userChoice
    } catch (err) {
      // ignore
    }
    setDeferredPrompt(null)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-50">
      <div className="bg-card border shadow-lg rounded-lg p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/pwa-icon-192.png" alt="App logo" className="w-10 h-10 rounded" />
          <div>
            <div className="font-semibold">Instalar AFP Pinturas</div>
            <div className="text-sm text-muted-foreground">Agregar esta app a tu dispositivo</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onInstallClick} className="inline-flex items-center rounded bg-primary text-white px-3 py-1">
            Instalar
          </button>
          <button onClick={() => setVisible(false)} className="inline-flex items-center rounded border px-3 py-1">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
