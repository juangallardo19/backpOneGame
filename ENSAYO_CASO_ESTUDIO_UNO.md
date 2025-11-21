# Caso de Estudio: Implementación del Juego UNO
## Aplicación de Patrones de Diseño y Estructuras de Datos

---

## Resumen Ejecutivo

El presente documento analiza la implementación de una versión digital del juego de cartas UNO como caso de estudio para la aplicación práctica de patrones de diseño de software y estructuras de datos avanzadas. El proyecto constituye una aplicación web multiplayer en tiempo real, desarrollada con arquitectura de microservicios que integra un backend basado en Java Spring Boot y un frontend construido con Next.js y React.

---

## 1. Introducción al Caso de Estudio

### 1.1 Contexto y Motivación

El desarrollo de aplicaciones multiplayer en tiempo real representa uno de los desafíos más complejos en la ingeniería de software moderna. Este proyecto implementa una versión digital del juego de cartas UNO, un caso de estudio ideal que combina múltiples dimensiones de complejidad: gestión de turnos circulares, procesamiento de efectos de cartas especiales, sincronización de estados entre múltiples clientes, y coordinación de sesiones concurrentes.

El juego UNO, conocido mundialmente por su dinámica de turnos circulares y reglas especiales, presenta desafíos técnicos únicos que requieren la aplicación de patrones de diseño de software y estructuras de datos especializadas. La necesidad de invertir direcciones de juego en tiempo constante, saltar jugadores sin reorganizar estructuras, y mantener sincronizados múltiples clientes con el estado del servidor hace de este proyecto un excelente vehículo para demostrar principios de arquitectura de software de alta calidad.

### 1.2 Justificación Académica

Este caso de estudio demuestra que los patrones de diseño no son conceptos teóricos abstractos, sino soluciones prácticas a problemas reales de ingeniería:

- **Patrón Command**: Necesario para implementar historial de jugadas, funcionalidad de deshacer/rehacer, y transmisión de acciones a través de la red
- **Patrón State**: Esencial para gestionar diferentes comportamientos según el estado del juego (Lobby, Playing, GameOver) sin condicionales complejos
- **Patrón Observer**: Crítico para sincronizar el estado del juego entre múltiples clientes conectados en tiempo real
- **Patrón Strategy**: Permite implementar inteligencia artificial con diferentes niveles de dificultad de manera intercambiable
- **Lista Circular Doblemente Enlazada**: Estructura de datos perfecta para gestionar turnos que avanzan circularmente con capacidad de invertir dirección en O(1)
- **Grafos**: Modela relaciones entre jugadores para análisis de interacciones, rivalidades y estadísticas

### 1.3 Objetivos del Proyecto

Los objetivos principales de este caso de estudio fueron:

- **Aplicar patrones de diseño reconocidos** del catálogo Gang of Four para resolver problemas específicos del dominio
- **Implementar estructuras de datos especializadas** que optimicen las operaciones críticas del juego con complejidad temporal O(1)
- **Desarrollar una arquitectura escalable** capaz de manejar múltiples sesiones de juego concurrentes sin interferencia
- **Garantizar comunicación en tiempo real** entre los jugadores mediante WebSocket con latencia mínima
- **Demostrar principios SOLID** y buenas prácticas de ingeniería de software en un contexto real
- **Documentar decisiones arquitectónicas** con justificación técnica y análisis de complejidad

### 1.4 Alcance Técnico

El proyecto abarca las siguientes áreas técnicas:

**Backend** (Java 21 + Spring Boot 3.5.7):
- Implementación de 6 patrones de diseño (Command, State, Observer, Strategy, Singleton, Factory)
- 2 estructuras de datos personalizadas (Lista Circular Doblemente Enlazada, Grafo de Relaciones)
- Motor de juego con validación de reglas UNO oficiales
- Sistema de bots con inteligencia artificial estratégica
- Comunicación en tiempo real mediante WebSocket (STOMP)

**Frontend** (Next.js 15 + React 19):
- Interfaz de usuario interactiva con animaciones
- Cliente WebSocket con reconexión automática
- Gestión de estado global con Context API
- Visualización de efectos de cartas especiales

**Infraestructura**:
- Base de datos PostgreSQL 15 para persistencia
- Autenticación JWT + OAuth2 (Google, GitHub)
- Arquitectura de microservicios escalable horizontalmente

---

## 2. Arquitectura General del Sistema

El sistema fue diseñado siguiendo una arquitectura de tres capas con separación clara de responsabilidades:

### 2.1 Capa de Presentación (Frontend)

Implementada con Next.js 15 y React 19, esta capa maneja la interfaz de usuario y la experiencia del jugador. Utiliza TypeScript para garantizar seguridad de tipos y el API Context de React para gestión de estado global.

### 2.2 Capa de Lógica de Negocio (Backend)

Construida con Java 21 y Spring Boot 3.5.7, esta capa contiene toda la lógica del juego, validación de reglas, procesamiento de efectos y coordinación de sesiones. Se estructura en múltiples servicios especializados que colaboran mediante patrones de diseño bien definidos.

### 2.3 Capa de Persistencia

Utiliza PostgreSQL 15 con Spring Data JPA para almacenar información de usuarios, historial de partidas, estadísticas de jugadores y rankings globales.

### 2.4 Comunicación en Tiempo Real

La comunicación bidireccional entre frontend y backend se realiza mediante WebSocket utilizando el protocolo STOMP (Simple Text Oriented Messaging Protocol), con soporte de SockJS para compatibilidad con navegadores antiguos.

---

## 3. Patrones de Diseño Implementados

El proyecto implementa once patrones de diseño del catálogo "Gang of Four" más patrones arquitectónicos específicos del dominio. A continuación se detallan los más significativos:

### 3.1 Patrones Creacionales

#### 3.1.1 Patrón Singleton

**Propósito:** Garantizar que existe una única instancia del gestor central de juegos en toda la aplicación.

