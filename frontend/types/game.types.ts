/**
 * Tipos TypeScript para el juego ONE
 * Sincronizados con el backend de Spring Boot
 */

// ============================================
// ENUMS (sincronizados con backend)
// ============================================

export enum CardColor {
  RED = 'RED',
  YELLOW = 'YELLOW',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  WILD = 'WILD',
}

export enum CardType {
  NUMBER = 'NUMBER',
  SKIP = 'SKIP',
  REVERSE = 'REVERSE',
  DRAW_TWO = 'DRAW_TWO',
  WILD = 'WILD',
  WILD_DRAW_FOUR = 'WILD_DRAW_FOUR',
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export enum PlayerStatus {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  DISCONNECTED = 'DISCONNECTED',
  LEFT = 'LEFT',
}

export enum Direction {
  CLOCKWISE = 'CLOCKWISE',
  COUNTER_CLOCKWISE = 'COUNTER_CLOCKWISE',
}

// ============================================
// INTERFACES
// ============================================

/**
 * Carta del juego
 */
export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value: number | null; // null para cartas especiales
  imageUrl?: string;
}

/**
 * Jugador
 */
export interface Player {
  id: string;
  nickname: string;
  isBot: boolean;
  status: PlayerStatus;
  cardCount: number; // Número de cartas (otros jugadores no ven las cartas)
  hasCalledUno: boolean;
  profilePicture?: string;
  position?: number; // Posición en la mesa (0-3)
}

/**
 * Jugador actual (tú) - con cartas visibles
 */
export interface CurrentPlayer extends Player {
  hand: Card[]; // Solo el jugador actual ve sus cartas
}

/**
 * Configuración del juego
 */
export interface GameConfig {
  maxPlayers: number;
  pointsToWin: number; // 100, 200, 500
  turnTimeLimit: number; // segundos
  allowStackingDrawCards: boolean; // Permitir apilar +2/+4
  preset: 'CLASSIC' | 'TOURNAMENT' | 'CUSTOM';
}

/**
 * Estado completo del juego
 */
export interface GameState {
  sessionId: string;
  status: GameStatus;
  config: GameConfig;
  players: Player[];
  currentPlayer: CurrentPlayer | null; // El jugador actual con sus cartas
  currentTurnPlayerId: string | null;
  topCard: Card | null; // Carta superior del pile de descarte
  drawPileCount: number;
  discardPileCount: number;
  direction: Direction;
  winner: Player | null;
  canDraw: boolean; // ¿Puede robar carta?
  canPlay: boolean; // ¿Puede jugar carta?
  playableCardIds: string[]; // IDs de cartas que se pueden jugar
}

/**
 * Sala de juego
 */
export interface Room {
  code: string;
  name: string;
  leaderId: string;
  isPrivate: boolean;
  status: 'WAITING' | 'IN_GAME' | 'FINISHED';
  players: Player[];
  maxPlayers: number;
  config: GameConfig;
  createdAt: string;
}

/**
 * Estadísticas de jugador
 */
export interface PlayerStats {
  userId: string;
  nickname: string;
  totalWins: number;
  totalGames: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  rank?: number;
  profilePicture?: string;
}

/**
 * Ranking global
 */
export interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  totalWins: number;
  totalGames: number;
  winRate: number;
  points: number;
  profilePicture?: string;
}

/**
 * Usuario autenticado
 */
export interface User {
  id: string | number; // Can be number from backend or string for guests
  email: string;
  nickname: string;
  profilePicture?: string;
  authProvider: 'LOCAL' | 'GOOGLE' | 'GITHUB';
  createdAt: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

/**
 * Mensaje de chat
 */
export interface ChatMessage {
  id: string;
  playerId: string;
  playerNickname: string;
  message: string;
  timestamp: number;
  type: 'MESSAGE' | 'SYSTEM' | 'EMOTE';
}

/**
 * Emote
 */
export interface Emote {
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string;
}

/**
 * Historial de movimiento
 */
export interface GameMove {
  id: string;
  playerId: string;
  playerNickname: string;
  type: 'PLAY_CARD' | 'DRAW_CARD' | 'SKIP' | 'UNO_CALL' | 'UNO_PENALTY';
  card?: Card;
  timestamp: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Errores de la API
 */
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

/**
 * Notificación
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // ms, undefined = no se cierra automáticamente
}

// ============================================
// HELPER FUNCTIONS (Type Guards)
// ============================================

export function isNumberCard(card: Card): boolean {
  return card.type === CardType.NUMBER;
}

export function isActionCard(card: Card): boolean {
  return [CardType.SKIP, CardType.REVERSE, CardType.DRAW_TWO].includes(card.type);
}

export function isWildCard(card: Card): boolean {
  return card.type === CardType.WILD || card.type === CardType.WILD_DRAW_FOUR;
}

export function canPlayCard(card: Card, topCard: Card | null): boolean {
  if (!topCard) return true;

  // Wild cards se pueden jugar siempre
  if (isWildCard(card)) return true;

  // Mismo color o mismo valor
  return card.color === topCard.color || card.value === topCard.value;
}

/**
 * Mapeo de colores a hex para visualización
 */
export const COLOR_HEX_MAP: Record<CardColor, string> = {
  [CardColor.RED]: '#dc251c',
  [CardColor.YELLOW]: '#fcf604',
  [CardColor.BLUE]: '#0493de',
  [CardColor.GREEN]: '#018d41',
  [CardColor.WILD]: '#000000',
};

/**
 * Mapeo de colores a nombres en español
 */
export const COLOR_NAME_MAP: Record<CardColor, string> = {
  [CardColor.RED]: 'Rojo',
  [CardColor.YELLOW]: 'Amarillo',
  [CardColor.BLUE]: 'Azul',
  [CardColor.GREEN]: 'Verde',
  [CardColor.WILD]: 'Comodín',
};
