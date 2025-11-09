"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, LogIn, Users, Lock, RefreshCw } from "lucide-react"
import Image from "next/image"
import { roomService } from "@/services/room.service"
import { useNotification } from "@/contexts/NotificationContext"
import { useGame } from "@/contexts/GameContext"
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

  // Load public rooms when entering join room screen
  useEffect(() => {
    if (showJoinRoom && !showPrivateCodeInput) {
      loadPublicRooms()
    }
  }, [showJoinRoom, showPrivateCodeInput])

  const loadPublicRooms = async () => {
    setIsLoadingRooms(true)
    try {
      const rooms = await roomService.getPublicRooms()
      setPublicRooms(rooms)
    } catch (error: any) {
      console.error("Error loading public rooms:", error)
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
        await connectToGame(newRoom.code, token)
      }

      // Navegar a la pantalla de configuración de sala
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
      console.log("🔍 Uniendo a sala pública:", room.code)

      // Join room via backend API
      const joinedRoom = await roomService.joinRoom(room.code)
      console.log("✅ Unido a la sala exitosamente:", joinedRoom)
      console.log("👥 Jugadores en la sala:", joinedRoom.players)

      success("¡Éxito!", `Te has unido a la sala ${room.code}`)

      // Connect to WebSocket - this will fetch room data and set wsRoom in context
      const token = localStorage.getItem('uno_auth_token')
      if (token) {
        console.log("🔌 Conectando al WebSocket...")
        await connectToGame(room.code, token)
        console.log("✅ WebSocket conectado, esperando sincronización...")

        // Wait a bit for WebSocket to sync room state
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
      const room = await roomService.joinRoom(roomCode)
      console.log("✅ Unido a la sala exitosamente:", room)
      console.log("👥 Jugadores en la sala:", room.players)

      success("¡Éxito!", `Te has unido a la sala ${roomCode}`)

      // Connect to WebSocket - this will fetch room data and set wsRoom in context
      const token = localStorage.getItem('uno_auth_token')
      if (token) {
        console.log("🔌 Conectando al WebSocket...")
        await connectToGame(roomCode, token)
        console.log("✅ WebSocket conectado, esperando sincronización...")

        // Wait a bit for WebSocket to sync room state
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Navigate to room (GameRoomMenu will use wsRoom from context)
      if (onJoinRoomSuccess) {
        onJoinRoomSuccess(room)
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
            width={200}
            height={100}
            className="uno-logo"
          />
          <h1 className="welcome-title">¡A JUGAR!</h1>
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
                  <span className="text-lg font-bold">
                    {isLoading ? "CREANDO..." : "CREAR SALA"}
                  </span>
                  <span className="text-xs font-normal opacity-90">Inicia un nuevo juego</span>
                </div>
              </Button>

              <Button
                size="lg"
                className="room-option-button join-room-button glass-button group"
                onClick={() => setShowJoinRoom(true)}
              >
                <LogIn className="mr-3 h-8 w-8 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold">ENTRAR A SALA</span>
                  <span className="text-xs font-normal opacity-90">Únete a una partida</span>
                </div>
              </Button>
            </div>

            {/* Back Button */}
            <Button
              variant="outline"
              className="back-button glass-button bg-transparent text-white mt-6"
              onClick={onBack}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              VOLVER
            </Button>
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
                  <span className="text-base font-bold">SALA PRIVADA</span>
                  <span className="text-xs font-normal opacity-90">Ingresar código</span>
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
                <span className="text-lg font-bold">ENTRAR A SALA</span>
              </Button>

              <Button
                variant="outline"
                className="back-from-join-button glass-button bg-transparent text-white w-full mt-3"
                onClick={() => {
                  setShowPrivateCodeInput(false)
                  setRoomCode("")
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

          position: relative;
          width: 90vw;
          max-width: 600px;
          min-height: 500px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          border-radius: var(--radius);
          border: var(--border) solid var(--border-color);
          padding: 2em;
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
            linear-gradient(hsl(220deg 25% 4.8% / 0.66));
          backdrop-filter: blur(12px);
          box-shadow: hsl(var(--hue2) 50% 2%) 0px 10px 16px -8px,
            hsl(var(--hue2) 50% 4%) 0px 20px 36px -14px;
          overflow-y: auto;
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
          gap: 2rem;
        }

        .logo-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .uno-logo {
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        .welcome-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          letter-spacing: 0.1em;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }

        .room-options-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .room-option-button {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          width: 100%;
          padding: 1.5rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3) !important;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          text-align: left;
        }

        .room-option-button:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.5) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }

        .create-room-button {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3)) !important;
          border-color: rgba(16, 185, 129, 0.5) !important;
        }

        .create-room-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.5), rgba(5, 150, 105, 0.5)) !important;
          border-color: rgba(16, 185, 129, 0.7) !important;
        }

        .join-room-button {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.3)) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
        }

        .join-room-button:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(37, 99, 235, 0.5)) !important;
          border-color: rgba(59, 130, 246, 0.7) !important;
        }

        .back-button {
          padding: 0.75rem 2rem;
          font-weight: 600;
          font-size: 0.875rem;
          width: 100%;
        }

        /* Join Room Styles */
        .join-room-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          animation: fadeInUp 0.5s ease-in-out forwards;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: white;
          text-align: center;
          letter-spacing: 0.05em;
        }

        /* Public Rooms List */
        .public-rooms-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 400px;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 3rem 1rem;
          color: rgba(255, 255, 255, 0.6);
          text-align: center;
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        .room-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .room-card:hover {
          background: rgba(0, 0, 0, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.2) !important;
        }

        .room-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .room-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .room-name {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .room-code {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(59, 130, 246, 1);
          background: rgba(59, 130, 246, 0.2);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }

        .room-details {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .players-count {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .room-status {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-waiting {
          background: rgba(16, 185, 129, 0.2);
          color: rgba(16, 185, 129, 1);
        }

        .status-in_game {
          background: rgba(251, 191, 36, 0.2);
          color: rgba(251, 191, 36, 1);
        }

        .status-finished {
          background: rgba(156, 163, 175, 0.2);
          color: rgba(156, 163, 175, 1);
        }

        .join-room-btn {
          padding: 0.5rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          background: rgba(59, 130, 246, 0.3) !important;
          border-color: rgba(59, 130, 246, 0.5) !important;
          color: white;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .join-room-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.5) !important;
          border-color: rgba(59, 130, 246, 0.7) !important;
          transform: scale(1.05);
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
          padding: 1rem;
          border-radius: 10px;
          background: rgba(139, 92, 246, 0.2) !important;
          border: 1px solid rgba(139, 92, 246, 0.4) !important;
          color: white;
          transition: all 0.3s ease;
        }

        .private-code-button:hover {
          background: rgba(139, 92, 246, 0.3) !important;
          border-color: rgba(139, 92, 246, 0.6) !important;
          transform: translateY(-2px);
        }

        /* Form Styles */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-label {
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
        }

        .code-input-group {
          position: relative;
          width: 100%;
        }

        .code-input {
          width: 100%;
          padding: 1rem;
          font-size: 1.25rem;
          text-align: center;
          letter-spacing: 0.15em;
          font-weight: 700;
          text-transform: uppercase;
          background: linear-gradient(to bottom, hsl(45 20% 20% / 0.2) 50%, hsl(45 50% 50% / 0.1) 180%);
          border: 1px solid hsl(0 13% 18.5% / 0.5);
          border-radius: 10px;
          color: white;
        }

        .code-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .code-input:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.7);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
          background: linear-gradient(to bottom, hsl(45 20% 25% / 0.3) 50%, hsl(45 50% 50% / 0.15) 180%);
        }

        .character-count {
          position: absolute;
          bottom: 0.5rem;
          right: 1rem;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
        }

        .code-info {
          text-align: center;
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .code-info p {
          margin: 0;
        }

        .join-submit-button {
          width: 100%;
          padding: 1.25rem;
          font-size: 1.125rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .join-submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
        }

        .join-submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .back-from-join-button {
          padding: 0.75rem 2rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        /* Animations */
        .fade-in-up {
          animation: fadeInUp 0.5s ease-in-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.glass-input) {
          background: linear-gradient(
            to bottom,
            hsl(var(--hue1) 20% 20% / 0.2) 50%,
            hsl(var(--hue1) 50% 50% / 0.1) 180%
          );
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.5);
          color: white;
        }

        :global(.glass-button) {
          background: linear-gradient(
            90deg,
            hsl(var(--hue1) 29% 13% / 0.5),
            hsl(var(--hue1) 30% 15% / 0.5) 24% 32%,
            hsl(var(--hue1) 5% 7% / 0) 95%
          );
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.3);
          color: #d1d5db;
          transition: all 0.3s ease;
        }

        :global(.glass-button:hover:not(:disabled)) {
          color: white;
          background: linear-gradient(
            90deg,
            hsl(var(--hue1) 29% 20% / 0.7),
            hsl(var(--hue1) 30% 22% / 0.7) 24% 32%,
            hsl(var(--hue1) 5% 10% / 0.2) 95%
          );
        }

        /* Scrollbar */
        .public-rooms-list::-webkit-scrollbar {
          width: 8px;
        }

        .public-rooms-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }

        .public-rooms-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .public-rooms-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  )
}
