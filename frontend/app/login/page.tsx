"use client"

/**
 * Login Page - Standalone login page
 * URL: /login
 */

import LoginScreen from "@/components/LoginScreen"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, router])

  const handleLoginSuccess = () => {
    router.push('/') // Redirect to home after successful login
  }

  const handleBack = () => {
    router.push('/') // Go back to home
  }

  return (
    <LoginScreen
      onLoginSuccess={handleLoginSuccess}
      onBack={handleBack}
    />
  )
}
