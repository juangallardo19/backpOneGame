# UNO - Juego de Cartas Online

Un juego de cartas UNO desarrollado con Next.js 15, TypeScript y Tailwind CSS. Incluye animaciones de partículas, fondo de galaxia espiral, sistema de autenticación y gameplay interactivo con 3D perspective.

## 🎮 Características

### Autenticación
- 📧 Login con Email/Username
- ✍️ Registro de nuevas cuentas
- 👤 Modo Invitado
- 🔐 OAuth ready (Google, Facebook, Apple)

### Gameplay
- 🎴 Sistema de cartas completo (108 cartas UNO)
- 🎯 Soporte para 2-4 jugadores
- 👥 Bots de IA
- 🔄 Gestión de turnos
- 📊 Sistema de puntuación
- ⚙️ Configuración previa a la partida (Clásico, Torneo)

### Interfaz
- **Diseño glassmorphism** con efectos visuales modernos
- **Animaciones suaves**: Partículas flotantes y cartas animadas
- **Fondo dinámico**: Espiral de galaxia con gradiente naranja-rojo
- **Perspectiva 3D**: Tablero de juego elevado con rotateX(30deg)
- **Responsive**: Optimizado para todas las pantallas

### Configuración
- 🔊 Audio (Volumen Master, Efectos, Música)
- 🎨 Visual (Control de brillo)
- 🎮 Jugabilidad (Auto-ordenar cartas, Apilar +2/+4)
- 💬 Interfaz (Tamaño de texto)
- 💾 Persistencia en localStorage

## 🚀 Tecnologías

- **Next.js 15.5.4** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS v4** - Styling
- **Canvas API** - Animaciones de partículas
- **Context API** - Gestión de estado global

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/uno-game.git

# Entrar al directorio
cd uno-game

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

## 🎯 Uso

1. **Jugar**: Haz clic en "JUGAR" para iniciar una partida
2. **Configurar**: Accede a las configuraciones desde el menú principal
3. **Personalizar**: Ajusta audio, brillo, tamaño de texto y más

## 🎨 Componentes Principales

### Pantallas de Aplicación
- `LoginScreen.tsx` - Autenticación (Login, Registro, Invitado)
- `RoomSelectionScreen.tsx` - Selección entre crear o unirse a sala
- `GameRoomMenu.tsx` - Configuración de partida (jugadores, preset, opciones)
- `GamePlay.tsx` - **NUEVO** - Interfaz de juego con soporte para 4 jugadores

### Componentes Visuales
- `GalaxySpiral.tsx` - Animación de espiral de galaxia
- `ParticleCanvas.tsx` - Sistema de partículas flotantes
- `UnoCardsBackground.tsx` - Cartas UNO animadas en fondo
- `HalftoneWaves.tsx` - Efecto de ondas halftonadas
- `SettingsModal.tsx` - Panel de configuración global

### Utilidades
- `AudioContext.tsx` - Sistema de audio global (Context API)
- `ui/*` - Componentes shadcn/ui (Button, Input, Select, Dialog, etc)

## 🌟 Efectos Visuales

- **Fondo gradiente**: Naranja a rojo oscuro
- **Espiral de galaxia**: 3 brazos con 2500 partículas
- **Partículas naranjas**: 100 partículas flotantes
- **Cartas flotantes**: Animación hacia el centro
- **Efectos glass**: Contenedores con glassmorphism

## 🔧 Configuraciones Disponibles

| Categoría | Opciones |
|-----------|----------|
| **Audio** | Volumen Master, Efectos de Sonido, Música de Fondo, Sonidos de Cartas |
| **Visual** | Control de Brillo (25-100%) |
| **Jugabilidad** | Auto-ordenar cartas (Color/Número/Manual) |
| **Interfaz** | Tamaño de texto (Pequeño/Mediano/Grande) |

## 📱 Compatibilidad

- ✅ Chrome/Edge/Firefox/Safari
- ✅ Dispositivos móviles y tablets
- ✅ Pantallas de alta resolución
- ✅ Modo oscuro/claro

## � Sistema de Juego (GamePlay)

### Mecánicas Implementadas
- ✅ Distribución de 108 cartas en mazo
- ✅ Reparto de 7 cartas iniciales por jugador
- ✅ Sistema de dibujar cartas del mazo
- ✅ Jugar cartas al pila de descarte
- ✅ Gestión de turnos automática (4 jugadores)
- ✅ Interfaz 3D con perspectiva CSS

### Estructura del Tablero

```
    ┌─────────────────┐
    │  PLAYER TOP     │ (CPU)
    │  (Face Down)    │
├───┼─────────────────┼───┤
│   │   DRAW PILE     │   │
│ P │   DISCARD PILE  │ P │
│ L │   [Current]     │ R │
│ A │                 │ I │
│ Y │                 │ G │
│ E │                 │ H │
│ R │                 │ T │
│   │                 │   │
├───┼─────────────────┼───┤
    │ YOUR HAND (7)   │ (Interactive)
    │ [Selectable]    │
    └─────────────────┘
```

### Colores de Cartas
- 🔴 Red (`#dc251c`) - "r"
- 🟡 Yellow (`#fcf604`) - "y"
- 🔵 Blue (`#0493de`) - "b"
- 🟢 Green (`#018d41`) - "g"
- ⬛ Black (Wilds) - "w"

### Tipos de Cartas (108 Total)
- **Números (0-9)**: 40 cartas (4 colores × 10 valores)
- **Robar 2 (+2)**: 8 cartas
- **Saltar**: 8 cartas
- **Invertir**: 8 cartas
- **Comodín**: 4 cartas
- **Comodín +4**: 4 cartas

Para más detalles, ver [GAMEPLAY_COMPONENT.md](GAMEPLAY_COMPONENT.md)

## �🎯 Flujo de Navegación

```
┌─────────────────┐
│  Pantalla Inicio│
│   (Main Menu)   │
└────────┬────────┘
         │
    ┌────┴─────┐
    │ ¿Logged? │
    └─┬──────┬─┘
      NO    SI
      │      │
      ▼      ▼
   Login    Room
  Screen  Selection
    │      │
    └──┬───┘
       ▼
   GameRoom
    Menu
    (Config)
       │
       ▼
   GamePlay
    (In-Game)

## 🤝 Contribución

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autores

**Sebastian Lopez** -
**Miguel Mendoza** 
- Email: miguelangel11230@gmail.com
- Email: jlopezbenavides73@gmail.com
- GitHub: [@tu-usuario](https://github.com/tu-usuario)

---

⭐ ¡Dale una estrella a este proyecto si te gustó!
