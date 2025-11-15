'use client';

/**
 * GameResultsModal - Modal que muestra la tabla de resultados al finalizar el juego
 *
 * Características:
 * - Muestra animación de victoria durante 5 segundos
 * - Muestra la tabla de posiciones ordenada con diseño negro/rojo
 * - Indica puntos ganados por cada jugador
 * - Destaca al ganador con ribbon rojo
 * - Botones para volver a la sala
 */

import React, { useState, useEffect } from 'react';
import { GameEndResult, PlayerResult } from '@/types/game.types';
import VictoryAnimation from './VictoryAnimation';

interface GameResultsModalProps {
  results: GameEndResult;
  onClose: () => void;
}

const GameResultsModal: React.FC<GameResultsModalProps> = ({ results, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Después de 5 segundos, ocultar la animación y mostrar la tabla
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Si se está mostrando la animación, renderizar solo la animación
  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <VictoryAnimation />
      </div>
    );
  }

  // Después de 5 segundos, mostrar la tabla de resultados
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <h1 className="results-title">Clasificación Final</h1>
        </div>

        {/* Leaderboard Table */}
        <div className="results-table">
          {results.playerRankings.slice(0, 4).map((player: PlayerResult) => (
            <div
              key={player.userId || player.nickname}
              className={`player-row ${player.position === 1 ? 'winner-row' : ''}`}
            >
              {/* Position */}
              <div className="position-badge">
                {player.position}
              </div>

              {/* Player Info */}
              <div className="player-info">
                <div className="player-name">{player.nickname}</div>
                {player.isBot && <div className="bot-label">BOT</div>}
              </div>

              {/* Stats */}
              <div className="player-stats">
                <div className="stat-item">
                  <span className="stat-label">Cartas:</span>
                  <span className="stat-value">{player.remainingCards}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Puntos:</span>
                  <span className="stat-value points-earned">+{player.pointsEarned}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Button */}
        <div className="results-footer">
          <button className="back-button" onClick={onClose}>
            Volver a la Sala
          </button>
        </div>
      </div>

      <style jsx>{`
        .results-container {
          width: clamp(320px, 90%, 600px);
          background: linear-gradient(
            135deg,
            rgba(17, 17, 17, 0.98) 0%,
            rgba(25, 25, 25, 0.95) 100%
          );
          border-radius: 20px;
          border: 2px solid rgba(220, 38, 38, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      0 0 0 1px rgba(220, 38, 38, 0.1);
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
        }

        .results-header {
          background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.9) 0%,
            rgba(153, 27, 27, 0.9) 100%
          );
          padding: clamp(1.5rem, 4vw, 2rem);
          text-align: center;
          border-bottom: 2px solid rgba(220, 38, 38, 0.5);
        }

        .results-title {
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 700;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .results-table {
          padding: clamp(1rem, 3vw, 1.5rem);
          display: flex;
          flex-direction: column;
          gap: clamp(0.75rem, 2vw, 1rem);
        }

        .player-row {
          display: flex;
          align-items: center;
          gap: clamp(0.75rem, 2.5vw, 1.25rem);
          padding: clamp(1rem, 3vw, 1.25rem);
          background: rgba(30, 30, 30, 0.6);
          border-radius: 12px;
          border: 1px solid rgba(60, 60, 60, 0.5);
          transition: all 0.3s ease;
        }

        .player-row:hover {
          background: rgba(40, 40, 40, 0.7);
          border-color: rgba(220, 38, 38, 0.3);
          transform: translateX(5px);
        }

        .winner-row {
          background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.25) 0%,
            rgba(153, 27, 27, 0.15) 100%
          );
          border: 2px solid rgba(220, 38, 38, 0.6);
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.2);
        }

        .winner-row:hover {
          background: linear-gradient(
            135deg,
            rgba(220, 38, 38, 0.35) 0%,
            rgba(153, 27, 27, 0.25) 100%
          );
          border-color: rgba(220, 38, 38, 0.8);
          transform: translateX(5px) scale(1.02);
        }

        .position-badge {
          min-width: clamp(2.5rem, 8vw, 3.5rem);
          height: clamp(2.5rem, 8vw, 3.5rem);
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
          border: 2px solid rgba(220, 38, 38, 0.4);
          border-radius: 10px;
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: #dc2626;
          text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
        }

        .winner-row .position-badge {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border-color: #fca5a5;
          color: #ffffff;
          box-shadow: 0 0 15px rgba(220, 38, 38, 0.6);
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-name {
          font-size: clamp(1rem, 3.5vw, 1.25rem);
          font-weight: 600;
          color: #ffffff;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .winner-row .player-name {
          color: #fca5a5;
          font-weight: 700;
        }

        .bot-label {
          font-size: clamp(0.7rem, 2vw, 0.85rem);
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .player-stats {
          display: flex;
          gap: clamp(0.75rem, 3vw, 1.5rem);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .stat-label {
          font-size: clamp(0.7rem, 2vw, 0.85rem);
          color: #9ca3af;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: clamp(1rem, 3vw, 1.25rem);
          font-weight: 700;
          color: #e5e7eb;
        }

        .points-earned {
          color: #dc2626;
        }

        .winner-row .points-earned {
          color: #fca5a5;
          text-shadow: 0 0 10px rgba(220, 38, 38, 0.5);
        }

        .results-footer {
          padding: clamp(1rem, 3vw, 1.5rem);
          border-top: 1px solid rgba(60, 60, 60, 0.5);
          display: flex;
          justify-content: center;
        }

        .back-button {
          padding: clamp(0.75rem, 2.5vw, 1rem) clamp(2rem, 6vw, 3rem);
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: clamp(1rem, 3vw, 1.15rem);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }

        .back-button:hover {
          background: linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
        }

        .back-button:active {
          transform: translateY(0);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 500px) {
          .results-container {
            width: 95%;
          }

          .player-row {
            flex-wrap: wrap;
          }

          .player-stats {
            width: 100%;
            justify-content: space-around;
            margin-top: 0.5rem;
            padding-top: 0.75rem;
            border-top: 1px solid rgba(60, 60, 60, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default GameResultsModal;