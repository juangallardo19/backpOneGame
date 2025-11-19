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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only leave if user is actually in a room
      if (room) {
        console.log('🚪 [beforeunload] Page closing/reloading, leaving room...')

        try {
          // Use sendBeacon for reliable fire-and-forget request
          // This works even when page is closing
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/rooms/${room.code}/leave`
          const token = localStorage.getItem('uno_token')

          // Make synchronous XHR request (only reliable method in beforeunload)
          const xhr = new XMLHttpRequest()
          xhr.open('DELETE', apiUrl, false) // false = synchronous
          if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          }
          xhr.setRequestHeader('Content-Type', 'application/json')
          xhr.send()

          console.log('✅ [beforeunload] Leave room request sent')
        } catch (error) {
          console.error('❌ [beforeunload] Error leaving room:', error)
        }
      }
    }

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
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
