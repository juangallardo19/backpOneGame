# Chat Code Snippets - Quick Reference

## 1. Cómo Agregar Chat a GameRoomMenu (SOLUCIÓN RÁPIDA)

### Paso 1: Abrir el archivo
```bash
nano frontend/components/GameRoomMenu.tsx
```

### Paso 2: Agregar después de otros imports (línea ~30)
```typescript
import GameChat from '@/components/GameChat'
```

### Paso 3: Agregar estado en el componente
Después de esta línea:
```typescript
const [room, setRoom] = useState<Room | null>(null)
```

Agregar:
```typescript
const [showChat, setShowChat] = useState(true)
```

### Paso 4: Agregar componente antes del cierre de glass-menu-lobby
Encontrar el cierre de:
```typescript
</div>  {/* Cierre de glass-menu-lobby */}
```

Y agregar ANTES:
```typescript
<GameChat 
  isMinimized={!showChat}
  onToggleMinimize={() => setShowChat(!showChat)}
/>
```

---

## 2. Estructura del Componente GameChat (Referencia)

### Props Interface
```typescript
interface GameChatProps {
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}
```

### Uso Típico
```typescript
<GameChat 
  isMinimized={false}  // Inicialmente abierto
  onToggleMinimize={() => setShowChat(!showChat)}  // Callback
/>
```

---

## 3. Acceso a Chat desde GameContext

### En Componentes React
```typescript
import { useGame } from '@/contexts/GameContext'

function MiComponente() {
  const { chatMessages, sendMessage, isConnected } = useGame()
  
  // Enviar mensaje
  const handleSend = () => {
    sendMessage('Mi mensaje')
  }
  
  // Ver mensajes
  console.log(chatMessages)
  
  // Verificar conexión
  if (!isConnected) {
    console.log('WebSocket no conectado')
  }
}
```

---

## 4. Debugging en Console del Navegador

### Ver estado del chat
```javascript
// Obtener el contexto
const game = useGame()

// Ver mensajes
console.log('Mensajes:', game.chatMessages)
console.log('Cantidad:', game.chatMessages.length)

// Ver primer y último mensaje
console.log('Primero:', game.chatMessages[0])
console.log('Último:', game.chatMessages[game.chatMessages.length - 1])

// Filtrar por usuario
const misMensajes = game.chatMessages.filter(m => m.playerNickname === 'MiNombre')
console.log('Mis mensajes:', misMensajes)
```

### Enviar mensaje de prueba
```javascript
const game = useGame()

// Enviar
game.sendMessage('Mensaje de prueba!')

// Verificar que se envió
console.log('Conexión activa:', game.isConnected)
console.log('Mensajes totales:', game.chatMessages.length)
```

### Ver estado de conexión
```javascript
const game = useGame()

console.log('Conectado:', game.isConnected)
console.log('Cargando:', game.isLoading)
console.log('Error:', game.error)
console.log('Sala:', game.room)
console.log('Session ID:', game.sessionId)
```

---

## 5. Estructura de ChatMessage

### Interface
```typescript
export interface ChatMessage {
  id: string;                    // UUID único
  playerId: string;              // ID del jugador que envió
  playerNickname: string;        // Nombre mostrado
  message: string;               // Contenido del mensaje
  timestamp: number;             // Timestamp en ms
  type: 'MESSAGE' | 'SYSTEM' | 'EMOTE';  // Tipo de mensaje
}
```

### Ejemplo Real
```typescript
{
  id: "1700000000000",
  playerId: "550e8400-e29b-41d4-a716-446655440000",
  playerNickname: "Juan",
  message: "Hola a todos!",
  timestamp: 1700000000000,
  type: "MESSAGE"
}
```

### Cómo Acceder
```javascript
const game = useGame()

// Iterar mensajes
game.chatMessages.forEach(msg => {
  console.log(`${msg.playerNickname}: ${msg.message}`)
})

// Mapear a elementos
game.chatMessages.map((msg, idx) => (
  <div key={idx}>
    <strong>{msg.playerNickname}:</strong> {msg.message}
  </div>
))

// Buscar por tipo
const systemMsgs = game.chatMessages.filter(m => m.type === 'SYSTEM')
const emotes = game.chatMessages.filter(m => m.type === 'EMOTE')
```

---

## 6. Manejadores de Chat en GameContext

### Enviar Mensaje
```typescript
const sendMessage = useCallback((message: string) => {
  console.log('📤 Enviando:', message)
  
  // Verificar conexión
  if (!wsServiceRef.current?.isConnected()) {
    console.error('WebSocket no conectado')
    return
  }
  
  // Enviar
  wsServiceRef.current.sendMessage(message)
  console.log('✅ Enviado')
}, [])
```

