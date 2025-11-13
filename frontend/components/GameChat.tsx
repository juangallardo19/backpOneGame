"use client"

/**
 * GameChat - Real-time chat component
 * RF45, RF49: Real-time chat in game room
 *
 * Uses GameContext WebSocket for real-time messaging
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, X } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage } from '@/types/game.types';

interface GameChatProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function GameChat({ isMinimized = false, onToggleMinimize }: GameChatProps) {
  const { chatMessages, sendMessage } = useGame();
  const { user } = useAuth();

  const [message, setMessage] = useState('');
  const [isOpen, setIsOpen] = useState(!isMinimized);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      console.log('💬 Enviando mensaje:', message.trim());
      // Send message via WebSocket (RF45, RF49)
      sendMessage(message.trim());
      console.log('✅ Mensaje enviado correctamente');
      setMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (onToggleMinimize) {
      onToggleMinimize();
    }
  };

  return (
    <div className={`game-chat ${isOpen ? 'open' : 'minimized'}`}>
      {/* Header */}
      <div className="chat-header" onClick={toggleChat}>
        <div className="chat-title">
          <MessageCircle size={18} />
          <span>Chat ({chatMessages.length})</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="minimize-btn"
          onClick={(e) => {
            e.stopPropagation();
            toggleChat();
          }}
        >
          {isOpen ? <X size={16} /> : <MessageCircle size={16} />}
        </Button>
      </div>

      {/* Messages */}
      {isOpen && (
        <>
          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="empty-chat">
                <MessageCircle size={32} className="opacity-30" />
                <p className="text-sm text-white/50">No messages yet</p>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                // Compare with user email instead of id since playerId might be different
                const isOwnMessage = msg.playerNickname === user?.nickname || msg.playerId === user?.id;

                return (
                  <div
                    key={`${msg.timestamp}-${index}`}
                    className={`chat-message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                  >
                    <div className="message-header">
                      <span className="sender-name">{msg.playerNickname}</span>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-content">{msg.message}</div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <Input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              className="chat-input"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="send-btn"
            >
              <Send size={16} />
            </Button>
          </form>
        </>
      )}

      <style jsx>{`
        .game-chat {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 350px;
          max-height: 500px;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          z-index: 1000;
        }

        .game-chat.minimized {
          width: 200px;
          max-height: 60px;
        }

        .chat-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px 16px 0 0;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .minimize-btn {
          color: white;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .minimize-btn:hover {
          opacity: 1;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 350px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .empty-chat {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
          gap: 0.5rem;
        }

        .chat-message {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .own-message {
          align-items: flex-end;
        }

        .other-message {
          align-items: flex-start;
        }

        .message-header {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.75rem;
        }

        .sender-name {
          font-weight: 600;
          color: #60A5FA;
        }

        .own-message .sender-name {
          color: #10B981;
        }

        .message-time {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.7rem;
        }

        .message-content {
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          color: white;
          font-size: 0.9rem;
          max-width: 80%;
          word-wrap: break-word;
        }

        .own-message .message-content {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .other-message .message-content {
          background: rgba(96, 165, 250, 0.2);
          border: 1px solid rgba(96, 165, 250, 0.3);
        }

        .chat-input-form {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0 0 16px 16px;
        }

        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }

        .chat-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .chat-input:focus {
          outline: none;
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
        }

        .send-btn {
          background: rgba(16, 185, 129, 0.8);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 1);
          transform: scale(1.05);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .game-chat {
            width: 90vw;
            max-width: 350px;
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
}