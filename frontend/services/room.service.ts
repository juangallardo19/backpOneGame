/**
 * Room Service - Servicios de salas
 * Actualizado para usar el nuevo API client
 */

import api from './api';
import { API_ENDPOINTS } from './api-config';
import { Room } from '@/types/game.types';

export const roomService = {
  /**
   * Crear nueva sala
   */
  createRoom: async (roomConfig: {
    name?: string;
    isPrivate?: boolean;
    maxPlayers?: number;
    pointsToWin?: number;
  }): Promise<Room> => {
    try {
      const response = await api.post<Room>(API_ENDPOINTS.ROOMS, roomConfig);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener salas públicas
   */
  getPublicRooms: async (): Promise<Room[]> => {
    try {
      const response = await api.get<Room[]>(API_ENDPOINTS.PUBLIC_ROOMS);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener sala por código
   */
  getRoomByCode: async (code: string): Promise<Room> => {
    try {
      const response = await api.get<Room>(API_ENDPOINTS.ROOM_DETAIL(code));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Unirse a sala
   */
  joinRoom: async (code: string, nickname?: string): Promise<Room> => {
    try {
      const response = await api.post<Room>(API_ENDPOINTS.JOIN_ROOM(code), {
        nickname: nickname || undefined
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Salir de sala
   */
  leaveRoom: async (code: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.LEAVE_ROOM(code));
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Expulsar jugador (solo líder)
   */
  kickPlayer: async (code: string, playerId: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.KICK_PLAYER(code, playerId));
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Agregar bot
   */
  addBot: async (code: string, difficulty: 'EASY' | 'NORMAL' | 'HARD' = 'NORMAL'): Promise<Room> => {
    try {
      const response = await api.post<Room>(API_ENDPOINTS.ADD_BOT(code), { difficulty });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Remover bot
   */
  removeBot: async (code: string, botId: string): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.REMOVE_BOT(code, botId));
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Transferir liderazgo
   */
  transferLeader: async (code: string, newLeaderId: string): Promise<Room> => {
    try {
      const response = await api.post<Room>(API_ENDPOINTS.TRANSFER_LEADER(code, newLeaderId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default roomService;
