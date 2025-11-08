"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AudioContextType {
  masterVolume: number
  soundEffects: boolean
  backgroundMusic: boolean
  cardSounds: boolean
  setMasterVolume: (volume: number) => void
  setSoundEffects: (enabled: boolean) => void
  setBackgroundMusic: (enabled: boolean) => void
  setCardSounds: (enabled: boolean) => void
  playSound: (soundType: 'card' | 'effect' | 'music') => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [masterVolume, setMasterVolume] = useState(50)
  const [soundEffects, setSoundEffects] = useState(true)
  const [backgroundMusic, setBackgroundMusic] = useState(true)
  const [cardSounds, setCardSounds] = useState(true)

  // Cargar configuraciones de audio desde localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('unoGameSettings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setMasterVolume(settings.masterVolume || 50)
      setSoundEffects(settings.soundEffects ?? true)
      setBackgroundMusic(settings.backgroundMusic ?? true)
      setCardSounds(settings.cardSounds ?? true)
    }
  }, [])

  const playSound = (soundType: 'card' | 'effect' | 'music') => {
    // Verificar si el tipo de sonido está habilitado
    let enabled = false
    switch (soundType) {
      case 'card':
        enabled = cardSounds
        break
      case 'effect':
        enabled = soundEffects
        break
      case 'music':
        enabled = backgroundMusic
        break
    }

    if (!enabled || masterVolume === 0) return

    // Aquí se reproduciría el sonido real
    // Por ahora solo mostramos en consola
    console.log(`🔊 Playing ${soundType} sound at ${masterVolume}% volume`)
    
    // En una implementación real, aquí usarías:
    // const audio = new Audio(`/sounds/${soundType}.mp3`)
    // audio.volume = masterVolume / 100
    // audio.play()
  }

  return (
    <AudioContext.Provider
      value={{
        masterVolume,
        soundEffects,
        backgroundMusic,
        cardSounds,
        setMasterVolume,
        setSoundEffects,
        setBackgroundMusic,
        setCardSounds,
        playSound
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}