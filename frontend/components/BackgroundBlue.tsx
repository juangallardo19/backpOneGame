"use client"

interface BackgroundBlueProps {
  className?: string;
  isMyTurn?: boolean; // Controla la intensidad del brillo
}

export default function BackgroundBlue({ className = "", isMyTurn = true }: BackgroundBlueProps) {
  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        background: 'radial-gradient(circle at center, rgba(30, 58, 138, 0.2) 0%, rgba(17, 24, 39, 0.2) 50%, rgba(0, 0, 0, 1) 100%)'
      }}
    >
      {/* Esferas animadas */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            backgroundColor: 'rgba(96, 165, 250, 0.5)',
            animationDuration: '4s'
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            backgroundColor: 'rgba(34, 211, 238, 0.5)',
            animationDuration: '4s',
            animationDelay: '1s'
          }}
        />
      </div>

      {/* Overlay oscuro que cambia según el turno */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 1)',
          opacity: isMyTurn ? 0 : 0.4
        }}
      />
    </div>
  )
}
