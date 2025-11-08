/**
 * WebSocket Service para comunicación en tiempo real con el backend
 * Maneja eventos del juego: jugadores, cartas, turnos, etc.
 */

import { API_BASE_URL } from './api-config';

// Tipos de eventos que el backend puede enviar
export enum GameEventType {
  // Eventos de Sala
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',

  // Eventos de Juego
  GAME_STARTED = 'GAME_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  TURN_CHANGED = 'TURN_CHANGED',
  CARD_PLAYED = 'CARD_PLAYED',
  CARD_DRAWN = 'CARD_DRAWN',

  // Eventos de Acciones Especiales
  ONE_CALLED = 'ONE_CALLED',
  ONE_PENALTY = 'ONE_PENALTY',
  PLAYER_SKIPPED = 'PLAYER_SKIPPED',
  DIRECTION_REVERSED = 'DIRECTION_REVERSED',
  COLOR_CHANGED = 'COLOR_CHANGED',

  // Eventos de Chat
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  EMOTE_RECEIVED = 'EMOTE_RECEIVED',

  // Eventos de Estado
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  ERROR = 'ERROR',
}

// Interfaces para los eventos
export interface GameEvent {
  type: GameEventType;
  payload: any;
  timestamp?: number;
}

export interface PlayerJoinedEvent {
  playerId: string;
  nickname: string;
  isBot: boolean;
}

export interface CardPlayedEvent {
  playerId: string;
  card: {
    id: string;
    color: string;
    value: string;
    type: string;
  };
  newTopCard: any;
}

export interface TurnChangedEvent {
  currentPlayerId: string;
  nextPlayerId: string;
}

export interface GameStateUpdate {
  sessionId: string;
  status: 'LOBBY' | 'PLAYING' | 'GAME_OVER';
  players: any[];
  currentTurnPlayerId?: string;
  topCard?: any;
  drawPileCount: number;
  discardPileCount: number;
  direction: 'CLOCKWISE' | 'COUNTER_CLOCKWISE';
}

type EventCallback = (event: GameEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private eventCallbacks: Map<GameEventType | 'ALL', Set<EventCallback>> = new Map();
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private token: string | null = null;

  constructor(sessionId: string, token?: string) {
    this.sessionId = sessionId;
    this.token = token || null;
  }

  /**
   * Conectar al WebSocket del juego
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      try {
        // Convertir HTTP/HTTPS a WS/WSS
        const wsUrl = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
        const url = `${wsUrl}/ws/game/${this.sessionId}${this.token ? `?token=${this.token}` : ''}`;

        console.log('🔌 Conectando WebSocket:', url);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: GameEvent = JSON.parse(event.data);
            console.log('📨 Evento recibido:', message.type, message.payload);
            this.handleEvent(message);
          } catch (error) {
            console.error('Error parseando mensaje:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket cerrado:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();

          // Intentar reconectar si no fue cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Intentar reconexión automática
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(`🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Error en reconexión:', error);
      });
    }, delay);
  }

  /**
   * Heartbeat para mantener conexión viva
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'PING', payload: {} });
      }
    }, 30000); // Cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Enviar mensaje al servidor
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket no está conectado');
    }
  }

  /**
   * Manejar eventos recibidos
   */
  private handleEvent(event: GameEvent): void {
    // Llamar callbacks específicos del tipo de evento
    const typeCallbacks = this.eventCallbacks.get(event.type);
    if (typeCallbacks) {
      typeCallbacks.forEach((callback) => callback(event));
    }

    // Llamar callbacks generales (escuchan todos los eventos)
    const allCallbacks = this.eventCallbacks.get('ALL');
    if (allCallbacks) {
      allCallbacks.forEach((callback) => callback(event));
    }
  }

  /**
   * Suscribirse a un tipo de evento
   */
  on(eventType: GameEventType | 'ALL', callback: EventCallback): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }

    this.eventCallbacks.get(eventType)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.eventCallbacks.get(eventType)?.delete(callback);
    };
  }

  /**
   * Desuscribirse de todos los eventos
   */
  off(eventType?: GameEventType | 'ALL'): void {
    if (eventType) {
      this.eventCallbacks.delete(eventType);
    } else {
      this.eventCallbacks.clear();
    }
  }

  // ===============================
  // Métodos para enviar acciones
  // ===============================

  /**
   * Jugar una carta
   */
  playCard(cardId: string, chosenColor?: string): void {
    this.send({
      type: 'PLAY_CARD',
      payload: {
        cardId,
        chosenColor,
      },
    });
  }

  /**
   * Robar carta del mazo
   */
  drawCard(): void {
    this.send({
      type: 'DRAW_CARD',
      payload: {},
    });
  }

  /**
   * Cantar UNO
   */
  callUno(): void {
    this.send({
      type: 'CALL_UNO',
      payload: {},
    });
  }

  /**
   * Atrapar a jugador que no dijo UNO
   */
  catchUno(playerId: string): void {
    this.send({
      type: 'CATCH_UNO',
      payload: { playerId },
    });
  }

  /**
   * Enviar mensaje de chat
   */
  sendMessage(message: string): void {
    this.send({
      type: 'SEND_MESSAGE',
      payload: { message },
    });
  }

  /**
   * Enviar emote
   */
  sendEmote(emoteId: string): void {
    this.send({
      type: 'SEND_EMOTE',
      payload: { emoteId },
    });
  }

  /**
   * Solicitar estado actual del juego
   */
  requestGameState(): void {
    this.send({
      type: 'REQUEST_GAME_STATE',
      payload: {},
    });
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    console.log('🔌 Desconectando WebSocket');
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Cliente desconectado');
      this.ws = null;
    }

    this.eventCallbacks.clear();
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Obtener estado de la conexión
   */
  getConnectionState(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    if (!this.ws) return 'CLOSED';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  }
}

// Singleton para mantener una instancia por sesión
const wsInstances = new Map<string, WebSocketService>();

/**
 * Obtener o crear instancia de WebSocket para una sesión
 */
export function getWebSocketService(sessionId: string, token?: string): WebSocketService {
  if (!wsInstances.has(sessionId)) {
    wsInstances.set(sessionId, new WebSocketService(sessionId, token));
  }
  return wsInstances.get(sessionId)!;
}

/**
 * Limpiar instancia de WebSocket
 */
export function cleanupWebSocketService(sessionId: string): void {
  const instance = wsInstances.get(sessionId);
  if (instance) {
    instance.disconnect();
    wsInstances.delete(sessionId);
  }
}

export default WebSocketService;
