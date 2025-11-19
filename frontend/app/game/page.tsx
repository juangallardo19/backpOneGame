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
    const sendLeaveRequest = () => {
      if (!room) return false

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/rooms/${room.code}/leave`
      const token = localStorage.getItem('uno_token')

      console.log('🚪 [Page Close] Sending leave room request...')

      // Try sendBeacon first (most reliable for page unload)
      if (navigator.sendBeacon) {
        // sendBeacon requires a Blob with proper content type
        const blob = new Blob([''], { type: 'application/json' })
        const success = navigator.sendBeacon(
          `${apiUrl}?token=${encodeURIComponent(token || '')}`,
          blob
        )

        if (success) {
          console.log('✅ [sendBeacon] Leave room request sent successfully')
          return true
        }
        console.warn('⚠️ [sendBeacon] Failed, trying fetch keepalive...')
      }

      // Fallback to fetch with keepalive
      try {
        fetch(apiUrl, {
          method: 'POST', // Use POST for sendBeacon endpoint
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          keepalive: true,
        })
        console.log('✅ [fetch keepalive] Leave room request sent')
        return true
      } catch (err) {
        console.error('❌ [fetch keepalive] Error:', err)
        return false
      }
    }

    // Multiple event listeners for maximum compatibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendLeaveRequest()
      }
    }

    const handleBeforeUnload = () => {
      sendLeaveRequest()
    }

    const handlePageHide = () => {
      sendLeaveRequest()
    }

    // Register all event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
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
