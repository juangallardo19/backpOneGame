package com.oneonline.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * PlayerStats Entity - Stores player game statistics
 *
 * Tracks performance metrics for each user:
 * - Total games played
 * - Wins and losses
 * - Win rate percentage
 * - Current and best streaks
 * - Average game duration
 *
 * TABLE: player_stats
 *
 * RELATIONSHIPS:
 * - One-to-One with User (bidirectional)
 *
 * AUTO-CALCULATED FIELDS:
 * - winRate = (totalWins / totalGames) * 100
 * - Updated automatically on @PreUpdate
 *
 * Design Pattern: None (JPA Entity)
 *
 * @author Juan Gallardo
 */
@Entity
@Table(name = "player_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStats {

    /**
     * Primary key - Auto-generated ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to User entity
     * One-to-One relationship (each user has one stats record)
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * Total number of games played
     * Incremented after each game completion
     */
    @Column(name = "total_games", nullable = false)
    private Integer totalGames = 0;

    /**
     * Total number of games won
     * Incremented when user finishes first
     */
    @Column(name = "total_wins", nullable = false)
    private Integer totalWins = 0;

    /**
     * Total number of games lost
     * Incremented when user doesn't finish first
     */
    @Column(name = "total_losses", nullable = false)
    private Integer totalLosses = 0;

    /**
     * Win rate percentage (0-100)
     * Calculated as: (totalWins / totalGames) * 100
     * Updated automatically on @PreUpdate
     */
    @Column(name = "win_rate", nullable = false)
    private Double winRate = 0.0;

    /**
     * Current winning streak
     * Incremented on win, reset to 0 on loss
     */
    @Column(name = "current_streak", nullable = false)
    private Integer currentStreak = 0;

    /**
     * Best winning streak ever achieved
     * Updated when currentStreak exceeds bestStreak
     */
    @Column(name = "best_streak", nullable = false)
    private Integer bestStreak = 0;

    /**
     * Average game duration in minutes
     * Useful for analytics and rankings
     */
    @Column(name = "avg_game_duration")
    private Double avgGameDuration = 0.0;

    /**
     * Total points earned (for ranking)
     * Points awarded based on win position and opponents
     */
    @Column(name = "total_points", nullable = false)
    private Integer totalPoints = 0;

    /**
     * Last statistics update timestamp
     * Updated automatically on every modification
     */
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Calculate win rate before update
     * Formula: (totalWins / totalGames) * 100
     */
    @PreUpdate
    @PrePersist
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();

        // Calculate win rate
        if (this.totalGames > 0) {
            this.winRate = ((double) this.totalWins / this.totalGames) * 100.0;
        } else {
            this.winRate = 0.0;
        }

        // Ensure losses = games - wins
        this.totalLosses = this.totalGames - this.totalWins;
    }

    /**
     * Record a game win
     * Increments wins, games, current streak
     * Updates best streak if needed
     */
    public void recordWin() {
        this.totalWins++;
        this.totalGames++;
        this.currentStreak++;

        // Update best streak
        if (this.currentStreak > this.bestStreak) {
            this.bestStreak = this.currentStreak;
        }
    }

    /**
     * Record a game loss
     * Increments losses, games
     * Resets current streak to 0
     */
    public void recordLoss() {
        this.totalLosses++;
        this.totalGames++;
        this.currentStreak = 0;
    }

    /**
     * Add points to total (for ranking system)
     */
    public void addPoints(int points) {
        this.totalPoints += points;
    }
}
