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
 * - Chat integration
 * - Emotes support
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Hand, MessageCircle, Smile } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import GameChat from './GameChat';
import { Card, Player } from '@/types/game.types';

interface OneGame3DProps {
  onBack?: () => void;
}

export default function OneGame3D({ onBack }: OneGame3DProps) {
  const { gameState, playCard, drawCard, callUno, chatMessages } = useGame();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Get current player from gameState
  const currentPlayer = gameState?.players?.find(p => p.playerId === user?.id);
  const isMyTurn = gameState?.currentTurnPlayerId === user?.id;

  // RF24-RF39: Handle card play
  const handlePlayCard = async (cardId: string) => {
    if (!isMyTurn) {
      showError("Not your turn", "Wait for your turn to play");
      return;
    }

    const card = currentPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    // If it's a wild card (RF26: Choose color after wild)
    if (card.color === 'WILD') {
      setSelectedCardId(cardId);
      setShowColorPicker(true);
      return;
    }

    try {
      // RF27: Validate card can be played (backend will validate)
      // RF31: Play special card
      await playCard(cardId);
      success("Card played", `Played ${card.color} ${card.value}`);
      setSelectedCardId(null);
    } catch (error: any) {
      showError("Cannot play card", error.message || "Invalid move");
    }
  };

  // RF26: Choose color for wild cards
  const handleChooseColor = async (color: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE') => {
    if (!selectedCardId) return;

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

  // Loading state
  if (!gameState) {
    return (
      <div className="game-loading">
        <div className="spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <div className="one-game-3d">
      {/* Header */}
      <div className="game-header">
        <Button
          onClick={onBack}
          className="back-btn"
          variant="outline"
        >
          <ArrowLeft className="mr-2" size={18} />
          Leave Game
        </Button>

        <div className="game-info">
          <h2 className="game-title">🎴 ONE GAME 🎴</h2>
          <p className="game-status">
            {isMyTurn ? "🎯 Your Turn!" : `Waiting for ${gameState.currentPlayer?.nickname || "player"}...`}
          </p>
        </div>

        <div className="game-actions">
          {currentPlayer && currentPlayer.hand.length === 1 && (
            <Button
              onClick={handleCallOne}
              className="one-btn pulsing"
            >
              🎯 CALL ONE!
            </Button>
          )}
        </div>
      </div>

      {/* Game Board */}
      <div className="game-board">
        {/* Other Players */}
        <div className="other-players">
          {gameState.players
            ?.filter(p => p.playerId !== user?.id)
            .map((player, idx) => (
              <div key={player.playerId} className="player-card">
                <div className="player-info">
                  <span className="player-name">{player.nickname}</span>
                  <span className="player-cards">{player.cardCount} cards</span>
                </div>
                {gameState.currentTurnPlayerId === player.playerId && (
                  <div className="turn-indicator">🎯</div>
                )}
              </div>
            ))}
        </div>

        {/* Center - Top Card & Draw Pile */}
        <div className="center-area">
          <div className="draw-pile" onClick={isMyTurn ? handleDrawCard : undefined}>
            <div className="pile-card card-back">
              <div className="card-pattern">ONE</div>
              <div className="pile-count">{gameState.drawPileCount}</div>
            </div>
            {isMyTurn && <p className="draw-hint">Click to draw</p>}
          </div>

          <div className="discard-pile">
            {gameState.topCard && (
              <div className={`pile-card ${getCardColorClass(gameState.topCard.color)}`}>
                <div className="card-value">{gameState.topCard.value}</div>
                <div className="card-color">{gameState.topCard.color}</div>
              </div>
            )}
          </div>
        </div>

        {/* Current Player Hand */}
        <div className="player-hand">
          <div className="hand-title">Your Hand ({currentPlayer?.hand.length || 0} cards)</div>
          <div className="hand-cards">
            {currentPlayer?.hand.map((card) => {
              const canPlay = gameState.playableCardIds?.includes(card.id);

              return (
                <div
                  key={card.id}
                  className={`hand-card ${getCardColorClass(card.color)} ${
                    canPlay && isMyTurn ? 'playable' : 'disabled'
                  } ${selectedCardId === card.id ? 'selected' : ''}`}
                  onClick={() => canPlay && isMyTurn ? handlePlayCard(card.id) : null}
                >
                  <div className="card-value-small">{card.value}</div>
                  <div className="card-symbol">
                    {card.type === 'WILD' ? '🎨' : card.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Stats */}
        <div className="game-stats">
          <div className="stat">
            <span className="stat-label">Direction:</span>
            <span className="stat-value">{gameState.direction === 'CLOCKWISE' ? '🔄' : '🔃'}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Cards Left:</span>
            <span className="stat-value">{gameState.drawPileCount}</span>
          </div>
        </div>
      </div>

      {/* Color Picker Modal (RF26) */}
      {showColorPicker && (
        <div className="color-picker-modal">
          <div className="modal-content">
            <h3>Choose a color</h3>
            <div className="color-options">
              {['RED', 'YELLOW', 'GREEN', 'BLUE'].map((color) => (
                <button
                  key={color}
                  className={`color-btn color-btn-${color.toLowerCase()}`}
                  onClick={() => handleChooseColor(color as any)}
                >
                  {color}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowColorPicker(false);
                setSelectedCardId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Chat Component (RF45, RF49) */}
      <GameChat isMinimized={!showChat} onToggleMinimize={() => setShowChat(!showChat)} />

      <style jsx>{`
        .one-game-3d {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
          overflow: hidden;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .game-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
        }

        .game-status {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .one-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          font-weight: 700;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .one-btn.pulsing {
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .game-board {
          padding: 2rem;
          display: grid;
          grid-template-rows: auto 1fr auto auto;
          height: calc(100vh - 80px);
          gap: 1.5rem;
        }

        .other-players {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .player-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          position: relative;
        }

        .player-name {
          font-weight: 600;
          margin-right: 0.5rem;
        }

        .player-cards {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .turn-indicator {
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 1.5rem;
          animation: bounce 0.5s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .center-area {
          display: flex;
          gap: 3rem;
          justify-content: center;
          align-items: center;
        }

        .draw-pile, .discard-pile {
          position: relative;
        }

        .pile-card {
          width: 120px;
          height: 180px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          transition: transform 0.2s;
          cursor: pointer;
        }

        .pile-card:hover {
          transform: translateY(-5px);
        }

        .card-back {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .pile-count {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .draw-hint {
          text-align: center;
          margin-top: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }

        .card-red { background: linear-gradient(135deg, #ff6b6b 0%, #c92a2a 100%); color: white; }
        .card-yellow { background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%); color: #333; }
        .card-green { background: linear-gradient(135deg, #51cf66 0%, #2b8a3e 100%); color: white; }
        .card-blue { background: linear-gradient(135deg, #4dabf7 0%, #1971c2 100%); color: white; }
        .card-wild { background: linear-gradient(135deg, #ff6b6b 0%, #ffd43b 25%, #51cf66 50%, #4dabf7 75%, #ff6b6b 100%); color: white; }

        .player-hand {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .hand-title {
          text-align: center;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .hand-cards {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
          flex-wrap: wrap;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          min-height: 150px;
        }

        .hand-card {
          width: 80px;
          height: 120px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          transition: all 0.2s;
          cursor: pointer;
          position: relative;
        }

        .hand-card.playable {
          border: 3px solid #51cf66;
          cursor: pointer;
        }

        .hand-card.playable:hover {
          transform: translateY(-10px) scale(1.05);
          box-shadow: 0 10px 25px rgba(81, 207, 102, 0.5);
        }

        .hand-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .hand-card.selected {
          transform: translateY(-10px);
          border: 3px solid white;
        }

        .card-value-small {
          position: absolute;
          top: 5px;
          left: 5px;
          font-size: 0.9rem;
        }

        .game-stats {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .stat-value {
          font-weight: 700;
          font-size: 1.2rem;
        }

        .color-picker-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          padding: 2rem;
          border-radius: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          text-align: center;
        }

        .modal-content h3 {
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }

        .color-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .color-btn {
          padding: 1.5rem 2rem;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .color-btn:hover {
          transform: scale(1.05);
        }

        .color-btn-red { background: linear-gradient(135deg, #ff6b6b, #c92a2a); color: white; }
        .color-btn-yellow { background: linear-gradient(135deg, #ffd43b, #fab005); color: #333; }
        .color-btn-green { background: linear-gradient(135deg, #51cf66, #2b8a3e); color: white; }
        .color-btn-blue { background: linear-gradient(135deg, #4dabf7, #1971c2); color: white; }

        .game-loading {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #51cf66;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
