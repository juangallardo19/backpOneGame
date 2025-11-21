# 🔊 Instrucciones para Implementar Sonidos de UNO

## 📁 Ubicación de Archivos de Sonido

Coloca los archivos MP3 en el siguiente directorio:

```
frontend/public/sounds/
```

### Archivos necesarios:

1. **`incorrect.mp3`** - Sonido de error cuando un jugador es penalizado por no gritar UNO
2. **`UnoSound.mp3`** - Sonido que se reproduce cuando alguien grita UNO

### Estructura de carpetas:

```
frontend/
├── public/
│   ├── sounds/           ← CREAR ESTA CARPETA
│   │   ├── incorrect.mp3
│   │   └── UnoSound.mp3
│   ├── icons/
│   └── uno-logo.png
```

---

## 🛠️ Implementación en el Frontend

### Paso 1: Actualizar AudioContext.tsx

El archivo `/home/user/backpOneGame/frontend/contexts/AudioContext.tsx` ya tiene la estructura básica. Actualiza la función `playSound` para que realmente reproduzca sonidos:

```typescript
// frontend/contexts/AudioContext.tsx

const playSound = (soundPath: string, volume?: number) => {
  if (!soundEffects && !cardSounds) return;
  if (masterVolume === 0) return;

  try {
    const audio = new Audio(soundPath);
    audio.volume = (volume !== undefined ? volume : masterVolume) / 100;
    audio.play().catch((error) => {
      console.error(`Error playing sound: ${soundPath}`, error);
    });
  } catch (error) {
    console.error(`Failed to load sound: ${soundPath}`, error);
  }
};

// Exporta una función específica para cada sonido
const value = {
  // ... otros valores
  playSound,
  playUnoSound: () => playSound('/sounds/UnoSound.mp3'),
  playIncorrectSound: () => playSound('/sounds/incorrect.mp3'),
};
```

### Paso 2: Manejar eventos ONE_PENALTY y ONE_CALLED

En `/home/user/backpOneGame/frontend/contexts/GameContext.tsx`, agrega los handlers para estos eventos:

```typescript
// Importa useAudio y useNotification
import { useAudio } from '@/contexts/AudioContext';
import { useNotification } from '@/contexts/NotificationContext';

// Dentro del componente GameProvider:
const { playUnoSound, playIncorrectSound } = useAudio();
const { warning, info } = useNotification();

// Agregar listener para ONE_PENALTY
useEffect(() => {
  if (!wsService) return;

  const handleOnePenalty = (event: GameEvent) => {
    const { playerNickname, cardsDrawn } = event.payload.data;

    // Reproducir sonido de error
    playIncorrectSound();

    // Mostrar notificación
    warning(
      '¡Penalización!',
      `${playerNickname} no gritó UNO y recibió ${cardsDrawn} cartas adicionales`,
      5000
    );
  };

  wsService.on(GameEventType.ONE_PENALTY, handleOnePenalty);

  return () => {
    wsService.off(GameEventType.ONE_PENALTY);
  };
}, [wsService, playIncorrectSound, warning]);

// Agregar listener para ONE_CALLED
useEffect(() => {
  if (!wsService) return;

  const handleOneCalled = (event: GameEvent) => {
    const { playerNickname } = event.payload.data;

    // Reproducir sonido de UNO (todos lo escuchan)
    playUnoSound();

    // Mostrar notificación
    info(
      '¡UNO!',
      `${playerNickname} gritó UNO - ¡Solo le queda 1 carta!`,
      3000
    );
  };

  wsService.on(GameEventType.ONE_CALLED, handleOneCalled);

  return () => {
    wsService.off(GameEventType.ONE_CALLED);
  };
}, [wsService, playUnoSound, info]);
```

---

## 🎨 Personalización de Notificaciones

### Estilos de Notificación Existentes

El sistema ya soporta 4 tipos de notificaciones en `NotificationContext`:

