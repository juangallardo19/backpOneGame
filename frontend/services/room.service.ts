/**
 * Room Service - Servicios de salas
 * Actualizado para usar el nuevo API client
 */

import api from './api';
import { API_ENDPOINTS } from './api-config';
import { Room } from '@/types/game.types';

/**
 * Helper function to map backend RoomResponse to frontend Room interface
 */
const mapBackendRoomToFrontend = (backendRoom: any): Room => {
  // Map players from backend PlayerInfo to frontend Player
  const players = (backendRoom.players || []).map((p: any) => ({
    id: p.playerId,
    nickname: p.nickname,
    isBot: p.isBot || false,
    status: p.status || 'WAITING',
    cardCount: 0, // Will be updated during game
    hasCalledUno: false,
    profilePicture: undefined,
    position: undefined,
  }));

  return {
    code: backendRoom.roomCode,
    name: backendRoom.roomName || `Sala ${backendRoom.roomCode}`,
    leaderId: backendRoom.hostId,
    isPrivate: backendRoom.isPrivate || false,
    status: backendRoom.status || 'WAITING',
    players: players,
    maxPlayers: backendRoom.maxPlayers || 4,
    config: {
      maxPlayers: backendRoom.maxPlayers || 4,
      pointsToWin: backendRoom.config?.pointsToWin || 500,
      turnTimeLimit: backendRoom.config?.turnTimeLimit || 60,
      allowStackingDrawCards: backendRoom.config?.allowStackingCards || true,
      preset: 'CLASSIC', // Default preset
    },
    createdAt: backendRoom.createdAt ? new Date(backendRoom.createdAt).toISOString() : new Date().toISOString(),
  };
};

export const roomService = {
  /**
   * Crear nueva sala con configuración completa
   * RF08, RF10, RF11, RF17-RF23
   */
  createRoom: async (roomConfig: {
    name?: string;
    isPrivate?: boolean;
    maxPlayers?: number;
    initialHandSize?: number; // RF18: 5-10 cards
    turnTimeLimit?: number; // RF20, RF29: Turn time in seconds
    allowStackingCards?: boolean; // RF21, RF30: Stack +2/+4
    pointsToWin?: number; // RF22: Points to win
    allowBots?: boolean;
    roomName?: string;
  }): Promise<Room> => {
    try {
      const response = await api.post<any>(API_ENDPOINTS.ROOMS, {
        isPrivate: roomConfig.isPrivate ?? false,
        maxPlayers: roomConfig.maxPlayers ?? 4,
        initialHandSize: roomConfig.initialHandSize ?? 7,
        turnTimeLimit: roomConfig.turnTimeLimit ?? 60,
        allowStackingCards: roomConfig.allowStackingCards ?? true,
        pointsToWin: roomConfig.pointsToWin ?? 500,
        allowBots: roomConfig.allowBots ?? true,
        roomName: roomConfig.roomName || roomConfig.name,
      });

      return mapBackendRoomToFrontend(response.data);
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener salas públicas
   */
  getPublicRooms: async (): Promise<Room[]> => {
    try {
      const response = await api.get<any[]>(API_ENDPOINTS.PUBLIC_ROOMS);
      const rooms = response.data.map(mapBackendRoomToFrontend);

      // Filter out private rooms and empty rooms
      return rooms.filter(room =>
        !room.isPrivate && // Only public rooms
        room.players.length > 0 && // Only rooms with players
        room.status !== 'FINISHED' // Exclude finished games
      );
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener sala por código
   */
  getRoomByCode: async (code: string): Promise<Room> => {
    try {
      const response = await api.get<any>(API_ENDPOINTS.ROOM_DETAIL(code));
      return mapBackendRoomToFrontend(response.data);
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Unirse a sala
   */
  joinRoom: async (code: string, nickname?: string): Promise<Room> => {
    try {
      const response = await api.post<any>(API_ENDPOINTS.JOIN_ROOM(code), {
        roomCode: code, // Backend requires this in body for validation
        nickname: nickname || undefined
      });
      return mapBackendRoomToFrontend(response.data);
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
      const response = await api.post<any>(API_ENDPOINTS.ADD_BOT(code), { difficulty });
      return mapBackendRoomToFrontend(response.data);
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
      const response = await api.post<any>(API_ENDPOINTS.TRANSFER_LEADER(code, newLeaderId));
      return mapBackendRoomToFrontend(response.data);
    } catch (error: any) {
      throw error;
    }
  },
};

export default roomService;
