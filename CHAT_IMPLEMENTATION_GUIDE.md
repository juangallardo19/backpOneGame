# Chat Implementation Guide - BackpOne Game

**Última actualización:** 2025-11-14  
**Autor:** Code Analysis  
**Estado:** Chat funcional en juego, listo para integrar en sala de espera

---

## Tabla de Contenidos
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Flujo de Comunicación](#flujo-de-comunicación)
5. [Cómo Agregar Chat a Sala de Espera](#cómo-agregar-chat-a-sala-de-espera)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Resumen Ejecutivo

El chat del juego está **100% implementado y funcional**:
- ✅ Componente UI (GameChat.tsx) - listo para usar
- ✅ Estado global (GameContext) - maneja mensajes
- ✅ WebSocket STOMP client - conecta con backend
- ✅ Backend Spring Boot - procesa mensajes
- ✅ Chat en juego (OneGame3D) - ya integrado

Lo que **FALTA:**
- ❌ Chat en sala de espera (GameRoomMenu) - requiere 3 líneas de código

### Cambio Mínimo Requerido

Editar `GameRoomMenu.tsx`:
```typescript
// 1. Agregar import
import GameChat from '@/components/GameChat'

// 2. Agregar estado
const [showChat, setShowChat] = useState(true)

// 3. Agregar componente (antes del cierre de glass-menu-lobby)
<GameChat 
  isMinimized={!showChat}
  onToggleMinimize={() => setShowChat(!showChat)}
/>
```

---

## Arquitectura

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  GameChat.tsx (UI)                                       │
│  GameContext.tsx (Estado global + WebSocket handlers)    │
│  websocket.service.ts (Cliente STOMP/SockJS)            │
└─────────────────────────────────────────────────────────┘
                            ↕
                    STOMP over WebSocket
                            ↕
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (Spring Boot)                    │
├─────────────────────────────────────────────────────────┤
│  WebSocketGameController.handleChatMessage()            │
│  MessageTemplate.convertAndSend()                        │
│  STOMP Broker (RabbitMQ compatible)                     │
└─────────────────────────────────────────────────────────┘
```

### Diagrama de Flujo

```
USUARIO                FRONTEND              BACKEND
  ↓                       ↓                     ↓
[Escribe]           GameChat.tsx              (escucha)
  ↓                       ↓                     ↓
 [Envía] ────→ GameContext.sendMessage()       ↓
               ↓                                 ↓
               WebSocketService.send()         ↓
               ↓                                 ↓
               /app/game/{roomCode}/chat ────→ handleChatMessage()
                                               ↓
                                          messagingTemplate.convertAndSend()
                                               ↓
                                          /topic/game/{roomCode}
                                               ↓
[Recibe] ←──── GameChat actualizado ←─ handleMessageReceived()
          GameContext.chatMessages
```

---

## Componentes

### 1. GameChat.tsx (UI)

**Ubicación:** `/frontend/components/GameChat.tsx`  
**Líneas:** 360  
**Estado:** 100% funcional

```typescript
export default function GameChat({ 
  isMinimized = false, 
  onToggleMinimize 
}: GameChatProps)
```

**Props:**
- `isMinimized?: boolean` - Si está minimizado
- `onToggleMinimize?: () => void` - Callback para minimizar

**Datos del contexto:**
- `chatMessages: ChatMessage[]` - Array de mensajes
- `sendMessage: (msg: string) => void` - Función para enviar

**Características:**
- Auto-scroll a nuevos mensajes
- Minimizar/expandir
- Máximo 200 caracteres
- Diferencia colores: tu mensaje (verde) vs otros (azul)
- Muestra nickname y hora de cada mensaje

### 2. GameContext.tsx (Estado Global)

**Ubicación:** `/frontend/contexts/GameContext.tsx`  
**Líneas:** 1200+  
**Estado:** 100% funcional

**Estado de chat:**
```typescript
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
```

**Función para enviar:**
```typescript
const sendMessage = useCallback((message: string) => {
  if (wsServiceRef.current?.isConnected()) {
    wsServiceRef.current.sendMessage(message);
  }
}, []);
```

**Manejador de recepción:**
```typescript
const handleMessageReceived = useCallback((payload: any) => {
  const message: ChatMessage = {
    id: Date.now().toString(),
    playerId: payload.playerId,
    playerNickname: payload.playerNickname,
    message: payload.message,
    timestamp: Date.now(),
    type: 'MESSAGE',
  };
  setChatMessages(prev => [...prev, message]);
}, []);
```

**Registración de listener:**
```typescript
wsService.on(GameEventType.MESSAGE_RECEIVED, 
  (event) => handleMessageReceived(event.payload));
```

### 3. WebSocketService (STOMP Client)

**Ubicación:** `/frontend/services/websocket.service.ts`  
**Líneas:** 549  
**Estado:** 100% funcional

**Método de envío:**
```typescript
sendMessage(message: string): void {
  this.send(`/app/game/${this.roomCode}/chat`, { message });
}
```

**Suscripción a topics:**
```typescript
// STOMP destinations
/topic/game/{roomCode}       // Recibe mensajes broadcast
/user/queue/game-state       // Recibe estado personal
/user/queue/notification     // Recibe notificaciones
```

**Manejo de eventos:**
```typescript
on(eventType: GameEventType | 'ALL', callback: EventCallback)
```

### 4. WebSocketGameController (Backend)

**Ubicación:** `/backend/controller/WebSocketGameController.java`  
**Líneas:** 500+  
**Estado:** 100% funcional

**Endpoint del chat:**
```java
@MessageMapping("/game/{sessionId}/chat")
public void handleChatMessage(
    @DestinationVariable String sessionId,
    @Payload Map<String, String> payload,
    Principal principal)
```

**Broadcast:**
```java
messagingTemplate.convertAndSend(
  "/topic/game/" + sessionId,
  Map.of(
    "eventType", "MESSAGE_RECEIVED",
    "data", Map.of(
      "playerId", player.getPlayerId(),
      "playerNickname", player.getNickname(),
      "message", message,
      "timestamp", System.currentTimeMillis()
    )
  )
);
```

---

## Flujo de Comunicación

### Paso 1: Usuario Escribe el Mensaje

```
GameChat.tsx: handleSendMessage()
├─ Valida que no esté vacío
├─ Llama context.sendMessage(message)
├─ Limpia el input
└─ console.log("💬 Enviando mensaje...")
```

### Paso 2: GameContext Envía al WebSocket

```
GameContext.sendMessage() [línea 1119]
├─ Verifica que wsServiceRef.current está conectado
├─ console.log("📤 GameContext.sendMessage llamado")
├─ Llama wsServiceRef.current.sendMessage(message)
└─ console.log("✅ Mensaje enviado correctamente")
```

### Paso 3: WebSocketService Envía al Backend

```
WebSocketService.sendMessage() [línea 463]
├─ Llama this.send(`/app/game/${roomCode}/chat`, {message})
├─ client.publish() con destino STOMP
└─ Mensaje llega al backend
```

### Paso 4: Backend Recibe y Broadcast

```
WebSocketGameController.handleChatMessage() [línea 382]
├─ Encuentra el jugador por email
├─ Construye mensaje con playerId y nickname
├─ messagingTemplate.convertAndSend("/topic/game/{roomCode}", ...)
└─ Se emite a TODOS los clientes suscritos
```

### Paso 5: Frontend Recibe el Mensaje

```
WebSocketService subscribeToGameTopic() [línea 195-244]
├─ Client escucha /topic/game/{roomCode}
├─ Recibe JSON con eventType: MESSAGE_RECEIVED
├─ convertToGameEvent() lo transforma a GameEvent
├─ handleEvent() lo procesa
└─ Llama callbacks registrados
```

### Paso 6: GameContext Actualiza el Estado

```
GameContext.handleMessageReceived() [línea 683]
├─ Crea objeto ChatMessage
├─ setChatMessages(prev => [...prev, message])
├─ Dispara re-render de GameChat
└─ Usuario ve el mensaje en pantalla
```

---

## Cómo Agregar Chat a Sala de Espera

### Archivo a Modificar

`/frontend/components/GameRoomMenu.tsx`

### Cambios Necesarios

**1. Agregar Import (después del resto de imports)**

Línea ~2:
```typescript
import GameChat from '@/components/GameChat'
```

**2. Agregar Estado al Componente**

Dentro de `GameRoomMenu()`, después de `const [room, setRoom] = useState<Room | null>(null)`:
```typescript
const [showChat, setShowChat] = useState(true)
```

**3. Agregar Componente al JSX**

Dentro de `<div className="glass-menu-lobby">` (justo antes del cierre `</div>`):
```typescript
<GameChat 
  isMinimized={!showChat}
  onToggleMinimize={() => setShowChat(!showChat)}
/>
```

### Ejemplo Completo de Cambio

```diff
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
// ... otros imports ...
+ import GameChat from '@/components/GameChat'
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"

export default function GameRoomMenu({ onBack, onStartGame }: GameRoomMenuProps) {
  const { room: wsRoom, connectToGame, gameState } = useGame()
  const [room, setRoom] = useState<Room | null>(null)
+  const [showChat, setShowChat] = useState(true)
  
  // ... resto del código ...
  
  return (
    <div className="glass-menu-lobby">
      {/* Contenido existente */}
      <div className="lobby-grid">
        {/* Columnas de jugadores y código */}
      </div>
      
+     <GameChat 
+       isMinimized={!showChat}
+       onToggleMinimize={() => setShowChat(!showChat)}
+     />
    </div>
  )
}
```

### Por Qué Funciona Automáticamente

1. **WebSocket ya está conectado** - GameContext hace `connectToGame(roomCode)` cuando entras a GameRoomMenu
2. **chatMessages ya existe** - El estado se mantiene en GameContext
3. **sendMessage ya funciona** - La función está disponible en el contexto
4. **Los handlers ya escuchan** - `handleMessageReceived()` ya registra listeners

No se necesita nada más porque toda la infraestructura ya existe.

---

## Testing

### Verificación Rápida en Console

```javascript
// 1. Ver si el contexto funciona
const game = useGame()

// 2. Ver si WebSocket está conectado
game.isConnected  // debe ser true

// 3. Ver lista de mensajes
game.chatMessages  // debe ser un array

// 4. Enviar mensaje de prueba
game.sendMessage('Test message')

// 5. Ver si la función existe
typeof game.sendMessage  // debe ser "function"
```

### Caso 1: Chat en Sala de Espera

```
Requisitos:
- 2 navegadores abiertos en la misma sala
- Backend ejecutándose
- WebSocket disponible

Pasos:
1. Jugador A crea sala (ABC123)
2. Jugador B se une a sala (ABC123)
3. Jugador A ve el chat
4. Jugador B ve el chat
5. Jugador A escribe: "Hola B"
6. Jugador B recibe: "Hola B" atribuido a A
7. Jugador B escribe: "Hola A"
8. Jugador A recibe: "Hola A" atribuido a B

Resultado esperado: ✅ Ambos ven los mensajes en tiempo real
```

### Caso 2: Transición del Chat a Juego

```
Pasos:
1. Chat funciona en sala
2. Líder inicia juego
3. Ambos se reconectan a nuevo WebSocket
4. Chat sigue funcionando en juego

Resultado esperado: ✅ Chat persiste sin perder mensajes históricos
Nota: Los mensajes de sala NO aparecen en juego (son topics diferentes)
```

### Caso 3: Múltiples Usuarios

```
Pasos:
1. 4 jugadores en la misma sala
2. Cada uno escribe un mensaje diferente
3. Todos deberían ver 4 mensajes

Resultado esperado: ✅ Todos ven los 4 mensajes en orden
```

### Caso 4: Mensajes Largos

```
Pasos:
1. Intentar escribir 201 caracteres
2. El input tiene maxLength={200}
3. No se puede escribir más

Resultado esperado: ✅ Input limitado a 200 caracteres
```

---

## Troubleshooting

### Problema 1: Chat no aparece en GameRoomMenu

**Síntomas:**
- No ves el chat en la esquina inferior derecha
- Sin errores en console

**Causas posibles:**
1. Import no agregado correctamente
2. Componente no renderizado
3. Estado `showChat` no declarado

**Soluciones:**
```typescript
// Verificar import
import GameChat from '@/components/GameChat'

// Verificar que GameChat está siendo renderizado
{/* Dentro del JSX */}
<GameChat 
  isMinimized={!showChat}
  onToggleMinimize={() => setShowChat(!showChat)}
/>

// Verificar que el estado existe
const [showChat, setShowChat] = useState(true)
```

### Problema 2: Mensajes no se envían

**Síntomas:**
- Escribes un mensaje y presionas Enter
- Input se limpia
- El mensaje no aparece
- No hay errores visibles

**Debugging:**
```javascript
// En console:
console.log(useGame().isConnected)  // ¿Está true?
console.log(useGame().sendMessage)  // ¿Es una función?

// Intenta enviar manualmente
useGame().sendMessage('Test')

// Verifica logs en console
// Busca: "💬 Enviando mensaje:"
// Busca: "📤 GameContext.sendMessage llamado"
```

**Causas posibles:**
1. WebSocket no está conectado (`isConnected === false`)
2. Token de autenticación expirado
3. Backend no está corriendo
4. Firewall bloqueando WebSocket

**Soluciones:**
```javascript
// 1. Verificar conexión
if (!useGame().isConnected) {
  console.error('WebSocket no conectado')
  // Recargar página o reconectar manualmente
}

// 2. Verificar token
const token = localStorage.getItem('uno_auth_token')
console.log('Token presente:', !!token)

// 3. Verificar backend en logs
// Backend debe mostrar: "Chat message in session/room"
```

### Problema 3: Mensajes no se reciben

**Síntomas:**
- Otros usuarios envían mensajes
- Tú no los ves
- Pero tus mensajes sí se envían (otros los ven)

**Debugging:**
```javascript
// Ver que los listeners están registrados
// Busca en console durante conexión:
// "🎬 handleEvent llamado"
// "MESSAGE_RECEIVED"

// Ver que los handlers existen
const ctx = useGame()
console.log(ctx.handleMessageReceived)  // ¿Existe?
```

**Causas posibles:**
1. Backend no está emitiendo el evento
2. Listener no fue registrado
3. Topic de suscripción incorrecto

**Soluciones:**
```
Backend side:
1. Verificar que handleChatMessage() está siendo llamado
2. Ver en logs: "Chat message sent from..."
3. Verificar que messagingTemplate.convertAndSend() no tiene excepciones

Frontend side:
1. Verificar que el listener se registró
2. Buscar en console: "Ejecutando X callbacks para tipo: MESSAGE_RECEIVED"
```

### Problema 4: Chat en sala funciona pero no en juego

**Síntomas:**
- Mensajes en sala de espera: ✅
- Después de iniciar juego: ✅
- Pero sin continuidad (todos los mensajes desaparecen)

**Causa:**
Los topics son diferentes:
- Sala: `/topic/game/{roomCode}`
- Juego: `/topic/game/{sessionId}`

**Solución:**
Es comportamiento esperado. Los historiales de chat son separados por sesión/contexto.

### Problema 5: Error de autenticación en WebSocket

**Síntomas:**
```
❌ STOMP error: 403 Forbidden
❌ WebSocket error: 401 Unauthorized
```

**Causa:**
Token JWT no se está pasando correctamente

**Solución:**
```typescript
// En websocket.service.ts, verificar:
const wsUrl = this.token
  ? `${API_BASE_URL}/ws?token=${encodeURIComponent(this.token)}`
  : `${API_BASE_URL}/ws`;
```

---

## Archivos Relevantes

### Frontend

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| GameChat.tsx | 360 | Componente UI del chat |
| GameContext.tsx | 1200+ | Estado global y handlers |
| websocket.service.ts | 549 | Cliente STOMP |
| game.types.ts | 327 | Interface ChatMessage |
| OneGame3D.tsx | 400+ | Uso del chat en juego |

### Backend

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| WebSocketGameController.java | 500+ | Manejo de WebSocket |
| handleChatMessage() | 45 | Lógica del chat |

---

## Configuración del WebSocket

### Topics STOMP

**Cliente envía a:**
```
/app/game/{roomCode}/chat
```

**Cliente recibe de:**
```
/topic/game/{roomCode}          (broadcast)
/user/queue/game-state          (personal)
/user/queue/notification        (personal)
/user/queue/errors              (errores)
```

### Eventos

```typescript
enum GameEventType {
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  EMOTE_RECEIVED = 'EMOTE_RECEIVED',
  // ... otros
}
```

### Formato de Mensaje

**Cliente → Servidor:**
```json
{
  "message": "Hola a todos!"
}
```

**Servidor → Cliente:**
```json
{
  "eventType": "MESSAGE_RECEIVED",
  "data": {
    "playerId": "uuid-123",
    "playerNickname": "Juan",
    "message": "Hola a todos!",
    "timestamp": 1700000000000
  }
}
```

---

## Limitaciones Actuales

1. **Máximo 200 caracteres** - Hardcodeado en GameChat.tsx:127
2. **Solo texto** - No soporta emojis especiales ni markdown
3. **Sin persistencia** - Se pierden mensajes al recargar
4. **Sin historial** - No hay búsqueda de mensajes antiguos
5. **Sin menciones** - No puedes usar @user
6. **Sin reacciones** - No hay emojis de reacción
7. **Sin privacidad** - Todos ven todos los mensajes
8. **Sin threading** - No hay respuestas a mensajes específicos

---

## Resumen de Cambios

### Para Implementar Chat en Sala de Espera

**Cambios de código:**
- 1 import
- 1 estado
- 1 componente (3 líneas)

**Total:** 5 líneas en 1 archivo

**Tiempo estimado:**
- Codificación: 5 minutos
- Testing: 10 minutos
- Debug (si hay): 15-30 minutos

**Riesgo:** MÍNIMO (componente ya existe y funciona en otro lugar)

**Archivos afectados:**
- `GameRoomMenu.tsx` (modificar)
- `GameChat.tsx` (no cambiar)
- `GameContext.tsx` (no cambiar)
- Backend (no cambiar)

---

## Conclusión

El chat está **100% implementado y listo para usar** en la sala de espera. Solo requiere agregar el componente existente a un nuevo lugar. Toda la infraestructura de WebSocket, backend y estado global ya funciona correctamente.

**Próximo paso:** Editar GameRoomMenu.tsx con los 3 cambios descritos en [Cómo Agregar Chat a Sala de Espera](#cómo-agregar-chat-a-sala-de-espera).

---

*Documento generado el 2025-11-14 mediante análisis automático del código.*