**Aplicación en el Proyecto:**
El `GameManager` actúa como registro central de todas las salas y sesiones de juego activas. Utiliza el patrón Singleton con inicialización por demanda (initialization-on-demand holder idiom) para garantizar thread-safety sin usar sincronización explícita. Esta clase mantiene tres colecciones concurrentes: un mapa de salas por código de sala, un mapa de sesiones por identificador, y un mapa de asociación entre salas y sesiones.

**Beneficio:** Proporciona un punto único de acceso a la información del estado global del juego, evitando inconsistencias y facilitando la coordinación entre múltiples partidas simultáneas.

#### 3.1.2 Patrón Factory

**Propósito:** Encapsular la lógica de creación de objetos complejos sin exponer los detalles de instanciación.

**Aplicación en el Proyecto:**
El `CardFactory` centraliza toda la lógica de creación de cartas. El juego UNO tiene seis tipos diferentes de cartas (numeradas, Skip, Reverse, Draw Two, Wild, y Wild Draw Four), cada una con comportamiento específico. La fábrica proporciona métodos para crear cartas individuales, mazos estándar de 108 cartas, o mazos personalizados para pruebas.

**Beneficio:** Simplifica la inicialización del juego, permite extender fácilmente el sistema con nuevos tipos de cartas, y centraliza las reglas de creación del mazo estándar.

#### 3.1.3 Patrón Builder

**Propósito:** Construir objetos complejos paso a paso mediante una interfaz fluida.

**Aplicación en el Proyecto:**
El `RoomBuilder` permite crear salas de juego con múltiples configuraciones opcionales: número máximo de jugadores, modo privado/público, líder de la sala, configuración de reglas personalizadas, y presencia de bots. Proporciona una API fluida que hace el código más legible y mantenible.

**Beneficio:** Evita constructores con múltiples parámetros, valida las configuraciones durante la construcción, y proporciona valores por defecto sensatos.

### 3.2 Patrones de Comportamiento

#### 3.2.1 Patrón State

**Propósito:** Permitir que un objeto altere su comportamiento cuando su estado interno cambia, aparentando que el objeto ha cambiado de clase.

**Ubicación en el Código:**
- Interfaz: `backend/src/main/java/com/oneonline/backend/pattern/behavioral/state/GameState.java`
- Implementaciones: `LobbyState.java`, `PlayingState.java`, `GameOverState.java`

**Diagrama de Transición de Estados:**

```
┌─────────────────────────────────────────────────────┐
│              DIAGRAMA DE ESTADOS                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [LOBBY] ──startGame()──> [PLAYING] ──endGame()──> [GAME_OVER]
│    ↑                           │                        │
│    │                      pauseGame()             playerLeave()
│    └──────────────────────────────────────────────────┘
│                                                         │
│ Acciones permitidas por estado:                         │
│ LOBBY:       JOIN, LEAVE, START_GAME                    │
│ PLAYING:     PLAY_CARD, DRAW_CARD, CALL_ONE, END       │
│ GAME_OVER:   LEAVE, VIEW_SCORES                        │
└─────────────────────────────────────────────────────┘
```

**Aplicación en el Proyecto:**
La sesión de juego puede estar en tres estados distintos: Lobby (esperando jugadores), Playing (partida activa), y GameOver (juego terminado). Cada estado implementa la interfaz `GameState` y define comportamiento específico para todas las acciones posibles del juego.

**Interfaz GameState:**

```java
public interface GameState {
    // Lifecycle
    void enter(GameSession session);
    void exit(GameSession session);

    // Game actions
    void playCard(Player player, Card card, GameSession session);
    void drawCard(Player player, GameSession session);
    void callOne(Player player, GameSession session);
    void chooseColor(Player player, CardColor color, GameSession session);

    // Player management
    void playerJoin(Player player, GameSession session);
    void playerLeave(Player player, GameSession session);

    // Game control
    void startGame(GameSession session);
    void pauseGame(GameSession session);
    void resumeGame(GameSession session);
    void endGame(GameSession session, Player winner);

    // Query methods
    String getStateName();
    boolean isActionAllowed(String action);
    String getStateDescription();
}
```

**Implementación: LobbyState**

Este estado representa la sala de espera donde los jugadores se unen antes de comenzar la partida:

```java
public class LobbyState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.LOBBY);
        log.info("Session {} entered LOBBY state", session.getSessionId());
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        if (session.getPlayers().size() >= session.getMaxPlayers()) {
            throw new IllegalStateException("Room is full");
        }
        session.getPlayers().add(player);
        log.info("Player {} joined lobby", player.getPlayerId());
    }

    @Override
    public void startGame(GameSession session) {
        int playerCount = session.getPlayers().size();

        if (playerCount < 2) {
            throw new IllegalStateException(
                "Need at least 2 players to start"
            );
        }

        // Inicializar el juego
        session.initializeDeck();
        session.distributeCards();

        // Transición de estado
        session.setState(new PlayingState());
        log.info("Game started, transitioning to PLAYING state");
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        throw new IllegalStateException(
            "Cannot play cards in LOBBY state. Start the game first."
        );
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        throw new IllegalStateException(
            "Cannot draw cards in LOBBY state"
        );
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("JOIN") ||
               action.equals("LEAVE") ||
               action.equals("START_GAME");
    }
}
```

**Implementación: PlayingState**

Este estado representa la partida activa donde los jugadores juegan sus cartas:

