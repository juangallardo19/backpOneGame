"use client"

/**
 * Rooms Page - Página de selección de salas
 * URL: /rooms
 */

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import RoomSelectionScreen from "@/components/RoomSelectionScreen"

export default function RoomsPage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('⚠️ Usuario no autenticado, redirigiendo a login...')
      router.push('/login')
    }
  }, [isAuthenticated, router])

  const handleCreateRoom = () => {
    router.push('/room')
  }

  const handleBack = () => {
    router.push('/')
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="text-white text-2xl">Redirigiendo a login...</div>
      </div>
    )
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{background: 'radial-gradient(circle at center, #ff8c00 0%, #ff4500 20%, #dc2626 40%, #8b0000 80%, #000000 100%)'}}>
      <RoomSelectionScreen
        onCreateRoom={handleCreateRoom}
        onJoinRoomSuccess={() => router.push('/room')}
        onBack={handleBack}
      />
    </main>
  )
}
