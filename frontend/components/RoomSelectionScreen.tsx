"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Plus, LogIn } from "lucide-react"
import Image from "next/image"
import { roomService } from "@/services/room.service"
import { useNotification } from "@/contexts/NotificationContext"
import { Room } from "@/types/game.types"

interface RoomSelectionScreenProps {
  onCreateRoom: () => void
  onJoinRoomSuccess?: (room: Room) => void
  onBack: () => void
}

export default function RoomSelectionScreen({ onCreateRoom, onJoinRoomSuccess, onBack }: RoomSelectionScreenProps) {
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { success, error: showError } = useNotification()

  const handleJoinRoom = async () => {
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
      console.log("🔍 Conectando a sala con código:", roomCode)

      // Conectar al backend para unirse a la sala
      const room = await roomService.joinRoom(roomCode)

      console.log("✅ Unido a la sala exitosamente:", room)
      success("¡Éxito!", `Te has unido a la sala ${roomCode}`)

      // Llamar al callback si existe
      if (onJoinRoomSuccess) {
        onJoinRoomSuccess(room)
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
                onClick={onCreateRoom}
              >
                <Plus className="mr-3 h-8 w-8 transition-transform group-hover:scale-110" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold">CREAR SALA</span>
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
                  <span className="text-xs font-normal opacity-90">Usa un código de sala</span>
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
        ) : (
          <>
            {/* Join Room Form */}
            <div className="join-room-container fade-in-up">
              <h2 className="section-title">Ingresa el código de sala</h2>

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
                onClick={handleJoinRoom}
                disabled={isLoading}
              >
                <span className="text-lg font-bold">ENTRAR A SALA</span>
              </Button>

              <Button
                variant="outline"
                className="back-from-join-button glass-button bg-transparent text-white w-full mt-3"
                onClick={() => {
                  setShowJoinRoom(false)
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
          max-width: 500px;
          min-height: 500px;
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

        /* Join Room Form Styles */
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
      `}</style>
    </div>
  )
}
