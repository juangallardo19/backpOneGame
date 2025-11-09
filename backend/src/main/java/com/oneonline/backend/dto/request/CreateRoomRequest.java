package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Create Room Request DTO
 *
 * Data Transfer Object for creating a new game room.
 * Contains room configuration and privacy settings.
 *
 * Validation Rules:
 * - isPrivate flag required (default false)
 * - maxPlayers between 2-10
 * - initialHandSize between 5-10
 * - timeLimit minimum 10 seconds (0 = no limit)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoomRequest {

    /**
     * Whether room is private (requires code to join).
     */
    @NotNull(message = "Privacy setting is required")
    private Boolean isPrivate;

    /**
     * Maximum number of players allowed (2-10).
     */
    @Min(value = 2, message = "Minimum 2 players required")
    @Max(value = 10, message = "Maximum 10 players allowed")
    private Integer maxPlayers = 4;

    /**
     * Number of cards each player starts with (5-10).
     */
    @Min(value = 5, message = "Initial hand size minimum 5 cards")
    @Max(value = 10, message = "Initial hand size maximum 10 cards")
    private Integer initialHandSize = 7;

    /**
     * Turn time limit in seconds (0 = no limit).
     */
    @Min(value = 0, message = "Time limit cannot be negative")
    private Integer turnTimeLimit = 60;

    /**
     * Whether to allow bots in the room.
     */
    private Boolean allowBots = true;

    /**
     * Whether to allow stacking +2 and +4 cards.
     */
    private Boolean allowStackingCards = true;

    /**
     * Points needed to win the game.
     */
    private Integer pointsToWin = 500;

    /**
     * Tournament mode flag (stricter rules, no reconnection).
     */
    private Boolean tournamentMode = false;

    /**
     * Custom room name (optional).
     */
    private String roomName;
}
