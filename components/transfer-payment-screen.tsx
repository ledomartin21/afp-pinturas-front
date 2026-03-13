"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Copy, Check, Building2, MessageCircle } from "lucide-react"

interface TransferPaymentScreenProps {
  total: number
  onConfirm: () => Promise<void> | void
  onBack: () => void
}

const BANK_DATA = {
  banco: "Banco Nacion Argentina",
  titular: "AFP Pinturas S.R.L.",
  cuit: "30-71234567-8",
  cbu: "0110012340001234567890",
  alias: "AFP.PINTURAS.PAGOS",
  tipoCuenta: "Cuenta Corriente",
}

import { APP_CONSTANTS } from "@/lib/config/constants"

const WSP_NUMBER = APP_CONSTANTS.WHATSAPP_NUMBER

export function TransferPaymentScreen({ total, onConfirm, onBack }: TransferPaymentScreenProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const openWhatsApp = () => {
    const message = `Hola! Realice una transferencia por $${total.toLocaleString("es-AR")} a la cuenta de AFP Pinturas. Adjunto comprobante.`
    window.open(`https://wa.me/${WSP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleConfirm = async () => {
    try {
      setErrorMessage("")
      setIsSubmitting(true)
      setConfirmed(true)
      await onConfirm()
    } catch {
      setConfirmed(false)
      setErrorMessage("No se pudo confirmar el pedido. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="h-1 bg-accent" />
        <div className="p-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">Pago por Transferencia</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Monto a pagar */}
        <Card className="border-2 border-accent bg-accent/10">
          <CardContent className="p-5 text-center space-y-1">
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Monto a transferir</p>
            <p className="text-4xl font-bold">${total.toLocaleString("es-AR")}</p>
          </CardContent>
        </Card>

        {/* Datos bancarios */}
        <Card className="border-2">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-accent-foreground" />
              <h2 className="font-semibold text-lg">Datos Bancarios</h2>
            </div>

            <div className="space-y-4">
              <BankField
                label="Banco"
                value={BANK_DATA.banco}
                fieldKey="banco"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
              <BankField
                label="Titular"
                value={BANK_DATA.titular}
                fieldKey="titular"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
              <BankField
                label="CUIT"
                value={BANK_DATA.cuit}
                fieldKey="cuit"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />
              <BankField
                label="Tipo de Cuenta"
                value={BANK_DATA.tipoCuenta}
                fieldKey="tipoCuenta"
                copiedField={copiedField}
                onCopy={copyToClipboard}
              />

              <div className="pt-2 border-t space-y-4">
                <BankField
                  label="CBU"
                  value={BANK_DATA.cbu}
                  fieldKey="cbu"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                  highlight
                />
                <BankField
                  label="Alias"
                  value={BANK_DATA.alias}
                  fieldKey="alias"
                  copiedField={copiedField}
                  onCopy={copyToClipboard}
                  highlight
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instrucciones */}
        <Card className="border-2 bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">Instrucciones</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">1</span>
                <span>{"Realiza la transferencia con los datos indicados arriba"}</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">2</span>
                <span>{"Envia el comprobante por WhatsApp"}</span>
              </li>
              <li className="flex gap-2">
                <span className="bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0">3</span>
                <span>{"Una vez verificado, procesaremos tu pedido"}</span>
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Enviar comprobante por WhatsApp */}
        <button
          onClick={openWhatsApp}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white rounded-xl py-4 font-semibold hover:bg-[#20BD5A] transition-colors active:scale-[0.98]"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar Comprobante por WhatsApp
        </button>
      </div>

      {/* Confirmar */}
      <div className="sticky bottom-0 bg-card border-t p-4">
        {errorMessage && <p className="mb-2 text-sm text-red-600">{errorMessage}</p>}
        <Button
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleConfirm}
          disabled={isSubmitting || confirmed}
        >
          {isSubmitting ? (
            "Procesando..."
          ) : confirmed ? (
            <span className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Pedido Confirmado
            </span>
          ) : (
            "Ya Realice la Transferencia"
          )}
        </Button>
      </div>
    </div>
  )
}

function BankField({
  label,
  value,
  fieldKey,
  copiedField,
  onCopy,
  highlight = false,
}: {
  label: string
  value: string
  fieldKey: string
  copiedField: string | null
  onCopy: (text: string, field: string) => void
  highlight?: boolean
}) {
  const isCopied = copiedField === fieldKey

  return (
    <div className={`flex items-center justify-between gap-3 ${highlight ? "bg-accent/10 -mx-2 px-2 py-2 rounded-lg" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`font-medium text-sm break-all ${highlight ? "font-bold" : ""}`}>{value}</p>
      </div>
      <button
        onClick={() => onCopy(value, fieldKey)}
        className={`shrink-0 p-2 rounded-lg transition-colors ${
          isCopied ? "bg-accent/20 text-accent-foreground" : "hover:bg-muted text-muted-foreground"
        }`}
        aria-label={`Copiar ${label}`}
      >
        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}
