import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import "./game-room.css"
import { Suspense } from "react"
import { AudioProvider } from "@/contexts/AudioContext"
import { AuthProvider } from "@/contexts/AuthContext"
import { GameProvider } from "@/contexts/GameContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import NotificationToast from "@/components/NotificationToast"

export const metadata: Metadata = {
  title: "UNO - Juego de Cartas Online",
  description: "Juega al clásico juego de cartas UNO online con tus amigos",
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
        {/* Providers anidados en el orden correcto */}
        <NotificationProvider>
          <AuthProvider>
            <GameProvider>
              <AudioProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  {children}
                </Suspense>
                <Analytics />
              </AudioProvider>
            </GameProvider>
          </AuthProvider>
          {/* Notificaciones Toast - renderizadas globalmente */}
          <NotificationToast />
        </NotificationProvider>
      </body>
    </html>
  )
}
