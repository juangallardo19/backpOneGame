"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, LogIn, Users, Lock, RefreshCw } from "lucide-react"
import Image from "next/image"
import GalaxySpiral from "@/components/GalaxySpiral"
import { roomService } from "@/services/room.service"
import { useNotification } from "@/contexts/NotificationContext"
import { useGame } from "@/contexts/GameContext"
import { useAuth } from "@/contexts/AuthContext"
import { Room } from "@/types/game.types"

interface RoomSelectionScreenProps {
  onCreateRoom: () => void
  onJoinRoomSuccess?: (room: Room) => void
  onBack: () => void
}

export default function RoomSelectionScreen({ onCreateRoom, onJoinRoomSuccess, onBack }: RoomSelectionScreenProps) {
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [showPrivateCodeInput, setShowPrivateCodeInput] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)
  const { success, error: showError } = useNotification()
  const { connectToGame } = useGame()
  const { user } = useAuth()

  // Load public rooms when entering join room screen
  useEffect(() => {
    console.log("📡 useEffect - Estado cambió:", {
      showJoinRoom,
      showPrivateCodeInput,
      shouldLoadRooms: showJoinRoom && !showPrivateCodeInput
    })

    if (showJoinRoom && !showPrivateCodeInput) {
      console.log("🔄 Ejecutando loadPublicRooms automáticamente...")
      loadPublicRooms()
    }
  }, [showJoinRoom, showPrivateCodeInput])

  const loadPublicRooms = async () => {
    setIsLoadingRooms(true)
    try {
      console.log("🔍 Cargando salas públicas...")
      const rooms = await roomService.getPublicRooms()
      console.log("✅ Salas públicas cargadas:", rooms)
      console.log("📊 Cantidad de salas:", rooms.length)

      // CRITICAL: Filter out rooms where the user is already a member
      // This prevents the user from trying to join their own room
      const filteredRooms = rooms.filter(room => {
        if (!user) {
          console.log("⚠️ No hay usuario autenticado, mostrando todas las salas")
          return true
        }

        console.log(`🔍 Revisando sala ${room.code}:`, {
          roomLeaderId: room.leaderId,
          userId: user.id,
          userEmail: user.email,
          players: room.players.map(p => ({ id: p.id, email: p.userEmail }))
        })

        // Check if user is the leader (compare as strings to handle UUID vs number)
        const isLeader = String(room.leaderId) === String(user.id)

        // Check if user is in the players list
        const isPlayer = room.players.some(p => {
          const matchEmail = p.userEmail === user.email
          const matchId = String(p.id) === String(user.id)
          return matchEmail || matchId
        })

        if (isLeader || isPlayer) {
          console.log(`🚫 Filtrando sala ${room.code} - usuario ya es miembro (isLeader: ${isLeader}, isPlayer: ${isPlayer})`)
          return false
        }

        console.log(`✅ Sala ${room.code} - usuario NO es miembro, mostrando`)
        return true
      })

      console.log("📊 Salas después de filtrar:", filteredRooms.length)
      setPublicRooms(filteredRooms)
    } catch (error: any) {
      console.error("❌ Error loading public rooms:", error)
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      showError("Error", "No se pudieron cargar las salas públicas")
    } finally {
      setIsLoadingRooms(false)
    }
  }

  const handleCreateRoom = async () => {
    setIsLoading(true)
    try {
      console.log("🏠 Creando nueva sala...")

      // Crear sala en el backend
      const newRoom = await roomService.createRoom({
        isPrivate: false,
        maxPlayers: 4,
        initialHandSize: 7,
        turnTimeLimit: 60,
        allowStackingCards: true,
        pointsToWin: 500,
        allowBots: true,
      })

      console.log("✅ Sala creada exitosamente:", newRoom)
      success("¡Sala creada!", `Código: ${newRoom.code}`)

      // Conectar al WebSocket de la sala
      const token = localStorage.getItem('uno_auth_token')
      if (token) {
        console.log("🔌 Conectando al WebSocket de la sala creada...")
        await connectToGame(newRoom.code, token)
        console.log("✅ WebSocket conectado")

        // Wait for WebSocket to sync room state
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Navegar INMEDIATAMENTE al lobby
      console.log("🚀 Navegando al lobby de la sala...")
      onCreateRoom()
    } catch (error: any) {
      console.error("❌ Error al crear sala:", error)
      const errorMessage = error.response?.data?.message || error.message || "No se pudo crear la sala"
      showError("Error al crear sala", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinPublicRoom = async (room: Room) => {
    setIsLoading(true)
    try {
      console.log("🔍 Intentando unirse a sala pública:", room.code)

      // Join room via backend API
      const joinedRoom = await roomService.joinRoom(room.code)
      console.log("✅ Unido a la sala exitosamente:", joinedRoom)
      console.log("👥 Jugadores en la sala:", joinedRoom.players)

      success("¡Éxito!", `Te has unido a la sala ${room.code}`)

      // Connect to WebSocket - NOTE: We pass joinedRoom to use for initial state
      const token = localStorage.getItem('uno_auth_token')
      if (token) {
        console.log("🔌 Conectando al WebSocket con información de sala ya obtenida...")
        await connectToGame(room.code, token, joinedRoom)
        console.log("✅ WebSocket conectado")

        // Small wait to ensure WebSocket subscriptions are ready
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Navigate to room (GameRoomMenu will use wsRoom from context)
      if (onJoinRoomSuccess) {
        onJoinRoomSuccess(joinedRoom)
      } else {
        onCreateRoom()
      }
    } catch (error: any) {
      console.error("❌ Error al unirse a la sala:", error)
      const errorMessage = error.response?.data?.message || error.message || "No se pudo unir a la sala"
      showError("Error al unirse", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinPrivateRoom = async () => {
    if (!roomCode.trim()) {
      showError("Error", "Por favor ingresa un código de sala")
      return
    }

    if (roomCode.trim().length !== 6) {
      showError("Error", "El código debe tener 6 caracteres")
      return
    }

    setIsLoading(true)
    try {
      console.log("🔍 Conectando a sala privada con código:", roomCode)

      // Join room via backend API
      const joinedRoom = await roomService.joinRoom(roomCode)
      console.log("✅ Unido a la sala exitosamente:", joinedRoom)
      console.log("👥 Jugadores en la sala:", joinedRoom.players)

      success("¡Éxito!", `Te has unido a la sala ${roomCode}`)

      // Connect to WebSocket - NOTE: We pass joinedRoom to use for initial state
      const token = localStorage.getItem('uno_auth_token')
      if (token) {
        console.log("🔌 Conectando al WebSocket con información de sala ya obtenida...")
        await connectToGame(roomCode, token, joinedRoom)
        console.log("✅ WebSocket conectado")

        // Small wait to ensure WebSocket subscriptions are ready
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Navigate to room (GameRoomMenu will use wsRoom from context)
      if (onJoinRoomSuccess) {
        onJoinRoomSuccess(joinedRoom)
      } else {
        // Si no hay callback, ir a crear sala por defecto
        onCreateRoom()
      }
    } catch (error: any) {
      console.error("❌ Error al unirse a la sala:", error)
      const errorMessage = error.response?.data?.message || error.message || "No se pudo conectar a la sala"
      showError("Error al conectar", errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Galaxy Spiral Background */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <GalaxySpiral />
      </div>

      <div className="glass-room-selection-container">
        <span className="shine shine-top"></span>
        <span className="shine shine-bottom"></span>
        <span className="glow glow-top"></span>
        <span className="glow glow-bottom"></span>
        <span className="glow glow-bright glow-top"></span>
        <span className="glow glow-bright glow-bottom"></span>

      <div className="inner">
        {/* Logo Section */}
        <div className="logo-section">
          <Image
            src="/one-logo.png"
            alt="ONE Logo"
            width={150}
            height={75}
            className="uno-logo"
          />
        </div>

        {!showJoinRoom ? (
          <>
            {/* Main Buttons */}
            <div className="room-options-container">
              <Button
                size="lg"
                className="room-option-button create-room-button glass-button group"
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                <Plus className="mr-3 h-8 w-8 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold">
                    {isLoading ? "CREANDO..." : "CREAR SALA"}
                  </span>
                  <span className="text-sm font-normal opacity-90">Inicia un nuevo juego</span>
                </div>
              </Button>

              <Button
                size="lg"
                className="room-option-button join-room-button glass-button group"
                onClick={() => setShowJoinRoom(true)}
              >
                <LogIn className="mr-3 h-8 w-8 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-2xl font-bold">ENTRAR A SALA</span>
                  <span className="text-sm font-normal opacity-90">Únete a una partida</span>
                </div>
              </Button>
            </div>

            {/* Back Button */}
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={onBack}
                className="glass-back-button flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-base font-semibold">VOLVER</span>
              </button>
            </div>
          </>
        ) : !showPrivateCodeInput ? (
          <>
            {/* Join Room - Public Rooms List */}
            <div className="join-room-container fade-in-up">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Salas Públicas</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-button text-white"
                  onClick={loadPublicRooms}
                  disabled={isLoadingRooms}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Public Rooms List */}
              <div className="public-rooms-list">
                {isLoadingRooms ? (
                  <div className="empty-state">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                    <p>Cargando salas...</p>
                  </div>
                ) : publicRooms.length === 0 ? (
                  <div className="empty-state">
                    <Users className="w-12 h-12 text-gray-400" />
                    <p>No hay salas públicas disponibles</p>
                    <p className="text-sm">¡Crea una nueva sala!</p>
                  </div>
                ) : (
                  publicRooms.map((room) => (
                    <div key={room.code} className="room-card glass-button">
                      <div className="room-info">
                        <div className="room-header">
                          <h3 className="room-name">{room.name || `Sala ${room.code}`}</h3>
                          <span className="room-code">{room.code}</span>
                        </div>
                        <div className="room-details">
                          <span className="players-count">
                            <Users className="w-4 h-4" />
                            {room.players.length}/{room.maxPlayers}
                          </span>
                          <span className={`room-status status-${room.status.toLowerCase()}`}>
                            {room.status === 'WAITING' ? 'Esperando' : room.status === 'IN_GAME' ? 'En juego' : 'Finalizada'}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="join-room-btn glass-button"
                        onClick={() => handleJoinPublicRoom(room)}
                        disabled={isLoading || room.status !== 'WAITING' || room.players.length >= room.maxPlayers}
                      >
                        {room.status !== 'WAITING' ? 'En Juego' :
                         room.players.length >= room.maxPlayers ? 'Llena' :
                         'Unirse'}
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Private Code Button */}
              <Button
                size="lg"
                variant="outline"
                className="private-code-button glass-button group"
                onClick={() => setShowPrivateCodeInput(true)}
              >
                <Lock className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-xl font-bold">SALA PRIVADA</span>
                  <span className="text-sm font-normal opacity-90">Ingresar código</span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="back-from-join-button glass-button bg-transparent text-white mt-3"
                onClick={() => {
                  setShowJoinRoom(false)
                  setPublicRooms([])
                }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                VOLVER
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Join Room - Private Code Input */}
            <div className="join-room-container fade-in-up">
              <h2 className="section-title">Sala Privada</h2>

              <div className="form-group">
                <label className="form-label">Código de Sala</label>
                <div className="code-input-group">
                  <Input
                    type="text"
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="glass-input code-input"
                  />
                  <div className="character-count">
                    {roomCode.length}/6
                  </div>
                </div>
              </div>

              <div className="code-info">
                <p>Formato: 3 letras + 3 números (ej: ABC123)</p>
              </div>

              <Button
                size="lg"
                className="join-submit-button glass-button bg-blue-600 hover:bg-blue-700 w-full"
                onClick={handleJoinPrivateRoom}
                disabled={isLoading}
              >
                <span className="text-2xl font-bold">ENTRAR A SALA</span>
              </Button>

              <Button
                variant="outline"
                className="back-from-join-button glass-button bg-transparent text-white w-full mt-3"
                onClick={() => {
                  setShowPrivateCodeInput(false)
                  setShowJoinRoom(false)
                  setRoomCode("")
                  setPublicRooms([])
                }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                VOLVER
              </Button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .glass-room-selection-container {
          --hue1: 45;
          --hue2: 0;
          --border: 1px;
          --border-color: hsl(var(--hue2), 12%, 20%);
          --radius: 22px;
          --ease: cubic-bezier(0.5, 1, 0.89, 1);

          z-index: 10 !important;
          width: 55% !important;
          max-width: none !important;
          position: relative !important;
          min-height: 55vh;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: var(--radius);
          border: var(--border) solid var(--border-color);
          padding: clamp(12px, 2%, 18px);
          background: linear-gradient(
              235deg,
              hsl(var(--hue1) 50% 10% / 0.8),
              hsl(var(--hue1) 50% 10% / 0) 33%
            ),
            linear-gradient(
              45deg,
              hsl(var(--hue2) 50% 10% / 0.8),
              hsl(var(--hue2) 50% 10% / 0) 33%
            ),
            linear-gradient(hsl(220deg 25% 4.8% / 0.7));
          backdrop-filter: blur(15px);
          box-shadow: hsl(var(--hue2) 50% 2%) 0px 10px 16px -8px,
            hsl(var(--hue2) 50% 4%) 0px 20px 36px -14px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .glass-room-selection-container {
            width: 75%;
            max-width: 500px;
          }
        }

        @media (max-width: 768px) {
          .glass-room-selection-container {
            width: 85%;
            max-width: 480px;
            min-height: 55vh;
            max-height: 88vh;
            padding: clamp(10px, 2.5%, 16px);
          }
        }

        @media (max-width: 480px) {
          .glass-room-selection-container {
            width: 95%;
            max-width: 100%;
            min-height: 60vh;
            max-height: 90vh;
            padding: clamp(10px, 3%, 14px);
          }
        }

        /* Custom scrollbar for main container */
        .glass-room-selection-container::-webkit-scrollbar {
          width: 8px;
        }

        .glass-room-selection-container::-webkit-scrollbar-track {
          background: transparent;
        }

        .glass-room-selection-container::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }

        .glass-room-selection-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        .shine,
        .glow {
          --hue: var(--hue1);
        }

        .shine-bottom,
        .glow-bottom {
          --hue: var(--hue2);
          --conic: 135deg;
        }

        .shine,
        .shine::before,
        .shine::after {
          pointer-events: none;
          border-radius: 0;
          border-top-right-radius: inherit;
          border-bottom-left-radius: inherit;
          border: 1px solid transparent;
          width: 75%;
          height: auto;
          min-height: 0px;
          aspect-ratio: 1;
          display: block;
          position: absolute;
          right: calc(var(--border) * -1);
          top: calc(var(--border) * -1);
          left: auto;
          z-index: 1;
          --start: 12%;
          background: conic-gradient(
            from var(--conic, -45deg) at center in oklch,
            transparent var(--start, 0%),
            hsl(var(--hue), var(--sat, 80%), var(--lit, 60%)),
            transparent var(--end, 50%)
          ) border-box;
          mask: linear-gradient(transparent), linear-gradient(black);
          mask-repeat: no-repeat;
          mask-clip: padding-box, border-box;
          mask-composite: subtract;
          animation: glow 1s var(--ease) both;
        }

        .shine::before,
        .shine::after {
          content: "";
          width: auto;
          inset: -2px;
          mask: none;
        }

        .shine::after {
          z-index: 2;
          --start: 17%;
          --end: 33%;
          background: conic-gradient(
            from var(--conic, -45deg) at center in oklch,
            transparent var(--start, 0%),
            hsl(var(--hue), var(--sat, 80%), var(--lit, 85%)),
            transparent var(--end, 50%)
          );
        }

        .shine-bottom {
          top: auto;
          bottom: calc(var(--border) * -1);
          left: calc(var(--border) * -1);
          right: auto;
          animation-delay: 0.1s;
          animation-duration: 1.8s;
        }

        .glow {
          pointer-events: none;
          border-top-right-radius: calc(var(--radius) * 2.5);
          border-bottom-left-radius: calc(var(--radius) * 2.5);
          border: calc(var(--radius) * 1.25) solid transparent;
          inset: calc(var(--radius) * -2);
          width: 75%;
          height: auto;
          min-height: 0px;
          aspect-ratio: 1;
          display: block;
          position: absolute;
          left: auto;
          bottom: auto;
          opacity: 1;
          filter: blur(12px) saturate(1.25) brightness(0.5);
          mix-blend-mode: plus-lighter;
          z-index: 3;
          animation: glow 1s var(--ease) both;
          animation-delay: 0.2s;
        }

        .glow.glow-bottom {
          inset: calc(var(--radius) * -2);
          top: auto;
          right: auto;
          animation-delay: 0.3s;
        }

        .glow::before,
        .glow::after {
          content: "";
          position: absolute;
          inset: 0;
          border: inherit;
          border-radius: inherit;
          background: conic-gradient(
            from var(--conic, -45deg) at center in oklch,
            transparent var(--start, 0%),
            hsl(var(--hue), var(--sat, 95%), var(--lit, 60%)),
            transparent var(--end, 50%)
          ) border-box;
          mask: linear-gradient(transparent), linear-gradient(black);
          mask-repeat: no-repeat;
          mask-clip: padding-box, border-box;
          mask-composite: subtract;
          filter: saturate(2) brightness(1);
        }

        .glow::after {
          --lit: 70%;
          --sat: 100%;
          --start: 15%;
          --end: 35%;
          border-width: calc(var(--radius) * 1.75);
          border-radius: calc(var(--radius) * 2.75);
          inset: calc(var(--radius) * -0.25);
          z-index: 4;
          opacity: 0.75;
        }

        .glow-bright {
          --lit: 80%;
          --sat: 100%;
          --start: 13%;
          --end: 37%;
          border-width: 5px;
          border-radius: calc(var(--radius) + 2px);
          inset: -7px;
          left: auto;
          filter: blur(2px) brightness(0.66);
          animation-delay: 0.1s;
          animation-duration: 1.5s;
        }

        .glow-bright::after {
          content: none;
        }

        .glow-bright.glow-bottom {
          inset: -7px;
          right: auto;
          top: auto;
          animation-delay: 0.3s;
          animation-duration: 1.1s;
        }

        @keyframes glow {
          0% {
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          10% {
            opacity: 0;
          }
          12% {
            opacity: 0.7;
          }
          16% {
            opacity: 0.3;
            animation-timing-function: var(--ease);
          }
          100% {
            opacity: 1;
            animation-timing-function: var(--ease);
          }
        }

        .inner {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 1.8%, 12px);
          min-height: 100%;
          padding: clamp(8px, 1.5%, 12px) 0;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(4px, 1%, 6px);
          text-align: center;
          margin-bottom: 0;
          margin-top: -50px;
          margin-left: auto;
          margin-right: auto;
          width: 320px !important;
          height: 160px !important;
        }

        .uno-logo {
          filter: drop-shadow(0 8px 16px #0000004d) !important;
          width: 269px !important;
          height: 188px !important;
          margin-bottom: 1.5rem !important;
        }

        @media (max-width: 768px) {
          .uno-logo {
            width: clamp(90px, 35%, 110px);
          }
        }

        @media (max-width: 480px) {
          .uno-logo {
            width: clamp(85px, 40%, 100px);
          }
        }

        .welcome-title {
          color: #fff !important;
          text-shadow: 0 4px 8px #00000080 !important;
          margin: 0 !important;
          font-size: 4rem !important;
          font-weight: 700 !important;
          line-height: 1 !important;
        }

        .room-options-container {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 2%, 12px);
          padding: 0 clamp(6px, 1.5%, 10px);
          margin-top: -20px;
        }

        .room-option-button {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100%;
          padding: clamp(10px, 2.5%, 14px);
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.35) !important;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid rgba(255, 255, 255, 0.15) !important;
          text-align: left;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .room-option-button {
            padding: clamp(8px, 2%, 12px);
          }
        }

        .room-option-button:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.3) !important;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .create-room-button {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.35)) !important;
          border-color: rgba(16, 185, 129, 0.6) !important;
        }

        .create-room-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.55), rgba(5, 150, 105, 0.55)) !important;
          border-color: rgba(16, 185, 129, 0.8) !important;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }

        .join-room-button {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.35), rgba(37, 99, 235, 0.35)) !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
        }

        .join-room-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.55), rgba(37, 99, 235, 0.55)) !important;
          border-color: rgba(59, 130, 246, 0.8) !important;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        }

        .back-button {
          padding: clamp(12px, 3%, 16px);
          font-weight: 600;
          font-size: clamp(0.88rem, 2.4vw, 0.98rem);
          width: 100%;
        }

        /* Join Room Styles */
        .join-room-container {
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 2.5%, 16px);
          animation: fadeInUp 0.5s ease-in-out forwards;
          flex: 1;
          min-height: 0;
          padding: 0 clamp(6px, 1.5%, 10px);
        }

        .section-title {
          font-size: clamp(1.05rem, 2.8vw, 1.2rem);
          font-weight: 700;
          color: white;
          text-align: center;
          letter-spacing: 0.08em;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          margin: 0;
        }

        /* Public Rooms List */
        .public-rooms-list {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 2%, 12px);
          min-height: clamp(180px, 32vh, 240px);
          max-height: clamp(220px, 38vh, 280px);
          overflow-y: auto;
          overflow-x: hidden;
          padding: clamp(10px, 2.5%, 14px);
          background: rgba(0, 0, 0, 0.25);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 768px) {
          .public-rooms-list {
            min-height: clamp(160px, 30vh, 220px);
            max-height: clamp(200px, 36vh, 260px);
          }
        }

        /* Custom scrollbar styles */
        .public-rooms-list::-webkit-scrollbar {
          width: 8px;
        }

        .public-rooms-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
        }

        .public-rooms-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .public-rooms-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: clamp(8px, 2%, 12px);
          padding: clamp(24px, 6%, 36px) clamp(12px, 3%, 18px);
          color: rgba(255, 255, 255, 0.65);
          text-align: center;
          min-height: 150px;
        }

        .empty-state p {
          margin: 0;
          font-size: clamp(0.84rem, 2.2vw, 0.92rem);
        }

        .room-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(10px, 2.5%, 14px);
          background: rgba(0, 0, 0, 0.45) !important;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          border-radius: 10px;
          transition: all 0.25s ease;
          min-height: 70px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          .room-card {
            padding: clamp(8px, 2%, 12px);
            min-height: 65px;
          }
        }

        .room-card:hover {
          background: rgba(0, 0, 0, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.35) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .room-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: clamp(6px, 1.5%, 10px);
        }

        .room-header {
          display: flex;
          align-items: center;
          gap: clamp(8px, 2%, 12px);
          flex-wrap: wrap;
        }

        .room-name {
          font-size: clamp(0.98rem, 2.6vw, 1.08rem);
          font-weight: 650;
          color: white;
          margin: 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }

        .room-code {
          font-size: clamp(0.72rem, 1.9vw, 0.82rem);
          font-weight: 700;
          color: rgba(59, 130, 246, 1);
          background: rgba(59, 130, 246, 0.25);
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          letter-spacing: 0.08em;
          box-shadow: 0 2px 6px rgba(59, 130, 246, 0.2);
        }

        .room-details {
          display: flex;
          align-items: center;
          gap: clamp(10px, 2.5%, 14px);
          font-size: clamp(0.84rem, 2.1vw, 0.92rem);
          color: rgba(255, 255, 255, 0.75);
        }

        .players-count {
          display: flex;
          align-items: center;
          gap: clamp(4px, 1%, 6px);
        }

        .room-status {
          padding: 0.3rem 0.6rem;
          border-radius: 5px;
          font-size: clamp(0.72rem, 1.9vw, 0.78rem);
          font-weight: 650;
        }

        .status-waiting {
          background: rgba(16, 185, 129, 0.25);
          color: rgba(16, 185, 129, 1);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.2);
        }

        .status-in_game {
          background: rgba(251, 191, 36, 0.25);
          color: rgba(251, 191, 36, 1);
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.2);
        }

        .status-finished {
          background: rgba(156, 163, 175, 0.25);
          color: rgba(156, 163, 175, 1);
        }

        .join-room-btn {
          padding: clamp(10px, 2.5%, 14px) clamp(16px, 4%, 22px);
          font-size: clamp(0.84rem, 2.1vw, 0.92rem);
          font-weight: 650;
          background: rgba(59, 130, 246, 0.35) !important;
          border-color: rgba(59, 130, 246, 0.6) !important;
          color: white;
          border-radius: 9px;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        .join-room-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.55) !important;
          border-color: rgba(59, 130, 246, 0.8) !important;
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .join-room-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Private Code Button */
        .private-code-button {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100%;
          padding: clamp(10px, 2.5%, 14px);
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.25) !important;
          border: 2px solid rgba(139, 92, 246, 0.5) !important;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .private-code-button:hover {
          background: rgba(139, 92, 246, 0.4) !important;
          border-color: rgba(139, 92, 246, 0.7) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
        }

        @media (max-width: 768px) {
          .private-code-button {
            padding: clamp(8px, 2%, 12px);
          }
        }

        /* Form Styles */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: clamp(8px, 2%, 12px);
        }

        .form-label {
          color: white;
          font-weight: 650;
          font-size: clamp(0.88rem, 2.4vw, 0.98rem);
          letter-spacing: 0.06em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          margin: 0;
        }

        .code-input-group {
          position: relative;
          width: 100%;
        }

        .code-input {
          width: 100%;
          padding: clamp(12px, 3%, 16px);
          font-size: clamp(1.1rem, 2.8vw, 1.3rem);
          text-align: center;
          letter-spacing: 0.18em;
          font-weight: 700;
          text-transform: uppercase;
          background: linear-gradient(to bottom, hsl(45 20% 20% / 0.25) 50%, hsl(45 50% 50% / 0.12) 180%);
          border: 2px solid hsl(0 13% 18.5% / 0.6);
          border-radius: 10px;
          color: white;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 768px) {
          .code-input {
            padding: clamp(10px, 2.5%, 14px);
            font-size: clamp(1rem, 2.6vw, 1.2rem);
          }
        }

        .code-input::placeholder {
          color: rgba(255, 255, 255, 0.45);
        }

        .code-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.8);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.4),
                      inset 0 2px 8px rgba(0, 0, 0, 0.3);
          background: linear-gradient(to bottom, hsl(45 20% 25% / 0.35) 50%, hsl(45 50% 50% / 0.18) 180%);
        }

        .character-count {
          position: absolute;
          bottom: 0.6rem;
          right: 1.1rem;
          font-size: clamp(0.82rem, 2.2vw, 0.9rem);
          color: rgba(255, 255, 255, 0.65);
          font-weight: 650;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .code-info {
          text-align: center;
          font-size: clamp(0.84rem, 2.1vw, 0.92rem);
          color: rgba(255, 255, 255, 0.7);
        }

        .code-info p {
          margin: 0;
        }

        .join-submit-button {
          width: 100%;
          padding: clamp(12px, 3%, 16px);
          font-size: clamp(1rem, 2.8vw, 1.15rem);
          font-weight: 700;
          letter-spacing: 0.1em;
          border-radius: 10px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.25);
        }

        @media (max-width: 768px) {
          .join-submit-button {
            padding: clamp(10px, 2.5%, 14px);
            font-size: clamp(0.95rem, 2.6vw, 1.08rem);
          }
        }

        .join-submit-button:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.45);
        }

        .join-submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-from-join-button {
          padding: clamp(10px, 2.5%, 14px);
          font-weight: 650;
          font-size: clamp(0.84rem, 2.2vw, 0.92rem);
        }

        @media (max-width: 768px) {
          .back-from-join-button {
            padding: clamp(8px, 2%, 12px);
          }
        }

        /* Animations */
        .fade-in-up {
          animation: fadeInUp 0.5s ease-in-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.glass-input) {
          background: linear-gradient(
            to bottom,
            hsl(var(--hue1) 20% 20% / 0.25) 50%,
            hsl(var(--hue1) 50% 50% / 0.12) 180%
          );
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.6);
          color: white;
        }

        :global(.glass-button) {
          background: linear-gradient(
            90deg,
            hsl(var(--hue1) 29% 13% / 0.55),
            hsl(var(--hue1) 30% 15% / 0.55) 24% 32%,
            hsl(var(--hue1) 5% 7% / 0) 95%
          );
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.35);
          color: #e2e8f0;
          transition: all 0.3s ease;
        }

        :global(.glass-button:hover:not(:disabled)) {
          color: white;
          background: linear-gradient(
            90deg,
            hsl(var(--hue1) 29% 20% / 0.75),
            hsl(var(--hue1) 30% 22% / 0.75) 24% 32%,
            hsl(var(--hue1) 5% 10% / 0.25) 95%
          );
        }
      `}</style>
    </div>
    </>
  )
}
