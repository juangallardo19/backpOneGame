import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const rankingService = {
  // Obtener ranking global (top 100)
  getGlobalRanking: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.GLOBAL_RANKING);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener top N jugadores
  getTopN: async (limit = 10) => {
    try {
      const response = await api.get(API_ENDPOINTS.TOP_N(limit));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};