"use client"

/**
 * HomePage - Página principal
 * ACTUALIZADO: Usa AuthContext para autenticación
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Settings, Users, LogOut, Trophy } from "lucide-react"
import Image from "next/image"
import ParticleCanvas from "@/components/ParticleCanvas"
import OneCardsBackground from "@/components/OneCardsBackground"
import GalaxySpiral from "@/components/GalaxySpiral"
import SettingsModal from "@/components/SettingsModal"
import GameRoomMenuV2 from "@/components/game-room-menu-v2"
import RoomSelectionScreen from "@/components/RoomSelectionScreen"
import HalftoneWaves from "@/components/halftone-waves"
import LoginScreen from "@/components/LoginScreen"
import GamePlay from "@/components/GamePlay"
import RankingScreen from "@/components/RankingScreen"
import UserProfileCard from "@/components/UserProfileCard"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'login' | 'main' | 'room-selection' | 'game' | 'gameplay' | 'ranking'>('main')

  // Usar AuthContext en vez de estado local
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const { success } = useNotification()

  const handleLogout = async () => {
    await logout()
    setCurrentScreen('main')
    success("Sesión cerrada", "Has cerrado sesión correctamente")
  }

  const handlePlayClick = () => {
    if (!isAuthenticated) {
      // Si no está logueado, mostrar login primero
      setCurrentScreen('login')
    } else {
      // Si está logueado, ir a selección de sala
      setCurrentScreen('room-selection')
    }
  }

  const handleLoginSuccess = () => {
    setCurrentScreen('room-selection')
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

      {currentScreen === 'login' && (
        <div className="relative z-10 animate-fade-in">
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setCurrentScreen('main')}
          />
        </div>
      )}

      {currentScreen === 'room-selection' && (
        <div className="relative z-10 animate-fade-in">
          <RoomSelectionScreen
            onCreateRoom={() => setCurrentScreen('game')}
            onJoinRoomSuccess={() => setCurrentScreen('game')}
            onBack={() => setCurrentScreen('main')}
          />
        </div>
      )}

      {currentScreen === 'ranking' && (
        <div className="relative z-10 animate-fade-in">
          <RankingScreen onBack={() => setCurrentScreen('main')} />
        </div>
      )}

      {currentScreen === 'main' && (
        <>
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
                <Button size="lg" className="glass-button glass-button-primary glass-button-large group" onClick={handlePlayClick}>
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
                    onClick={() => setCurrentScreen('ranking')}
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
        </>
      )}

      {currentScreen === 'game' && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <HalftoneWaves />
          <div className="absolute inset-0 z-[60] flex items-center justify-center w-full h-full p-4">
            <GameRoomMenuV2
              onBack={() => setCurrentScreen('room-selection')}
              onStartGame={() => setCurrentScreen('gameplay')}
              userData={user ? {
                username: user.nickname,
                isGuest: typeof user.id === 'string' && user.id.startsWith('guest_')
              } : null}
            />
          </div>
        </div>
      )}

      {currentScreen === 'gameplay' && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <GamePlay onBack={() => setCurrentScreen('game')} />
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </main>
  )
}
