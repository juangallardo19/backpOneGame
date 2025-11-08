"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { X, Volume2, Eye, Gamepad2, Monitor } from "lucide-react"
import { useAudio } from '@/contexts/AudioContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Usar contexto de audio
  const {
    masterVolume,
    soundEffects,
    backgroundMusic,
    cardSounds,
    setMasterVolume: setAudioMasterVolume,
    setSoundEffects: setAudioSoundEffects,
    setBackgroundMusic: setAudioBackgroundMusic,
    setCardSounds: setAudioCardSounds,
    playSound
  } = useAudio()

  // Estados locales para otras configuraciones
  const [brightness, setBrightness] = useState(75)
  const [autoSort, setAutoSort] = useState('manual') // 'color', 'number', 'manual'
  const [textSize, setTextSize] = useState('mediano') // 'pequeño', 'mediano', 'grande'

  // Cargar configuraciones desde localStorage al montar el componente
  useEffect(() => {
    const savedSettings = localStorage.getItem('unoGameSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setAudioMasterVolume(settings.masterVolume || 50)
      setAudioSoundEffects(settings.soundEffects ?? true)
      setAudioBackgroundMusic(settings.backgroundMusic ?? true)
      setAudioCardSounds(settings.cardSounds ?? true)
      setBrightness(settings.brightness || 75)
      setAutoSort(settings.autoSort || 'manual')
      setTextSize(settings.textSize || 'mediano')
    }
  }, [setAudioMasterVolume, setAudioSoundEffects, setAudioBackgroundMusic, setAudioCardSounds])

  // Función para guardar configuraciones
  const saveSettings = () => {
    const settings = {
      masterVolume,
      soundEffects,
      backgroundMusic,
      cardSounds,
      brightness,
      autoSort,
      textSize
    }
    localStorage.setItem('unoGameSettings', JSON.stringify(settings))
    onClose()
  }

  // Efecto para aplicar brillo dinámicamente
  useEffect(() => {
    document.documentElement.style.filter = `brightness(${brightness}%)`
  }, [brightness])

  // Efecto para aplicar tamaño de texto dinámicamente
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('text-size-pequeño', 'text-size-mediano', 'text-size-grande')
    root.classList.add(`text-size-${textSize}`)
  }, [textSize])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto py-8">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal Content Container */}
      <div className="flex items-center justify-center min-h-screen py-8">
        <div className="relative z-10 w-full max-w-2xl mx-4">
          <div className="glass-menu-card animate-fade-in px-8 py-6 relative z-10">
          {/* Corner shine effects */}
          <span className="shine shine-top"></span>
          <span className="shine shine-bottom"></span>
          <span className="glow glow-top"></span>
          <span className="glow glow-bottom"></span>

          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-white tracking-wide">CONFIGURACIÓN</h2>
            <Button 
              onClick={onClose}
              size="sm" 
              className="glass-button glass-button-secondary p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Audio Section */}
          <div className="space-y-6 relative z-10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Volume2 className="mr-2 h-5 w-5" />
              AUDIO
            </h3>

            {/* Master Volume */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">Volumen Master</label>
                <span className="text-white/70">{masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => setAudioMasterVolume(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Efectos de Sonido</label>
              <Button
                onClick={() => setAudioSoundEffects(!soundEffects)}
                className={`glass-button ${soundEffects ? 'glass-button-primary' : 'glass-button-secondary'} px-4 py-2`}
              >
                {soundEffects ? 'ACTIVADO' : 'DESACTIVADO'}
              </Button>
            </div>

            {/* Background Music Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Música de Fondo</label>
              <Button
                onClick={() => setAudioBackgroundMusic(!backgroundMusic)}
                className={`glass-button ${backgroundMusic ? 'glass-button-primary' : 'glass-button-secondary'} px-4 py-2`}
              >
                {backgroundMusic ? 'ACTIVADO' : 'DESACTIVADO'}
              </Button>
            </div>

            {/* Card Sounds Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-white font-medium">Sonidos de Cartas</label>
              <Button
                onClick={() => setAudioCardSounds(!cardSounds)}
                className={`glass-button ${cardSounds ? 'glass-button-primary' : 'glass-button-secondary'} px-4 py-2`}
              >
                {cardSounds ? 'ACTIVADO' : 'DESACTIVADO'}
              </Button>
            </div>

            {/* Divider */}
            <div className="border-t border-white/20 my-6"></div>

            {/* Visual Section */}
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              VISUAL
            </h3>

            {/* Brightness */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-white font-medium">Brillo</label>
                <span className="text-white/70">{brightness}%</span>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/20 my-6"></div>

            {/* Gameplay Section */}
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Gamepad2 className="mr-2 h-5 w-5" />
              JUGABILIDAD
            </h3>

            {/* Auto-sort Cards */}
            <div className="space-y-3">
              <label className="text-white font-medium">Auto-ordenar Cartas</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setAutoSort('color')}
                  className={`glass-button ${autoSort === 'color' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  POR COLOR
                </Button>
                <Button
                  onClick={() => setAutoSort('number')}
                  className={`glass-button ${autoSort === 'number' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  POR NÚMERO
                </Button>
                <Button
                  onClick={() => setAutoSort('manual')}
                  className={`glass-button ${autoSort === 'manual' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  MANUAL
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/20 my-6"></div>

            {/* Interface Section */}
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Monitor className="mr-2 h-5 w-5" />
              INTERFAZ
            </h3>

            {/* Text Size */}
            <div className="space-y-3">
              <label className="text-white font-medium">Tamaño de Texto</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setTextSize('pequeño')}
                  className={`glass-button ${textSize === 'pequeño' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  PEQUEÑO
                </Button>
                <Button
                  onClick={() => setTextSize('mediano')}
                  className={`glass-button ${textSize === 'mediano' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  MEDIANO
                </Button>
                <Button
                  onClick={() => setTextSize('grande')}
                  className={`glass-button ${textSize === 'grande' ? 'glass-button-primary' : 'glass-button-secondary'} px-3 py-2 text-xs`}
                >
                  GRANDE
                </Button>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-white/20">
              <Button 
                onClick={saveSettings}
                className="glass-button glass-button-primary w-full py-3"
              >
                GUARDAR CONFIGURACIÓN
              </Button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}