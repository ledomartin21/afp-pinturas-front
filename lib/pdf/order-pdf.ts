import { jsPDF } from "jspdf"
import type { Order } from "@/app/page"

function paymentLabel(paymentMethod?: Order["paymentMethod"]) {
  if (paymentMethod === "transfer") return "Transferencia"
  if (paymentMethod === "cash") return "Efectivo"
  if (paymentMethod === "card") return "Tarjeta"
  return "Sin definir"
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

export async function generateOrderPdf(order: Order): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2
  const rowBottomLimit = pageHeight - 34
  let y = 14

  const colQty = margin + 3
  const colCode = margin + 18
  const colDesc = margin + 44
  const colUnit = pageWidth - 52
  const colTotal = pageWidth - 12

  const drawRowsHeader = (topY: number) => {
    doc.setFillColor(244, 244, 244)
    doc.rect(margin, topY, contentWidth, 8, "F")
    doc.setDrawColor(190)
    doc.rect(margin, topY, contentWidth, 8)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.text("Cant.", colQty, topY + 5.3)
    doc.text("Cod. Prod.", colCode, topY + 5.3)
    doc.text("Descripcion", colDesc, topY + 5.3)
    doc.text("Precio Un.", colUnit, topY + 5.3)
    doc.text("Total", colTotal, topY + 5.3, { align: "right" })
  }

  try {
    const logoData = await imageToDataUrl("/images/logo.png")
    doc.addImage(logoData, "PNG", margin, y - 2, 32, 16)
  } catch {
    // noop
  }

  doc.setDrawColor(160)
  doc.roundedRect(margin, y, contentWidth, 32, 1.5, 1.5)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text("AFP PINTURAS", margin + 36, y + 8)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Bahia 240 - Villa Maria - Cba.", margin + 36, y + 13)
  doc.text("Cel: 3534401828", margin + 36, y + 18)
  doc.text("Email: distribuidoraafpvm@gmail.com", margin + 36, y + 23)

  const rightBoxX = pageWidth - 72
  doc.rect(rightBoxX, y + 3, 60, 9)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Nota de Pedido", rightBoxX + 30, y + 9, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.6)
  doc.text(`Nro: ${order.id}`, rightBoxX + 3, y + 16)
  doc.text(`Fecha: ${new Date(order.date).toLocaleDateString("es-AR")}`, rightBoxX + 3, y + 20.5)
  doc.text(`Estado: ${statusLabel(order.status)}`, rightBoxX + 3, y + 25)

  y += 38
  const addressLine = order.address
    ? `${order.address.calle}, ${order.address.ciudad} (${order.address.codigoPostal})${order.address.provincia ? ` - ${order.address.provincia}` : ""}`
    : "Sin direccion cargada"
  const addressLines = doc.splitTextToSize(addressLine, contentWidth - 30)
  const customerBoxHeight = Math.max(20, 12 + addressLines.length * 4)

  doc.roundedRect(margin, y, contentWidth, customerBoxHeight, 1.2, 1.2)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Cliente:", margin + 3, y + 6)
  doc.setFont("helvetica", "bold")
  doc.text("Cliente de AFP Pinturas", margin + 18, y + 6)
  doc.setFont("helvetica", "normal")
  doc.text(`Entrega: ${deliveryLabel(order.deliveryMethod)} | Pago: ${paymentLabel(order.paymentMethod)}`, margin + 3, y + 11)
  doc.text("Direccion:", margin + 3, y + 16)
  doc.text(addressLines, margin + 18, y + 16)

  y += customerBoxHeight + 6
  drawRowsHeader(y)
  y += 12

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.8)

  for (const [idx, item] of order.items.entries()) {
    const descriptionLines = doc.splitTextToSize(item.name, colUnit - colDesc - 4)
    const rowHeight = Math.max(6, descriptionLines.length * 3.6)

    if (y + rowHeight > rowBottomLimit) {
      doc.addPage()
      y = 16
      drawRowsHeader(y)
      y += 12
    }

    const itemSubtotal = item.price * item.quantity
    doc.text(String(item.quantity), colQty, y)
    doc.text(String(item.id || `P-${idx + 1}`), colCode, y)
    doc.text(descriptionLines, colDesc, y)
    doc.text(`$${item.price.toLocaleString("es-AR")}`, colUnit, y)
    doc.text(`$${itemSubtotal.toLocaleString("es-AR")}`, colTotal, y, { align: "right" })

    y += rowHeight
    doc.setDrawColor(232)
    doc.line(margin, y - 1.8, pageWidth - margin, y - 1.8)
  }

  const summaryY = Math.min(Math.max(y + 4, 240), pageHeight - 28)
  doc.setDrawColor(170)
  doc.roundedRect(pageWidth - 72, summaryY, 60, 18, 1.2, 1.2)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Subtotal", pageWidth - 68, summaryY + 6)
  doc.text(`$${order.total.toLocaleString("es-AR")}`, pageWidth - 15, summaryY + 6, { align: "right" })
  doc.text("I.V.A.", pageWidth - 68, summaryY + 10.5)
  doc.text("Incluido", pageWidth - 15, summaryY + 10.5, { align: "right" })
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10.5)
  doc.text("Total", pageWidth - 68, summaryY + 15.5)
  doc.text(`$${order.total.toLocaleString("es-AR")}`, pageWidth - 15, summaryY + 15.5, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Cond. de venta: Cuenta corriente", margin, pageHeight - 12)

  return doc.output("blob")
}
