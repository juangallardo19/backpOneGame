  "use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Settings, Users, LogOut } from "lucide-react"
import Image from "next/image"
import ParticleCanvas from "@/components/ParticleCanvas"
import UnoCardsBackground from "@/components/UnoCardsBackground"
import GalaxySpiral from "@/components/GalaxySpiral"
import SettingsModal from "@/components/SettingsModal"
import GameRoomMenu from "@/components/game-room-menu"
import RoomSelectionScreen from "@/components/RoomSelectionScreen"
import HalftoneWaves from "@/components/halftone-waves"
import LoginScreen from "@/components/LoginScreen"
import GamePlay from "@/components/GamePlay"

interface UserData {
  username: string
  email?: string
  userId?: string
  isGuest: boolean
  // Agregar otros campos según tu backend (avatar, nivel, etc)
}

export default function HomePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentScreen, setCurrentScreen] = useState<'login' | 'main' | 'room-selection' | 'game' | 'gameplay'>('main')
  const [userData, setUserData] = useState<UserData | null>(null)

  const handleLogout = () => {
    setCurrentScreen('main')
    setUserData(null)
  }

  const handlePlayClick = () => {
    if (!userData) {
      // Si no está logueado, mostrar login primero
      setCurrentScreen('login')
    } else {
      // Si está logueado, ir a selección de sala
      setCurrentScreen('room-selection')
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: 'radial-gradient(circle at center, #ff8c00 0%, #ff4500 20%, #dc2626 40%, #8b0000 80%, #000000 100%)'}}>
      <div className="spiral-background"></div>
      <GalaxySpiral />
      <ParticleCanvas />
      <UnoCardsBackground />

      {currentScreen === 'login' && (
        <div className="relative z-10 animate-fade-in">
          <LoginScreen 
            onLoginSuccess={(data) => {
              setUserData(data)
              setCurrentScreen('room-selection')
            }}
            onBack={() => setCurrentScreen('main')}
          />
        </div>
      )}

      {currentScreen === 'room-selection' && (
        <div className="relative z-10 animate-fade-in">
          <RoomSelectionScreen 
            onCreateRoom={() => setCurrentScreen('game')}
            onBack={() => setCurrentScreen('main')}
          />
        </div>
      )}

      {currentScreen === 'main' && (
        <>
          <div className="absolute top-8 left-8 z-20 animate-float">
            <Image 
              src="/uno-logo.png" 
              alt="UNO Logo" 
              width={384}
              height={192}
              className="w-32 h-auto drop-shadow-2xl md:w-40 ml-0 lg:w-96" 
              priority
            />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 px-4">
            {userData && (
              <div className="glass-welcome-card mb-4">
                <p className="text-white text-sm font-semibold">
                  {userData.isGuest ? `👋 Invitado: ${userData.username}` : `👋 Bienvenido: ${userData.username}`}
                </p>
              </div>
            )}

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

                  <Button size="lg" className="glass-button glass-button-tertiary group">
                    <Users className="mr-1.5 h-5 w-5 transition-transform group-hover:scale-110" />
                    <span className="text-sm font-semibold">Desarrolladores</span>
                  </Button>
                </div>

                <Button 
                  size="lg" 
                  className="glass-button glass-button-logout group text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-1.5 h-5 w-5 text-white" />
                  <span className="text-sm font-semibold">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {currentScreen === 'game' && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <HalftoneWaves />
          <div className="absolute inset-0 z-[60] flex items-center justify-center w-full h-full p-4">
            <GameRoomMenu 
              onBack={() => setCurrentScreen('room-selection')} 
              onStartGame={() => setCurrentScreen('gameplay')}
              userData={userData} 
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
