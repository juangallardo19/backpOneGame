import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const gameService = {
  // Iniciar juego
  startGame: async (sessionId) => {
    try {
      const response = await api.post(API_ENDPOINTS.START_GAME(sessionId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Jugar carta
  playCard: async (sessionId, cardId, chosenColor = null) => {
    try {
      const response = await api.post(API_ENDPOINTS.PLAY_CARD(sessionId), {
        cardId,
        chosenColor,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Robar carta
  drawCard: async (sessionId) => {
    try {
      const response = await api.post(API_ENDPOINTS.DRAW_CARD(sessionId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cantar UNO
  callUno: async (sessionId) => {
    try {
      const response = await api.post(API_ENDPOINTS.CALL_UNO(sessionId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener estado del juego
  getGameState: async (sessionId) => {
    try {
      const response = await api.get(API_ENDPOINTS.GAME_STATE(sessionId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};