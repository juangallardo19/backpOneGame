'use client';

/**
 * GameContext - Maneja el estado global del juego y WebSocket
 * Este contexto sincroniza el estado del juego con el backend en tiempo real
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { WebSocketService, GameEventType, getWebSocketService, cleanupWebSocketService } from '@/services/websocket.service';
import { GameState, Player, CurrentPlayer, Card, Room, ChatMessage, GameMove, GameStatus, Direction, PlayerStatus } from '@/types/game.types';

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
    if (!backendState) {
      console.error('❌ transformBackendGameState: backendState es null/undefined');
      return null;
    }

    console.log('🔄 Transformando estado del backend:', backendState);
    console.log('📋 Campos recibidos:', {
      sessionId: backendState.sessionId,
      status: backendState.status,
      hand: backendState.hand,
      handLength: backendState.hand?.length,
      players: backendState.players,
      playersCount: backendState.players?.length,
      currentPlayerId: backendState.currentPlayerId,
      topCard: backendState.topCard,
    });

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

    // Create currentPlayer with hand (required by CurrentPlayer type)
    // If we don't have hand data yet, use empty array
    const currentPlayer: CurrentPlayer | null = currentPlayerData ? {
      ...currentPlayerData,
      hand: hand || [],  // Always provide hand array, even if empty
    } as CurrentPlayer : null;

    console.log('👤 Current player detectado:', {
      currentPlayerId,
      hasHand: hand.length > 0,
      handSize: hand.length,
      currentPlayer
    });

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

  const handleGameStarted = useCallback(async (payload: any) => {
    console.log('🎯 GAME_STARTED evento recibido!');
    console.log('📦 Payload completo:', payload);
    console.log('🔍 Tipo de payload:', typeof payload);
    console.log('🔍 Keys del payload:', Object.keys(payload || {}));

    // CRITICAL: Extract sessionId from payload
    const newSessionId = payload.sessionId || payload.gameId;
    console.log('🆔 SessionId extraído del payload:', newSessionId);
    console.log('🆔 SessionId actual:', sessionId);

    if (!newSessionId) {
      console.error('❌ No se encontró sessionId en el payload de GAME_STARTED');
      return;
    }

    // Check if we're already connected to this game (leader already reconnected manually)
    if (sessionId === newSessionId) {
      console.log('✅ Ya estamos conectados a este juego, solo actualizando estado');
      // Just update game state to PLAYING
      setGameState(prev => {
        console.log('🔄 Actualizando gameState a PLAYING');
        const newState = prev ? { ...prev, status: GameStatus.PLAYING } : null;
        console.log('✨ Nuevo gameState:', newState);
        return newState;
      });
      return;
    }

    // CRITICAL: Reconnect to game WebSocket with sessionId
    // This is essential for non-leader players who are still connected to room WebSocket
    console.log('🔄 Reconectando al WebSocket del juego con sessionId:', newSessionId);

    try {
      // Get current token
      const currentToken = localStorage.getItem('uno_auth_token');

      // Disconnect from room WebSocket and reconnect to game WebSocket
      if (wsServiceRef.current) {
        console.log('🔌 Desconectando del WebSocket anterior...');
        wsServiceRef.current.disconnect();
      }

      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 300));

      // Reconnect to game WebSocket
      console.log('🔌 Reconectando al WebSocket del juego...');
      const wsService = getWebSocketService(newSessionId, currentToken || undefined);
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

      // Connect
      await wsService.connect();
      setIsConnected(true);

      // Notificar al servidor que nos unimos
      wsService.notifyJoin();

      console.log('✅ Reconectado al WebSocket del juego exitosamente');
    } catch (error) {
      console.error('❌ Error al reconectar al WebSocket del juego:', error);
    }

    // Update game status to PLAYING immediately
    // This triggers the redirect in GameRoomMenu for ALL players
    setGameState(prev => {
      console.log('🔄 Actualizando gameState anterior:', prev);
      const newState = prev ? { ...prev, status: GameStatus.PLAYING } : null;
      console.log('✨ Nuevo gameState:', newState);
      return newState;
    });

    // If payload contains full game state, use it
    if (payload && payload.sessionId) {
      console.log('📡 Payload contiene estado completo, transformando...');
      const transformedState = transformBackendGameState(payload);
      setGameState(transformedState);

      // CRITICAL FIX: Fetch room data using roomCode from payload
      const roomCode = payload.roomCode || newSessionId;
      console.log('🔑 Room code para obtener info de sala:', roomCode);

      if (roomCode) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oneonlinebackend-production.up.railway.app';
        const authToken = currentToken || localStorage.getItem('uno_auth_token');

        fetch(`${apiUrl}/api/rooms/${roomCode}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Failed to fetch room data');
          })
          .then(roomData => {
            console.log('✅ [GAME_STARTED] Información de sala obtenida:', roomData);

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

            console.log('👥 [GAME_STARTED] Jugadores mapeados:', players);

            // Convertir RoomResponse a Room format
            setRoom({
              code: roomData.roomCode,
              name: roomData.roomName || `Sala ${roomData.roomCode}`,
              leaderId: roomData.hostId,
              isPrivate: roomData.isPrivate || false,
              status: roomData.status || 'IN_GAME',
              players: players,
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
          })
          .catch(err => {
            console.error('❌ [GAME_STARTED] Error al obtener información de sala:', err);
          });
      }
    } else {
      console.log('⚠️ Payload NO contiene estado completo, solicitando...');
      // Request full game state after reconnecting
      setTimeout(() => {
        if (wsServiceRef.current?.isConnected()) {
          console.log('📡 Solicitando estado completo del juego...');
          wsServiceRef.current.requestGameState();
        }
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sessionId,
    transformBackendGameState,
    // Note: Other handlers are not in dependencies because they're captured as closures
    // when creating the new WebSocket service. Adding them would cause circular dependencies.
  ]);

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

      console.log('🎮 Conectando al juego/sala:', newSessionId);

      // Desconectar sesión anterior si existe
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }

      // Obtener estado desde el backend ANTES de conectar WebSocket
      // IMPORTANTE: Distinguir entre sala (pre-juego) y juego activo
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oneonlinebackend-production.up.railway.app';
        const authToken = token || localStorage.getItem('uno_auth_token');

        // Primero intentar obtener como SALA (pre-juego)
        const roomUrl = `${apiUrl}/api/rooms/${newSessionId}`;
        console.log('🏠 Intentando obtener sala:', roomUrl);
        console.log('🔑 Token:', authToken ? 'Presente' : 'No presente');

        const roomResponse = await fetch(roomUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        console.log('📊 Respuesta de sala:', {
          status: roomResponse.status,
          ok: roomResponse.ok,
          statusText: roomResponse.statusText
        });

        if (roomResponse.ok) {
          // Es una SALA (pre-juego)
          const roomData = await roomResponse.json();
          console.log('📡 Información de sala obtenida:', roomData);

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
            players: players,
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

          console.log('✅ Sala configurada correctamente en contexto');
        } else {
          // Si falla como sala, intentar como JUEGO ACTIVO
          console.log('ℹ️ No es sala, intentando como juego activo...');

          const gameUrl = `${apiUrl}/api/game/${newSessionId}/state`;
          console.log('🎮 Intentando obtener estado del juego:', gameUrl);

          const gameResponse = await fetch(gameUrl, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          console.log('📊 Respuesta del juego:', {
            status: gameResponse.status,
            ok: gameResponse.ok,
            statusText: gameResponse.statusText
          });

          if (gameResponse.ok) {
            const gameStateData = await gameResponse.json();
            console.log('📡 Estado del juego obtenido:', gameStateData);

            // Transform and set the game state
            const transformedState = transformBackendGameState(gameStateData);
            console.log('✨ Estado transformado final:', transformedState);
            setGameState(transformedState);

            // CRITICAL FIX: GameStateResponse only includes roomCode, not full room data
            // We need to fetch room data separately using the roomCode
            const roomCode = gameStateData.roomCode;
            console.log('🔑 Room code extraído del GameState:', roomCode);

            if (roomCode) {
              try {
                // Fetch full room data using roomCode
                const roomUrl = `${apiUrl}/api/rooms/${roomCode}`;
                console.log('🏠 Obteniendo información completa de la sala:', roomUrl);

                const roomResponse = await fetch(roomUrl, {
                  headers: {
                    'Authorization': `Bearer ${authToken}`
                  }
                });

                if (roomResponse.ok) {
                  const roomData = await roomResponse.json();
                  console.log('✅ Información de sala obtenida:', roomData);

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
                    status: roomData.status || 'IN_GAME',
                    players: players,
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
                } else {
                  console.error('❌ Error al obtener información de sala:', roomResponse.statusText);
                }
              } catch (err) {
                console.error('❌ Error al hacer fetch de sala:', err);
              }
            }
          } else {
            // Ambos fallaron - log error
            const errorText = await gameResponse.text();
            console.error('❌ Error al obtener estado (ni sala ni juego):', {
              status: gameResponse.status,
              statusText: gameResponse.statusText,
              error: errorText
            });
          }
        }
      } catch (err) {
        console.error('❌ Error en fetch de estado:', err);
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
    console.log('📤 GameContext.sendMessage llamado con:', message);
    if (wsServiceRef.current?.isConnected()) {
      console.log('✅ WebSocket conectado, enviando mensaje...');
      wsServiceRef.current.sendMessage(message);
    } else {
      console.warn('⚠️ WebSocket no conectado, no se puede enviar mensaje');
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
