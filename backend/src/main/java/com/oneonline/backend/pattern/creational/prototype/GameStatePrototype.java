package com.oneonline.backend.pattern.creational.prototype;

import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.enums.GameStatus;

import java.util.*;
import java.util.stream.Collectors;

/**
 * PROTOTYPE PATTERN Implementation for GameSession state cloning
 *
 * Purpose:
 * Allows creating exact copies of game state for undo/redo functionality,
 * game replay, or AI simulation. Creates new instances by copying existing
 * objects rather than building from scratch.
 *
 * Pattern Benefits:
 * - Avoid expensive re-initialization
 * - Hide complexity of creating new instances
 * - Add/remove objects at runtime
 * - Reduce subclassing
 * - Configure applications with classes dynamically
 *
 * Use Cases in ONE Game:
 * - Undo/Redo: Save game state before each move, restore if needed
 * - Game Replay: Save states throughout game for replay feature
 * - Bot AI: Clone state to simulate moves without affecting real game
 * - Save/Load: Serialize game state for persistence
 * - Testing: Create game states for test scenarios
 *
 * Deep Copy vs Shallow Copy:
 * This implementation performs DEEP COPY - all nested objects are cloned,
 * ensuring complete independence from the original.
 *
 * Example Usage:
 * <pre>
 * GameSession original = ...;
 * GameStatePrototype prototype = GameStatePrototype.from(original);
 * GameSession clone = prototype.clone();
 * // clone is completely independent from original
 * </pre>
 */
public class GameStatePrototype implements Cloneable {

    // Game state fields
    private String sessionId;
    private String roomId;
    private Stack<Card> discardPile;
    private LinkedList<Player> turnOrder;
    private String currentPlayerId;
    private GameStatus currentState;
    private boolean clockwise;
    private int pendingDrawCount;
    private Long turnStartTime;
    private Map<String, PlayerState> playerStates;

    /**
     * Inner class to store player state
     */
    private static class PlayerState {
        String playerId;
        String nickname;
        List<Card> hand;
        int score;
        boolean connected;

        PlayerState(Player player) {
            this.playerId = player.getPlayerId();
            this.nickname = player.getNickname();
            this.hand = new ArrayList<>(player.getHand());
            this.score = player.getScore();
            this.connected = player.isConnected();
        }

        PlayerState deepCopy() {
            PlayerState copy = new PlayerState();
            copy.playerId = this.playerId;
            copy.nickname = this.nickname;
            copy.hand = new ArrayList<>(this.hand.size());
            // Deep copy each card
            for (Card card : this.hand) {
                copy.hand.add(cloneCard(card));
            }
            copy.score = this.score;
            copy.connected = this.connected;
            return copy;
        }

        private PlayerState() {} // For deep copy
    }

    /**
     * Private constructor - use factory method from()
     */
    private GameStatePrototype() {}

    /**
     * Factory method to create prototype from GameSession.
     *
     * Extracts and stores all relevant state from a GameSession.
     *
     * @param session Active game session
     * @return GameStatePrototype ready to be cloned
     */
    public static GameStatePrototype from(GameSession session) {
        GameStatePrototype prototype = new GameStatePrototype();

        prototype.sessionId = session.getSessionId();
        prototype.roomId = session.getRoom() != null ? session.getRoom().getRoomId() : null;

        // Deep copy discard pile
        prototype.discardPile = new Stack<>();
        if (session.getDiscardPile() != null) {
            for (Card card : session.getDiscardPile()) {
                prototype.discardPile.push(cloneCard(card));
            }
        }

        // Deep copy turn order
        prototype.turnOrder = new LinkedList<>();
        if (session.getTurnOrder() != null) {
            prototype.turnOrder.addAll(session.getTurnOrder());
        }

        // Store current player ID
        prototype.currentPlayerId = session.getCurrentPlayer() != null ?
                session.getCurrentPlayer().getPlayerId() : null;

        prototype.currentState = session.getCurrentState();
        prototype.clockwise = session.isClockwise();
        prototype.pendingDrawCount = session.getPendingDrawCount();
        prototype.turnStartTime = session.getTurnStartTime();

        // Deep copy all player states
        prototype.playerStates = new HashMap<>();
        if (session.getRoom() != null) {
            for (Player player : session.getRoom().getAllPlayers()) {
                prototype.playerStates.put(player.getPlayerId(), new PlayerState(player));
            }
        }

        return prototype;
    }