- `success(title, message, duration)` - Verde ✅
- `error(title, message, duration)` - Rojo ❌
- `warning(title, message, duration)` - Amarillo ⚠️
- `info(title, message, duration)` - Azul ℹ️

### Ejemplo de Uso:

```typescript
// Penalización (advertencia con sonido de error)
warning('¡Penalización!', 'No gritaste UNO a tiempo', 5000);
playIncorrectSound();

// UNO llamado (info con sonido especial)
info('¡UNO!', 'Juan tiene solo 1 carta', 3000);
playUnoSound();
```

---

## 📊 Eventos del Backend (Ya Implementados)

### Evento ONE_PENALTY

Se envía cuando un jugador es penalizado por no gritar UNO:

```json
{
  "eventType": "ONE_PENALTY",
  "timestamp": 1700000000000,
  "data": {
    "playerId": "player-uuid",
    "playerNickname": "Juan",
    "cardsDrawn": 2,
    "newHandSize": 3
  }
}
```

### Evento ONE_CALLED

Se envía cuando un jugador grita UNO (broadcast a TODOS):

```json
{
  "eventType": "ONE_CALLED",
  "timestamp": 1700000000000,
  "data": {
    "playerId": "player-uuid",
    "playerNickname": "Juan",
    "cardsRemaining": 1
  }
}
```

---

## ✅ Checklist de Implementación

- [ ] Crear carpeta `frontend/public/sounds/`
- [ ] Colocar `incorrect.mp3` en `frontend/public/sounds/`
- [ ] Colocar `UnoSound.mp3` en `frontend/public/sounds/`
- [ ] Actualizar `AudioContext.tsx` con funciones de reproducción
- [ ] Agregar handlers en `GameContext.tsx` para ONE_PENALTY
- [ ] Agregar handlers en `GameContext.tsx` para ONE_CALLED
- [ ] Probar que los sonidos se reproduzcan correctamente
- [ ] Verificar que las notificaciones aparezcan en pantalla
- [ ] Ajustar volumen según preferencias del usuario

---

## 🎯 Resultado Final

### Cuando alguien NO grita UNO:

1. ❌ Se reproduce `incorrect.mp3` (solo para el jugador penalizado o todos, según prefieras)
2. ⚠️ Aparece notificación amarilla: "¡Penalización! Juan no gritó UNO y recibió 2 cartas adicionales"
3. 📊 El estado del juego se actualiza mostrando las cartas adicionales

### Cuando alguien grita UNO:

1. 🔔 Se reproduce `UnoSound.mp3` (TODOS los jugadores lo escuchan)
2. ℹ️ Aparece notificación azul: "¡UNO! Juan gritó UNO - ¡Solo le queda 1 carta!"
3. 👁️ Todos los jugadores ven que Juan tiene 1 carta

---

## 📝 Notas Adicionales

- Los sonidos respetan la configuración de volumen del usuario (`masterVolume`)
- Si el usuario tiene sonidos desactivados, no se reproducirán
- Las notificaciones tienen duración automática (5s para errores, 3s para info)
- Los eventos son en tiempo real vía WebSocket (STOMP)
- El sistema es compatible con bots (los bots gritan UNO automáticamente)

---

## 🐛 Debugging

Si los sonidos no se reproducen, verifica:

1. Los archivos están en `/frontend/public/sounds/`
2. Los nombres de archivo son exactos (case-sensitive)
3. El navegador permite reproducción de audio (algunos navegadores requieren interacción del usuario primero)
4. La configuración de volumen en `AudioContext` no está en 0
5. Los sonidos efectos están habilitados en configuración

---

**Implementado por:** Claude Code
**Fecha:** 2025-11-21
**Archivos modificados:**
- `backend/src/main/java/com/oneonline/backend/service/game/GameEngine.java`
- `backend/src/main/java/com/oneonline/backend/controller/WebSocketGameController.java`
