import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./game-room.css"
import { Suspense } from "react"
import { AudioProvider } from "@/contexts/AudioContext"

export const metadata: Metadata = {
  title: "UNO - Juego de Cartas",
  description: "Juega al clásico juego de cartas UNO",
  generator: "v0.app",
  icons: {
    icon: "/icons/uno-logo.png",
    shortcut: "/icons/uno-logo.png",
    apple: "/icons/uno-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AudioProvider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
          <Analytics />
        </AudioProvider>
      </body>
    </html>
  )
}
