"use client"

/**
 * UserProfileCard - Componente de perfil de usuario en la esquina superior derecha
 */

import { User } from "@/types/game.types"
import { LogOut, Settings, User as UserIcon } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

interface UserProfileCardProps {
  user: User
  onLogout: () => void
  onSettings?: () => void
}

export default function UserProfileCard({ user, onLogout, onSettings }: UserProfileCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isGuest = typeof user.id === 'string' && user.id.startsWith('guest_')

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-3 py-2 transition-all duration-200 border border-white/20 hover:border-white/30"
      >
        {/* Avatar */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt={user.nickname}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <UserIcon size={18} className="text-white" />
          )}
        </div>

        {/* Name */}
        <div className="hidden md:block text-left">
          <p className="text-white text-sm font-semibold leading-tight">
            {user.nickname}
          </p>
          {isGuest && (
            <p className="text-white/60 text-xs leading-tight">Invitado</p>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-gray-900/95 backdrop-blur-lg rounded-lg shadow-xl border border-white/10 overflow-hidden z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-white font-semibold text-sm">{user.nickname}</p>
              <p className="text-white/60 text-xs mt-1">{user.email}</p>
              {isGuest && (
                <p className="text-yellow-400/80 text-xs mt-1">
                  ⚠️ Modo invitado - Progreso no guardado
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {onSettings && (
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onSettings()
                  }}
                  className="w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Settings size={16} />
                  <span className="text-sm">Configuración</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false)
                  onLogout()
                }}
                className="w-full px-4 py-2 text-left text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center gap-2"
              >
                <LogOut size={16} />
                <span className="text-sm">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
