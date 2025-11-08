'use client';

/**
 * NotificationToast - Componente visual de notificaciones
 * Renderiza toasts con el estilo glassmorphism del proyecto
 */

import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Notification } from '@/types/game.types';

const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// ============================================
// TOAST ITEM
// ============================================

interface ToastItemProps {
  notification: Notification;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onClose }) => {
  const { type, title, message } = notification;

  // Determinar icono y colores según el tipo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500/50';
      case 'error':
        return 'border-red-500/50';
      case 'warning':
        return 'border-yellow-500/50';
      case 'info':
      default:
        return 'border-blue-500/50';
    }
  };

  const getGlowColor = () => {
    switch (type) {
      case 'success':
        return 'shadow-green-500/20';
      case 'error':
        return 'shadow-red-500/20';
      case 'warning':
        return 'shadow-yellow-500/20';
      case 'info':
      default:
        return 'shadow-blue-500/20';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto
        bg-black/40 backdrop-blur-md
        border ${getBorderColor()}
        rounded-lg
        p-4
        shadow-lg ${getGlowColor()}
        animate-slide-in-right
        hover:scale-105
        transition-all duration-300
        min-w-[320px]
        max-w-md
      `}
      style={{
        animation: 'slideInRight 0.3s ease-out',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
          <p className="text-white/80 text-xs leading-relaxed">{message}</p>
        </div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors duration-200"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barra de progreso (si tiene duración) */}
      {notification.duration && notification.duration > 0 && (
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor(type)}`}
            style={{
              animation: `shrink ${notification.duration}ms linear`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// Helper para color de barra de progreso
const getProgressBarColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
    default:
      return 'bg-blue-500';
  }
};

// Agregar estilos de animación al documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    .animate-slide-in-right {
      animation: slideInRight 0.3s ease-out;
    }
  `;
  document.head.appendChild(styleSheet);
}

export default NotificationToast;
