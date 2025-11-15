"use client"

/**
 * OneGame3D - 3D Game Board Component with Perspective View
 * RF24-RF39: Gameplay with backend integration
 *
 * Features:
 * - 3D perspective card visualization (like UNO)
 * - Halftone waves background
 * - Player positions: 1st=TOP, 2nd=LEFT, 3rd=RIGHT, You=BOTTOM
 * - Turn animation indicators
 * - All card types: numbers, +2, +4, skip, reverse, wild
 * - Chat integration
 * - Real-time game state from WebSocket
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
  const { gameState, playCard, drawCard, callUno, chatMessages, sendEmote, isMyTurn: isMyTurnFn, gameResults, clearGameResults, room } = useGame();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [playerEmojis, setPlayerEmojis] = useState<Record<string, string>>({});

  const currentPlayer: CurrentPlayer | null | undefined = gameState?.currentPlayer;
  const isMyTurn = isMyTurnFn();

  const currentTurnPlayer = gameState?.players?.find(p => p.id === gameState?.currentTurnPlayerId);
  const isBotTurn = currentTurnPlayer?.isBot || false;
  const shouldCallUno = currentPlayer && currentPlayer.hand.length === 1 && !currentPlayer.calledOne;

  // Get players in correct positions
  const getPlayerPositions = () => {
    if (!gameState?.players || !currentPlayer) return { top: null, left: null, right: null };

    // Filter out current player
    const otherPlayers = gameState.players.filter(p => p.id !== currentPlayer.id);

    // Sort players by join order (first player should be host/creator)
    // Assuming the order in the array represents join order
    const [firstPlayer, secondPlayer, thirdPlayer] = otherPlayers;

    return {
      top: firstPlayer || null,     // 1st player → TOP
      left: secondPlayer || null,    // 2nd player → LEFT
      right: thirdPlayer || null     // 3rd player → RIGHT
    };
  };

  const playerPositions = getPlayerPositions();

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
      const cardDisplay = getCardSymbol(card);
      success("Card played", `Played ${card.color} ${cardDisplay}`);
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

  const availableEmojis = ['😀', '😂', '😎', '🔥', '👍', '❤️', '😮', '😤', '🎉', '💪', '🤔', '👏'];

  const handleSendEmote = (emoji: string) => {
    sendEmote(emoji);
    setShowEmojiPicker(false);

    if (currentPlayer?.id) {
      setPlayerEmojis(prev => ({ ...prev, [currentPlayer.id]: emoji }));
      setTimeout(() => {
        setPlayerEmojis(prev => {
          const newEmojis = { ...prev };
          delete newEmojis[currentPlayer.id];
          return newEmojis;
        });
      }, 3000);
    }
  };

  useEffect(() => {
    const latestMessage = chatMessages[chatMessages.length - 1];
    if (latestMessage && latestMessage.type === 'EMOTE' && latestMessage.playerId !== currentPlayer?.id) {
      if (latestMessage.playerId) {
        setPlayerEmojis(prev => ({ ...prev, [latestMessage.playerId]: latestMessage.message }));
        setTimeout(() => {
          setPlayerEmojis(prev => {
            const newEmojis = { ...prev };
            delete newEmojis[latestMessage.playerId];
            return newEmojis;
          });
        }, 3000);
      }
    }
  }, [chatMessages, currentPlayer?.id]);

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

  // Render card with full design
  const renderCard = (card: Card | null, isBack: boolean = false, size: 'small' | 'normal' | 'large' = 'normal') => {
    if (!card && !isBack) return null;

    const colorClass = card ? getCardColorClass(card.color) : 'back';
    const symbol = card ? getCardSymbol(card) : '';
    const type = card?.type || '';

    const sizeClass = size === 'small' ? 'card-small' : size === 'large' ? 'card-large' : '';

    return (
      <div className={`one-card ${colorClass} ${sizeClass} ${isBack ? 'back' : ''}`}>
        <div className="bckg">
          {!isBack && (
            <>
              {/* Small top-left indicator */}
              <div className="small-content">
                {type === 'SKIP' && <div className="skip"></div>}
                {type === 'REVERSE' && <div className="reverse"><div className="arrows"><div className="arrow"></div><div className="arrow"></div></div></div>}
                {type === 'WILD' && <div className="wild"><div className="segment red"></div><div className="segment green"></div><div className="segment yellow"></div><div className="segment blue"></div></div>}
                {(type === 'NUMBER' || type === 'DRAW_TWO') && <span>{symbol}</span>}
                {type === 'WILD_DRAW_FOUR' && <span>+4</span>}
              </div>

              {/* Center content */}
              <div className={`center-icon ${colorClass}`}>
                {type === 'SKIP' && <div className="skip"></div>}
                {type === 'REVERSE' && <div className="reverse"><div className="arrows"><div className="arrow"></div><div className="arrow"></div></div></div>}
                {type === 'DRAW_TWO' && <div className="plus-two"></div>}
                {type === 'WILD' && <div className="wild"><div className="segment red"></div><div className="segment green"></div><div className="segment yellow"></div><div className="segment blue"></div></div>}
                {type === 'WILD_DRAW_FOUR' && <div className="plus-four"><div className="card1"></div><div className="card2"></div><div className="card3"></div><div className="card4"></div></div>}
                {type === 'NUMBER' && <span>{symbol}</span>}
              </div>

              {/* Small bottom-right indicator (reversed) */}
              <div className="small-content-reverse">
                {type === 'SKIP' && <div className="skip"></div>}
                {type === 'REVERSE' && <div className="reverse"><div className="arrows"><div className="arrow"></div><div className="arrow"></div></div></div>}
                {type === 'WILD' && <div className="wild"><div className="segment red"></div><div className="segment green"></div><div className="segment yellow"></div><div className="segment blue"></div></div>}
                {(type === 'NUMBER' || type === 'DRAW_TWO') && <span>{symbol}</span>}
                {type === 'WILD_DRAW_FOUR' && <span>+4</span>}
              </div>
            </>
          )}
          {isBack && (
            <>
              <div className="one-back-ring"></div>
              <div className="one-back-text">ONE</div>
            </>
          )}
        </div>
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
    <div className="one-game-3d-perspective">
      {/* Background */}
      <div className="game-background">
        <HalftoneWaves />
      </div>

      {/* Header */}
      <div className="game-header">
        <Button
          onClick={onBack}
          className="back-btn"
          variant="outline"
        >
          <ArrowLeft className="mr-2" size={18} />
          Leave
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

        <div className="game-actions">
          <Button
            onClick={() => setShowEmojiPicker(true)}
            className="emoji-btn"
            variant="outline"
          >
            <Smile className="mr-2" size={18} />
            Emojis
          </Button>
        </div>
      </div>

      {/* Game Field with 3D Perspective */}
      <div className={`game-field perspective ${gameState.topCard ? getCardColorClass(gameState.topCard.color) : ''}`}>

        {/* TOP PLAYER (1st player) */}
        {playerPositions.top && (
          <div id="player_top" className="player-position">
            <div className="player-info-label">
              <span className="player-name">{playerPositions.top.nickname}</span>
              <span className="player-cards">{playerPositions.top.cardCount} cards</span>
              {gameState.currentTurnPlayerId === playerPositions.top.id && (
                <div className="turn-indicator">▶ PLAYING</div>
              )}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.top.cardCount, 7) }).map((_, idx) => (
                <div key={idx} className="card-wrapper" data-index={idx}>
                  {renderCard(null, true, 'small')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LEFT PLAYER (2nd player) */}
        {playerPositions.left && (
          <div id="player_left" className="player-position">
            <div className="player-info-label">
              <span className="player-name">{playerPositions.left.nickname}</span>
              <span className="player-cards">{playerPositions.left.cardCount} cards</span>
              {gameState.currentTurnPlayerId === playerPositions.left.id && (
                <div className="turn-indicator">▶ PLAYING</div>
              )}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.left.cardCount, 7) }).map((_, idx) => (
                <div key={idx} className="card-wrapper" data-index={idx}>
                  {renderCard(null, true, 'small')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RIGHT PLAYER (3rd player) */}
        {playerPositions.right && (
          <div id="player_right" className="player-position">
            <div className="player-info-label">
              <span className="player-name">{playerPositions.right.nickname}</span>
              <span className="player-cards">{playerPositions.right.cardCount} cards</span>
              {gameState.currentTurnPlayerId === playerPositions.right.id && (
                <div className="turn-indicator">▶ PLAYING</div>
              )}
            </div>
            <div className="player_hand">
              {Array.from({ length: Math.min(playerPositions.right.cardCount, 7) }).map((_, idx) => (
                <div key={idx} className="card-wrapper" data-index={idx}>
                  {renderCard(null, true, 'small')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CENTER AREA - Piles */}
        <div id="piles_area">
          {/* Draw Pile */}
          <div id="draw_pile" onClick={isMyTurn ? handleDrawCard : undefined} style={{ cursor: isMyTurn ? 'pointer' : 'default' }}>
            <div className="card-wrapper top-card">
              {renderCard(null, true, 'normal')}
            </div>
            <div className="card-wrapper pile">
              {renderCard(null, true, 'normal')}
            </div>
            {isMyTurn && <div className="draw-hint">Draw</div>}
          </div>

          {/* Discard Pile */}
          <div id="discard_pile">
            {gameState.topCard && (
              <>
                <div className="card-wrapper top-card">
                  {renderCard(gameState.topCard, false, 'normal')}
                </div>
                <div className="card-wrapper pile">
                  {renderCard(gameState.topCard, false, 'normal')}
                </div>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM PLAYER (You) */}
        <div id="player" className="player-position">
          <div className="player-info-label">
            <span className="player-name">You ({currentPlayer?.nickname})</span>
            <span className="player-cards">{currentPlayer?.hand.length || 0} cards</span>
            {isMyTurn && (
              <div className="turn-indicator active">▶ YOUR TURN!</div>
            )}
          </div>
          <div className="player_hand">
            {currentPlayer?.hand.map((card, idx) => {
              const canPlay = canPlayCard(card);
              return (
                <div
                  key={card.id}
                  className={`card-wrapper ${canPlay && isMyTurn ? 'playable' : 'disabled'}`}
                  data-key={idx}
                  onClick={() => canPlay && isMyTurn ? handlePlayCard(card.id) : null}
                  style={{ cursor: canPlay && isMyTurn ? 'pointer' : 'default' }}
                >
                  {renderCard(card, false, 'normal')}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chat - Fixed position */}
      <GameChat isMinimized={!showChat} onToggleMinimize={() => setShowChat(!showChat)} />

      {/* ONE Button - RIGHT SIDEBAR */}
      {shouldCallUno && (
        <div className="one-button-container">
          <div className="one-warning">⚠️ Call ONE!</div>
          <button onClick={handleCallOne} className="one-button pulsing">
            <div className="one-logo">
              <div className="one-text">ONE</div>
              <div className="one-subtitle">ONE!</div>
            </div>
          </button>
          <div className="one-hint">You have 1 card left!</div>
        </div>
      )}

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

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="emoji-picker-modal">
          <div className="modal-content emoji-modal">
            <h3>Send an Emoji</h3>
            <div className="emoji-grid">
              {availableEmojis.map((emoji) => (
                <button
                  key={emoji}
                  className="emoji-option"
                  onClick={() => handleSendEmote(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowEmojiPicker(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        /* ============ MAIN CONTAINER ============ */
        .one-game-3d-perspective {
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

        /* ============ HEADER ============ */
        .game-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          z-index: 100;
        }

        .game-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          color: white;
        }

        .game-status {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
        }

        .game-status.bot-thinking {
          color: #a78bfa;
          font-weight: 600;
          animation: bot-pulse 1.5s ease-in-out infinite;
        }

        @keyframes bot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }

        /* ============ 3D GAME FIELD ============ */
        .game-field {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
          display: grid;
          grid-template-columns: 12em 24em 12em;
          grid-template-rows: 12em 24em 12em;
          grid-gap: 0.5em;
          justify-content: center;
          align-content: center;
        }

        .game-field.perspective {
          transform: translate(-50%, -50%) rotateX(30deg);
          perspective: 100em;
        }

        #piles_area {
          grid-area: 2 / 2;
          position: relative;
          border-radius: 4em;
          transition: 200ms;
          padding: 2em;
        }

        .game-field.yellow #piles_area {
          background-color: rgba(252, 246, 4, 0.3);
          box-shadow: 0 0 30px rgba(252, 246, 4, 0.4);
        }

        .game-field.blue #piles_area {
          background-color: rgba(4, 147, 222, 0.3);
          box-shadow: 0 0 30px rgba(4, 147, 222, 0.4);
        }

        .game-field.red #piles_area {
          background-color: rgba(220, 37, 28, 0.3);
          box-shadow: 0 0 30px rgba(220, 37, 28, 0.4);
        }

        .game-field.green #piles_area {
          background-color: rgba(1, 141, 65, 0.3);
          box-shadow: 0 0 30px rgba(1, 141, 65, 0.4);
        }

        #draw_pile {
          position: absolute;
          left: 3em;
          top: 5em;
        }

        #draw_pile .card-wrapper.top-card,
        #draw_pile .card-wrapper.pile {
          position: absolute;
        }

        #draw_pile .card-wrapper.pile {
          box-shadow: 0px 2px white,
                     0px 4px rgba(0,0,0,0.16),
                     0px 6px white,
                     0px 8px rgba(0,0,0,0.16),
                     0px 10px white,
                     0px 12px rgba(0,0,0,0.16);
        }

        #draw_pile .card-wrapper.top-card {
          z-index: 100;
          transition: transform 0.2s;
        }

        #draw_pile .card-wrapper.top-card:hover {
          transform: translateY(1em);
        }

        .draw-hint {
          position: absolute;
          bottom: -2em;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-size: 0.8em;
          white-space: nowrap;
          background: rgba(0, 0, 0, 0.7);
          padding: 0.3em 0.6em;
          border-radius: 0.5em;
        }

        #discard_pile {
          position: absolute;
          left: 12em;
          top: 5.7em;
        }

        #discard_pile .card-wrapper.top-card,
        #discard_pile .card-wrapper.pile {
          position: absolute;
        }

        #discard_pile .card-wrapper.pile {
          box-shadow: 0px 2px white,
                     0px 4px rgba(0,0,0,0.16),
                     0px 6px white,
                     0px 8px rgba(0,0,0,0.16);
        }

        #discard_pile .card-wrapper.top-card {
          z-index: 100;
        }

        /* ============ PLAYER POSITIONS ============ */
        .player-position {
          position: relative;
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

        .player-info-label {
          position: absolute;
          top: -3em;
          left: 0;
          background: rgba(0, 0, 0, 0.8);
          padding: 0.5em 1em;
          border-radius: 0.5em;
          color: white;
          font-size: 0.85em;
          display: flex;
          gap: 1em;
          align-items: center;
          z-index: 200;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .player-name {
          font-weight: 700;
        }

        .player-cards {
          color: rgba(255, 255, 255, 0.7);
        }

        .turn-indicator {
          background: rgba(76, 175, 80, 0.3);
          color: #4CAF50;
          padding: 0.3em 0.6em;
          border-radius: 0.4em;
          font-size: 0.85em;
          font-weight: 700;
          border: 1px solid #4CAF50;
          animation: pulse-turn 1s infinite;
        }

        .turn-indicator.active {
          background: rgba(244, 67, 54, 0.3);
          color: #F44336;
          border-color: #F44336;
        }

        @keyframes pulse-turn {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        /* ============ PLAYER HANDS ============ */
        .player_hand {
          position: relative;
          min-height: 8em;
        }

        .player_hand .card-wrapper {
          position: absolute;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        /* Bottom player (You) */
        #player .player_hand .card-wrapper {
          left: calc(var(--index) * 3.5em);
        }

        #player .player_hand .card-wrapper.playable:hover {
          transform: rotate(-10deg) translateY(-1em);
          z-index: 100;
        }

        #player .player_hand .card-wrapper.playable:hover ~ .card-wrapper {
          transform: translateX(2em);
        }

        #player .player_hand .card-wrapper.disabled {
          opacity: 0.6;
          filter: brightness(0.7);
        }

        /* Top player */
        #player_top .player_hand {
          transform: translateY(1em);
        }

        #player_top .player_hand .card-wrapper {
          left: calc(var(--index) * 2.2em);
        }

        /* Left player */
        #player_left .player_hand {
          transform-origin: left bottom;
          transform: rotate(90deg) translateY(-10em);
        }

        #player_left .player_hand .card-wrapper {
          left: calc(var(--index) * 2.2em);
        }

        /* Right player */
        #player_right .player_hand {
          transform-origin: left bottom;
          transform: rotate(-90deg) translate(-24em, 1em);
        }

        #player_right .player_hand .card-wrapper {
          left: calc(var(--index) * 2.2em);
        }

        /* Position cards using data-index attribute */
        ${Array.from({ length: 20 }, (_, i) => `
          .card-wrapper[data-index="${i}"],
          .card-wrapper[data-key="${i}"] {
            --index: ${i + 1};
          }
        `).join('\n')}

        /* ============ CARD STYLES ============ */
        .one-card {
          display: inline-block;
          background-color: white;
          border: 1px solid #ccc;
          border-radius: 0.8em;
          padding: 0.3em;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
          transition: 200ms;
          position: relative;
        }

        .one-card.card-small .bckg {
          width: 3em;
          height: 4.607em;
        }

        .one-card .bckg {
          width: 5em;
          height: 7.6785em;
          border-radius: 0.5em;
          overflow: hidden;
          position: relative;
        }

        .one-card.card-large .bckg {
          width: 7em;
          height: 10.75em;
        }

        .one-card .bckg::before {
          content: '';
          width: 100%;
          height: 130%;
          background-color: white;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(10deg);
          border-radius: 90% 40%;
        }

        /* Card colors */
        .one-card.red { color: #dc251c; }
        .one-card.red .bckg { background-color: #dc251c; }

        .one-card.yellow { color: #fcf604; }
        .one-card.yellow .bckg { background-color: #fcf604; }

        .one-card.blue { color: #0493de; }
        .one-card.blue .bckg { background-color: #0493de; }

        .one-card.green { color: #018d41; }
        .one-card.green .bckg { background-color: #018d41; }

        .one-card.black { color: #1f1b18; }
        .one-card.black .bckg { background-color: #1f1b18; }

        /* Back of card */
        .one-card.back .bckg {
          background: linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 60%, #050505 100%);
        }

        .one-card.back .bckg::before {
          display: none;
        }

        .one-back-ring {
          position: absolute;
          width: 110%;
          height: 140%;
          background: linear-gradient(45deg, #d62828, #f77f00, #fcbf49);
          border-radius: 50%;
          transform: rotate(-20deg);
          top: -20%;
          left: -5%;
        }

        .one-back-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          font-family: 'Arial', sans-serif;
          font-size: 2em;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.1em;
          text-shadow: 2px 2px 0 #000, -2px -2px 0 #000;
          z-index: 10;
        }

        /* Center icon */
        .center-icon {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 3em;
          font-weight: bold;
          z-index: 5;
        }

        /* Small content indicators */
        .small-content,
        .small-content-reverse {
          position: absolute;
          font-size: 1em;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 6;
        }

        .small-content {
          top: 0.3em;
          left: 0.5em;
        }

        .small-content-reverse {
          right: 0.5em;
          bottom: 0.3em;
          transform: rotate(180deg);
        }

        /* Skip icon */
        .skip {
          width: 2em;
          height: 2em;
          border: 0.4em solid currentColor;
          border-radius: 50%;
          position: relative;
        }

        .skip::before {
          content: '';
          display: block;
          width: 100%;
          height: 20%;
          background-color: currentColor;
          position: absolute;
          top: 40%;
          transform: rotate(-45deg);
        }

        .small-content .skip,
        .small-content-reverse .skip {
          width: 0.8em;
          height: 0.8em;
          border: 0.15em solid white;
        }

        .small-content .skip::before,
        .small-content-reverse .skip::before {
          background-color: white;
        }

        /* Plus Two icon */
        .plus-two {
          position: relative;
          width: 1.5em;
          height: 2.5em;
        }

        .plus-two::before,
        .plus-two::after {
          content: '';
          display: block;
          width: 1.5em;
          height: 2.5em;
          background-color: currentColor;
          border-radius: 10%;
          border: 0.15em solid white;
          position: absolute;
        }

        .plus-two::before {
          left: 1em;
        }

        .plus-two::after {
          top: 1.5em;
        }

        /* Reverse icon */
        .reverse {
          height: 5em;
        }

        .reverse .arrows {
          display: inline-block;
          transform: rotate(-45deg);
        }

        .reverse .arrows .arrow {
          width: 1.2em;
          height: 1.2em;
          background-color: currentColor;
          position: relative;
        }

        .reverse .arrows .arrow::before {
          content: '';
          display: block;
          width: 1.2em;
          height: 1.2em;
          background-color: inherit;
          border-top-left-radius: 100%;
          position: absolute;
          left: -1.15em;
        }

        .reverse .arrows .arrow::after {
          content: '';
          display: block;
          width: 0;
          height: 0;
          border: 1.2em solid currentColor;
          border-top-color: transparent;
          border-bottom-color: transparent;
          border-right: none;
          position: absolute;
          right: -1.15em;
          top: -0.6em;
        }

        .reverse .arrows .arrow:last-child {
          transform: rotate(180deg);
          top: 0.25em;
          right: 1.6em;
        }

        .small-content .reverse,
        .small-content-reverse .reverse {
          height: 1.3em;
        }

        .small-content .reverse .arrows .arrow,
        .small-content-reverse .reverse .arrows .arrow {
          width: 0.32em;
          height: 0.32em;
          background-color: white;
        }

        .small-content .reverse .arrows .arrow::before,
        .small-content-reverse .reverse .arrows .arrow::before {
          width: 0.32em;
          height: 0.32em;
          left: -0.29em;
        }

        .small-content .reverse .arrows .arrow::after,
        .small-content-reverse .reverse .arrows .arrow::after {
          border: 0.32em solid white;
          border-top-color: transparent;
          border-bottom-color: transparent;
          border-right: none;
          right: -0.29em;
          top: -0.16em;
        }

        .small-content .reverse .arrows .arrow:last-child,
        .small-content-reverse .reverse .arrows .arrow:last-child {
          top: 0.064em;
          right: 0.427em;
        }

        /* Wild card */
        .wild {
          background-color: white;
          width: 5em;
          height: 8em;
          border-radius: 50%;
          transform: skewX(-25deg);
          overflow: hidden;
          font-size: 0;
          border: 0.06em solid white;
          margin: -1.5em 0 0 -1.2em;
        }

        .wild .segment {
          display: inline-block;
          width: 2.5em;
          height: 4em;
        }

        .wild .segment.red { background-color: #c11f1f; }
        .wild .segment.green { background-color: #3e9e32; }
        .wild .segment.yellow { background-color: #ded71f; }
        .wild .segment.blue { background-color: #3f4cff; }

        .small-content .wild,
        .small-content-reverse .wild {
          width: 0.64em;
          height: 1.04em;
          margin: -0.2em 0 0 -0.16em;
          border: 0.03em solid white;
        }

        .small-content .wild .segment,
        .small-content-reverse .wild .segment {
          width: 0.32em;
          height: 0.52em;
        }

        /* Plus Four card */
        .plus-four {
          width: 5em;
          height: 8em;
          position: relative;
          margin: -1.5em 0 0 -1.2em;
        }

        .plus-four div[class^='card'] {
          width: 1.5em;
          height: 2.5em;
          border-radius: 10%;
          border: 0.15em solid white;
          position: absolute;
        }

        .plus-four .card1 {
          background-color: #3e9e32;
          left: 5%;
          top: 50%;
        }

        .plus-four .card2 {
          background-color: #3f4cff;
          top: 25%;
          left: 25%;
        }

        .plus-four .card3 {
          background-color: #c11f1f;
          top: 35%;
          left: 45%;
        }

        .plus-four .card4 {
          background-color: #ded71f;
          top: 10%;
          left: 65%;
        }

        /* ============ ONE BUTTON ============ */
        .one-button-container {
          position: fixed;
          right: 2em;
          top: 50%;
          transform: translateY(-50%);
          z-index: 150;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1em;
        }

        .one-warning {
          background: rgba(244, 67, 54, 0.9);
          color: white;
          padding: 0.5em 1em;
          border-radius: 0.5em;
          font-weight: 700;
          font-size: 0.9em;
          animation: flash 1s infinite;
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.5);
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .one-button {
          width: 9em;
          height: 9em;
          border-radius: 50%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border: 0.3em solid white;
          box-shadow: 0 8px 24px rgba(245, 87, 108, 0.6);
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .one-button:hover {
          transform: scale(1.1);
          box-shadow: 0 12px 32px rgba(245, 87, 108, 0.8);
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
            transform: scale(1.05);
            box-shadow: 0 12px 32px rgba(245, 87, 108, 0.9);
          }
        }

        .one-logo {
          text-align: center;
        }

        .one-text {
          font-size: 3em;
          font-weight: 900;
          color: white;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
          line-height: 1;
        }

        .one-subtitle {
          font-size: 1.2em;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-top: 0.25em;
        }

        .one-hint {
          background: rgba(0, 0, 0, 0.7);
          padding: 0.5em 1em;
          border-radius: 0.5em;
          font-size: 0.85em;
          color: rgba(255, 255, 255, 0.9);
          text-align: center;
        }

        /* ============ MODALS ============ */
        .color-picker-modal,
        .emoji-picker-modal {
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
        }

        .color-btn:hover {
          transform: scale(1.05);
        }

        .color-btn-red { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); }
        .color-btn-yellow { background: linear-gradient(135deg, #feca57 0%, #ff9f43 100%); }
        .color-btn-green { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .color-btn-blue { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75em;
          margin-bottom: 1.5em;
        }

        .emoji-option {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.5em;
          padding: 0.75em;
          font-size: 1.5em;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emoji-option:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }

        /* ============ LOADING ============ */
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

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1200px) {
          .game-field {
            transform: translate(-50%, -50%) rotateX(30deg) scale(0.8);
          }
        }

        @media (max-width: 768px) {
          .game-field {
            transform: translate(-50%, -50%) rotateX(30deg) scale(0.6);
          }

          .game-header {
            padding: 0.5em 1em;
          }

          .game-title {
            font-size: 1.2em;
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
