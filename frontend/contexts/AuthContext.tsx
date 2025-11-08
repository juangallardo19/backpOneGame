'use client';

/**
 * AuthContext - Maneja autenticación y sesión del usuario
 * Incluye persistencia de sesión con localStorage y refresh token
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthResponse } from '@/types/game.types';
import api from '@/services/api';
import { API_ENDPOINTS } from '@/services/api-config';

// ============================================
// CONSTANTS
// ============================================

const TOKEN_KEY = 'uno_auth_token';
const REFRESH_TOKEN_KEY = 'uno_refresh_token';
const USER_KEY = 'uno_user';

// ============================================
// INTERFACES
// ============================================

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nickname: string, password: string) => Promise<void>;
  loginAsGuest: (nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setAuthData: (data: { token: string; refreshToken?: string; userId: number }) => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // STORAGE HELPERS
  // ============================================

  const saveToStorage = useCallback((authData: AuthResponse) => {
    try {
      localStorage.setItem(TOKEN_KEY, authData.token);
      if (authData.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }, []);

  const loadFromStorage = useCallback((): { token: string; user: User } | null => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        return {
          token: storedToken,
          user: JSON.parse(storedUser),
        };
      }
    } catch (error) {
      console.error('Error cargando de localStorage:', error);
    }
    return null;
  }, []);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  }, []);

  // ============================================
  // AUTH FUNCTIONS
  // ============================================

  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Iniciando sesión...');

      const response = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      const authData = response.data;

      // Guardar en estado
      setUser(authData.user);
      setToken(authData.token);

      // Guardar en localStorage
      saveToStorage(authData);

      // Configurar token en API para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;

      console.log('✅ Sesión iniciada correctamente');
    } catch (error: any) {
      console.error('❌ Error al iniciar sesión:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const register = useCallback(async (email: string, nickname: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('📝 Registrando usuario...');

      const response = await api.post<AuthResponse>(API_ENDPOINTS.REGISTER, {
        email,
        nickname,
        password,
      });

      const authData = response.data;

      // Guardar en estado
      setUser(authData.user);
      setToken(authData.token);

      // Guardar en localStorage
      saveToStorage(authData);

      // Configurar token en API
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;

      console.log('✅ Usuario registrado correctamente');
    } catch (error: any) {
      console.error('❌ Error al registrar:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al registrar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  const loginAsGuest = useCallback(async (nickname: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('👤 Iniciando como invitado...');

      // Crear usuario invitado (sin autenticación real)
      // NOTA: El backend no tiene soporte para invitados, esto es solo frontend
      const guestUser: User = {
        id: `guest_${Date.now()}`,
        email: `guest_${Date.now()}@temp.com`,
        nickname: nickname,
        authProvider: 'LOCAL',
        createdAt: new Date().toISOString(),
      };

      setUser(guestUser);
      setToken('guest_token'); // Token temporal para invitados

      // NO guardar en localStorage para invitados (sesión temporal)

      console.log('✅ Sesión de invitado iniciada');
    } catch (error: any) {
      console.error('❌ Error al iniciar como invitado:', error);
      setError(error.message || 'Error al iniciar como invitado');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      console.log('🚪 Cerrando sesión...');

      // Intentar cerrar sesión en el backend (opcional, puede fallar)
      try {
        await api.post(API_ENDPOINTS.LOGOUT);
      } catch (error) {
        console.warn('Error al cerrar sesión en backend:', error);
      }

      // Limpiar estado
      setUser(null);
      setToken(null);
      setError(null);

      // Limpiar localStorage
      clearStorage();

      // Limpiar header de autorización
      delete api.defaults.headers.common['Authorization'];

      console.log('✅ Sesión cerrada');
    } catch (error: any) {
      console.error('❌ Error al cerrar sesión:', error);
      setError(error.message || 'Error al cerrar sesión');
    } finally {
      setIsLoading(false);
    }
  }, [clearStorage]);

  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      console.log('🔄 Refrescando token...');

      const response = await api.post<AuthResponse>(API_ENDPOINTS.REFRESH, {
        refreshToken,
      });

      const authData = response.data;

      // Actualizar estado
      setUser(authData.user);
      setToken(authData.token);

      // Guardar en localStorage
      saveToStorage(authData);

      // Actualizar header
      api.defaults.headers.common['Authorization'] = `Bearer ${authData.token}`;

      console.log('✅ Token refrescado');
    } catch (error: any) {
      console.error('❌ Error al refrescar token:', error);
      // Si falla el refresh, cerrar sesión
      await logout();
      throw error;
    }
  }, [saveToStorage, logout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * setAuthData - Método para guardar datos de autenticación OAuth2
   * Usado por la página de callback después de login con Google/GitHub
   */
  const setAuthData = useCallback(async (data: { token: string; refreshToken?: string; userId: number }) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Guardando datos de autenticación OAuth2...');

      // Configurar header de autorización
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      // Obtener información del usuario desde el backend
      const response = await api.get<User>(API_ENDPOINTS.ME);
      const userData = response.data;

      // Guardar en estado
      setUser(userData);
      setToken(data.token);

      // Guardar en localStorage
      const authData: AuthResponse = {
        token: data.token,
        refreshToken: data.refreshToken,
        user: userData,
        userId: data.userId.toString(),
        email: userData.email,
        nickname: userData.nickname,
        expiresIn: 86400000, // 24 horas
      };

      saveToStorage(authData);

      console.log('✅ Autenticación OAuth2 completada');
    } catch (error: any) {
      console.error('❌ Error al guardar datos de autenticación:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al completar autenticación';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🔍 Verificando sesión guardada...');

        // Intentar cargar sesión desde localStorage
        const storedAuth = loadFromStorage();

        if (storedAuth) {
          console.log('✅ Sesión encontrada, restaurando...');

          // Configurar header de autorización
          api.defaults.headers.common['Authorization'] = `Bearer ${storedAuth.token}`;

          // Verificar que el token sea válido haciendo una petición al backend
          try {
            const response = await api.get<User>(API_ENDPOINTS.ME);

            // Token válido, restaurar sesión
            setUser(response.data);
            setToken(storedAuth.token);

            console.log('✅ Sesión restaurada correctamente');
          } catch (error: any) {
            console.warn('⚠️ Token inválido o expirado');

            // Intentar refrescar el token
            try {
              await refreshAuth();
            } catch (refreshError) {
              console.error('❌ No se pudo refrescar el token');
              clearStorage();
            }
          }
        } else {
          console.log('ℹ️ No hay sesión guardada');
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        clearStorage();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [loadFromStorage, clearStorage, refreshAuth]);

  // ============================================
  // AUTO-REFRESH TOKEN
  // ============================================

  useEffect(() => {
    if (!token || token === 'guest_token') return;

    // Refrescar token cada 20 minutos (si el token expira en 24h)
    const interval = setInterval(() => {
      refreshAuth().catch((error) => {
        console.error('Error en auto-refresh:', error);
      });
    }, 20 * 60 * 1000); // 20 minutos

    return () => clearInterval(interval);
  }, [token, refreshAuth]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,

    login,
    register,
    loginAsGuest,
    logout,
    refreshAuth,
    clearError,
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
