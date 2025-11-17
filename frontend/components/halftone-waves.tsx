"use client"

import { useEffect, useRef } from "react"

interface HalftoneWavesProps {
  animate?: boolean;
  className?: string;
}

export default function HalftoneWaves({ animate = true, className = "" }: HalftoneWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
          ctx.fillStyle = `rgba(255, 245, 230, ${waveOffset * 0.6})`
          ctx.fill()
        }
      }
    }

    const draw = () => {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgba(220, 85, 40, 0.1)")
      gradient.addColorStop(1, "rgba(200, 60, 30, 0.1)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      drawHalftoneWave()
    }

    const animateFrame = () => {
      draw()

      // Only increment time and continue animation if enabled
      if (animate) {
        time += 0.015
        animationFrameId = requestAnimationFrame(animateFrame)
      }
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
  }, [animate])

  return (
    <canvas
      ref={canvasRef}
      className={className || "w-full h-screen"}
      style={{ background: "linear-gradient(135deg, #DC5528 0%, #C83C1E 100%)" }}
    />
  )
}