```java
public class PlayingState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.PLAYING);
        session.setGameStartTime(Instant.now());
        log.info("Session {} entered PLAYING state", session.getSessionId());
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        // Validar que sea el turno del jugador
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        // Validar que la carta sea válida
        Card topCard = session.getDiscardPile().peek();
        if (!isValidPlay(card, topCard, session)) {
            throw new IllegalStateException("Invalid card play");
        }

        // Remover carta de la mano del jugador
        player.getHand().remove(card);

        // Agregar a la pila de descarte
        session.getDiscardPile().push(card);

        // Verificar condición de victoria
        if (player.getHand().isEmpty()) {
            endGame(session, player);
            return;
        }

        // IMPORTANTE: NO avanzar el turno aquí
        // GameEngine lo hace después de aplicar efectos de carta
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        if (session.getDeck().isEmpty()) {
            session.reshuffleDeck();
        }

        Card drawnCard = session.getDeck().pop();
        player.getHand().add(drawnCard);
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        session.setWinner(winner);
        session.setGameEndTime(Instant.now());

        // Transición de estado
        session.setState(new GameOverState(winner));
        log.info("Game ended, player {} won", winner.getPlayerId());
    }

    @Override
    public void startGame(GameSession session) {
        throw new IllegalStateException(
            "Game already in progress"
        );
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("PLAY_CARD") ||
               action.equals("DRAW_CARD") ||
               action.equals("CALL_ONE") ||
               action.equals("PAUSE") ||
               action.equals("END");
    }

    private boolean isValidPlay(Card card, Card topCard, GameSession session) {
        // Wild cards pueden jugarse siempre
        if (card.isWild()) return true;

        // Mismo color
        if (card.getColor() == topCard.getColor()) return true;

        // Mismo número/tipo
        if (card.getType() == topCard.getType()) return true;

        // Si hay efectos pendientes, solo pueden jugarse cartas que apilen
        if (session.getPendingDrawCount() > 0) {
            return card.getType() == CardType.DRAW_TWO ||
                   card.getType() == CardType.WILD_DRAW_FOUR;
        }

        return false;
    }
}
```

**Implementación: GameOverState**

Este estado representa el fin de la partida:

```java
public class GameOverState implements GameState {
    private final Player winner;
    private Map<Player, Integer> finalScores;

    public GameOverState(Player winner) {
        this.winner = winner;
    }

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.GAME_OVER);
        session.setWinner(winner);

        // Calcular puntuaciones finales
        this.finalScores = calculateFinalScores(session);

        log.info("Session {} entered GAME_OVER state. Winner: {}",
                 session.getSessionId(), winner.getPlayerId());
    }

    private Map<Player, Integer> calculateFinalScores(GameSession session) {
        Map<Player, Integer> scores = new HashMap<>();

        for (Player player : session.getPlayers()) {
            int score = calculatePlayerScore(player);
            scores.put(player, score);
        }

        return scores;
    }

    private int calculatePlayerScore(Player player) {
        // Puntuación basada en cartas restantes
        int totalScore = 0;

        for (Card card : player.getHand()) {
            switch (card.getType()) {
                case NUMBER -> totalScore += card.getValue();
                case SKIP, REVERSE, DRAW_TWO -> totalScore += 20;
                case WILD, WILD_DRAW_FOUR -> totalScore += 50;
            }
        }

        return totalScore;
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        throw new IllegalStateException(
            "Game is over. Cannot play cards."
        );
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        throw new IllegalStateException(
            "Game is over. Cannot draw cards."
        );
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        session.getPlayers().remove(player);

        // Si todos abandonan, eliminar la sesión
        if (session.getPlayers().isEmpty()) {
            session.setState(null);
        }
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("LEAVE") ||
               action.equals("VIEW_SCORES");
    }

    public Map<Player, Integer> getFinalScores() {
        return finalScores;
    }
}
```

**Uso en GameSession:**

```java
public class GameSession {
    private GameState currentState;

    public GameSession() {
        this.currentState = new LobbyState();
        this.currentState.enter(this);
    }

    public void setState(GameState newState) {
        if (this.currentState != null) {
            this.currentState.exit(this);
        }
        this.currentState = newState;
        if (newState != null) {
            newState.enter(this);
        }
    }

    // Delegación a estado actual
    public void playCard(Player player, Card card) {
        currentState.playCard(player, card, this);
    }

    public void drawCard(Player player) {
        currentState.drawCard(player, this);
    }

    public void startGame() {
        currentState.startGame(this);
    }
}
```

**Beneficios del Patrón State:**

1. **Elimina Condicionales Complejos**: Sin el patrón State, el código estaría lleno de `if (status == LOBBY) {...} else if (status == PLAYING) {...}`
2. **Transiciones Explícitas**: Las transiciones entre estados son claras y controladas
3. **Open/Closed Principle**: Agregar nuevos estados (ej: PAUSED) no requiere modificar estados existentes
4. **Comportamiento Específico**: Cada estado tiene su propia lógica sin interferir con otros
5. **Facilita Testing**: Cada estado puede probarse independientemente

#### 3.2.2 Patrón Observer

**Propósito:** Definir una dependencia uno-a-muchos entre objetos para que cuando uno cambia de estado, todos sus dependientes sean notificados.

**Aplicación en el Proyecto:**
El motor de juego (`GameEngine`) actúa como sujeto observable, mientras que el `WebSocketObserver` actúa como observador. Cuando ocurren eventos importantes del juego (carta jugada, turno cambiado, jugador desconectado, juego terminado), el motor notifica a todos los observadores registrados, quienes se encargan de difundir la información a través de WebSocket a todos los clientes conectados.

**Eventos Observables Principales:**
- Eventos de jugadores: unirse, salir, desconectar, reconectar, transferencia de liderazgo
- Eventos de cartas: carta jugada, carta robada, llamado de UNO, penalización por no decir UNO
- Eventos de juego: inicio, finalización, pausa, cambio de turno, cambio de dirección, cambio de color

**Beneficio:** Desacopla la lógica del juego de la comunicación en tiempo real, permite agregar múltiples observadores fácilmente (por ejemplo, para logging o analytics), y facilita las pruebas unitarias.

#### 3.2.3 Patrón Command

**Propósito:** Encapsular una solicitud como un objeto, permitiendo parametrizar clientes con diferentes solicitudes, encolar operaciones, y soportar operaciones reversibles.

**Ubicación en el Código:**
- Interfaz: `backend/src/main/java/com/oneonline/backend/pattern/behavioral/command/GameCommand.java`
- Implementaciones: `PlayCardCommand.java`, `DrawCardCommand.java`, `CallOneCommand.java`

**Aplicación en el Proyecto:**
Cada acción del juego (jugar carta, robar carta, llamar UNO) se encapsula en un objeto comando que implementa la interfaz `GameCommand`. Esta interfaz define el contrato que todos los comandos deben cumplir:

