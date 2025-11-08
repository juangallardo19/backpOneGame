export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Rooms
  ROOMS: '/api/rooms',
  PUBLIC_ROOMS: '/api/rooms/public',
  ROOM_DETAIL: (code) => `/api/rooms/${code}`,
  JOIN_ROOM: (code) => `/api/rooms/${code}/join`,
  LEAVE_ROOM: (code) => `/api/rooms/${code}/leave`,
  ADD_BOT: (code) => `/api/rooms/${code}/bot`,
  
  // Game
  START_GAME: (sessionId) => `/api/game/${sessionId}/start`,
  PLAY_CARD: (sessionId) => `/api/game/${sessionId}/play`,
  DRAW_CARD: (sessionId) => `/api/game/${sessionId}/draw`,
  CALL_UNO: (sessionId) => `/api/game/${sessionId}/uno`,
  GAME_STATE: (sessionId) => `/api/game/${sessionId}/state`,
  
  // Ranking
  GLOBAL_RANKING: '/api/ranking/global',
  TOP_N: (limit) => `/api/ranking/global/top/${limit}`,
};

// WebSocket URL
export const WS_BASE_URL = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
export const WS_GAME_URL = (sessionId) => `${WS_BASE_URL}/ws/game/${sessionId}`;