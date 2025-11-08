package com.oneonline.backend.pattern.creational.builder;

import com.oneonline.backend.model.domain.GameConfiguration;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.model.enums.RoomStatus;
import com.oneonline.backend.util.CodeGenerator;

/**
 * BUILDER PATTERN Implementation for Room construction
 *
 * Purpose:
 * Provides a fluent API for constructing complex Room objects step-by-step.
 * Separates the construction of a complex object from its representation,
 * allowing the same construction process to create different representations.
 *
 * Pattern Benefits:
 * - Fluent interface (method chaining) for readable code
 * - Allows step-by-step construction of complex objects
 * - Different representations with same building process
 * - Isolates code for construction from representation
 * - Provides better control over construction process
 * - Default values for optional parameters
 * - Validation before object creation
 *
 * Use Cases in ONE Game:
 * - Create rooms with different configurations
 * - Build rooms with custom settings (private, max players, etc.)
 * - Construct rooms with validation
 * - Simplify room creation throughout the application
 *
 * Example Usage:
 * <pre>
 * Room room = new RoomBuilder()
 *     .withLeader(player)
 *     .withMaxPlayers(4)
 *     .withPrivate(true)
 *     .withConfiguration(gameConfig)
 *     .build();
 * </pre>
 */
public class RoomBuilder {

    // Required parameters
    private Player roomLeader;

    // Optional parameters with default values
    private String roomCode;
    private boolean privateRoom = false;
    private GameConfiguration configuration = GameConfiguration.getDefault();
    private int maxPlayers = 4;

    /**
     * Constructor - no parameters required
     * All fields will be set through builder methods
     */
    public RoomBuilder() {
        // Empty constructor - values set through fluent API
    }

    /**
     * Set the room leader (creator of the room).
     *
     * REQUIRED field - room cannot be created without a leader.
     *
     * @param leader Player who creates and leads the room
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder withLeader(Player leader) {
        this.roomLeader = leader;
        return this;
    }

    /**
     * Set custom room code.
     *
     * If not set, a random 6-character code will be generated.
     *
     * @param roomCode 6-character alphanumeric room code
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder withRoomCode(String roomCode) {
        this.roomCode = roomCode;
        return this;
    }

    /**
     * Set whether room is private (requires code to join).
     *
     * Default: false (public room)
     *
     * @param isPrivate true for private, false for public
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder withPrivate(boolean isPrivate) {
        this.privateRoom = isPrivate;
        return this;
    }

    /**
     * Set maximum number of players allowed.
     *
     * Default: 4 (standard ONE game)
     * Valid range: 2-4 players
     *
     * @param maxPlayers Maximum players (2-4)
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder withMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
        return this;
    }

    /**
     * Set game configuration.
     *
     * Default: GameConfiguration.getDefault()
     *
     * @param configuration Game rules and settings
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder withConfiguration(GameConfiguration configuration) {
        this.configuration = configuration;
        return this;
    }

    /**
     * Build the Room object with validation.
     *
     * Performs validation before creating the Room:
     * - Room leader must be set
     * - Max players must be 2-4
     * - Configuration must be valid
     *
     * @return Constructed Room object
     * @throws IllegalStateException if required fields are missing or invalid
     */
    public Room build() {
        // Validate required fields
        validate();

        // Generate room code if not provided
        if (roomCode == null || roomCode.isEmpty()) {
            roomCode = CodeGenerator.generateRoomCode();
        }

        // Set max players in configuration if different
        if (configuration.getMaxPlayers() != maxPlayers) {
            configuration = GameConfiguration.builder()
                    .maxPlayers(maxPlayers)
                    .initialCardCount(configuration.getInitialCardCount())
                    .turnTimeLimit(configuration.getTurnTimeLimit())
                    .allowStackingCards(configuration.isAllowStackingCards())
                    .pointsToWin(configuration.getPointsToWin())
                    .tournamentMode(configuration.isTournamentMode())
                    .build();
        }

        // Mark leader as room leader
        if (roomLeader != null) {
            roomLeader.setRoomLeader(true);
        }

        // Build Room using Lombok builder
        Room room = Room.builder()
                .roomCode(roomCode)
                .roomLeader(roomLeader)
                .privateRoom(privateRoom)
                .config(configuration)
                .status(RoomStatus.WAITING)
                .build();

        // Add leader to players list
        room.addPlayer(roomLeader);

        return room;
    }

    /**
     * Build with custom room code (convenience method).
     *
     * @param roomCode Custom 6-character room code
     * @return Constructed Room object
     */
    public Room buildWithCode(String roomCode) {
        this.roomCode = roomCode;
        return build();
    }

    /**
     * Validate all required fields and constraints.
     *
     * @throws IllegalStateException if validation fails
     */
    private void validate() {
        if (roomLeader == null) {
            throw new IllegalStateException("Room leader is required");
        }

        if (maxPlayers < 2 || maxPlayers > 4) {
            throw new IllegalStateException("Max players must be between 2 and 4");
        }

        if (configuration == null) {
            throw new IllegalStateException("Game configuration is required");
        }

        // Validate room code format if provided
        if (roomCode != null && !roomCode.isEmpty()) {
            if (roomCode.length() != 6) {
                throw new IllegalStateException("Room code must be exactly 6 characters");
            }
            if (!roomCode.matches("[A-Z0-9]{6}")) {
                throw new IllegalStateException("Room code must be uppercase alphanumeric");
            }
        }

        // Validate configuration
        try {
            configuration.validate();
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid game configuration: " + e.getMessage());
        }
    }

    /**
     * Reset builder to initial state.
     * Allows reusing the same builder instance.
     *
     * @return this RoomBuilder for method chaining
     */
    public RoomBuilder reset() {
        this.roomLeader = null;
        this.roomCode = null;
        this.privateRoom = false;
        this.configuration = GameConfiguration.getDefault();
        this.maxPlayers = 4;
        return this;
    }

    // Static factory methods for common configurations

    /**
     * Create builder for a standard public room (4 players).
     *
     * @param leader Room leader
     * @return Pre-configured RoomBuilder
     */
    public static RoomBuilder standardPublicRoom(Player leader) {
        return new RoomBuilder()
                .withLeader(leader)
                .withPrivate(false)
                .withMaxPlayers(4);
    }

    /**
     * Create builder for a private room.
     *
     * @param leader Room leader
     * @return Pre-configured RoomBuilder
     */
    public static RoomBuilder privateRoom(Player leader) {
        return new RoomBuilder()
                .withLeader(leader)
                .withPrivate(true);
    }

    /**
     * Create builder for a quick 2-player game.
     *
     * @param leader Room leader
     * @return Pre-configured RoomBuilder
     */
    public static RoomBuilder quickTwoPlayerRoom(Player leader) {
        return new RoomBuilder()
                .withLeader(leader)
                .withMaxPlayers(2)
                .withPrivate(false);
    }
}