    /**
     * Clone this prototype to create an independent copy.
     *
     * Performs DEEP COPY of all fields, including:
     * - Card collections (discard pile)
     * - Player states and hands
     * - Turn order
     *
     * The cloned state is completely independent from the original.
     *
     * @return Deep copy of this game state
     */
    @Override
    public GameStatePrototype clone() {
        try {
            GameStatePrototype cloned = (GameStatePrototype) super.clone();

            // Deep copy discard pile
            cloned.discardPile = new Stack<>();
            for (Card card : this.discardPile) {
                cloned.discardPile.push(cloneCard(card));
            }

            // Deep copy turn order
            cloned.turnOrder = new LinkedList<>(this.turnOrder);

            // Deep copy player states
            cloned.playerStates = new HashMap<>();
            for (Map.Entry<String, PlayerState> entry : this.playerStates.entrySet()) {
                cloned.playerStates.put(entry.getKey(), entry.getValue().deepCopy());
            }

            // Primitives and immutable strings are copied by super.clone()

            return cloned;

        } catch (CloneNotSupportedException e) {
            throw new RuntimeException("Clone not supported", e);
        }
    }

    /**
     * Clone a card (deep copy).
     *
     * Creates a new instance of the same card type with the same properties.
     *
     * @param card Card to clone
     * @return New card instance with same properties
     */
    private static Card cloneCard(Card card) {
        if (card instanceof NumberCard) {
            return new NumberCard(card.getColor(), card.getValue());
        } else if (card instanceof SkipCard) {
            return new SkipCard(card.getColor());
        } else if (card instanceof ReverseCard) {
            return new ReverseCard(card.getColor());
        } else if (card instanceof DrawTwoCard) {
            return new DrawTwoCard(card.getColor());
        } else if (card instanceof WildDrawFourCard) {
            WildDrawFourCard wild = new WildDrawFourCard();
            if (((WildDrawFourCard) card).getChosenColor() != null) {
                wild.setChosenColor(((WildDrawFourCard) card).getChosenColor());
            }
            return wild;
        } else if (card instanceof WildCard) {
            WildCard wild = new WildCard();
            if (((WildCard) card).getChosenColor() != null) {
                wild.setChosenColor(((WildCard) card).getChosenColor());
            }
            return wild;
        }
        // Fallback: return original (shouldn't reach here)
        return card;
    }

    /**
     * Restore game session from this prototype.
     *
     * Applies the stored state back to a GameSession object.
     * Useful for undo/redo functionality.
     *
     * @param session Session to restore state into
     */
    public void restoreToSession(GameSession session) {
        session.setSessionId(this.sessionId);
        session.setCurrentState(this.currentState);
        session.setClockwise(this.clockwise);
        session.setPendingDrawCount(this.pendingDrawCount);
        session.setTurnStartTime(this.turnStartTime);

        // Restore discard pile
        session.getDiscardPile().clear();
        session.getDiscardPile().addAll(this.discardPile);

        // Restore turn order
        session.getTurnOrder().clear();
        session.getTurnOrder().addAll(this.turnOrder);

        // Restore player states
        if (session.getRoom() != null) {
            for (Player player : session.getRoom().getAllPlayers()) {
                PlayerState state = this.playerStates.get(player.getPlayerId());
                if (state != null) {
                    player.getHand().clear();
                    player.getHand().addAll(state.hand);
                    player.setScore(state.score);
                    player.setConnected(state.connected);
                }
            }
        }

        // Restore current player
        if (this.currentPlayerId != null) {
            Player currentPlayer = session.getTurnOrder().stream()
                    .filter(p -> p.getPlayerId().equals(this.currentPlayerId))
                    .findFirst()
                    .orElse(null);
            session.setCurrentPlayer(currentPlayer);
        }
    }

    // Getters for inspection (useful for testing/debugging)

    public String getSessionId() {
        return sessionId;
    }

    public GameStatus getCurrentState() {
        return currentState;
    }

    public boolean isClockwise() {
        return clockwise;
    }

    public int getPendingDrawCount() {
        return pendingDrawCount;
    }

    public Card getTopCard() {
        return discardPile.isEmpty() ? null : discardPile.peek();
    }

    public int getDiscardPileSize() {
        return discardPile.size();
    }

    public int getPlayerCount() {
        return playerStates.size();
    }

    /**
     * Get summary of game state for debugging.
     *
     * @return Human-readable summary
     */
    @Override
    public String toString() {
        return String.format(
                "GameState[session=%s, state=%s, players=%d, discardPile=%d, clockwise=%s]",
                sessionId, currentState, playerStates.size(), discardPile.size(), clockwise
        );
    }
}
