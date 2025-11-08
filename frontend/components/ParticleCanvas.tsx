"use client"

import { useEffect, useRef } from 'react'

class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  color: string

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.size = Math.random() * 6 + 2
    this.speedX = (Math.random() - 0.5) * 1
    this.speedY = (Math.random() - 0.5) * 1
    this.opacity = Math.random() * 0.5 + 0.2
    this.color = `rgba(255, 140, 0, ${this.opacity})`
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.speedX
    this.y += this.speedY

    if (this.x < 0 || this.x > canvasWidth) this.speedX *= -1
    if (this.y < 0 || this.y > canvasHeight) this.speedY *= -1

    if (this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) {
      this.x = Math.random() * canvasWidth
      this.y = Math.random() * canvasHeight
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particlesArray: Particle[] = []
    const particleCount = 100
    let isPageVisible = true

    function resizeCanvas() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    function initParticles() {
      particlesArray.length = 0
      for (let i = 0; i < particleCount; i++) {
        particlesArray.push(new Particle(canvas!.width, canvas!.height))
      }
    }

    function animate() {
      if (!canvas || !ctx) return
      
      if (isPageVisible) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let i = 0; i < particlesArray.length; i++) {
          particlesArray[i].update(canvas.width, canvas.height)
          particlesArray[i].draw(ctx)
        }
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleVisibilityChange = () => {
      isPageVisible = !document.hidden;
    }

    const handlePageFocus = () => {
      isPageVisible = true;
    }

    const handlePageBlur = () => {
      isPageVisible = false;
    }

    resizeCanvas()
    initParticles()
    animate()

    const handleResize = () => {
      resizeCanvas()
      initParticles()
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('blur', handlePageBlur);

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('blur', handlePageBlur);
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 z-[2] pointer-events-none"
    />
  )
}