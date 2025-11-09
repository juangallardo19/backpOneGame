"use client"

/**
 * Room Page - Game room lobby page
 * URL: /room
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import GameRoomMenuV2 from "@/components/game-room-menu-v2"

export default function RoomPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { room } = useGame()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <GameRoomMenuV2
        onBack={handleBack}
        onStartGame={handleStartGame}
        userData={{
          username: user.nickname || user.email,
          isGuest: false
        }}
        roomCode={room?.code}
      />
    </div>
  )
}
