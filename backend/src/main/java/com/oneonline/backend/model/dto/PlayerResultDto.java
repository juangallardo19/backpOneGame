package com.oneonline.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PlayerResultDto - Represents a player's result in a game
 *
 * Contains information about:
 * - Player position/rank
 * - Player details
 * - Remaining cards count
 * - Points earned
 *
 * Used for:
 * - Final game results table
 * - Ranking updates
 * - Statistics display
 *
 * @author Juan Gallardo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerResultDto {

    /**
     * Player's position in the game (1 = winner, 2 = second, etc.)
     */
    private Integer position;

    /**
     * User ID (null for bots without user accounts)
     */
    private Long userId;

    /**
     * Player's nickname/display name
     */
    private String nickname;

    /**
     * Number of cards remaining in player's hand
     * 0 = winner
     */
    private Integer remainingCards;

    /**
     * Total points value of cards in hand
     * Used for scoring system
     */
    private Integer handPoints;

    /**
     * Ranking points earned for this placement
     * - 1st place: 50 points
     * - 2nd place: 10 points
     * - 3rd/4th place: 0 points
     */
    private Integer pointsEarned;

    /**
     * Whether this is the winner
     */
    private Boolean isWinner;

    /**
     * Whether this is a bot player
     */
    private Boolean isBot;
}
