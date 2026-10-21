import type React from "react"
import { Suspense } from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Storefront from "@/components/storefront"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AFP Pinturas | Tienda online",
  description: "Catálogo de pinturas y productos para profesionales. Consultá precios, promociones y realizá tu pedido en AFP Pinturas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AFP Pinturas",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${_geist.className} antialiased`}>
        {children}
        <Suspense fallback={<div className="store-empty">Cargando tienda…</div>}><Storefront /></Suspense>
        <Analytics />
      </body>
    </html>
  )
}