```java
public interface GameCommand {
    void execute();              // Ejecuta la acción
    void undo();                 // Revierte la acción
    boolean canExecute();        // Valida si puede ejecutarse
    boolean isUndoable();        // Verifica si es reversible
    GameSession getSession();    // Obtiene la sesión
    String getCommandName();     // Nombre del comando
    String getDescription();     // Descripción legible
    long getTimestamp();         // Timestamp de creación
    void validate();            // Validación detallada
}
```

**Implementación: PlayCardCommand**

Esta clase encapsula la acción de jugar una carta. Guarda el estado necesario para poder deshacer la operación:

```java
public class PlayCardCommand implements GameCommand {
    private final Player player;
    private final Card card;
    private final GameSession session;
    private final long timestamp;

    // Estado guardado para undo
    private Player previousPlayer;
    private boolean previousOneFlag;
    private Card previousTopCard;

    @Override
    public void execute() {
        validate();
        saveState();

        // Remover carta de la mano del jugador
        player.getHand().remove(card);

        // Agregar carta a la pila de descarte
        session.getDiscardPile().push(card);

        // Resetear bandera de UNO si jugó carta
        if (player.hasCalledOne()) {
            player.setHasCalledOne(false);
        }
    }

    @Override
    public void undo() {
        if (!isUndoable()) {
            throw new IllegalStateException("Command cannot be undone");
        }

        // Devolver carta a la mano del jugador
        session.getDiscardPile().pop();
        player.getHand().add(card);

        // Restaurar estado previo
        restoreState();
    }

    private void saveState() {
        this.previousPlayer = session.getCurrentPlayer();
        this.previousOneFlag = player.hasCalledOne();
        this.previousTopCard = session.getDiscardPile().peek();
    }
}
```

**Implementación: DrawCardCommand**

Encapsula la acción de robar cartas del mazo. Soporta robar múltiples cartas (importante para efectos de +2 y +4):

```java
public class DrawCardCommand implements GameCommand {
    private final Player player;
    private final GameSession session;
    private final int cardCount;

    // Cartas robadas (para undo)
    private List<Card> drawnCards = new ArrayList<>();

    @Override
    public void execute() {
        validate();

        for (int i = 0; i < cardCount; i++) {
            // Verificar si el mazo tiene cartas
            if (session.getDeck().isEmpty()) {
                // Barajar pila de descarte y convertirla en mazo
                session.reshuffleDeck();
            }

            Card drawnCard = session.getDeck().pop();
            player.getHand().add(drawnCard);
            drawnCards.add(drawnCard);
        }
    }

    @Override
    public void undo() {
        // Remover las cartas robadas de la mano
        for (Card card : drawnCards) {
            player.getHand().remove(card);
            session.getDeck().push(card);
        }
        drawnCards.clear();
    }
}
```

**Implementación: CallOneCommand**

Encapsula la llamada de "UNO!" cuando un jugador tiene una carta:

```java
public class CallOneCommand implements GameCommand {
    private final Player player;
    private final GameSession session;

    @Override
    public void execute() {
        validate();
        player.setHasCalledOne(true);
    }

    @Override
    public void validate() {
        if (player.getHand().size() != 1) {
            throw new IllegalStateException(
                "Can only call ONE with exactly 1 card"
            );
        }

        if (player.hasCalledOne()) {
            throw new IllegalStateException(
                "Player has already called ONE"
            );
        }
    }

    @Override
    public void undo() {
        player.setHasCalledOne(false);
    }
}
```

**Integración en GameEngine:**

El motor de juego utiliza estos comandos para procesar las acciones de los jugadores:

```java
public class GameEngine {
    private final Stack<GameCommand> commandHistory = new Stack<>();

    public void processMove(Player player, Card card, GameSession session) {
        // Crear comando
        GameCommand command = new PlayCardCommand(player, card, session);

        // Ejecutar comando
        command.execute();

        // Guardar en historial
        commandHistory.push(command);
    }

    public void undoLastMove() {
        if (!commandHistory.isEmpty()) {
            GameCommand lastCommand = commandHistory.pop();
            lastCommand.undo();
        }
    }
}
```

**Casos de Uso del Patrón Command:**

1. **Historial de Movimientos**: Permite revisar todas las acciones realizadas en una partida
2. **Undo/Redo**: Funcionalidad para deshacer y rehacer movimientos
3. **Replay de Partidas**: Reproducir una partida completa desde el historial de comandos
4. **Transmisión por Red**: Los comandos pueden serializarse y enviarse a través de WebSocket
5. **Logging y Auditoría**: Registrar todas las acciones para análisis posterior
6. **Análisis de Torneos**: Estudiar estrategias analizando secuencias de comandos

**Beneficios Técnicos:**
- **Desacoplamiento**: La lógica de ejecución está separada de la lógica de negocio
- **Extensibilidad**: Agregar nuevos comandos no afecta el código existente
- **Testabilidad**: Cada comando puede probarse independientemente
- **Trazabilidad**: Cada acción queda registrada con timestamp y descripción

#### 3.2.4 Patrón Strategy

**Propósito:** Definir una familia de algoritmos, encapsular cada uno, y hacerlos intercambiables.

**Aplicación en el Proyecto:**
Los jugadores controlados por inteligencia artificial (bots) utilizan el patrón Strategy para tomar decisiones. La interfaz `BotStrategy` define métodos para elegir carta, elegir color (para cartas comodín), y decidir cuándo llamar UNO. Diferentes estrategias pueden implementar desde comportamiento básico hasta algoritmos sofisticados.

**Algoritmo de Decisión del Bot:**
1. Si hay efectos de robo pendientes (+2 o +4), solo considera cartas que puedan apilar
2. Si tiene dos cartas, prefiere cartas especiales para ganar rápidamente
3. Prefiere Wild Draw Four cuando detecta que oponentes tienen pocas cartas
4. Prefiere cartas de acción (Skip, Reverse, Draw Two) para interrumpir oponentes
5. Prefiere cartas que coincidan con el color actual
6. Juega cartas numeradas como opción segura
7. Usa cartas Wild como último recurso

