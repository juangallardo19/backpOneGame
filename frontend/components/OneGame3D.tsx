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
 * - Emotes support
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Hand, MessageCircle, Smile } from 'lucide-react';
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
  const { gameState, playCard, drawCard, callUno, chatMessages, sendEmote, isMyTurn: isMyTurnFn, gameResults, clearGameResults, room } = useGame();
  const { user } = useAuth();
  const { success, error: showError } = useNotification();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [playerEmojis, setPlayerEmojis] = useState<Record<string, string>>({});

  // Get current player from gameState
  const currentPlayer: CurrentPlayer | null | undefined = gameState?.currentPlayer;
  // FIXED: Use the isMyTurn function from context instead of comparing user.id
  // user.id is the database user ID (e.g., "9"), but we need to compare player IDs (UUID)
  const isMyTurn = isMyTurnFn();

  // Check if current turn player is a bot
  const currentTurnPlayer = gameState?.players?.find(p => p.id === gameState?.currentTurnPlayerId);
  const isBotTurn = currentTurnPlayer?.isBot || false;

  // Check if player should call ONE
  const shouldCallUno = currentPlayer && currentPlayer.hand.length === 1 && !currentPlayer.calledOne;

  // Log gameState changes
  useEffect(() => {
    console.log('🎮 ========== ONE GAME 3D - GAMESTATE UPDATED ==========');
    console.log('   📊 gameState:', gameState);
    console.log('   👤 user:', user);
    console.log('   🎴 currentPlayer:', currentPlayer);
    console.log('   🃏 currentPlayer.hand:', currentPlayer?.hand);
    console.log('   📏 hand size:', currentPlayer?.hand?.length);
    console.log('   🎯 isMyTurn:', isMyTurn);
    console.log('   🎲 currentTurnPlayerId:', gameState?.currentTurnPlayerId);
    console.log('   🆔 currentPlayer.id:', currentPlayer?.id);
    if (currentPlayer?.hand) {
      console.log('   🎴 Cards in hand:');
      for (const card of currentPlayer.hand) {
        console.log(`      - ${card.color} ${card.value} (${card.id})`);
      }
    }
    console.log('✅ =================================================');
  }, [gameState, currentPlayer, isMyTurn, user]);

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
    console.log('📥 ========== HANDLE DRAW CARD ==========');
    console.log('   🎯 isMyTurn:', isMyTurn);
    console.log('   👤 user:', user);
    console.log('   🎮 gameState:', gameState);

    if (!isMyTurn) {
      console.log('   ❌ Not your turn');
      showError("Not your turn", "Wait for your turn to draw");
      return;
    }

    try {
      console.log('   📤 Calling drawCard()...');
      await drawCard();
      console.log('   ✅ drawCard() completed');
      success("Card drawn", "You drew a card");
    } catch (error: any) {
      console.error('   ❌ Error in drawCard():', error);
      showError("Error", error.message || "Could not draw card");
    }
    console.log('✅ =================================================');
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
    console.log('🔙 Closing game results modal and returning to previous page');
    clearGameResults();
    // Use onBack callback if available, otherwise go home
    if (onBack) {
      onBack();
    } else {
      router.push('/');
    }
  };

  // Available emojis
  const availableEmojis = ['😀', '😂', '😎', '🔥', '👍', '❤️', '😮', '😤', '🎉', '💪', '🤔', '👏'];

  // Handle send emote
  const handleSendEmote = (emoji: string) => {
    sendEmote(emoji);
    setShowEmojiPicker(false);

    // Show emoji on player for 3 seconds
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

  // Listen to emotes from other players
  useEffect(() => {
    const latestMessage = chatMessages[chatMessages.length - 1];
    if (latestMessage && latestMessage.type === 'EMOTE' && latestMessage.playerId !== currentPlayer?.id) {
      // Show emoji on that player
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

  // Get card symbol based on type (fixed to use type instead of value)
  const getCardSymbol = (card: Card) => {
    // For special cards, use type to determine symbol
    switch (card.type) {
      case 'SKIP':
        return '⊘';
      case 'REVERSE':
        return '⟲';
      case 'DRAW_TWO':
        return '+2';
      case 'WILD':
        return '🎨';
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
    if (!gameState?.topCard) return true; // First card can be anything

    const topCard = gameState.topCard;

    // Wild cards can always be played
    if (card.color === 'WILD' || card.type === 'WILD') {
      return true;
    }

    // Match color
    if (card.color === topCard.color) {
      return true;
    }

    // Match value
    if (card.value === topCard.value) {
      return true;
    }

    // Match type (for action cards)
    if (card.type === topCard.type && card.type !== 'NUMBER') {
      return true;
    }

    return false;
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
          <p className={`game-status ${isBotTurn ? 'bot-thinking' : ''}`}>
            {isMyTurn
              ? "🎯 Your Turn!"
              : isBotTurn
                ? `🤖 ${currentTurnPlayer?.nickname} thinking...`
                : `Waiting for ${gameState.currentPlayer?.nickname || "player"}...`
            }
          </p>
        </div>

        <div className="game-actions">
          {/* RF50: Emoji button */}
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
            .map((player, idx) => (
              <div key={player.id} className="player-card">
                <div className="player-info">
                  <span className="player-name">{player.nickname}</span>
                  <span className="player-cards">{player.cardCount} cards</span>
                </div>
                {gameState.currentTurnPlayerId === player.id && (
                  <div className="turn-indicator">🎯</div>
                )}
                {/* RF50: Show emoji on player profile */}
                {playerEmojis[player.id] && (
                  <div className="player-emoji">{playerEmojis[player.id]}</div>
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
                <div className="card-value">{getCardSymbol(gameState.topCard)}</div>
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
              // FIXED: Use local canPlayCard function instead of playableCardIds
              const canPlay = canPlayCard(card);

              return (
                <div
                  key={card.id}
                  className={`hand-card ${getCardColorClass(card.color)} ${
                    canPlay && isMyTurn ? 'playable' : 'disabled'
                  } ${selectedCardId === card.id ? 'selected' : ''}`}
                  onClick={() => canPlay && isMyTurn ? handlePlayCard(card.id) : null}
                >
                  <div className="card-value-small">{getCardSymbol(card)}</div>
                  <div className="card-symbol">
                    {getCardSymbol(card)}
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

      {/* Emoji Picker Modal (RF50) */}
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

        /* LEFT SIDEBAR: Chat + Player Stats */
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

        /* RIGHT SIDEBAR: UNO Button */
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

        .player-emoji {
          position: absolute;
          bottom: -10px;
          right: -10px;
          font-size: 2rem;
          animation: emoji-bounce 0.5s;
        }

        @keyframes emoji-bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
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

        .card-value, .card-color {
          font-weight: 800;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
        }

        .card-value {
          font-size: 3rem;
        }

        .card-color {
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .card-red { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); }
        .card-yellow { background: linear-gradient(135deg, #feca57 0%, #ee5a6f 100%); }
        .card-green { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .card-blue { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }
        .card-wild { background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%); }

        .player-hand {
          width: 100%;
          max-width: 800px;
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

        .hand-card {
          width: 80px;
          height: 120px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s;
          border: 2px solid white;
          cursor: pointer;
          position: relative;
        }

        .hand-card.playable {
          transform: translateY(-10px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(76, 175, 80, 0.6);
          border-color: #4CAF50;
        }

        .hand-card.playable:hover {
          transform: translateY(-15px) scale(1.05);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 30px rgba(76, 175, 80, 0.8);
        }

        .hand-card.disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .hand-card.selected {
          transform: translateY(-20px) scale(1.1);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.5), 0 0 30px rgba(33, 150, 243, 0.8);
          border-color: #2196F3;
        }

        .card-value-small {
          font-size: 0.8rem;
          font-weight: 700;
          position: absolute;
          top: 5px;
          left: 5px;
        }

        .card-symbol {
          font-size: 2rem;
          font-weight: 800;
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

        .color-picker-modal, .emoji-picker-modal {
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

        .color-btn-red { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); }
        .color-btn-yellow { background: linear-gradient(135deg, #feca57 0%, #ff9f43 100%); }
        .color-btn-green { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); }
        .color-btn-blue { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); }

        .emoji-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .emoji-option {
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emoji-option:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }

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
          margin-bottom: 1rem;
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