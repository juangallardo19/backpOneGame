'use client';

/**
 * RankingScreen - Pantalla de clasificación global
 * Muestra el TOP 100 y estadísticas del jugador
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Medal, TrendingUp, Users, Award } from 'lucide-react';
import { RankingEntry, PlayerStats } from '@/types/game.types';
import { rankingService } from '@/services/ranking.service';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';

interface RankingScreenProps {
  onBack: () => void;
}

const RankingScreen: React.FC<RankingScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { error: showError } = useNotification();

  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ============================================
  // CARGAR DATOS
  // ============================================

  useEffect(() => {
    loadRankingData();
  }, [user]);

  const loadRankingData = async () => {
    try {
      setIsLoading(true);

      // Cargar ranking global
      const rankingData = await rankingService.getGlobalRanking();
      setRankings(rankingData);
    } catch (error: any) {
      console.error('Error cargando ranking:', error);
      showError('Error', 'No se pudo cargar el ranking');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="fixed inset-0 z-50 bg-gradient-radial from-orange-500/20 via-red-600/20 to-black overflow-hidden">
      {/* Fondo animado */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            className="glass-button glass-button-secondary"
            size="lg"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Volver
          </Button>

          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Clasificación
          </h1>

          <div className="w-24" /> {/* Spacer para centrar título */}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <LoadingState />
          ) : (
            <GlobalRankingTab rankings={rankings} currentUserId={user?.id} />
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// TAB: RANKING GLOBAL
// ============================================

interface GlobalRankingTabProps {
  rankings: RankingEntry[];
  currentUserId?: string | number;
}

const GlobalRankingTab: React.FC<GlobalRankingTabProps> = ({ rankings, currentUserId }) => {
  return (
    <div className="glass-panel h-full overflow-auto p-4 md:p-6">
      <div className="space-y-2">
        {rankings.length === 0 ? (
          <div className="text-center text-white/60 py-12">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay datos de ranking disponibles</p>
          </div>
        ) : (
          rankings.map((entry) => (
            <RankingRow
              key={entry.userId}
              entry={entry}
              isCurrentUser={entry.userId === currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface RankingRowProps {
  entry: RankingEntry;
  isCurrentUser: boolean;
}

const RankingRow: React.FC<RankingRowProps> = ({ entry, isCurrentUser }) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-white/60 font-bold w-6 text-center">{rank}</span>;
  };

  return (
    <div
      className={`
        flex items-center gap-4 p-3 rounded-lg
        transition-all duration-200
        ${
          isCurrentUser
            ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50'
            : 'bg-white/5 hover:bg-white/10'
        }
      `}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-10 flex items-center justify-center">
        {getRankIcon(entry.rank)}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white font-bold">
          {entry.nickname.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{entry.nickname}</h3>
        <p className="text-xs text-white/60">
          {entry.totalWins} victorias • {entry.totalGames} partidas
        </p>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-yellow-400">{entry.points}</div>
        <div className="text-xs text-white/60">{entry.winRate.toFixed(1)}% victorias</div>
      </div>
    </div>
  );
};

// ============================================
// TAB: ESTADÍSTICAS DEL JUGADOR
// ============================================

interface PlayerStatsTabProps {
  stats: PlayerStats | null;
}

const PlayerStatsTab: React.FC<PlayerStatsTabProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="glass-panel h-full flex items-center justify-center">
        <div className="text-center text-white/60">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>No hay estadísticas disponibles</p>
          <p className="text-sm mt-2">Juega tu primera partida para ver tus stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel h-full overflow-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header del jugador */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            {stats.nickname.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{stats.nickname}</h2>
          {stats.rank && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full border border-yellow-500/50">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">Ranking #{stats.rank}</span>
            </div>
          )}
        </div>

        {/* Grid de estadísticas */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Victorias"
            value={stats.totalWins}
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            color="yellow"
          />
          <StatCard
            label="Partidas"
            value={stats.totalGames}
            icon={<Users className="w-6 h-6 text-blue-400" />}
            color="blue"
          />
          <StatCard
            label="% Victorias"
            value={`${stats.winRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6 text-green-400" />}
            color="green"
          />
          <StatCard
            label="Puntos"
            value={stats.totalPoints}
            icon={<Award className="w-6 h-6 text-purple-400" />}
            color="purple"
          />
        </div>

        {/* Rachas */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rachas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/60 text-sm mb-1">Racha Actual</p>
              <p className="text-2xl font-bold text-white">{stats.currentStreak}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-1">Mejor Racha</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.bestStreak}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'yellow' | 'blue' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorClasses = {
    yellow: 'border-yellow-500/50 bg-yellow-500/10',
    blue: 'border-blue-500/50 bg-blue-500/10',
    green: 'border-green-500/50 bg-green-500/10',
    purple: 'border-purple-500/50 bg-purple-500/10',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">{icon}</div>
      <p className="text-white/60 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

const LoadingState: React.FC = () => {
  return (
    <div className="glass-panel h-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/80">Cargando clasificación...</p>
      </div>
    </div>
  );
};

export default RankingScreen;