**Beneficio:** Separa la lógica de IA de la lógica del jugador humano, permite probar y modificar estrategias independientemente, y facilita la implementación de diferentes niveles de dificultad.

### 3.3 Patrones Estructurales

#### 3.3.1 Patrón Adapter

**Propósito:** Convertir la interfaz de una clase en otra interfaz que los clientes esperan.

**Aplicación en el Proyecto:**
El `BotPlayerAdapter` adapta la clase `BotPlayer` para que sea compatible con la interfaz `Player` esperada por el motor de juego. Esto permite que bots y humanos sean tratados uniformemente en la lógica del juego.

**Beneficio:** Permite que el código del motor de juego no diferencie entre jugadores humanos y bots, simplificando la lógica y permitiendo agregar nuevos tipos de jugadores en el futuro.

#### 3.3.2 Patrón Decorator

**Propósito:** Agregar responsabilidades a objetos dinámicamente.

**Aplicación en el Proyecto:**
El `CardDecorator` permite agregar efectos adicionales o mejoras a cartas existentes sin modificar sus clases base. Esto podría usarse para implementar power-ups temporales, efectos de modo de juego especiales, o modificadores de evento.

**Ejemplos de Decoradores:**
- **EffectDecorator:** Agrega efectos visuales o sonoros a las cartas
- **PowerUpDecorator:** Agrega poderes temporales (ejemplo: duplicar efecto de +2)

**Beneficio:** Extiende funcionalidad sin modificar código existente (Principio Open/Closed), permite combinar múltiples decoradores, y mantiene las clases base simples.

---

## 4. Estructuras de Datos Implementadas

El proyecto implementa tanto estructuras de datos personalizadas optimizadas para el dominio del juego, como estructuras estándar de Java utilizadas estratégicamente.

### 4.1 Estructuras de Datos Personalizadas

#### 4.1.1 Lista Circular Doblemente Enlazada

**Propósito:** Gestionar el orden de turnos de los jugadores con capacidad de avanzar, retroceder, invertir dirección y saltar jugadores en tiempo constante.

**Características Técnicas:**
Esta estructura consiste en nodos donde cada uno contiene un dato (jugador) y dos referencias: una al siguiente nodo y otra al nodo anterior. El último nodo apunta al primero y el primer nodo apunta al último, creando un círculo. Adicionalmente, mantiene una bandera de dirección (horaria/antihoraria) que determina qué referencias se consideran "siguiente" y "anterior".

**Operaciones y Complejidad Temporal:**
- Agregar jugador: O(1) - inserción al final del círculo
- Obtener siguiente jugador: O(1) - avanzar una posición
- Obtener jugador anterior: O(1) - retroceder una posición
- Invertir dirección: O(1) - invertir la bandera de dirección
- Saltar jugador: O(1) - avanzar dos posiciones
- Eliminar jugador actual: O(1) - reenlazar nodos adyacentes
- Buscar jugador: O(n) - recorrido lineal

**Aplicación en el Juego:**
El gestor de turnos (`TurnManager`) utiliza esta estructura para mantener el orden de los jugadores. Cuando un jugador juega una carta Reverse, simplemente se invierte la bandera de dirección sin reordenar físicamente la lista. Cuando se juega una carta Skip, se avanzan dos posiciones en lugar de una. Cuando un jugador gana o abandona, se elimina del círculo manteniendo la continuidad del juego.

**Ventaja sobre Alternativas:**
Una implementación con lista estándar (ArrayList) requeriría índices modulares con operaciones de módulo repetidas, manejo especial de límites, y código más complejo para la inversión. La lista circular elimina completamente estas preocupaciones, resultando en código más limpio y eficiente.

#### 4.1.2 Árbol de Decisión

**Propósito:** Modelar la lógica de toma de decisiones de los bots mediante una estructura jerárquica.

**Aplicación en el Proyecto:**
Cada nodo del árbol representa una pregunta o condición (¿hay efectos pendientes?, ¿tengo pocas cartas?, ¿coincide el color?), y las ramas representan las posibles respuestas. El bot recorre el árbol desde la raíz hasta una hoja para determinar qué carta jugar.

**Beneficio:** Hace explícita y visualizable la lógica de decisión, facilita el ajuste de la estrategia del bot, y permite implementar aprendizaje automático en el futuro.

#### 4.1.3 Grafo de Relaciones entre Jugadores

**Propósito:** Rastrear interacciones entre jugadores para estadísticas y análisis de rivalidades.

**Estructura Técnica:**
Implementado como una lista de adyacencia donde cada jugador es un vértice, y las aristas representan interacciones (carta +2 jugada contra, partidas ganadas contra, cartas Skip usadas contra). Cada arista tiene un peso que cuenta el número de veces que ocurrió esa interacción.

**Aplicaciones:**
- Generar estadísticas de rivalidades
- Identificar "archienemigos" para modos de torneo
- Análisis de patrones de juego
- Recomendaciones de emparejamiento

**Beneficio:** Proporciona contexto social al juego, permite análisis avanzados, y podría usarse para implementar un sistema de reputación o logros.

### 4.2 Estructuras de Datos Estándar Utilizadas

El proyecto hace uso estratégico de estructuras de datos estándar de Java, eligiendo la más apropiada para cada caso de uso:

#### 4.2.1 Stack (Pila)

**Aplicaciones:**
- **Pila de Descarte:** Las cartas descartadas se apilan, con la carta superior visible determinando qué cartas pueden jugarse
- **Mazo de Cartas:** El mazo funciona como una pila de donde se roban cartas desde la cima
- **Historial de Comandos:** Los comandos ejecutados se apilan para permitir deshacer operaciones

**Justificación:** Las operaciones de apilar y desapilar en O(1) son exactamente lo que requieren estos casos de uso.

#### 4.2.2 ConcurrentHashMap

**Aplicaciones:**
- **Registro de Salas:** Búsqueda rápida de salas por código
- **Registro de Sesiones:** Búsqueda rápida de sesiones por identificador
- **Mapeo Sala-Sesión:** Asociación bidireccional entre salas y sesiones activas

