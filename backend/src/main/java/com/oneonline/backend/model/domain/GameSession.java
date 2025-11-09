package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.GameStatus;
import com.oneonline.backend.service.game.TurnManager;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

/**
 * Represents an active ONE game session.
 *
 * Manages game state, turn order, and card play.
 * Implements Observer pattern for WebSocket notifications.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSession {

    /**
     * Unique identifier for this game session
     */
    @Builder.Default
    private String sessionId = UUID.randomUUID().toString();

    /**
     * Reference to the room this session belongs to
     */
    private Room room;

    /**
     * Main deck of cards
     */
    @Builder.Default
    private Deck mainDeck = new Deck();

    /**
     * Discard pile (cards that have been played)
     */
    @Builder.Default
    private Stack<Card> discardPile = new Stack<>();

    /**
     * Turn order queue
     */
    @Builder.Default
    private LinkedList<Player> turnOrder = new LinkedList<>();

    /**
     * Current player whose turn it is
     */
    private Player currentPlayer;

    /**
     * Current game status
     */
    @Builder.Default
    private GameStatus currentState = GameStatus.LOBBY;

    /**
     * Direction of play (true = clockwise, false = counter-clockwise)
     */
    @Builder.Default
    private boolean clockwise = true;

    /**
     * Pending draw effects (+2, +4 stacking)
     */
    @Builder.Default
    private int pendingDrawCount = 0;

    /**
     * Start time of current turn
     */
    private Long turnStartTime;

    /**
     * Winner of the game
     */
    private Player winner;

    /**
     * Start the game session
     */
    public void start() {
        if (room == null || room.getTotalPlayerCount() < 2) {
            throw new IllegalStateException("Need at least 2 players to start");
        }

        currentState = GameStatus.DEALING_CARDS;

        // Initialize deck
        mainDeck.initialize();
        mainDeck.shuffle();

        // Deal cards to ALL players (humans + bots)
        int cardCount = room.getConfig().getInitialCardCount();
        for (Player player : room.getAllPlayers()) {
            for (int i = 0; i < cardCount; i++) {
                player.drawCard(mainDeck.drawCard());
            }
        }

        // Setup turn order with ALL players (humans + bots)
        turnOrder.clear();
        turnOrder.addAll(room.getAllPlayers());

        // Place first card on discard pile
        Card firstCard = mainDeck.drawCard();
        while (firstCard.isWild()) {
            // Don't start with wild cards
            mainDeck.getCards().add(0, firstCard);
            mainDeck.shuffle();
            firstCard = mainDeck.drawCard();
        }
        discardPile.push(firstCard);

        // Set first player
        currentPlayer = turnOrder.getFirst();

        currentState = GameStatus.PLAYING;
        turnStartTime = System.currentTimeMillis();
    }

    /**
     * Play a card from current player's hand
     *
     * @param card The card to play
     * @return true if card was played successfully
     */
    public boolean playCard(Card card) {
        if (currentState != GameStatus.PLAYING) {
            return false;
        }

        Card topCard = getTopCard();

        // Validate card can be played
        if (!card.canPlayOn(topCard)) {
            return false;
        }

        // Handle special card effects
        if (card instanceof DrawTwoCard) {
            pendingDrawCount += 2;
        } else if (card instanceof WildDrawFourCard) {
            pendingDrawCount += 4;
        } else if (card instanceof ReverseCard) {
            reverseTurn();
        } else if (card instanceof SkipCard) {
            skipTurn();
        }

        // Remove card from player's hand and add to discard pile
        currentPlayer.playCard(card);
        discardPile.push(card);

        // Check win condition
        if (currentPlayer.hasWon()) {
            endGame(currentPlayer);
            return true;
        }

        // Check ONE penalty
        if (currentPlayer.shouldBePenalized()) {
            // Penalize: draw 2 cards
            currentPlayer.drawCard(mainDeck.drawCard());
            currentPlayer.drawCard(mainDeck.drawCard());
        }

        // Move to next turn
        nextTurn();

        return true;
    }

    /**
     * Draw a card for the current player
     *
     * @return The drawn card
     */
    public Card drawCard() {
        if (mainDeck.isEmpty()) {
            mainDeck.refillFromDiscard(discardPile, getTopCard());
        }

        Card drawnCard = mainDeck.drawCard();
        if (drawnCard != null) {
            currentPlayer.drawCard(drawnCard);
        }

        return drawnCard;
    }

    /**
     * Handle pending draw effects
     */
    public void handlePendingDraw() {
        if (pendingDrawCount > 0) {
            for (int i = 0; i < pendingDrawCount; i++) {
                drawCard();
            }
            pendingDrawCount = 0;
            nextTurn();
        }
    }

    /**
     * Skip the next player's turn
     */
    public void skipTurn() {
        // Move current player to end
        Player skipped = turnOrder.removeFirst();
        turnOrder.addLast(skipped);
    }

    /**
     * Reverse the turn order
     */
    public void reverseTurn() {
        clockwise = !clockwise;
        Collections.reverse(turnOrder);
    }

    /**
     * Move to the next player's turn
     */
    public void nextTurn() {
        if (turnOrder.isEmpty()) {
            return;
        }

        // Move current player to end of queue
        Player lastPlayer = turnOrder.removeFirst();
        turnOrder.addLast(lastPlayer);

        // Set new current player
        currentPlayer = turnOrder.getFirst();
        turnStartTime = System.currentTimeMillis();
    }

    /**
     * Get the top card on the discard pile
     *
     * @return The top card
     */
    public Card getTopCard() {
        if (discardPile.isEmpty()) {
            return null;
        }
        return discardPile.peek();
    }

    /**
     * End the game with a winner
     *
     * @param winner The winning player
     */
    public void endGame(Player winner) {
        this.winner = winner;
        this.currentState = GameStatus.GAME_OVER;

        // Calculate scores from ALL players (humans + bots)
        for (Player player : room.getAllPlayers()) {
            if (player != winner) {
                int points = player.calculateHandPoints();
                winner.setScore(winner.getScore() + points);
            }
        }
    }

    /**
     * Check if current turn has timed out
     *
     * @return true if turn has exceeded time limit
     */
    public boolean isTurnTimedOut() {
        if (turnStartTime == null) {
            return false;
        }

        long elapsed = System.currentTimeMillis() - turnStartTime;
        long limit = room.getConfig().getTurnTimeLimit() * 1000L;

        return elapsed > limit;
    }

    /**
     * Get all players (alias method for compatibility)
     *
     * @return List of all players
     */
    public List<Player> getPlayers() {
        return room != null ? room.getAllPlayers() : new ArrayList<>();
    }

    /**
     * Get deck (alias method for compatibility)
     *
     * @return Main deck
     */
    public Deck getDeck() {
        return mainDeck;
    }

    /**
     * Get status (alias method for compatibility)
     *
     * @return Current game status
     */
    public GameStatus getStatus() {
        return currentState;
    }

    /**
     * Get turn manager (alias method for compatibility)
     *
     * @return Turn manager
     */
    public TurnManager getTurnManager() {
        return new TurnManager(new ArrayList<>(turnOrder));
    }

    /**
     * Get configuration (alias method for compatibility)
     *
     * @return Game configuration
     */
    public GameConfiguration getConfiguration() {
        return room != null ? room.getConfig() : null;
    }

    /**
     * Add pending draw count (alias method for compatibility)
     *
     * @param count Count to add
     */
    public void addPendingDrawCount(int count) {
        this.pendingDrawCount += count;
    }

    /**
     * Reset pending draw count (alias method for compatibility)
     */
    public void resetPendingDrawCount() {
        this.pendingDrawCount = 0;
    }

    /**
     * Peek at next player without changing turn
     *
     * @return Next player in turn order
     */
    public Player peekNextPlayer() {
        if (turnOrder.size() < 2) {
            return null;
        }
        return clockwise ? turnOrder.get(1) : turnOrder.get(turnOrder.size() - 1);
    }

    /**
     * Set current state (alias for compatibility)
     *
     * @param status New game status
     */
    public void setStatus(GameStatus status) {
        this.currentState = status;
    }

    /**
     * Set current color for wild cards
     *
     * @param color Chosen color
     */
    public void setCurrentColor(com.oneonline.backend.model.enums.CardColor color) {
        // This can be stored if needed for state management
        // For now, wild cards store their chosen color internally
    }

    /**
     * Get max players from room configuration
     *
     * @return Max players allowed
     */
    public int getMaxPlayers() {
        return room != null && room.getConfig() != null ?
               room.getConfig().getMaxPlayers() : 4;
    }

    /**
     * Get state (for State pattern compatibility)
     * Returns a state object based on current status
     *
     * @return Current game state
     */
    public com.oneonline.backend.pattern.behavioral.state.GameState getState() {
        return switch (currentState) {
            case LOBBY -> new com.oneonline.backend.pattern.behavioral.state.LobbyState();
            case PLAYING -> new com.oneonline.backend.pattern.behavioral.state.PlayingState();
            case GAME_OVER -> new com.oneonline.backend.pattern.behavioral.state.GameOverState(winner);
            default -> new com.oneonline.backend.pattern.behavioral.state.LobbyState();
        };
    }

    /**
     * Set state (for State pattern compatibility)
     *
     * @param state New game state
     */
    public void setState(com.oneonline.backend.pattern.behavioral.state.GameState state) {
        // State pattern will call setStatus internally
    }

    @Override
    public String toString() {
        return "GameSession: " + sessionId + " [" + currentState + "] - " +
               "Current player: " + (currentPlayer != null ? currentPlayer.getNickname() : "none");
    }
}
