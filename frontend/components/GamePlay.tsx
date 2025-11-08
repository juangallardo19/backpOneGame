'use client'

/**
 * GamePlay - Game wrapper component
 * Uses OneGame3D (backend-connected version)
 */

import OneGame3D from './OneGame3D'

interface GamePlayProps {
  onBack?: () => void
}

export default function GamePlay({ onBack }: GamePlayProps) {
  return <OneGame3D onBack={onBack} />
}
