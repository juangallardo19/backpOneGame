'use client'

import UnoGame3D from './UnoGame3D'

interface GamePlayProps {
  onBack?: () => void
}

export default function GamePlay({ onBack }: GamePlayProps) {
  return <UnoGame3D onBack={onBack} />
}
