"use client"

/**
 * Game Page - Game room page
 * URL: /game
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"

export default function GamePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { room, gameState } = useGame()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // Redirect to home if no active room/game
  useEffect(() => {
    if (isAuthenticated && !room && !gameState) {
      router.push('/')
    }
  }, [isAuthenticated, room, gameState, router])

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-2xl">Redirigiendo a login...</div>
      </div>
    )
  }

  if (!room && !gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-2xl">No hay juego activo...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <h1 className="text-white text-3xl text-center py-8">Juego en Progreso</h1>
      <p className="text-white text-center">Sala: {room?.code || 'N/A'}</p>
      {/* Aquí puedes renderizar el componente del juego cuando esté listo */}
    </div>
  )
}
