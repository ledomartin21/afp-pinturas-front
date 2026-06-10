import { jsPDF } from "jspdf"
import type { Order } from "@/app/page"
import { userService } from "@/lib/api"

function formatMoney(value: number) {
  return `$${Number(value || 0).toLocaleString("es-AR")}`
}

function deliveryLabel(deliveryMethod?: Order["deliveryMethod"]) {
  if (deliveryMethod === "pickup") return "Retiro en sucursal"
  if (deliveryMethod === "delivery") return "Envio a domicilio"
  return "Sin definir"
}

function statusLabel(status: Order["status"]) {
  if (status === "pending") return "Pendiente"
  if (status === "processing") return "Procesando"
  if (status === "shipped") return "En camino"
  return "Entregado"
}

async function imageToDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("No se pudo obtener canvas context"))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = () => reject(new Error("No se pudo cargar logo"))
    img.src = src
  })
}

type PdfRow = {
  qty: number
  code: string
  description: string
  unitPrice: number
  total: number
  includeLines?: string[]
}

function sanitizeFilenamePart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
}

async function getOrderClientLabel(order: Order) {
  const profile = await userService.getProfile().catch(() => null)
  return profile?.razonSocial?.trim() || profile?.nombreUsuario?.trim() || "cliente"
}

export async function buildOrderPdfFilename(order: Order): Promise<string> {
  const clientLabel = sanitizeFilenamePart(await getOrderClientLabel(order)) || "cliente"
  const orderLabel = sanitizeFilenamePart(order.id) || "pedido"
  const dateLabel = new Date(order.date).toISOString().slice(0, 10)
  return `${clientLabel}-${orderLabel}-${dateLabel}.pdf`
}

