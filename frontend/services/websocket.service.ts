/**
 * WebSocket Service using STOMP over WebSocket
 * Connects to Spring Boot backend with STOMP protocol
 */

import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { API_BASE_URL } from './api-config';

// Event types that the backend can send
export enum GameEventType {
  // Room Events
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_KICKED = 'PLAYER_KICKED',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  LEADERSHIP_TRANSFERRED = 'LEADERSHIP_TRANSFERRED',

  // Game Events
  GAME_STARTED = 'GAME_STARTED',
  GAME_ENDED = 'GAME_ENDED',
  TURN_CHANGED = 'TURN_CHANGED',
  CARD_PLAYED = 'CARD_PLAYED',
  CARD_DRAWN = 'CARD_DRAWN',

  // Special Action Events
  ONE_CALLED = 'ONE_CALLED',
  ONE_PENALTY = 'ONE_PENALTY',
  PLAYER_SKIPPED = 'PLAYER_SKIPPED',
  DIRECTION_REVERSED = 'DIRECTION_REVERSED',
  COLOR_CHANGED = 'COLOR_CHANGED',

  // Chat Events
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  EMOTE_RECEIVED = 'EMOTE_RECEIVED',

  // State Events
  GAME_STATE_UPDATE = 'GAME_STATE_UPDATE',
  ERROR = 'ERROR',
}

