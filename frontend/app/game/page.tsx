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
    console.log('🔧 [Game Page] Setting up page close detection event listeners')

    const sendLeaveRequest = () => {
      if (!room) {
        console.log('⚠️ [Page Close] No room found, skipping leave request')
        return false
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/rooms/${room.code}/beacon-leave`
      const token = localStorage.getItem('uno_token')

      console.log('🚪 [Page Close] Sending leave room request for room:', room.code)

      // Try sendBeacon first (most reliable for page unload)
      if (navigator.sendBeacon) {
        console.log('📡 [sendBeacon] Attempting sendBeacon...')
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
      console.log('📡 [fetch keepalive] Attempting fetch with keepalive...')
      try {
        fetch(`${apiUrl}?token=${encodeURIComponent(token || '')}`, {
          method: 'POST', // Use POST for beacon-leave endpoint
          headers: {
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
      console.log('👁️ [visibilitychange] Event fired, visibility state:', document.visibilityState)
      if (document.visibilityState === 'hidden') {
        console.log('🚪 [visibilitychange] Page hidden, sending leave request...')
        sendLeaveRequest()
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('⚡ [beforeunload] Event fired')
      sendLeaveRequest()
      // Don't show confirmation dialog
      // e.preventDefault()
      // e.returnValue = ''
    }

    const handlePageHide = () => {
      console.log('📴 [pagehide] Event fired')
      sendLeaveRequest()
    }

    const handleUnload = () => {
      console.log('💥 [unload] Event fired')
      sendLeaveRequest()
    }

    // Register all event listeners
    console.log('✅ [Game Page] Registering event listeners: visibilitychange, beforeunload, pagehide, unload')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('unload', handleUnload)

    // Cleanup
    return () => {
      console.log('🧹 [Game Page] Cleaning up event listeners')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('unload', handleUnload)
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
