"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import type { Order } from "@/app/page"
import { buildOrderPdfFilename, generateOrderPdf } from "@/lib/pdf/order-pdf"

interface OrderPdfScreenProps {
  order: Order | null
  onBack: () => void
}

export function OrderPdfScreen({ order, onBack }: OrderPdfScreenProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let activeUrl: string | null = null

    const buildPdf = async () => {
      if (!order) return

      try {
        setIsLoading(true)
        setErrorMessage("")
        setPdfUrl(null)
        const blob = await generateOrderPdf(order)
        activeUrl = URL.createObjectURL(blob)
        setPdfUrl(activeUrl)
      } catch {
        setErrorMessage("No se pudo generar la nota de pedido")
      } finally {
        setIsLoading(false)
      }
    }

    void buildPdf()

    return () => {
      if (activeUrl) URL.revokeObjectURL(activeUrl)
    }
  }, [order])

  const handleDownload = async () => {
    if (!pdfUrl || !order) return

    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = await buildOrderPdfFilename(order)
    link.click()
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="Volver">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">Nota de Pedido</h1>
              <p className="text-xs text-muted-foreground truncate">Pedido #{order?.id ?? "-"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!pdfUrl || isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            Descargar
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-3">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-3">
          {isLoading && (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 rounded-3xl border bg-card text-sm text-muted-foreground shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              Generando vista previa...
            </div>
          )}

          {!isLoading && errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

          {!isLoading && !errorMessage && pdfUrl && (
            <div className="overflow-hidden rounded-3xl border bg-[#2f2f2f] p-2 shadow-2xl">
              <iframe src={pdfUrl} title="Vista previa Nota de Pedido" className="h-[78vh] w-full rounded-2xl border-0 bg-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
