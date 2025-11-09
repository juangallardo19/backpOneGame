"use client"

/**
 * GameRoomMenu - Sala de juego conectada al backend
 * RF08-RF16, RF17-RF23: Room management and game configuration
 *
 * CHANGELOG:
 * - Connected to backend API (roomService)
 * - Real room codes from backend
 * - WebSocket for real-time player updates
 * - Bot management via API
 * - All game configurations sent to backend
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Play, ArrowLeft, Volume2, Link2, UserPlus, Bot, Users } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import { useNotification } from "@/contexts/NotificationContext"
import { roomService } from "@/services/room.service"
import { gameService } from "@/services/game.service"
import { Room } from "@/types/game.types"

interface UserData {
  username: string
  isGuest: boolean
}

interface GameRoomMenuProps {
  onBack?: () => void
  onStartGame?: () => void
  userData?: UserData | null
  roomCode?: string // Si ya existe una sala, pasar el código
}

export default function GameRoomMenuV2({ onBack, onStartGame, userData, roomCode: existingRoomCode }: GameRoomMenuProps) {
  const { user, token } = useAuth()
  const { connectToGame, gameState, room: wsRoom } = useGame()
  const { success, error: showError } = useNotification()

  // Estado de la sala
  const [room, setRoom] = useState<Room | null>(null)
  const [roomCode, setRoomCode] = useState(existingRoomCode || "")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Configuración del juego (RF17-RF23)
  const [roomType, setRoomType] = useState<"public" | "private">("public")
  const [selectedPreset, setSelectedPreset] = useState<string | null>("clasico")
  const [initialCards, setInitialCards] = useState(7) // RF18: Deal 7 cards each
  const [turnTimeLimit, setTurnTimeLimit] = useState(60) // RF20, RF29: Turn time limit (seconds)
  const [stackCards, setStackCards] = useState(true) // RF21, RF30: Enable +2/+4 stacking
  const [pointsToWin, setPointsToWin] = useState(500) // RF22: Points to win
  const [maxPlayers, setMaxPlayers] = useState(4) // RF17: 2-4 players

  // UI state
  const [showInviteModal, setShowInviteModal] = useState(false)

  // Presets
  const presets = [
    {
      id: "clasico",
      name: "CLÁSICO",
      description: "Partida normal - 500 puntos para ganar",
      icon: "/icons/game-controller.png",
      color: "red",
      config: { initialCards: 7, turnTimeLimit: 60, stackCards: true, pointsToWin: 500 }
    },
    {
      id: "torneo",
      name: "TORNEO",
      description: "Modo competitivo - 1000 puntos, turnos rápidos (45s)",
      icon: "/icons/trophy-icon.png",
      color: "orange",
      config: { initialCards: 7, turnTimeLimit: 45, stackCards: true, pointsToWin: 1000 }
    },
  ]

  // RF08: Create room
  const handleCreateRoom = async () => {
    if (!user) {
      showError("Error", "Debes iniciar sesión para crear una sala")
      return
    }

    setIsCreatingRoom(true)
    try {
      console.log("🏠 Creando sala con configuración:", {
        isPrivate: roomType === "private",
        maxPlayers,
        turnTimeLimit,
        stackCards,
        pointsToWin,
      })

      // Crear sala en el backend (RF08, RF10, RF11, RF17-RF23)
      const newRoom = await roomService.createRoom({
        isPrivate: roomType === "private", // RF10: public/private
        maxPlayers, // RF17: 2-4 players
        initialHandSize: initialCards, // RF18: Deal N cards each
        turnTimeLimit, // RF20, RF29: Turn time limit
        allowStackingCards: stackCards, // RF21, RF30: Stack +2/+4
        pointsToWin, // RF22: Points to win
        allowBots: true,
      })

      console.log("✅ Sala creada:", newRoom)
      setRoom(newRoom)
      setRoomCode(newRoom.code) // RF11: 6-char room code from backend

      // Conectar al WebSocket de la sala
      if (token) {
        console.log("🔌 Conectando al WebSocket de la sala...")
        await connectToGame(newRoom.code, token)
      }

      success("¡Sala creada!", `Código: ${newRoom.code}`)
    } catch (error: any) {
      console.error("❌ Error al crear sala:", error)
      showError("Error", error.response?.data?.message || "No se pudo crear la sala")
    } finally {
      setIsCreatingRoom(false)
    }
  }

  // RF12: Add bots (max 3)
  const handleAddBot = async () => {
    if (!roomCode) {
      showError("Error", "Primero debes crear una sala")
      return
    }

    try {
      console.log("🤖 Agregando bot a la sala...")

      // Agregar bot via API (RF12)
      const updatedRoom = await roomService.addBot(roomCode, "NORMAL")

      console.log("✅ Bot agregado:", updatedRoom)
      success("Bot agregado", "Un bot se ha unido a la sala")

      // El WebSocket debería emitir un evento PLAYER_JOINED con el bot
      // y actualizar automáticamente la lista de jugadores
    } catch (error: any) {
      console.error("❌ Error al agregar bot:", error)
      showError("Error", error.response?.data?.message || "No se pudo agregar el bot")
    }
  }

  // RF13: Remove bots
  const handleRemoveBot = async (botId: string) => {
    if (!roomCode) return

    try {
      console.log("🗑️ Eliminando bot:", botId)

      // Remover bot via API (RF13)
      await roomService.removeBot(roomCode, botId)

      console.log("✅ Bot eliminado")
      success("Bot eliminado", "El bot ha sido removido de la sala")

      // El WebSocket debería emitir un evento PLAYER_LEFT
    } catch (error: any) {
      console.error("❌ Error al eliminar bot:", error)
      showError("Error", error.response?.data?.message || "No se pudo eliminar el bot")
    }
  }

  // RF14: Kick players (leader only)
  const handleKickPlayer = async (playerId: string) => {
    if (!roomCode) return

    try {
      console.log("👢 Expulsando jugador:", playerId)

      // Expulsar jugador via API (RF14)
      await roomService.kickPlayer(roomCode, playerId)

      console.log("✅ Jugador expulsado")
      success("Jugador expulsado", "El jugador ha sido removido de la sala")
    } catch (error: any) {
      console.error("❌ Error al expulsar jugador:", error)
      showError("Error", error.response?.data?.message || "No tienes permiso para expulsar jugadores")
    }
  }

  // RF17: Start game (2-4 players)
  const handleStartGame = async () => {
    if (!roomCode) {
      showError("Error", "No hay sala activa")
      return
    }

    if (!room || room.players.length < 2) {
      showError("Error", "Se necesitan al menos 2 jugadores para iniciar")
      return
    }

    try {
      console.log("🎮 Iniciando juego...")

      // Iniciar juego via API (RF17)
      const gameState = await gameService.startGame(roomCode)

      console.log("✅ Juego iniciado:", gameState)
      success("¡Juego iniciado!", "La partida ha comenzado")

      // Navegar a la pantalla de juego
      if (onStartGame) {
        onStartGame()
      }
    } catch (error: any) {
      console.error("❌ Error al iniciar juego:", error)
      showError("Error", error.response?.data?.message || "No se pudo iniciar el juego")
    }
  }

  // Aplicar preset
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset && preset.config) {
      setInitialCards(preset.config.initialCards)
      setTurnTimeLimit(preset.config.turnTimeLimit)
      setStackCards(preset.config.stackCards)
      setPointsToWin(preset.config.pointsToWin)
      setSelectedPreset(presetId)
    }
  }

  // Copiar código al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    success("Copiado", `Código ${text} copiado al portapapeles`)
  }

  // Sincronizar con room del WebSocket
  useEffect(() => {
    if (wsRoom) {
      console.log('📡 Sincronizando con sala del WebSocket:', wsRoom)
      setRoom(wsRoom)
      setRoomCode(wsRoom.code)
    }
  }, [wsRoom])

  // Verificar si es el líder
  const isLeader = room && user && room.leaderId === user.id

  // Obtener lista de jugadores desde el WebSocket/room
  const players = room?.players && room.players.length > 0 ?
    // Si tenemos información detallada de jugadores del WebSocket
    (room.players || []).map((p, idx) => ({
      id: p.id,
      name: p.nickname,
      isHost: p.id === room.leaderId,
      isBot: p.isBot,
      isEmpty: false,
    })) :
    // Si solo tenemos el count, mostrar slots
    Array.from({ length: room?.maxPlayers || 4 }, (_, idx) => {
      if (idx === 0) {
        return { id: idx + 1, name: userData?.username || "JUGADOR1", isHost: true, isBot: false, isEmpty: false }
      }
      if (idx < (room?.players.length || 1)) {
        return { id: idx + 1, name: `JUGADOR${idx + 1}`, isHost: false, isBot: false, isEmpty: false }
      }
      return { id: idx + 1, name: "VACÍO", isHost: false, isBot: false, isEmpty: true }
    })

  const canStartGame = room && room.players.length >= 2

  return (
    <div className="glass-menu-lobby">
      <span className="shine shine-top"></span>
      <span className="shine shine-bottom"></span>
      <span className="glow glow-top"></span>
      <span className="glow glow-bottom"></span>
      <span className="glow glow-bright glow-top"></span>
      <span className="glow glow-bright glow-bottom"></span>

      <div className="inner">
        <div className="header-section">
          <Button
            variant="outline"
            className="back-button glass-button bg-transparent text-white"
            onClick={onBack || (() => window.history.back())}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            VOLVER
          </Button>

          <div className="logo-container">
            <Image src="/one-logo.png" alt="ONE Logo" width={180} height={80} className="uno-logo" />
          </div>
        </div>

        <div className="main-layout">
          {/* Columna Izquierda: Jugadores */}
          <div className="column players-column">
            <h2 className="column-title">JUGADORES ({room?.players.length || 1}/{room?.maxPlayers || 4})</h2>

            <div className="players-grid">
              {players.map((player) => (
                <div key={player.id} className={`player-card ${player.isEmpty ? 'empty' : ''}`}>
                  <div className="player-info">
                    {player.isHost && <Crown className="crown-icon" size={16} />}
                    {player.isBot && <Bot className="bot-icon" size={16} />}
                    <span className="player-name">{player.name}</span>
                  </div>

                  {!player.isEmpty && !player.isHost && isLeader && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="remove-btn"
                      onClick={() => player.isBot ? handleRemoveBot(player.id.toString()) : handleKickPlayer(player.id.toString())}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {isLeader && (room?.players.length || 0) < (room?.maxPlayers || 4) && (
              <div className="player-actions">
                <Button
                  className="glass-button-secondary w-full"
                  onClick={handleAddBot}
                >
                  <Bot className="mr-2" size={18} />
                  AGREGAR BOT
                </Button>
              </div>
            )}
          </div>

          {/* Columna Central: Configuración */}
          <div className="column config-column">
            <h2 className="column-title">CONFIGURACIÓN DEL JUEGO</h2>

            {/* Presets */}
            <div className="presets-section">
              <Label>MODO DE JUEGO</Label>
              <div className="presets-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
                    onClick={() => applyPreset(preset.id)}
                    title={preset.description}
                  >
                    <div className="preset-icon">
                      {preset.icon && (
                        <img src={preset.icon} alt={preset.name} className="w-8 h-8" />
                      )}
                    </div>
                    <div className="preset-info">
                      <span className="preset-name">{preset.name}</span>
                      <span className="preset-description">{preset.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuraciones (RF18-RF23) */}
            <div className="config-options">
              {/* RF18: Initial cards count */}
              <div className="config-item">
                <Label>CARTAS INICIALES</Label>
                <Select value={initialCards.toString()} onValueChange={(v) => setInitialCards(parseInt(v))}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 cartas</SelectItem>
                    <SelectItem value="7">7 cartas (clásico)</SelectItem>
                    <SelectItem value="10">10 cartas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RF20, RF29: Turn time limit */}
              <div className="config-item">
                <Label>TIEMPO POR TURNO</Label>
                <Select value={turnTimeLimit.toString()} onValueChange={(v) => setTurnTimeLimit(parseInt(v))}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="45">45 segundos</SelectItem>
                    <SelectItem value="60">60 segundos (clásico)</SelectItem>
                    <SelectItem value="90">90 segundos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RF22: Points to win */}
              <div className="config-item">
                <Label>PUNTOS PARA GANAR</Label>
                <Select value={pointsToWin.toString()} onValueChange={(v) => setPointsToWin(parseInt(v))}>
                  <SelectTrigger className="glass-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">200 puntos</SelectItem>
                    <SelectItem value="500">500 puntos (clásico)</SelectItem>
                    <SelectItem value="1000">1000 puntos (torneo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* RF21, RF30: Stack +2/+4 cards */}
              <div className="config-item">
                <Label>ACUMULAR +2 Y +4</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={stackCards}
                    onCheckedChange={setStackCards}
                  />
                  <span className="text-sm text-white/70">
                    {stackCards ? "Activado" : "Desactivado"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Código y Acciones */}
          <div className="column code-column">
            <h2 className="column-title">CÓDIGO DE SALA</h2>

            {/* RF11: 6-char room code */}
            <div className="room-code-display">
              <div className="code-box">
                <span className="code-text">{roomCode || "------"}</span>
              </div>

              {roomCode && (
                <Button
                  className="glass-button-secondary"
                  onClick={() => copyToClipboard(roomCode)}
                >
                  <Link2 className="mr-2" size={16} />
                  COPIAR CÓDIGO
                </Button>
              )}
            </div>

            {/* RF10: Public/Private */}
            <div className="room-visibility">
              <Label>VISIBILIDAD</Label>
              <div className="visibility-toggle">
                <button
                  className={`visibility-btn ${roomType === "public" ? "active" : ""}`}
                  onClick={() => setRoomType("public")}
                >
                  PÚBLICA
                </button>
                <button
                  className={`visibility-btn ${roomType === "private" ? "active" : ""}`}
                  onClick={() => setRoomType("private")}
                >
                  PRIVADA
                </button>
              </div>
            </div>

            {/* RF17: Start game button */}
            {isLeader && (
              <Button
                className="start-game-btn glass-button-primary w-full"
                onClick={handleStartGame}
                disabled={!canStartGame || isCreatingRoom}
                size="lg"
              >
                <Play className="mr-2" size={20} />
                {canStartGame ? "INICIAR JUEGO" : `ESPERANDO JUGADORES (${room?.players.length || 1}/2)`}
              </Button>
            )}

            {!isLeader && (
              <div className="waiting-host">
                <p className="text-white/70 text-center text-sm">
                  Esperando que el líder inicie la partida...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de invitación */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="glass-dialog">
          <DialogHeader>
            <DialogTitle>Invitar Jugadores</DialogTitle>
            <DialogDescription>
              Comparte este código con tus amigos para que se unan a la sala
            </DialogDescription>
          </DialogHeader>

          <div className="invite-content">
            <div className="invite-code">
              <span className="code-large">{roomCode}</span>
            </div>

            <Button
              className="glass-button-primary w-full"
              onClick={() => {
                copyToClipboard(roomCode)
                setShowInviteModal(false)
              }}
            >
              COPIAR Y CERRAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        /* Mantener todos los estilos originales aquí */
        /* (Los estilos son muy extensos, así que los dejaré como referencia) */

        .glass-menu-lobby {
          position: relative;
          width: 95vw;
          max-width: 1400px;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          border-radius: 22px;
          padding: 2em;
          background: linear-gradient(
            235deg,
            hsl(45 50% 10% / 0.8),
            hsl(45 50% 10% / 0) 33%
          ),
          linear-gradient(
            45deg,
            hsl(0 50% 10% / 0.8),
            hsl(0 50% 10% / 0) 33%
          ),
          linear-gradient(hsl(220deg 25% 4.8% / 0.66));
          backdrop-filter: blur(12px);
        }

        .inner {
          position: relative;
          z-index: 10;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .main-layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          gap: 2rem;
        }

        .column {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .column-title {
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .players-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .player-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .player-card.empty {
          opacity: 0.4;
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .player-name {
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .crown-icon {
          color: #FFD700;
        }

        .bot-icon {
          color: #60A5FA;
        }

        .player-actions {
          margin-top: 1rem;
        }

        .config-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1rem;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .preset-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          color: white;
          font-weight: 600;
        }

        .preset-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preset-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-align: center;
        }

        .preset-name {
          font-weight: 700;
          font-size: 0.875rem;
          color: white;
        }

        .preset-description {
          font-size: 0.625rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.2;
        }

        .preset-card.selected {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.2);
        }

        .preset-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .room-code-display {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .code-box {
          background: rgba(0, 0, 0, 0.4);
          padding: 1.5rem;
          border-radius: 12px;
          text-align: center;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .code-text {
          color: white;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 0.2em;
          font-family: monospace;
        }

        .visibility-toggle {
          display: flex;
          gap: 0.5rem;
        }

        .visibility-btn {
          flex: 1;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .visibility-btn.active {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.2);
        }

        .start-game-btn {
          margin-top: 2rem;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .waiting-host {
          margin-top: 2rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        @media (max-width: 1024px) {
          .main-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
