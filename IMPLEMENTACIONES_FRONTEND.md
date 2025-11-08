# 🎮 Implementaciones Frontend - ONE Game

Documento que resume todas las implementaciones realizadas para conectar el frontend con el backend.

---

## 📦 Archivos Creados

### 1. ✅ WebSocket Service
**Archivo**: `frontend/services/websocket.service.ts`

**Funcionalidad**:
- Conexión WebSocket en tiempo real con el backend
- Reconexión automática (hasta 5 intentos)
- Heartbeat para mantener conexión viva
- Eventos manejados:
  - `PLAYER_JOINED`, `PLAYER_LEFT`
  - `GAME_STARTED`, `GAME_ENDED`
  - `CARD_PLAYED`, `CARD_DRAWN`
  - `TURN_CHANGED`
  - `ONE_CALLED`, `ONE_PENALTY`
  - `DIRECTION_REVERSED`, `COLOR_CHANGED`
  - `MESSAGE_RECEIVED`, `EMOTE_RECEIVED`

**Uso**:
```typescript
import { getWebSocketService } from '@/services/websocket.service';

const ws = getWebSocketService(sessionId, token);
await ws.connect();

// Escuchar eventos
ws.on(GameEventType.CARD_PLAYED, (event) => {
  console.log('Carta jugada:', event.payload);
});

// Enviar acciones
ws.playCard(cardId, chosenColor);
ws.drawCard();
ws.callUno();
```

---

### 2. ✅ Tipos TypeScript
**Archivo**: `frontend/types/game.types.ts`

**Incluye**:
- `Card`, `Player`, `CurrentPlayer`
- `GameState`, `Room`, `GameConfig`
- `PlayerStats`, `RankingEntry`
- `User`, `AuthResponse`
- `ChatMessage`, `Emote`, `GameMove`
- `Notification`, `ApiResponse`
- Enums: `CardColor`, `CardType`, `GameStatus`, `PlayerStatus`, `Direction`
- Helper functions: `canPlayCard`, `isWildCard`, etc.

**Sincronizados con el backend de Spring Boot**

---

### 3. ✅ GameContext
**Archivo**: `frontend/contexts/GameContext.tsx`

**Funcionalidad**:
- Estado global del juego sincronizado con backend
- Integración completa con WebSocket
- Manejo de eventos en tiempo real
- Historial de mensajes de chat
- Historial de movimientos del juego

**Métodos disponibles**:
```typescript
const {
  gameState,          // Estado actual del juego
  isConnected,        // ¿Conectado al WebSocket?
  playCard,           // Jugar una carta
  drawCard,           // Robar carta
  callUno,            // Cantar UNO
  sendMessage,        // Enviar mensaje de chat
  isMyTurn,           // ¿Es mi turno?
  connectToGame,      // Conectar a sesión
  disconnectFromGame  // Desconectar
} = useGame();
```

---

### 4. ✅ AuthContext Mejorado
**Archivo**: `frontend/contexts/AuthContext.tsx`

**Mejoras**:
- ✅ Persistencia de sesión con localStorage
- ✅ Auto-login al recargar página
- ✅ Refresh token automático cada 20 minutos
- ✅ Modo invitado
- ✅ Manejo de errores mejorado

**Métodos**:
```typescript
const {
  user,               // Usuario actual
  isAuthenticated,    // ¿Está autenticado?
  login,              // Login con email/password
  register,           // Registrar usuario
  loginAsGuest,       // Login como invitado
  logout,             // Cerrar sesión
  refreshAuth         // Refrescar token
} = useAuth();
```

---

### 5. ✅ Sistema de Notificaciones
**Archivos**:
- `frontend/contexts/NotificationContext.tsx`
- `frontend/components/NotificationToast.tsx`

**Funcionalidad**:
- Toast notifications con diseño glassmorphism
- 4 tipos: success, error, warning, info
- Auto-cierre configurable
- Animaciones suaves
- Barra de progreso

**Uso**:
```typescript
const { success, error, info, warning } = useNotification();

success('¡Éxito!', 'Carta jugada correctamente');
error('Error', 'No puedes jugar esa carta');
info('Info', 'Es tu turno');
warning('Advertencia', 'Tiempo casi agotado');
```

---

### 6. ✅ Componente de Ranking
**Archivo**: `frontend/components/RankingScreen.tsx`

**Funcionalidad**:
- Muestra TOP 100 jugadores
- Estadísticas personales del jugador
- Diseño con glassmorphism matching del proyecto
- Tabs: Ranking Global y Mis Estadísticas
- Destacado del jugador actual
- Iconos especiales para TOP 3

**Estadísticas mostradas**:
- Victorias totales
- Partidas jugadas
- Porcentaje de victorias
- Puntos totales
- Racha actual y mejor racha
- Ranking global

---

### 7. ✅ API Service TypeScript
**Archivo**: `frontend/services/api.ts`

**Funcionalidad**:
- Cliente HTTP con fetch API
- Inyección automática de JWT token
- Manejo de errores estructurado
- Métodos: GET, POST, PUT, DELETE, PATCH
- Tipado completo con TypeScript

---

## 🔧 Archivos Modificados

### 1. Layout Principal
**Archivo**: `frontend/app/layout.tsx`

**Cambios**:
- ✅ Integrados todos los Providers (Auth, Game, Notification, Audio)
- ✅ NotificationToast renderizado globalmente
- ✅ Orden correcto de providers

```tsx
<NotificationProvider>
  <AuthProvider>
    <GameProvider>
      <AudioProvider>
        {children}
      </AudioProvider>
    </GameProvider>
  </AuthProvider>
  <NotificationToast />
</NotificationProvider>
```

### 2. API Config
**Archivo**: `frontend/services/api-config.js`

