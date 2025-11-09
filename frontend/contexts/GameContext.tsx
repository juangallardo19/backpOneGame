'use client';

/**
 * GameContext - Maneja el estado global del juego y WebSocket
 * Este contexto sincroniza el estado del juego con el backend en tiempo real
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService, GameEventType, getWebSocketService, cleanupWebSocketService } from '@/services/websocket.service';
import { GameState, Player, Card, Room, ChatMessage, GameMove, GameStatus, Direction, PlayerStatus } from '@/types/game.types';

// ============================================
// INTERFACES
// ============================================

interface GameContextValue {
  // Estado del juego
  gameState: GameState | null;
  room: Room | null;
  sessionId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // Chat y mensajes
  chatMessages: ChatMessage[];
  gameMoves: GameMove[];

  // Acciones del juego
  playCard: (cardId: string, chosenColor?: string) => void;
  drawCard: () => void;
  callUno: () => void;
  catchUno: (playerId: string) => void;

  // Acciones de chat
  sendMessage: (message: string) => void;
  sendEmote: (emoteId: string) => void;

  // Gestión de conexión
  connectToGame: (sessionId: string, token?: string) => Promise<void>;
  disconnectFromGame: () => void;
  requestGameState: () => void;

  // Utilidades
  isMyTurn: () => boolean;
  canPlayCardId: (cardId: string) => boolean;
  getPlayerById: (playerId: string) => Player | null;
}

// ============================================
// CONTEXT
// ============================================

const GameContext = createContext<GameContextValue | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame debe usarse dentro de un GameProvider');
  }
  return context;
};

// ============================================
// PROVIDER
// ============================================

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Estado
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameMoves, setGameMoves] = useState<GameMove[]>([]);

  // Referencia al servicio WebSocket
  const wsServiceRef = useRef<WebSocketService | null>(null);

  // ============================================
  // TRANSFORM BACKEND DATA
  // ============================================

  /**
   * Transform backend GameStateResponse to frontend GameState format
   */
  const transformBackendGameState = useCallback((backendState: any): GameState | null => {
    if (!backendState) return null;

    console.log('🔄 Transformando estado del backend:', backendState);

    // Map backend hand to frontend cards
    const hand: Card[] = (backendState.hand || []).map((card: any) => ({
      id: card.cardId,
      color: card.color,
      type: card.type,
      value: card.value,
    }));

    // Map backend players to frontend players
    const players: Player[] = (backendState.players || []).map((p: any) => ({
      id: p.playerId,
      nickname: p.nickname,
      userEmail: '', // Not sent by backend in game state
      isBot: p.isBot || false,
      status: PlayerStatus.ACTIVE,
      cardCount: p.cardCount || 0,
      hasCalledUno: p.calledOne || false,
    }));

    // Find current player from hand data
    const currentPlayerId = backendState.currentPlayerId;
    const currentPlayerData = players.find(p => p.id === currentPlayerId);

    const currentPlayer: Player | null = hand.length > 0 ? {
      ...currentPlayerData!,
      hand,
    } as any : null;

    // Calculate playable cards (for now, allow all cards - backend should validate)
    const playableCardIds = hand.map(card => card.id);

    // Map top card
    const topCard: Card | null = backendState.topCard ? {
      id: backendState.topCard.cardId,
      color: backendState.topCard.color,
      type: backendState.topCard.type,
      value: backendState.topCard.value,
    } : null;

    const transformed: GameState = {
      sessionId: backendState.sessionId,
      status: backendState.status || GameStatus.PLAYING,
      config: {
        maxPlayers: 4,
        pointsToWin: 500,
        turnTimeLimit: backendState.turnTimeLimit || 60,
        allowStackingDrawCards: true,
        preset: 'CLASSIC',
      },
      players,
      currentPlayer,
      currentTurnPlayerId: backendState.currentPlayerId,
      topCard,
      drawPileCount: backendState.deckSize || 0,
      discardPileCount: backendState.discardPileSize || 0,
      direction: backendState.direction === 'CLOCKWISE' ? Direction.CLOCKWISE : Direction.COUNTER_CLOCKWISE,
      winner: null,
      canDraw: true,
      canPlay: true,
      playableCardIds,
    };

    console.log('✅ Estado transformado:', transformed);
    return transformed;
  }, []);

  // ============================================
  // HANDLERS DE EVENTOS WEBSOCKET
  // ============================================

  const handleGameStateUpdate = useCallback((payload: any) => {
    console.log('🎮 Estado del juego actualizado:', payload);

    // Transform backend response to frontend GameState format
    const transformedState = transformBackendGameState(payload);
    setGameState(transformedState);
    setError(null);
  }, []);

  const handlePlayerJoined = useCallback((payload: any) => {
    console.log('👤 Jugador se unió:', payload);

    // CRITICAL: Update room state with new player
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;

      // Check if player already exists
      const existingPlayer = prevRoom.players.find(p => p.id === payload.playerId);
      if (existingPlayer) {
        console.log('⚠️ Player already in room, skipping');
        return prevRoom;
      }

      // Add new player to room
      const newPlayer: Player = {
        id: payload.playerId,
        nickname: payload.nickname,
        userEmail: payload.userEmail || '',
        isBot: payload.isBot || false,
        status: PlayerStatus.ACTIVE,
        cardCount: 0,
        hasCalledUno: false,
      };

      console.log('✅ Adding player to room:', newPlayer);

      return {
        ...prevRoom,
        players: [...prevRoom.players, newPlayer],
      };
    });
  }, []);

  const handlePlayerLeft = useCallback((payload: any) => {
    console.log('👋 Jugador salió:', payload);

    // CRITICAL: Update room state by removing player
    setRoom(prevRoom => {
      if (!prevRoom) return prevRoom;

      return {
        ...prevRoom,
        players: prevRoom.players.filter(p => p.id !== payload.playerId),
      };
    });
  }, []);

  const handleGameStarted = useCallback((payload: any) => {
    console.log('🎯 Juego iniciado:', payload);

    // If payload contains full game state, use it
    if (payload && payload.gameId) {
      setGameState(payload);
    } else {
      // Otherwise, just update status and request full state
      setGameState(prev => prev ? { ...prev, status: GameStatus.PLAYING } : null);

      // Request full game state after game starts
      if (wsServiceRef.current?.isConnected()) {
        setTimeout(() => {
          wsServiceRef.current?.requestGameState();
        }, 200);
      }
    }
  }, []);

  const handleGameEnded = useCallback((payload: any) => {
    console.log('🏆 Juego terminado:', payload);
    setGameState(prev => prev ? { ...prev, status: GameStatus.GAME_OVER, winner: payload.winner } : null);
  }, []);

  const handleCardPlayed = useCallback((payload: any) => {
    console.log('🃏 Carta jugada:', payload);

    // Agregar al historial de movimientos
    const move: GameMove = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname || 'Jugador',
      type: 'PLAY_CARD',
      card: payload.card,
      timestamp: Date.now(),
    };
    setGameMoves(prev => [...prev, move]);
  }, []);

  const handleCardDrawn = useCallback((payload: any) => {
    console.log('📥 Carta robada:', payload);

    const move: GameMove = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname || 'Jugador',
      type: 'DRAW_CARD',
      timestamp: Date.now(),
    };
    setGameMoves(prev => [...prev, move]);
  }, []);

  const handleTurnChanged = useCallback((payload: any) => {
    console.log('🔄 Turno cambiado:', payload);
    setGameState(prev => prev ? { ...prev, currentTurnPlayerId: payload.currentPlayerId } : null);
  }, []);

  const handleUnoCall = useCallback((payload: any) => {
    console.log('🔔 UNO cantado:', payload);

    const move: GameMove = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname || 'Jugador',
      type: 'UNO_CALL',
      timestamp: Date.now(),
    };
    setGameMoves(prev => [...prev, move]);
  }, []);

  const handleUnoPenalty = useCallback((payload: any) => {
    console.log('⚠️ Penalización UNO:', payload);

    const move: GameMove = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname || 'Jugador',
      type: 'UNO_PENALTY',
      timestamp: Date.now(),
    };
    setGameMoves(prev => [...prev, move]);
  }, []);

  const handleDirectionReversed = useCallback((payload: any) => {
    console.log('↩️ Dirección invertida');
    setGameState(prev => prev ? {
      ...prev,
      direction: prev.direction === Direction.CLOCKWISE ? Direction.COUNTER_CLOCKWISE : Direction.CLOCKWISE
    } : null);
  }, []);

  const handleColorChanged = useCallback((payload: any) => {
    console.log('🎨 Color cambiado:', payload.color);
  }, []);

  const handleMessageReceived = useCallback((payload: any) => {
    console.log('💬 Mensaje recibido:', payload);

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname,
      message: payload.message,
      timestamp: Date.now(),
      type: 'MESSAGE',
    };
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleEmoteReceived = useCallback((payload: any) => {
    console.log('😀 Emote recibido:', payload);

    const message: ChatMessage = {
      id: Date.now().toString(),
      playerId: payload.playerId,
      playerNickname: payload.playerNickname,
      message: payload.emoteId,
      timestamp: Date.now(),
      type: 'EMOTE',
    };
    setChatMessages(prev => [...prev, message]);
  }, []);

  const handleError = useCallback((payload: any) => {
    console.error('❌ Error del juego:', payload);
    setError(payload.message || 'Error desconocido');
  }, []);

  // ============================================
  // FUNCIONES DE CONEXIÓN
  // ============================================

  const connectToGame = useCallback(async (newSessionId: string, token?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🎮 Conectando al juego:', newSessionId);

      // Desconectar sesión anterior si existe
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }

      // Obtener estado del juego desde el backend ANTES de conectar WebSocket
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oneonlinebackend-production.up.railway.app'}/api/game/${newSessionId}/state`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('uno_auth_token')}`
          }
        });

        if (response.ok) {
          const gameStateData = await response.json();
          console.log('📡 Estado del juego obtenido:', gameStateData);

          // Transform and set the game state
          const transformedState = transformBackendGameState(gameStateData);
          setGameState(transformedState);

          // Also try to get room data
          const roomData = gameStateData.room || {};
          console.log('📡 Información de sala:', roomData);

          // Map players from backend PlayerInfo to frontend Player format
          const players = (roomData.players || []).map((p: any) => ({
            id: p.playerId,
            nickname: p.nickname,
            userEmail: p.userEmail || '',
            isBot: p.isBot || false,
            status: p.status || PlayerStatus.ACTIVE,
            cardCount: 0,
            hasCalledUno: false,
          }));

          console.log('👥 Jugadores mapeados:', players);

          // Convertir RoomResponse a Room format
          setRoom({
            code: roomData.roomCode,
            name: roomData.roomName || `Sala ${roomData.roomCode}`,
            leaderId: roomData.hostId,
            isPrivate: roomData.isPrivate || false,
            status: roomData.status || 'WAITING',
            players: players, // NOW we map the players correctly!
            maxPlayers: roomData.maxPlayers || 4,
            config: {
              maxPlayers: roomData.maxPlayers || 4,
              pointsToWin: roomData.config?.pointsToWin || 500,
              turnTimeLimit: roomData.config?.turnTimeLimit || 60,
              allowStackingDrawCards: roomData.config?.allowStackingCards || true,
              preset: 'CLASSIC'
            },
            createdAt: roomData.createdAt ? new Date(roomData.createdAt).toISOString() : new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('⚠️ No se pudo obtener info de sala, continuando...', err);
      }

      // Crear nueva instancia de WebSocket
      const wsService = getWebSocketService(newSessionId, token);
      wsServiceRef.current = wsService;
      setSessionId(newSessionId);

      // Suscribirse a eventos
      wsService.on(GameEventType.GAME_STATE_UPDATE, (event) => handleGameStateUpdate(event.payload));
      wsService.on(GameEventType.PLAYER_JOINED, (event) => handlePlayerJoined(event.payload));
      wsService.on(GameEventType.PLAYER_LEFT, (event) => handlePlayerLeft(event.payload));
      wsService.on(GameEventType.GAME_STARTED, (event) => handleGameStarted(event.payload));
      wsService.on(GameEventType.GAME_ENDED, (event) => handleGameEnded(event.payload));
      wsService.on(GameEventType.CARD_PLAYED, (event) => handleCardPlayed(event.payload));
      wsService.on(GameEventType.CARD_DRAWN, (event) => handleCardDrawn(event.payload));
      wsService.on(GameEventType.TURN_CHANGED, (event) => handleTurnChanged(event.payload));
      wsService.on(GameEventType.ONE_CALLED, (event) => handleUnoCall(event.payload));
      wsService.on(GameEventType.ONE_PENALTY, (event) => handleUnoPenalty(event.payload));
      wsService.on(GameEventType.DIRECTION_REVERSED, (event) => handleDirectionReversed(event.payload));
      wsService.on(GameEventType.COLOR_CHANGED, (event) => handleColorChanged(event.payload));
      wsService.on(GameEventType.MESSAGE_RECEIVED, (event) => handleMessageReceived(event.payload));
      wsService.on(GameEventType.EMOTE_RECEIVED, (event) => handleEmoteReceived(event.payload));
      wsService.on(GameEventType.ERROR, (event) => handleError(event.payload));

      // Conectar
      await wsService.connect();
      setIsConnected(true);

      // Notificar al servidor que nos unimos
      wsService.notifyJoin();

      // Solicitar estado inicial del juego
      setTimeout(() => {
        wsService.requestGameState();
      }, 500);

      console.log('✅ Conectado al juego exitosamente');
    } catch (error: any) {
      console.error('❌ Error conectando al juego:', error);
      setError(error.message || 'Error al conectar');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [
    transformBackendGameState,
    handleGameStateUpdate,
    handlePlayerJoined,
    handlePlayerLeft,
    handleGameStarted,
    handleGameEnded,
    handleCardPlayed,
    handleCardDrawn,
    handleTurnChanged,
    handleUnoCall,
    handleUnoPenalty,
    handleDirectionReversed,
    handleColorChanged,
    handleMessageReceived,
    handleEmoteReceived,
    handleError,
  ]);

  const disconnectFromGame = useCallback(() => {
    if (sessionId) {
      console.log('🔌 Desconectando del juego');
      cleanupWebSocketService(sessionId);
      wsServiceRef.current = null;
      setSessionId(null);
      setIsConnected(false);
      setGameState(null);
      setRoom(null);
      setChatMessages([]);
      setGameMoves([]);
    }
  }, [sessionId]);

  const requestGameState = useCallback(() => {
    if (wsServiceRef.current?.isConnected()) {
      wsServiceRef.current.requestGameState();
    }
  }, []);

  // ============================================
  // ACCIONES DEL JUEGO
  // ============================================

  const playCard = useCallback((cardId: string, chosenColor?: string) => {
    if (wsServiceRef.current?.isConnected()) {
      console.log('🃏 Jugando carta:', cardId, chosenColor);
      wsServiceRef.current.playCard(cardId, chosenColor);
    } else {
      console.warn('⚠️ No conectado al WebSocket');
    }
  }, []);

  const drawCard = useCallback(() => {
    if (wsServiceRef.current?.isConnected()) {
      console.log('📥 Robando carta');
      wsServiceRef.current.drawCard();
    } else {
      console.warn('⚠️ No conectado al WebSocket');
    }
  }, []);

  const callUno = useCallback(() => {
    if (wsServiceRef.current?.isConnected()) {
      console.log('🔔 Cantando UNO');
      wsServiceRef.current.callUno();
    } else {
      console.warn('⚠️ No conectado al WebSocket');
    }
  }, []);

  const catchUno = useCallback((playerId: string) => {
    if (wsServiceRef.current?.isConnected()) {
      console.log('⚠️ Atrapando UNO:', playerId);
      wsServiceRef.current.catchUno(playerId);
    } else {
      console.warn('⚠️ No conectado al WebSocket');
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsServiceRef.current?.isConnected()) {
      wsServiceRef.current.sendMessage(message);
    }
  }, []);

  const sendEmote = useCallback((emoteId: string) => {
    if (wsServiceRef.current?.isConnected()) {
      wsServiceRef.current.sendEmote(emoteId);
    }
  }, []);

  // ============================================
  // UTILIDADES
  // ============================================

  const isMyTurn = useCallback((): boolean => {
    if (!gameState || !gameState.currentPlayer) return false;
    return gameState.currentTurnPlayerId === gameState.currentPlayer.id;
  }, [gameState]);

  const canPlayCardId = useCallback((cardId: string): boolean => {
    if (!gameState) return false;
    return gameState.playableCardIds.includes(cardId);
  }, [gameState]);

  const getPlayerById = useCallback((playerId: string): Player | null => {
    if (!gameState) return null;
    return gameState.players.find(p => p.id === playerId) || null;
  }, [gameState]);

  // ============================================
  // CLEANUP
  // ============================================

  useEffect(() => {
    return () => {
      // Limpiar al desmontar
      if (sessionId) {
        cleanupWebSocketService(sessionId);
      }
    };
  }, [sessionId]);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: GameContextValue = {
    // Estado
    gameState,
    room,
    sessionId,
    isConnected,
    isLoading,
    error,
    chatMessages,
    gameMoves,

    // Acciones del juego
    playCard,
    drawCard,
    callUno,
    catchUno,

    // Acciones de chat
    sendMessage,
    sendEmote,

    // Gestión de conexión
    connectToGame,
    disconnectFromGame,
    requestGameState,

    // Utilidades
    isMyTurn,
    canPlayCardId,
    getPlayerById,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export default GameContext;
