"use client"

/**
 * Room Page - Página de sala de juego completamente reconstruida
 * URL: /room
 *
 * Esta página maneja el flujo completo de creación y unión a salas:
 * 1. Si el usuario viene de RoomSelectionScreen (ya conectado a una sala) → Mostrar lobby
 * 2. Si el usuario accede directamente → Permitir crear nueva sala
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import GameRoomMenu from "@/components/GameRoomMenu"

export default function RoomPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { room } = useGame()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...')
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleBack = () => {
    router.push('/')
  }

  const handleStartGame = () => {
    router.push('/game')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-2xl">Redirigiendo a login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <GameRoomMenu
        onBack={handleBack}
        onStartGame={handleStartGame}
      />
    </div>
  )
}
