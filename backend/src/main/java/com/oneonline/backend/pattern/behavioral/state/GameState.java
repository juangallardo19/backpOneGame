package com.oneonline.backend.pattern.behavioral.state;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;

/**
 * STATE PATTERN Interface
 *
 * Purpose:
 * Defines the contract for different game states. Each state implements
 * specific behavior for game actions, allowing the game session to change
 * its behavior based on its current state.
 *
 * Pattern Benefits:
 * - Encapsulates state-specific behavior
 * - Eliminates large if-else or switch statements
 * - Makes state transitions explicit
 * - Easy to add new states
 * - Single Responsibility Principle (each state handles its own logic)
 *
 * Game States in ONE:
 * - LobbyState: Waiting for players to join
 * - PlayingState: Active gameplay
 * - GameOverState: Game finished, showing results
 *
 * Use Cases:
 * - Different actions allowed in different states
 * - State-specific validation rules
 * - Controlled state transitions
 * - Prevent invalid operations (e.g., play card while in lobby)
 *
 * Example Usage:
 * <pre>
 * GameSession session = new GameSession();
 * session.setState(new LobbyState());
 * session.playCard(player, card); // Throws exception - can't play in lobby
 * session.startGame(); // Transitions to PlayingState
 * session.playCard(player, card); // Now allowed
 * </pre>
 */
public interface GameState {

    /**
     * Called when entering this state.
     * Used for initialization and state entry actions.
     *
     * @param session Game session entering this state
     */
    void enter(GameSession session);

    /**
     * Called when exiting this state.
     * Used for cleanup and state exit actions.
     *
     * @param session Game session exiting this state
     */
    void exit(GameSession session);

    /**
     * Handle playing a card.
     *
     * @param player Player attempting to play
     * @param card Card to play
     * @param session Current game session
     * @throws IllegalStateException if action not allowed in this state
     */
    void playCard(Player player, Card card, GameSession session);

    /**
     * Handle drawing a card.
     *
     * @param player Player attempting to draw
     * @param session Current game session
     * @throws IllegalStateException if action not allowed in this state
     */
    void drawCard(Player player, GameSession session);

    /**
     * Handle calling "ONE!".
     *
     * @param player Player calling ONE
     * @param session Current game session
     * @throws IllegalStateException if action not allowed in this state
     */
    void callOne(Player player, GameSession session);

    /**
     * Handle choosing color (for wild cards).
     *
     * @param player Player choosing color
     * @param color Chosen color
     * @param session Current game session
     * @throws IllegalStateException if action not allowed in this state
     */
    void chooseColor(Player player, CardColor color, GameSession session);

    /**
     * Handle player joining.
     *
     * @param player Player attempting to join
     * @param session Current game session
     * @throws IllegalStateException if action not allowed in this state
     */
    void playerJoin(Player player, GameSession session);

    /**
     * Handle player leaving.
     *
     * @param player Player attempting to leave
     * @param session Current game session
     */
    void playerLeave(Player player, GameSession session);

    /**
     * Handle starting the game.
     *
     * @param session Game session to start
     * @throws IllegalStateException if action not allowed in this state
     */
    void startGame(GameSession session);

    /**
     * Handle pausing the game.
     *
     * @param session Game session to pause
     * @throws IllegalStateException if action not allowed in this state
     */
    void pauseGame(GameSession session);

    /**
     * Handle resuming the game.
     *
     * @param session Game session to resume
     * @throws IllegalStateException if action not allowed in this state
     */
    void resumeGame(GameSession session);

    /**
     * Handle ending the game.
     *
     * @param session Game session to end
     * @param winner Winning player (can be null for forced end)
     */
    void endGame(GameSession session, Player winner);

    /**
     * Get the name of this state.
     *
     * @return State name (e.g., "LOBBY", "PLAYING", "GAME_OVER")
     */
    String getStateName();

    /**
     * Check if a specific action is allowed in this state.
     *
     * @param action Action name (e.g., "PLAY_CARD", "DRAW_CARD")
     * @return true if action is allowed
     */
    boolean isActionAllowed(String action);

    /**
     * Get description of what's happening in this state.
     *
     * @return Human-readable state description
     */
    String getStateDescription();
}
