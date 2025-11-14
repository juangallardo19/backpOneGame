"use client"

/**
 * GameProviderWrapper - Componente que envuelve el GameProvider
 * y maneja la redirección cuando el jugador es expulsado
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameProvider } from '@/contexts/GameContext';
import { useNotification } from '@/contexts/NotificationContext';

interface GameProviderWrapperProps {
  children: React.ReactNode;
}

export default function GameProviderWrapper({ children }: GameProviderWrapperProps) {
  const router = useRouter();
  const { error: showError, warning: showWarning } = useNotification();

  const handleKicked = useCallback(() => {
    console.log('🚫 Usuario fue expulsado, redirigiendo inmediatamente...');

    // Mostrar notificación
    showError(
      'Expulsado de la sala',
      'Has sido expulsado de la sala por el líder'
    );

    // Redirigir INMEDIATAMENTE a la página de selección de salas
    router.push('/rooms');

    // Clean up kick flags after navigation
    setTimeout(() => {
      localStorage.removeItem('uno_kicked_flag');
      localStorage.removeItem('uno_kicked_timestamp');
      console.log('🧹 Flags de expulsión limpiados después de redirección');
    }, 2000);
  }, [router, showError]);

  const handlePlayerKicked = useCallback((playerNickname: string) => {
    console.log('🚫 Jugador expulsado de la sala:', playerNickname);

    // Mostrar notificación a los demás jugadores
    showWarning(
      'Jugador expulsado',
      `${playerNickname} ha sido expulsado de la sala`
    );
  }, [showWarning]);

  return (
    <GameProvider onKicked={handleKicked} onPlayerKicked={handlePlayerKicked}>
      {children}
    </GameProvider>
  );
}