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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fbfaff] backdrop-blur-sm">
      <main className="leaderboard-main">
        {/* Header */}
        <div className="header">
          <h1>Ranking</h1>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard">
          <div className="ribbon"></div>
          <table>
            <tbody>
              {results.playerRankings.slice(0, 4).map((player: PlayerResult, index: number) => (
                <tr key={player.userId || player.nickname} className={index === 0 ? 'first-place' : ''}>
                  <td className="number">{player.position}</td>
                  <td className="name">
                    {player.nickname}
                    {player.isBot && <span className="bot-badge">🤖</span>}
                  </td>
                  <td className="points">
                    {player.pointsEarned} pts
                    {player.position === 1 && (
                      <img
                        className="gold-medal"
                        src="https://github.com/malunaridev/Challenges-iCodeThis/blob/master/4-leaderboard/assets/gold-medal.png?raw=true"
                        alt="gold medal"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Buttons */}
          <div className="buttons">
            <button className="continue" onClick={onClose}>
              Volver a la Sala
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        .leaderboard-main {
          width: clamp(320px, 90%, 40rem);
          min-height: 43rem;
          background-color: #ffffff;
          box-shadow: 0px 5px 15px 8px rgba(228, 231, 251, 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          border-radius: 0.5rem;
          animation: fadeIn 0.5s ease-out forwards;
        }

        .header {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
        }

        h1 {
          font-family: "Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: clamp(1.5rem, 4vw, 1.7rem);
          color: #141a39;
          text-transform: uppercase;
          font-weight: 500;
        }

        .leaderboard {
          width: 100%;
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          color: #141a39;
          margin-bottom: 2rem;
        }

        tbody tr {
          transition: all 0.2s ease-in-out;
          border-radius: 0.2rem;
        }

        tbody tr:not(.first-place):hover {
          background-color: #fff;
          transform: scale(1.05);
          box-shadow: 0px 5px 15px 8px rgba(228, 231, 251, 0.8);
        }

        tbody tr:nth-child(odd):not(.first-place) {
          background-color: #f9f9f9;
        }

        tbody tr.first-place {
          color: #fff;
          background-color: transparent;
        }

        td {
          height: 5rem;
          font-family: "Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: clamp(1.1rem, 3vw, 1.4rem);
          padding: 1rem 2rem;
          position: relative;
        }

        .number {
          width: 3rem;
          font-size: clamp(1.8rem, 5vw, 2.2rem);
          font-weight: bold;
          text-align: left;
        }

        .name {
          text-align: left;
          font-size: clamp(1rem, 3vw, 1.2rem);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bot-badge {
          font-size: 0.9rem;
        }

        .points {
          font-weight: bold;
          font-size: clamp(1.1rem, 3vw, 1.3rem);
          display: flex;
          justify-content: flex-end;
          align-items: center;
          text-align: right;
        }

        .gold-medal {
          height: 3rem;
          margin-left: 1rem;
        }

        .ribbon {
          width: calc(100% + 2rem);
          height: 5.5rem;
          top: -0.5rem;
          background-color: #dc2626;
          position: absolute;
          left: -1rem;
          box-shadow: 0px 15px 11px -6px rgba(122, 122, 125, 0.5);
          z-index: 0;
        }

        .ribbon::before {
          content: "";
          height: 1.5rem;
          width: 1.5rem;
          bottom: -0.8rem;
          left: 0.35rem;
          transform: rotate(45deg);
          background-color: #991b1b;
          position: absolute;
          z-index: -1;
        }

        .ribbon::after {
          content: "";
          height: 1.5rem;
          width: 1.5rem;
          bottom: -0.8rem;
          right: 0.35rem;
          transform: rotate(45deg);
          background-color: #991b1b;
          position: absolute;
          z-index: -1;
        }

        .buttons {
          width: 100%;
          padding: 0 2rem 3rem;
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-top: auto;
        }

        .continue {
          width: 14rem;
          height: 3.5rem;
          font-family: "Rubik", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: clamp(1.1rem, 3vw, 1.3rem);
          color: #fff;
          text-transform: uppercase;
          background-color: #dc2626;
          border: 0;
          border-bottom: 0.3rem solid #991b1b;
          border-radius: 2rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .continue:hover {
          background-color: #b91c1c;
          transform: translateY(-2px);
        }

        .continue:active {
          border-bottom: 0;
          transform: translateY(0);
        }

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

        @media (max-width: 740px) {
          .leaderboard-main {
            width: 95%;
          }

          td {
            padding: 0.8rem 1rem;
          }
        }

        @media (max-width: 500px) {
          .gold-medal {
            height: 2.5rem;
            margin-left: 0.5rem;
          }

          .ribbon {
            height: 5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GameResultsModal;