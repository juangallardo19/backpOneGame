// URL base de tu API
// Next.js usa NEXT_PUBLIC_ para variables de entorno del cliente
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://oneonlinebackend-production.up.railway.app';

// Endpoints disponibles
export const API_ENDPOINTS = {
  // Auth
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  REFRESH: '/api/auth/refresh',
  CHECK_EMAIL: '/api/auth/check-email',
  CHECK_NICKNAME: '/api/auth/check-nickname',
  
  // Rooms
  ROOMS: '/api/rooms',
  PUBLIC_ROOMS: '/api/rooms/public',
  CURRENT_ROOM: '/api/rooms/current',
  ROOM_DETAIL: (code) => `/api/rooms/${code}`,
  JOIN_ROOM: (code) => `/api/rooms/${code}/join`,
  LEAVE_ROOM: (code) => `/api/rooms/${code}/leave`,
  KICK_PLAYER: (code, playerId) => `/api/rooms/${code}/kick/${playerId}`,
  ADD_BOT: (code) => `/api/rooms/${code}/bot`,
  REMOVE_BOT: (code, botId) => `/api/rooms/${code}/bot/${botId}`,
  TRANSFER_LEADER: (code, newLeaderId) => `/api/rooms/${code}/leader/${newLeaderId}`,
  TOGGLE_PRIVACY: (code) => `/api/rooms/${code}/toggle-privacy`,
  START_GAME_FROM_ROOM: (code) => `/api/rooms/${code}/start`, // NEW: Start game from room
  
  // Game
  START_GAME: (sessionId) => `/api/game/${sessionId}/start`,
  PLAY_CARD: (sessionId) => `/api/game/${sessionId}/play`,
  DRAW_CARD: (sessionId) => `/api/game/${sessionId}/draw`,
  CALL_UNO: (sessionId) => `/api/game/${sessionId}/uno`,
  GAME_STATE: (sessionId) => `/api/game/${sessionId}/state`,
  UNDO_MOVE: (sessionId) => `/api/game/${sessionId}/undo`,
  CATCH_UNO: (sessionId, playerId) => `/api/game/${sessionId}/catch-uno/${playerId}`,
  
  // Ranking
  GLOBAL_RANKING: '/api/ranking/global',
  TOP_N: (limit) => `/api/ranking/global/top/${limit}`,
  PLAYER_RANKING: (userId) => `/api/ranking/player/${userId}`,
  STREAK_RANKING: '/api/ranking/streak',
  RISING_PLAYERS: '/api/ranking/rising',
  RANKING_RANGE: '/api/ranking/range',
  RANKING_STATS: '/api/ranking/stats',
};

// WebSocket URL
export const WS_BASE_URL = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
export const WS_GAME_URL = (sessionId) => `${WS_BASE_URL}/ws/game/${sessionId}`;