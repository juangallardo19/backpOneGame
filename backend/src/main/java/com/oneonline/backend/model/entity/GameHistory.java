package com.oneonline.backend.model.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * GameHistory Entity - Stores completed game records
 *
 * Records every completed game with:
 * - Room code
 * - Winner
 * - All players (IDs)
 * - Final scores
 * - Game duration
 * - Timestamps
 *
 * TABLE: game_history
 *
 * RELATIONSHIPS:
 * - Many-to-One with User (winner)
 *
 * ARRAY STORAGE:
 * - playerIds: PostgreSQL array type
 * - finalScores: JSON type (maps playerId -> score)
 *
 * USAGE:
 * - Game statistics calculation
 * - Ranking updates
 * - Player history
 * - Replay functionality (future feature)
 *
 * Design Pattern: None (JPA Entity)
 *
 * @author Juan Gallardo
 */
@Entity
@Table(name = "game_history", indexes = {
    @Index(name = "idx_game_history_room_code", columnList = "room_code"),
    @Index(name = "idx_game_history_winner_id", columnList = "winner_id"),
    @Index(name = "idx_game_history_started_at", columnList = "started_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameHistory {

    /**
     * Primary key - Auto-generated ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Room code where game was played
     * 6-character alphanumeric code
     */
    @Column(name = "room_code", nullable = false, length = 6)
    private String roomCode;

    /**
     * Winner of the game (first player to reach 0 cards)
     * Foreign key to User entity
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id", nullable = false)
    private User winner;

    /**
     * Array of player user IDs
     * Stores all players who participated
     * PostgreSQL array type
     */
    @Column(name = "player_ids", columnDefinition = "bigint[]")
    private Long[] playerIds;

    /**
     * Final scores for each player
     * Stored as JSON: { "playerId": score }
     *
     * Example:
     * {
     *   "1": 25,    // Player 1 had 25 points in hand
     *   "2": 0,     // Player 2 won (0 cards)
     *   "3": 42,    // Player 3 had 42 points in hand
     *   "4": 18     // Player 4 had 18 points in hand
     * }
     */
    @Type(JsonType.class)
    @Column(name = "final_scores", columnDefinition = "jsonb")
    private Map<String, Integer> finalScores;

    /**
     * Game duration in minutes
     * Calculated as: endedAt - startedAt
     */
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    /**
     * Number of players in the game
     * Cached for quick queries
     */
    @Column(name = "player_count", nullable = false)
    private Integer playerCount;

    /**
     * Total cards played during the game
     * Useful for analytics
     */
    @Column(name = "total_cards_played")
    private Integer totalCardsPlayed;

    /**
     * Game started timestamp
     */
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    /**
     * Game ended timestamp
     */
    @Column(name = "ended_at", nullable = false)
    private LocalDateTime endedAt;

    /**
     * Game creation timestamp
     * Set automatically on insert
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Set created_at timestamp before insert
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();

        // Calculate duration if not set
        if (this.durationMinutes == null && this.startedAt != null && this.endedAt != null) {
            long minutes = java.time.Duration.between(this.startedAt, this.endedAt).toMinutes();
            this.durationMinutes = (int) minutes;
        }

        // Set player count from array
        if (this.playerIds != null) {
            this.playerCount = this.playerIds.length;
        }
    }
}
