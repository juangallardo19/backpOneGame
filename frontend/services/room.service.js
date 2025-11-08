import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export const roomService = {
  // Crear nueva sala
  createRoom: async (roomConfig) => {
    try {
      const response = await api.post(API_ENDPOINTS.ROOMS, roomConfig);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener salas públicas
  getPublicRooms: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.PUBLIC_ROOMS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener sala por código
  getRoomByCode: async (code) => {
    try {
      const response = await api.get(API_ENDPOINTS.ROOM_DETAIL(code));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Unirse a sala
  joinRoom: async (code) => {
    try {
      const response = await api.post(API_ENDPOINTS.JOIN_ROOM(code));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Salir de sala
  leaveRoom: async (code) => {
    try {
      await api.delete(API_ENDPOINTS.LEAVE_ROOM(code));
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Agregar bot
  addBot: async (code, difficulty = 'NORMAL') => {
    try {
      const response = await api.post(API_ENDPOINTS.ADD_BOT(code), { difficulty });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};