### Recibir Mensaje
```typescript
const handleMessageReceived = useCallback((payload: any) => {
  console.log('📥 Mensaje recibido:', payload)
  
  // Crear objeto ChatMessage
  const message: ChatMessage = {
    id: Date.now().toString(),
    playerId: payload.playerId,
    playerNickname: payload.playerNickname,
    message: payload.message,
    timestamp: Date.now(),
    type: 'MESSAGE',
  }
  
  // Agregar al estado
  setChatMessages(prev => [...prev, message])
  console.log('✅ Mensaje agregado')
}, [])
```

### Registrar Listener
```typescript
// Dentro de connectToGame()
wsService.on(GameEventType.MESSAGE_RECEIVED, 
  (event) => handleMessageReceived(event.payload))
```

---

## 7. WebSocket Topics y Endpoints

### Enviar (Cliente → Servidor)
```
Destino: /app/game/{roomCode}/chat
Formato: { message: "texto" }

Ejemplo:
/app/game/ABC123/chat
{ message: "Hola a todos!" }
```

### Recibir (Servidor → Cliente)
```
Topic: /topic/game/{roomCode}
Evento: MESSAGE_RECEIVED

Ejemplo recibido:
{
  "eventType": "MESSAGE_RECEIVED",
  "data": {
    "playerId": "uuid",
    "playerNickname": "Juan",
    "message": "Hola a todos!",
    "timestamp": 1700000000000
  }
}
```

---

## 8. Validación de Entrada

### En GameChat.tsx
```typescript
const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Validar no vacío
  if (!message.trim()) return
  
  // Validar longitud
  if (message.length > 200) {
    console.warn('Mensaje muy largo')
    return
  }
  
  // Enviar
  sendMessage(message.trim())
  setMessage('')
}
```

### En Componente Personalizado
```typescript
function MiChat() {
  const [input, setInput] = useState('')
  const { sendMessage } = useGame()
  
  const handleSend = () => {
    // Validar
    if (!input.trim()) {
      alert('El mensaje no puede estar vacío')
      return
    }
    
    if (input.length > 200) {
      alert('Máximo 200 caracteres')
      return
    }
    
    // Enviar
    sendMessage(input)
    setInput('')
  }
  
  return (
    <div>
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={200}
        placeholder="Escribe un mensaje..."
      />
      <button onClick={handleSend}>Enviar</button>
    </div>
  )
}
```

---

## 9. Estilos del Chat

### Contenedor (Fixed Position)
```typescript
.game-chat {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  max-height: 500px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 1000;
}
```

### Estado Minimizado
```typescript
.game-chat.minimized {
  width: 200px;
  max-height: 60px;
}
```

### Mensaje Propio
```typescript
.own-message {
  align-items: flex-end;
  
  .message-content {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
}
```

### Mensaje de Otros
```typescript
.other-message {
  align-items: flex-start;
  
  .message-content {
    background: rgba(96, 165, 250, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.3);
  }
}
```

---

## 10. Casos de Uso Comunes

### Limpiar Chat
```typescript
// En GameContext, agregar función:
const clearChat = useCallback(() => {
  setChatMessages([])
  console.log('Chat limpiado')
}, [])

// En componente:
const { clearChat } = useGame()
clearChat()
```

### Filtrar Mensajes
```javascript
const game = useGame()

// Solo mensajes de un usuario
const userMessages = game.chatMessages.filter(
  m => m.playerNickname === 'Juan'
)

// Solo mensajes recientes (últimas 24 horas)
const now = Date.now()
const recentMessages = game.chatMessages.filter(
  m => (now - m.timestamp) < (24 * 60 * 60 * 1000)
)

// Solo mensajes de juego (no sistema)
const gameMessages = game.chatMessages.filter(
  m => m.type === 'MESSAGE'
)
```

### Buscar Palabras
```javascript
const game = useGame()

function searchMessages(keyword: string) {
  return game.chatMessages.filter(msg =>
    msg.message.toLowerCase().includes(keyword.toLowerCase())
  )
}

// Uso
const results = searchMessages('hola')
console.log('Encontrados:', results.length)
```

### Contar Mensajes por Usuario
```javascript
const game = useGame()

function messageCountByUser() {
  const counts: Record<string, number> = {}
  
  game.chatMessages.forEach(msg => {
    counts[msg.playerNickname] = (counts[msg.playerNickname] || 0) + 1
  })
  
  return counts
}

// Uso
const stats = messageCountByUser()
console.log('Estadísticas:', stats)
// { Juan: 5, Maria: 3, Pedro: 2 }
```