**Justificación:** Proporciona acceso en O(1) promedio y thread-safety sin sincronización explícita, crucial para un sistema concurrente con múltiples partidas simultáneas.

#### 4.2.3 ArrayList

**Aplicaciones:**
- **Lista de Jugadores en Sala:** Pequeña cantidad de elementos (máximo 4), acceso por índice frecuente
- **Mano de Jugador:** Cartas en mano del jugador, necesita iteración rápida y acceso aleatorio
- **Lista de Bots:** Gestión de jugadores artificiales en la sala

**Justificación:** Excelente rendimiento para listas pequeñas con acceso frecuente por posición, bajo uso de memoria comparado con LinkedList.

#### 4.2.4 Queue (Cola)

**Aplicación:**
- **Cola de Efectos:** Los efectos de cartas especiales se procesan en orden FIFO (First In, First Out)

**Justificación:** Garantiza que los efectos se procesen en el orden exacto en que fueron generados, evitando inconsistencias.

---

## 5. Componentes Clave del Sistema

### 5.1 Motor de Juego (GameEngine)

El `GameEngine` es el componente central que coordina toda la lógica del juego. Sus responsabilidades incluyen:

- Validar movimientos de jugadores
- Procesar cartas jugadas
- Gestionar el flujo de turnos
- Aplicar efectos de cartas especiales
- Detectar condiciones de victoria
- Mantener integridad del estado del juego

El motor utiliza múltiples patrones de diseño en colaboración: recibe comandos, valida estados, consulta estrategias de bots, notifica observadores, y coordina con el procesador de efectos.

### 5.2 Gestor de Turnos (TurnManager)

El `TurnManager` encapsula toda la lógica relacionada con el orden de turnos utilizando la lista circular doblemente enlazada. Sus operaciones principales son:

- `getNextPlayer()`: Avanza al siguiente jugador en el orden actual
- `reverseDirection()`: Invierte la dirección del juego (por carta Reverse)
- `skipCurrentPlayer()`: Salta un jugador (por carta Skip)
- `addPlayer()` y `removePlayer()`: Gestiona jugadores que se unen o abandonan

Esta separación de responsabilidades mantiene el motor de juego limpio y enfocado.

### 5.3 Procesador de Efectos (EffectProcessor)

El `EffectProcessor` maneja los efectos de las cartas especiales del juego:

- **Draw Two (+2):** Agrega dos cartas a robar al siguiente jugador, o si está habilitado el apilamiento, permite que el siguiente jugador juegue otra +2 para acumular el efecto
- **Wild Draw Four (+4):** Similar a +2 pero con cuatro cartas y cambio de color
- **Skip:** Instruye al TurnManager para saltar al siguiente jugador
- **Reverse:** Instruye al TurnManager para invertir la dirección
- **Wild:** Solicita al jugador que elija un nuevo color

El procesador mantiene un contador de cartas pendientes a robar que se acumula cuando se apilan cartas +2 o +4.

### 5.4 Validador de Cartas (CardValidator)

El `CardValidator` contiene toda la lógica de validación de reglas del juego UNO:

- Verifica que una carta pueda jugarse sobre otra (mismo color, mismo número, o comodín)
- Valida que sea el turno del jugador
- Verifica que el jugador tenga la carta en su mano
- Confirma que no hay acciones pendientes que deban resolverse primero

Esta separación hace el código más testeable y mantiene las reglas del juego centralizadas.

### 5.5 Comunicación WebSocket

La arquitectura de comunicación en tiempo real se basa en tres componentes:

**En el Backend:**
- **WebSocketConfig:** Configura STOMP sobre WebSocket con puntos de conexión en `/ws`
- **WebSocketGameController:** Maneja mensajes entrantes del cliente (jugar carta, robar carta, enviar chat)
- **WebSocketObserver:** Difunde eventos del juego a todos los clientes suscritos al topic

**En el Frontend:**
- **WebSocketService:** Cliente STOMP singleton que mantiene la conexión, maneja reconexiones automáticas, y emite eventos a suscriptores
- **GameContext:** Suscribe al servicio WebSocket, transforma eventos recibidos en actualizaciones de estado de React, y proporciona funciones para enviar acciones al servidor

**Flujo de Comunicación:**
1. Usuario hace clic en una carta en la interfaz
2. GameContext envía mensaje STOMP a `/app/game/{sessionId}/play-card`
3. WebSocketGameController recibe el mensaje y ejecuta el comando
4. GameEngine procesa la jugada y notifica a observadores
5. WebSocketObserver difunde el nuevo estado a `/topic/game/{sessionId}`
6. Todos los clientes suscritos reciben la actualización
7. GameContext actualiza el estado de React
8. Componentes se re-renderizan mostrando el nuevo estado

Este flujo garantiza que todos los jugadores vean el mismo estado del juego en tiempo real con latencia mínima.

---

## 6. Gestión de Estado y Persistencia

### 6.1 Estado en Memoria

El estado activo del juego se mantiene completamente en memoria durante la partida para garantizar rendimiento óptimo:

- **GameSession:** Contiene el estado completo de una partida (jugadores, mazo, pila de descarte, turno actual, efectos pendientes)
- **Room:** Representa una sala de espera antes de iniciar el juego
- **Player:** Estado individual de cada jugador (mano de cartas, si llamó UNO, estado de conexión)

### 6.2 Persistencia en Base de Datos

Al finalizar cada partida, se persisten datos clave en PostgreSQL:

- **GameHistory:** Registro de la partida (ganador, duración, número de turnos, fecha)
- **PlayerStats:** Estadísticas acumulativas de cada jugador (partidas ganadas, partidas jugadas, cartas especiales más usadas, tiempo total jugado)
- **GlobalRanking:** Ranking global con sistema de puntos ELO

Esta separación entre estado en memoria y persistencia permite escalabilidad horizontal del backend y recuperación ante fallos.

---

## 7. Seguridad y Autenticación

El sistema implementa múltiples capas de seguridad:

### 7.1 Autenticación

