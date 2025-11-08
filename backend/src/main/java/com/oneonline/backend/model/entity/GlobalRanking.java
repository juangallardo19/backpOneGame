package com.oneonline.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * GlobalRanking Entity - Stores player rankings
 *
 * Maintains global leaderboard based on:
 * - Total wins
 * - Win rate
 * - Total points
 * - Current streak
 *
 * TABLE: global_ranking
 *
 * RELATIONSHIPS:
 * - One-to-One with User (bidirectional)
 *
 * RANKING CALCULATION:
 * Rankings are recalculated based on:
 * 1. Total points (primary)
 * 2. Win rate (tiebreaker)
 * 3. Total wins (second tiebreaker)
 *
 * INDEXES:
 * - rank_position (for quick TOP N queries)
 * - points DESC (for sorting)
 * - user_id (unique constraint)
 *
 * Design Pattern: None (JPA Entity)
 *
 * @author Juan Gallardo
 */
@Entity
@Table(name = "global_ranking",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_ranking_user", columnNames = "user_id")
    },
    indexes = {
        @Index(name = "idx_ranking_position", columnList = "rank_position"),
        @Index(name = "idx_ranking_points", columnList = "points DESC")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GlobalRanking {

    /**
     * Primary key - Auto-generated ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to User entity
     * One-to-One relationship (each user has one ranking record)
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Global rank position (1 = best)
     * Updated when rankings are recalculated
     */
    @Column(name = "rank_position", nullable = false)
    private Integer rankPosition = 0;

    /**
     * Previous rank position (for showing up/down arrows)
     * -1 means new entry
     */
    @Column(name = "previous_rank")
    private Integer previousRank = -1;

    /**
     * Total games won
     * Synced from PlayerStats
     */
    @Column(name = "total_wins", nullable = false)
    private Integer totalWins = 0;

    /**
     * Win rate percentage (0-100)
     * Synced from PlayerStats
     */
    @Column(name = "win_rate", nullable = false)
    private Double winRate = 0.0;

    /**
     * Total ranking points
     * Calculated based on:
     * - Win: +10 points
     * - Second place: +5 points
     * - Third place: +2 points
     * - Fourth place: +1 point
     * - Bonus points for win streaks
     */
    @Column(name = "points", nullable = false)
    private Integer points = 0;

    /**
     * Current winning streak
     * Synced from PlayerStats
     */
    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    /**
     * Best winning streak ever
     * Synced from PlayerStats
     */
    @Column(name = "best_streak", nullable = false)
    private Integer bestStreak = 0;

    /**
     * Total games played
     * Synced from PlayerStats
     */
    @Column(name = "total_games", nullable = false)
    private Integer totalGames = 0;

    /**
     * Last ranking update timestamp
     */
    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    /**
     * Update timestamp before save
     */
    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    /**
     * Update rank position and track change
     */
    public void updateRank(int newRank) {
        this.previousRank = this.rankPosition;
        this.rankPosition = newRank;
    }

    /**
     * Add points for game performance
     *
     * Points system:
     * - 1st place: +10 points
     * - 2nd place: +5 points
     * - 3rd place: +2 points
     * - 4th place: +1 point
     * - Streak bonus: +1 per consecutive win (max +5)
     */
    public void addPointsForPosition(int position, int playerCount) {
        int basePoints = switch (position) {
            case 1 -> 10;
            case 2 -> 5;
            case 3 -> 2;
            case 4 -> 1;
            default -> 0;
        };

        // Streak bonus (max +5)
        int streakBonus = Math.min(this.currentStreak, 5);

        this.points += basePoints + streakBonus;
    }

    /**
     * Sync stats from PlayerStats entity
     */
    public void syncFromPlayerStats(PlayerStats stats) {
        this.totalWins = stats.getTotalWins();
        this.totalGames = stats.getTotalGames();
        this.winRate = stats.getWinRate();
        this.currentStreak = stats.getCurrentStreak();
        this.bestStreak = stats.getBestStreak();
        this.points = stats.getTotalPoints();
    }
}
