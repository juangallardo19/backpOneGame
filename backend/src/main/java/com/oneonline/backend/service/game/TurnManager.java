package com.oneonline.backend.service.game;

import com.oneonline.backend.datastructure.CircularDoublyLinkedList;
import com.oneonline.backend.model.domain.Player;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;

/**
 * TurnManager Service
 *
 * Manages turn order and turn transitions in a game.
 * Uses CircularDoublyLinkedList for efficient turn cycling.
 *
 * RESPONSIBILITIES:
 * - Track current player's turn
 * - Advance to next player
 * - Handle Reverse card (change direction)
 * - Handle Skip card (skip next player)
 * - Add/remove players from turn order
 *
 * DATA STRUCTURE: CircularDoublyLinkedList<Player>
 * - Circular: After last player, loops back to first
 * - Doubly: Can traverse forward (clockwise) or backward (counter-clockwise)
 * - Efficient O(1) operations for next/previous
 *
 * @author Juan Gallardo
 */
@Slf4j
@Getter
public class TurnManager {

    /**
     * Circular turn queue using custom data structure
     * Direction is managed internally by CircularDoublyLinkedList
     */
    private final CircularDoublyLinkedList<Player> playerQueue;

    /**
     * Constructor
     *
     * @param players Initial list of players
     */
    public TurnManager(List<Player> players) {
        if (players == null || players.isEmpty()) {
            throw new IllegalArgumentException("Player list cannot be empty");
        }

        this.playerQueue = new CircularDoublyLinkedList<>();

        // Add all players to circular queue
        for (Player player : players) {
            this.playerQueue.add(player);
        }

        log.info("TurnManager initialized with {} players", players.size());
    }

    /**
     * Get current player (whose turn it is)
     *
     * @return Current player
     */
    public Player getCurrentPlayer() {
        return playerQueue.getCurrent();
    }

    /**
     * Get next player without advancing turn
     *
     * Direction is handled internally by CircularDoublyLinkedList
     *
     * @return Next player in turn order
     */
    public Player peekNextPlayer() {
        return playerQueue.peekNext();
    }

    /**
     * Advance to next player's turn
     *
     * Direction is handled internally by CircularDoublyLinkedList
     *
     * @return New current player
     */
    public Player nextTurn() {
        playerQueue.moveNext();
        Player nextPlayer = playerQueue.getCurrent();

        log.debug("Turn advanced to: {}", nextPlayer.getNickname());
        return nextPlayer;
    }

    /**
     * Reverse turn order (Reverse card effect)
     *
     * Changes direction from clockwise to counter-clockwise or vice versa.
     * Does NOT advance turn - next turn will be in opposite direction.
     *
     * CRITICAL FIX: Only reverse once in CircularDoublyLinkedList
     * (Previously was reversing twice, canceling the effect)
     *
     * @return New direction (true = clockwise, false = counter-clockwise)
     */
    public boolean reverseTurnOrder() {
        playerQueue.reverse();
        boolean newDirection = playerQueue.isClockwise();

        log.info("Turn order reversed. Direction: {}", newDirection ? "Clockwise" : "Counter-clockwise");
        return newDirection;
    }

    /**
     * Skip next player's turn (Skip card effect)
     *
     * Advances turn twice, effectively skipping one player.
     *
     * @return Player whose turn it is after skip
     */
    public Player skipNextPlayer() {
        Player skippedPlayer = peekNextPlayer();

        // Advance twice (skip one player)
        nextTurn();  // Skip target
        Player newCurrentPlayer = nextTurn();  // Land on next player

        log.info("Player {} was skipped. Turn: {}",
            skippedPlayer.getNickname(), newCurrentPlayer.getNickname());

        return newCurrentPlayer;
    }

    /**
     * Add player to turn order
     *
     * Adds at the end of current cycle.
     *
     * @param player Player to add
     */
    public void addPlayer(Player player) {
        playerQueue.add(player);
        log.info("Player {} added to turn order", player.getNickname());
    }

    /**
     * Remove player from turn order
     *
     * If removed player is current, advances to next player first.
     *
     * @param playerId Player ID to remove
     * @return true if removed, false if not found
     */
    public boolean removePlayer(String playerId) {
        // Check if removing current player
        if (getCurrentPlayer().getPlayerId().equals(playerId)) {
            log.info("Removing current player {}, advancing turn first", getCurrentPlayer().getNickname());
            nextTurn();  // Advance before removal
        }

        // Find and remove player
        List<Player> players = getAllPlayers();
        for (int i = 0; i < players.size(); i++) {
            if (players.get(i).getPlayerId().equals(playerId)) {
                // Rebuild queue without this player
                rebuildQueueWithoutPlayer(playerId);
                log.info("Player {} removed from turn order", players.get(i).getNickname());
                return true;
            }
        }

        return false;
    }

    /**
     * Get turn order as list (for display)
     *
     * Returns players in order starting from current player.
     *
     * @return Ordered list of players
     */
    public List<Player> getTurnOrder() {
        List<Player> order = new ArrayList<>();
        Player start = getCurrentPlayer();
        order.add(start);

        Player current = peekNextPlayer();
        while (!current.getPlayerId().equals(start.getPlayerId())) {
            order.add(current);
            // Temporarily move to get next (direction handled by CircularDoublyLinkedList)
            playerQueue.moveNext();
            current = playerQueue.getCurrent();
        }

        // Reset to original position
        while (!getCurrentPlayer().getPlayerId().equals(start.getPlayerId())) {
            playerQueue.movePrevious();
        }

        return order;
    }

    /**
     * Get all players in queue
     *
     * @return List of all players
     */
    public List<Player> getAllPlayers() {
        List<Player> players = new ArrayList<>();
        Player start = getCurrentPlayer();
        players.add(start);

        playerQueue.moveNext();
        while (!getCurrentPlayer().getPlayerId().equals(start.getPlayerId())) {
            players.add(getCurrentPlayer());
            playerQueue.moveNext();
        }

        return players;
    }

    /**
     * Get number of players in turn order
     *
     * @return Player count
     */
    public int getPlayerCount() {
        return playerQueue.size();
    }

    /**
     * Get current turn direction
     *
     * Delegates to CircularDoublyLinkedList to get actual direction.
     *
     * @return true if clockwise, false if counter-clockwise
     */
    public boolean isClockwise() {
        return playerQueue.isClockwise();
    }

    /**
     * Check if player is in turn order
     *
     * @param playerId Player ID
     * @return true if in queue
     */
    public boolean hasPlayer(String playerId) {
        return getAllPlayers().stream()
            .anyMatch(p -> p.getPlayerId().equals(playerId));
    }

    /**
     * Reset to first player (for new round)
     */
    public void resetToStart() {
        // Move back to first player added
        List<Player> players = getAllPlayers();
        Player first = players.get(0);

        while (!getCurrentPlayer().getPlayerId().equals(first.getPlayerId())) {
            playerQueue.movePrevious();
        }

        // Reset direction to clockwise
        playerQueue.setClockwise(true);
        log.info("Turn order reset to start: {}", first.getNickname());
    }

    /**
     * Rebuild queue without a specific player
     *
     * @param excludePlayerId Player ID to exclude
     */
    private void rebuildQueueWithoutPlayer(String excludePlayerId) {
        List<Player> remainingPlayers = getAllPlayers().stream()
            .filter(p -> !p.getPlayerId().equals(excludePlayerId))
            .toList();

        // Clear and rebuild
        while (playerQueue.size() > 0) {
            playerQueue.removeCurrent();
        }

        for (Player player : remainingPlayers) {
            playerQueue.add(player);
        }
    }
}
