/**
 * Ranking Service - Servicios de clasificación
 * Actualizado para usar el nuevo API client
 */

import api from './api';
import { API_ENDPOINTS } from './api-config';
import { RankingEntry, PlayerStats } from '@/types/game.types';

export const rankingService = {
  /**
   * Obtener ranking global (top 100)
   */
  getGlobalRanking: async (): Promise<RankingEntry[]> => {
    try {
      const response = await api.get<any>(API_ENDPOINTS.GLOBAL_RANKING);
      // Backend returns { rankingType, totalPlayers, rankings: [...], generatedAt }
      // We need to extract the rankings array and map to RankingEntry
      const backendResponse = response.data;

      if (!backendResponse.rankings || !Array.isArray(backendResponse.rankings)) {
        console.error('Invalid response format from backend:', backendResponse);
        return [];
      }

      // Map backend format to frontend RankingEntry format
      return backendResponse.rankings.map((entry: any) => ({
        rank: entry.rank,
        userId: entry.playerId,
        nickname: entry.nickname,
        totalWins: entry.wins || 0,
        totalGames: entry.gamesPlayed || 0,
        winRate: entry.winRate || 0,
        points: entry.totalPoints || 0,
        profilePicture: entry.profilePicture,
      }));
    } catch (error: any) {
      console.error('Error fetching global ranking:', error);
      throw error;
    }
  },

  /**
   * Obtener top N jugadores
   */
  getTopN: async (limit: number = 10): Promise<RankingEntry[]> => {
    try {
      const response = await api.get<any>(API_ENDPOINTS.TOP_N(limit));
      const backendResponse = response.data;

      if (!backendResponse.rankings || !Array.isArray(backendResponse.rankings)) {
        console.error('Invalid response format from backend:', backendResponse);
        return [];
      }

      // Map backend format to frontend RankingEntry format
      return backendResponse.rankings.map((entry: any) => ({
        rank: entry.rank,
        userId: entry.playerId,
        nickname: entry.nickname,
        totalWins: entry.wins || 0,
        totalGames: entry.gamesPlayed || 0,
        winRate: entry.winRate || 0,
        points: entry.totalPoints || 0,
        profilePicture: entry.profilePicture,
      }));
    } catch (error: any) {
      console.error('Error fetching top N ranking:', error);
      throw error;
    }
  },

  /**
   * Obtener ranking de un jugador específico
   */
  getPlayerRanking: async (userId: string): Promise<PlayerStats> => {
    try {
      const response = await api.get<PlayerStats>(API_ENDPOINTS.PLAYER_RANKING(userId));
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener ranking por rachas
   */
  getStreakRanking: async (): Promise<RankingEntry[]> => {
    try {
      const response = await api.get<RankingEntry[]>(API_ENDPOINTS.STREAK_RANKING);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener jugadores en ascenso
   */
  getRisingPlayers: async (): Promise<RankingEntry[]> => {
    try {
      const response = await api.get<RankingEntry[]>(API_ENDPOINTS.RISING_PLAYERS);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Obtener estadísticas del ranking
   */
  getRankingStats: async (): Promise<any> => {
    try {
      const response = await api.get(API_ENDPOINTS.RANKING_STATS);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

export default rankingService;