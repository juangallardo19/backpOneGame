"use client"

/**
 * HomePage - Página principal
 * ACTUALIZADO: Usa navegación real de Next.js en lugar de useState
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Play, Settings, LogOut, Trophy } from "lucide-react"
import Image from "next/image"
import ParticleCanvas from "@/components/ParticleCanvas"
import OneCardsBackground from "@/components/OneCardsBackground"
import GalaxySpiral from "@/components/GalaxySpiral"
import SettingsModal from "@/components/SettingsModal"
import UserProfileCard from "@/components/UserProfileCard"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"

export default function HomePage() {
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Usar AuthContext en vez de estado local
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { success } = useNotification()

  const handleLogout = async () => {
    await logout()
    success("Sesión cerrada", "Has cerrado sesión correctamente")
  }

  const handlePlayClick = () => {
    if (!isAuthenticated) {
      // Si no está logueado, mostrar login primero
      router.push('/login')
    } else {
      // Si está logueado, ir a selección de sala
      router.push('/rooms')
    }
  }

  const handleRankingClick = () => {
    if (!isAuthenticated) {
      router.push('/login')
    } else {
      // TODO: Crear página de ranking si no existe
      router.push('/ranking')
    }
  }

  // Loading state mientras se verifica la autenticación
  if (isLoading) {
    return (
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: 'radial-gradient(circle at center, #ff8c00 0%, #ff4500 20%, #dc2626 40%, #8b0000 80%, #000000 100%)'}}>
        <div className="spiral-background"></div>
        <GalaxySpiral />
        <ParticleCanvas />
        <div className="relative z-10 text-white text-xl">Cargando...</div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: 'radial-gradient(circle at center, #ff8c00 0%, #ff4500 20%, #dc2626 40%, #8b0000 80%, #000000 100%)'}}>
      <div className="spiral-background"></div>
      <GalaxySpiral />
      <ParticleCanvas />
      <OneCardsBackground />

      <div className="absolute top-8 left-8 z-20 animate-float">
        <Image
          src="/one-logo.png"
          alt="ONE Logo"
          width={384}
          height={192}
          className="w-32 h-auto drop-shadow-2xl md:w-40 ml-0 lg:w-96"
          priority
        />
      </div>

      {/* User Profile Card in top-right corner */}
      {user && isAuthenticated && (
        <div className="absolute top-8 right-8 z-20">
          <UserProfileCard
            user={user}
            onLogout={handleLogout}
            onSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <div className="glass-menu-card animate-fade-in px-0 my-0 relative z-10">
          <span className="shine shine-top"></span>
          <span className="shine shine-bottom"></span>
          <span className="glow glow-top"></span>
          <span className="glow glow-bottom"></span>

          <div className="flex flex-col gap-4 min-w-[320px] relative z-10">
            <Button
              size="lg"
              className="glass-button glass-button-large group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
              onClick={handlePlayClick}
            >
              <Play className="mr-2 transition-transform group-hover:scale-110 h-10 w-10" />
              <span className="text-xl font-bold tracking-wide">JUGAR</span>
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="glass-button glass-button-secondary group"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="mr-1.5 h-5 w-5 transition-transform group-hover:rotate-90" />
                <span className="text-sm font-semibold">Configuración</span>
              </Button>

              <Button
                size="lg"
                className="glass-button glass-button-tertiary group"
                onClick={handleRankingClick}
                disabled={!isAuthenticated}
              >
                <Trophy className="mr-1.5 h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="text-sm font-semibold">Ranking</span>
              </Button>
            </div>

            {isAuthenticated && (
              <Button
                size="lg"
                className="glass-button glass-button-logout group text-white"
                onClick={handleLogout}
              >
                <LogOut className="mr-1.5 h-5 w-5 text-white" />
                <span className="text-sm font-semibold">Cerrar Sesión</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  )
}