**Cambios**:
- ✅ Variable de entorno actualizada de `REACT_APP_API_URL` a `NEXT_PUBLIC_API_URL`

---

## 🎯 Cómo Usar las Implementaciones

### Ejemplo 1: Conectar a una partida

```typescript
'use client';

import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

function GameComponent({ sessionId }) {
  const { connectToGame, gameState, playCard, isMyTurn } = useGame();
  const { token } = useAuth();

  useEffect(() => {
    connectToGame(sessionId, token);

    return () => {
      disconnectFromGame();
    };
  }, [sessionId]);

  const handlePlayCard = (cardId: string) => {
    if (isMyTurn()) {
      playCard(cardId);
    }
  };

  return (
    <div>
      <h1>Estado: {gameState?.status}</h1>
      <p>Turno: {isMyTurn() ? 'Tu turno' : 'Espera...'}</p>
      {/* Renderizar cartas y UI */}
    </div>
  );
}
```

### Ejemplo 2: Mostrar notificaciones

```typescript
import { useNotification } from '@/contexts/NotificationContext';
import { useGame } from '@/contexts/GameContext';

function MyComponent() {
  const { success, error } = useNotification();
  const { playCard } = useGame();

  const handlePlay = async (cardId: string) => {
    try {
      await playCard(cardId);
      success('¡Carta jugada!', 'Tu movimiento fue exitoso');
    } catch (err) {
      error('Error', 'No puedes jugar esa carta');
    }
  };
}
```

### Ejemplo 3: Usar autenticación

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginComponent() {
  const { login, isAuthenticated, user, error } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Usuario autenticado, redirigir
    } catch (err) {
      // Error manejado automáticamente
    }
  };

  if (isAuthenticated) {
    return <div>Bienvenido {user?.nickname}</div>;
  }

  return <LoginForm onSubmit={handleLogin} error={error} />;
}
```

---

## 🔄 Flujo de Datos

```
┌─────────────────────────────────────────────┐
│           Usuario interactúa                │
│              (UI Component)                 │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│          useGame() / useAuth()              │
│            (React Context)                  │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│ API Service  │   │  WebSocket   │
│  (REST)      │   │   Service    │
└──────┬───────┘   └──────┬───────┘
       │                  │
       │                  │
       ▼                  ▼
┌─────────────────────────────────────────────┐
│         Backend (Spring Boot)               │
│                                             │
│  - JWT Auth                                 │
│  - Game Engine                              │
│  - WebSocket Events                         │
│  - Database                                 │
└─────────────────────────────────────────────┘
```

---

## ✅ Funcionalidades Implementadas

### Autenticación
- [x] Login con email/password
- [x] Registro de usuarios
- [x] Modo invitado
- [x] Persistencia de sesión
- [x] Auto-refresh de tokens
- [x] Logout

### Juego en Tiempo Real
- [x] Conexión WebSocket
- [x] Eventos de juego sincronizados
- [x] Jugar cartas
- [x] Robar cartas
- [x] Cantar UNO
- [x] Chat en tiempo real
- [x] Emotes

### UI/UX
- [x] Notificaciones toast
- [x] Ranking global
- [x] Estadísticas de jugador
- [x] Loading states
- [x] Error handling

---

## ⚠️ Pendiente de Implementar

### Alta Prioridad
1. **Simplificar UnoGame3D.tsx**
   - Eliminar lógica de juego duplicada
   - Conectar con GameContext
   - Solo mantener visualización 3D

2. **Integrar Ranking con página principal**
   - Agregar botón de Ranking en menú
   - Conectar RankingScreen con navegación

3. **Conectar sistema de salas**
   - Implementar lógica de RoomSelectionScreen con backend
   - Integrar WebSocket en sala de espera

### Media Prioridad
4. Mejorar manejo de errores en componentes
5. Implementar loading skeletons
6. Optimizar re-renders

### Baja Prioridad
7. Tests unitarios
8. Documentación de componentes
9. Optimizaciones de performance

---

## 📝 Variables de Entorno Necesarias

Crear archivo `frontend/.env.local`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# Para producción con Railway:
# NEXT_PUBLIC_API_URL=https://oneonlinebackend-production.up.railway.app
```

---

## 🚀 Próximos Pasos

1. **Probar la conexión WebSocket**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Verificar autenticación**:
   - Intentar login
   - Verificar que persiste al recargar
   - Probar modo invitado

3. **Simplificar UnoGame3D**:
   - Eliminar clases Card, Player
   - Conectar con useGame()
   - Solo renderizar estado recibido del backend

4. **Integrar con componentes existentes**:
   - LoginScreen → usar useAuth()
   - RoomSelectionScreen → usar servicios de salas
   - GameRoomMenu → conectar con backend

---

## 📚 Recursos

### Hooks Principales
- `useAuth()` - Autenticación y usuario
- `useGame()` - Estado del juego y acciones
- `useNotification()` - Notificaciones toast
- `useAudio()` - Sistema de audio (ya existente)

### Servicios
- `api` - Cliente HTTP
- `WebSocketService` - Comunicación en tiempo real
- `authService` - Servicios de autenticación
- `gameService` - Servicios del juego
- `roomService` - Servicios de salas
- `rankingService` - Servicios de ranking

---

## 🎉 Resumen

**Archivos creados**: 8
**Archivos modificados**: 2
**Líneas de código**: ~2,500
**Funcionalidades**: Autenticación, WebSocket, Notificaciones, Ranking
**Estado**: ✅ Base implementada, lista para integración

**Siguiente paso crítico**: Simplificar UnoGame3D y conectar con GameContext para juego funcional end-to-end.

---

**Fecha**: Noviembre 2025
**Versión**: 1.0.0
