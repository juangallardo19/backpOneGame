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

  // Handle Facebook Login
  const handleFacebookLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    setIsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      window.location.href = `${backendUrl}/oauth2/authorize/facebook`
    } catch (error) {
      showError("Error", "Error al iniciar sesión con Facebook")
      setIsLoading(false)
    }
  }

  // Handle Apple Login
  const handleAppleLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }
    setIsLoading(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      window.location.href = `${backendUrl}/oauth2/authorize/apple`
    } catch (error) {
      showError("Error", "Error al iniciar sesión con Apple")
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

            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={handleGoogleLogin}
                className="glass-button-secondary"
                disabled={isLoading}
              >
                <Mail className="w-5 h-5" />
              </Button>
              <Button
                onClick={handleFacebookLogin}
                className="glass-button-secondary"
                disabled={isLoading}
              >
                F
              </Button>
              <Button
                onClick={handleAppleLogin}
                className="glass-button-secondary"
                disabled={isLoading}
              >

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
