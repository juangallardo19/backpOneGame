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
  playUnoSound: () => void
  playIncorrectSound: () => void
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

  // Función genérica para reproducir cualquier sonido por ruta
  const playSoundFile = (soundPath: string, volume?: number) => {
    if (!soundEffects || masterVolume === 0) return

    try {
      const audio = new Audio(soundPath)
      audio.volume = (volume !== undefined ? volume : masterVolume) / 100
      audio.play().catch((error) => {
        console.error(`Error playing sound: ${soundPath}`, error)
      })
    } catch (error) {
      console.error(`Failed to load sound: ${soundPath}`, error)
    }
  }

  // Funciones específicas para los sonidos de UNO
  const playUnoSound = () => {
    console.log('🔔 Playing UNO sound!')
    playSoundFile('/sounds/UnoSound.mp3')
  }

  const playIncorrectSound = () => {
    console.log('❌ Playing incorrect sound!')
    playSoundFile('/sounds/Incorrect.mp3')
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
        playSound,
        playUnoSound,
        playIncorrectSound
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