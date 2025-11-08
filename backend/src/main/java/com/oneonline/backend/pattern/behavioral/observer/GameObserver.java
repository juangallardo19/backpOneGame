package com.oneonline.backend.pattern.behavioral.observer;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.model.enums.CardColor;

/**
 * OBSERVER PATTERN Interface
 *
 * Purpose:
 * Defines the contract for objects that need to be notified of game events.
 * Implements publish-subscribe pattern for loose coupling between game logic
 * and event consumers (WebSocket clients, logging, analytics, etc.).
 *
 * Pattern Benefits:
 * - Loose coupling between subject (game) and observers
 * - Multiple observers can react to same event
 * - Easy to add new observers without modifying game logic
 * - Open/Closed Principle compliance
 *
 * Use Cases in ONE Game:
 * - WebSocket notifications to clients
 * - Game event logging
 * - Analytics and statistics tracking
 * - Achievement/badge unlocking
 * - Real-time spectator updates
 *
 * Example Usage:
 * <pre>
 * GameObserver wsObserver = new WebSocketObserver(messagingTemplate);
 * GameObserver logObserver = new LoggingObserver();
 * gameSession.addObserver(wsObserver);
 * gameSession.addObserver(logObserver);
 * // Both observers will be notified of all game events
 * </pre>
 */
public interface GameObserver {

    /**
     * Called when a player joins a room.
     *
     * @param player Player who joined
     * @param room Room that was joined
     */
    void onPlayerJoined(Player player, Room room);

    /**
     * Called when a player leaves a room.
     *
     * @param player Player who left
     * @param room Room that was left
     */
    void onPlayerLeft(Player player, Room room);

    /**
     * Called when a card is played.
     *
     * @param player Player who played the card
     * @param card Card that was played
     * @param session Current game session
     */
    void onCardPlayed(Player player, Card card, GameSession session);

    /**
     * Called when a player draws a card.
     *
     * @param player Player who drew
     * @param cardCount Number of cards drawn
     * @param session Current game session
     */
    void onCardDrawn(Player player, int cardCount, GameSession session);

    /**
     * Called when a player calls "ONE!".
     *
     * @param player Player who called ONE
     * @param session Current game session
     */
    void onOneCalled(Player player, GameSession session);

    /**
     * Called when a player fails to call ONE (penalty).
     *
     * @param player Player who failed to call ONE
     * @param penaltyCards Number of penalty cards drawn
     * @param session Current game session
     */
    void onOnePenalty(Player player, int penaltyCards, GameSession session);

    /**
     * Called when game ends.
     *
     * @param winner Player who won
     * @param session Final game session state
     */
    void onGameEnded(Player winner, GameSession session);

    /**
     * Called when game starts.
     *
     * @param session Game session that started
     */
    void onGameStarted(GameSession session);

    /**
     * Called when turn changes to next player.
     *
     * @param currentPlayer Player whose turn it is now
     * @param session Current game session
     */
    void onTurnChanged(Player currentPlayer, GameSession session);

    /**
     * Called when direction reverses.
     *
     * @param clockwise New direction (true = clockwise)
     * @param session Current game session
     */
    void onDirectionReversed(boolean clockwise, GameSession session);

    /**
     * Called when a player skips turn.
     *
     * @param skippedPlayer Player who was skipped
     * @param session Current game session
     */
    void onPlayerSkipped(Player skippedPlayer, GameSession session);

    /**
     * Called when color changes (wild card).
     *
     * @param player Player who chose color
     * @param newColor New color chosen
     * @param session Current game session
     */
    void onColorChanged(Player player, CardColor newColor, GameSession session);

    /**
     * Called when a player disconnects.
     *
     * @param player Player who disconnected
     * @param session Current game session
     */
    void onPlayerDisconnected(Player player, GameSession session);

    /**
     * Called when a player reconnects.
     *
     * @param player Player who reconnected
     * @param session Current game session
     */
    void onPlayerReconnected(Player player, GameSession session);

    /**
     * Called when room is created.
     *
     * @param room Room that was created
     */
    void onRoomCreated(Room room);

    /**
     * Called when room is deleted.
     *
     * @param room Room that was deleted
     */
    void onRoomDeleted(Room room);

    /**
     * Called when game is paused.
     *
     * @param session Game session that was paused
     */
    void onGamePaused(GameSession session);

    /**
     * Called when game is resumed.
     *
     * @param session Game session that was resumed
     */
    void onGameResumed(GameSession session);
}
