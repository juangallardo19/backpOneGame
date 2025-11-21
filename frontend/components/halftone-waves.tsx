"use client"

import { useEffect, useRef } from "react"

interface HalftoneWavesProps {
  animate?: boolean;
  className?: string;
  isMyTurn?: boolean; // Controla la intensidad del brillo
}

export default function HalftoneWaves({ animate = true, className = "", isMyTurn = true }: HalftoneWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMyTurnRef = useRef(isMyTurn)

  // Actualizar ref cuando cambia isMyTurn sin reiniciar el efecto
  useEffect(() => {
    isMyTurnRef.current = isMyTurn
  }, [isMyTurn])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawHalftoneWave = () => {
      const gridSize = 20
      const rows = Math.ceil(canvas.height / gridSize)
      const cols = Math.ceil(canvas.width / gridSize)

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const centerX = x * gridSize
          const centerY = y * gridSize
          const distanceFromCenter = Math.sqrt(
            Math.pow(centerX - canvas.width / 2, 2) + Math.pow(centerY - canvas.height / 2, 2),
          )
          const maxDistance = Math.sqrt(Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2))
          const normalizedDistance = distanceFromCenter / maxDistance

          const waveOffset = Math.sin(normalizedDistance * 10 - time) * 0.5 + 0.5
          const size = gridSize * waveOffset * 0.8

          ctx.beginPath()
          ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
          // Ajustar opacidad según si es tu turno (usando ref)
          const baseOpacity = isMyTurnRef.current ? 0.6 : 0.3; // Más tenue cuando NO es tu turno
          ctx.fillStyle = `rgba(255, 245, 230, ${waveOffset * baseOpacity})`
          ctx.fill()
        }
      }
    }

    const draw = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      // Gradiente más oscuro cuando NO es tu turno (usando ref)
      if (isMyTurnRef.current) {
        gradient.addColorStop(0, "rgba(220, 85, 40, 0.1)")
        gradient.addColorStop(1, "rgba(200, 60, 30, 0.1)")
      } else {
        gradient.addColorStop(0, "rgba(100, 40, 20, 0.15)")
        gradient.addColorStop(1, "rgba(80, 30, 15, 0.15)")
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawHalftoneWave()
    }

    const animateFrame = () => {
      draw()

      // SIEMPRE incrementar tiempo y continuar animación
      time += 0.015
      animationFrameId = requestAnimationFrame(animateFrame)
    }

    const handleResize = () => {
      resizeCanvas()
      draw() // Redraw after resize
    }

    resizeCanvas()
    window.addEventListener("resize", handleResize)

    // Start animation loop
    animateFrame()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener("resize", handleResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Solo ejecutar una vez al montar, la animación corre continuamente

  return (
    <canvas
      ref={canvasRef}
      className={className || "w-full h-screen"}
      style={{
        background: isMyTurn
          ? "linear-gradient(135deg, #DC5528 0%, #C83C1E 100%)" // Color normal cuando es tu turno
          : "linear-gradient(135deg, #8B3A1E 0%, #6B2A14 100%)" // Más oscuro cuando NO es tu turno
      }}
    />
  )
}
