"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeDollarSign, Loader2, Menu, ReceiptText, ShoppingCart } from "lucide-react"
import type { Screen } from "@/app/page"
import { Card, CardContent } from "@/components/ui/card"
import { userService } from "@/lib/api"
import type { AccountComprobante } from "@/lib/types"

interface AccountScreenProps {
  onNavigate: (screen: Screen) => void
  onOpenMenu: () => void
  cartCount: number
}

export function AccountScreen({ onNavigate, onOpenMenu, cartCount }: AccountScreenProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [cuenta, setCuenta] = useState("")
  const [comprobantes, setComprobantes] = useState<AccountComprobante[]>([])
  const [totalSaldoAbierto, setTotalSaldoAbierto] = useState(0)

  useEffect(() => {
    const loadAccount = async () => {
      try {
        setIsLoading(true)
        const result = await userService.getAccountStatus()
        setCuenta(result.cuenta)
        setComprobantes(result.comprobantes)
        setTotalSaldoAbierto(result.totalSaldoAbierto)
        setErrorMessage("")
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo cargar tu cuenta"
        setErrorMessage(message)
        setCuenta("")
        setComprobantes([])
        setTotalSaldoAbierto(0)
      } finally {
        setIsLoading(false)
      }
    }

    void loadAccount()
  }, [])

  const header = (
    <div className="rounded-b-xl bg-primary px-4 pb-8 pt-6 shadow-lg">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={onOpenMenu} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20">
          <Menu className="h-5 w-5 text-white" />
        </button>
        <img src="/images/logo.png" alt="AFP Pinturas" className="h-12 w-auto object-contain drop-shadow-md" />
        <button onClick={() => onNavigate("cart")} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/20">
          <ShoppingCart className="h-5 w-5 text-white" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-primary">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>
      </div>
      <h1 className="text-center text-xl font-bold text-white">Mi Cuenta</h1>
      <p className="text-center text-sm text-white/80">Comprobantes con saldo abierto</p>
    </div>
  )

  const totalComprobantes = comprobantes.length
  const totalComprobantesText = useMemo(() => {
    if (totalComprobantes === 1) return "1 comprobante"
    return `${totalComprobantes} comprobantes`
  }, [totalComprobantes])

  if (isLoading) {
    return (
      <div className="flex h-full flex-col bg-background">
        {header}
        <div className="flex flex-1 items-center justify-center">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando cuenta...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {header}

      <div className="flex-1 overflow-auto px-4 pb-6">
        <Card className="mt-4 rounded-2xl border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Cuenta</p>
                <p className="mt-1 text-lg font-bold text-foreground">{cuenta || "Sin definir"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{totalComprobantesText}</p>
              </div>
              <BadgeDollarSign className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary/80">Saldo abierto total</p>
              <p className="mt-1 text-xl font-bold text-primary">${totalSaldoAbierto.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 space-y-3">
          {errorMessage && (
            <Card className="rounded-2xl border border-red-200 bg-red-50 shadow-none">
              <CardContent className="p-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </CardContent>
            </Card>
          )}

          {!errorMessage && comprobantes.length === 0 && (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-6 text-center">
                <ReceiptText className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">No hay comprobantes pendientes</p>
                <p className="mt-1 text-xs text-muted-foreground">Cuando tengas saldo abierto lo vas a ver en este listado.</p>
              </CardContent>
            </Card>
          )}

          {comprobantes.map((item) => (
            <Card key={`${item.comprobante}-${item.fecha || "s/f"}`} className="rounded-2xl border-none shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{item.abreviatura} {item.comprobante}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.fecha ? new Date(item.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "Sin fecha"}
                    </p>
                  </div>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Abierto</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-muted px-2 py-1.5">
                    <p className="text-muted-foreground">Importe</p>
                    <p className="font-semibold text-foreground">${item.importeCbte.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-2 py-1.5">
                    <p className="text-muted-foreground">Saldo</p>
                    <p className="font-semibold text-foreground">${item.saldo.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
