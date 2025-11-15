'use client';

/**
 * GameResultsModal - Modal que muestra la tabla de resultados al finalizar el juego
 *
 * Características:
 * - Muestra animación de victoria durante 3 segundos
 * - Muestra la tabla de posiciones ordenada
 * - Indica puntos ganados por cada jugador
 * - Destaca al ganador
 * - Permite volver a la sala
 */

import React, { useState, useEffect } from 'react';
import { GameEndResult, PlayerResult } from '@/types/game.types';
import { Trophy, Medal, Crown, Star, Users, Clock, Target } from 'lucide-react';
import VictoryAnimation from './VictoryAnimation';

interface GameResultsModalProps {
  results: GameEndResult;
  onClose: () => void;
}

const GameResultsModal: React.FC<GameResultsModalProps> = ({ results, onClose }) => {
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    // Después de 3 segundos, ocultar la animación y mostrar la tabla
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);
  /**
   * Get medal icon based on position
   */
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-7 h-7 text-gray-300" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Target className="w-5 h-5 text-gray-400" />;
    }
  };

  /**
   * Get row background color based on position
   */
  const getRowColor = (position: number, isWinner: boolean) => {
    if (isWinner) return 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/30';
    if (position === 1) return 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/20';
    if (position === 2) return 'bg-gradient-to-r from-gray-800/40 to-gray-700/20';
    if (position === 3) return 'bg-gradient-to-r from-amber-900/40 to-amber-800/20';
    return 'bg-gray-800/20';
  };

  /**
   * Get points color based on amount
   */
  const getPointsColor = (points: number) => {
    if (points >= 50) return 'text-yellow-400';
    if (points >= 10) return 'text-green-400';
    return 'text-gray-400';
  };

  // Si se está mostrando la animación, renderizar solo la animación
  if (showAnimation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <VictoryAnimation />
      </div>
    );
  }

  // Después de 3 segundos, mostrar la tabla de resultados
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl shadow-2xl border-2 border-purple-500/30 overflow-hidden animate-fadeIn">

        {/* Confetti effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 text-center border-b border-purple-500/30">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            🎮 ¡Partida Finalizada!
          </h2>
          <p className="text-xl text-purple-300">
            Ganador: <span className="font-bold text-yellow-400">{results.winnerNickname}</span>
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{results.durationMinutes} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{results.totalPlayers} jugadores</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>{results.totalCardsPlayed} cartas jugadas</span>
            </div>
          </div>
        </div>

        {/* Rankings table */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {results.playerRankings.map((player: PlayerResult) => (
              <div
                key={player.userId || player.nickname}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300
                  ${getRowColor(player.position, player.isWinner)}
                  ${player.isWinner ? 'border-yellow-400/50 shadow-lg shadow-yellow-500/20' : 'border-purple-500/20'}
                  hover:scale-105 hover:shadow-xl
                `}
              >
                {/* Position & Medal */}
                <div className="flex items-center justify-center w-16 h-16 bg-gray-900/50 rounded-full border-2 border-purple-500/30">
                  {getMedalIcon(player.position)}
                </div>

                {/* Player info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {player.nickname}
                    </h3>
                    {player.isBot && (
                      <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                        🤖 Bot
                      </span>
                    )}
                    {player.isWinner && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded-full border border-yellow-500/30 animate-pulse">
                        👑 Ganador
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 mt-1 text-sm text-gray-400">
                    <span>🃏 {player.remainingCards} cartas</span>
                    <span>💰 {player.handPoints} pts en mano</span>
                  </div>
                </div>

                {/* Points earned */}
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getPointsColor(player.pointsEarned)}`}>
                    +{player.pointsEarned}
                  </div>
                  <div className="text-xs text-gray-400">puntos</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-purple-500/30 bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 hover:scale-105"
          >
            Volver a la sala
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        :global(.animate-fadeIn) {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GameResultsModal;