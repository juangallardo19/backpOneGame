"use client"

/**
 * OneGame3D - 3D Game Board Component (Backend Connected)
 * RF24-RF39: Gameplay with backend integration
 *
 * This component renders the game using GameContext (backend state)
 * instead of local game logic.
 *
 * Features:
 * - 3D card visualization
 * - Real-time game state from WebSocket
 * - Connected to GameContext for all actions
 * - Chat integration (LEFT)
 * - Player stats table (LEFT)
 * - ONE button (RIGHT)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Users } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import GameChat from './GameChat';
import GameResultsModal from './GameResultsModal';
import HalftoneWaves from './halftone-waves';
import { Card, Player, CurrentPlayer, isWildCard } from '@/types/game.types';

interface OneGame3DProps {
  onBack?: () => void;
}

export default function OneGame3D({ onBack }: OneGame3DProps) {
  const router = useRouter();
  const { gameState, playCard, drawCard, callUno, gameResults, clearGameResults } = useGame();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [perspective, setPerspective] = useState(false); // Desactivada por defecto para probar

  // Get current player from gameState
  const currentPlayer: CurrentPlayer | null | undefined = gameState?.currentPlayer;
  // Use the isMyTurn function from context
  const isMyTurn = useGame().isMyTurn();

  // Check if current turn player is a bot
  const currentTurnPlayer = gameState?.players?.find(p => p.id === gameState?.currentTurnPlayerId);
  const isBotTurn = currentTurnPlayer?.isBot || false;

  // Check if player should call ONE
  // Player should call UNO when they have 2 cards (BEFORE playing the penultimate card)
  const shouldCallUno = currentPlayer && currentPlayer.hand.length === 2 && !currentPlayer.calledOne;

  // RF24-RF39: Handle card play
  const handlePlayCard = async (cardId: string) => {
    if (!isMyTurn) {
      showError("Not your turn", "Wait for your turn to play");
      return;
    }

    const card = currentPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    // CRITICAL: Check if player needs to call UNO first
    // If player has 2 cards and hasn't called UNO, they must call it BEFORE playing
    if (currentPlayer && currentPlayer.hand.length === 2 && !currentPlayer.calledOne) {
      showError("¡Debes gritar UNO!", "Presiona el botón UNO antes de jugar tu penúltima carta");
      return;
    }

    // If it's a wild card (RF26: Choose color after wild)
    // This includes both WILD and WILD_DRAW_FOUR (+4)
    if (isWildCard(card)) {
      console.log('Wild card detected, showing color picker:', card);
      setSelectedCardId(cardId);
      setShowColorPicker(true);
      return;
    }

    try {
      // RF27: Validate card can be played (backend will validate)
      // RF31: Play special card
      await playCard(cardId);
      const cardDisplay = getCardSymbol(card);
      success("Card played", `Played ${card.color} ${cardDisplay}`);
      setSelectedCardId(null);
    } catch (error: any) {
      showError("Cannot play card", error.message || "Invalid move");
    }
  };

  // RF26: Choose color for wild cards
  const handleChooseColor = async (color: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE') => {
    if (!selectedCardId) return;

    // CRITICAL: Check if player needs to call UNO first (same validation as handlePlayCard)
    if (currentPlayer && currentPlayer.hand.length === 2 && !currentPlayer.calledOne) {
      showError("¡Debes gritar UNO!", "Presiona el botón UNO antes de jugar tu penúltima carta");
      setShowColorPicker(false);
      setSelectedCardId(null);
      return;
    }

    try {
      await playCard(selectedCardId, color);
      success("Card played", `Chose ${color}`);
      setSelectedCardId(null);
      setShowColorPicker(false);
    } catch (error: any) {
      showError("Error", error.message || "Could not play card");
    }
  };

  // RF24-RF39: Handle draw card
  const handleDrawCard = async () => {
    if (!isMyTurn) {
      showError("Not your turn", "Wait for your turn to draw");
      return;
    }

    try {
      await drawCard();
      success("Card drawn", "You drew a card");
    } catch (error: any) {
      showError("Error", error.message || "Could not draw card");
    }
  };

  // RF32: Call ONE!
  const handleCallOne = async () => {
    try {
      await callUno();
      success("ONE!", "You called ONE!");
    } catch (error: any) {
      showError("Error", error.message || "Could not call ONE");
    }
  };

  // Handle close game results modal
  const handleCloseGameResults = () => {
    clearGameResults();
    // IMPORTANT: Don't call onBack() here - that would disconnect and leave the room
    // When game ends, backend resets room to WAITING state
    // Player should stay in the room to play again
    // Navigate back to room lobby to start a new game
    router.push('/room');
  };

  // Get card color class
  const getCardColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'card-red';
      case 'YELLOW': return 'card-yellow';
      case 'GREEN': return 'card-green';
      case 'BLUE': return 'card-blue';
      case 'WILD': return 'card-wild';
      default: return '';
    }
  };

  // Get card symbol based on type
  const getCardSymbol = (card: Card) => {
    switch (card.type) {
      case 'SKIP':
        return '⊘';
      case 'REVERSE':
        return '⇄';
      case 'DRAW_TWO':
        return '+2';
      case 'WILD':
        return 'W';
      case 'WILD_DRAW_FOUR':
        return '+4';
      case 'NUMBER':
        return card.value !== null && card.value !== undefined ? card.value.toString() : '?';
      default:
        return card.value !== null && card.value !== undefined ? card.value.toString() : '?';
    }
  };

  // Helper to check if card can be played
  const canPlayCard = (card: Card) => {
    if (!gameState?.topCard) return true;

    const topCard = gameState.topCard;
    const stackActive = (gameState?.stackingCount ?? 0) > 0;

    // STACKING LOGIC: If there's an active stack (+2 or +4), only +2/+4 cards can be played
    if (stackActive) {
      // Only DRAW_TWO (+2) or WILD_DRAW_FOUR (+4) can be played during stack
      return card.type === 'DRAW_TWO' || card.type === 'WILD_DRAW_FOUR';
    }

    // NORMAL LOGIC: No stack active, regular UNO rules apply

    // Wild cards always playable
    if (card.color === 'WILD' || card.type === 'WILD') {
      return true;
    }

    // Same color
    if (card.color === topCard.color) {
      return true;
    }

    // Same value (ONLY for NUMBER cards to avoid null === null)
    // Special cards have value: null, so we must check type first
    if (card.type === 'NUMBER' && topCard.type === 'NUMBER' && card.value === topCard.value) {
      return true;
    }

    // Same type (for special cards only: SKIP on SKIP, REVERSE on REVERSE, etc.)
    if (card.type === topCard.type && card.type !== 'NUMBER') {
      return true;
    }

    return false;
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="game-loading">
        <div className="halftone-background">
          <HalftoneWaves animate={true} isMyTurn={true} />
        </div>
        <div className="spinner"></div>
        <p>Cargando juego...</p>
      </div>
    );
  }

  // Get other players by position
  const otherPlayers = gameState.players?.filter(p => p.id !== currentPlayer?.id) || [];
  const topPlayer = otherPlayers[0];
  const leftPlayer = otherPlayers[1];
  const rightPlayer = otherPlayers[2];

  // Check if there's an active stack
  const stackActive = (gameState?.stackingCount ?? 0) > 0;
  const totalCardsToDrawu = (gameState?.stackingCount ?? 0) * 2;

  return (
    <div className="game-container">
      {/* Halftone Waves Background - Always animated, brightness changes with turn */}
      <div className="halftone-background">
        <HalftoneWaves animate={true} isMyTurn={isMyTurn} />
      </div>

      {/* Top Bar - Leave Game Button */}
      <div className="top-bar">
        <button className="leave-game-button" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Abandonar Juego</span>
        </button>
      </div>

      {/* Stack Alert - Shows when +2/+4 stacking is active */}
      {stackActive && isMyTurn && (
        <div className="stack-alert">
          <div className="stack-alert-content">
            <span className="stack-alert-icon">⚠️</span>
            <div className="stack-alert-text">
              <strong>¡Stack Activo!</strong>
              <p>Juega un +2 o +4 para sumar, o roba {totalCardsToDrawu} cartas</p>
            </div>
          </div>
        </div>
      )}

      <div className="game-layout">
        {/* Left Sidebar */}
        <aside className="left-sidebar">
          {/* Players Panel */}
          <div className="panel players-panel">
            <div className="panel-header">
              <Users size={18} />
              <h3>Jugadores</h3>
            </div>
            <div className="players-list">
              {gameState.players?.map((player) => (
                <div
                  key={player.id}
                  className={`player-item ${gameState.currentTurnPlayerId === player.id ? 'active' : ''} ${player.id === currentPlayer?.id ? 'is-you' : ''}`}
                >
                  <div className="player-info">
                    <span className="player-name">
                      {player.nickname}
                      {player.id === currentPlayer?.id && ' (Tú)'}
                    </span>
                    <span className="player-cards">
                      {player.cardCount} {player.cardCount === 1 ? 'carta' : 'cartas'}
                      {player.calledOne && ' [¡UNO!]'}
                    </span>
                  </div>
                  {gameState.currentTurnPlayerId === player.id && (
                    <div className="turn-indicator">▶</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Game Board */}
        <main className={`game-board ${perspective ? 'perspective-3d' : ''}`}>
          <div className="game-table-wrapper">

            {/* Top Player */}
            {topPlayer && (
              <div className="table-section section-top">
                <div className="player-cards-area">
                  <p className="player-label-small">
                    {topPlayer.nickname} ({topPlayer.cardCount})
                    {topPlayer.calledOne && ' [ONE!]'}
                  </p>
                  <div className="cards-row">
                    {[...Array(Math.min(topPlayer.cardCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="game-card card-back card-small"
                        style={{
                          transform: `translateX(${(i - Math.floor(Math.min(topPlayer.cardCount, 5) / 2)) * 30}px)`,
                          zIndex: i
                        }}
                      >
                        <div className="card-border">
                          <div className="card-inner-back">
                            <div className="card-oval-back"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Left Player */}
            {leftPlayer && (
              <div className="table-section section-left">
                <div className="player-cards-area">
                  <p className="player-label-small">
                    {leftPlayer.nickname} ({leftPlayer.cardCount})
                    {leftPlayer.calledOne && ' [ONE!]'}
                  </p>
                  <div className="cards-column">
                    {[...Array(Math.min(leftPlayer.cardCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="game-card card-back card-small"
                        style={{
                          transform: `translateY(${(i - Math.floor(Math.min(leftPlayer.cardCount, 5) / 2)) * 30}px)`,
                          zIndex: i
                        }}
                      >
                        <div className="card-border">
                          <div className="card-inner-back">
                            <div className="card-oval-back"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Right Player */}
            {rightPlayer && (
              <div className="table-section section-right">
                <div className="player-cards-area">
                  <p className="player-label-small">
                    {rightPlayer.nickname} ({rightPlayer.cardCount})
                    {rightPlayer.calledOne && ' [ONE!]'}
                  </p>
                  <div className="cards-column">
                    {[...Array(Math.min(rightPlayer.cardCount, 5))].map((_, i) => (
                      <div
                        key={i}
                        className="game-card card-back card-small"
                        style={{
                          transform: `translateY(${(i - Math.floor(Math.min(rightPlayer.cardCount, 5) / 2)) * 30}px)`,
                          zIndex: i
                        }}
                      >
                        <div className="card-border">
                          <div className="card-inner-back">
                            <div className="card-oval-back"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Center - Piles */}
            <div className="table-section section-center">
              <div className="piles-container">

                {/* Draw Pile */}
                <div className="pile-area" onClick={isMyTurn ? handleDrawCard : undefined} style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
                  <div className="pile-stack">
                    <div className="game-card card-back card-medium pile-shadow"></div>
                    <div className="game-card card-back card-medium pile-shadow" style={{ transform: 'translate(2px, 2px)' }}></div>
                    <div className="game-card card-back card-medium pile-top">
                      <div className="card-border">
                        <div className="card-inner-back">
                          <div className="card-oval-back"></div>
                          <div className="pile-count">{gameState.drawPileCount}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(gameState?.stackingCount ?? 0) > 0 ? (
                    <p className="pile-text pile-text-stack">
                      Robar {(gameState?.stackingCount ?? 0) === 1 ? '+2' : `+${(gameState?.stackingCount ?? 0) * 2}`}
                    </p>
                  ) : (
                    <p className="pile-text">Robar</p>
                  )}
                </div>

                {/* Discard Pile */}
                <div className="pile-area">
                  <div className="pile-stack">
                    {gameState.topCard && (
                      <>
                        <div className={`game-card card-medium pile-shadow ${getCardColorClass(gameState.topCard.color)}`}></div>
                        <div className={`game-card card-medium pile-shadow ${getCardColorClass(gameState.topCard.color)}`} style={{ transform: 'translate(2px, 2px)' }}></div>
                        <div className={`game-card card-medium pile-top ${getCardColorClass(gameState.topCard.color)}`}>
                          <div className="card-border-white">
                            <div className="card-inner-color">
                              <div className="card-corner top-left">{getCardSymbol(gameState.topCard)}</div>
                              <div className="card-center-value">{getCardSymbol(gameState.topCard)}</div>
                              <div className="card-corner bottom-right">{getCardSymbol(gameState.topCard)}</div>
                              <div className="card-oval-color"></div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="pile-text">Descartar</p>
                </div>

              </div>
            </div>

            {/* Bottom Player (You) */}
            <div className="table-section section-bottom">
              <div className="your-hand-area">
                <p className="player-label-small">Tu Mano ({currentPlayer?.hand.length || 0})</p>
                <div className="your-cards-row">
                  {currentPlayer?.hand.map((card, index) => {
                    // Solo puede jugar si: 1) Es tu turno Y 2) La carta es válida
                    const canPlay = isMyTurn && canPlayCard(card);
                    const totalCards = currentPlayer.hand.length;
                    const center = (totalCards - 1) / 2;
                    const offset = (index - center) * 60; // Separación de 60px
                    const rotation = (index - center) * 3;
                    // Z-index: las cartas del centro tienen el MAYOR z-index
                    const distanceFromCenter = Math.abs(index - center);
                    const baseZIndex = 50 - Math.floor(distanceFromCenter * 2);

                    return (
                      <div
                        key={card.id}
                        className={`game-card card-medium ${getCardColorClass(card.color)} ${
                          canPlay ? 'card-playable' : 'card-disabled'
                        } ${selectedCardId === card.id ? 'card-selected' : ''}`}
                        style={{
                          transform: `translateX(${offset}px) rotate(${rotation}deg)`,
                          zIndex: selectedCardId === card.id ? 100 : baseZIndex,
                          ['--card-x' as any]: `${offset}px`,
                          ['--card-rotation' as any]: `${rotation}deg`,
                          pointerEvents: 'auto'
                        }}
                        onClick={(e) => {
                          console.log('Card clicked:', index, card.id, 'canPlay:', canPlay, 'isMyTurn:', isMyTurn);
                          if (canPlay) {
                            handlePlayCard(card.id);
                          }
                        }}
                      >
                        <div className="card-border-white">
                          <div className="card-inner-color">
                            <div className="card-corner top-left">{getCardSymbol(card)}</div>
                            <div className="card-center-value">{getCardSymbol(card)}</div>
                            <div className="card-corner bottom-right">{getCardSymbol(card)}</div>
                            <div className="card-oval-color"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Right Sidebar - ONE Button */}
        <aside className="right-sidebar">
          {shouldCallUno && (
            <div className="uno-container">
              <div className="uno-alert">¡Grita UNO antes de jugar!</div>
              <button className="uno-button-image" onClick={handleCallOne}>
                <img
                  src="/uno-logo.png"
                  alt="UNO"
                  className="uno-logo-button"
                />
              </button>
              <div className="uno-hint">¡Tienes 2 cartas!</div>
            </div>
          )}
        </aside>
      </div>

      {/* Independent Game Chat - Bottom Left */}
      <div className="independent-chat-container">
        <GameChat isMinimized={!showChat} onToggleMinimize={() => setShowChat(!showChat)} />
      </div>

      {/* Color Picker Modal (RF26) */}
      {showColorPicker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Elige un color</h3>
            <div className="color-options">
              {[
                { key: 'RED', label: 'Rojo' },
                { key: 'YELLOW', label: 'Amarillo' },
                { key: 'GREEN', label: 'Verde' },
                { key: 'BLUE', label: 'Azul' }
              ].map((color) => (
                <button
                  key={color.key}
                  className={`color-button color-${color.key.toLowerCase()}`}
                  onClick={() => handleChooseColor(color.key as any)}
                >
                  {color.label}
                </button>
              ))}
            </div>
            <button
              className="cancel-button"
              onClick={() => {
                setShowColorPicker(false);
                setSelectedCardId(null);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .game-container {
          position: fixed;
          inset: 0;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          overflow: hidden;
        }

        /* Halftone Waves Background */
        .halftone-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        /* Ensure all children are above the halftone background */
        .game-container > *:not(.halftone-background):not(.modal-overlay) {
          position: relative;
          z-index: 1;
        }

        /* Top Bar */
        .top-bar {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 1rem;
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .leave-game-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .leave-game-button:hover {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateX(-3px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        /* Layout */
        .game-layout {
          display: grid;
          grid-template-columns: 280px 1fr 200px;
          height: calc(100vh - 70px);
          gap: 1rem;
          padding: 1rem;
        }

        /* Sidebars */
        .left-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          overflow-y: auto;
        }

        .panel {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
        }

        .players-panel {
          flex-shrink: 0;
        }

        .players-list {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }

        .player-item.active {
          background: rgba(76, 175, 80, 0.2);
          border-color: #4caf50;
          box-shadow: 0 0 15px rgba(76, 175, 80, 0.4);
        }

        .player-item.is-you {
          border-color: rgba(74, 222, 128, 0.5);
          background: rgba(74, 222, 128, 0.1);
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .player-cards {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .turn-indicator {
          color: #4ade80;
          font-size: 1.2rem;
          animation: pulse-arrow 1s infinite;
        }

        @keyframes pulse-arrow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }

        /* Independent Chat Container - Better visibility at bottom left */
        .independent-chat-container {
          position: fixed !important;
          bottom: 20px !important;
          left: 20px !important;
          right: auto !important;
          width: 380px !important;
          max-height: 500px !important;
          z-index: 150 !important;
        }

        /* Override GameChat internal styles */
        .independent-chat-container :global(.game-chat) {
          position: relative !important;
          bottom: auto !important;
          left: auto !important;
          right: auto !important;
          width: 100% !important;
          max-height: 100% !important;
          background: rgba(0, 0, 0, 0.9) !important;
          border-radius: 16px !important;
          border: 2px solid rgba(74, 222, 128, 0.5) !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 25px rgba(74, 222, 128, 0.3) !important;
          backdrop-filter: blur(15px) !important;
        }

        .independent-chat-container:hover :global(.game-chat) {
          border-color: rgba(74, 222, 128, 0.7) !important;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 35px rgba(74, 222, 128, 0.4) !important;
          transform: translateY(-2px);
        }

        /* Right Sidebar - UNO Button */
        .right-sidebar {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uno-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .uno-alert {
          background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          animation: flash 1s infinite;
          box-shadow: 0 4px 15px rgba(244, 67, 54, 0.5);
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .uno-button-wrapper {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.3s;
          animation: pulse-uno 1.5s infinite;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uno-button-wrapper:hover {
          transform: scale(1.1);
        }

        @keyframes pulse-uno {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 8px 25px rgba(245, 87, 108, 0.6));
          }
          50% {
            transform: scale(1.05);
            filter: drop-shadow(0 12px 35px rgba(245, 87, 108, 0.9));
          }
        }

        .uno-fallback {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: 4px solid white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(245, 87, 108, 0.6);
        }

        .uno-text {
          font-size: 3rem;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          line-height: 1;
        }

        .uno-hint {
          background: rgba(0, 0, 0, 0.7);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          text-align: center;
        }

        /* GAME BOARD */
        .game-board {
          position: relative;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .game-board.perspective-3d {
          perspective: 1000px;
        }

        .game-table-wrapper {
          width: 700px;
          height: 550px;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          grid-template-rows: 1fr 2fr 1fr;
          gap: 1rem;
          transform-style: preserve-3d;
        }

        .game-board.perspective-3d .game-table-wrapper {
          transform: rotateX(10deg);
        }

        /* Table Sections */
        .table-section {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .section-top {
          grid-column: 2;
          grid-row: 1;
        }

        .section-left {
          grid-column: 1;
          grid-row: 2;
        }

        .section-right {
          grid-column: 3;
          grid-row: 2;
        }

        .section-center {
          grid-column: 2;
          grid-row: 2;
          position: relative;
        }

        .section-bottom {
          grid-column: 2;
          grid-row: 3;
          overflow: visible;
        }

        /* Player Cards Areas */
        .player-cards-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .player-label-small {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          text-align: center;
        }

        .cards-row,
        .cards-column {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cards-row {
          height: 5em;
          width: 10em;
        }

        .cards-column {
          width: 4em;
          height: 10em;
          flex-direction: column;
        }

        /* Cards */
        .game-card {
          position: absolute;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .card-small {
          width: 3.5em;
          height: 5.4em;
        }

        .card-medium {
          width: 4.5em;
          height: 6.9em;
        }

        .card-border,
        .card-border-white {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 0.6em;
          padding: 0.2em;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        /* Card Back */
        .card-back .card-border {
          background: white;
        }

        .card-inner-back {
          width: 100%;
          height: 100%;
          background: #1a1a1a;
          border-radius: 0.4em;
          position: relative;
          overflow: hidden;
        }

        .card-oval-back {
          position: absolute;
          width: 70%;
          height: 75%;
          background: #dc251c;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(12deg);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        }

        /* Card Colors */
        .card-inner-color {
          width: 100%;
          height: 100%;
          border-radius: 0.4em;
          position: relative;
          overflow: hidden;
        }

        .card-red .card-inner-color {
          background: linear-gradient(135deg, #dc251c 0%, #ff4444 100%);
          color: white;
        }

        .card-yellow .card-inner-color {
          background: linear-gradient(135deg, #fcf604 0%, #ffed4e 100%);
          color: #333;
        }

        .card-blue .card-inner-color {
          background: linear-gradient(135deg, #0493de 0%, #3ab0ff 100%);
          color: white;
        }

        .card-green .card-inner-color {
          background: linear-gradient(135deg, #018d41 0%, #00c853 100%);
          color: white;
        }

        .card-wild .card-inner-color {
          background: linear-gradient(135deg, #1f1b18 0%, #333 50%, #1f1b18 100%);
          color: white;
        }

        .card-oval-color {
          position: absolute;
          width: 85%;
          height: 75%;
          background: white;
          opacity: 0.25;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(12deg);
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
        }

        .card-corner {
          position: absolute;
          font-size: 0.7em;
          font-weight: 800;
        }

        .card-corner.top-left {
          top: 0.3em;
          left: 0.3em;
        }

        .card-corner.bottom-right {
          bottom: 0.3em;
          right: 0.3em;
          transform: rotate(180deg);
        }

        .card-center-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 2.5em;
          font-weight: 900;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          z-index: 5;
        }

        /* Piles */
        .piles-container {
          display: flex;
          gap: 3em;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .pile-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .pile-stack {
          position: relative;
          width: 4.5em;
          height: 6.9em;
        }

        .pile-shadow {
          position: absolute;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 0.6em;
        }

        .pile-top {
          position: absolute;
          z-index: 10;
        }

        .pile-top:hover {
          transform: translateY(-0.5em);
        }

        .pile-count {
          position: absolute;
          bottom: 0.4em;
          right: 0.4em;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.2em 0.5em;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.75em;
          z-index: 15;
        }

        .pile-text {
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
        }

        /* Your Hand */
        .your-hand-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          overflow: visible;
        }

        .your-cards-row {
          position: relative;
          height: 10em;
          width: 100%;
          min-width: 40em;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .game-card {
          pointer-events: auto;
        }

        .card-playable {
          cursor: pointer;
          pointer-events: all !important;
          filter: brightness(1.2);
        }

        .card-playable:hover {
          z-index: 1000 !important;
          filter: drop-shadow(0 6px 15px rgba(76, 175, 80, 0.7)) brightness(1.3);
        }

        .card-selected {
          transform: translateX(var(--card-x, 0)) translateY(-2.5em) rotate(var(--card-rotation, 0)) scale(1.08) !important;
          filter: drop-shadow(0 8px 18px rgba(59, 130, 246, 0.8)) brightness(1.2);
          z-index: 999 !important;
        }

        .card-selected .card-border-white {
          box-shadow: 0 0 0 3px #3b82f6;
        }

        .card-disabled {
          filter: brightness(0.4) grayscale(0.3);
          cursor: not-allowed;
          pointer-events: none !important;
          opacity: 0.7;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999 !important;
          backdrop-filter: blur(5px);
          pointer-events: auto !important;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.2);
          min-width: 320px;
          position: relative;
          z-index: 10000 !important;
        }

        .modal-content h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          text-align: center;
        }

        .color-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .color-button {
          padding: 1.5rem;
          border: 3px solid white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          color: white;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
          pointer-events: auto !important;
          position: relative;
          z-index: 10001;
        }

        .color-button:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
        }

        .color-button.color-red {
          background: linear-gradient(135deg, #dc251c 0%, #ff4444 100%);
        }

        .color-button.color-yellow {
          background: linear-gradient(135deg, #fcf604 0%, #ffed4e 100%);
          color: #333;
        }

        .color-button.color-green {
          background: linear-gradient(135deg, #018d41 0%, #00c853 100%);
        }

        .color-button.color-blue {
          background: linear-gradient(135deg, #0493de 0%, #3ab0ff 100%);
        }

        .cancel-button {
          width: 100%;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          pointer-events: auto !important;
          position: relative;
          z-index: 10001;
        }

        .cancel-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* Loading State */
        .game-loading {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          overflow: hidden;
        }

        .game-loading > *:not(.halftone-background) {
          position: relative;
          z-index: 1;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .game-layout {
            grid-template-columns: 250px 1fr 180px;
          }
        }
      `}</style>

      {/* Game Results Modal */}
      {gameResults && (
        <GameResultsModal
          results={gameResults}
          onClose={handleCloseGameResults}
        />
      )}
    </div>
  );
}
