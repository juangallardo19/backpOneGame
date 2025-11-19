"use client"

/**
 * Room Page - Página de sala de juego completamente reconstruida
 * URL: /room
 *
 * Esta página maneja el flujo completo de creación y unión a salas:
 * 1. Si el usuario viene de RoomSelectionScreen (ya conectado a una sala) → Mostrar lobby
 * 2. Si el usuario accede directamente → Permitir crear nueva sala
 */

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import GameRoomMenu from "@/components/GameRoomMenu"

export default function RoomPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const { room, gameState, leaveRoomAndDisconnect } = useGame()

  // Use refs to keep current values without triggering effect re-runs
  const roomRef = useRef(room)
  const leaveRoomAndDisconnectRef = useRef(leaveRoomAndDisconnect)

  // Flag to indicate we're navigating to game (don't leave room)
  const isNavigatingToGameRef = useRef(false)

  // Update refs when values change
  useEffect(() => {
    roomRef.current = room
  }, [room])

  useEffect(() => {
    leaveRoomAndDisconnectRef.current = leaveRoomAndDisconnect
  }, [leaveRoomAndDisconnect])

  // Detect when game starts (GAME_STARTED event received)
  useEffect(() => {
    if (gameState && gameState.status === 'PLAYING') {
      console.log('🎮 [Room Page] Game started detected, setting navigation flag')
      isNavigatingToGameRef.current = true
    }
  }, [gameState])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...')
      router.push('/login')
    }
  }, [isAuthenticated, router])

  // CRITICAL: Handle page close/reload - leave room automatically
  // This ensures player is removed from room when page closes/reloads
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only trigger when page becomes hidden (user leaving/closing)
      if (document.visibilityState === 'hidden' && roomRef.current) {
        console.log('🚪 [visibilitychange] Page hidden, leaving room...')

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/rooms/${roomRef.current.code}/leave`
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
  }, [])

  // CRITICAL: Leave room via API and cleanup WebSocket when leaving the room page
  // This effect ONLY runs on component unmount, NOT when room state changes
  useEffect(() => {
    return () => {
      // This runs ONLY when the component unmounts (user navigates away)
      // Check if we're navigating to game - if so, DON'T leave room
      if (isNavigatingToGameRef.current) {
        console.log('🎮 [Room Page] Navegando al juego - NO se ejecuta leave')
        return
      }

      // NOT navigating to game - user is leaving the room page
      if (roomRef.current) {
        console.log('🚪 [Room Page] Usuario saliendo de la sala, llamando a leaveRoomAndDisconnect...')
        leaveRoomAndDisconnectRef.current()
      }
    }
    // We intentionally use refs and empty deps to run cleanup only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBack = () => {
    console.log('👈 [Room Page] Botón volver presionado, navegando a home...')
    router.push('/')
  }

  const handleStartGame = () => {
    console.log('🎯 [Room Page] Iniciando juego, estableciendo flag de navegación')
    isNavigatingToGameRef.current = true
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
