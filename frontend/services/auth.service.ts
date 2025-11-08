/**
 * Auth Service - Servicios de autenticación
 * Actualizado para usar el nuevo API client
 */

import api from './api';
import { API_ENDPOINTS } from './api-config';
import { AuthResponse, User } from '@/types/game.types';

export const authService = {
  /**
   * Login con email y password
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Registrar nuevo usuario
   */
  register: async (email: string, nickname: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.REGISTER, {
        email,
        nickname,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      console.warn('Error en logout:', error);
    }
  },

  /**
   * Obtener información del usuario actual
   */
  me: async (): Promise<User> => {
    try {
      const response = await api.get<User>(API_ENDPOINTS.ME);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Refrescar token
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    try {
      const response = await api.post<AuthResponse>(API_ENDPOINTS.REFRESH, {
        refreshToken,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Verificar si email existe
   */
  checkEmail: async (email: string): Promise<boolean> => {
    try {
      const response = await api.post<{ exists: boolean }>(API_ENDPOINTS.CHECK_EMAIL, {
        email,
      });
      return response.data.exists;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Verificar si nickname existe
   */
  checkNickname: async (nickname: string): Promise<boolean> => {
    try {
      const response = await api.post<{ exists: boolean }>(API_ENDPOINTS.CHECK_NICKNAME, {
        nickname,
      });
      return response.data.exists;
    } catch (error: any) {
      throw error;
    }
  },
};

export default authService;