- **JWT (JSON Web Tokens):** Tokens firmados con expiración de 24 horas
- **OAuth2:** Integración con Google y GitHub para inicio de sesión social
- **Autenticación de Invitados:** Permite jugar sin cuenta, almacenando estado localmente
- **Refresh Tokens:** Tokens de larga duración para renovar access tokens sin requerir login

### 7.2 Autorización

- **Spring Security:** Filtra todas las solicitudes HTTP validando tokens
- **WebSocket Auth:** Interceptor que valida JWT antes de establecer conexión WebSocket
- **Validación de Turno:** El servidor verifica que un jugador solo pueda jugar en su turno
- **Prevención de Trampa:** El servidor es la única fuente de verdad, los clientes solo envían intenciones que son validadas

---

## 8. Beneficios de la Arquitectura Implementada

### 8.1 Mantenibilidad

La aplicación consistente de patrones de diseño y la separación clara de responsabilidades resultan en código altamente mantenible:

- Cada clase tiene un propósito único y bien definido
- Los patrones proporcionan vocabulario común para el equipo
- Las estructuras de datos personalizadas encapsulan complejidad
- El código sigue principios SOLID

### 8.2 Escalabilidad

El diseño permite escalar horizontalmente agregando más servidores:

- El backend es stateless a nivel de servidor individual
- ConcurrentHashMap garantiza thread-safety para acceso concurrente
- WebSocket puede distribuirse con un broker de mensajes (RabbitMQ, Redis Pub/Sub)
- La base de datos se puede escalar con réplicas de lectura

### 8.3 Extensibilidad

Nuevas características pueden agregarse con mínimo impacto en código existente:

- Nuevos tipos de cartas: crear subclase de Card y actualizar CardFactory
- Nuevos modos de juego: implementar nueva GameState
- Mejores bots: implementar nueva BotStrategy
- Nuevos efectos de cartas: crear CardDecorator específico
- Nuevas reglas: extender CardValidator con nueva lógica

### 8.4 Testabilidad

Los patrones implementados facilitan pruebas unitarias y de integración:

- El patrón Command permite probar acciones aisladamente
- El patrón Strategy permite probar estrategias de bot independientemente
- El patrón Observer permite probar lógica de juego sin WebSocket
- Las interfaces claras facilitan el uso de mocks

---

## 9. Desafíos Técnicos Superados

### 9.1 Gestión de Turnos Circulares

**Desafío:** Manejar turnos que deben avanzar circularmente, con posibilidad de invertir dirección y saltar jugadores.

**Solución:** Implementación de la lista circular doblemente enlazada con bandera de dirección. Esta estructura permite todas las operaciones de gestión de turnos en O(1), eliminando la complejidad de manejar índices modulares y condiciones de borde.

### 9.2 Apilamiento de Cartas +2 y +4

**Desafío:** Cuando un jugador juega +2 o +4, el siguiente jugador debe robar cartas a menos que también tenga una carta similar para apilar el efecto.

**Solución:** El `EffectProcessor` mantiene un contador de cartas pendientes a robar (`pendingDrawCount`). Cuando se juega una carta de robo, se incrementa el contador. En el turno del siguiente jugador, si no puede apilar, debe robar todas las cartas acumuladas y perder su turno.

### 9.3 Sincronización en Tiempo Real

**Desafío:** Garantizar que todos los jugadores vean el mismo estado del juego simultáneamente, incluso con latencia de red variable.

**Solución:** Implementación del patrón Observer con difusión WebSocket. El servidor es la única fuente de verdad; los clientes envían intenciones que el servidor valida y procesa. Los clientes solo actualizan su estado cuando reciben confirmación del servidor.

### 9.4 Detección de "UNO" no Declarado

**Desafío:** Un jugador con una carta debe decir "UNO". Si no lo hace, otro jugador puede pescarlo y debe robar cartas de penalización.

**Solución:** El servidor rastrea si cada jugador llamó UNO mediante una bandera booleana. Cuando un jugador tiene una carta y no ha llamado UNO, cualquier otro jugador puede enviar una acción de "catch" que aplica la penalización. El `OneManager` maneja toda esta lógica de forma centralizada.

### 9.5 Reconexión de Jugadores

**Desafío:** Si un jugador pierde conexión temporalmente, debe poder reconectarse y continuar la partida.

**Solución:** Cuando un cliente detecta desconexión, intenta reconectar automáticamente hasta 5 veces con backoff exponencial. El servidor mantiene el estado de la sesión por 5 minutos después de una desconexión. Si el jugador reconecta a tiempo, el servidor le envía el estado actual completo para sincronizarse.

### 9.6 Transferencia de Liderazgo

**Desafío:** Si el líder de una sala (quien puede iniciar el juego y cambiar configuraciones) abandona, debe transferirse el liderazgo a otro jugador.

**Solución:** El `RoomManager` detecta cuando el líder se desconecta o abandona, y automáticamente transfiere el liderazgo al primer jugador humano conectado. Si no hay jugadores humanos disponibles, la sala se cierra.

---

## 10. Métricas de Complejidad

### 10.1 Complejidad Temporal de Operaciones Críticas

| Operación | Complejidad | Estructura Utilizada |
|-----------|-------------|---------------------|
| Avanzar turno | O(1) | Lista Circular Doblemente Enlazada |
| Invertir dirección | O(1) | Lista Circular Doblemente Enlazada |
| Saltar jugador | O(1) | Lista Circular Doblemente Enlazada |
| Buscar sala por código | O(1) promedio | ConcurrentHashMap |
| Buscar sesión por ID | O(1) promedio | ConcurrentHashMap |
| Validar jugada | O(n) | Iteración sobre reglas (n pequeño) |
| Robar carta del mazo | O(1) | Stack |
| Descartar carta | O(1) | Stack |
| Procesar efecto de carta | O(1) | Lógica directa |

### 10.2 Complejidad Espacial

- **Por Sesión de Juego:** O(n) donde n = número de jugadores (máximo 4)
- **Mazo de Cartas:** O(108) = O(1) - tamaño constante
- **Mano de Jugador:** O(m) donde m = número de cartas en mano (típicamente 1-15)
- **Historial de Comandos:** O(k) donde k = número de turnos en la partida
- **Registro Global de Sesiones:** O(s) donde s = número de sesiones activas

