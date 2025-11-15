"use client"

/**
 * OneGame3D - 3D Game Board Component (Backend Connected)
 * RF24-RF39: Gameplay with backend integration
 *
 * Features:
 * - 3D UNO-style card visualization
 * - Real-time game state from WebSocket
 * - Connected to GameContext for all actions
 * - Chat integration (LEFT)
 * - Player stats table (LEFT)
 * - ONE button (RIGHT)
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import GameChat from './GameChat';
import GameResultsModal from './GameResultsModal';
import { Card, Player, CurrentPlayer } from '@/types/game.types';

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

  const currentPlayer: CurrentPlayer | null | undefined = gameState?.currentPlayer;
  const isMyTurn = useGame().isMyTurn();
  const currentTurnPlayer = gameState?.players?.find(p => p.id === gameState?.currentTurnPlayerId);
  const isBotTurn = currentTurnPlayer?.isBot || false;
  const shouldCallUno = currentPlayer && currentPlayer.hand.length === 1 && !currentPlayer.calledOne;

  // Handle card play
  const handlePlayCard = async (cardId: string) => {
    if (!isMyTurn) {
      showError("Not your turn", "Wait for your turn to play");
      return;
    }

    const card = currentPlayer?.hand.find(c => c.id === cardId);
    if (!card) return;

    if (card.color === 'WILD') {
      setSelectedCardId(cardId);
      setShowColorPicker(true);
      return;
    }

    try {
      await playCard(cardId);
      success("Card played", `Played ${card.color} ${getCardSymbol(card)}`);
      setSelectedCardId(null);
    } catch (error: any) {
      showError("Cannot play card", error.message || "Invalid move");
    }
  };

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

  const handleCallOne = async () => {
    try {
      await callUno();
      success("ONE!", "You called ONE!");
    } catch (error: any) {
      showError("Error", error.message || "Could not call ONE");
    }
  };

  const handleCloseGameResults = () => {
    clearGameResults();
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  const getCardColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'red';
      case 'YELLOW': return 'yellow';
      case 'GREEN': return 'green';
      case 'BLUE': return 'blue';
      case 'WILD': return 'wild';
      default: return '';
    }
  };

  const getCardSymbol = (card: Card) => {
    switch (card.type) {
      case 'SKIP':
        return '⊘';
      case 'REVERSE':
        return '⟲';
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

  const canPlayCard = (card: Card) => {
    if (!gameState?.topCard) return true;

    const topCard = gameState.topCard;

    if (card.color === 'WILD' || card.type === 'WILD') {
      return true;
    }

    if (card.color === topCard.color) {
      return true;
    }

    if (card.value === topCard.value) {
      return true;
    }

    if (card.type === topCard.type && card.type !== 'NUMBER') {
      return true;
    }

    return false;
  };

  // Render UNO-style card
  const renderCard = (card: Card, isPlayable: boolean = false) => {
    const colorClass = getCardColorClass(card.color);
    const typeClass = card.type === 'NUMBER' ? `num-${card.value}` : card.type.toLowerCase().replace('_', '');

    return (
      <div
        className={`uno-card ${colorClass} ${typeClass} ${isPlayable ? 'playable' : ''} ${selectedCardId === card.id ? 'selected' : ''}`}
        onClick={() => isPlayable && isMyTurn ? handlePlayCard(card.id) : null}
      >
        <span className="inner">
          <span className="mark">
            {card.type === 'NUMBER' && card.value}
            {card.type === 'DRAW_TWO' && <img src="https://i.imgur.com/cTuf7k2.png" width="50" alt="+2" />}
            {card.type === 'WILD_DRAW_FOUR' && <img src="https://i.imgur.com/TRL52hU.png" width="90" alt="+4" />}
            {card.type === 'SKIP' && <img src="https://i.imgur.com/xgledxW.png" width="100" alt="Skip" />}
            {card.type === 'REVERSE' && <img src="https://i.imgur.com/nGLZ5hB.png" width="70" alt="Reverse" />}
            {card.type === 'WILD' && (
              <div className="squareContainer">
                <div className="square"></div>
                <div className="square"></div>
                <div className="square"></div>
                <div className="square"></div>
              </div>
            )}
          </span>
        </span>
      </div>
    );
  };

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
          <p className={`game-status ${isBotTurn ? 'bot-thinking' : ''}`}>
            {isMyTurn
              ? "🎯 Your Turn!"
              : isBotTurn
                ? `🤖 ${currentTurnPlayer?.nickname} thinking...`
                : `Waiting for ${currentTurnPlayer?.nickname || "player"}...`
            }
          </p>
        </div>
      </div>

      {/* LEFT SIDEBAR: Chat + Player Stats */}
      <div className="left-sidebar">
        {/* Player Stats Table */}
        <div className="player-stats-panel">
          <h3 className="panel-title">👥 Players</h3>
          <div className="player-stats-list">
            {gameState.players?.map((player) => (
              <div
                key={player.id}
                className={`player-stat-item ${
                  gameState.currentTurnPlayerId === player.id ? 'active-turn' : ''
                } ${player.id === currentPlayer?.id ? 'is-you' : ''}`}
              >
                <div className="player-stat-info">
                  <span className="player-stat-name">
                    {player.nickname}
                    {player.id === currentPlayer?.id && ' (You)'}
                  </span>
                  <span className="player-stat-cards">
                    🃏 {player.cardCount} {player.cardCount === 1 ? 'card' : 'cards'}
                    {player.calledOne && ' 🎯'}
                  </span>
                </div>
                {gameState.currentTurnPlayerId === player.id && (
                  <div className="turn-indicator-mini">▶</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="chat-container-wrapper">
          <GameChat isMinimized={!showChat} onToggleMinimize={() => setShowChat(!showChat)} />
        </div>
      </div>

      {/* RIGHT SIDEBAR: ONE Button */}
      <div className="right-sidebar">
        {shouldCallUno && (
          <div className="uno-button-container">
            <div className="uno-warning">⚠️ Call ONE!</div>
            <button onClick={handleCallOne} className="uno-button pulsing">
              <div className="uno-logo">
                <div className="uno-text">ONE</div>
                <div className="uno-subtitle">ONE!</div>
              </div>
            </button>
            <div className="uno-hint">You have 1 card left!</div>
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="game-board">
        {/* Other Players */}
        <div className="other-players">
          {gameState.players
            ?.filter(p => p.id !== currentPlayer?.id)
            .map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <span className="player-name">{player.nickname}</span>
                  <span className="player-cards">{player.cardCount} cards</span>
                </div>
                {gameState.currentTurnPlayerId === player.id && (
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
            {gameState.topCard && renderCard(gameState.topCard, false)}
          </div>
        </div>

        {/* Current Player Hand */}
        <div className="player-hand">
          <div className="hand-title">Your Hand ({currentPlayer?.hand.length || 0} cards)</div>
          <div className="hand-cards">
            {currentPlayer?.hand.map((card) => {
              const canPlay = canPlayCard(card);
              return (
                <div key={card.id} className="hand-card-wrapper">
                  {renderCard(card, canPlay && isMyTurn)}
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

      {/* Color Picker Modal */}
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

      <style jsx>{`
        @import url(https://fonts.googleapis.com/css?family=Source+Sans+Pro:900);

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
          transition: all 0.3s ease;
        }

        .game-status.bot-thinking {
          color: #a78bfa;
          font-weight: 600;
          animation: bot-pulse 1.5s ease-in-out infinite;
        }

        @keyframes bot-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.02);
          }
        }

        /* ========== UNO CARD STYLES ========== */
        .uno-card {
          width: 116px;
          height: 178px;
          background: #fff;
          border-radius: 5px;
          display: table;
          box-sizing: border-box;
          padding: 5px;
          font-family: "Source Sans Pro", sans-serif;
          font-size: 100px;
          text-shadow: 1px 1px 0 #000000, -1px -1px 0 #000000, -1px 1px 0 #000000,
            1px -1px 0 #000000, 1px 0 0 #000000, -1px 0 0 #000000, 0 -1px 0 #000000,
            0 1px 0 #000000, 4px 4px 0 #000000;
          box-shadow: 0 0 10px #aaaaaa;
          text-align: center;
          position: relative;
          overflow: hidden;
          color: #fff;
          transition: all 0.3s;
          cursor: pointer;
        }

        .uno-card .inner {
          display: table-cell;
          vertical-align: middle;
          border-radius: 5px;
          overflow: hidden;
        }

        .uno-card .mark {
          display: inline-block;
          vertical-align: middle;
          margin: auto;
          padding: 0 26px;
          border-radius: 100px 60px / 120px 60px;
          line-height: 1.4;
          position: relative;
          height: 85%;
          width: 51%;
          overflow: hidden;
          border: solid 7px #fff;
          left: -4%;
        }

        .uno-card .mark img {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .uno-card:before,
        .uno-card:after {
          display: inline-block;
          position: absolute;
          line-height: 0;
          font-size: 20px;
          color: #ffffff;
          text-shadow: 1px 1px 0 #000000, -1px -1px 0 #000000, -1px 1px 0 #000000,
            1px -1px 0 #000000, 1px 0 0 #000000, -1px 0 0 #000000, 0 -1px 0 #000000,
            0 1px 0 #000000, 2px 2px 0 #000000;
        }

        .uno-card:before {
          top: 15px;
          left: 10px;
        }

        .uno-card:after {
          bottom: 15px;
          right: 10px;
          transform: rotate(180deg);
        }

        .uno-card.num-0:before, .uno-card.num-0:after { content: "0"; }
        .uno-card.num-1:before, .uno-card.num-1:after { content: "1"; }
        .uno-card.num-2:before, .uno-card.num-2:after { content: "2"; }
        .uno-card.num-3:before, .uno-card.num-3:after { content: "3"; }
        .uno-card.num-4:before, .uno-card.num-4:after { content: "4"; }
        .uno-card.num-5:before, .uno-card.num-5:after { content: "5"; }
        .uno-card.num-6:before, .uno-card.num-6:after { content: "6"; }
        .uno-card.num-7:before, .uno-card.num-7:after { content: "7"; }
        .uno-card.num-8:before, .uno-card.num-8:after { content: "8"; }
        .uno-card.num-9:before, .uno-card.num-9:after { content: "9"; }
        .uno-card.drawtwo:before, .uno-card.drawtwo:after { content: "+2"; }
        .uno-card.wilddrawfour:before, .uno-card.wilddrawfour:after { content: "+4"; }

        .uno-card.num-6 .mark:after,
        .uno-card.num-9 .mark:after {
          display: block;
          content: "";
          position: relative;
          top: -25px;
          left: 5px;
          width: 80%;
          border: 1px solid #000000;
          height: 4px;
          box-shadow: 1px 1px 0 #000000;
        }

        .uno-card.num-6.blue .mark:after,
        .uno-card.num-9.blue .mark:after { background: #0063b3; }
        .uno-card.num-6.green .mark:after,
        .uno-card.num-9.green .mark:after { background: #18a849; }
        .uno-card.num-6.red .mark:after,
        .uno-card.num-9.red .mark:after { background: #c72a18; }
        .uno-card.num-6.yellow .mark:after,
        .uno-card.num-9.yellow .mark:after { background: #e6ca1e; }

        .squareContainer {
          display: flex;
          height: calc(100% - 20px);
          width: calc(100% - 20px);
          position: absolute;
          left: 10px;
          top: 10px;
          flex-wrap: wrap;
          transform: skewX(-13deg);
          border-radius: 50px 60px;
          overflow: hidden;
        }

        .square {
          width: 50%;
          height: 50%;
        }

        .square:nth-child(1) { background-color: #18A849; }
        .square:nth-child(2) { background-color: #E6CA1E; }
        .square:nth-child(3) { background-color: #0063B3; }
        .square:nth-child(4) { background-color: #C72A18; }

        /* Card colors */
        .uno-card.blue .inner { background-color: #0063B3; }
        .uno-card.red .inner { background-color: #C72A18; }
        .uno-card.green .inner { background-color: #18A849; }
        .uno-card.yellow .inner { background-color: #E6CA1E; }
        .uno-card.wild .inner { background-color: #201917; }

        .uno-card.playable {
          transform: translateY(-10px);
          box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
        }

        .uno-card.playable:hover {
          transform: translateY(-15px) scale(1.05);
          box-shadow: 0 0 30px rgba(76, 175, 80, 1);
        }

        .uno-card.selected {
          transform: translateY(-20px) scale(1.1);
          box-shadow: 0 0 30px rgba(33, 150, 243, 1);
        }

        /* ========== LEFT SIDEBAR ========== */
        .left-sidebar {
          position: fixed;
          left: 0;
          top: 80px;
          bottom: 0;
          width: 300px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          z-index: 50;
        }

        .player-stats-panel {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 12px;
          padding: 1rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .panel-title {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 0.75rem 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .player-stats-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-stat-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.2s;
        }

        .player-stat-item.active-turn {
          background: rgba(76, 175, 80, 0.2);
          border-color: #4CAF50;
          box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
        }

        .player-stat-item.is-you {
          border-color: rgba(33, 150, 243, 0.5);
          background: rgba(33, 150, 243, 0.1);
        }

        .player-stat-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-stat-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .player-stat-cards {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .turn-indicator-mini {
          color: #4CAF50;
          font-size: 1.2rem;
          animation: pulse-mini 1s infinite;
        }

        @keyframes pulse-mini {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }

        .chat-container-wrapper {
          flex: 1;
          overflow: hidden;
        }

        /* ========== RIGHT SIDEBAR ========== */
        .right-sidebar {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 50;
        }

        .uno-button-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .uno-warning {
          background: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          animation: flash 1s infinite;
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5);
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .uno-button {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: 5px solid white;
          box-shadow: 0 8px 24px rgba(245, 87, 108, 0.6);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .uno-button:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(245, 87, 108, 0.8);
        }

        .uno-button.pulsing {
          animation: pulse-uno 1s infinite;
        }

        @keyframes pulse-uno {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 24px rgba(245, 87, 108, 0.6);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(245, 87, 108, 0.9);
          }
        }

        .uno-logo {
          text-align: center;
        }

        .uno-text {
          font-size: 3rem;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          line-height: 1;
        }

        .uno-subtitle {
          font-size: 1.2rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 0.25rem;
        }

        .uno-hint {
          background: rgba(0, 0, 0, 0.7);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
        }

        /* ========== GAME BOARD ========== */
        .game-board {
          position: absolute;
          left: 320px;
          right: 200px;
          top: 80px;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
        }

        .other-players {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .player-card {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          padding: 1rem;
          border-radius: 12px;
          min-width: 150px;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .player-name {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .player-cards {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.8rem;
        }

        .turn-indicator {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #4CAF50;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .center-area {
          display: flex;
          gap: 3rem;
          align-items: center;
          justify-content: center;
        }

        .draw-pile, .discard-pile {
          position: relative;
        }

        .draw-pile {
          cursor: pointer;
          transition: transform 0.2s;
        }

        .draw-pile:hover {
          transform: translateY(-5px);
        }

        .pile-card {
          width: 120px;
          height: 180px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .card-back {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 3px solid white;
        }

        .card-pattern {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          opacity: 0.3;
        }

        .pile-count {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-weight: 700;
        }

        .draw-hint {
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }

        .player-hand {
          width: 100%;
          max-width: 900px;
        }

        .hand-title {
          text-align: center;
          margin-bottom: 1rem;
          font-weight: 600;
          font-size: 1.1rem;
        }

        .hand-cards {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .hand-card-wrapper {
          transition: all 0.3s;
        }

        .game-stats {
          display: flex;
          gap: 2rem;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .stat-label {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .stat-value {
          color: white;
          font-weight: 700;
          font-size: 1.1rem;
        }

        /* ========== MODALS ========== */
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
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.2);
          min-width: 300px;
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

        .color-btn {
          padding: 1rem;
          border: 2px solid white;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
          color: white;
        }

        .color-btn:hover {
          transform: scale(1.05);
        }

        .color-btn-red { background: #C72A18; }
        .color-btn-yellow { background: #E6CA1E; }
        .color-btn-green { background: #18A849; }
        .color-btn-blue { background: #0063B3; }

        /* ========== LOADING ========== */
        .game-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1em;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
