"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Minus, PackageSearch, Plus, ScanSearch } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { productsService } from "@/lib/api"
import type { Product } from "@/app/page"

interface QuickAddModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProductAdded: (product: Product, quantity: number) => boolean | void
}

export function QuickAddModal({ open, onOpenChange, onProductAdded }: QuickAddModalProps) {
  const codeInputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setCode("")
      setQuantity(1)
      setFeedback(null)
      setError(null)
      return
    }

    const timer = window.setTimeout(() => {
      codeInputRef.current?.focus()
      codeInputRef.current?.select()
    }, 40)

    return () => window.clearTimeout(timer)
  }, [open])

  const handleAdd = async () => {
    const normalizedCode = code.trim()
    if (!normalizedCode) {
      setError("Ingresá un código para agregar el producto")
      setFeedback(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setFeedback(null)

    try {
      const product = await productsService.getProductByCode(normalizedCode)
      const added = onProductAdded(product, quantity)
      if (added === false) {
        setError("Confirmá la reserva para continuar")
        return
      }
      setFeedback(`Producto agregado: ${product.name}`)
      setCode("")
      setQuantity(1)
      window.setTimeout(() => {
        codeInputRef.current?.focus()
      }, 30)
    } catch {
      setError("Producto no encontrado")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[2rem] border-none p-0 shadow-2xl sm:max-w-md" showCloseButton={false}>
        <div className="overflow-hidden rounded-[2rem] bg-card">
          <DialogHeader className="px-6 pb-2 pt-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ScanSearch className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-2xl font-bold">Carga rápida de productos</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Buscá por SKU o código interno y seguí cargando varios productos sin salir del modal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 pb-6 pt-2">
            <div className="grid grid-cols-[1.3fr_1fr] gap-3">
              <div className="space-y-2">
                <label htmlFor="quick-add-code" className="text-sm font-semibold text-foreground">
                  Código
                </label>
                <Input
                  id="quick-add-code"
                  ref={codeInputRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void handleAdd()
                    }
                  }}
                  placeholder="SKU"
                  className="h-14 rounded-2xl border-border bg-background px-4 text-base"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Cantidad</label>
                <div className="flex h-14 items-center justify-between rounded-2xl border border-border bg-muted/50 px-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-destructive"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="min-w-8 text-center text-xl font-bold">{quantity}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl text-primary"
                    onClick={() => setQuantity((prev) => prev + 1)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <PackageSearch className="h-4 w-4 text-primary" />
                Se agregan {quantity} u.
              </div>
              <p className="mt-1">Presioná Enter o tocá “Agregar” para cargar múltiples productos rápidamente.</p>
            </div>

            {feedback && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{feedback}</p>}
            {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

            <DialogFooter className="flex-col gap-3 sm:flex-col">
              <Button className="h-12 rounded-2xl text-base font-semibold" onClick={() => void handleAdd()} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Agregar
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl border-destructive/30 text-base font-semibold text-destructive hover:bg-destructive/5" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
