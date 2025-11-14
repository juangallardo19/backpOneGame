"use client"

/**
 * GameRoomMenu - Componente de sala de juego completamente reconstruido
 *
 * Este componente maneja dos estados:
 * 1. Configuración: Permite crear una nueva sala con configuraciones personalizadas
 * 2. Lobby: Muestra la sala creada con jugadores, configuración, y controles
 *
 * CARACTERÍSTICAS:
 * - Sincronización en tiempo real con WebSocket
 * - Gestión de jugadores y bots
 * - Configuración de juego personalizable
 * - Verificación de permisos (líder vs jugador)
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Play, ArrowLeft, Link2, Bot, Users, Settings, Lock, Unlock } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import { useNotification } from "@/contexts/NotificationContext"
import { roomService } from "@/services/room.service"
import { gameService } from "@/services/game.service"
import { Room, Player } from "@/types/game.types"

interface GameRoomMenuProps {
  onBack?: () => void
  onStartGame?: () => void
}

export default function GameRoomMenu({ onBack, onStartGame }: GameRoomMenuProps) {
  const { user, token } = useAuth()
  const { room: wsRoom, connectToGame, gameState } = useGame()
  const { success, error: showError } = useNotification()

  // Estado de la sala
  const [room, setRoom] = useState<Room | null>(null)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)

  // Configuración del juego (para crear sala)
  const [roomType, setRoomType] = useState<"public" | "private">("public")
  const [selectedPreset, setSelectedPreset] = useState<string>("clasico")
  const [initialCards, setInitialCards] = useState(7)
  const [turnTimeLimit, setTurnTimeLimit] = useState(60)
  const [stackCards, setStackCards] = useState(true)
  const [pointsToWin, setPointsToWin] = useState(500)
  const [maxPlayers, setMaxPlayers] = useState(4)

  // Presets de configuración
  const presets = [
    {
      id: "clasico",
      name: "CLÁSICO",
      description: "Partida casual - configuración personalizable",
      icon: "/icons/game-controller.png",
      color: "green",
      config: { initialCards: 7, turnTimeLimit: 60, stackCards: true, pointsToWin: 500 },
      customizable: true
    },
    {
      id: "torneo",
      name: "TORNEO",
      description: "Modo competitivo - primero en 1000 puntos gana",
      icon: "/icons/trophy-icon.png",
      color: "orange",
      config: { initialCards: 7, turnTimeLimit: 45, stackCards: false, pointsToWin: 1000 },
      customizable: false
    },
  ]

  // Sincronizar con room del WebSocket
  useEffect(() => {
    if (wsRoom) {
      console.log('📡 Sincronizando con sala del WebSocket:', wsRoom)
      console.log('👥 Jugadores en wsRoom:', wsRoom.players)
      console.log('🔑 Room code:', wsRoom.code)
      console.log('👑 Leader ID:', wsRoom.leaderId)
      setRoom(wsRoom)
    }
  }, [wsRoom])

  // CRITICAL: Auto-reconnect to current room on page load/reload
  useEffect(() => {
    const reconnectToCurrentRoom = async () => {
      // Only try to reconnect if user is logged in and has no room yet
      if (!user || !token || room) {
        return
      }

      // CRITICAL: Check if user was kicked recently (within last 10 seconds)
      const kickedFlag = localStorage.getItem('uno_kicked_flag')
      const kickedTimestamp = localStorage.getItem('uno_kicked_timestamp')

      if (kickedFlag === 'true' && kickedTimestamp) {
        const timeSinceKick = Date.now() - parseInt(kickedTimestamp)
        if (timeSinceKick < 10000) { // 10 seconds
          console.log('🚫 Usuario fue expulsado recientemente, evitando reconexión automática')
          // Clear the flag after checking
          localStorage.removeItem('uno_kicked_flag')
          localStorage.removeItem('uno_kicked_timestamp')
          return
        }
      }

      // Clear old kick flags
      localStorage.removeItem('uno_kicked_flag')
      localStorage.removeItem('uno_kicked_timestamp')

      try {
        console.log('🔄 Verificando si el usuario tiene una sala activa...')
        const currentRoom = await roomService.getCurrentRoom()

        if (currentRoom) {
          console.log('✅ Sala activa encontrada:', currentRoom.code)
          console.log('👥 Jugadores en sala:', currentRoom.players.length)

          // Set room state
          setRoom(currentRoom)

          // Reconnect to WebSocket
          console.log('🔌 Reconectando al WebSocket de la sala...')
          await connectToGame(currentRoom.code, token)

          success('Reconectado', `Te has reconectado a la sala ${currentRoom.code}`)
        } else {
          console.log('ℹ️ Usuario no está en ninguna sala')
        }
      } catch (error: any) {
        console.error('❌ Error al verificar sala actual:', error)
        // No mostrar error al usuario, es un check silencioso
      }
    }

    reconnectToCurrentRoom()
  }, [user, token]) // Only run when user/token changes (on mount if logged in)

  // CRITICAL: Redirect ALL players when game starts
  useEffect(() => {
    console.log('🔍 [REDIRECT CHECK] gameState cambió:', {
      hasGameState: !!gameState,
      status: gameState?.status,
      sessionId: gameState?.sessionId
    })

    if (gameState && gameState.status === 'PLAYING') {
      console.log('🎮 [REDIRECT] Juego iniciado detectado! Redirigiendo a todos los jugadores...')
      console.log('📍 [REDIRECT] Usuario actual:', user?.email)
      console.log('🎯 [REDIRECT] Estado del juego:', gameState)

      // Wait a bit to ensure state is synced
      setTimeout(() => {
        console.log('🚀 [REDIRECT] Ejecutando redirección...')
        if (onStartGame) {
          onStartGame()
        } else {
          console.error('❌ [REDIRECT] onStartGame no está definido!')
        }
      }, 500)
    } else {
      console.log('⏸️ [REDIRECT] No se redirige - condiciones no cumplidas')
    }
  }, [gameState, onStartGame, user])

  // Verificar si el usuario actual es el líder
  const isLeader = room && user && room.players.some(p =>
    p.userEmail === user.email && p.id === room.leaderId
  )

  // CRITICAL FIX: Poll room status for non-leaders
  // This is a workaround because backend doesn't send GAME_STARTED to room topic
  useEffect(() => {
    if (!room || !user || isLeader) {
      return; // Only poll for non-leaders
    }

    console.log('🔄 [POLLING] Iniciando polling para detectar inicio de juego (jugador no líder)')

    const pollInterval = setInterval(async () => {
      try {
        console.log('🔍 [POLLING] Verificando si el juego ya inició...')

        // Check room status
        const updatedRoom = await roomService.getRoomByCode(room.code)

        console.log('📊 [POLLING] Estado de sala:', updatedRoom.status)

        if (updatedRoom.status === 'IN_GAME' || updatedRoom.status === 'IN_PROGRESS') {
          console.log('🎮 [POLLING] ¡Juego iniciado detectado!')
          console.log('⚠️ [POLLING] Esperando evento GAME_STARTED por WebSocket...')
          console.log('💡 [POLLING] El sessionId será recibido automáticamente vía WebSocket')

          // CRITICAL FIX: Don't try to fetch game state with roomCode
          // The endpoint /api/game/{sessionId}/state requires sessionId (UUID), not roomCode
          // Instead, we rely on the GAME_STARTED WebSocket event which contains the sessionId

          // Stop polling - WebSocket will handle the reconnection
          clearInterval(pollInterval)
          console.log('🛑 [POLLING] Polling detenido, confiando en WebSocket para reconexión')
        }
      } catch (error) {
        console.error('❌ [POLLING] Error:', error)
      }
    }, 2000) // Poll every 2 seconds

    // Cleanup on unmount
    return () => {
      console.log('🛑 [POLLING] Deteniendo polling')
      clearInterval(pollInterval)
    }
  }, [room, user, isLeader, token, connectToGame])

  // Debug: Log isLeader calculation
  useEffect(() => {
    if (room && user) {
      console.log('🔐 Calculando isLeader...')
      console.log('  Usuario actual:', user.email)
      console.log('  Leader ID de sala:', room.leaderId)
      console.log('  Jugadores:', room.players.map(p => ({ email: p.userEmail, id: p.id, isLeader: p.id === room.leaderId })))
      console.log('  ¿Es líder?:', isLeader)
    }
  }, [room, user, isLeader])

  // Crear nueva sala
  const handleCreateRoom = async () => {
    if (!user || !token) {
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

      // Crear sala en el backend
      const newRoom = await roomService.createRoom({
        isPrivate: roomType === "private",
        maxPlayers,
        initialHandSize: initialCards,
        turnTimeLimit,
        allowStackingCards: stackCards,
        pointsToWin,
        tournamentMode: selectedPreset === "torneo",
        allowBots: true,
      })

      console.log("✅ Sala creada:", newRoom)
      setRoom(newRoom)

      // Conectar al WebSocket de la sala
      console.log("🔌 Conectando al WebSocket de la sala...")
      await connectToGame(newRoom.code, token)

      success("¡Sala creada!", `Código: ${newRoom.code}`)
    } catch (error: any) {
      console.error("❌ Error al crear sala:", error)
      showError("Error", error.response?.data?.message || "No se pudo crear la sala")
    } finally {
      setIsCreatingRoom(false)
    }
  }

  // Agregar bot (dificultad general fija para comportamiento realista)
  const handleAddBot = async () => {
    if (!room) return

    try {
      console.log("🤖 Agregando bot a la sala...")
      const updatedRoom = await roomService.addBot(room.code)
      console.log("✅ Bot agregado:", updatedRoom)
      setRoom(updatedRoom)
      success("Bot agregado", "Un bot se ha unido a la sala")
    } catch (error: any) {
      console.error("❌ Error al agregar bot:", error)
      showError("Error", error.response?.data?.message || "No se pudo agregar el bot")
    }
  }

  // Remover bot
  const handleRemoveBot = async (botId: string) => {
    if (!room) return

    try {
      console.log("🗑️ Eliminando bot:", botId)
      await roomService.removeBot(room.code, botId)
      console.log("✅ Bot eliminado")
      success("Bot eliminado", "El bot ha sido removido de la sala")
    } catch (error: any) {
      console.error("❌ Error al eliminar bot:", error)
      showError("Error", error.response?.data?.message || "No se pudo eliminar el bot")
    }
  }

  // Expulsar jugador
  const handleKickPlayer = async (playerId: string) => {
    if (!room) return

    try {
      console.log("👢 Expulsando jugador:", playerId)
      await roomService.kickPlayer(room.code, playerId)
      console.log("✅ Jugador expulsado")
      success("Jugador expulsado", "El jugador ha sido removido de la sala")
    } catch (error: any) {
      console.error("❌ Error al expulsar jugador:", error)
      showError("Error", error.response?.data?.message || "No tienes permiso para expulsar jugadores")
    }
  }

  // Cambiar privacidad de sala
  const handleTogglePrivacy = async () => {
    if (!room) return

    try {
      console.log("🔐 Cambiando privacidad de sala:", room.code)
      const updatedRoom = await roomService.toggleRoomPrivacy(room.code)
      console.log("✅ Privacidad cambiada a:", updatedRoom.isPrivate ? "Privada" : "Pública")
      setRoom(updatedRoom)
      success(
        "Privacidad actualizada",
        updatedRoom.isPrivate ? "La sala ahora es privada" : "La sala ahora es pública"
      )
    } catch (error: any) {
      console.error("❌ Error al cambiar privacidad:", error)
      showError("Error", "No se pudo cambiar la privacidad de la sala")
    }
  }

  // Iniciar juego
  const handleStartGame = async () => {
    if (!room) {
      showError("Error", "No hay sala activa")
      return
    }

    if (room.players.length < 2) {
      showError("Error", "Se necesitan al menos 2 jugadores para iniciar")
      return
    }

    try {
      console.log("🎮 [LÍDER] Iniciando juego desde sala:", room.code)
      console.log("👥 [LÍDER] Jugadores en sala:", room.players.map(p => p.nickname))

      // Use the new endpoint that starts game from roomCode
      const result = await gameService.startGameFromRoom(room.code)

      console.log("✅ [LÍDER] Juego iniciado exitosamente")
      console.log("📝 [LÍDER] Session ID:", result.sessionId)
      console.log("🔑 [LÍDER] Room Code anterior:", room.code)

      // CRITICAL: Connect to game WebSocket with the sessionId
      console.log("🔌 [LÍDER] Conectando al WebSocket del juego con sessionId:", result.sessionId)
      await connectToGame(result.sessionId, token || '')

      console.log("✅ [LÍDER] Conectado al WebSocket del juego")

      success("¡Juego iniciado!", "La partida ha comenzado")

      // Wait a bit for WebSocket to connect and sync state
      setTimeout(() => {
        console.log("🚀 [LÍDER] Navegando a /game")
        // Navigate to game with the sessionId
        if (onStartGame) {
          onStartGame()
        }
      }, 500)
    } catch (error: any) {
      console.error("❌ [LÍDER] Error al iniciar juego:", error)
      const errorMessage = error.response?.data || error.message || "No se pudo iniciar el juego"
      showError("Error", errorMessage)
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

  // Transferir liderazgo
  const handleTransferLeader = async (playerId: string) => {
    if (!room) return

    try {
      console.log("👑 Transfiriendo liderazgo a:", playerId)
      const updatedRoom = await roomService.transferLeader(room.code, playerId)
      console.log("✅ Liderazgo transferido")
      setRoom(updatedRoom)
      success("Liderazgo transferido", "El nuevo líder ha sido asignado")
    } catch (error: any) {
      console.error("❌ Error al transferir liderazgo:", error)
      showError("Error", error.response?.data?.message || "No se pudo transferir el liderazgo")
    }
  }

  // Determinar si se puede iniciar el juego
  const canStartGame = room && room.players.length >= 2 && room.players.length <= room.maxPlayers

  // Renderizar lista de jugadores
  const renderPlayers = () => {
    if (!room) return null

    const players = room.players || []
    const emptySlots = room.maxPlayers - players.length

    return (
      <div className="players-grid">
        {/* Jugadores actuales */}
        {players.map((player) => {
          const isPlayerLeader = player.id === room.leaderId
          // Mostrar email si no hay nickname, o un texto por defecto
          const displayName = player.nickname?.trim() || player.userEmail || 'Jugador'

          // Determinar el tipo de jugador para el estilo del card
          const playerType = isPlayerLeader ? 'leader' : (player.isBot ? 'bot' : 'player')

          return (
            <div key={player.id} style={{
              background: isPlayerLeader 
                ? 'linear-gradient(135deg, rgba(255, 229, 92, 0.3), rgba(255, 215, 0, 0.2))'
                : player.isBot 
                ? 'linear-gradient(135deg, rgba(196, 181, 253, 0.3), rgba(139, 92, 246, 0.2))'
                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1))',
              border: isPlayerLeader 
                ? '2px solid #FFE55C'
                : player.isBot 
                ? '2px solid #C4B5FD'
                : '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              padding: '8px',
              marginBottom: '8px',
              boxShadow: isPlayerLeader 
                ? '0 0 20px rgba(255, 229, 92, 0.3)'
                : player.isBot 
                ? '0 0 20px rgba(196, 181, 253, 0.3)'
                : '0 0 10px rgba(255, 255, 255, 0.1)'
            }}>
              <div className={`player-card ${isPlayerLeader ? 'leader-card' : ''} ${player.isBot ? 'bot-card' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                  <div className="player-avatar">
                    {player.isBot ? (
                      <div className="avatar-bot">
                        <Bot size={24} style={{color: '#FFFFFF'}} />
                      </div>
                    ) : (
                      <div className={`avatar-human ${isPlayerLeader ? 'avatar-leader' : ''}`}>
                        <Users size={24} style={{color: isPlayerLeader ? '#FFE55C' : '#FFFFFF'}} />
                      </div>
                    )}
                  </div>

                  <div className="player-info" style={{ flex: 1 }}>
                    <div className="player-name-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPlayerLeader && (
                        <Crown className="crown-icon-inline" size={16} style={{color: '#FFE55C'}} />
                      )}
                      <span className="player-name" style={{color: '#FFFFFF', fontSize: '14px', fontWeight: '600'}}>{displayName}</span>
                    </div>
                    <div className="player-status" style={{ marginTop: '2px' }}>
                      {isPlayerLeader ? (
                        <span className="status-badge leader-status" style={{color: '#FFE55C', fontSize: '11px'}}>LÍDER</span>
                      ) : player.isBot ? (
                        <span className="status-badge bot-status" style={{color: '#C4B5FD', fontSize: '11px'}}>BOT</span>
                      ) : (
                        <span className="status-badge player-status" style={{color: '#93C5FD', fontSize: '11px'}}>JUGADOR</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Acciones del líder */}
                {isLeader && player.id !== room.leaderId && (
                  <div className="player-actions">
                    {/* Botón expulsar */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="action-btn kick-btn"
                      onClick={() => player.isBot ? handleRemoveBot(player.id) : handleKickPlayer(player.id)}
                      title={player.isBot ? "Eliminar bot" : "Expulsar jugador"}
                      style={{color: '#FFFFFF'}}
                    >
                      ✕
                    </Button>

                    {/* Botón transferir liderazgo (solo para jugadores humanos) */}
                    {!player.isBot && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="action-btn transfer-btn"
                        onClick={() => handleTransferLeader(player.id)}
                        title="Transferir liderazgo"
                        style={{color: '#FFFFFF'}}
                      >
                        <Crown size={14} style={{color: '#FFFFFF'}} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Slots vacíos */}
        {Array.from({ length: emptySlots }, (_, idx) => (
          <div key={`empty-${idx}`} style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            border: '2px dashed rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '8px',
            marginBottom: '8px',
            boxShadow: 'none'
          }}>
            <div className="player-card empty">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div className="player-avatar">
                  <div className="avatar-empty">
                    <Users size={24} style={{color: 'rgba(255, 255, 255, 0.6)'}} />
                  </div>
                </div>
                <div className="player-info" style={{ flex: 1 }}>
                  <div className="player-name-container">
                    <span className="player-name empty-name" style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', fontWeight: '600'}}>Esperando jugador...</span>
                  </div>
                  <div className="player-status" style={{ marginTop: '2px' }}>
                    <span className="status-badge empty-status" style={{color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px'}}>VACÍO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="glass-menu-lobby">
      <span className="shine shine-top"></span>
      <span className="shine shine-bottom"></span>
      <span className="glow glow-top"></span>
      <span className="glow glow-bottom"></span>
      <span className="glow glow-bright glow-top"></span>
      <span className="glow glow-bright glow-bottom"></span>

      <div className="inner">
        {/* Header */}
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

        {/* MODO: No hay sala - Mostrar configuración para crear */}
        {!room && (
          <div className="config-mode">
            <h2 className="mode-title">
              <Settings className="inline-block mr-2" size={24} />
              CONFIGURAR NUEVA SALA
            </h2>

            <div className="config-grid">
              {/* Presets */}
              <div className="config-section">
                <Label className="config-label">MODO DE JUEGO</Label>
                <div className="presets-grid">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      className={`preset-card ${selectedPreset === preset.id ? 'selected' : ''}`}
                      onClick={() => applyPreset(preset.id)}
                    >
                      {preset.icon && <Image src={preset.icon} alt={preset.name} width={48} height={48} className="preset-icon" />}
                      <div className="preset-info">
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-desc">{preset.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuraciones */}
              {selectedPreset === "clasico" && (
                <div className="config-section">
                  <Label className="config-label">CONFIGURACIONES</Label>

                  <div className="config-options">
                    {/* Cartas iniciales */}
                    <div className="config-item">
                      <Label>Cartas Iniciales</Label>
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

                    {/* Tiempo por turno */}
                    <div className="config-item">
                      <Label>Tiempo por Turno</Label>
                      <Select value={turnTimeLimit.toString()} onValueChange={(v) => setTurnTimeLimit(parseInt(v))}>
                        <SelectTrigger className="glass-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 segundos</SelectItem>
                          <SelectItem value="45">45 segundos</SelectItem>
                          <SelectItem value="60">60 segundos</SelectItem>
                          <SelectItem value="90">90 segundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Acumular +2/+4 */}
                    <div className="config-item">
                      <Label>Acumular +2 y +4</Label>
                      <div className="flex items-center gap-2">
                        <Switch checked={stackCards} onCheckedChange={setStackCards} />
                        <span className="text-sm text-white/70">
                          {stackCards ? "Activado" : "Desactivado"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visibilidad */}
              <div className="config-section">
                <Label className="config-label">VISIBILIDAD</Label>
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

              {/* Botón crear sala */}
              <Button
                className="create-room-btn glass-button-primary w-full"
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                size="lg"
              >
                <Users className="mr-2" size={20} />
                {isCreatingRoom ? "CREANDO SALA..." : "CREAR SALA"}
              </Button>
            </div>
          </div>
        )}

        {/* MODO: Sala creada - Mostrar lobby */}
        {room && (
          <div className="lobby-mode">
            <div className="lobby-grid">
              {/* Columna Izquierda: Jugadores */}
              <div className="lobby-column">
                <h2 className="column-title">
                  <Users className="inline-block mr-2" size={20} />
                  JUGADORES ({room.players.length}/{room.maxPlayers})
                </h2>

                {renderPlayers()}

                {/* Botón agregar bot (solo líder) */}
                {isLeader && room.players.length < room.maxPlayers && (
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleAddBot}
                  >
                    <Bot className="mr-2" size={18} />
                    AGREGAR BOT
                  </Button>
                )}
              </div>

              {/* Columna Derecha: Código y Acciones */}
              <div className="lobby-column">
                <h2 className="column-title">CÓDIGO DE SALA</h2>

                <div className="room-code-display">
                  <div className="code-box">
                    <span className="code-text">{room.code}</span>
                  </div>

                  <Button
                    className="glass-button-secondary w-full"
                    onClick={() => copyToClipboard(room.code)}
                  >
                    <Link2 className="mr-2" size={16} />
                    COPIAR CÓDIGO
                  </Button>
                </div>

                {/* Estado de la sala */}
                <div className="room-info-box">
                  <div className="info-item">
                    <span className="info-label">Tipo:</span>
                    <span className="info-value">{room.isPrivate ? "Privada" : "Pública"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Estado:</span>
                    <span className="info-value">{room.status === 'WAITING' ? 'Esperando' : room.status}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Configuración:</span>
                    <span className="info-value">{selectedPreset === 'torneo' ? 'Torneo' : 'Clásico'}</span>
                  </div>
                </div>

                {/* Botón cambiar privacidad (solo líder) */}
                {isLeader && (
                  <Button
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 mb-3"
                    onClick={handleTogglePrivacy}
                    size="default"
                  >
                    {room.isPrivate ? (
                      <>
                        <Unlock className="mr-2" size={16} />
                        Hacer Pública
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2" size={16} />
                        Hacer Privada
                      </>
                    )}
                  </Button>
                )}

                {/* Botón iniciar juego (solo líder) */}
                {isLeader && (
                  <Button
                    className="start-game-btn w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                    size="lg"
                  >
                    <Play className="mr-2" size={20} />
                    {canStartGame
                      ? "INICIAR JUEGO"
                      : `ESPERANDO JUGADORES (${room.players.length}/2)`
                    }
                  </Button>
                )}

                {/* Mensaje para no líderes */}
                {!isLeader && (
                  <div className="waiting-message">
                    <p className="text-white/70 text-center text-sm">
                      Esperando que el líder inicie la partida...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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

        .mode-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 2rem;
          letter-spacing: 0.05em;
        }

        /* Modo Configuración */
        .config-mode {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .config-grid {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .config-section {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .config-label {
          color: white;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1rem;
          display: block;
          letter-spacing: 0.05em;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .preset-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .preset-card:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .preset-card.selected {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.2);
        }

        .preset-icon {
          width: 48px;
          height: 48px;
          object-fit: contain;
        }

        .preset-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 0.25rem;
        }

        .preset-name {
          color: white;
          font-weight: 700;
          font-size: 1rem;
        }

        .preset-desc {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.75rem;
        }

        .config-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .visibility-toggle {
          display: flex;
          gap: 1rem;
        }

        .visibility-btn {
          flex: 1;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid transparent;
          border-radius: 10px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .visibility-btn.active {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.2);
        }

        .create-room-btn {
          margin-top: 1rem;
          font-size: 1.1rem;
          font-weight: 700;
          padding: 1.5rem;
        }

        /* Modo Lobby */
        .lobby-mode {
          width: 100%;
        }

        .lobby-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .lobby-column {
          background: linear-gradient(
            235deg,
            hsl(45 50% 10% / 0.4),
            hsl(45 50% 10% / 0.1) 33%
          ),
          linear-gradient(
            45deg,
            hsl(0 50% 10% / 0.4),
            hsl(0 50% 10% / 0.1) 33%
          ),
          linear-gradient(hsl(220deg 25% 4.8% / 0.3));
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 4px 16px rgba(255, 140, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(16px);
        }

        .column-title {
          color: #FFFFFF;
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          text-align: center;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.8),
            0 0 16px rgba(255, 255, 255, 0.3),
            0 0 24px rgba(255, 140, 0, 0.2);
        }

        .players-grid {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* NUEVOS WRAPPERS DE JUGADORES */
        .player-card-wrapper {
          position: relative;
          border-radius: 16px;
          padding: 8px !important;
          background: linear-gradient(135deg, transparent, transparent);
          transition: all 0.3s ease;
          margin-bottom: 0.5rem;
          z-index: 10;
          display: block !important;
          visibility: visible !important;
          min-height: 60px;
        }

        .player-card-wrapper.leader-wrapper {
          background: linear-gradient(
            135deg, 
            rgba(255, 215, 0, 0.9) !important, 
            rgba(255, 185, 0, 0.8) !important, 
            rgba(255, 140, 0, 0.9) !important
          );
          box-shadow: 
            0 0 25px rgba(255, 215, 0, 0.5),
            0 0 50px rgba(255, 140, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(255, 215, 0, 1) !important;
          animation: leader-wrapper-glow 3s ease-in-out infinite;
        }

        @keyframes leader-wrapper-glow {
          0%, 100% {
            box-shadow: 
              0 0 25px rgba(255, 215, 0, 0.5),
              0 0 50px rgba(255, 140, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 
              0 0 35px rgba(255, 215, 0, 0.7),
              0 0 70px rgba(255, 140, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }

        .player-card-wrapper.player-wrapper {
          background: linear-gradient(
            135deg, 
            rgba(255, 255, 255, 0.8) !important, 
            rgba(255, 255, 255, 0.6) !important, 
            rgba(255, 255, 255, 0.8) !important
          );
          box-shadow: 
            0 0 20px rgba(255, 255, 255, 0.4),
            0 0 40px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          border: 3px solid rgba(255, 255, 255, 0.8) !important;
        }

        .player-card-wrapper.bot-wrapper {
          background: linear-gradient(
            135deg, 
            rgba(139, 92, 246, 0.9) !important, 
            rgba(124, 58, 237, 0.8) !important, 
            rgba(168, 85, 247, 0.9) !important
          );
          box-shadow: 
            0 0 25px rgba(139, 92, 246, 0.5),
            0 0 50px rgba(168, 85, 247, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          border: 3px solid rgba(139, 92, 246, 1) !important;
        }

        .player-card-wrapper.empty-wrapper {
          background: linear-gradient(
            135deg, 
            rgba(255, 255, 255, 0.1), 
            rgba(255, 255, 255, 0.05), 
            rgba(255, 255, 255, 0.1)
          );
          border: 2px dashed rgba(255, 255, 255, 0.3);
          box-shadow: none;
        }

        /* Efectos hover para los wrappers */
        .player-card-wrapper:hover {
          transform: translateY(-2px);
        }

        .player-card-wrapper.leader-wrapper:hover {
          box-shadow: 
            0 0 30px rgba(255, 215, 0, 0.5),
            0 0 60px rgba(255, 140, 0, 0.3);
        }

        .player-card-wrapper.player-wrapper:hover {
          box-shadow: 
            0 0 25px rgba(255, 255, 255, 0.3),
            0 0 50px rgba(255, 255, 255, 0.15);
        }

        .player-card-wrapper.bot-wrapper:hover {
          box-shadow: 
            0 0 30px rgba(139, 92, 246, 0.5),
            0 0 60px rgba(168, 85, 247, 0.3);
        }

        .player-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4));
          border-radius: 12px;
          border: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        /* FORZAR COLOR BLANCO AGRESIVO */
        .player-card,
        .player-card *,
        .player-card span,
        .player-card div {
          color: #FFFFFF !important;
        }

        .player-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .player-card:hover {
          transform: none; /* El hover se maneja en el wrapper */
        }

        .player-card:hover::before {
          left: 100%;
        }

        .player-card.empty {
          opacity: 0.7;
          border-style: none;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
        }

        .player-avatar {
          flex-shrink: 0;
        }

        .avatar-human,
        .avatar-bot,
        .avatar-empty {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .avatar-human {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: 3px solid rgba(59, 130, 246, 0.5);
          box-shadow:
            0 0 20px rgba(59, 130, 246, 0.6),
            0 0 40px rgba(59, 130, 246, 0.3),
            inset 0 2px 6px rgba(255, 255, 255, 0.3);
          color: #FFFFFF !important;
        }

        .avatar-human.avatar-leader {
          background: linear-gradient(135deg, #FFD700, #FFA500);
          border: 3px solid rgba(255, 215, 0, 0.8);
          box-shadow:
            0 0 24px rgba(255, 215, 0, 0.8),
            0 0 48px rgba(255, 165, 0, 0.5),
            inset 0 2px 8px rgba(255, 255, 255, 0.4);
          animation: leader-avatar-glow 2s ease-in-out infinite;
        }

        @keyframes leader-avatar-glow {
          0%, 100% {
            box-shadow:
              0 0 24px rgba(255, 215, 0, 0.8),
              0 0 48px rgba(255, 165, 0, 0.5),
              inset 0 2px 8px rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow:
              0 0 32px rgba(255, 215, 0, 1),
              0 0 64px rgba(255, 165, 0, 0.7),
              inset 0 2px 10px rgba(255, 255, 255, 0.5);
          }
        }

        .avatar-bot {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: 3px solid rgba(139, 92, 246, 0.5);
          box-shadow:
            0 0 20px rgba(139, 92, 246, 0.6),
            0 0 40px rgba(139, 92, 246, 0.3),
            inset 0 2px 6px rgba(255, 255, 255, 0.3);
          color: #FFFFFF !important;
          animation: pulse-bot 2s infinite;
        }

        @keyframes pulse-bot {
          0%, 100% {
            box-shadow:
              0 0 20px rgba(139, 92, 246, 0.6),
              0 0 40px rgba(139, 92, 246, 0.3),
              inset 0 2px 6px rgba(255, 255, 255, 0.3);
          }
          50% {
            box-shadow:
              0 0 30px rgba(139, 92, 246, 0.8),
              0 0 60px rgba(139, 92, 246, 0.5),
              inset 0 2px 6px rgba(255, 255, 255, 0.4);
          }
        }

        .avatar-empty {
          background: rgba(255, 255, 255, 0.08);
          border: 3px dashed rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.6) !important;
        }

        /* Forzar color blanco en iconos de avatares */
        .avatar-human svg,
        .avatar-bot svg,
        .avatar-empty svg {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
        }

        /* Forzar color dorado en iconos de líderes */
        .avatar-leader svg {
          color: #FFE55C !important;
          fill: #FFE55C !important;
        }

        /* Forzar colores blancos en todos los elementos de player-card */
        .player-card * {
          color: inherit !important;
        }

        .player-card .player-name,
        .player-card .player-name * {
          color: #FFFFFF !important;
        }

        /* Forzar iconos blancos en player-actions */
        .player-actions svg,
        .action-btn svg {
          color: inherit !important;
        }

        /* NUEVOS ESTILOS AGRESIVOS PARA ICONOS */
        .player-card svg,
        .player-card .lucide,
        .player-card [data-lucide] {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
          stroke: #FFFFFF !important;
        }

        /* Iconos específicos por tipo */
        .player-card.leader-card svg,
        .player-card.leader-card .lucide,
        .player-card.leader-card [data-lucide] {
          color: #FFE55C !important;
          fill: #FFE55C !important;
          stroke: #FFE55C !important;
        }

        .crown-icon-inline,
        .crown-icon-inline svg {
          color: #FFE55C !important;
          fill: #FFE55C !important;
          stroke: #FFE55C !important;
        }

        /* ÚLTIMO RECURSO - FORZAR TODO EL TEXTO A BLANCO */
        .players-grid span,
        .players-grid div,
        .players-grid p,
        .players-grid h1,
        .players-grid h2,
        .players-grid h3,
        .players-grid h4,
        .players-grid h5,
        .players-grid h6 {
          color: #FFFFFF !important;
        }

        /* Excepciones específicas para badges */
        .players-grid .leader-status,
        .players-grid .leader-status span {
          color: #FFE55C !important;
        }

        .players-grid .bot-status,
        .players-grid .bot-status span {
          color: #C4B5FD !important;
        }

        .players-grid .player-status,
        .players-grid .player-status span {
          color: #93C5FD !important;
        }

        .players-grid .empty-status,
        .players-grid .empty-status span {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .player-name-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .crown-icon-inline {
          color: #FFE55C !important;
          filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
          animation: crown-glow 2s infinite;
        }

        @keyframes crown-glow {
          0%, 100% {
            filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 12px rgba(255, 215, 0, 1)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.8));
          }
        }

        .player-name {
          color: #FFFFFF !important;
          font-weight: 700;
          font-size: 1.05rem;
          letter-spacing: 0.02em;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 0 8px rgba(255, 255, 255, 0.3);
          line-height: 1.4;
        }

        .player-name.empty-name {
          color: rgba(255, 255, 255, 0.7) !important;
          font-style: italic;
          font-weight: 600;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.6),
            0 0 6px rgba(255, 255, 255, 0.2);
        }

        .player-status {
          display: flex;
          align-items: center;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.35rem 0.85rem;
          border-radius: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.8),
            0 0 6px rgba(255, 255, 255, 0.2);
        }

        /* FORZAR COLORES DE BADGES ESPECÍFICOS */
        .status-badge.leader-status,
        .status-badge.leader-status * {
          color: #FFE55C !important;
        }

        .status-badge.bot-status,
        .status-badge.bot-status * {
          color: #C4B5FD !important;
        }

        .status-badge.player-status,
        .status-badge.player-status * {
          color: #93C5FD !important;
        }

        .status-badge.empty-status,
        .status-badge.empty-status * {
          color: rgba(255, 255, 255, 0.6) !important;
        }

        .leader-status {
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.4), rgba(255, 185, 0, 0.3));
          color: #FFE55C !important;
          border: 1.5px solid rgba(255, 215, 0, 0.8);
          box-shadow: 
            0 2px 8px rgba(255, 215, 0, 0.4),
            0 0 12px rgba(255, 215, 0, 0.3);
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.8),
            0 0 8px rgba(255, 215, 0, 0.5);
        }

        .bot-status {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(124, 58, 237, 0.3));
          color: #C4B5FD !important;
          border: 1.5px solid rgba(139, 92, 246, 0.8);
          box-shadow: 
            0 2px 8px rgba(139, 92, 246, 0.4),
            0 0 12px rgba(139, 92, 246, 0.3);
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.8),
            0 0 8px rgba(139, 92, 246, 0.5);
        }

        .player-status {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4), rgba(37, 99, 235, 0.3));
          color: #93C5FD !important;
          border: 1.5px solid rgba(59, 130, 246, 0.8);
          box-shadow: 
            0 2px 8px rgba(59, 130, 246, 0.4),
            0 0 12px rgba(59, 130, 246, 0.3);
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.8),
            0 0 8px rgba(59, 130, 246, 0.5);
        }

        .empty-status {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6) !important;
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.6),
            0 0 6px rgba(255, 255, 255, 0.2);
        }

        .crown-icon {
          color: #FFD700;
        }

        .bot-icon {
          color: #60A5FA;
        }

        .player-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .action-btn {
          padding: 0.5rem;
          min-width: 36px;
          height: 36px;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .kick-btn {
          color: #FFFFFF !important;
          font-weight: 700;
          background: rgba(239, 68, 68, 0.1);
        }

        .kick-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          transform: scale(1.1);
          color: #FFFFFF !important;
        }

        .transfer-btn {
          color: #FFFFFF !important;
          background: rgba(255, 215, 0, 0.1);
        }

        .transfer-btn:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: scale(1.1);
          color: #FFFFFF !important;
        }

        .transfer-btn svg {
          color: #FFFFFF !important;
          fill: #FFFFFF !important;
        }

        .remove-btn {
          color: #EF4444;
          font-weight: 700;
          padding: 0.25rem 0.5rem;
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

        .room-info-box {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .info-value {
          color: white;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .start-game-btn {
          font-size: 1.1rem;
          font-weight: 700;
          padding: 1.25rem;
        }

        .waiting-message {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          text-align: center;
        }

        @media (max-width: 1024px) {
          .lobby-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Efectos de brillo */
        .shine,
        .glow {
          pointer-events: none;
          position: absolute;
          opacity: 0.5;
        }

        .shine-top,
        .glow-top {
          top: 0;
          right: 0;
        }

        .shine-bottom,
        .glow-bottom {
          bottom: 0;
          left: 0;
        }
      `}</style>
    </div>
  )
}