### Última Hora de Actividad
```javascript
const game = useGame()

function lastActivityTime() {
  if (game.chatMessages.length === 0) return null
  
  const lastMsg = game.chatMessages[game.chatMessages.length - 1]
  return new Date(lastMsg.timestamp)
}

// Uso
const lastTime = lastActivityTime()
console.log('Última actividad:', lastTime)
```

---

## 11. Pruebas y Testing

### Test: Enviar Mensaje
```typescript
// En un test file
test('should send message', async () => {
  const { result } = renderHook(() => useGame())
  
  act(() => {
    result.current.sendMessage('Test')
  })
  
  // Verificar que se envió
  expect(result.current.chatMessages.length).toBeGreaterThan(0)
})
```

### Test: Recibir Mensaje
```typescript
test('should receive message', async () => {
  const { result } = renderHook(() => useGame())
  
  const initialLength = result.current.chatMessages.length
  
  // Simular mensaje recibido
  // ... código de simulación ...
  
  expect(result.current.chatMessages.length).toBe(initialLength + 1)
})
```

### Verificación Manual
```bash
# 1. Abrir Developer Tools (F12)
# 2. Ir a Console
# 3. Ejecutar:
const game = useGame()

# 4. Verificar conexión
game.isConnected

# 5. Enviar test
game.sendMessage('Test message')

# 6. Ver mensajes
game.chatMessages
```

---

## 12. Integración en Otros Componentes

### Hook Personalizado para Chat
```typescript
// hooks/useChat.ts
import { useGame } from '@/contexts/GameContext'
import { ChatMessage } from '@/types/game.types'

export function useChat() {
  const { chatMessages, sendMessage, isConnected } = useGame()
  
  const send = (message: string) => {
    if (!isConnected) {
      console.error('No conectado')
      return false
    }
    
    if (!message.trim()) return false
    
    sendMessage(message.trim())
    return true
  }
  
  const getMessages = (): ChatMessage[] => chatMessages
  
  const getMessagesFrom = (nickname: string): ChatMessage[] =>
    chatMessages.filter(m => m.playerNickname === nickname)
  
  const getLastMessage = (): ChatMessage | undefined =>
    chatMessages[chatMessages.length - 1]
  
  return {
    messages: chatMessages,
    send,
    getMessages,
    getMessagesFrom,
    getLastMessage,
    isConnected
  }
}

// Uso
function MiComponente() {
  const { messages, send, getMessagesFrom } = useChat()
  
  const handleSend = () => {
    send('Hola')
  }
  
  const juanMessages = getMessagesFrom('Juan')
  
  return <div>{/* ... */}</div>
}
```

---

## 13. Logs Importantes a Buscar

### Frontend
```
Envío:
"💬 Enviando mensaje:" 
"📤 GameContext.sendMessage llamado con:"
"✅ Mensaje enviado correctamente"

Recepción:
"📨 [ROOM EVENT] Mensaje recibido:"
"🎬 handleEvent llamado"
"✅ [GAME EVENT] Evento procesado correctamente"

Errores:
"❌ Error sending message:"
"⚠️ WebSocket no conectado"
"❌ Error parseando mensaje STOMP"
```

### Backend
```
Envío:
"Chat message in session/room X from Y"
"Chat message sent from X (playerId): message text"

Errores:
"Player not found with email:"
"Session not found:"
"Error processing chat message:"
```

---

## 14. Troubleshooting Rápido

### No se ve el chat
```typescript
// 1. Verificar import
import GameChat from '@/components/GameChat' ✓

// 2. Verificar estado
const [showChat, setShowChat] = useState(true) ✓

// 3. Verificar renderizado
<GameChat 
  isMinimized={!showChat}
  onToggleMinimize={() => setShowChat(!showChat)}
/> ✓
```

### No se envían mensajes
```javascript
// 1. Verificar conexión
console.log(useGame().isConnected) // ¿true?

// 2. Verificar función
console.log(typeof useGame().sendMessage) // ¿"function"?

// 3. Intentar enviar manualmente
useGame().sendMessage('Test')

// 4. Ver logs
// Buscar: "💬 Enviando mensaje:"
```

### No se reciben mensajes
```javascript
// 1. Verificar que otro usuario envió
// 2. Ver logs: "📨 [ROOM EVENT] Mensaje recibido:"
// 3. Verificar handler
console.log(useGame().chatMessages)

// 4. Revisar console por errores
// Buscar: "❌"
```

---

*Documento de referencia rápida para implementación de chat. Último update: 2025-11-14*
