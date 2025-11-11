package com.oneonline.backend.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * GameEndResultDto - Contains complete game end results
 *
 * Returned when a game finishes, contains:
 * - Game metadata (room code, duration, etc.)
 * - All players ranked by position
 * - Winner information
 *
 * Used for:
 * - WebSocket notification to all players
 * - UI display of final standings
 * - Game history records
 *
 * @author Juan Gallardo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameEndResultDto {

    /**
     * Room code where game was played
     */
    private String roomCode;

    /**
     * Game session ID
     */
    private String sessionId;

    /**
     * Winner's nickname
     */
    private String winnerNickname;

    /**
     * Winner's user ID (null if bot)
     */
    private Long winnerId;

    /**
     * List of all players ranked by position (1st to 4th)
     */
    private List<PlayerResultDto> playerRankings;

    /**
     * Game duration in minutes
     */
    private Integer durationMinutes;

    /**
     * Game start timestamp
     */
    private LocalDateTime startedAt;

    /**
     * Game end timestamp
     */
    private LocalDateTime endedAt;

    /**
     * Total number of players
     */
    private Integer totalPlayers;

    /**
     * Total cards played during game
     */
    private Integer totalCardsPlayed;
}
