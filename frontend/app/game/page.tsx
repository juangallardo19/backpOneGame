"use client"

/**
 * Game Page - Game room page
 * URL: /game
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import GamePlay from "@/components/GamePlay"

export default function GamePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { room, gameState, leaveRoomAndDisconnect } = useGame()

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

  // CRITICAL: Handle page close/reload - leave room automatically
  // This ensures player is removed and replaced with bot if game is active
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only trigger when page becomes hidden (user leaving/closing)
      if (document.visibilityState === 'hidden' && room) {
        console.log('🚪 [visibilitychange] Page hidden, leaving room...')

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/rooms/${room.code}/leave`
        const token = localStorage.getItem('uno_token')

        // Use fetch with keepalive - works even when page is closing
        fetch(apiUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          keepalive: true, // CRITICAL: Ensures request completes even if page closes
        }).catch(err => {
          console.error('❌ [visibilitychange] Error leaving room:', err)
        })

        console.log('✅ [visibilitychange] Leave room request sent')
      }
    }

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [room])

  // Handle leaving the game
  const handleLeaveGame = async () => {
    try {
      // Disconnect from game and clean up
      await leaveRoomAndDisconnect()

      // Redirect to room selection
      router.push('/rooms')
    } catch (error) {
      console.error('Error leaving game:', error)
      // Still redirect even if there's an error
      router.push('/rooms')
    }
  }

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
    <GamePlay onBack={handleLeaveGame} />
  )
}
