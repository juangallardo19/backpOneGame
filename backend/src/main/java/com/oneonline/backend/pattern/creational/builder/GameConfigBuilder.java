package com.oneonline.backend.pattern.creational.builder;

import com.oneonline.backend.model.domain.GameConfiguration;

/**
 * BUILDER PATTERN Implementation for GameConfiguration construction
 *
 * Purpose:
 * Provides a fluent API for constructing GameConfiguration objects with
 * custom game rules and settings. Makes it easy to create different
 * game configurations without complex constructors.
 *
 * Pattern Benefits:
 * - Fluent interface for readable configuration
 * - Default values for all parameters
 * - Validation before object creation
 * - Method chaining for clean code
 * - Easy to create variations of configurations
 *
 * Use Cases in ONE Game:
 * - Create custom game modes (fast game, long game, tournament mode)
 * - Configure room-specific rules
 * - Testing different game scenarios
 * - User-customizable game settings
 *
 * Example Usage:
 * <pre>
 * GameConfiguration fastGame = new GameConfigBuilder()
 *     .withTurnTimeLimit(30)
 *     .withPointsToWin(100)
 *     .build();
 *
 * GameConfiguration tournament = new GameConfigBuilder()
 *     .withTournamentMode(true)
 *     .withAllowStackingCards(false)
 *     .withPointsToWin(500)
 *     .build();
 * </pre>
 */
public class GameConfigBuilder {

    // Default values for all configuration options
    private int maxPlayers = 4;
    private int initialCardCount = 7;
    private int turnTimeLimit = 60;
    private boolean allowStackingCards = true;
    private int pointsToWin = 200;
    private boolean tournamentMode = false;

    /**
     * Constructor - initializes with default values
     */
    public GameConfigBuilder() {
        // All fields have default values already
    }

    /**
     * Set maximum number of players (2-4).
     *
     * Default: 4
     *
     * @param maxPlayers Maximum players allowed (2-4)
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
        return this;
    }

    /**
     * Set number of cards dealt to each player at start.
     *
     * Default: 7 (standard ONE rules)
     *
     * @param initialCardCount Cards per player at start (1-10)
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withInitialCardCount(int initialCardCount) {
        this.initialCardCount = initialCardCount;
        return this;
    }

    /**
     * Set time limit for each player's turn in seconds.
     *
     * Default: 60 seconds
     *
     * @param turnTimeLimit Time limit in seconds (30-120)
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withTurnTimeLimit(int turnTimeLimit) {
        this.turnTimeLimit = turnTimeLimit;
        return this;
    }

    /**
     * Set whether +2 and +4 cards can be stacked.
     *
     * When enabled:
     * - Player can respond to +2 with another +2
     * - Player can respond to +4 with another +4
     * - Stack accumulates (2, 4, 6, 8... cards to draw)
     *
     * Default: true (stacking allowed)
     *
     * @param allowStackingCards true to allow stacking
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withAllowStackingCards(boolean allowStackingCards) {
        this.allowStackingCards = allowStackingCards;
        return this;
    }

    /**
     * Set points required to win the game.
     *
     * Points are earned from opponent's remaining cards.
     * Valid values: 100, 200, or 500
     *
     * Default: 200
     *
     * @param pointsToWin Points to win (100, 200, or 500)
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withPointsToWin(int pointsToWin) {
        this.pointsToWin = pointsToWin;
        return this;
    }

    /**
     * Set tournament mode.
     *
     * Tournament mode changes:
     * - Stricter rules enforcement
     * - No reconnection allowed
     * - Fixed time limits
     * - No bots allowed
     *
     * Default: false
     *
     * @param tournamentMode true for tournament mode
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder withTournamentMode(boolean tournamentMode) {
        this.tournamentMode = tournamentMode;
        return this;
    }

    /**
     * Build the GameConfiguration object with validation.
     *
     * Performs validation before creating:
     * - Max players: 2-4
     * - Initial cards: 1-10
     * - Turn time limit: 30-120 seconds
     * - Points to win: 100, 200, or 500
     *
     * @return Constructed GameConfiguration object
     * @throws IllegalStateException if validation fails
     */
    public GameConfiguration build() {
        GameConfiguration config = GameConfiguration.builder()
                .maxPlayers(maxPlayers)
                .initialCardCount(initialCardCount)
                .turnTimeLimit(turnTimeLimit)
                .allowStackingCards(allowStackingCards)
                .pointsToWin(pointsToWin)
                .tournamentMode(tournamentMode)
                .build();

        // Validate configuration
        try {
            config.validate();
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid configuration: " + e.getMessage());
        }

        return config;
    }

    /**
     * Reset builder to default values.
     * Allows reusing the same builder instance.
     *
     * @return this GameConfigBuilder for method chaining
     */
    public GameConfigBuilder reset() {
        this.maxPlayers = 4;
        this.initialCardCount = 7;
        this.turnTimeLimit = 60;
        this.allowStackingCards = true;
        this.pointsToWin = 200;
        this.tournamentMode = false;
        return this;
    }

    // Static factory methods for common configurations

    /**
     * Create builder for standard game configuration.
     *
     * Standard config:
     * - 4 players
     * - 7 cards
     * - 60 second turns
     * - Stacking allowed
     * - 200 points to win
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder standard() {
        return new GameConfigBuilder();
    }

    /**
     * Create builder for fast game configuration.
     *
     * Fast config:
     * - 2-4 players
     * - 5 cards (less cards = faster game)
     * - 30 second turns
     * - Stacking allowed
     * - 100 points to win
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder fastGame() {
        return new GameConfigBuilder()
                .withInitialCardCount(5)
                .withTurnTimeLimit(30)
                .withPointsToWin(100);
    }

    /**
     * Create builder for long game configuration.
     *
     * Long config:
     * - 4 players
     * - 10 cards (more cards = longer game)
     * - 90 second turns
     * - Stacking allowed
     * - 500 points to win
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder longGame() {
        return new GameConfigBuilder()
                .withInitialCardCount(10)
                .withTurnTimeLimit(90)
                .withPointsToWin(500);
    }

    /**
     * Create builder for tournament mode configuration.
     *
     * Tournament config:
     * - 4 players
     * - 7 cards
     * - 60 second turns (strict)
     * - No stacking (classic rules)
     * - 500 points to win
     * - Tournament mode enabled
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder tournament() {
        return new GameConfigBuilder()
                .withAllowStackingCards(false)
                .withPointsToWin(500)
                .withTournamentMode(true);
    }

    /**
     * Create builder for quick 2-player game.
     *
     * Quick config:
     * - 2 players
     * - 7 cards
     * - 45 second turns
     * - Stacking allowed
     * - 100 points to win
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder quickTwoPlayer() {
        return new GameConfigBuilder()
                .withMaxPlayers(2)
                .withTurnTimeLimit(45)
                .withPointsToWin(100);
    }

    /**
     * Create builder for classic ONE rules (no stacking).
     *
     * Classic config:
     * - 4 players
     * - 7 cards
     * - 60 second turns
     * - No stacking (original rules)
     * - 200 points to win
     *
     * @return Pre-configured GameConfigBuilder
     */
    public static GameConfigBuilder classic() {
        return new GameConfigBuilder()
                .withAllowStackingCards(false);
    }
}
