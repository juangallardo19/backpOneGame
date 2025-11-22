'use client';

/**
 * NotificationContext - Sistema de notificaciones toast
 * Maneja mensajes de éxito, error, advertencia e información
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Notification } from '@/types/game.types';

// ============================================
// INTERFACES
// ============================================

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  clearAll: () => void;
}

// ============================================
// CONTEXT
// ============================================

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);

  // Durante SSR o si no hay provider, devolver valores por defecto
  if (!context) {
    // En desarrollo, advertir pero no fallar
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('useNotification called outside NotificationProvider, returning defaults');
    }

    // Devolver valores por defecto seguros para SSR
    return {
      notifications: [],
      addNotification: () => '',
      removeNotification: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      clearAll: () => {},
    };
  }

  return context;
};

// ============================================
// PROVIDER
// ============================================

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // ============================================
  // FUNCTIONS
  // ============================================

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000, // 5 segundos por defecto
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-remover después del tiempo especificado
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [removeNotification]);

  const success = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'success',
        title,
        message,
        duration,
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'error',
        title,
        message,
        duration: duration || 7000, // Errores duran más
      });
    },
    [addNotification]
  );

  const info = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'info',
        title,
        message,
        duration,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message: string, duration?: number) => {
      addNotification({
        type: 'warning',
        title,
        message,
        duration: duration || 6000,
      });
    },
    [addNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: NotificationContextValue = useMemo(() => ({
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
    clearAll,
  }), [
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning,
    clearAll,
  ]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
