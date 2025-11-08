"use client"

import { useEffect, useRef } from 'react'

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  angle: number;
  radius: number;
  speed: number;
}

export default function GalaxySpiral() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let centerX: number
    let centerY: number
    let rotation: number = 0
    let particles: Particle[] = []
    let animationFrameId: number
    let isPageVisible = true

    const arms: number = 6 // Reducido para brazos más separados
    const armLength: number = 350 // Longitud ligeramente mayor para mejor forma

    const resizeCanvas = (): void => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      centerX = canvas.width / 2
      centerY = canvas.height / 2
    }

    const generateParticles = (): void => {
      particles = [] // Limpiar partículas existentes
      const numParticles = 4500 // Reducido para 3 brazos más definidos
      
      for (let i = 0; i < numParticles; i++) {
        const arm = Math.floor(Math.random() * arms)
        const t = Math.random() // Parámetro a lo largo del brazo
        const theta = t * Math.PI * 4 + arm * (Math.PI * 2 / arms) + Math.random() * 0.3 // Espiral más pronunciada con menos ruido
        const radius = t * armLength * Math.exp(0.15 * theta) // Factor exponencial ajustado para mejor separación
        const x = centerX + radius * Math.cos(theta)
        const y = centerY + radius * Math.sin(theta)
        const size = Math.random() * 2.5 + 0.5 // Tamaño ligeramente mayor
        const brightness = Math.random() * 0.8 + 0.2 // Brillo más alto
        const color = `rgba(255, 255, 255, ${brightness})` // Blanco con alpha para contrastar con fondo naranja

        particles.push({ 
          x, 
          y, 
          size, 
          color, 
          angle: theta, 
          radius, 
          speed: Math.random() * 0.0005 + 0.003 // Velocidad más lenta
        })
      }

      // Añadir núcleo central - incrementado moderadamente
      for (let i = 0; i < 200; i++) {
        const radius = Math.random() * 60
        const angle = Math.random() * Math.PI * 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const size = Math.random() * 4 + 1 // Núcleo más grande
        const color = `rgba(255, 255, 255, ${Math.random() * 0.9 + 0.1})` // Blanco brillante para núcleo
        particles.push({ x, y, size, color, angle, radius, speed: 0 })
      }
    }

    const updateParticles = (): void => {
      particles.forEach(p => {
        p.angle += p.speed // Rotación individual para efecto giratorio
        p.x = centerX + p.radius * Math.cos(p.angle)
        p.y = centerY + p.radius * Math.sin(p.angle)
      })
    }

    const draw = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height) // Limpia para transparencia

      // Dibujar partículas (estrellas) - optimizado pero más visible
      particles.forEach(p => {
        ctx.globalAlpha = parseFloat(p.color.split(',')[3].replace(')', ''))
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        
        // Agregar un pequeño glow sutil solo para partículas más grandes
        if (p.size > 2) {
          ctx.globalAlpha = parseFloat(p.color.split(',')[3].replace(')', '')) * 0.3
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      
      ctx.globalAlpha = 1 // Resetear alpha
    }

    const animate = (): void => {
      if (isPageVisible) {
        rotation += 0.0005 // Velocidad de rotación aún más lenta
        updateParticles()
        draw()
      }
      animationFrameId = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden
    }

    const handlePageFocus = () => {
      isPageVisible = true
    }

    const handlePageBlur = () => {
      isPageVisible = false
    }

    const handleResize = () => {
      resizeCanvas()
      generateParticles()
    }

    // Inicializar
    resizeCanvas()
    generateParticles()
    animate()

    // Event listeners
    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handlePageFocus)
    window.addEventListener('blur', handlePageBlur)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handlePageFocus)
      window.removeEventListener('blur', handlePageBlur)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 z-[1] pointer-events-none opacity-60"
      style={{ background: 'transparent' }}
    />
  )
}