export async function generateOrderPdf(order: Order): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const margin = 20
  const contentWidth = pageWidth - margin * 2
  const bottomLimit = pageHeight - margin

  const colQtyW = 14
  const colCodeW = 28
  const colUnitW = 28
  const colTotalW = 28
  const colDescW = contentWidth - colQtyW - colCodeW - colUnitW - colTotalW

  const colQtyX = margin
  const colCodeX = colQtyX + colQtyW
  const colDescX = colCodeX + colCodeW
  const colUnitX = colDescX + colDescW
  const colTotalX = colUnitX + colUnitW

  let y = margin

  const rows: PdfRow[] = order.items.map((item) => {
    if (item.type === "promotion") {
      const promoLabel =
        item.promotionType === "combo_fijo"
          ? "Promoción combo"
          : item.promotionType === "nxm"
            ? "Promoción NxM"
            : "Promoción"

      return {
        qty: item.quantity,
        code: item.id,
        description: promoLabel,
        unitPrice: item.price,
        total: item.price * item.quantity,
        includeLines: item.includedItems.map((component) => {
          const brandSuffix = component.brand ? ` ${component.brand}` : ""
          return `- ${component.quantity} x ${component.name}${brandSuffix}`
        }),
      }
    }

    return {
      qty: item.quantity,
      code: item.id,
      description: item.name,
      unitPrice: item.price,
      total: item.price * item.quantity,
    }
  })

  const drawTableHeader = (topY: number) => {
    doc.setDrawColor(190)
    doc.setFillColor(246, 246, 246)
    doc.rect(margin, topY, contentWidth, 8, "FD")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Cant.", colQtyX + colQtyW / 2, topY + 5.2, { align: "center" })
    doc.text("Cod. Prod.", colCodeX + colCodeW / 2, topY + 5.2, { align: "center" })
    doc.text("Descripcion", colDescX + 1.5, topY + 5.2)
    doc.text("Precio Un.", colUnitX + colUnitW - 1.5, topY + 5.2, { align: "right" })
    doc.text("Total", colTotalX + colTotalW - 1.5, topY + 5.2, { align: "right" })
  }

  try {
    const logoData = await imageToDataUrl("/images/logo.png")
    doc.addImage(logoData, "PNG", margin + 1.5, y + 5.5, 26, 26)
  } catch {
    // noop
  }

  const addressLine = order.address
    ? `${order.address.calle}, ${order.address.ciudad} (${order.address.codigoPostal})${order.address.provincia ? ` - ${order.address.provincia}` : ""}`
    : "Sin direccion cargada"

  const profile = await userService.getProfile().catch(() => null)
  const clientName = profile?.razonSocial?.trim() || profile?.nombreUsuario?.trim() || "Cliente de AFP Pinturas"
  const clientAccount = profile?.id != null ? `Cuenta: ${String(profile.id)}` : "Cuenta: Sin definir"
  const clientPhone = profile?.telefono?.trim() || "Sin definir"
  const clientMail = profile?.mail?.trim() || "Sin definir"
  const clientAddress = profile?.domicilio?.trim() || addressLine

  const headerHeight = 38
  const leftColW = contentWidth * 0.62
  const rightColW = contentWidth - leftColW
  const rightColX = margin + leftColW

  doc.setDrawColor(170)
  doc.roundedRect(margin, y, contentWidth, headerHeight, 1.5, 1.5)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("AFP PINTURAS", margin + 39, y + 8.3)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Bahia 240 - Villa Maria - Cba.", margin + 39, y + 13.2)
  doc.text("Tel: 3534401828", margin + 39, y + 17.7)
  doc.text("Email: distribuidoraafpvm@gmail.com", margin + 39, y + 22.2)

  doc.setDrawColor(190)
  doc.rect(rightColX + 2, y + 3, rightColW - 4, headerHeight - 6)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Nota de Pedido", rightColX + rightColW / 2, y + 9, { align: "center" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)

  const orderIdLines = doc.splitTextToSize(`Nro: ${order.id}`, rightColW - 8)
  doc.text(orderIdLines, rightColX + 4, y + 14)

  let rightInfoY = y + 14 + orderIdLines.length * 3.8
  doc.text(`Fecha: ${new Date(order.date).toLocaleDateString("es-AR")}`, rightColX + 4, rightInfoY)
  rightInfoY += 4.2
  doc.text(`Estado: ${statusLabel(order.status)}`, rightColX + 4, rightInfoY)

  y += headerHeight + 6

  const customerLeftLines = [
    `Cliente: ${clientName}`,
    clientAccount,
    `Telefono: ${clientPhone}`,
    `Email: ${clientMail}`,
    `Domicilio: ${clientAddress}`,
  ]

  const customerRightLines = [
    `Entrega: ${deliveryLabel(order.deliveryMethod)}`,
    `Estado: ${statusLabel(order.status)}`,
    `Fecha: ${new Date(order.date).toLocaleDateString("es-AR")}`,
  ]

  if (order.deliveryMethod === "delivery" && (order.comisionistaNombre || order.comisionistaTelefono)) {
    customerRightLines.push(`Comisionista: ${order.comisionistaNombre || "Sin definir"}`)
    customerRightLines.push(`Tel. comisionista: ${order.comisionistaTelefono || "Sin definir"}`)
  }

  const leftWrapped = customerLeftLines.flatMap((line) => doc.splitTextToSize(line, contentWidth * 0.6 - 6))
  const rightWrapped = customerRightLines.flatMap((line) => doc.splitTextToSize(line, contentWidth * 0.33 - 6))
  const customerHeight = Math.max(leftWrapped.length, rightWrapped.length) * 4.2 + 8
  const customerBoxY = y
  const customerRightX = margin + contentWidth * 0.64

  doc.roundedRect(margin, customerBoxY, contentWidth, customerHeight, 1.2, 1.2)
  doc.setDrawColor(210)
  doc.line(customerRightX - 2, customerBoxY + 2, customerRightX - 2, customerBoxY + customerHeight - 2)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text(leftWrapped, margin + 3, customerBoxY + 5.5)
  doc.text(rightWrapped, customerRightX + 2, customerBoxY + 5.5)

  y += customerHeight + 6
  drawTableHeader(y)
  y += 9.5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.6)

  for (const row of rows) {
    const descLines = doc.splitTextToSize(row.description, colDescW - 2)
    const includeLines = row.includeLines?.flatMap((line) => doc.splitTextToSize(line, colDescW - 4)) || []

    const baseHeight = Math.max(6, descLines.length * 3.8)
    const includeHeight = includeLines.length > 0 ? includeLines.length * 3.4 + 2.5 : 0
    const rowHeight = baseHeight + includeHeight + 2

    if (y + rowHeight > bottomLimit - 22) {
      doc.addPage()
      y = margin
      drawTableHeader(y)
      y += 9.5
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.6)
    }

    const qtyY = y + 4
    doc.text(String(row.qty), colQtyX + colQtyW / 2, qtyY, { align: "center" })
    doc.text(row.code, colCodeX + 1.5, qtyY)
    doc.text(descLines, colDescX + 1.5, qtyY)
    doc.text(formatMoney(row.unitPrice), colUnitX + colUnitW - 1.5, qtyY, { align: "right" })
    doc.text(formatMoney(row.total), colTotalX + colTotalW - 1.5, qtyY, { align: "right" })

    if (includeLines.length > 0) {
      doc.setFontSize(7.8)
      doc.setTextColor(95, 95, 95)
      doc.text("Incluye:", colDescX + 1.5, qtyY + baseHeight)
      doc.text(includeLines, colDescX + 3.5, qtyY + baseHeight + 3.4)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8.6)
    }

    y += rowHeight
    doc.setDrawColor(230)
    doc.line(margin, y - 1.2, margin + contentWidth, y - 1.2)
  }

  const summaryBoxW = 68
  const summaryBoxX = margin + contentWidth - summaryBoxW
  const summaryBoxH = 18
  const summaryY = Math.min(Math.max(y + 3, margin), bottomLimit - summaryBoxH)

  doc.setDrawColor(170)
  doc.roundedRect(summaryBoxX, summaryY, summaryBoxW, summaryBoxH, 1.2, 1.2)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Subtotal", summaryBoxX + 3, summaryY + 6)
  doc.text(formatMoney(order.total), summaryBoxX + summaryBoxW - 3, summaryY + 6, { align: "right" })
  doc.text("I.V.A.", summaryBoxX + 3, summaryY + 10.5)
  doc.text("Incluido", summaryBoxX + summaryBoxW - 3, summaryY + 10.5, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.4)
  doc.text("Total", summaryBoxX + 3, summaryY + 15.6)
  doc.text(formatMoney(order.total), summaryBoxX + summaryBoxW - 3, summaryY + 15.6, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Cond. de venta: Cuenta corriente", margin, bottomLimit)

  return doc.output("blob")
}
