"use client"

/**
 * OneGame3D - 3D Game Board Component (UNO Style)
 * Diseño basado en el código de referencia proporcionado
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Smile } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import GameChat from './GameChat';
import GameResultsModal from './GameResultsModal';
import HalftoneWaves from './halftone-waves';
import { Card, Player, CurrentPlayer } from '@/types/game.types';

interface OneGame3DProps {
  onBack?: () => void;
}

export default function OneGame3D({ onBack }: OneGame3DProps) {
  const router = useRouter();
  const { gameState, playCard, drawCard, callUno, chatMessages, sendEmote, isMyTurn: isMyTurnFn, gameResults, clearGameResults } = useGame();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);

  const currentPlayer: CurrentPlayer | null | undefined = gameState?.currentPlayer;
  const isMyTurn = isMyTurnFn();
  const currentTurnPlayer = gameState?.players?.find(p => p.id === gameState?.currentTurnPlayerId);
  const isBotTurn = currentTurnPlayer?.isBot || false;
  const shouldCallUno = currentPlayer && currentPlayer.hand.length === 1 && !currentPlayer.calledOne;

  // Get players in correct positions
  const getPlayerPositions = () => {
    if (!gameState?.players || !currentPlayer) return { top: null, left: null, right: null };
    const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);
    const [firstPlayer, secondPlayer, thirdPlayer] = otherPlayers;
    return {
      top: firstPlayer || null,
      left: secondPlayer || null,
      right: thirdPlayer || null
    };
  };

  const playerPositions = getPlayerPositions();

  // Handle card play with animation
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
      // Animate card
      setAnimatingCard(cardId);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 500));

      await playCard(cardId);
      success("Card played", `Played ${card.color} ${getCardSymbol(card)}`);
      setSelectedCardId(null);
      setAnimatingCard(null);
    } catch (error: any) {
      showError("Cannot play card", error.message || "Invalid move");
      setAnimatingCard(null);
    }
  };

  const handleChooseColor = async (color: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE') => {
    if (!selectedCardId) return;
    try {
      setAnimatingCard(selectedCardId);
      await new Promise(resolve => setTimeout(resolve, 500));
      await playCard(selectedCardId, color);
      success("Card played", `Chose ${color}`);
      setSelectedCardId(null);
      setShowColorPicker(false);
      setAnimatingCard(null);
    } catch (error: any) {
      showError("Error", error.message || "Could not play card");
      setAnimatingCard(null);
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

  const availableEmojis = ['😀', '😂', '😎', '🔥', '👍', '❤️', '😮', '😤', '🎉', '💪', '🤔', '👏'];

  const handleSendEmote = (emoji: string) => {
    sendEmote(emoji);
    setShowEmojiPicker(false);
  };

  const getCardColorClass = (color: string) => {
    switch (color) {
      case 'RED': return 'red';
      case 'YELLOW': return 'yellow';
      case 'GREEN': return 'green';
      case 'BLUE': return 'blue';
      case 'WILD': return 'black';
      default: return '';
    }
  };

  const getCardSymbol = (card: Card) => {
    switch (card.type) {
      case 'SKIP': return '⊘';
      case 'REVERSE': return '⟲';
      case 'DRAW_TWO': return '+2';
      case 'WILD': return 'W';
      case 'WILD_DRAW_FOUR': return '+4';
      case 'NUMBER': return card.value !== null ? card.value.toString() : '?';
      default: return card.value !== null ? card.value.toString() : '?';
    }
  };

  const canPlayCard = (card: Card) => {
    if (!gameState?.topCard) return true;
    const topCard = gameState.topCard;
    if (card.color === 'WILD' || card.type === 'WILD') return true;
    if (card.color === topCard.color) return true;
    if (card.value === topCard.value) return true;
    if (card.type === topCard.type && card.type !== 'NUMBER') return true;
    return false;
  };

  if (!gameState) {
    return (
      <div className="game-loading">
        <div className="spinner"></div>
        <p>Loading game...</p>
      </div>
    );
  }

  const gameColor = gameState.topCard ? getCardColorClass(gameState.topCard.color) : 'red';

  return (
    <div className="one-game-container">
      {/* Background */}
      <div className="game-background">
        <HalftoneWaves />
      </div>

      {/* Header */}
      <div className="game-header">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="mr-2" size={16} />
          Leave
        </Button>
        <div className="game-info">
          <h2>🎴 ONE GAME 🎴</h2>
          <p className={isBotTurn ? 'bot-thinking' : ''}>
            {isMyTurn ? "🎯 Your Turn!" : isBotTurn ? `🤖 ${currentTurnPlayer?.nickname} thinking...` : `Waiting for ${currentTurnPlayer?.nickname || "player"}...`}
          </p>
        </div>
        <Button onClick={() => setShowEmojiPicker(true)} variant="outline" size="sm">
          <Smile className="mr-2" size={16} />
        </Button>
      </div>

      {/* Game Field - Exact replica of reference code */}
      <div className={`game-field perspective ${gameColor}`}>

        {/* PLAYER (You) - Bottom */}
        <div id="player" className="player-section">
          <div className="player-label">You ({currentPlayer?.hand.length || 0} cards)</div>
          <div className="player_hand">
            {currentPlayer?.hand.map((card, idx) => {
              const canPlay = canPlayCard(card);
              const isAnimating = animatingCard === card.id;
              return (
                <div
                  key={card.id}
                  className={`card ${getCardColorClass(card.color)} ${canPlay && isMyTurn ? 'playable' : ''} ${isAnimating ? 'animating' : ''}`}
                  data-key={idx}
                  onClick={() => canPlay && isMyTurn && !isAnimating ? handlePlayCard(card.id) : null}
                  style={{ cursor: canPlay && isMyTurn ? 'pointer' : 'default' }}
                >
                  <div className="bckg">
                    <div className="center-icon">{getCardSymbol(card)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PLAYER LEFT - 2nd player */}
        {playerPositions.left && (
          <div id="player_left" className="player-section">
            <div className="player-label">
              {playerPositions.left.nickname} ({playerPositions.left.cardCount})
              {gameState.currentTurnPlayerId === playerPositions.left.id && <span className="turn-arrow">▶</span>}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.left.cardCount, 20) }).map((_, idx) => (
                <div key={idx} className="card turned" data-index={idx}>
                  <div className="bckg"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYER TOP - 1st player */}
        {playerPositions.top && (
          <div id="player_top" className="player-section">
            <div className="player-label">
              {playerPositions.top.nickname} ({playerPositions.top.cardCount})
              {gameState.currentTurnPlayerId === playerPositions.top.id && <span className="turn-arrow">▶</span>}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.top.cardCount, 20) }).map((_, idx) => (
                <div key={idx} className="card turned" data-index={idx}>
                  <div className="bckg"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAYER RIGHT - 3rd player */}
        {playerPositions.right && (
          <div id="player_right" className="player-section">
            <div className="player-label">
              {playerPositions.right.nickname} ({playerPositions.right.cardCount})
              {gameState.currentTurnPlayerId === playerPositions.right.id && <span className="turn-arrow">▶</span>}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.right.cardCount, 20) }).map((_, idx) => (
                <div key={idx} className="card turned" data-index={idx}>
                  <div className="bckg"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PILES AREA - Center */}
        <div id="piles_area">
          {/* Draw Pile */}
          <div id="draw_pile" onClick={isMyTurn ? handleDrawCard : undefined}>
            <div className="card turned top-card">
              <div className="bckg"></div>
            </div>
            <div className="card turned pile">
              <div className="bckg"></div>
            </div>
          </div>

          {/* Discard Pile */}
          <div id="discard_pile">
            {gameState.topCard && (
              <>
                <div className={`card ${getCardColorClass(gameState.topCard.color)} top-card`}>
                  <div className="bckg">
                    <div className="center-icon">{getCardSymbol(gameState.topCard)}</div>
                  </div>
                </div>
                <div className={`card ${getCardColorClass(gameState.topCard.color)} pile`}>
                  <div className="bckg"></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <GameChat />

      {/* ONE Button */}
      {shouldCallUno && (
        <div className="one-button-container">
          <button onClick={handleCallOne} className="one-button pulsing">
            ONE!
          </button>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Choose a color</h3>
            <div className="color-options">
              {['RED', 'YELLOW', 'GREEN', 'BLUE'].map((color) => (
                <button
                  key={color}
                  className={`color-btn ${color.toLowerCase()}`}
                  onClick={() => handleChooseColor(color as any)}
                >
                  {color}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => { setShowColorPicker(false); setSelectedCardId(null); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Send Emoji</h3>
            <div className="emoji-grid">
              {availableEmojis.map((emoji) => (
                <button key={emoji} className="emoji-btn" onClick={() => handleSendEmote(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => setShowEmojiPicker(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ==================== GLOBAL ==================== */
        .one-game-container {
          position: fixed;
          inset: 0;
          overflow: hidden;
          font-family: Arial, sans-serif;
        }

        .game-background {
          position: fixed;
          inset: 0;
          z-index: 0;
        }

        /* ==================== HEADER ==================== */
        .game-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 100;
        }

        .game-info {
          text-align: center;
          color: white;
        }

        .game-info h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
        }

        .game-info p {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .game-info p.bot-thinking {
          color: #a78bfa;
          font-weight: 600;
          animation: bot-pulse 1.5s ease-in-out infinite;
        }

        @keyframes bot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        /* ==================== CARD STYLES (From reference) ==================== */
        .card {
          display: inline-block;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 0.8em;
          padding: 0.3em;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          transition: transform 200ms, box-shadow 200ms;
          position: relative;
        }

        .card .bckg {
          width: 5em;
          height: 7.6785em;
          border-radius: 0.5em;
          overflow: hidden;
          position: relative;
        }

        .card .bckg::before {
          content: '';
          width: 5em;
          height: 6.5em;
          background-color: white;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(10deg);
          transform-origin: center center;
          border-radius: 90% 40%;
        }

        .card .center-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 3em;
          font-weight: bold;
          z-index: 5;
        }

        /* Card colors */
        .card.red {
          color: #dc251c;
        }
        .card.red .bckg {
          background-color: #dc251c;
        }

        .card.yellow {
          color: #fcf604;
        }
        .card.yellow .bckg {
          background-color: #fcf604;
        }

        .card.blue {
          color: #0493de;
        }
        .card.blue .bckg {
          background-color: #0493de;
        }

        .card.green {
          color: #018d41;
        }
        .card.green .bckg {
          background-color: #018d41;
        }

        .card.black {
          color: #1f1b18;
        }
        .card.black .bckg {
          background-color: #1f1b18;
        }

        /* Turned cards (back) */
        .card.turned:hover {
          cursor: default;
        }
        .card.turned .bckg {
          background-color: #1f1b18;
        }
        .card.turned .bckg::before {
          background-color: #dc251c;
        }

        /* ==================== GAME FIELD (From reference) ==================== */
        .game-field {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          height: 100%;
          display: grid;
          justify-content: center;
          align-content: center;
          grid-gap: 0.5em;
          grid-template-columns: 16em 36em 16em;
          grid-template-rows: 16em 36em 16em;
          z-index: 10;
        }

        .game-field.perspective {
          transform: translate(-50%, -50%) rotateX(30deg);
        }

        #piles_area {
          grid-area: 2 / 2;
          position: relative;
          border-radius: 4em;
          transition: background-color 200ms, box-shadow 200ms;
        }

        .game-field.yellow #piles_area {
          background-color: rgba(252, 246, 4, 0.4);
          box-shadow: 0 0 40px rgba(252, 246, 4, 0.5);
        }

        .game-field.blue #piles_area {
          background-color: rgba(4, 147, 222, 0.4);
          box-shadow: 0 0 40px rgba(4, 147, 222, 0.5);
        }

        .game-field.red #piles_area {
          background-color: rgba(220, 37, 28, 0.4);
          box-shadow: 0 0 40px rgba(220, 37, 28, 0.5);
        }

        .game-field.green #piles_area {
          background-color: rgba(1, 141, 65, 0.4);
          box-shadow: 0 0 40px rgba(1, 141, 65, 0.5);
        }

        /* Draw pile */
        #draw_pile {
          position: absolute;
          left: 5em;
          top: 5em;
          cursor: pointer;
        }

        #draw_pile .card.top-card,
        #draw_pile .card.pile {
          position: absolute;
        }

        #draw_pile .card.pile {
          box-shadow:
            0px 2px white,
            0px 4px rgba(0,0,0,0.16),
            0px 6px white,
            0px 8px rgba(0,0,0,0.16),
            0px 10px white,
            0px 12px rgba(0,0,0,0.16),
            0px 14px white,
            0px 16px rgba(0,0,0,0.16),
            0px 18px white,
            0px 20px rgba(0,0,0,0.16);
        }

        #draw_pile .card.pile:hover {
          transform: none;
        }

        #draw_pile .card.top-card {
          z-index: 100;
          box-shadow: none;
        }

        #draw_pile .card.top-card:hover {
          box-shadow: 0px 4px rgba(0,0,0,0.16);
          cursor: pointer;
          transform: translateY(1em);
        }

        /* Discard pile */
        #discard_pile {
          position: absolute;
          left: 14em;
          top: 5.7em;
        }

        #discard_pile .card.top-card,
        #discard_pile .card.pile {
          position: absolute;
        }

        #discard_pile .card.pile {
          box-shadow:
            0px 2px white,
            0px 4px rgba(0,0,0,0.16),
            0px 6px white,
            0px 8px rgba(0,0,0,0.16);
        }

        #discard_pile .card.pile:hover {
          transform: none;
        }

        #discard_pile .card.top-card {
          z-index: 100;
          box-shadow: none;
        }

        /* ==================== PLAYER POSITIONS ==================== */
        .player-section {
          position: relative;
        }

        .player-label {
          position: absolute;
          top: -2.5em;
          left: 0;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 0.4em 0.8em;
          border-radius: 0.5em;
          font-size: 0.85em;
          font-weight: 600;
          z-index: 200;
          backdrop-filter: blur(10px);
          white-space: nowrap;
        }

        .turn-arrow {
          color: #4CAF50;
          margin-left: 0.5em;
          animation: pulse-arrow 1s infinite;
        }

        @keyframes pulse-arrow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        #piles_area {
          grid-area: 2 / 2;
        }

        #player {
          grid-area: 3 / 2;
        }

        #player_left {
          grid-area: 2 / 1;
        }

        #player_top {
          grid-area: 1 / 2;
        }

        #player_right {
          grid-area: 2 / 3;
        }

        /* ==================== PLAYER HANDS ==================== */
        .player_hand {
          position: relative;
          min-height: 9em;
        }

        .player_hand .card {
          position: absolute;
        }

        /* Position cards */
        ${Array.from({ length: 20 }, (_, i) => `
          .player_hand .card:nth-child(${i + 1}) {
            left: ${(i + 1) * 2.2}em;
          }
        `).join('\n')}

        /* PLAYER (You) - Bottom with grid and scroll */
        #player .player_hand {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1em;
          max-height: 22em;
          overflow-y: auto;
          padding: 1em;
          position: relative;
        }

        #player .player_hand::-webkit-scrollbar {
          width: 6px;
        }

        #player .player_hand::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        #player .player_hand::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }

        #player .player_hand .card {
          position: relative;
          left: auto !important;
        }

        #player .player_hand .card.playable {
          cursor: pointer;
        }

        #player .player_hand .card.playable:hover {
          transform-origin: center bottom;
          transform: rotate(-10deg) translateY(-0.5em) scale(1.05);
          box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
          z-index: 50;
        }

        #player .player_hand .card:not(.playable) {
          opacity: 0.6;
          filter: grayscale(0.3);
        }

        #player .player_hand .card.animating {
          animation: throw-card 0.5s ease-out;
          pointer-events: none;
        }

        @keyframes throw-card {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-10em) translateX(10em) scale(1.2);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-15em) translateX(15em) scale(0.8);
            opacity: 0;
          }
        }

        /* PLAYER LEFT */
        #player_left .player_hand {
          transform-origin: left bottom;
          transform: rotate(90deg) translateY(-10em);
        }

        /* PLAYER TOP */
        #player_top .player_hand {
          transform: translateY(1em);
        }

        /* PLAYER RIGHT */
        #player_right .player_hand {
          transform-origin: left bottom;
          transform: rotate(-90deg) translate(-24em, 1em);
        }

        /* ==================== ONE BUTTON ==================== */
        .one-button-container {
          position: fixed;
          right: 2em;
          top: 50%;
          transform: translateY(-50%);
          z-index: 150;
        }

        .one-button {
          width: 8em;
          height: 8em;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: 0.3em solid white;
          box-shadow: 0 8px 24px rgba(245, 87, 108, 0.6);
          cursor: pointer;
          font-size: 2em;
          font-weight: 900;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .one-button.pulsing {
          animation: pulse-one 1s infinite;
        }

        @keyframes pulse-one {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 8px 24px rgba(245, 87, 108, 0.6);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 12px 32px rgba(245, 87, 108, 0.9);
          }
        }

        /* ==================== MODALS ==================== */
        .modal-overlay {
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
          padding: 2em;
          border-radius: 1em;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          border: 2px solid rgba(255, 255, 255, 0.2);
          min-width: 300px;
        }

        .modal-content h3 {
          margin: 0 0 1.5em 0;
          font-size: 1.5em;
          text-align: center;
          color: white;
        }

        .color-options {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1em;
          margin-bottom: 1.5em;
        }

        .color-btn {
          padding: 1em;
          border: 2px solid white;
          border-radius: 0.5em;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
          color: white;
          font-size: 1em;
        }

        .color-btn:hover {
          transform: scale(1.05);
        }

        .color-btn.red { background: #dc251c; }
        .color-btn.yellow { background: #fcf604; color: #333; }
        .color-btn.green { background: #018d41; }
        .color-btn.blue { background: #0493de; }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75em;
          margin-bottom: 1.5em;
        }

        .emoji-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5em;
          padding: 0.75em;
          font-size: 1.5em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emoji-btn:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }

        /* ==================== LOADING ==================== */
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

        /* ==================== RESPONSIVE ==================== */
        @media (max-width: 1400px) {
          .game-field {
            grid-template-columns: 14em 32em 14em;
            grid-template-rows: 14em 32em 14em;
          }
        }

        @media (max-width: 1200px) {
          .game-field {
            grid-template-columns: 12em 28em 12em;
            grid-template-rows: 12em 28em 12em;
          }
        }

        @media (max-width: 768px) {
          .game-field {
            grid-template-columns: 10em 24em 10em;
            grid-template-rows: 10em 24em 10em;
            transform: translate(-50%, -50%) rotateX(30deg) scale(0.8);
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
