/**
 * TypeScript types for the ONE game
 * Synchronized with the Spring Boot backend
 */

// ============================================
// ENUMS (synchronized with backend)
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
 * Game card
 */
export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value: number | null; // null for special cards
  imageUrl?: string;
}

/**
 * Player
 */
export interface Player {
  id: string;
  nickname: string;
  userEmail?: string; // Email of authenticated user (to identify current user)
  isBot: boolean;
  status: PlayerStatus;
  cardCount: number; // Number of cards (other players don't see the cards)
  hasCalledUno: boolean; // Alias for frontend compatibility (deprecated, use calledOne)
  calledOne: boolean; // Backend property name
  profilePicture?: string;
  position?: number; // Position at the table (0-3)
}

/**
 * Current player (you) - with visible cards
 * Extends Player interface, inheriting all properties including calledOne
 */
export interface CurrentPlayer extends Player {
  hand: Card[]; // Only the current player sees their cards
}

/**
 * Game configuration
 */
export interface GameConfig {
  maxPlayers: number;
  pointsToWin: number; // 100, 200, 500
  turnTimeLimit: number; // seconds
  allowStackingDrawCards: boolean; // Allow stacking +2/+4
  preset: 'CLASSIC' | 'TOURNAMENT' | 'CUSTOM';
}

/**
 * Complete game state
 */
export interface GameState {
  sessionId: string;
  status: GameStatus;
  config: GameConfig;
  players: Player[];
  currentPlayer: CurrentPlayer | null; // The current player with their cards
  currentTurnPlayerId: string | null;
  topCard: Card | null; // Top card of discard pile
  drawPileCount: number;
  discardPileCount: number;
  direction: Direction;
  winner: Player | null;
  canDraw: boolean; // Can draw card?
  canPlay: boolean; // Can play card?
  playableCardIds: string[]; // IDs of cards that can be played
}

/**
 * Game room
 */
export interface Room {
  code: string;
  name: string;
  leaderId: string;
  isPrivate: boolean;
  status: 'WAITING' | 'IN_GAME' | 'IN_PROGRESS' | 'FINISHED';
  players: Player[];
  maxPlayers: number;
  config: GameConfig;
  createdAt: string;
}

/**
 * Player statistics
 */
export interface PlayerStats {
  userId: string | number; // Can be number from backend or string for guests
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
 * Global ranking
 */
export interface RankingEntry {
  rank: number;
  userId: string | number; // Can be number from backend or string for guests
  nickname: string;
  totalWins: number;
  totalGames: number;
  winRate: number;
  points: number;
  profilePicture?: string;
}

/**
 * Authenticated user
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
 * Authentication response
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  expiresIn: number;
}

/**
 * Chat message
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
 * Game move history
 */
export interface GameMove {
  id: string;
  playerId: string;
  playerNickname: string;
  type: 'PLAY_CARD' | 'DRAW_CARD' | 'SKIP' | 'ONE_CALL' | 'ONE_PENALTY';
  card?: Card;
  timestamp: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Generic API response
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API errors
 */
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number; // ms, undefined = no auto-close
}

/**
 * Player result in final ranking table
 */
export interface PlayerResult {
  position: number;
  userId: number | null;
  nickname: string;
  remainingCards: number;
  handPoints: number;
  pointsEarned: number;
  isWinner: boolean;
  isBot: boolean;
}

/**
 * Game end results (sent by backend when game finishes)
 */
export interface GameEndResult {
  roomCode: string;
  sessionId: string;
  winnerNickname: string;
  winnerId: number | null;
  playerRankings: PlayerResult[];
  durationMinutes: number;
  startedAt: string;
  endedAt: string;
  totalPlayers: number;
  totalCardsPlayed: number;
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

  // Wild cards can always be played
  if (isWildCard(card)) return true;

  // Same color or same value
  return card.color === topCard.color || card.value === topCard.value;
}

/**
 * Color to hex mapping for visualization
 */
export const COLOR_HEX_MAP: Record<CardColor, string> = {
  [CardColor.RED]: '#dc251c',
  [CardColor.YELLOW]: '#fcf604',
  [CardColor.BLUE]: '#0493de',
  [CardColor.GREEN]: '#018d41',
  [CardColor.WILD]: '#000000',
};

/**
 * Color to name mapping
 */
export const COLOR_NAME_MAP: Record<CardColor, string> = {
  [CardColor.RED]: 'Red',
  [CardColor.YELLOW]: 'Yellow',
  [CardColor.BLUE]: 'Blue',
  [CardColor.GREEN]: 'Green',
  [CardColor.WILD]: 'Wild',
};