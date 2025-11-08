"use client"

import { useState, useEffect  } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown, Play, ArrowLeft, Volume2, Link2 } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface UserData {
  username: string
  isGuest: boolean
}

interface GameRoomMenuProps {
  onBack?: () => void
  onStartGame?: () => void
  userData?: UserData | null
}

export default function GameRoomMenu({ onBack, onStartGame, userData }: GameRoomMenuProps) {
  const [roomType, setRoomType] = useState<"public" | "private">("public")
  const [roomCode, setRoomCode] = useState("")
  // Generar código automáticamente al cargar
useEffect(() => {
  generateRoomCode()
}, [])
  const [stackCards, setStackCards] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [players, setPlayers] = useState([
    { id: 1, name: userData?.username || "JUGADOR1", isHost: true, isBot: false },
    { id: 2, name: "VACÍO", isEmpty: true, isBot: false },
    { id: 3, name: "VACÍO", isEmpty: true, isBot: false },
    { id: 4, name: "VACÍO", isEmpty: true, isBot: false },
  ])
  const [selectedPreset, setSelectedPreset] = useState<string | null>("clasico")

  const generateRoomCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let code = ''
  
  // Generar 3 letras aleatorias
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // Generar 3 números aleatorios
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  setRoomCode(code)
}

  const addBot = () => {
    const emptySlot = players.findIndex((p) => p.isEmpty)
    if (emptySlot !== -1) {
      const newPlayers = [...players]
      newPlayers[emptySlot] = {
        id: emptySlot + 1,
        name: `BOT${emptySlot}`,
        isEmpty: false,
        isBot: true,
        isHost: false,
      } as any
      setPlayers(newPlayers)
    }
  }

  const fillWithBots = () => {
    const newPlayers = [...players]
    let botCount = 1
    
    for (let i = 1; i < newPlayers.length; i++) { // Empezamos desde 1 para no tocar al host
      if (newPlayers[i].isEmpty) {
        newPlayers[i] = {
          id: i + 1,
          name: `BOT${botCount}`,
          isEmpty: false,
          isBot: true,
          isHost: false,
        } as any
        botCount++
      }
    }
    setPlayers(newPlayers)
  }

  const canStartGame = () => {
    const activePlayers = players.filter(p => !p.isEmpty)
    return activePlayers.length === 4
  }

  const removePlayer = (id: number) => {
    const newPlayers = [...players]
    const index = newPlayers.findIndex((p) => p.id === id)
    if (index !== -1 && !newPlayers[index].isHost) {
      newPlayers[index] = {
        id,
        name: "VACÍO",
        isEmpty: true,
        isBot: false,
      } as any
      setPlayers(newPlayers)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const presets = [
    { id: "clasico", name: "CLÁSICO", icon: "/icons/game-controller.png", color: "red" },
    { id: "torneo", name: "TORNEO", icon: "/icons/trophy-icon.png", color: "orange" },
  ]

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
            <Image src="/uno-logo.png" alt="UNO Logo" width={180} height={80} className="uno-logo" />

          </div>
        </div>

        <div className="main-layout">
          {/* Columna Izquierda: Jugadores */}
          <div className="column players-column">
            <div className="column-header">
              <h3 className="column-title text-white">JUGADORES {players.filter((p) => !p.isEmpty).length}/4</h3>
              <p className="text-xs text-gray-300 text-center mt-1">4 jugadores requeridos para iniciar</p>
            </div>

            <div className="players-list">
              {players.map((player) => (
                <div key={player.id} className={`player-slot ${player.isEmpty ? "empty" : "occupied"}`}>
                  <div className="player-avatar">
                    {player.isEmpty ? (
                      <Image src="/icons/player-icon.png" alt="Player" width={24} height={24} className="opacity-50" />
                    ) : player.isBot ? (
                      <div className="avatar-circle">
                        <Image src="/icons/robot-icon.png" alt="Bot" width={24} height={24} />
                      </div>
                    ) : (
                      <div className="avatar-circle">
                        <Image src="/icons/player-icon.png" alt="Player" width={24} height={24} />
                      </div>
                    )}
                  </div>
                  <span className="player-name">{player.name}</span>
                  {player.isHost && <Crown className="w-5 h-5 text-yellow-400 ml-auto" />}
                  {!player.isEmpty && !player.isHost && (
                    <button onClick={() => removePlayer(player.id)} className="remove-player-btn ml-auto">
                      <Image src="/icons/circle-x.png" alt="Remover" width={20} height={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="player-actions">
              <Button
                className="glass-button action-btn bg-transparent text-white"
                variant="outline"
                size="sm"
                onClick={addBot}
                disabled={players.filter(p => p.isEmpty).length === 0}
              >
                <Image src="/icons/robot-icon.png" alt="Bot" width={16} height={16} className="mr-2" />
                Agregar Bot
              </Button>
              <Button
                className="glass-button action-btn bg-blue-600 hover:bg-blue-700 text-white"
                variant="outline"
                size="sm"
                onClick={fillWithBots}
                disabled={players.filter(p => p.isEmpty).length === 0}
              >
                <Image src="/icons/robot-icon.png" alt="Bot" width={16} height={16} className="mr-2" />
                Completar con Bots
              </Button>
            </div>
          </div>

          {/* Columna Central: Presets */}
          <div className="column presets-column">
            <div className="column-header">
              <h3 className="column-title text-white">MODOS DE JUEGO</h3>
            </div>

            <div className="presets-grid-large">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`preset-card-large px-0 text-red-600 ${selectedPreset === preset.id ? "selected" : ""}`}
                  data-color={preset.color}
                >
                  <div className="preset-bg-image">
                    <Image src="/icons/cards-bg.png" alt="" width={80} height={80} className="opacity-20" />
                  </div>
                  <div className="preset-icon-large">
                    <Image src={preset.icon || "/placeholder.svg"} alt={preset.name} width={64} height={64} />
                  </div>
                  <div className="preset-name-large">{preset.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Configuración Manual */}
          <div className="column config-column">
            <div className="column-header">
              <h3 className="column-title text-white">CONFIGURACIÓN</h3>
            </div>

            <div className="config-content">
              <div className="config-item cards-initial">
                <Label className="config-label">
                  <Image src="/icons/cards-icon.png" alt="Cartas" width={16} height={16} className="mr-2" />
                  Cartas Iniciales
                </Label>
                <Select defaultValue="7">
                  <SelectTrigger className="glass-input-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="config-item points-win">
                <Label className="config-label">
                  <Image src="/icons/points-icon.png" alt="Puntos" width={16} height={16} className="mr-2" />
                  Puntos para Ganar
                </Label>
                <Select defaultValue="500">
                  <SelectTrigger className="glass-input-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="config-item turn-time">
                <Label className="config-label">Tiempo por Turno</Label>
                <Select defaultValue="60">
                  <SelectTrigger className="glass-input-small">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">60s</SelectItem>
                    <SelectItem value="90">90s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="config-item">
                <Label className="config-label mb-2">
                  <Image src="/icons/cards-icon.png" alt="Apilar" width={16} height={16} className="mr-2" />
                  Apilar +2/+4
                </Label>
                <Button
                  onClick={() => setStackCards(!stackCards)}
                  className={`glass-button w-full justify-center ${
                    stackCards 
                      ? 'bg-gradient-to-r from-green-600/80 to-green-700/80 hover:from-green-600 hover:to-green-700 border-green-500/50' 
                      : 'bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700 border-red-500/50'
                  }`}
                >
                  {stackCards ? 'ACTIVADO' : 'DESACTIVADO'}
                </Button>
              </div>

              {roomType === "private" && (
                <div className="config-item">
                  <Label className="config-label">Código de Sala</Label>
                  <div className="flex gap-2">
                    <Input
                      value={roomCode}
                      readOnly
                      placeholder="Generar"
                      className="glass-input-small flex-1 text-sm"
                    />
                    <Button onClick={generateRoomCode} className="glass-button" size="icon">
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer-section">
          <Button className="footer-button glass-button invite-button" onClick={() => setShowInviteModal(true)}>
            <Link2 className="w-5 h-5 mr-2" />
            INVITAR
          </Button>
          <Button 
            className={`footer-button glass-button start-button ${
              canStartGame() 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-gray-600 cursor-not-allowed opacity-50'
            }`}
            onClick={canStartGame() ? onStartGame : undefined}
            disabled={!canStartGame()}
          >
            <Play className="w-5 h-5 mr-2" />
            {canStartGame() ? 'INICIAR' : `FALTAN ${4 - players.filter(p => !p.isEmpty).length} JUGADORES`}
          </Button>
        </div>
      </div>

      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="glass-modal">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">Invitar Jugadores</DialogTitle>
            <DialogDescription className="text-gray-300">
              Comparte el enlace o código de la sala con tus amigos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-white">Enlace de Invitación</Label>
              <div className="flex gap-2">
                <Input value={`https://uno-game.com/sala/${roomCode || 'ABC123'}`} readOnly className="glass-input flex-1" />
                <Button onClick={() => copyToClipboard(`https://uno-game.com/sala/${roomCode || 'ABC123'}`)} className="glass-button">
                  Copiar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white">Código de Sala</Label>
              <div className="flex gap-2">
                <Input value={roomCode || 'ABC123'} readOnly className="glass-input flex-1 text-2xl font-bold text-center" />
                <Button onClick={() => copyToClipboard(roomCode || 'ABC123')} className="glass-button">
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .glass-menu-lobby {
          --hue1: 45;
          --hue2: 0;
          --border: 1px;
          --border-color: hsl(var(--hue2), 12%, 20%);
          --radius: 28px;
          --ease: cubic-bezier(0.5, 1, 0.89, 1);
          
          position: relative;
          min-width: 900px;
          max-width: 1200px;
          width: 95vw;
          /* disminuir altura del contenedor principal para que no ocupe toda la ventana */
          min-height: 70vh;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          border-radius: var(--radius);
          border: var(--border) solid var(--border-color);
          padding: 1.5em;
          background: linear-gradient(235deg, hsl(var(--hue1) 50% 10% / 0.8), hsl(var(--hue1) 50% 10% / 0) 33%), 
                      linear-gradient(45deg , hsl(var(--hue2) 50% 10% / 0.8), hsl(var(--hue2) 50% 10% / 0) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.66));
          backdrop-filter: blur(12px);
          box-shadow: hsl(var(--hue2) 50% 2%) 0px 10px 16px -8px, hsl(var(--hue2) 50% 4%) 0px 20px 36px -14px;
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
            transparent var(--start,0%), hsl( var(--hue), var(--sat,80%), var(--lit,60%)), transparent  var(--end,50%) 
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
            transparent var(--start,0%), hsl( var(--hue), var(--sat,80%), var(--lit,85%)), transparent var(--end,50%) 
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
            transparent var(--start,0%), hsl( var(--hue), var(--sat,95%), var(--lit,60%)), transparent  var(--end,50%) 
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

        .inner {
          position: relative;
          z-index: 10;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* Header Section */
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .back-button {
          padding: 0.5rem 1rem;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .logo-container {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .uno-logo {
          object-fit: contain;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
        }

        /* Main Layout */
        .main-layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex: 1;
        }

        .column {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 18px;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .column-header {
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .column-title {
          font-size: 0.875rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.05em;
        }

        /* Players Column */
        .players-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
          /* limitar altura para mostrar hasta 4 slots y luego scroll */
          max-height: 14rem; /* aprox 4 slots */
          overflow-y: auto;
        }

        .player-slot {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .player-slot.occupied {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .player-slot.empty {
          opacity: 0.5;
        }

        .player-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .avatar-circle {
          font-size: 1.25rem;
        }

        .player-name {
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
        }

        /* Botón de remover jugador individual */
        .remove-player-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          transition: transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-player-btn:hover {
          transform: scale(1.1);
        }

        .player-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .action-btn {
          width: 100%;
          font-size: 0.75rem;
        }

        /* Grid optimizado para presets: tamaño coherente y evita solapamiento con footer */
        .presets-grid-large {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          /* permitir que la columna central crezca de forma coherente dentro del layout */
          flex: 1 1 auto;
          align-content: start;
          /* usar overflow interno y espacio inferior para que no tape la footer */
          max-height: calc(100vh - 320px);
          overflow: auto;
          padding: 0.5rem;
          padding-bottom: 1rem; /* espacio extra para que no tape la footer */
        }

        .preset-card-large {
          position: relative;
          overflow: hidden;
          border: 3px solid rgba(239, 68, 68, 0.35);
          border-radius: 20px;
          padding: 1.25rem 0.9rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: transform 220ms var(--ease), box-shadow 220ms var(--ease);
          /* Tamaño proporcional para verse consistente con el contenido */
          min-height: 150px;
          max-height: 260px;
          width: 100%;
          box-sizing: border-box;
        }

        /* imagen de fondo con tamaño mayor pero sutil */
        .preset-bg-image {
          position: absolute;
          bottom: -8px;
          right: -8px;
          opacity: 0.12;
          transform: rotate(-12deg);
          pointer-events: none;
          width: 140px;
          height: auto;
        }

        .preset-card-large[data-color="red"] {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
          border-color: rgba(239, 68, 68, 0.6);
        }

        .preset-card-large[data-color="orange"] {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.95), rgba(234, 88, 12, 0.95));
          border-color: rgba(249, 115, 22, 0.6);
        }

        .preset-card-large:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 36px rgba(0,0,0,0.35);
          filter: brightness(1.06);
        }

        .preset-card-large.selected {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
          border-color: rgba(16, 185, 129, 0.7);
          box-shadow: 0 0 36px rgba(16,185,129,0.45);
        }

        .preset-icon-large {
          z-index: 1;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preset-name-large {
          font-weight: 800;
          font-size: 1.15rem;
          color: white;
          text-align: center;
          letter-spacing: 0.08em;
          text-shadow: 1.5px 1.5px 3px rgba(0, 0, 0, 0.35);
          z-index: 1;
        }

        /* Config Column */
        .config-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        /* Colores específicos para cada opción de configuración */
        .config-item.cards-initial :global(.glass-input-small) {
          border-left: 4px solid rgba(59,130,246,0.9); /* azul */
        }

        .config-item.points-win :global(.glass-input-small) {
          border-left: 4px solid rgba(16,185,129,0.9); /* verde */
        }

        .config-item.turn-time :global(.glass-input-small) {
          border-left: 4px solid rgba(168,85,247,0.9); /* morado */
        }

        .config-toggle {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .config-label {
          display: flex;
          align-items: center;
          color: white !important;
          font-weight: 600;
          font-size: 0.75rem;
        }

        /* Forzar color blanco en cualquier etiqueta y texto dentro de la columna de configuración.
           Cubrimos etiquetas <label>, el componente Label de radix y cualquier elemento hijo
           para evitar reglas de menor especificidad que permanezcan en negro. */
        .config-content,
        .config-content *,
        .config-content label,
        .config-content .config-label,
        .config-column .config-label,
        .config-toggle .config-label,
        .config-content :global(label),
        .config-content :global(.config-label) {
          color: #ffffff !important;
        }

        /* Asegurar footer encima si algo aún desborda */
        .footer-section {
          display: flex;
          justify-content: center;
          gap: 1rem;
          position: relative;
          z-index: 30;
        }

        .footer-button {
          padding: 0.75rem 2.5rem;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.05em;
        }

        .invite-button {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8));
          border: 1px solid rgba(59, 130, 246, 0.5);
          color: white;
        }

        .invite-button:hover {
          background: linear-gradient(90deg, rgba(59, 130, 246, 1), rgba(37, 99, 235, 1));
        }

        .start-button {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.8), rgba(220, 38, 38, 0.8));
          border: 1px solid rgba(239, 68, 68, 0.5);
          color: white;
        }

        .start-button:hover {
          background: linear-gradient(90deg, rgba(239, 68, 68, 1), rgba(220, 38, 38, 1));
        }

        /* Responsive: mantener proporciones en pantallas pequeñas */
        @media (max-width: 880px) {
          .main-layout { grid-template-columns: 1fr; }
          .presets-grid-large {
            grid-template-columns: 1fr;
            max-height: none;
            padding-bottom: 1.5rem;
          }
          .preset-card-large {
            min-height: 140px;
            max-height: 200px;
            padding: 1rem;
          }
          .preset-bg-image { width: 110px; right: -6px; bottom: -6px; }
          .preset-icon-large { width: 56px; height: 56px; }
          .preset-name-large { font-size: 1.05rem; }
          .footer-button { padding: 0.6rem 1.6rem; font-size: 0.95rem; }
        }

        @keyframes glow {
          0% { opacity: 0; }
          3% { opacity: 1; }
          10% { opacity: 0; }
          12% { opacity: 0.7; }
          16% {
            opacity: 0.3;
            animation-timing-function: var(--ease);
          }
          100% {
            opacity: 1;
            animation-timing-function: var(--ease);
          }
        }

        :global(.glass-input) {
          background: linear-gradient(to bottom, hsl(var(--hue1) 20% 20% / 0.2) 50%, hsl(var(--hue1) 50% 50% / 0.1) 180%);
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.5);
          color: white;
        }

        :global(.glass-input-small) {
          background: linear-gradient(to bottom, hsl(var(--hue1) 20% 20% / 0.2) 50%, hsl(var(--hue1) 50% 50% / 0.1) 180%);
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.5);
          color: white;
          height: 2rem;
          font-size: 0.875rem;
        }

        :global(.glass-button) {
          background: linear-gradient(90deg, hsl(var(--hue1) 29% 13% / 0.5), hsl(var(--hue1) 30% 15% / 0.5) 24% 32%, hsl(var(--hue1) 5% 7% / 0) 95%);
          border: 1px solid hsl(var(--hue2) 13% 18.5% / 0.3);
          color: #d1d5db;
          transition: all 0.3s ease;
        }

        :global(.glass-button:hover) {
          color: white;
          background: linear-gradient(90deg, hsl(var(--hue1) 29% 20% / 0.7), hsl(var(--hue1) 30% 22% / 0.7) 24% 32%, hsl(var(--hue1) 5% 10% / 0.2) 95%);
        }

        :global(.glass-modal) {
          background: linear-gradient(235deg, hsl(var(--hue1) 50% 10% / 0.95), hsl(var(--hue1) 50% 10% / 0.8) 33%), 
                      linear-gradient(45deg , hsl(var(--hue2) 50% 10% / 0.95), hsl(var(--hue2) 50% 10% / 0.8) 33%), 
                      linear-gradient(hsl(220deg 25% 4.8% / 0.9));
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  )
}