// Interfaces for events
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
  private client: Client | null = null;
  private roomCode: string; // Changed from sessionId to roomCode
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventCallbacks: Map<GameEventType | 'ALL', Set<EventCallback>> = new Map();
  private isConnecting = false;
  private token: string | null = null;
  private subscription: StompSubscription | null = null;

  constructor(roomCode: string, token?: string) {
    this.roomCode = roomCode;
    this.token = token || null;
  }

  /**
   * Conectar al WebSocket usando STOMP
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client && this.client.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Already connecting'));
        return;
      }

      this.isConnecting = true;

      try {
        // Crear cliente STOMP con SockJS
        this.client = new Client({
          // Use SockJS for connection
          webSocketFactory: () => {
            // SockJS endpoint is /ws (not /ws/game/{roomCode})
            return new SockJS(`${API_BASE_URL}/ws`) as any;
          },

          // Connection headers (JWT token)
          connectHeaders: this.token
            ? {
                Authorization: `Bearer ${this.token}`,
              }
            : {},

          // Debug logging
          debug: (str: string) => {
            console.log('🔌 STOMP:', str);
          },

          // Reconnect configuration
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,

          // Connection callbacks
          onConnect: () => {
            console.log('✅ STOMP conectado');
            this.isConnecting = false;
            this.reconnectAttempts = 0;

            // Subscribe to game topic
            this.subscribeToGameTopic();

            resolve();
          },

          onStompError: (frame) => {
            console.error('❌ STOMP error:', frame);
            this.isConnecting = false;
            reject(new Error(frame.headers['message'] || 'STOMP connection error'));
          },

          onWebSocketClose: (event) => {
            console.log('🔌 WebSocket cerrado:', event.code, event.reason);
            this.isConnecting = false;

            // Attempt reconnect if not intentional closure
            if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.attemptReconnect();
            }
          },

          onWebSocketError: (error) => {
            console.error('❌ WebSocket error:', error);
            this.isConnecting = false;
          },
        });

        // Activate the client
        this.client.activate();
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to game topic
   */
  private subscribeToGameTopic(): void {
    if (!this.client || !this.client.connected) {
      console.error('Cannot subscribe: client not connected');
      return;
    }

    // ⬇️ CRITICAL FIX: Subscribe to ROOM topic for room events (player joined/left)
    console.log(`📡 Subscribing to /topic/room/${this.roomCode}`);
    this.client.subscribe(
      `/topic/room/${this.roomCode}`,
      (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body);
          console.log('📨 [ROOM EVENT] Mensaje recibido:', payload);

          // Convert STOMP message to GameEvent format
          const gameEvent: GameEvent = this.convertToGameEvent(payload);
          this.handleEvent(gameEvent);
        } catch (error) {
          console.error('Error parseando mensaje STOMP (room):', error);
        }
      }
    );

    // ⬇️ CRITICAL: Subscribe to GAME topic using roomCode (this is the sessionId for active games)
    console.log(`📡 ========== SUSCRIBIENDO A TOPIC DE JUEGO ==========`);
    console.log(`   🎯 Topic: /topic/game/${this.roomCode}`);
    this.subscription = this.client.subscribe(
      `/topic/game/${this.roomCode}`,
      (message: IMessage) => {
        try {
          console.log('📨 ========== MENSAJE RECIBIDO EN GAME TOPIC ==========');
          console.log('   📦 Raw message body:', message.body);
          const payload = JSON.parse(message.body);
          console.log('   📋 Payload parseado:', payload);
          console.log('   🏷️ Event type:', payload.eventType || payload.type);
          console.log('   📊 Data:', payload.data);

          // Convert STOMP message to GameEvent format
          const gameEvent: GameEvent = this.convertToGameEvent(payload);
          console.log('   ✨ GameEvent final:', gameEvent);
          console.log('   🎮 Llamando handleEvent...');
          this.handleEvent(gameEvent);
          console.log('✅ [GAME EVENT] Evento procesado correctamente');
        } catch (error) {
          console.error('❌ Error parseando mensaje STOMP (game):', error);
        }
      }
    );
    console.log(`✅ Suscrito a /topic/game/${this.roomCode}`);

    // ⬇️ CRITICAL: Subscribe to personal game state queue (includes player's hand)
    console.log(`📡 ========== SUSCRIBIENDO A COLA PERSONAL ==========`);
    console.log(`   🎯 Queue: /user/queue/game-state`);
    this.client.subscribe(`/user/queue/game-state`, (message: IMessage) => {
      try {
        console.log('🎴 ========== MENSAJE RECIBIDO EN COLA PERSONAL ==========');
        console.log('   📦 Raw message body:', message.body);
        const gameState = JSON.parse(message.body);
        console.log('   📋 Estado parseado:', gameState);
        console.log('   🃏 Hand:', gameState.hand);
        console.log('   📏 Hand size:', gameState.hand?.length);
        if (gameState.hand) {
          for (const card of gameState.hand) {
            console.log(`      - ${card.color} ${card.value} (${card.cardId})`);
          }
        }

        // Trigger GAME_STATE_UPDATE with personal data
        console.log('   🎮 Llamando handleEvent con GAME_STATE_UPDATE...');
        this.handleEvent({
          type: GameEventType.GAME_STATE_UPDATE,
          payload: gameState,
          timestamp: Date.now(),
        });
        console.log('✅ [PERSONAL STATE] Estado personal procesado correctamente');
      } catch (err) {
        console.error('❌ Error parseando estado personal:', err);
      }
    });
    console.log('✅ Suscrito a /user/queue/game-state');

    // Subscribe to personal notification queue (for kicked player, etc.)
    console.log(`📡 ========== SUSCRIBIENDO A COLA DE NOTIFICACIONES ==========`);
    console.log(`   🎯 Queue: /user/queue/notification`);
    this.client.subscribe(`/user/queue/notification`, (message: IMessage) => {
      try {
        console.log('🔔 ========== NOTIFICACIÓN PERSONAL RECIBIDA ==========');
        console.log('   📦 Raw message body:', message.body);
        const payload = JSON.parse(message.body);
        console.log('   📋 Payload parseado:', payload);
        console.log('   🏷️ Event type:', payload.eventType || payload.type);

        // Convert to GameEvent format and handle
        const gameEvent: GameEvent = this.convertToGameEvent(payload);
        console.log('   ✨ GameEvent final:', gameEvent);
        this.handleEvent(gameEvent);
        console.log('✅ [NOTIFICATION] Notificación procesada correctamente');
      } catch (err) {
        console.error('❌ Error parseando notificación personal:', err);
      }
    });
    console.log('✅ Suscrito a /user/queue/notification');

    // Also subscribe to error queue
    this.client.subscribe(`/user/queue/errors`, (message: IMessage) => {
      try {
        const error = JSON.parse(message.body);
        console.error('❌ Error del servidor:', error);
        this.handleEvent({
          type: GameEventType.ERROR,
          payload: error,
        });
      } catch (err) {
        console.error('Error parseando error message:', err);
      }
    });

    console.log('✅ Suscrito a los topics de sala, juego y cola personal');
  }

  /**
   * Convert backend STOMP message to GameEvent format
   */
  private convertToGameEvent(payload: any): GameEvent {
    // Backend sends messages with an "eventType" field (not "type")
    const type = (payload.eventType || payload.type) as GameEventType;

    console.log('🔄 convertToGameEvent:');
    console.log('  📥 Payload recibido:', payload);
    console.log('  🏷️ eventType detectado:', type);
    console.log('  📦 data extraída:', payload.data || payload);

    const gameEvent = {
      type: type || GameEventType.GAME_STATE_UPDATE,
      payload: payload.data || payload,
      timestamp: payload.timestamp || Date.now(),
    };

    console.log('  ✨ GameEvent creado:', gameEvent);

    return gameEvent;
  }

  /**
   * Intentar reconexión automática
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = 2000 * this.reconnectAttempts;

    console.log(
      `🔄 Reintentando conexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Error en reconexión:', error);
      });
    }, delay);
  }

  /**
   * Send message to server using STOMP
   */
  private send(destination: string, body: any): void {
    if (this.client && this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.warn('STOMP client no está conectado');
    }
  }

  /**
   * Manejar eventos recibidos
   */
  private handleEvent(event: GameEvent): void {
    // CRITICAL: Log all events for debugging
    console.log('🎬 handleEvent llamado');
    console.log('  📋 Event type:', event.type);
    console.log('  📦 Event payload:', event.payload);
    console.log('  ⏰ Event timestamp:', event.timestamp);

    // Llamar callbacks específicos del tipo de evento
    const typeCallbacks = this.eventCallbacks.get(event.type);
    if (typeCallbacks) {
      console.log(`  ✅ Ejecutando ${typeCallbacks.size} callbacks para tipo: ${event.type}`);
      typeCallbacks.forEach((callback) => callback(event));
    } else {
      console.log(`  ⚠️ No hay callbacks registrados para tipo: ${event.type}`);
    }

    // Llamar callbacks generales (escuchan todos los eventos)
    const allCallbacks = this.eventCallbacks.get('ALL');
    if (allCallbacks) {
      console.log(`  ✅ Ejecutando ${allCallbacks.size} callbacks generales`);
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
    this.send(`/app/game/${this.roomCode}/play-card`, {
      cardId,
      chosenColor,
    });
  }

  /**
   * Robar carta del mazo
   */
  drawCard(): void {
    this.send(`/app/game/${this.roomCode}/draw-card`, {});
  }

  /**
   * Call ONE
   */
  callUno(): void {
    this.send(`/app/game/${this.roomCode}/call-uno`, {});
  }

  /**
   * Catch player who didn't call ONE
   */
  catchUno(playerId: string): void {
    this.send(`/app/game/${this.roomCode}/catch-uno`, { playerId });
  }

  /**
   * Enviar mensaje de chat
   */
  sendMessage(message: string): void {
    this.send(`/app/game/${this.roomCode}/chat`, { message });
  }

  /**
   * Enviar emote
   */
  sendEmote(emoteId: string): void {
    this.send(`/app/game/${this.roomCode}/emote`, { emoteId });
  }

  /**
   * Notificar al servidor que el jugador se unió
   */
  notifyJoin(): void {
    this.send(`/app/game/${this.roomCode}/join`, {});
  }

  /**
   * Solicitar estado actual del juego
   */
  requestGameState(): void {
    this.send(`/app/game/${this.roomCode}/state`, {});
  }

  /**
   * Desconectar WebSocket
   */
  disconnect(): void {
    console.log('🔌 Desconectando STOMP');

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.eventCallbacks.clear();
  }

  /**
   * Verificar si está conectado
   */
  isConnected(): boolean {
    return this.client !== null && this.client.connected;
  }

  /**
   * Obtener estado de la conexión
   */
  getConnectionState(): 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED' {
    if (!this.client) return 'CLOSED';
    if (this.client.connected) return 'OPEN';
    if (this.isConnecting) return 'CONNECTING';
    return 'CLOSED';
  }
}

// Singleton para mantener una instancia por sesión
const wsInstances = new Map<string, WebSocketService>();

/**
 * Obtener o crear instancia de WebSocket para un roomCode
 */
export function getWebSocketService(roomCode: string, token?: string): WebSocketService {
  if (!wsInstances.has(roomCode)) {
    wsInstances.set(roomCode, new WebSocketService(roomCode, token));
  }
  return wsInstances.get(roomCode)!;
}

/**
 * Limpiar instancia de WebSocket
 */
export function cleanupWebSocketService(roomCode: string): void {
  const instance = wsInstances.get(roomCode);
  if (instance) {
    instance.disconnect();
    wsInstances.delete(roomCode);
  }
}

export default WebSocketService;