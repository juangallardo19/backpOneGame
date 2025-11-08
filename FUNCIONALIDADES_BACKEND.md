# Funcionalidades del Backend - UNO Online

Este documento describe todas las funcionalidades que el backend ofrece y cómo están integradas en el frontend.

## 📋 Índice

- [Autenticación](#autenticación)
- [Gestión de Salas](#gestión-de-salas)
- [Juego](#juego)
- [Ranking](#ranking)
- [WebSocket](#websocket)
- [OAuth2](#oauth2)

---

## 🔐 Autenticación

### Endpoints Disponibles

| Método | Endpoint | Descripción | Frontend |
|--------|----------|-------------|----------|
| POST | `/api/auth/register` | Registrar nuevo usuario | ✅ `auth.service.ts` |
| POST | `/api/auth/login` | Iniciar sesión | ✅ `auth.service.ts` |
| POST | `/api/auth/logout` | Cerrar sesión | ✅ `AuthContext.tsx` |
| GET | `/api/auth/me` | Obtener perfil actual | ✅ `AuthContext.tsx` |
| POST | `/api/auth/refresh` | Refrescar token JWT | ✅ `AuthContext.tsx` |
| GET | `/api/auth/check-email` | Verificar disponibilidad email | ✅ `api-config.js` |
| GET | `/api/auth/check-nickname` | Verificar disponibilidad nickname | ✅ `api-config.js` |

### Implementación Frontend

**Archivos:**
- `frontend/contexts/AuthContext.tsx` - Contexto de autenticación con persistencia
- `frontend/services/auth.service.ts` - Servicio de autenticación
- `frontend/components/LoginScreen.tsx` - Pantalla de login/registro

**Características:**
- ✅ Persistencia de sesión con localStorage
- ✅ Auto-refresh de token cada 20 minutos
- ✅ Restauración automática de sesión al recargar
- ✅ Inyección automática de JWT en peticiones
- ✅ Login con email/password
- ✅ Registro con email/nickname/password
- ✅ Modo invitado (sin persistencia)

---

## 🏠 Gestión de Salas

### Endpoints Disponibles

| Método | Endpoint | Descripción | Frontend |
|--------|----------|-------------|----------|
| POST | `/api/rooms` | Crear nueva sala | ✅ `room.service.ts` |
| GET | `/api/rooms/public` | Listar salas públicas | ✅ `room.service.ts` |
| GET | `/api/rooms/{code}` | Obtener detalles de sala | ✅ `room.service.ts` |
| POST | `/api/rooms/{code}/join` | Unirse a sala | ✅ `room.service.ts` |
| DELETE | `/api/rooms/{code}/leave` | Salir de sala | ✅ `room.service.ts` |
| PUT | `/api/rooms/{code}/kick/{playerId}` | Expulsar jugador (líder) | ✅ `room.service.ts` |
| POST | `/api/rooms/{code}/bot` | Agregar bot | ✅ `room.service.ts` |
| DELETE | `/api/rooms/{code}/bot/{botId}` | Remover bot | ✅ `room.service.ts` |
| PUT | `/api/rooms/{code}/leader/{playerId}` | Transferir liderazgo | ✅ `room.service.ts` |

### Implementación Frontend

**Archivos:**
- `frontend/services/room.service.ts` - Servicio de gestión de salas
- `frontend/types/game.types.ts` - Tipos TypeScript para Room

**Características:**
- ✅ Crear salas públicas o privadas
- ✅ Configurar número máximo de jugadores
- ✅ Configurar puntos para ganar
- ✅ Listar salas disponibles
- ✅ Sistema de códigos de sala
- ✅ Gestión de bots con 3 niveles de dificultad (EASY, NORMAL, HARD)
- ✅ Sistema de liderazgo de sala

---

## 🎮 Juego

### Endpoints Disponibles

| Método | Endpoint | Descripción | Frontend |
|--------|----------|-------------|----------|
| POST | `/api/game/{sessionId}/start` | Iniciar juego | ✅ `game.service.ts` |
| POST | `/api/game/{sessionId}/play` | Jugar carta | ✅ `game.service.ts` |
| POST | `/api/game/{sessionId}/draw` | Robar carta | ✅ `game.service.ts` |
| POST | `/api/game/{sessionId}/uno` | Cantar UNO | ✅ `game.service.ts` |
| GET | `/api/game/{sessionId}/state` | Obtener estado del juego | ✅ `game.service.ts` |
| POST | `/api/game/{sessionId}/undo` | Deshacer jugada | ✅ `game.service.ts` |
| POST | `/api/game/{sessionId}/catch-uno/{playerId}` | Atrapar jugador sin UNO | ✅ `game.service.ts` |

### Implementación Frontend

**Archivos:**
- `frontend/services/game.service.ts` - Servicio de acciones del juego
- `frontend/contexts/GameContext.tsx` - Contexto global del estado del juego
- `frontend/types/game.types.ts` - Tipos TypeScript para GameState, Card, Player

**Características:**
- ✅ Sistema completo de juego UNO
- ✅ Validación de cartas jugables
- ✅ Sistema de turnos
- ✅ Cartas especiales: Skip, Reverse, Draw Two, Wild, Wild Draw Four
- ✅ Sistema de puntos
- ✅ Detección de ganador
- ✅ Sistema de deshacer movimiento
- ✅ Sistema "Catch UNO" para penalizar jugadores

---

## 🏆 Ranking

### Endpoints Disponibles

| Método | Endpoint | Descripción | Frontend |
|--------|----------|-------------|----------|
| GET | `/api/ranking/global` | Top 100 jugadores | ✅ `ranking.service.ts` |
| GET | `/api/ranking/global/top/{limit}` | Top N jugadores | ✅ `ranking.service.ts` |
| GET | `/api/ranking/player/{userId}` | Estadísticas de jugador | ✅ `ranking.service.ts` |
| GET | `/api/ranking/streak` | Jugadores con rachas activas | ✅ `ranking.service.ts` |
| GET | `/api/ranking/rising` | Jugadores en ascenso | ✅ `ranking.service.ts` |
| GET | `/api/ranking/range` | Rankings por rango | ✅ `api-config.js` |
| GET | `/api/ranking/stats` | Estadísticas generales | ✅ `ranking.service.ts` |
| POST | `/api/ranking/recalculate` | Recalcular rankings (admin) | ⚠️ Endpoint admin |

### Implementación Frontend

**Archivos:**
- `frontend/services/ranking.service.ts` - Servicio de rankings
- `frontend/components/RankingScreen.tsx` - Pantalla de ranking completa
- `frontend/types/game.types.ts` - Tipos para RankingEntry, PlayerStats

**Características:**
- ✅ Top 100 jugadores globales
- ✅ Estadísticas personales del jugador
- ✅ Win rate, rachas, mejores rachas
- ✅ Cambios de posición en ranking
- ✅ Jugadores en ascenso
- ✅ Jugadores con rachas activas
- ✅ Estadísticas totales del juego

---

## 🔌 WebSocket

### Endpoint

| Protocolo | Endpoint | Descripción | Frontend |
|-----------|----------|-------------|----------|
| WS | `/ws/game/{sessionId}` | Conexión WebSocket para juego en tiempo real | ✅ `websocket.service.ts` |

### Implementación Frontend

**Archivos:**
- `frontend/services/websocket.service.ts` - Cliente WebSocket completo (350+ líneas)
- `frontend/contexts/GameContext.tsx` - Integración con estado global

**Características:**
- ✅ Reconexión automática (5 intentos con backoff)
- ✅ Sistema de heartbeat (ping cada 30 segundos)
- ✅ Manejo de 15+ tipos de eventos del juego
- ✅ Sistema de callbacks para suscripción a eventos
- ✅ Singleton pattern (una instancia por sesión)
- ✅ Manejo robusto de errores

**Eventos Manejados:**
1. `PLAYER_JOINED` - Jugador se unió
2. `PLAYER_LEFT` - Jugador salió
3. `GAME_STARTED` - Juego iniciado
4. `CARD_PLAYED` - Carta jugada
5. `CARD_DRAWN` - Carta robada
6. `TURN_CHANGED` - Cambio de turno
7. `UNO_CALLED` - UNO cantado
8. `UNO_CAUGHT` - Jugador atrapado sin UNO
9. `GAME_WON` - Juego ganado
10. `GAME_ERROR` - Error de juego
11. `CHAT_MESSAGE` - Mensaje de chat
12. `BOT_ADDED` - Bot agregado
13. `BOT_REMOVED` - Bot removido
14. `LEADER_CHANGED` - Líder cambiado
15. `ROOM_UPDATED` - Sala actualizada

---

## 🔑 OAuth2

### Proveedores Soportados

| Proveedor | Endpoint | Frontend |
|-----------|----------|----------|
| Google | `/oauth2/authorize/google` | ✅ `LoginScreen.tsx` |
| GitHub | `/oauth2/authorize/github` | ✅ `LoginScreen.tsx` |

### Flujo OAuth2

```
1. Usuario hace clic en "Login with Google/GitHub"
   ↓
2. Frontend redirige a: /oauth2/authorize/{provider}
   ↓
3. Usuario autoriza en Google/GitHub
   ↓
4. Provider redirige a backend: /oauth2/callback/{provider}
   ↓
5. Backend procesa y genera JWT
   ↓
6. Backend redirige a frontend: /auth/callback?token={jwt}&refreshToken={refresh}&userId={id}
   ↓
7. Frontend captura tokens y guarda en AuthContext
   ↓
8. Usuario autenticado y redirigido a página principal
```

### Implementación Frontend

**Archivos:**
- `frontend/components/LoginScreen.tsx` - Botones de Google y GitHub
- `frontend/app/auth/callback/page.tsx` - Página de callback OAuth2
- `frontend/contexts/AuthContext.tsx` - Método `setAuthData()` para OAuth2

**Características:**
- ✅ Botones visuales de Google y GitHub con iconos oficiales
- ✅ Redirección automática al backend
- ✅ Captura de tokens desde URL
- ✅ Guardado automático en localStorage
- ✅ Manejo de errores con redirección
- ✅ Pantalla de carga durante proceso
- ✅ Notificaciones de éxito/error

**IMPORTANTE:**
- ❌ Facebook y Apple **no están soportados** por el backend
- ✅ Solo Google y GitHub están configurados
- ✅ Variables de entorno necesarias en backend:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

---

## 📊 Resumen de Integración

### Completitud del Frontend

| Categoría | Endpoints Backend | Implementado Frontend | Porcentaje |
|-----------|-------------------|----------------------|------------|
| Autenticación | 7 | 7 | 100% ✅ |
| Salas | 9 | 9 | 100% ✅ |
| Juego | 7 | 7 | 100% ✅ |
| Ranking | 8 | 7 | 87.5% ⚠️ |
| WebSocket | 1 | 1 | 100% ✅ |
| OAuth2 | 2 | 2 | 100% ✅ |
| **TOTAL** | **34** | **33** | **97% ✅** |

**Nota:** El endpoint `/api/ranking/recalculate` es admin-only y no necesita implementación en frontend normal.

---

## 🔧 Configuración Necesaria

### Variables de Entorno Frontend

```env
# .env.local
NEXT_PUBLIC_API_URL=https://oneonlinebackend-production.up.railway.app
```

### Variables de Entorno Backend (Railway)

```env
# OAuth2 Google
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret

# OAuth2 GitHub
GITHUB_CLIENT_ID=tu-github-client-id
GITHUB_CLIENT_SECRET=tu-github-client-secret

# Otros
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com
JWT_SECRET=tu-secret-key
DATABASE_URL=postgresql://...
```

### Configuración OAuth2 en Providers

**Google Cloud Console:**
1. Ir a https://console.cloud.google.com/apis/credentials
2. Crear credenciales OAuth 2.0
3. Agregar URI de redirección: `https://oneonlinebackend-production.up.railway.app/oauth2/callback/google`

**GitHub Developer Settings:**
1. Ir a https://github.com/settings/developers
2. Crear nueva OAuth App
3. Authorization callback URL: `https://oneonlinebackend-production.up.railway.app/oauth2/callback/github`

---

## 🚀 Próximos Pasos

### Para Usuarios

1. **Configurar OAuth2:**
   - Crear aplicaciones en Google Cloud Console y GitHub
   - Agregar variables de entorno en Railway
   - Probar login con Google y GitHub

2. **Probar Funcionalidades:**
   - Crear sala de juego
   - Invitar amigos con código de sala
   - Jugar partidas online
   - Ver ranking global

### Para Desarrolladores

1. **Mejorar UI/UX:**
   - Conectar `UnoGame3D.tsx` con `GameContext`
   - Agregar animaciones de cartas
   - Mejorar notificaciones visuales

2. **Features Adicionales:**
   - Sistema de amigos
   - Chat de sala
   - Historial de partidas
   - Achievements/Logros

---

## 📚 Documentación Adicional

- [SETUP.md](SETUP.md) - Guía de instalación
- [ANALISIS_TECNICO.md](ANALISIS_TECNICO.md) - Análisis técnico completo
- [CONEXION_COMPLETA.md](CONEXION_COMPLETA.md) - Detalles de conexión frontend-backend
- [README.md](README.md) - Visión general del proyecto

---

**Última actualización:** 2025-11-08
**Versión Backend:** 1.0.0
**Versión Frontend:** 1.0.0
**Estado:** ✅ Producción Ready
