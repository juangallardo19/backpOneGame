"use client"

/**
 * LoginScreen - Pantalla de autenticación
 * ACTUALIZADO: Ahora usa AuthContext y se conecta con el backend
 */

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useNotification } from "@/contexts/NotificationContext"

interface LoginScreenProps {
  onLoginSuccess: () => void
  onBack?: () => void
}

export default function LoginScreen({ onLoginSuccess, onBack }: LoginScreenProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "guest">("login")
  const [guestNickname, setGuestNickname] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Login form
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  // Register form
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerUsername, setRegisterUsername] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("")
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] = useState(false)

  // Hooks
  const { login, register: registerUser, loginAsGuest, error: authError } = useAuth()
  const { success, error: showError } = useNotification()

  // Refs for animations
  const containerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    login: null,
    register: null,
    guest: null
  })

  // Button animation function using keyframes
  const animateButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget

    // Add the animation class
    button.classList.add('button-pulse')

    // Add glow effect
    button.style.boxShadow = "0 0 20px rgba(99, 102, 241, 0.8)"

    // Remove animation class after it completes
    setTimeout(() => {
      button.classList.remove('button-pulse')
      button.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.3)"
    }, 400)
  }

  // Handle Guest Login
  const handleGuestLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    if (guestNickname.trim().length < 3) {
      showError("Error", "El nickname debe tener al menos 3 caracteres")
      return
    }

    setIsLoading(true)
    try {
      await loginAsGuest(guestNickname)
      success("¡Bienvenido!", `Iniciaste sesión como ${guestNickname}`)
      onLoginSuccess()
    } catch (error: any) {
      showError("Error", error.message || "Error al iniciar sesión como invitado")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Email/Username Login
  const handleEmailLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showError("Error", "Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    try {
      await login(loginEmail, loginPassword)
      success("¡Bienvenido!", "Sesión iniciada correctamente")
      onLoginSuccess()
    } catch (error: any) {
      showError("Error de autenticación", error.message || "Credenciales incorrectas")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Registration
  const handleRegister = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    if (!registerEmail.trim() || !registerUsername.trim() || !registerPassword.trim() || !registerPasswordConfirm.trim()) {
      showError("Error", "Por favor completa todos los campos")
      return
    }

    if (registerUsername.trim().length < 3) {
      showError("Error", "El nombre de usuario debe tener al menos 3 caracteres")
      return
    }

    if (registerPassword !== registerPasswordConfirm) {
      showError("Error", "Las contraseñas no coinciden")
      return
    }

    if (registerPassword.trim().length < 6) {
      showError("Error", "La contraseña debe tener al menos 6 caracteres")
      return
    }

    setIsLoading(true)
    try {
      await registerUser(registerEmail, registerUsername, registerPassword)
      success("¡Registro exitoso!", "Tu cuenta ha sido creada")
      onLoginSuccess()
    } catch (error: any) {
      showError("Error al registrarse", error.message || "Intenta de nuevo")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Google Login
  const handleGoogleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    setIsLoading(true)
    try {
      // Redirigir al endpoint OAuth2 de Google en el backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      window.location.href = `${backendUrl}/oauth2/authorize/google`
    } catch (error) {
      showError("Error", "Error al iniciar sesión con Google")
      setIsLoading(false)
    }
  }

  // Handle GitHub Login
  const handleGitHubLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    setIsLoading(true)
    try {
      // Redirigir al endpoint OAuth2 de GitHub en el backend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      window.location.href = `${backendUrl}/oauth2/authorize/github`
    } catch (error) {
      showError("Error", "Error al iniciar sesión con GitHub")
      setIsLoading(false)
    }
  }

  // Mostrar error de autenticación si existe
  useEffect(() => {
    if (authError) {
      showError("Error de autenticación", authError)
    }
  }, [authError])

  return (
    <div className="glass-login-container" style={{ zIndex: 50, position: "relative" }}>
      <div className="glass-panel-login">
        {onBack && (
          <button onClick={onBack} className="absolute top-4 left-4 text-white/70 hover:text-white">
            ← Volver
          </button>
        )}

        <div className="mb-8 text-center">
          <Image
            src="/uno-logo.png"
            alt="UNO Logo"
            width={192}
            height={96}
            className="mx-auto mb-6 drop-shadow-2xl"
            priority
          />
          <h1 className="text-4xl font-bold text-white mb-2">¡Bienvenido!</h1>
          <p className="text-white/80">Inicia sesión para jugar</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "login"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "register"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
            onClick={() => setActiveTab("register")}
          >
            Registrarse
          </button>
          <button
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              activeTab === "guest"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
            onClick={() => setActiveTab("guest")}
          >
            Invitado
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div ref={(el) => (containerRefs.current.login = el)} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="glass-input"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <Input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="glass-input pr-10"
                disabled={isLoading}
                onKeyPress={(e) => e.key === "Enter" && handleEmailLogin()}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Button
              onClick={handleEmailLogin}
              className="w-full glass-button-primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-black/40 text-white/60">O continúa con</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleGoogleLogin}
                className="relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 py-6"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-bold">Google</span>
              </Button>
              <Button
                onClick={handleGitHubLogin}
                className="relative overflow-hidden bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 py-6"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span className="text-sm font-bold">GitHub</span>
              </Button>
            </div>
          </div>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <div ref={(el) => (containerRefs.current.register = el)} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="glass-input"
              disabled={isLoading}
            />
            <Input
              type="text"
              placeholder="Nombre de usuario"
              value={registerUsername}
              onChange={(e) => setRegisterUsername(e.target.value)}
              className="glass-input"
              disabled={isLoading}
            />
            <div className="relative">
              <Input
                type={showRegisterPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="glass-input pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="relative">
              <Input
                type={showRegisterPasswordConfirm ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                className="glass-input pr-10"
                disabled={isLoading}
                onKeyPress={(e) => e.key === "Enter" && handleRegister()}
              />
              <button
                type="button"
                onClick={() => setShowRegisterPasswordConfirm(!showRegisterPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showRegisterPasswordConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <Button
              onClick={handleRegister}
              className="w-full glass-button-primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
          </div>
        )}

        {/* Guest Form */}
        {activeTab === "guest" && (
          <div ref={(el) => (containerRefs.current.guest = el)} className="space-y-4">
            <Input
              type="text"
              placeholder="Ingresa tu nickname"
              value={guestNickname}
              onChange={(e) => setGuestNickname(e.target.value)}
              className="glass-input"
              disabled={isLoading}
              onKeyPress={(e) => e.key === "Enter" && handleGuestLogin()}
            />
            <Button
              onClick={handleGuestLogin}
              className="w-full glass-button-primary"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Jugar como Invitado"}
            </Button>
            <p className="text-white/60 text-sm text-center">
              Los invitados no pueden guardar su progreso
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
