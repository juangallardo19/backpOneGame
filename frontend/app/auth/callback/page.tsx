"use client"

/**
 * OAuth2 Callback Page
 *
 * Esta página recibe el token JWT del backend después de autenticación OAuth2 (Google/GitHub)
 *
 * Flow:
 * 1. Usuario hace clic en "Login with Google/GitHub" en LoginScreen
 * 2. Se redirige a backend: /oauth2/authorize/{provider}
 * 3. Usuario autoriza en Google/GitHub
 * 4. Backend procesa y redirige aquí: /auth/callback?token={jwt}&refreshToken={refresh}&userId={id}
 * 5. Esta página captura los parámetros y los guarda en AuthContext
 * 6. Redirige al usuario a la página principal
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useNotification } from '@/contexts/NotificationContext'
import Image from 'next/image'

export default function OAuth2CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuthData } = useAuth()
  const { success, error } = useNotification()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const processOAuth2Callback = async () => {
      try {
        // Extraer parámetros de la URL
        const token = searchParams.get('token')
        const refreshToken = searchParams.get('refreshToken')
        const userId = searchParams.get('userId')
        const errorMessage = searchParams.get('error')

        // Si hay error, mostrar y redirigir
        if (errorMessage) {
          error('Error de autenticación', decodeURIComponent(errorMessage))
          setTimeout(() => router.push('/'), 2000)
          return
        }

        // Validar que tengamos los datos necesarios
        if (!token || !userId) {
          error('Error', 'No se recibieron los datos de autenticación')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        // Guardar en AuthContext
        await setAuthData({
          token,
          refreshToken: refreshToken || undefined,
          userId: parseInt(userId, 10)
        })

        success('¡Bienvenido!', 'Autenticación exitosa')

        // Redirigir a la página principal
        setTimeout(() => {
          router.push('/')
        }, 1000)

      } catch (err: any) {
        console.error('Error processing OAuth2 callback:', err)
        error('Error', err.message || 'Error al procesar la autenticación')
        setTimeout(() => router.push('/'), 2000)
      } finally {
        setIsProcessing(false)
      }
    }

    processOAuth2Callback()
  }, [searchParams, setAuthData, router, success, error])

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="glass-panel-login text-center">
        <Image
          src="/uno-logo.png"
          alt="UNO Logo"
          width={192}
          height={96}
          className="mx-auto mb-6 drop-shadow-2xl"
          priority
        />

        {isProcessing ? (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              Procesando autenticación...
            </h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
            <p className="text-white/70 mt-4">
              Espera un momento mientras completamos tu inicio de sesión
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-white mb-4">
              Redirigiendo...
            </h1>
            <p className="text-white/70">
              Serás redirigido en un momento
            </p>
          </>
        )}
      </div>
    </div>
  )
}
