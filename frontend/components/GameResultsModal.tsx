'use client';

/**
 * GameResultsModal - Modal que muestra la tabla de resultados al finalizar el juego
 *
 * Características:
 * - Muestra animación de victoria durante 5 segundos (solo al jugador ganador)
 * - Muestra la tabla de posiciones ordenada con diseño negro/rojo
 * - Indica puntos ganados por cada jugador
 * - Destaca al ganador con ribbon rojo
 * - Botones para volver a la sala
 */

import React, { useState, useEffect } from 'react';
import { GameEndResult, PlayerResult } from '@/types/game.types';
import VictoryAnimation from './VictoryAnimation';
import { useAuth } from '@/contexts/AuthContext';
import HalftoneWaves from './halftone-waves';

interface GameResultsModalProps {
  results: GameEndResult;
  onClose: () => void;
}

const GameResultsModal: React.FC<GameResultsModalProps> = ({ results, onClose }) => {
  const { user } = useAuth();

  // Verificar si el usuario actual es el ganador
  // Buscar en playerRankings al ganador (position === 1) y comparar con el usuario actual
  const winnerResult = results.playerRankings.find(p => p.position === 1);

  // Obtener userId: primero intentar de user.id, sino de localStorage
  const getUserId = () => {
    if (user?.id) return user.id;

    // Fallback: obtener de localStorage
    try {
      const storedUser = localStorage.getItem('uno_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        return parsedUser.userId || parsedUser.id;
      }
    } catch (error) {
      console.error('Error obteniendo userId de localStorage:', error);
    }

    return null;
  };

  const currentUserId = getUserId();

  // IMPORTANTE: Para usuarios autenticados, solo comparar por userId
  const isCurrentUserWinner = user && winnerResult &&
    winnerResult.userId !== null &&
    currentUserId !== null &&
    String(winnerResult.userId) === String(currentUserId);

  // Debug log para verificar la comparación
  console.log('🏆 Victory Animation Debug:');
  console.log('   📋 Game Results:', results);
  console.log('   👤 Current User:', {
    id: user?.id,
    idType: typeof user?.id,
    nickname: user?.nickname,
    email: user?.email
  });
  console.log('   🆔 Current User ID (obtenido):', currentUserId, 'type:', typeof currentUserId);
  console.log('   🏆 Winner from rankings:', winnerResult);
  console.log('   🔍 Detailed comparison:');
  console.log('      - winnerResult.userId:', winnerResult?.userId, 'type:', typeof winnerResult?.userId);
  console.log('      - currentUserId:', currentUserId, 'type:', typeof currentUserId);
  console.log('      - String(winnerResult.userId):', String(winnerResult?.userId));
  console.log('      - String(currentUserId):', String(currentUserId));
  console.log('      - Are they equal?:', String(winnerResult?.userId) === String(currentUserId));
  console.log('   ✅ Is Current User Winner:', isCurrentUserWinner);

  // Inicializar estado en false
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    console.log('🎬 useEffect ejecutado - isCurrentUserWinner:', isCurrentUserWinner);

    // Si el usuario es el ganador, mostrar animación
    if (isCurrentUserWinner) {
      console.log('✅ Usuario es ganador - mostrando animación');
      setShowAnimation(true);

      // Después de 5 segundos, ocultar la animación y mostrar la tabla
      const timer = setTimeout(() => {
        console.log('⏰ 5 segundos pasados - ocultando animación');
        setShowAnimation(false);
      }, 5000);

      return () => {
        console.log('🧹 Limpiando timer');
        clearTimeout(timer);
      };
    } else {
      console.log('❌ Usuario NO es ganador - sin animación');
      setShowAnimation(false);
    }
  }, [isCurrentUserWinner]);

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
    <>
      {/* Background animado con halftone waves */}
      <div className="fixed inset-0 z-40">
        <HalftoneWaves animate={false} />
      </div>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md">
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
            235deg,
            hsl(0 70% 20% / 0.5),
            hsl(0 70% 20% / 0) 33%
          ),
          linear-gradient(
            45deg,
            hsl(10 60% 15% / 0.5),
            hsl(10 60% 15% / 0) 33%
          ),
          linear-gradient(hsl(0deg 25% 8% / 0.4));
          border-radius: 22px;
          border: 1px solid rgba(220, 20, 60, 0.3);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                      0 0 0 1px rgba(220, 20, 60, 0.15),
                      0 0 40px rgba(220, 20, 60, 0.1);
          backdrop-filter: blur(12px);
          overflow: hidden;
          animation: slideIn 0.4s ease-out;
          position: relative;
        }

        .results-header {
          background: linear-gradient(
            135deg,
            rgba(220, 20, 60, 0.2) 0%,
            rgba(255, 99, 71, 0.15) 50%,
            rgba(220, 20, 60, 0.2) 100%
          );
          padding: clamp(1.5rem, 4vw, 2rem);
          text-align: center;
          border-bottom: 1px solid rgba(220, 20, 60, 0.3);
        }

        .results-title {
          font-size: clamp(1.5rem, 5vw, 2rem);
          font-weight: 700;
          color: #FFFFFF;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8),
                       0 0 16px rgba(255, 255, 255, 0.3),
                       0 0 24px rgba(220, 20, 60, 0.2);
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
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.2));
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          backdrop-filter: blur(8px);
        }

        .player-row:hover {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.1), rgba(255, 99, 71, 0.05));
          border-color: rgba(220, 20, 60, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(220, 20, 60, 0.2);
        }

        .winner-row {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.3), rgba(255, 99, 71, 0.2));
          border: 2px solid rgba(220, 20, 60, 0.8);
          box-shadow: 0 0 30px rgba(220, 20, 60, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.4);
          animation: redGlow 2s ease-in-out infinite;
        }

        .winner-row:hover {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.4), rgba(255, 99, 71, 0.3));
          border-color: rgba(220, 20, 60, 1);
          transform: translateY(-3px);
          box-shadow: 0 0 40px rgba(220, 20, 60, 0.4),
                      0 6px 20px rgba(0, 0, 0, 0.5);
        }

        .position-badge {
          min-width: clamp(2.5rem, 8vw, 3.5rem);
          height: clamp(2.5rem, 8vw, 3.5rem);
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .winner-row .position-badge {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.8), rgba(255, 99, 71, 0.6));
          border: 2px solid rgba(220, 20, 60, 1);
          color: #FFFFFF;
          box-shadow: 0 0 20px rgba(220, 20, 60, 0.6),
                      0 4px 8px rgba(0, 0, 0, 0.4);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8),
                       0 0 15px rgba(220, 20, 60, 0.6);
          font-weight: 800;
        }

        @keyframes redGlow {
          0%, 100% {
            box-shadow: 0 0 30px rgba(220, 20, 60, 0.3),
                        0 4px 16px rgba(0, 0, 0, 0.4);
          }
          50% {
            box-shadow: 0 0 40px rgba(220, 20, 60, 0.5),
                        0 6px 20px rgba(0, 0, 0, 0.5);
          }
        }

        .player-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .player-name {
          font-size: clamp(1rem, 3.5vw, 1.25rem);
          font-weight: 700;
          color: #FFFFFF;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .winner-row .player-name {
          color: #FFFFFF;
          font-weight: 800;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8),
                       0 0 20px rgba(220, 20, 60, 0.6);
          letter-spacing: 0.1em;
        }

        .bot-label {
          font-size: clamp(0.7rem, 2vw, 0.85rem);
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.1em;
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
          color: rgba(255, 255, 255, 0.6);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .winner-row .stat-label {
          color: rgba(255, 255, 255, 0.8);
          font-weight: 700;
        }

        .stat-value {
          font-size: clamp(1rem, 3vw, 1.25rem);
          font-weight: 700;
          color: #FFFFFF;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .points-earned {
          color: #FFFFFF;
        }

        .winner-row .points-earned {
          color: #FFFFFF;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8),
                       0 0 15px rgba(220, 20, 60, 0.6);
          font-weight: 800;
        }

        .results-footer {
          padding: clamp(1.5rem, 4vw, 2rem) clamp(1rem, 3vw, 1.5rem);
          border-top: 1px solid rgba(220, 20, 60, 0.3);
          display: flex;
          justify-content: center;
        }

        .back-button {
          padding: clamp(0.75rem, 2.5vw, 1rem) clamp(2.5rem, 7vw, 4rem);
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.2), rgba(255, 99, 71, 0.1));
          border: 2px solid rgba(220, 20, 60, 0.6);
          border-radius: 8px;
          color: #FFFFFF;
          font-size: clamp(0.9rem, 3vw, 1rem);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 0 20px rgba(220, 20, 60, 0.2);
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .back-button:hover {
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.4), rgba(255, 99, 71, 0.3));
          border-color: rgba(220, 20, 60, 1);
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 0 30px rgba(220, 20, 60, 0.4),
                      0 4px 16px rgba(0, 0, 0, 0.4);
        }

        .back-button:active {
          transform: translateY(0);
          background: linear-gradient(135deg, rgba(220, 20, 60, 0.5), rgba(255, 99, 71, 0.4));
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
    </>
  );
};

export default GameResultsModal;