---

## 11. Lecciones Aprendidas y Buenas Prácticas

### 11.1 La Importancia de Elegir la Estructura de Datos Correcta

La decisión de implementar una lista circular doblemente enlazada específicamente para la gestión de turnos demuestra cómo una estructura de datos bien elegida puede simplificar dramáticamente la lógica del programa. Alternativas como ArrayList con índices modulares habrían funcionado, pero con código significativamente más complejo y propenso a errores.

### 11.2 Los Patrones de Diseño No Son Dogma

Aunque el proyecto implementa 11 patrones de diseño diferentes, cada uno se utilizó porque resolvía un problema específico real. Los patrones nunca se forzaron artificialmente; surgieron naturalmente de los requisitos del dominio.

### 11.3 El Poder del Patrón Observer para Sistemas en Tiempo Real

El patrón Observer fue crucial para mantener el sistema desacoplado mientras sincronizaba múltiples clientes. La separación entre la lógica del juego y la difusión WebSocket facilitó enormemente las pruebas y el mantenimiento.

### 11.4 La Separación de Responsabilidades Paga Dividendos

Componentes como `CardValidator`, `EffectProcessor`, `TurnManager` y `OneManager` podrían haber sido parte de una clase monolítica `Game`. Separarlos en componentes especializados hizo el código más fácil de entender, probar y modificar.

### 11.5 La Documentación Mediante Patrones

Usar patrones de diseño reconocidos sirve como documentación automática. Un desarrollador que lee "GameManager es un Singleton" inmediatamente entiende su propósito y comportamiento sin necesidad de leer todo el código.

---

## 12. Oportunidades de Mejora y Trabajo Futuro

### 12.1 Optimizaciones de Rendimiento

- **Pooling de Objetos:** Implementar pool de objetos Card para reducir presión en el garbage collector
- **Caching de Estado:** Cachear estados de juego serializados para reconexiones más rápidas
- **Compresión de Mensajes WebSocket:** Reducir ancho de banda con compresión de mensajes JSON

### 12.2 Características Adicionales

- **Modo Torneo:** Sistema de eliminación o liga con gestión de múltiples partidas
- **Replay de Partidas:** Utilizar el historial de comandos para reproducir partidas
- **Análisis de Partidas:** Estadísticas detalladas y visualizaciones de desempeño
- **Sistema de Logros:** Badges y logros desbloqueables por hitos específicos
- **Chat de Voz:** Integración de comunicación por voz durante las partidas

### 12.3 Mejoras Arquitectónicas

- **Event Sourcing:** Implementar almacenamiento basado en eventos para mejor auditoría y capacidad de replay
- **CQRS:** Separar comandos (acciones de juego) de queries (consulta de estado) para mejor escalabilidad
- **Microservicios:** Separar componentes en servicios independientes (autenticación, juego, ranking)
- **Kubernetes:** Orquestación de contenedores para auto-escalado y alta disponibilidad

---

## 13. Conclusiones

### 13.1 Cumplimiento de Objetivos

El proyecto cumplió exitosamente todos sus objetivos iniciales:

✓ **Aplicación práctica de patrones de diseño:** Se implementaron 11 patrones del catálogo Gang of Four de manera orgánica y efectiva

✓ **Uso de estructuras de datos avanzadas:** La lista circular doblemente enlazada personalizada demostró ser la solución perfecta para la gestión de turnos

✓ **Arquitectura escalable:** El diseño permite escalar horizontalmente y manejar múltiples sesiones concurrentes

✓ **Comunicación en tiempo real:** WebSocket con STOMP proporciona sincronización efectiva entre todos los clientes

✓ **Principios SOLID:** El código exhibe alta cohesión, bajo acoplamiento, y responsabilidades bien definidas

### 13.2 Valor Educativo

Este caso de estudio demuestra que los patrones de diseño y estructuras de datos no son conceptos teóricos abstractos, sino herramientas prácticas que resuelven problemas reales de ingeniería de software. Cada decisión técnica en el proyecto responde a un requisito específico del dominio.

### 13.3 Aplicabilidad a Otros Proyectos

Los patrones y técnicas implementados son transferibles a otros dominios:

- **Sistemas de turnos por rondas:** Juegos de mesa, sistemas de planificación, gestión de recursos
- **Comunicación en tiempo real:** Chat, colaboración en documentos, dashboards en vivo
- **Sistemas con reglas complejas:** Motores de flujo de trabajo, validadores de transacciones, procesadores de eventos
- **Gestión de sesiones concurrentes:** Salas de conferencia virtuales, reservación de recursos, sistemas de colas

### 13.4 Reflexión Final

El desarrollo de este sistema de juego UNO multiplayer en tiempo real ha demostrado que una arquitectura bien diseñada, basada en patrones probados y estructuras de datos apropiadas, resulta en software robusto, mantenible y escalable. La inversión inicial en diseño cuidadoso se traduce en facilidad de extensión, simplicidad de depuración y confianza en el comportamiento del sistema.

Los patrones de diseño no son fórmulas mágicas, sino vocabulario compartido y soluciones documentadas a problemas recurrentes. Las estructuras de datos no son detalles de implementación irrelevantes, sino fundamentos que determinan la eficiencia y elegancia del código. Juntos, patrones y estructuras forman el cimiento de la ingeniería de software profesional.

Este proyecto sirve como testimonio de que la teoría de la computación y la ingeniería de software práctica no están en conflicto, sino que se complementan: la teoría provee las herramientas, y la práctica determina cuándo y cómo usarlas efectivamente.

---

## Referencias y Recursos

### Patrones de Diseño
- Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.

### Estructuras de Datos
- Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.

### Arquitectura de Software
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.

### Tecnologías Utilizadas
- Spring Framework Documentation: https://spring.io/projects/spring-boot
- React Documentation: https://react.dev/
- STOMP Protocol Specification: https://stomp.github.io/

---

*Documento generado como parte del análisis técnico del proyecto UNO Online Game*
*Fecha: Noviembre 2025*
