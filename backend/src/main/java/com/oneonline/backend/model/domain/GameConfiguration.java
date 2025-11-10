package com.oneonline.backend.model.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Game configuration settings for a ONE game room.
 *
 * Defines rules and parameters for the game session including:
 * - Player limits
 * - Card distribution
 * - Time constraints
 * - Special rules (card stacking)
 * - Win conditions
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameConfiguration {

    /**
     * Maximum number of players allowed (2-4)
     */
    @Builder.Default
    private int maxPlayers = 4;

    /**
     * Number of cards dealt to each player at start (typically 7)
     */
    @Builder.Default
    private int initialCardCount = 7;

    /**
     * Time limit per turn in seconds (15-120)
     */
    @Builder.Default
    private int turnTimeLimit = 20;

    /**
     * Whether +2 and +4 cards can be stacked
     */
    @Builder.Default
    private boolean allowStackingCards = true;

    /**
     * Whether bots are allowed in the room
     */
    @Builder.Default
    private boolean allowBots = true;

    /**
     * Maximum number of bots allowed (0-3)
     */
    @Builder.Default
    private int maxBots = 3;

    /**
     * Points required to win the game (100/200/500)
     */
    @Builder.Default
    private int pointsToWin = 200;

    /**
     * Tournament mode flag (stricter rules, no reconnection)
     */
    @Builder.Default
    private boolean tournamentMode = false;

    /**
     * Get default game configuration
     *
     * @return Default configuration with standard ONE rules
     */
    public static GameConfiguration getDefault() {
        return GameConfiguration.builder()
                .maxPlayers(4)
                .initialCardCount(7)
                .turnTimeLimit(20)
                .allowStackingCards(true)
                .pointsToWin(200)
                .tournamentMode(false)
                .build();
    }

    /**
     * Alias for initialCardCount (for compatibility)
     *
     * @return Initial hand size
     */
    public int getInitialHandSize() {
        return initialCardCount;
    }

    /**
     * Alias setter for initialCardCount (for compatibility)
     *
     * @param size Initial hand size
     */
    public void setInitialHandSize(int size) {
        this.initialCardCount = size;
    }

    /**
     * Validate configuration values
     *
     * @throws IllegalArgumentException if configuration is invalid
     */
    public void validate() {
        if (maxPlayers < 2 || maxPlayers > 4) {
            throw new IllegalArgumentException("Max players must be between 2 and 4");
        }
        if (initialCardCount < 1 || initialCardCount > 10) {
            throw new IllegalArgumentException("Initial card count must be between 1 and 10");
        }
        if (turnTimeLimit < 15 || turnTimeLimit > 120) {
            throw new IllegalArgumentException("Turn time limit must be between 15 and 120 seconds");
        }
        if (pointsToWin != 100 && pointsToWin != 200 && pointsToWin != 500) {
            throw new IllegalArgumentException("Points to win must be 100, 200, or 500");
        }
    }
}
