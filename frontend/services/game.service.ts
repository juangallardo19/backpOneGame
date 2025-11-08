/**
 * Game Service - Servicios del juego
 * Actualizado para usar el nuevo API client
 */

import api from './api';
import { API_ENDPOINTS } from './api-config';
import { GameState } from '@/types/game.types';

export const gameService = {
  /**
   * Iniciar juego
   */
  startGame: async (sessionId: string): Promise<GameState> => {
    try {
      const response = await api.post<GameState>(API_ENDPOINTS.START_GAME(sessionId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Jugar carta
   */
  playCard: async (
    sessionId: string,
    cardId: string,
    chosenColor?: string
  ): Promise<GameState> => {
    try {
      const response = await api.post<GameState>(API_ENDPOINTS.PLAY_CARD(sessionId), {
        cardId,
        chosenColor,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Robar carta
   */
  drawCard: async (sessionId: string): Promise<GameState> => {
    try {
      const response = await api.post<GameState>(API_ENDPOINTS.DRAW_CARD(sessionId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Cantar UNO
   */
  callUno: async (sessionId: string): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.CALL_UNO(sessionId));
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener estado del juego
   */
  getGameState: async (sessionId: string): Promise<GameState> => {
    try {
      const response = await api.get<GameState>(API_ENDPOINTS.GAME_STATE(sessionId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Deshacer movimiento
   */
  undoMove: async (sessionId: string): Promise<GameState> => {
    try {
      const response = await api.post<GameState>(API_ENDPOINTS.UNDO_MOVE(sessionId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Atrapar jugador que no dijo UNO
   */
  catchUno: async (sessionId: string, playerId: string): Promise<void> => {
    try {
      await api.post(API_ENDPOINTS.CATCH_UNO(sessionId, playerId));
    } catch (error: any) {
      throw error;
    }
  },
};

export default gameService;
