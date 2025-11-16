"use client"

/**
 * LoginScreen - Pantalla de autenticación
 * ACTUALIZADO: Ahora usa AuthContext y se conecta con el backend
 */

import { useState, useEffect } from "react"
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
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [transitionKey, setTransitionKey] = useState(0)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string
    username?: string
    password?: string
    confirmPassword?: string
  }>({})

  // Funciones de validación
  const validateEmail = (email: string): string | null => {
    if (!email.trim()) return "El email es requerido"
    if (email.includes(' ')) return "El email no debe contener espacios"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return "El email no tiene un formato válido"
    return null
  }

  const validateUsername = (username: string): string | null => {
    if (!username.trim()) return "El nombre de usuario es requerido"
    if (username.includes(' ')) return "El nombre de usuario no debe contener espacios"
    if (username.length < 3) return "El nombre de usuario debe tener al menos 3 caracteres"
    return null
  }

  const validatePassword = (password: string): string | null => {
    if (!password.trim()) return "La contraseña es requerida"
    if (password.includes(' ')) return "La contraseña no debe contener espacios"
    if (password.length < 8) return "La contraseña debe tener al menos 8 caracteres"
    return null
  }

  const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword.trim()) return "Debes confirmar la contraseña"
    if (confirmPassword.includes(' ')) return "La confirmación no debe contener espacios"
    if (password !== confirmPassword) return "Las contraseñas no coinciden"
    return null
  }

  const validateRegistrationForm = (): boolean => {
    const errors: typeof validationErrors = {}
    
    const emailError = validateEmail(registerEmail)
    if (emailError) errors.email = emailError

    const usernameError = validateUsername(registerUsername)
    if (usernameError) errors.username = usernameError

    const passwordError = validatePassword(registerPassword)
    if (passwordError) errors.password = passwordError

    const confirmPasswordError = validateConfirmPassword(registerPassword, registerPasswordConfirm)
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Limpiar error específico cuando el usuario empiece a escribir
  const clearFieldError = (field: keyof typeof validationErrors) => {
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const handleTabChange = (newTab: "login" | "register") => {
    if (newTab === activeTab) return
    setActiveTab(newTab)
    setTransitionKey(prev => prev + 1) // Fuerza re-animación
  }
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
  const { login, register: registerUser, error: authError } = useAuth()
  const { success, error: showError } = useNotification()


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

  // Handle Email/Username Login
  const handleEmailLogin = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      animateButton(e)
    }

    // Validar campos vacíos
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showError("Error", "Por favor completa todos los campos")
      return
    }

    // Validar formato de email
    const emailError = validateEmail(loginEmail.trim())
    if (emailError) {
      showError("Error de validación", emailError)
      return
    }

    // Validar contraseña (debe tener al menos 8 caracteres)
    if (loginPassword.length < 8) {
      showError("Error de validación", "La contraseña debe tener al menos 8 caracteres")
      return
    }

    // Validar que no haya espacios
    if (loginPassword.includes(' ')) {
      showError("Error de validación", "La contraseña no debe contener espacios")
      return
    }

    setIsLoading(true)
    try {
      await login(loginEmail.trim(), loginPassword)
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

    // Validar formulario antes de enviar
    if (!validateRegistrationForm()) {
      // Los errores ya están en el estado validationErrors
      return
    }

    setIsLoading(true)
    try {
      await registerUser(registerEmail.trim(), registerUsername.trim(), registerPassword.trim())
      success("¡Registro exitoso!", "Tu cuenta ha sido creada e iniciaste sesión automáticamente")
      // Limpiar el formulario
      setRegisterEmail("")
      setRegisterUsername("")
      setRegisterPassword("")
      setRegisterPasswordConfirm("")
      setValidationErrors({})
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
          <div className="absolute top-4 left-4 z-10">
            <button 
              onClick={onBack} 
              className="glass-back-button flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-semibold">Volver</span>
            </button>
          </div>
        )}

        <div className="mb-6 text-center">
          <Image
            src="/one-logo.png"
            alt="ONE Logo"
            width={320}
            height={160}
            className="mx-auto mb-3 drop-shadow-2xl"
            priority
          />
          <h1 className="text-6xl font-bold text-white mb-2">¡Bienvenido!</h1>
          <p className="text-white/80 text-2xl">Inicia sesión para jugar</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 max-w-6xl mx-auto">
          <button
            className={`flex-1 py-4 px-8 rounded-xl font-bold transition-all duration-500 ease-in-out text-xl whitespace-nowrap flex items-center justify-center min-w-0 ${
              activeTab === "login"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl border-2 border-orange-400 transform scale-105"
                : "bg-white/10 text-white/70 hover:bg-white/20 border-2 border-transparent hover:scale-105"
            }`}
            onClick={() => handleTabChange("login")}
          >
            Iniciar Sesión
          </button>
          <button
            className={`flex-1 py-4 px-8 rounded-xl font-bold transition-all duration-500 ease-in-out text-xl whitespace-nowrap flex items-center justify-center min-w-0 ${
              activeTab === "register"
                ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl border-2 border-orange-400 transform scale-105"
                : "bg-white/10 text-white/70 hover:bg-white/20 border-2 border-transparent hover:scale-105"
            }`}
            onClick={() => handleTabChange("register")}
          >
            Registrarse
          </button>
        </div>

        {/* Login Form */}
        {activeTab === "login" && (
          <div key={`login-${transitionKey}`} className="space-y-4 form-transition">
            {/* Email and Password in grid for all screen sizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="glass-input pr-16"
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === "Enter" && handleEmailLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showLoginPassword ? <EyeOff size={28} /> : <Eye size={28} />}
                </button>
              </div>
            </div>

            {/* Login button centered */}
            <div className="flex justify-center">
              <Button
                onClick={handleEmailLogin}
                className="w-full glass-button-primary py-4 text-lg font-bold rounded-2xl"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? "Iniciando..." : "Iniciar Sesión"}
              </Button>
            </div>

            {/* Separator */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t-2 border-white/20"></div>
              <span className="px-4 text-white/60 text-lg">O</span>
              <div className="flex-1 border-t-2 border-white/20"></div>
            </div>

            {/* OAuth buttons in grid below */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleGoogleLogin}
                className="w-full py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              
              <Button
                onClick={handleGitHubLogin}
                className="w-full py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-black text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        )}

        {/* Register Form */}
        {activeTab === "register" && (
          <div key={`register-${transitionKey}`} className="space-y-4 form-transition">
            {/* Email and Username in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={registerEmail}
                  onChange={(e) => {
                    setRegisterEmail(e.target.value)
                    clearFieldError('email')
                  }}
                  className={`glass-input ${validationErrors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {validationErrors.email && (
                  <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.email}</p>
                )}
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={registerUsername}
                  onChange={(e) => {
                    setRegisterUsername(e.target.value)
                    clearFieldError('username')
                  }}
                  className={`glass-input ${validationErrors.username ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                {validationErrors.username && (
                  <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.username}</p>
                )}
              </div>
            </div>

            {/* Passwords in grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Input
                  type={showRegisterPassword ? "text" : "password"}
                  placeholder="Contraseña (min. 8 caracteres)"
                  value={registerPassword}
                  onChange={(e) => {
                    setRegisterPassword(e.target.value)
                    clearFieldError('password')
                    // También limpiar error de confirmación si las contraseñas ya coinciden
                    if (registerPasswordConfirm && e.target.value === registerPasswordConfirm) {
                      clearFieldError('confirmPassword')
                    }
                  }}
                  className={`glass-input pr-16 ${validationErrors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showRegisterPassword ? <EyeOff size={28} /> : <Eye size={28} />}
                </button>
                {validationErrors.password && (
                  <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.password}</p>
                )}
              </div>
              <div className="relative">
                <Input
                  type={showRegisterPasswordConfirm ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={registerPasswordConfirm}
                  onChange={(e) => {
                    setRegisterPasswordConfirm(e.target.value)
                    clearFieldError('confirmPassword')
                  }}
                  className={`glass-input pr-16 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                  onKeyPress={(e) => e.key === "Enter" && handleRegister()}
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPasswordConfirm(!showRegisterPasswordConfirm)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showRegisterPasswordConfirm ? <EyeOff size={28} /> : <Eye size={28} />}
                </button>
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-sm mt-2 ml-2">{validationErrors.confirmPassword}</p>
                )}
              </div>
            </div>
            <Button
              onClick={handleRegister}
              className="w-full glass-button-primary py-4 text-2xl font-bold rounded-2xl"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}