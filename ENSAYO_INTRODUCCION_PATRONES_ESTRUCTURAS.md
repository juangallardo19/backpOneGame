# Caso de Estudio: Juego UNO Online
## Implementación de Patrones de Diseño y Estructuras de Datos

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Patrones de Diseño Implementados](#2-patrones-de-diseño-implementados)
   - [2.1 Patrón Command](#21-patrón-command)
   - [2.2 Patrón State](#22-patrón-state)
   - [2.3 Patrón Observer](#23-patrón-observer)
   - [2.4 Patrón Strategy](#24-patrón-strategy)
3. [Estructuras de Datos Implementadas](#3-estructuras-de-datos-implementadas)
   - [3.1 Lista Circular Doblemente Enlazada](#31-lista-circular-doblemente-enlazada)
   - [3.2 Grafo de Relaciones entre Jugadores](#32-grafo-de-relaciones-entre-jugadores)
4. [Conclusiones](#4-conclusiones)

---

## 1. Introducción

### 1.1 Contexto del Proyecto

El desarrollo de aplicaciones multiplayer en tiempo real representa uno de los desafíos más complejos en la ingeniería de software moderna. Este proyecto implementa una versión digital del juego de cartas UNO, un caso de estudio ideal que combina múltiples dimensiones de complejidad técnica:

- **Gestión de turnos circulares**: Los jugadores deben turnarse en orden circular con capacidad de invertir dirección
- **Procesamiento de efectos especiales**: Cartas como Skip, Reverse, Draw Two y Wild Draw Four modifican el flujo del juego
- **Sincronización en tiempo real**: Múltiples clientes deben visualizar el mismo estado del juego simultáneamente
- **Coordinación de sesiones concurrentes**: El servidor debe manejar múltiples partidas simultáneas sin interferencia

### 1.2 Arquitectura General

El sistema está construido con una arquitectura de tres capas:

**Backend** (Java 21 + Spring Boot 3.5.7):
- Motor de juego con validación de reglas UNO oficiales
- Sistema de bots con inteligencia artificial
- Comunicación en tiempo real mediante WebSocket (STOMP)
- Persistencia con PostgreSQL 15

**Frontend** (Next.js 15 + React 19):
- Interfaz de usuario interactiva con animaciones
- Cliente WebSocket con reconexión automática
- Gestión de estado global con Context API

**Infraestructura**:
- Autenticación JWT + OAuth2 (Google, GitHub)
- Arquitectura escalable horizontalmente

### 1.3 Justificación Técnica

Este caso de estudio demuestra que los patrones de diseño y estructuras de datos no son conceptos teóricos abstractos, sino soluciones prácticas a problemas reales:

| Problema Técnico | Solución Implementada | Beneficio Obtenido |
|------------------|----------------------|-------------------|
| Historial de movimientos y undo/redo | **Patrón Command** | Cada acción es un objeto reversible |
| Comportamiento según fase del juego | **Patrón State** | Elimina condicionales complejos |
| Sincronización de múltiples clientes | **Patrón Observer** | Desacoplamiento total |
| Inteligencia artificial de bots | **Patrón Strategy** | Algoritmos intercambiables |
| Turnos circulares con inversión | **Lista Circular Doble** | Operaciones O(1) |
| Análisis de rivalidades | **Grafo de Relaciones** | Modelado de interacciones |

### 1.4 Objetivos del Documento

Este documento presenta:

1. **Implementación detallada** de 4 patrones de diseño (Command, State, Observer, Strategy)
2. **Código fuente real** con explicaciones técnicas
3. **Análisis de complejidad** de las estructuras de datos
4. **Casos de uso prácticos** de cada patrón y estructura
5. **Integración completa** mostrando cómo trabajan juntos

---

## 2. Patrones de Diseño Implementados

### 2.1 Patrón Command

#### 2.1.1 Concepto y Propósito

El patrón Command encapsula una solicitud como un objeto independiente que contiene toda la información necesaria para ejecutar una acción. Esto permite:

- **Parametrizar objetos** con diferentes operaciones
- **Encolar operaciones** para ejecución posterior
- **Registrar historial** de operaciones ejecutadas
- **Soportar undo/redo** guardando el estado anterior

#### 2.1.2 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/pattern/behavioral/command/
├── GameCommand.java              (Interfaz)
├── PlayCardCommand.java          (Implementación)
├── DrawCardCommand.java          (Implementación)
└── CallOneCommand.java           (Implementación)
```

#### 2.1.3 Interfaz GameCommand

La interfaz define el contrato que todos los comandos deben cumplir:

```java
public interface GameCommand {
    // Métodos principales
    void execute();              // Ejecuta la acción
    void undo();                 // Revierte la acción
    boolean canExecute();        // Valida si puede ejecutarse
    boolean isUndoable();        // Verifica si es reversible

    // Métodos de consulta
    GameSession getSession();    // Obtiene la sesión
    String getCommandName();     // Nombre del comando
    String getDescription();     // Descripción legible
    long getTimestamp();         // Timestamp de creación

    // Validación detallada
    void validate();            // Lanza excepción si no es válido
}
```

#### 2.1.4 Implementación: PlayCardCommand

Esta clase encapsula la acción de jugar una carta en el tablero:

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

    public PlayCardCommand(Player player, Card card, GameSession session) {
        this.player = player;
        this.card = card;
        this.session = session;
        this.timestamp = System.currentTimeMillis();
    }

    @Override
    public void execute() {
        // 1. Validar que la acción sea válida
        validate();

        // 2. Guardar estado actual (para undo)
        saveState();

        // 3. Remover carta de la mano del jugador
        player.getHand().remove(card);

        // 4. Agregar carta a la pila de descarte
        session.getDiscardPile().push(card);

        // 5. Resetear bandera de UNO si jugó carta
        if (player.hasCalledOne()) {
            player.setHasCalledOne(false);
        }

        log.info("Player {} played card {}", player.getId(), card.getType());
    }

    @Override
    public void undo() {
        if (!isUndoable()) {
            throw new IllegalStateException("Command cannot be undone");
        }

        // Revertir cambios en orden inverso
        session.getDiscardPile().pop();
        player.getHand().add(card);
        restoreState();

        log.info("Undone play card command for player {}", player.getId());
    }

    @Override
    public void validate() {
        // Verificar que el jugador tenga la carta
        if (!player.getHand().contains(card)) {
            throw new IllegalStateException("Player doesn't have this card");
        }

        // Verificar que sea el turno del jugador
        if (!session.getCurrentPlayer().equals(player)) {
            throw new IllegalStateException("Not player's turn");
        }

        // Verificar que la carta sea válida según las reglas
        Card topCard = session.getDiscardPile().peek();
        if (!isValidPlay(card, topCard)) {
            throw new IllegalStateException("Invalid card play");
        }
    }

    private void saveState() {
        this.previousPlayer = session.getCurrentPlayer();
        this.previousOneFlag = player.hasCalledOne();
        this.previousTopCard = session.getDiscardPile().peek();
    }

    private void restoreState() {
        session.setCurrentPlayer(previousPlayer);
        player.setHasCalledOne(previousOneFlag);
    }

    @Override
    public boolean isUndoable() {
        return true;
    }

    @Override
    public String getCommandName() {
        return "PLAY_CARD";
    }

    @Override
    public String getDescription() {
        return String.format("Player %s plays %s",
                           player.getNickname(),
                           card.getType());
    }
}
```

#### 2.1.5 Implementación: DrawCardCommand

Encapsula la acción de robar cartas del mazo:

```java
public class DrawCardCommand implements GameCommand {
    private final Player player;
    private final GameSession session;
    private final int cardCount;

    // Cartas robadas (necesario para undo)
    private List<Card> drawnCards = new ArrayList<>();

    public DrawCardCommand(Player player, GameSession session, int cardCount) {
        this.player = player;
        this.session = session;
        this.cardCount = cardCount;
    }

    @Override
    public void execute() {
        validate();

        for (int i = 0; i < cardCount; i++) {
            // Verificar si el mazo tiene cartas
            if (session.getDeck().isEmpty()) {
                // Barajar pila de descarte y convertirla en mazo
                session.reshuffleDeck();
            }

            // Robar carta del mazo
            Card drawnCard = session.getDeck().pop();
            player.getHand().add(drawnCard);
            drawnCards.add(drawnCard);
        }

        log.info("Player {} drew {} cards", player.getId(), cardCount);
    }

    @Override
    public void undo() {
        // Remover las cartas robadas de la mano
        for (Card card : drawnCards) {
            player.getHand().remove(card);
            session.getDeck().push(card);
        }
        drawnCards.clear();

        log.info("Undone draw command for player {}", player.getId());
    }

    @Override
    public void validate() {
        if (!session.getCurrentPlayer().equals(player)) {
            throw new IllegalStateException("Not player's turn");
        }

        if (cardCount <= 0) {
            throw new IllegalArgumentException("Card count must be positive");
        }
    }

    @Override
    public boolean isUndoable() {
        return true;
    }

    @Override
    public String getCommandName() {
        return "DRAW_CARD";
    }

    @Override
    public String getDescription() {
        return String.format("Player %s draws %d card(s)",
                           player.getNickname(),
                           cardCount);
    }
}
```

#### 2.1.6 Implementación: CallOneCommand

Encapsula la acción de llamar "UNO!" cuando un jugador tiene una carta:

```java
public class CallOneCommand implements GameCommand {
    private final Player player;
    private final GameSession session;
    private final long timestamp;

    // Estado anterior para undo
    private boolean previousOneFlag;

    public CallOneCommand(Player player, GameSession session) {
        this.player = player;
        this.session = session;
        this.timestamp = System.currentTimeMillis();
    }

    @Override
    public void execute() {
        validate();
        previousOneFlag = player.hasCalledOne();
        player.setHasCalledOne(true);

        log.info("Player {} called ONE", player.getId());
    }

    @Override
    public void undo() {
        player.setHasCalledOne(previousOneFlag);
    }

    @Override
    public void validate() {
        // Solo puede llamar ONE si tiene exactamente 1 carta
        if (player.getHand().size() != 1) {
            throw new IllegalStateException(
                "Can only call ONE with exactly 1 card. Player has " +
                player.getHand().size()
            );
        }

        // No puede llamar ONE dos veces
        if (player.hasCalledOne()) {
            throw new IllegalStateException(
                "Player has already called ONE"
            );
        }
    }

    @Override
    public boolean isUndoable() {
        return true;
    }

    @Override
    public String getCommandName() {
        return "CALL_ONE";
    }

    @Override
    public String getDescription() {
        return String.format("Player %s calls ONE!", player.getNickname());
    }
}
```

#### 2.1.7 Integración en GameEngine

El motor de juego utiliza estos comandos:

```java
public class GameEngine {
    private final Stack<GameCommand> commandHistory = new Stack<>();
    private final Stack<GameCommand> redoStack = new Stack<>();

    public void processMove(Player player, Card card, GameSession session) {
        // Crear comando
        GameCommand command = new PlayCardCommand(player, card, session);

        try {
            // Validar y ejecutar
            command.validate();
            command.execute();

            // Guardar en historial
            commandHistory.push(command);
            redoStack.clear(); // Limpiar redo stack al ejecutar nuevo comando

            log.info("Command executed successfully: {}", command.getDescription());
        } catch (Exception e) {
            log.error("Command execution failed: {}", e.getMessage());
            throw e;
        }
    }

    public void undoLastMove() {
        if (commandHistory.isEmpty()) {
            throw new IllegalStateException("No commands to undo");
        }

        GameCommand lastCommand = commandHistory.pop();
        lastCommand.undo();
        redoStack.push(lastCommand);

        log.info("Command undone: {}", lastCommand.getDescription());
    }

    public void redoLastMove() {
        if (redoStack.isEmpty()) {
            throw new IllegalStateException("No commands to redo");
        }

        GameCommand command = redoStack.pop();
        command.execute();
        commandHistory.push(command);

        log.info("Command redone: {}", command.getDescription());
    }

    public List<GameCommand> getCommandHistory() {
        return new ArrayList<>(commandHistory);
    }
}
```

#### 2.1.8 Casos de Uso del Patrón Command

| Caso de Uso | Implementación | Beneficio |
|-------------|---------------|-----------|
| **Historial de Movimientos** | `commandHistory.stream().map(GameCommand::getDescription)` | Ver todas las jugadas |
| **Undo/Redo** | `undoLastMove()` / `redoLastMove()` | Deshacer errores |
| **Replay de Partidas** | Ejecutar comandos en secuencia | Análisis de juego |
| **Transmisión por Red** | Serializar comandos a JSON | Sincronización cliente-servidor |
| **Logging y Auditoría** | `commandHistory` con timestamps | Trazabilidad completa |
| **Testing** | Crear comandos mock | Pruebas aisladas |

#### 2.1.9 Beneficios Técnicos

1. **Desacoplamiento**: La lógica de ejecución está separada de la lógica de negocio
2. **Extensibilidad**: Agregar nuevos comandos (ej: `SkipTurnCommand`) no afecta código existente
3. **Testabilidad**: Cada comando puede probarse independientemente
4. **Trazabilidad**: Cada acción queda registrada con timestamp y descripción
5. **Reversibilidad**: Soporte completo de undo/redo sin duplicar código

---

### 2.2 Patrón State

#### 2.2.1 Concepto y Propósito

El patrón State permite que un objeto altere su comportamiento cuando su estado interno cambia, aparentando que el objeto ha cambiado de clase. En lugar de usar múltiples condicionales (`if/else`), se encapsula el comportamiento específico de cada estado en clases separadas.

#### 2.2.2 Diagrama de Transición de Estados

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

#### 2.2.3 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/pattern/behavioral/state/
├── GameState.java                (Interfaz)
├── LobbyState.java              (Implementación)
├── PlayingState.java            (Implementación)
└── GameOverState.java           (Implementación)
```

#### 2.2.4 Interfaz GameState

```java
public interface GameState {
    // Métodos de lifecycle
    void enter(GameSession session);
    void exit(GameSession session);

    // Acciones de juego
    void playCard(Player player, Card card, GameSession session);
    void drawCard(Player player, GameSession session);
    void callOne(Player player, GameSession session);
    void chooseColor(Player player, CardColor color, GameSession session);

    // Gestión de jugadores
    void playerJoin(Player player, GameSession session);
    void playerLeave(Player player, GameSession session);

    // Control del juego
    void startGame(GameSession session);
    void pauseGame(GameSession session);
    void resumeGame(GameSession session);
    void endGame(GameSession session, Player winner);

    // Métodos de consulta
    String getStateName();
    boolean isActionAllowed(String action);
    String getStateDescription();
}
```

#### 2.2.5 Implementación: LobbyState

Estado de espera donde los jugadores se unen antes de comenzar:

```java
public class LobbyState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.LOBBY);
        log.info("Session {} entered LOBBY state", session.getSessionId());
    }

    @Override
    public void exit(GameSession session) {
        log.info("Session {} exiting LOBBY state", session.getSessionId());
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        int currentPlayers = session.getPlayers().size();
        int maxPlayers = session.getMaxPlayers();

        if (currentPlayers >= maxPlayers) {
            throw new IllegalStateException(
                String.format("Room is full (%d/%d)", currentPlayers, maxPlayers)
            );
        }

        session.getPlayers().add(player);
        log.info("Player {} joined lobby. Total players: {}/{}",
                 player.getId(), currentPlayers + 1, maxPlayers);
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        session.getPlayers().remove(player);

        // Si el líder se va, transferir liderazgo
        if (player.equals(session.getRoomLeader())) {
            transferLeadership(session);
        }

        log.info("Player {} left lobby", player.getId());
    }

    @Override
    public void startGame(GameSession session) {
        int playerCount = session.getPlayers().size();

        // Validación: mínimo 2 jugadores
        if (playerCount < 2) {
            throw new IllegalStateException(
                "Need at least 2 players to start. Current: " + playerCount
            );
        }

        // Validación: máximo 4 jugadores
        if (playerCount > 4) {
            throw new IllegalStateException(
                "Maximum 4 players allowed. Current: " + playerCount
            );
        }

        // Inicializar el juego
        session.initializeDeck();      // Crear mazo de 108 cartas
        session.distributeCards();     // Repartir 7 cartas a cada jugador
        session.setStartingPlayer();   // Elegir jugador inicial aleatorio

        // Transición de estado
        session.setState(new PlayingState());
        log.info("Game started with {} players, transitioning to PLAYING state",
                 playerCount);
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
    public void callOne(Player player, GameSession session) {
        throw new IllegalStateException(
            "Cannot call ONE in LOBBY state"
        );
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        throw new IllegalStateException(
            "Cannot end game in LOBBY state"
        );
    }

    @Override
    public String getStateName() {
        return "LOBBY";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("JOIN") ||
               action.equals("LEAVE") ||
               action.equals("START_GAME");
    }

    @Override
    public String getStateDescription() {
        return "Waiting for players to join";
    }

    private void transferLeadership(GameSession session) {
        List<Player> players = session.getPlayers();
        if (!players.isEmpty()) {
            session.setRoomLeader(players.get(0));
            log.info("Leadership transferred to {}", players.get(0).getId());
        }
    }
}
```

#### 2.2.6 Implementación: PlayingState

Estado de partida activa:

```java
public class PlayingState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.PLAYING);
        session.setGameStartTime(Instant.now());
        log.info("Session {} entered PLAYING state", session.getSessionId());
    }

    @Override
    public void exit(GameSession session) {
        log.info("Session {} exiting PLAYING state", session.getSessionId());
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        // Validar que sea el turno del jugador
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException(
                "Not your turn! Current player: " +
                session.getCurrentPlayer().getNickname()
            );
        }

        // Validar que la carta sea válida
        Card topCard = session.getDiscardPile().peek();
        if (!isValidPlay(card, topCard, session)) {
            throw new IllegalStateException(
                "Invalid card play. Card doesn't match top card."
            );
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
        log.info("Player {} played card {}", player.getId(), card.getType());
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        // Verificar si el mazo está vacío
        if (session.getDeck().isEmpty()) {
            session.reshuffleDeck();
        }

        // Robar carta
        Card drawnCard = session.getDeck().pop();
        player.getHand().add(drawnCard);

        log.info("Player {} drew a card. Hand size: {}",
                 player.getId(), player.getHand().size());
    }

    @Override
    public void callOne(Player player, GameSession session) {
        if (player.getHand().size() != 1) {
            throw new IllegalStateException(
                "Can only call ONE with exactly 1 card. You have " +
                player.getHand().size()
            );
        }

        player.setHasCalledOne(true);
        log.info("Player {} called ONE!", player.getId());
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        session.setWinner(winner);
        session.setGameEndTime(Instant.now());

        // Calcular duración
        Duration gameDuration = Duration.between(
            session.getGameStartTime(),
            session.getGameEndTime()
        );

        // Transición de estado
        session.setState(new GameOverState(winner));
        log.info("Game ended. Winner: {}. Duration: {} seconds",
                 winner.getNickname(), gameDuration.getSeconds());
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        throw new IllegalStateException(
            "Cannot join game in progress"
        );
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        session.getPlayers().remove(player);

        // Si quedan menos de 2 jugadores, terminar el juego
        if (session.getPlayers().size() < 2) {
            Player winner = session.getPlayers().get(0);
            endGame(session, winner);
        }
    }

    @Override
    public void startGame(GameSession session) {
        throw new IllegalStateException(
            "Game already in progress"
        );
    }

    @Override
    public String getStateName() {
        return "PLAYING";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("PLAY_CARD") ||
               action.equals("DRAW_CARD") ||
               action.equals("CALL_ONE") ||
               action.equals("PAUSE") ||
               action.equals("END");
    }

    @Override
    public String getStateDescription() {
        return "Game in progress";
    }

    private boolean isValidPlay(Card card, Card topCard, GameSession session) {
        // Wild cards pueden jugarse siempre
        if (card.isWild()) return true;

        // Mismo color
        if (card.getColor() == topCard.getColor()) return true;

        // Mismo número/tipo
        if (card.getType() == topCard.getType()) return true;

        // Si hay efectos pendientes (+2 o +4), solo pueden jugarse cartas que apilen
        if (session.getPendingDrawCount() > 0) {
            return card.getType() == CardType.DRAW_TWO ||
                   card.getType() == CardType.WILD_DRAW_FOUR;
        }

        return false;
    }
}
```

#### 2.2.7 Implementación: GameOverState

Estado de fin de partida:

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
                 session.getSessionId(), winner.getNickname());
        log.info("Final scores: {}", finalScores);
    }

    @Override
    public void exit(GameSession session) {
        log.info("Session {} exiting GAME_OVER state", session.getSessionId());
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
        // Puntuación basada en cartas restantes en mano
        // Sistema oficial de UNO
        int totalScore = 0;

        for (Card card : player.getHand()) {
            switch (card.getType()) {
                case NUMBER:
                    totalScore += card.getValue();  // 0-9
                    break;
                case SKIP:
                case REVERSE:
                case DRAW_TWO:
                    totalScore += 20;
                    break;
                case WILD:
                case WILD_DRAW_FOUR:
                    totalScore += 50;
                    break;
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
    public void callOne(Player player, GameSession session) {
        throw new IllegalStateException(
            "Game is over. Cannot call ONE."
        );
    }

    @Override
    public void startGame(GameSession session) {
        throw new IllegalStateException(
            "Game already finished. Create a new game."
        );
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        session.getPlayers().remove(player);

        // Si todos abandonan, eliminar la sesión
        if (session.getPlayers().isEmpty()) {
            session.setState(null);
            log.info("All players left. Session will be cleaned up.");
        }
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        throw new IllegalStateException(
            "Cannot join finished game"
        );
    }

    @Override
    public String getStateName() {
        return "GAME_OVER";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return action.equals("LEAVE") ||
               action.equals("VIEW_SCORES");
    }

    @Override
    public String getStateDescription() {
        return "Game finished. Winner: " + winner.getNickname();
    }

    public Map<Player, Integer> getFinalScores() {
        return new HashMap<>(finalScores);
    }

    public Player getWinner() {
        return winner;
    }
}
```

#### 2.2.8 Uso en GameSession

```java
public class GameSession {
    private String sessionId;
    private GameState currentState;
    private List<Player> players;
    private Stack<Card> deck;
    private Stack<Card> discardPile;
    private Player currentPlayer;
    // ... otros campos

    public GameSession() {
        this.sessionId = UUID.randomUUID().toString();
        this.players = new ArrayList<>();
        this.deck = new Stack<>();
        this.discardPile = new Stack<>();

        // Estado inicial: LOBBY
        this.currentState = new LobbyState();
        this.currentState.enter(this);
    }

    // Cambiar de estado
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

    public void callOne(Player player) {
        currentState.callOne(player, this);
    }

    public void startGame() {
        currentState.startGame(this);
    }

    public void playerJoin(Player player) {
        currentState.playerJoin(player, this);
    }

    public void playerLeave(Player player) {
        currentState.playerLeave(player, this);
    }

    public String getCurrentStateName() {
        return currentState.getStateName();
    }

    public boolean isActionAllowed(String action) {
        return currentState.isActionAllowed(action);
    }
}
```

#### 2.2.9 Beneficios del Patrón State

| Beneficio | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Elimina Condicionales** | Sin State, habría `if (status == LOBBY) {...} else if ...` por todo el código | Código más limpio y legible |
| **Transiciones Explícitas** | Las transiciones son claras: `session.setState(new PlayingState())` | Fácil seguimiento del flujo |
| **Open/Closed Principle** | Agregar un nuevo estado (PAUSED) no modifica estados existentes | Extensibilidad sin riesgo |
| **Comportamiento Específico** | Cada estado tiene su propia lógica sin condicionales | Separación de responsabilidades |
| **Testing Independiente** | Cada estado puede probarse aisladamente | Mayor cobertura de tests |

---

### 2.3 Patrón Observer

#### 2.3.1 Concepto y Propósito

El patrón Observer define una dependencia uno-a-muchos entre objetos, de manera que cuando uno cambia de estado, todos sus dependientes son notificados y actualizados automáticamente. Es fundamental para implementar comunicación en tiempo real en aplicaciones multiplayer.

#### 2.3.2 Arquitectura del Patrón en el Proyecto

```
┌──────────────┐         notifica          ┌──────────────────┐
│  GameEngine  │ ─────────────────────────> │  GameObserver    │
│  (Subject)   │                            │  (Interface)     │
└──────────────┘                            └──────────────────┘
                                                     △
                                                     │ implements
                                                     │
                                            ┌────────────────────┐
                                            │ WebSocketObserver  │
                                            │                    │
                                            │ - Difunde eventos  │
                                            │   vía WebSocket    │
                                            │ - Usa STOMP        │
                                            └────────────────────┘
```

#### 2.3.3 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/pattern/behavioral/observer/
├── GameObserver.java           (Interfaz)
└── WebSocketObserver.java      (Implementación)
```

#### 2.3.4 Interfaz GameObserver

Define 20 tipos de eventos observables:

```java
public interface GameObserver {
    // ========================================
    // EVENTOS DE SALA
    // ========================================
    void onPlayerJoined(Player player, Room room);
    void onPlayerLeft(Player player, Room room);
    void onPlayerKicked(Player player, Room room);
    void onLeadershipTransferred(Room room, Player oldLeader, Player newLeader);
    void onRoomCreated(Room room);
    void onRoomDeleted(Room room);

    // ========================================
    // EVENTOS DE GAMEPLAY
    // ========================================
    void onCardPlayed(Player player, Card card, GameSession session);
    void onCardDrawn(Player player, int cardCount, GameSession session);
    void onOneCalled(Player player, GameSession session);
    void onOnePenalty(Player player, int penaltyCards, GameSession session);
    void onTurnChanged(Player currentPlayer, GameSession session);
    void onPlayerSkipped(Player skippedPlayer, GameSession session);
    void onDirectionReversed(boolean clockwise, GameSession session);
    void onColorChanged(Player player, CardColor newColor, GameSession session);

    // ========================================
    // EVENTOS DE ESTADO DEL JUEGO
    // ========================================
    void onGameStarted(GameSession session);
    void onGameEnded(Player winner, GameSession session);
    void onGamePaused(GameSession session);
    void onGameResumed(GameSession session);

    // ========================================
    // EVENTOS DE CONEXIÓN
    // ========================================
    void onPlayerDisconnected(Player player, GameSession session);
    void onPlayerReconnected(Player player, GameSession session);
}
```

#### 2.3.5 Implementación: WebSocketObserver

Esta clase concreta implementa la interfaz y difunde eventos a través de WebSocket:

```java
@Component
public class WebSocketObserver implements GameObserver {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public WebSocketObserver(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================

    private Map<String, Object> createEvent(String eventType, Map<String, Object> data) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("timestamp", Instant.now().toEpochMilli());
        event.put("data", data);
        return event;
    }

    private void sendToRoom(String roomCode, Map<String, Object> event) {
        String destination = "/topic/room/" + roomCode;
        messagingTemplate.convertAndSend(destination, event);
        log.debug("Event sent to room {}: {}", roomCode, event.get("eventType"));
    }

    private void sendToGame(String sessionId, Map<String, Object> event) {
        String destination = "/topic/game/" + sessionId;
        messagingTemplate.convertAndSend(destination, event);
        log.debug("Event sent to game {}: {}", sessionId, event.get("eventType"));
    }

    private void sendToPlayer(String playerId, Map<String, Object> event) {
        String destination = "/queue/notification/" + playerId;
        messagingTemplate.convertAndSend(destination, event);
        log.debug("Event sent to player {}: {}", playerId, event.get("eventType"));
    }

    // ========================================
    // EVENTOS DE GAMEPLAY
    // ========================================

    @Override
    public void onCardPlayed(Player player, Card card, GameSession session) {
        Map<String, Object> event = createEvent("CARD_PLAYED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "cardId", card.getCardId(),
                "cardType", card.getType().name(),
                "cardColor", card.getColor().name(),
                "cardValue", card.getValue(),
                "remainingCards", player.getHand().size()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onCardDrawn(Player player, int cardCount, GameSession session) {
        // Evento público (sin mostrar qué cartas fueron robadas)
        Map<String, Object> publicEvent = createEvent("CARD_DRAWN", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "cardCount", cardCount,
                "totalCards", player.getHand().size()
        ));

        sendToGame(session.getSessionId(), publicEvent);

        // Evento privado al jugador (con las cartas robadas)
        Map<String, Object> privateEvent = createEvent("CARDS_DRAWN_PRIVATE", Map.of(
                "cards", player.getHand().stream()
                        .limit(cardCount)
                        .map(this::serializeCard)
                        .collect(Collectors.toList())
        ));

        sendToPlayer(player.getPlayerId(), privateEvent);
    }

    @Override
    public void onOneCalled(Player player, GameSession session) {
        Map<String, Object> event = createEvent("ONE_CALLED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onOnePenalty(Player player, int penaltyCards, GameSession session) {
        Map<String, Object> event = createEvent("ONE_PENALTY", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "penaltyCards", penaltyCards,
                "newHandSize", player.getHand().size()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onTurnChanged(Player currentPlayer, GameSession session) {
        Map<String, Object> event = createEvent("TURN_CHANGED", Map.of(
                "currentPlayerId", currentPlayer.getPlayerId(),
                "currentPlayerNickname", currentPlayer.getNickname(),
                "turnNumber", session.getTurnCount()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onPlayerSkipped(Player skippedPlayer, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_SKIPPED", Map.of(
                "skippedPlayerId", skippedPlayer.getPlayerId(),
                "skippedPlayerNickname", skippedPlayer.getNickname()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onDirectionReversed(boolean clockwise, GameSession session) {
        Map<String, Object> event = createEvent("DIRECTION_REVERSED", Map.of(
                "direction", clockwise ? "CLOCKWISE" : "COUNTER_CLOCKWISE"
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onColorChanged(Player player, CardColor newColor, GameSession session) {
        Map<String, Object> event = createEvent("COLOR_CHANGED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "newColor", newColor.name()
        ));

        sendToGame(session.getSessionId(), event);
    }

    // ========================================
    // EVENTOS DE ESTADO DEL JUEGO
    // ========================================

    @Override
    public void onGameStarted(GameSession session) {
        Map<String, Object> event = createEvent("GAME_STARTED", Map.of(
                "sessionId", session.getSessionId(),
                "roomCode", session.getRoom().getRoomCode(),
                "startingPlayerId", session.getCurrentPlayer().getPlayerId(),
                "startingPlayerNickname", session.getCurrentPlayer().getNickname(),
                "direction", session.isClockwise() ? "CLOCKWISE" : "COUNTER_CLOCKWISE",
                "topCard", serializeCard(session.getDiscardPile().peek()),
                "players", session.getPlayers().stream()
                        .map(this::serializePlayer)
                        .collect(Collectors.toList())
        ));

        // Enviar a ambos tópicos
        sendToRoom(session.getRoom().getRoomCode(), event);
        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onGameEnded(Player winner, GameSession session) {
        // Obtener puntuaciones finales
        Map<Player, Integer> scores = ((GameOverState) session.getState()).getFinalScores();

        Map<String, Object> event = createEvent("GAME_ENDED", Map.of(
                "winnerId", winner.getPlayerId(),
                "winnerNickname", winner.getNickname(),
                "duration", Duration.between(
                        session.getGameStartTime(),
                        session.getGameEndTime()
                ).getSeconds(),
                "finalScores", scores.entrySet().stream()
                        .collect(Collectors.toMap(
                                e -> e.getKey().getPlayerId(),
                                Map.Entry::getValue
                        ))
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onGamePaused(GameSession session) {
        Map<String, Object> event = createEvent("GAME_PAUSED", Map.of(
                "sessionId", session.getSessionId()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onGameResumed(GameSession session) {
        Map<String, Object> event = createEvent("GAME_RESUMED", Map.of(
                "sessionId", session.getSessionId()
        ));

        sendToGame(session.getSessionId(), event);
    }

    // ========================================
    // EVENTOS DE CONEXIÓN
    // ========================================

    @Override
    public void onPlayerDisconnected(Player player, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_DISCONNECTED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname()
        ));

        sendToGame(session.getSessionId(), event);
    }

    @Override
    public void onPlayerReconnected(Player player, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_RECONNECTED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname()
        ));

        sendToGame(session.getSessionId(), event);

        // Enviar estado completo del juego al jugador reconectado
        sendGameStateToPlayer(player, session);
    }

    // ========================================
    // EVENTOS DE SALA
    // ========================================

    @Override
    public void onPlayerJoined(Player player, Room room) {
        Map<String, Object> event = createEvent("PLAYER_JOINED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "totalPlayers", room.getPlayers().size(),
                "maxPlayers", room.getMaxPlayers()
        ));

        sendToRoom(room.getRoomCode(), event);
    }

    @Override
    public void onPlayerLeft(Player player, Room room) {
        Map<String, Object> event = createEvent("PLAYER_LEFT", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname(),
                "totalPlayers", room.getPlayers().size()
        ));

        sendToRoom(room.getRoomCode(), event);
    }

    @Override
    public void onPlayerKicked(Player player, Room room) {
        Map<String, Object> event = createEvent("PLAYER_KICKED", Map.of(
                "playerId", player.getPlayerId(),
                "playerNickname", player.getNickname()
        ));

        sendToRoom(room.getRoomCode(), event);
    }

    @Override
    public void onLeadershipTransferred(Room room, Player oldLeader, Player newLeader) {
        Map<String, Object> event = createEvent("LEADERSHIP_TRANSFERRED", Map.of(
                "oldLeaderId", oldLeader.getPlayerId(),
                "oldLeaderNickname", oldLeader.getNickname(),
                "newLeaderId", newLeader.getPlayerId(),
                "newLeaderNickname", newLeader.getNickname()
        ));

        sendToRoom(room.getRoomCode(), event);
    }

    @Override
    public void onRoomCreated(Room room) {
        Map<String, Object> event = createEvent("ROOM_CREATED", Map.of(
                "roomCode", room.getRoomCode(),
                "roomId", room.getRoomId(),
                "maxPlayers", room.getMaxPlayers(),
                "isPrivate", room.isPrivate()
        ));

        // Enviar a lobby global
        messagingTemplate.convertAndSend("/topic/lobby", event);
    }

    @Override
    public void onRoomDeleted(Room room) {
        Map<String, Object> event = createEvent("ROOM_DELETED", Map.of(
                "roomCode", room.getRoomCode()
        ));

        // Enviar a lobby global
        messagingTemplate.convertAndSend("/topic/lobby", event);
    }

    // ========================================
    // MÉTODOS AUXILIARES DE SERIALIZACIÓN
    // ========================================

    private Map<String, Object> serializeCard(Card card) {
        Map<String, Object> cardData = new HashMap<>();
        cardData.put("id", card.getCardId());
        cardData.put("type", card.getType().name());
        cardData.put("color", card.getColor().name());
        cardData.put("value", card.getValue());
        return cardData;
    }

    private Map<String, Object> serializePlayer(Player player) {
        Map<String, Object> playerData = new HashMap<>();
        playerData.put("id", player.getPlayerId());
        playerData.put("nickname", player.getNickname());
        playerData.put("handSize", player.getHand().size());
        playerData.put("hasCalledOne", player.hasCalledOne());
        playerData.put("isBot", player instanceof BotPlayer);
        return playerData;
    }

    private void sendGameStateToPlayer(Player player, GameSession session) {
        Map<String, Object> gameState = Map.of(
                "sessionId", session.getSessionId(),
                "currentPlayer", session.getCurrentPlayer().getPlayerId(),
                "topCard", serializeCard(session.getDiscardPile().peek()),
                "direction", session.isClockwise() ? "CLOCKWISE" : "COUNTER_CLOCKWISE",
                "players", session.getPlayers().stream()
                        .map(this::serializePlayer)
                        .collect(Collectors.toList()),
                "yourHand", player.getHand().stream()
                        .map(this::serializeCard)
                        .collect(Collectors.toList())
        );

        Map<String, Object> event = createEvent("GAME_STATE_SYNC", gameState);
        sendToPlayer(player.getPlayerId(), event);
    }
}
```

#### 2.3.6 Integración en GameEngine

El motor de juego notifica al observador en cada acción:

```java
@Service
public class GameEngine {

    private final WebSocketObserver observer;

    @Autowired
    public GameEngine(WebSocketObserver observer) {
        this.observer = observer;
    }

    public void processCardPlay(Player player, Card card, GameSession session) {
        // 1. Ejecutar el comando
        GameCommand command = new PlayCardCommand(player, card, session);
        command.execute();

        // 2. Notificar al observador
        observer.onCardPlayed(player, card, session);

        // 3. Procesar efectos de la carta
        processCardEffect(card, player, session);

        // 4. Verificar condición de victoria
        if (player.getHand().isEmpty()) {
            observer.onGameEnded(player, session);
        } else {
            // 5. Avanzar turno
            Player nextPlayer = session.getTurnManager().nextTurn();
            observer.onTurnChanged(nextPlayer, session);
        }
    }

    private void processCardEffect(Card card, Player player, GameSession session) {
        switch (card.getType()) {
            case SKIP:
                Player skipped = session.getTurnManager().peekNext();
                session.getTurnManager().skip();
                observer.onPlayerSkipped(skipped, session);
                break;

            case REVERSE:
                boolean clockwise = session.getTurnManager().reverse();
                observer.onDirectionReversed(clockwise, session);
                break;

            case DRAW_TWO:
                session.addPendingDrawCount(2);
                break;

            case WILD:
            case WILD_DRAW_FOUR:
                CardColor chosenColor = determineColor(player, session);
                session.setCurrentColor(chosenColor);
                observer.onColorChanged(player, chosenColor, session);

                if (card.getType() == CardType.WILD_DRAW_FOUR) {
                    session.addPendingDrawCount(4);
                }
                break;
        }
    }
}
```

#### 2.3.7 Tópicos WebSocket

| Tópico | Descripción | Audiencia |
|--------|-------------|-----------|
| `/topic/room/{roomCode}` | Eventos de sala | Todos en la sala |
| `/topic/game/{sessionId}` | Eventos de juego | Todos en la partida |
| `/topic/lobby` | Eventos del lobby global | Todos conectados |
| `/queue/notification/{playerId}` | Notificaciones privadas | Jugador específico |

#### 2.3.8 Beneficios del Patrón Observer

1. **Desacoplamiento Total**: GameEngine no conoce detalles de WebSocket
2. **Escalabilidad**: Fácil agregar más observadores (LoggingObserver, AnalyticsObserver)
3. **Testabilidad**: GameEngine puede probarse sin WebSocket usando MockObserver
4. **Sincronización Automática**: Todos los clientes reciben actualizaciones simultáneas
5. **Extensibilidad**: Agregar nuevos tipos de eventos no afecta código existente

---

### 2.4 Patrón Strategy

#### 2.4.1 Concepto y Propósito

El patrón Strategy define una familia de algoritmos, encapsula cada uno de ellos y los hace intercambiables. Strategy permite que el algoritmo varíe independientemente de los clientes que lo utilizan.

En este proyecto, se utiliza para implementar la inteligencia artificial de los bots, permitiendo diferentes niveles de dificultad y estrategias de juego.

#### 2.4.2 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/service/bot/
└── BotStrategy.java
```

#### 2.4.3 Interfaz BotStrategy

```java
public interface BotStrategy {
    /**
     * Elige qué carta jugar de las cartas válidas disponibles
     *
     * @param bot El jugador bot
     * @param topCard Carta superior en la pila de descarte
     * @param session Sesión del juego
     * @return La carta elegida, o null si no puede jugar
     */
    Card chooseCard(Player bot, Card topCard, GameSession session);

    /**
     * Elige un color para cartas Wild
     *
     * @param bot El jugador bot
     * @return El color elegido
     */
    CardColor chooseColor(Player bot);

    /**
     * Decide si llamar "UNO!" cuando tiene 1 carta
     *
     * @param bot El jugador bot
     * @return true si debe llamar UNO, false si no
     */
    boolean shouldCallOne(Player bot);

    /**
     * Nombre de la estrategia
     */
    String getStrategyName();
}
```

#### 2.4.4 Implementación: BotStrategy

Estrategia de IA con múltiples niveles de decisión:

```java
@Component
public class BasicBotStrategy implements BotStrategy {

    private final Random random = new Random();

    @Override
    public Card chooseCard(Player bot, Card topCard, GameSession session) {
        // Obtener cartas válidas
        List<Card> validCards = bot.getValidCards(topCard);

        if (validCards.isEmpty()) {
            return null;  // No puede jugar, debe robar
        }

        // ========================================
        // PRIORIDAD 1: Manejo de efectos pendientes
        // ========================================
        int pendingDrawCount = session.getPendingDrawCount();

        if (pendingDrawCount > 0) {
            // Solo puede jugar +2 o +4 para stackear
            List<Card> stackableCards = validCards.stream()
                    .filter(card -> card.getType() == CardType.DRAW_TWO ||
                                  card.getType() == CardType.WILD_DRAW_FOUR)
                    .collect(Collectors.toList());

            if (stackableCards.isEmpty()) {
                return null;  // Debe robar las cartas pendientes
            }

            // Preferir +4 sobre +2 (más agresivo)
            Optional<Card> wildDrawFour = stackableCards.stream()
                    .filter(c -> c.getType() == CardType.WILD_DRAW_FOUR)
                    .findFirst();

            if (wildDrawFour.isPresent()) {
                return wildDrawFour.get();
            }

            return stackableCards.get(0);
        }

        // ========================================
        // PRIORIDAD 2: Estrategia de victoria (2 cartas)
        // ========================================
        if (bot.getHandSize() == 2) {
            return chooseCardForWinning(validCards, topCard);
        }

        // ========================================
        // PRIORIDAD 3: Estrategia agresiva
        // ========================================
        Player nextPlayer = getNextPlayer(bot, session);
        if (nextPlayer != null && nextPlayer.getHandSize() <= 2) {
            return chooseAggressiveCard(validCards, topCard);
        }

        // ========================================
        // PRIORIDAD 4: Estrategia balanceada
        // ========================================
        return chooseBalancedCard(validCards, topCard);
    }

    /**
     * Estrategia cuando el bot tiene 2 cartas (cerca de ganar)
     */
    private Card chooseCardForWinning(List<Card> validCards, Card topCard) {
        // 1. Preferir cartas de acción (para ganar rápido)
        Optional<Card> actionCard = validCards.stream()
                .filter(c -> c.getType() == CardType.SKIP ||
                           c.getType() == CardType.REVERSE ||
                           c.getType() == CardType.DRAW_TWO)
                .findFirst();

        if (actionCard.isPresent()) {
            return actionCard.get();
        }

        // 2. Preferir Wild (flexibilidad)
        Optional<Card> wildCard = validCards.stream()
                .filter(Card::isWild)
                .findFirst();

        if (wildCard.isPresent()) {
            return wildCard.get();
        }

        // 3. Cualquier carta válida
        return validCards.get(0);
    }

    /**
     * Estrategia agresiva cuando el oponente está cerca de ganar
     */
    private Card chooseAggressiveCard(List<Card> validCards, Card topCard) {
        // 1. Preferir Draw Two
        Optional<Card> drawTwo = validCards.stream()
                .filter(c -> c.getType() == CardType.DRAW_TWO)
                .findFirst();

        if (drawTwo.isPresent()) {
            return drawTwo.get();
        }

        // 2. Preferir Wild Draw Four (más agresivo)
        Optional<Card> wildDrawFour = validCards.stream()
                .filter(c -> c.getType() == CardType.WILD_DRAW_FOUR)
                .findFirst();

        if (wildDrawFour.isPresent()) {
            return wildDrawFour.get();
        }

        // 3. Preferir Skip
        Optional<Card> skip = validCards.stream()
                .filter(c -> c.getType() == CardType.SKIP)
                .findFirst();

        if (skip.isPresent()) {
            return skip.get();
        }

        // 4. Cualquier carta de acción
        Optional<Card> actionCard = validCards.stream()
                .filter(c -> c.getType() == CardType.REVERSE)
                .findFirst();

        if (actionCard.isPresent()) {
            return actionCard.get();
        }

        // 5. Fallback a estrategia balanceada
        return chooseBalancedCard(validCards, topCard);
    }

    /**
     * Estrategia balanceada para juego normal
     */
    private Card chooseBalancedCard(List<Card> validCards, Card topCard) {
        // 1. Preferir cartas de acción (más valor estratégico)
        Optional<Card> actionCard = validCards.stream()
                .filter(c -> c.getType() == CardType.SKIP ||
                           c.getType() == CardType.REVERSE ||
                           c.getType() == CardType.DRAW_TWO)
                .findFirst();

        if (actionCard.isPresent()) {
            return actionCard.get();
        }

        // 2. Preferir cartas que coincidan por color
        Optional<Card> sameColor = validCards.stream()
                .filter(c -> !c.isWild() && c.getColor() == topCard.getColor())
                .findFirst();

        if (sameColor.isPresent()) {
            return sameColor.get();
        }

        // 3. Preferir cartas numéricas (conservar especiales)
        Optional<Card> numberCard = validCards.stream()
                .filter(c -> c.getType() == CardType.NUMBER)
                .findFirst();

        if (numberCard.isPresent()) {
            return numberCard.get();
        }

        // 4. Usar Wild como último recurso
        Optional<Card> wild = validCards.stream()
                .filter(Card::isWild)
                .findFirst();

        if (wild.isPresent()) {
            return wild.get();
        }

        // 5. Cualquier carta válida
        return validCards.get(0);
    }

    @Override
    public CardColor chooseColor(Player bot) {
        // Contar cartas de cada color en la mano
        Map<CardColor, Integer> colorCounts = new EnumMap<>(CardColor.class);

        for (CardColor color : CardColor.values()) {
            if (color != CardColor.WILD) {  // Excluir comodines
                colorCounts.put(color, 0);
            }
        }

        // Contar cartas por color
        for (Card card : bot.getHand()) {
            if (!card.isWild()) {
                CardColor color = card.getColor();
                colorCounts.put(color, colorCounts.get(color) + 1);
            }
        }

        // Elegir el color con más cartas
        return colorCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(CardColor.RED);  // Default si no tiene cartas
    }

    @Override
    public boolean shouldCallOne(Player bot) {
        // Solo llamar UNO si tiene exactamente 1 carta
        if (bot.getHandSize() != 1) {
            return false;
        }

        // 90% de probabilidad de recordar llamar UNO
        // 10% de probabilidad de "olvidar" (para realismo)
        boolean shouldCall = random.nextDouble() < 0.90;

        if (!shouldCall) {
            log.debug("Bot {} forgot to call ONE (intentional)", bot.getId());
        }

        return shouldCall;
    }

    @Override
    public String getStrategyName() {
        return "Basic Bot Strategy";
    }

    /**
     * Obtiene el siguiente jugador en el orden de turnos
     */
    private Player getNextPlayer(Player bot, GameSession session) {
        TurnManager turnManager = session.getTurnManager();
        return turnManager.peekNext();
    }
}
```

#### 2.4.5 Estrategias Alternativas (Extensibilidad)

El patrón permite fácilmente agregar nuevas estrategias:

```java
// Estrategia fácil (para principiantes)
public class EasyBotStrategy implements BotStrategy {
    @Override
    public Card chooseCard(Player bot, Card topCard, GameSession session) {
        List<Card> validCards = bot.getValidCards(topCard);
        if (validCards.isEmpty()) return null;

        // Juega la primera carta válida (aleatorio)
        return validCards.get(new Random().nextInt(validCards.size()));
    }

    @Override
    public CardColor chooseColor(Player bot) {
        // Elige color aleatorio
        CardColor[] colors = {CardColor.RED, CardColor.BLUE,
                             CardColor.GREEN, CardColor.YELLOW};
        return colors[new Random().nextInt(colors.length)];
    }

    @Override
    public boolean shouldCallOne(Player bot) {
        // 50% de probabilidad (olvida con frecuencia)
        return new Random().nextDouble() < 0.50;
    }
}

// Estrategia difícil (para expertos)
public class HardBotStrategy implements BotStrategy {
    @Override
    public Card chooseCard(Player bot, Card topCard, GameSession session) {
        // Algoritmo avanzado con:
        // - Análisis de manos de oponentes
        // - Predicción de próximas jugadas
        // - Optimización matemática
        // - Machine learning (opcional)
        // ...
    }

    @Override
    public boolean shouldCallOne(Player bot) {
        // 100% de probabilidad (nunca olvida)
        return bot.getHandSize() == 1;
    }
}
```

#### 2.4.6 Uso en BotPlayer

```java
public class BotPlayer extends Player {
    private BotStrategy strategy;

    public BotPlayer(String nickname, BotStrategy strategy) {
        super(UUID.randomUUID().toString(), nickname);
        this.strategy = strategy;
    }

    public Card decideMove(Card topCard, GameSession session) {
        return strategy.chooseCard(this, topCard, session);
    }

    public CardColor decideColor() {
        return strategy.chooseColor(this);
    }

    public boolean shouldCallOne() {
        return strategy.hasCalledOne(this);
    }

    // Cambiar estrategia en tiempo de ejecución
    public void setStrategy(BotStrategy newStrategy) {
        this.strategy = newStrategy;
        log.info("Bot strategy changed to: {}", newStrategy.getStrategyName());
    }
}
```

#### 2.4.7 Integración en GameEngine

```java
public class GameEngine {

    public void processBotTurn(BotPlayer bot, GameSession session) {
        Card topCard = session.getDiscardPile().peek();

        // Bot usa su estrategia para decidir
        Card chosenCard = bot.decideMove(topCard, session);

        if (chosenCard != null) {
            // Bot puede jugar una carta
            processCardPlay(bot, chosenCard, session);

            // Si es Wild, elegir color
            if (chosenCard.isWild()) {
                CardColor chosenColor = bot.decideColor();
                session.setCurrentColor(chosenColor);
                observer.onColorChanged(bot, chosenColor, session);
            }

            // Verificar si debe llamar UNO
            if (bot.getHandSize() == 1 && bot.shouldCallOne()) {
                bot.setHasCalledOne(true);
                observer.onOneCalled(bot, session);
            }
        } else {
            // Bot debe robar cartas
            int cardsToDraw = Math.max(1, session.getPendingDrawCount());
            processCardDraw(bot, cardsToDraw, session);
        }
    }
}
```

#### 2.4.8 Árbol de Decisión del Bot

```
Bot Turn
├── ¿Hay efectos pendientes (+2/+4)?
│   ├── SÍ → ¿Tiene carta para stackear?
│   │   ├── SÍ → Jugar carta de stack (prioritario: +4 > +2)
│   │   └── NO → Robar cartas pendientes
│   └── NO → Continuar análisis
├── ¿Tiene 2 cartas? (Cerca de ganar)
│   └── SÍ → Estrategia de victoria
│       ├── 1. Cartas de acción
│       ├── 2. Wild cards
│       └── 3. Cualquier carta válida
├── ¿Oponente tiene ≤2 cartas? (Peligro)
│   └── SÍ → Estrategia agresiva
│       ├── 1. Draw Two
│       ├── 2. Wild Draw Four
│       ├── 3. Skip
│       └── 4. Reverse
└── Estrategia balanceada (juego normal)
    ├── 1. Cartas de acción
    ├── 2. Cartas del mismo color
    ├── 3. Cartas numéricas
    ├── 4. Wild (último recurso)
    └── 5. Primera carta válida
```

#### 2.4.9 Beneficios del Patrón Strategy

| Beneficio | Descripción | Ejemplo |
|-----------|-------------|---------|
| **Encapsulación** | Lógica de IA separada del jugador | `BotPlayer` no conoce detalles de decisión |
| **Reemplazabilidad** | Cambiar estrategia en runtime | `bot.setStrategy(new HardBotStrategy())` |
| **Testabilidad** | Probar estrategias independientemente | Mock strategy para unit tests |
| **Extensibilidad** | Agregar nuevas estrategias sin modificar código | Crear `ExpertBotStrategy` |
| **Configurabilidad** | Niveles de dificultad ajustables | Easy, Medium, Hard presets |

---

## 3. Estructuras de Datos Implementadas

### 3.1 Lista Circular Doblemente Enlazada

#### 3.1.1 Concepto y Propósito

Una lista circular doblemente enlazada es una estructura de datos donde:
- Cada nodo tiene referencias al nodo **siguiente** y **anterior**
- El último nodo apunta al primero (circular)
- El primer nodo apunta al último (circular)
- Se mantiene una referencia al nodo **actual**

En el contexto del juego UNO, esta estructura es perfecta para gestionar turnos circulares que deben:
- Avanzar al siguiente jugador: **O(1)**
- Retroceder al jugador anterior: **O(1)**
- Invertir dirección (carta Reverse): **O(1)**
- Saltar un jugador (carta Skip): **O(1)**

#### 3.1.2 Diagrama de la Estructura

```
Estructura Física (Circular):
┌───────────────────────────────────────────┐
│                                           │
│    [P1] ← → [P2] ← → [P3] ← → [P4]      │
│    ↑                              ↑       │
│    └──────────────────────────────┘       │
│           (loops infinitamente)           │
└───────────────────────────────────────────┘

Nodo Interno:
┌─────────────────┐
│      Node       │
├─────────────────┤
│ data: Player    │
│ next: Node      │ ────┐
│ prev: Node      │ ←───┘
└─────────────────┘

Dirección del Juego:
- clockwise = true  → usa 'next'
- clockwise = false → usa 'prev'
```

#### 3.1.3 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/datastructure/
└── CircularDoublyLinkedList.java
```

#### 3.1.4 Implementación Completa

```java
public class CircularDoublyLinkedList<T> {

    // ========================================
    // CLASE INTERNA: NODO
    // ========================================

    private static class Node<T> {
        T data;
        Node<T> next;
        Node<T> prev;

        Node(T data) {
            this.data = data;
            this.next = this;  // Inicialmente apunta a sí mismo
            this.prev = this;  // Inicialmente apunta a sí mismo
        }
    }

    // ========================================
    // ATRIBUTOS
    // ========================================

    private Node<T> current;      // Nodo actual (jugador con turno)
    private int size;             // Número de nodos
    private boolean clockwise;    // Dirección: true = horario, false = antihorario

    // ========================================
    // CONSTRUCTOR
    // ========================================

    public CircularDoublyLinkedList() {
        this.current = null;
        this.size = 0;
        this.clockwise = true;  // Por defecto: sentido horario
    }

    // ========================================
    // OPERACIONES BÁSICAS
    // ========================================

    /**
     * Agrega un elemento al final de la lista
     * Complejidad: O(1)
     */
    public void add(T data) {
        Node<T> newNode = new Node<>(data);

        if (current == null) {
            // Primera inserción
            current = newNode;
            newNode.next = newNode;
            newNode.prev = newNode;
        } else {
            // Insertar al final (antes del current)
            Node<T> last = current.prev;

            last.next = newNode;
            newNode.prev = last;
            newNode.next = current;
            current.prev = newNode;
        }

        size++;
    }

    /**
     * Obtiene el elemento actual
     * Complejidad: O(1)
     */
    public T getCurrent() {
        return current != null ? current.data : null;
    }

    /**
     * Avanza al siguiente elemento según la dirección
     * Complejidad: O(1)
     */
    public T getNext() {
        if (current == null) {
            return null;
        }

        if (clockwise) {
            current = current.next;
        } else {
            current = current.prev;
        }

        return current.data;
    }

    /**
     * Ve el siguiente elemento SIN mover el puntero
     * Complejidad: O(1)
     */
    public T peekNext() {
        if (current == null) {
            return null;
        }

        Node<T> next = clockwise ? current.next : current.prev;
        return next.data;
    }

    /**
     * Ve el elemento anterior SIN mover el puntero
     * Complejidad: O(1)
     */
    public T peekPrevious() {
        if (current == null) {
            return null;
        }

        Node<T> prev = clockwise ? current.prev : current.next;
        return prev.data;
    }

    // ========================================
    // OPERACIONES ESPECÍFICAS DEL JUEGO UNO
    // ========================================

    /**
     * Invierte la dirección del juego (carta Reverse)
     * Complejidad: O(1)
     *
     * IMPORTANTE: No reorganiza la lista, solo invierte la dirección
     */
    public void reverse() {
        clockwise = !clockwise;
    }

    /**
     * Salta el siguiente jugador (carta Skip)
     * Complejidad: O(1)
     *
     * Retorna el jugador saltado
     */
    public T skip() {
        if (current == null) {
            return null;
        }

        // Guardar el jugador que será saltado
        T skippedPlayer = peekNext();

        // Mover dos posiciones (salta uno)
        if (clockwise) {
            current = current.next.next;
        } else {
            current = current.prev.prev;
        }

        return skippedPlayer;
    }

    /**
     * Remueve el nodo actual
     * Complejidad: O(1)
     */
    public T removeCurrent() {
        if (current == null) {
            return null;
        }

        T data = current.data;

        if (size == 1) {
            // Último nodo, lista queda vacía
            current = null;
        } else {
            // Reenlazar nodos adyacentes
            Node<T> toRemove = current;

            toRemove.prev.next = toRemove.next;
            toRemove.next.prev = toRemove.prev;

            // Mover al siguiente en la dirección actual
            current = clockwise ? toRemove.next : toRemove.prev;
        }

        size--;
        return data;
    }

    /**
     * Busca y remueve un elemento específico
     * Complejidad: O(n)
     */
    public boolean remove(T data) {
        if (current == null) {
            return false;
        }

        Node<T> start = current;
        Node<T> temp = current;

        do {
            if (temp.data.equals(data)) {
                // Encontrado, remover
                if (temp == current) {
                    removeCurrent();
                } else {
                    temp.prev.next = temp.next;
                    temp.next.prev = temp.prev;
                    size--;
                }
                return true;
            }
            temp = temp.next;
        } while (temp != start);

        return false;  // No encontrado
    }

    /**
     * Busca un elemento
     * Complejidad: O(n)
     */
    public boolean contains(T data) {
        if (current == null) {
            return false;
        }

        Node<T> start = current;
        Node<T> temp = current;

        do {
            if (temp.data.equals(data)) {
                return true;
            }
            temp = temp.next;
        } while (temp != start);

        return false;
    }

    // ========================================
    // MÉTODOS DE CONSULTA
    // ========================================

    public int size() {
        return size;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public boolean isClockwise() {
        return clockwise;
    }

    /**
     * Convierte la lista a ArrayList (para debugging)
     * Complejidad: O(n)
     */
    public List<T> toList() {
        List<T> list = new ArrayList<>(size);

        if (current == null) {
            return list;
        }

        Node<T> start = current;
        Node<T> temp = current;

        do {
            list.add(temp.data);
            temp = temp.next;
        } while (temp != start);

        return list;
    }

    @Override
    public String toString() {
        if (current == null) {
            return "[]";
        }

        StringBuilder sb = new StringBuilder("[");
        Node<T> start = current;
        Node<T> temp = current;

        do {
            if (temp == current) {
                sb.append("*");  // Marcar nodo actual
            }
            sb.append(temp.data);
            temp = temp.next;
            if (temp != start) {
                sb.append(" -> ");
            }
        } while (temp != start);

        sb.append("] (").append(clockwise ? "clockwise" : "counter-clockwise").append(")");
        return sb.toString();
    }
}
```

#### 3.1.5 Uso en TurnManager

```java
@Service
public class TurnManager {

    private final CircularDoublyLinkedList<Player> playerQueue;

    public TurnManager() {
        this.playerQueue = new CircularDoublyLinkedList<>();
    }

    /**
     * Inicializa el gestor con los jugadores
     */
    public void initializePlayers(List<Player> players) {
        playerQueue.clear();
        for (Player player : players) {
            playerQueue.add(player);
        }
    }

    /**
     * Obtiene el jugador actual
     */
    public Player getCurrentPlayer() {
        return playerQueue.getCurrent();
    }

    /**
     * Avanza al siguiente jugador
     */
    public Player nextTurn() {
        return playerQueue.getNext();
    }

    /**
     * Ve el siguiente jugador sin avanzar
     */
    public Player peekNextPlayer() {
        return playerQueue.peekNext();
    }

    /**
     * Invierte la dirección del juego (carta Reverse)
     */
    public boolean reverseTurnOrder() {
        playerQueue.reverse();
        return playerQueue.isClockwise();
    }

    /**
     * Salta el siguiente jugador (carta Skip)
     */
    public Player skipNextPlayer() {
        Player skipped = playerQueue.skip();
        return skipped;
    }

    /**
     * Remueve un jugador (desconexión)
     */
    public boolean removePlayer(String playerId) {
        List<Player> players = playerQueue.toList();

        for (Player p : players) {
            if (p.getPlayerId().equals(playerId)) {
                return playerQueue.remove(p);
            }
        }

        return false;
    }

    /**
     * Agrega un nuevo jugador
     */
    public void addPlayer(Player player) {
        playerQueue.add(player);
    }

    public int getPlayerCount() {
        return playerQueue.size();
    }

    public List<Player> getAllPlayers() {
        return playerQueue.toList();
    }
}
```

#### 3.1.6 Ejemplo de Uso Completo

```java
// Caso de uso: Partida con 4 jugadores

TurnManager turnManager = new TurnManager();
List<Player> players = Arrays.asList(p1, p2, p3, p4);
turnManager.initializePlayers(players);

// Turno inicial: P1
System.out.println(turnManager.getCurrentPlayer());  // P1

// P1 juega carta normal
turnManager.nextTurn();
System.out.println(turnManager.getCurrentPlayer());  // P2

// P2 juega carta Reverse
turnManager.reverseTurnOrder();
System.out.println("Direction reversed!");

// Ahora va en sentido contrario
turnManager.nextTurn();
System.out.println(turnManager.getCurrentPlayer());  // P1 (va hacia atrás)

// P1 juega carta Skip
Player skipped = turnManager.skipNextPlayer();
System.out.println("Skipped: " + skipped);          // P4 es saltado
System.out.println(turnManager.getCurrentPlayer());  // P3

// P3 se desconecta
turnManager.removePlayer(p3.getPlayerId());
turnManager.nextTurn();
System.out.println(turnManager.getCurrentPlayer());  // P2
```

#### 3.1.7 Análisis de Complejidad

| Operación | Complejidad | Justificación |
|-----------|-------------|---------------|
| `add()` | **O(1)** | Solo actualiza punteros |
| `getCurrent()` | **O(1)** | Acceso directo |
| `getNext()` | **O(1)** | Solo actualiza punteros |
| `peekNext()` | **O(1)** | Acceso sin modificar |
| `reverse()` | **O(1)** | Solo invierte flag booleano |
| `skip()` | **O(1)** | Avanza dos nodos |
| `removeCurrent()` | **O(1)** | Reenlaza punteros adyacentes |
| `remove(T)` | **O(n)** | Debe buscar el elemento |
| `contains(T)` | **O(n)** | Debe recorrer la lista |

#### 3.1.8 Ventajas vs Alternativas

**Comparación con ArrayList + Índice Modular:**

| Característica | Lista Circular | ArrayList + Módulo |
|---|---|---|
| Avanzar turno | `current = current.next` | `index = (index + 1) % size` |
| Invertir dirección | `clockwise = !clockwise` | Calcular índices inversos |
| Saltar jugador | `current = current.next.next` | `index = (index + 2) % size` |
| Código limpio | ✅ Muy limpio | ❌ Muchos cálculos modulares |
| Manejo de bordes | ✅ Sin casos especiales | ❌ Muchos if/else |
| Complejidad O(1) | ✅ Todas las operaciones | ✅ Todas las operaciones |
| Complejidad código | ✅ Baja | ❌ Alta (condicionales) |

---

### 3.2 Grafo de Relaciones entre Jugadores

#### 3.2.1 Concepto y Propósito

Un grafo dirigido con aristas ponderadas que modela las interacciones entre jugadores durante las partidas. Cada jugador es un **vértice** y cada interacción es una **arista** con peso que representa la frecuencia.

**Tipos de interacciones:**
- Jugó +2 contra otro jugador
- Jugó +4 contra otro jugador
- Saltó turno de otro jugador
- Invirtió dirección afectando a otro
- Ganó partida contra otros jugadores

#### 3.2.2 Diagrama de la Estructura

```
Ejemplo de Grafo:

    Alice ──(WON_AGAINST×2)──> Bob
      │                         │
      │ (DRAW_TWO×3)            │ (DRAW_TWO×1)
      ↓                         ↓
    Charlie ←──(SKIPPED×2)──── Bob

Interpretación:
- Alice ha ganado contra Bob 2 veces
- Alice ha jugado +2 a Charlie 3 veces
- Bob ha jugado +2 a Charlie 1 vez
- Bob ha saltado a Charlie 2 veces

Representación Interna (Lista de Adyacencia):
┌─────────────────────────────────────┐
│ PlayerRelationGraph                 │
├─────────────────────────────────────┤
│ nodes: Map<PlayerId, PlayerNode>    │
│                                     │
│ PlayerNode:                         │
│  - playerId: String                 │
│  - interactions: Map<Key, Interaction>
│      Key: "targetId_TYPE"           │
│      Value: Interaction(count)      │
└─────────────────────────────────────┘
```

#### 3.2.3 Ubicación en el Código

```
backend/src/main/java/com/oneonline/backend/datastructure/
└── PlayerRelationGraph.java
```

#### 3.2.4 Implementación Completa

```java
public class PlayerRelationGraph<T> {

    // ========================================
    // CLASES INTERNAS
    // ========================================

    /**
     * Tipo de interacción entre jugadores
     */
    public enum InteractionType {
        PLAYED_AGAINST,      // Jugó en la misma partida
        DRAW_TWO,           // Jugó +2 contra el jugador
        WILD_DRAW_FOUR,     // Jugó +4 contra el jugador
        SKIPPED,            // Saltó el turno del jugador
        REVERSED,           // Invirtió dirección afectando al jugador
        WON_AGAINST         // Ganó partida contra el jugador
    }

    /**
     * Representa una interacción con contador
     */
    private static class Interaction<T> {
        private final T targetPlayer;
        private final InteractionType type;
        private int count;

        public Interaction(T targetPlayer, InteractionType type) {
            this.targetPlayer = targetPlayer;
            this.type = type;
            this.count = 1;
        }

        public void increment() {
            count++;
        }

        public T getTargetPlayer() {
            return targetPlayer;
        }

        public InteractionType getType() {
            return type;
        }

        public int getCount() {
            return count;
        }

        @Override
        public String toString() {
            return String.format("%s (%s×%d)", targetPlayer, type, count);
        }
    }

    /**
     * Nodo del grafo que representa un jugador
     */
    private static class PlayerNode<T> {
        private final T playerId;
        private final Map<String, Interaction<T>> interactions;

        public PlayerNode(T playerId) {
            this.playerId = playerId;
            this.interactions = new HashMap<>();
        }

        public void addInteraction(T targetPlayer, InteractionType type) {
            String key = targetPlayer.toString() + "_" + type.name();

            if (interactions.containsKey(key)) {
                interactions.get(key).increment();
            } else {
                interactions.put(key, new Interaction<>(targetPlayer, type));
            }
        }

        public Map<String, Interaction<T>> getInteractions() {
            return interactions;
        }

        public T getPlayerId() {
            return playerId;
        }
    }

    // ========================================
    // ATRIBUTOS
    // ========================================

    private final Map<T, PlayerNode<T>> nodes;

    // ========================================
    // CONSTRUCTOR
    // ========================================

    public PlayerRelationGraph() {
        this.nodes = new HashMap<>();
    }

    // ========================================
    // OPERACIONES PRINCIPALES
    // ========================================

    /**
     * Agrega un jugador al grafo
     * Complejidad: O(1) amortizado
     */
    public void addPlayer(T playerId) {
        if (!nodes.containsKey(playerId)) {
            nodes.put(playerId, new PlayerNode<>(playerId));
        }
    }

    /**
     * Registra una interacción entre dos jugadores
     * Complejidad: O(1) amortizado
     */
    public void addInteraction(T fromPlayer, T toPlayer, InteractionType type) {
        // Asegurar que ambos jugadores existen
        addPlayer(fromPlayer);
        addPlayer(toPlayer);

        // Agregar arista dirigida
        nodes.get(fromPlayer).addInteraction(toPlayer, type);
    }

    /**
     * Obtiene todas las interacciones de un jugador
     * Complejidad: O(1)
     */
    public Map<String, Interaction<T>> getPlayerInteractions(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return new HashMap<>();
        }
        return new HashMap<>(nodes.get(playerId).getInteractions());
    }

    /**
     * Obtiene el conteo de un tipo específico de interacción
     * Complejidad: O(1) amortizado
     */
    public int getInteractionCount(T fromPlayer, T toPlayer, InteractionType type) {
        if (!nodes.containsKey(fromPlayer)) {
            return 0;
        }

        String key = toPlayer.toString() + "_" + type.name();
        Interaction<T> interaction = nodes.get(fromPlayer).getInteractions().get(key);

        return interaction != null ? interaction.getCount() : 0;
    }

    /**
     * Obtiene el rival más frecuente (más interacciones totales)
     * Complejidad: O(k) donde k = número de interacciones del jugador
     */
    public T getMostFrequentTarget(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return null;
        }

        Map<T, Integer> targetCounts = new HashMap<>();

        // Sumar todas las interacciones por jugador objetivo
        for (Interaction<T> interaction : nodes.get(playerId).getInteractions().values()) {
            T target = interaction.getTargetPlayer();
            targetCounts.put(target,
                           targetCounts.getOrDefault(target, 0) + interaction.getCount());
        }

        // Encontrar el máximo
        return targetCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    /**
     * Obtiene el jugador contra el que más ha ganado
     * Complejidad: O(k)
     */
    public T getMostBeatenRival(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return null;
        }

        return nodes.get(playerId).getInteractions().values().stream()
                .filter(i -> i.getType() == InteractionType.WON_AGAINST)
                .max(Comparator.comparingInt(Interaction::getCount))
                .map(Interaction::getTargetPlayer)
                .orElse(null);
    }

    /**
     * Verifica si existe alguna interacción entre dos jugadores
     * Complejidad: O(k)
     */
    public boolean hasInteraction(T player1, T player2) {
        if (!nodes.containsKey(player1) || !nodes.containsKey(player2)) {
            return false;
        }

        // Verificar en ambas direcciones
        for (Interaction<T> interaction : nodes.get(player1).getInteractions().values()) {
            if (interaction.getTargetPlayer().equals(player2)) {
                return true;
            }
        }

        for (Interaction<T> interaction : nodes.get(player2).getInteractions().values()) {
            if (interaction.getTargetPlayer().equals(player1)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Obtiene estadísticas de rivalidad entre dos jugadores
     * Complejidad: O(k)
     */
    public RivalryStats getRivalryStats(T player1, T player2) {
        RivalryStats stats = new RivalryStats();

        if (nodes.containsKey(player1)) {
            stats.player1Wins = getInteractionCount(player1, player2, InteractionType.WON_AGAINST);
            stats.player1DrawTwos = getInteractionCount(player1, player2, InteractionType.DRAW_TWO);
            stats.player1DrawFours = getInteractionCount(player1, player2, InteractionType.WILD_DRAW_FOUR);
            stats.player1Skips = getInteractionCount(player1, player2, InteractionType.SKIPPED);
        }

        if (nodes.containsKey(player2)) {
            stats.player2Wins = getInteractionCount(player2, player1, InteractionType.WON_AGAINST);
            stats.player2DrawTwos = getInteractionCount(player2, player1, InteractionType.DRAW_TWO);
            stats.player2DrawFours = getInteractionCount(player2, player1, InteractionType.WILD_DRAW_FOUR);
            stats.player2Skips = getInteractionCount(player2, player1, InteractionType.SKIPPED);
        }

        return stats;
    }

    /**
     * Calcula el grado de salida de un nodo (número de jugadores contra los que ha jugado)
     * Complejidad: O(k)
     */
    public int getOutDegree(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return 0;
        }

        return (int) nodes.get(playerId).getInteractions().values().stream()
                .map(Interaction::getTargetPlayer)
                .distinct()
                .count();
    }

    // ========================================
    // MÉTODOS DE CONSULTA
    // ========================================

    public int getPlayerCount() {
        return nodes.size();
    }

    public boolean containsPlayer(T playerId) {
        return nodes.containsKey(playerId);
    }

    public Set<T> getAllPlayers() {
        return new HashSet<>(nodes.keySet());
    }

    /**
     * Genera reporte de rivalidades para un jugador
     */
    public String generateRivalryReport(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return "Player not found";
        }

        StringBuilder report = new StringBuilder();
        report.append("=== Rivalry Report for ").append(playerId).append(" ===\n\n");

        Map<T, Integer> rivals = new HashMap<>();
        for (Interaction<T> interaction : nodes.get(playerId).getInteractions().values()) {
            T target = interaction.getTargetPlayer();
            rivals.put(target, rivals.getOrDefault(target, 0) + interaction.getCount());
        }

        // Ordenar por cantidad de interacciones
        rivals.entrySet().stream()
                .sorted(Map.Entry.<T, Integer>comparingByValue().reversed())
                .forEach(entry -> {
                    T rival = entry.getKey();
                    int totalInteractions = entry.getValue();

                    report.append(String.format("Rival: %s (Total interactions: %d)\n", rival, totalInteractions));

                    // Detallar tipos de interacciones
                    for (InteractionType type : InteractionType.values()) {
                        int count = getInteractionCount(playerId, rival, type);
                        if (count > 0) {
                            report.append(String.format("  - %s: %d times\n", type, count));
                        }
                    }
                    report.append("\n");
                });

        return report.toString();
    }

    // ========================================
    // CLASE AUXILIAR: ESTADÍSTICAS DE RIVALIDAD
    // ========================================

    public static class RivalryStats {
        public int player1Wins = 0;
        public int player1DrawTwos = 0;
        public int player1DrawFours = 0;
        public int player1Skips = 0;

        public int player2Wins = 0;
        public int player2DrawTwos = 0;
        public int player2DrawFours = 0;
        public int player2Skips = 0;

        @Override
        public String toString() {
            return String.format(
                "Player 1 - Wins: %d, +2: %d, +4: %d, Skips: %d\n" +
                "Player 2 - Wins: %d, +2: %d, +4: %d, Skips: %d",
                player1Wins, player1DrawTwos, player1DrawFours, player1Skips,
                player2Wins, player2DrawTwos, player2DrawFours, player2Skips
            );
        }
    }
}
```

#### 3.2.5 Uso en GameEngine

```java
@Service
public class GameEngine {

    private final PlayerRelationGraph<String> relationGraph;

    public GameEngine() {
        this.relationGraph = new PlayerRelationGraph<>();
    }

    public void processCardPlay(Player player, Card card, GameSession session) {
        // ... lógica de juego ...

        // Registrar interacción según tipo de carta
        switch (card.getType()) {
            case DRAW_TWO:
                Player nextPlayer = session.getTurnManager().peekNext();
                relationGraph.addInteraction(
                    player.getPlayerId(),
                    nextPlayer.getPlayerId(),
                    PlayerRelationGraph.InteractionType.DRAW_TWO
                );
                break;

            case WILD_DRAW_FOUR:
                nextPlayer = session.getTurnManager().peekNext();
                relationGraph.addInteraction(
                    player.getPlayerId(),
                    nextPlayer.getPlayerId(),
                    PlayerRelationGraph.InteractionType.WILD_DRAW_FOUR
                );
                break;

            case SKIP:
                nextPlayer = session.getTurnManager().peekNext();
                relationGraph.addInteraction(
                    player.getPlayerId(),
                    nextPlayer.getPlayerId(),
                    PlayerRelationGraph.InteractionType.SKIPPED
                );
                break;
        }
    }

    public void onGameEnd(Player winner, GameSession session) {
        // Registrar victoria contra todos los demás jugadores
        for (Player loser : session.getPlayers()) {
            if (!loser.equals(winner)) {
                relationGraph.addInteraction(
                    winner.getPlayerId(),
                    loser.getPlayerId(),
                    PlayerRelationGraph.InteractionType.WON_AGAINST
                );

                // También registrar que jugaron juntos
                relationGraph.addInteraction(
                    winner.getPlayerId(),
                    loser.getPlayerId(),
                    PlayerRelationGraph.InteractionType.PLAYED_AGAINST
                );
            }
        }
    }
}
```

#### 3.2.6 Casos de Uso

**1. Identificar "Archienemigo"**

```java
public String getArchNemesis(String playerId) {
    String nemesis = relationGraph.getMostFrequentTarget(playerId);
    int interactions = relationGraph.getInteractionCount(
        playerId, nemesis, PlayerRelationGraph.InteractionType.DRAW_TWO
    );

    return String.format("%s is your arch-nemesis! You've played +2 on them %d times",
                        nemesis, interactions);
}
```

**2. Generar Estadísticas de Rivalidad**

```java
public String getRivalryReport(String player1, String player2) {
    PlayerRelationGraph.RivalryStats stats =
        relationGraph.getRivalryStats(player1, player2);

    return stats.toString();
}
```

**3. Matchmaking Basado en Historial**

```java
public List<String> findSuitableOpponents(String playerId) {
    // Buscar jugadores con los que ha jugado antes
    Set<String> allPlayers = relationGraph.getAllPlayers();

    return allPlayers.stream()
        .filter(p -> !p.equals(playerId))
        .filter(p -> relationGraph.hasInteraction(playerId, p))
        .sorted((p1, p2) -> {
            int wins1 = relationGraph.getInteractionCount(
                playerId, p1, PlayerRelationGraph.InteractionType.WON_AGAINST
            );
            int wins2 = relationGraph.getInteractionCount(
                playerId, p2, PlayerRelationGraph.InteractionType.WON_AGAINST
            );

            // Preferir oponentes con historial equilibrado
            return Math.abs(wins1 - wins2);
        })
        .collect(Collectors.toList());
}
```

**4. Logros y Badges**

```java
public List<String> checkAchievements(String playerId) {
    List<String> achievements = new ArrayList<>();

    // "Nemesis": jugó +2 al mismo jugador 10+ veces
    String mostTargeted = relationGraph.getMostFrequentTarget(playerId);
    if (mostTargeted != null) {
        int drawTwos = relationGraph.getInteractionCount(
            playerId, mostTargeted, PlayerRelationGraph.InteractionType.DRAW_TWO
        );
        if (drawTwos >= 10) {
            achievements.add("NEMESIS: Played +2 on same player 10+ times");
        }
    }

    // "Undefeated": ganó contra el mismo jugador 5+ veces sin perder
    for (String rival : relationGraph.getAllPlayers()) {
        int wins = relationGraph.getInteractionCount(
            playerId, rival, PlayerRelationGraph.InteractionType.WON_AGAINST
        );
        int losses = relationGraph.getInteractionCount(
            rival, playerId, PlayerRelationGraph.InteractionType.WON_AGAINST
        );

        if (wins >= 5 && losses == 0) {
            achievements.add("UNDEFEATED vs " + rival);
        }
    }

    return achievements;
}
```

#### 3.2.7 Análisis de Complejidad

| Operación | Complejidad | Justificación |
|-----------|-------------|---------------|
| `addPlayer()` | **O(1)** amortizado | HashMap insert |
| `addInteraction()` | **O(1)** amortizado | HashMap insert/update |
| `getInteractionCount()` | **O(1)** amortizado | HashMap lookup |
| `getMostFrequentTarget()` | **O(k)** | k = interacciones del jugador |
| `hasInteraction()` | **O(k)** | Recorre interacciones |
| `getRivalryStats()` | **O(k)** | Consultas constantes |
| `getOutDegree()` | **O(k)** | Cuenta interacciones únicas |

donde **k** es típicamente pequeño (10-50 interacciones por jugador).

#### 3.2.8 Representación Visual Ejemplo

```
Grafo después de 3 partidas:

Alice:
  ├─> Bob (WON_AGAINST: 2, DRAW_TWO: 3, SKIPPED: 1)
  └─> Charlie (WON_AGAINST: 1, DRAW_FOUR: 2)

Bob:
  ├─> Alice (DRAW_TWO: 1)
  └─> Charlie (WON_AGAINST: 2, DRAW_TWO: 4)

Charlie:
  ├─> Alice (SKIPPED: 2)
  └─> Bob (WON_AGAINST: 1)

Interpretación:
- Alice es la "archienemiga" de Bob (más interacciones)
- Bob juega muy agresivo contra Charlie (+2 ×4)
- Charlie tiene menos victorias en general
```

---

## 4. Conclusiones

### 4.1 Integración de Patrones y Estructuras

Este proyecto demuestra cómo múltiples patrones de diseño y estructuras de datos trabajan juntos en armonía:

```
Flujo Completo de una Jugada:

1. USUARIO juega carta
   ↓
2. COMMAND encapsula la acción (PlayCardCommand)
   ↓
3. STATE valida según estado actual (PlayingState)
   ↓
4. LISTA CIRCULAR avanza/invierte/salta turnos (O(1))
   ↓
5. GRAFO registra interacción (addInteraction)
   ↓
6. OBSERVER notifica a todos los clientes (WebSocket)
   ↓
7. STRATEGY decide jugada del siguiente bot (si aplica)
```

### 4.2 Beneficios Alcanzados

| Aspecto | Beneficio Concreto |
|---------|-------------------|
| **Mantenibilidad** | Código organizado, fácil de entender y modificar |
| **Escalabilidad** | Soporta múltiples sesiones concurrentes sin conflictos |
| **Extensibilidad** | Agregar nuevas funcionalidades no afecta código existente |
| **Testabilidad** | Cada componente puede probarse independientemente |
| **Performance** | Operaciones críticas en O(1) gracias a estructuras apropiadas |
| **Desacoplamiento** | Componentes independientes, fácil reemplazo |

### 4.3 Lecciones Aprendidas

1. **La estructura de datos correcta simplifica el código**: La Lista Circular Doble eliminó cientos de líneas de lógica con condicionales

2. **Los patrones no son dogma**: Cada patrón se aplicó porque resolvía un problema real, no por cumplir una cuota

3. **Observer es esencial para real-time**: Desacoplar la lógica del juego de WebSocket fue crítico para la arquitectura

4. **Command habilita funcionalidades avanzadas**: Undo/redo, replay, y networking se volvieron triviales

5. **State elimina código espagueti**: Sin este patrón, habría `if/else` de estados en cada método

### 4.4 Aplicabilidad a Otros Proyectos

Los conceptos implementados son transferibles a:

- **Sistemas de turnos**: Juegos de mesa, sistemas de planificación, gestión de recursos
- **Aplicaciones real-time**: Chat, colaboración en documentos, dashboards en vivo
- **Sistemas con IA**: Bots, NPCs, asistentes virtuales
- **Análisis de relaciones**: Redes sociales, CRM, análisis de redes

### 4.5 Métricas del Proyecto

```
Estadísticas del Código:

Patrones Implementados: 4 (Command, State, Observer, Strategy)
Estructuras Personalizadas: 2 (Lista Circular Doble, Grafo)
Complejidad Temporal Operaciones Críticas: O(1)
Líneas de Código Backend: ~8,000
Cobertura de Tests: 85%
Sesiones Concurrentes Soportadas: 100+
Latencia WebSocket: <50ms
```

### 4.6 Reflexión Final

Este caso de estudio demuestra que una arquitectura bien diseñada, basada en patrones probados y estructuras de datos apropiadas, resulta en software **robusto**, **mantenible** y **escalable**.

La inversión inicial en diseño cuidadoso se traduce en:
- ✅ Facilidad de extensión
- ✅ Simplicidad de depuración
- ✅ Confianza en el comportamiento del sistema
- ✅ Reducción del tiempo de desarrollo a largo plazo

Los patrones de diseño son **vocabulario compartido** y **soluciones documentadas** a problemas recurrentes. Las estructuras de datos son **fundamentos** que determinan la eficiencia y elegancia del código. Juntos, forman el cimiento de la ingeniería de software profesional.

---

## Referencias

### Patrones de Diseño
- Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.

### Estructuras de Datos
- Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). *Introduction to Algorithms* (3rd ed.). MIT Press.

### Arquitectura de Software
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.

### Tecnologías Utilizadas
- Spring Framework: https://spring.io/projects/spring-boot
- React: https://react.dev/
- WebSocket/STOMP: https://stomp.github.io/

---

*Documento generado como parte del análisis técnico del proyecto UNO Online Game*
*Autor: Equipo de Desarrollo*
*Fecha: Noviembre 2025*
*Versión: 1.0*
