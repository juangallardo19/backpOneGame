"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'

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
    // Protección SSR: verificar que estamos en el navegador
    if (typeof window === 'undefined') return

    try {
      const savedSettings = localStorage.getItem('unoGameSettings')
      if (savedSettings) {
        const settings = JSON.parse(savedSettings)
        setMasterVolume(settings.masterVolume || 50)
        setSoundEffects(settings.soundEffects ?? true)
        setBackgroundMusic(settings.backgroundMusic ?? true)
        setCardSounds(settings.cardSounds ?? true)
      }
    } catch (error) {
      console.error('Error loading audio settings:', error)
    }
  }, [])

  const playSound = useCallback((soundType: 'card' | 'effect' | 'music') => {
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
  }, [cardSounds, soundEffects, backgroundMusic, masterVolume])

  // Función genérica para reproducir cualquier sonido por ruta
  const playSoundFile = useCallback((soundPath: string, volume?: number) => {
    // Protección SSR: solo reproducir en el navegador
    if (typeof window === 'undefined') return
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
  }, [soundEffects, masterVolume])

  // Funciones específicas para los sonidos de UNO
  const playUnoSound = useCallback(() => {
    console.log('🔔 Playing UNO sound!')
    playSoundFile('/sounds/UnoSound.mp3')
  }, [playSoundFile])

  const playIncorrectSound = useCallback(() => {
    console.log('❌ Playing incorrect sound!')
    playSoundFile('/sounds/Incorrect.mp3')
  }, [playSoundFile])

  const value = useMemo(() => ({
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
  }), [
    masterVolume,
    soundEffects,
    backgroundMusic,
    cardSounds,
    playSound,
    playUnoSound,
    playIncorrectSound
  ])

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)

  // Durante SSR o si no hay provider, devolver valores por defecto
  if (context === undefined) {
    // En desarrollo, advertir pero no fallar
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useAudio called outside AudioProvider, returning defaults')
    }

    // Devolver valores por defecto seguros para SSR
    return {
      masterVolume: 50,
      soundEffects: true,
      backgroundMusic: true,
      cardSounds: true,
      setMasterVolume: () => {},
      setSoundEffects: () => {},
      setBackgroundMusic: () => {},
      setCardSounds: () => {},
      playSound: () => {},
      playUnoSound: () => {},
      playIncorrectSound: () => {},
    }
  }

  return context
}