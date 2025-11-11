package com.oneonline.backend.service.ranking;

import com.oneonline.backend.model.entity.GameHistory;
import com.oneonline.backend.model.entity.PlayerStats;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.GameHistoryRepository;
import com.oneonline.backend.repository.PlayerStatsRepository;
import com.oneonline.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * StatsService - Player Statistics Management Service
 *
 * Handles player statistics updates and retrieval.
 *
 * RESPONSIBILITIES:
 * - Update player stats after game completion
 * - Get player statistics
 * - Calculate win rate
 * - Update win/loss streaks
 * - Get detailed statistics
 * - Track most played cards (if implemented)
 *
 * STATISTICS TRACKED:
 * - Total games played
 * - Total wins/losses
 * - Win rate percentage
 * - Current winning streak
 * - Best winning streak
 * - Total points
 * - Average game duration
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatsService {

    private final PlayerStatsRepository playerStatsRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final UserRepository userRepository;

    /**
     * Update player stats after game completion
     *
     * WORKFLOW:
     * 1. Find or create PlayerStats for user
     * 2. Increment total games
     * 3. Update wins/losses based on result
     * 4. Update streak
     * 5. Add points based on placement
     * 6. Recalculate win rate
     * 7. Update average game duration
     * 8. Save stats
     *
     * @param userId User ID
     * @param won Whether player won the game
     * @param gameDuration Game duration in minutes
     * @param placement Player's placement (1 = winner, 2 = second, etc.)
     */
    @Transactional
    public void updatePlayerStats(Long userId, boolean won, int gameDuration, int placement) {
        log.debug("Updating stats for user: {} (won={}, duration={}min, placement={})",
                userId, won, gameDuration, placement);

        // Find or create stats
        PlayerStats stats = playerStatsRepository.findByUserId(userId)
                .orElseGet(() -> createNewStats(userId));

        // Update game count
        stats.setTotalGames(stats.getTotalGames() + 1);

        // Update wins/losses
        if (won) {
            stats.setTotalWins(stats.getTotalWins() + 1);
        } else {
            stats.setTotalLosses(stats.getTotalLosses() + 1);
        }

        // Update streak
        updateStreak(stats, won);

        // Add points based on placement
        int pointsEarned = calculatePointsForPlacement(placement);
        stats.setTotalPoints(stats.getTotalPoints() + pointsEarned);

        // Recalculate win rate
        double winRate = calculateWinRate(stats.getTotalWins(), stats.getTotalGames());
        stats.setWinRate(winRate);

        // Update average game duration
        if (gameDuration > 0) {
            updateAverageGameDuration(stats, gameDuration);
        }

        // Save stats
        playerStatsRepository.save(stats);
        log.info("Updated stats for user {}: wins={}, losses={}, winRate={:.2f}%, streak={}, points={}",
                userId, stats.getTotalWins(), stats.getTotalLosses(),
                stats.getWinRate(), stats.getCurrentStreak(), stats.getTotalPoints());
    }

    /**
     * Get player statistics by user ID
     *
     * @param userId User ID
     * @return PlayerStats entity, or null if not found
     */
    @Transactional(readOnly = true)
    public PlayerStats getPlayerStats(Long userId) {
        log.debug("Fetching stats for user: {}", userId);
        return playerStatsRepository.findByUserId(userId).orElse(null);
    }

    /**
     * Calculate win rate percentage
     *
     * Formula: (wins / total games) * 100
     *
     * @param wins Total wins
     * @param totalGames Total games played
     * @return Win rate (0-100)
     */
    public double calculateWinRate(int wins, int totalGames) {
        if (totalGames == 0) {
            return 0.0;
        }

        double winRate = ((double) wins / totalGames) * 100;
        return Math.round(winRate * 100.0) / 100.0; // Round to 2 decimals
    }

    /**
     * Update win/loss streak for player
     *
     * WORKFLOW:
     * - If won: Increment current streak, update best streak if needed
     * - If lost: Reset current streak to 0
     *
     * @param stats PlayerStats entity
     * @param won Whether player won
     */
    public void updateStreak(PlayerStats stats, boolean won) {
        if (won) {
            // Increment streak
            int newStreak = stats.getCurrentStreak() + 1;
            stats.setCurrentStreak(newStreak);

            // Update best streak if current is better
            if (newStreak > stats.getBestStreak()) {
                stats.setBestStreak(newStreak);
                log.debug("New best streak for user {}: {}", stats.getUser().getId(), newStreak);
            }
        } else {
            // Reset streak on loss
            stats.setCurrentStreak(0);
        }
    }

    /**
     * Get detailed statistics for user
     *
     * Returns comprehensive stats including:
     * - Basic stats (wins, losses, win rate)
     * - Streaks (current, best)
     * - Points (total, average per game)
     * - Game history (total games, recent games)
     * - Performance metrics
     *
     * @param userId User ID
     * @return Map of detailed statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDetailedStats(Long userId) {
        log.debug("Fetching detailed stats for user: {}", userId);

        PlayerStats stats = getPlayerStats(userId);
        if (stats == null) {
            return new HashMap<>();
        }

        Map<String, Object> detailedStats = new HashMap<>();

        // Basic stats
        detailedStats.put("totalGames", stats.getTotalGames());
        detailedStats.put("totalWins", stats.getTotalWins());
        detailedStats.put("totalLosses", stats.getTotalLosses());
        detailedStats.put("winRate", stats.getWinRate());

        // Streaks
        detailedStats.put("currentStreak", stats.getCurrentStreak());
        detailedStats.put("bestStreak", stats.getBestStreak());

        // Points
        detailedStats.put("totalPoints", stats.getTotalPoints());
        double avgPointsPerGame = stats.getTotalGames() > 0
                ? (double) stats.getTotalPoints() / stats.getTotalGames()
                : 0.0;
        detailedStats.put("averagePointsPerGame", Math.round(avgPointsPerGame * 100.0) / 100.0);

        // Game duration
        detailedStats.put("averageGameDuration", stats.getAvgGameDuration());

        // Performance metrics
        detailedStats.put("winLossRatio", calculateWinLossRatio(stats.getTotalWins(), stats.getTotalLosses()));

        // Recent games count
        List<GameHistory> recentGames = gameHistoryRepository.findByPlayerIdInArray(userId);
        detailedStats.put("totalGamesParticipated", recentGames.size());

        // Games won
        List<GameHistory> gamesWon = gameHistoryRepository.findByWinnerId(userId);
        detailedStats.put("gamesWonCount", gamesWon.size());

        log.info("Retrieved detailed stats for user: {}", userId);
        return detailedStats;
    }

    /**
     * Get most played cards for user (if tracked)
     *
     * Note: This requires tracking card plays in GameHistory or separate table.
     * Currently returns placeholder.
     *
     * @param userId User ID
     * @return Map of card types to play counts
     */
    @Transactional(readOnly = true)
    public Map<String, Integer> getMostPlayedCards(Long userId) {
        log.debug("Fetching most played cards for user: {} (not yet implemented)", userId);

        // TODO: Implement card play tracking
        // This would require:
        // 1. Storing card plays in GameHistory (JSONB field)
        // 2. Aggregating card plays across all games
        // 3. Returning top N cards

        Map<String, Integer> placeholder = new HashMap<>();
        placeholder.put("info", 0);
        placeholder.put("message", 0); // "Card play tracking not yet implemented"

        return placeholder;
    }

    /**
     * Get average game duration for user
     *
     * @param userId User ID
     * @return Average duration in minutes, or 0 if no data
     */
    @Transactional(readOnly = true)
    public double getAverageGameDuration(Long userId) {
        PlayerStats stats = getPlayerStats(userId);
        return stats != null ? stats.getAvgGameDuration() : 0.0;
    }

    /**
     * Get top performers (by win rate with minimum games)
     *
     * @param minGames Minimum games played to qualify
     * @return List of top players
     */
    @Transactional(readOnly = true)
    public List<PlayerStats> getTopPerformers(int minGames) {
        log.debug("Fetching top performers with min {} games", minGames);
        return playerStatsRepository.findTopByWinRate(minGames);
    }

    /**
     * Calculate win/loss ratio
     *
     * @param wins Total wins
     * @param losses Total losses
     * @return Win/loss ratio (e.g., 2.5 means 2.5 wins per loss)
     */
    private double calculateWinLossRatio(int wins, int losses) {
        if (losses == 0) {
            return wins > 0 ? Double.MAX_VALUE : 0.0;
        }
        return Math.round(((double) wins / losses) * 100.0) / 100.0;
    }

    /**
     * Calculate points earned for placement
     *
     * Points system:
     * - 1st place: 50 points
     * - 2nd place: 10 points
     * - 3rd place: 0 points
     * - 4th place: 0 points
     * - 5+ place: 0 points
     *
     * @param placement Player's placement (1-based)
     * @return Points earned
     */
    private int calculatePointsForPlacement(int placement) {
        return switch (placement) {
            case 1 -> 50;
            case 2 -> 10;
            case 3 -> 0;
            case 4 -> 0;
            default -> 0;
        };
    }

    /**
     * Update average game duration
     *
     * Uses running average formula:
     * new_avg = (old_avg * old_count + new_value) / new_count
     *
     * @param stats PlayerStats entity
     * @param newDuration New game duration in minutes
     */
    private void updateAverageGameDuration(PlayerStats stats, int newDuration) {
        double oldAvg = stats.getAvgGameDuration();
        int oldCount = stats.getTotalGames() - 1; // -1 because we already incremented totalGames

        double newAvg;
        if (oldCount == 0) {
            newAvg = newDuration;
        } else {
            newAvg = (oldAvg * oldCount + newDuration) / stats.getTotalGames();
        }

        stats.setAvgGameDuration(Math.round(newAvg * 100.0) / 100.0);
    }

    /**
     * Create new PlayerStats for user
     *
     * @param userId User ID
     * @return New PlayerStats entity
     */
    private PlayerStats createNewStats(Long userId) {
        log.debug("Creating new stats for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        PlayerStats stats = new PlayerStats();
        stats.setUser(user);
        stats.setTotalGames(0);
        stats.setTotalWins(0);
        stats.setTotalLosses(0);
        stats.setWinRate(0.0);
        stats.setCurrentStreak(0);
        stats.setBestStreak(0);
        stats.setTotalPoints(0);
        stats.setAvgGameDuration(0.0);

        return stats;
    }

    /**
     * Reset stats for user (for testing or user request)
     *
     * WARNING: This permanently deletes all statistics
     *
     * @param userId User ID
     */
    @Transactional
    public void resetStats(Long userId) {
        log.warn("Resetting stats for user: {}", userId);

        PlayerStats stats = playerStatsRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Stats not found for user: " + userId));

        stats.setTotalGames(0);
        stats.setTotalWins(0);
        stats.setTotalLosses(0);
        stats.setWinRate(0.0);
        stats.setCurrentStreak(0);
        stats.setBestStreak(0);
        stats.setTotalPoints(0);
        stats.setAvgGameDuration(0.0);

        playerStatsRepository.save(stats);
        log.info("Stats reset for user: {}", userId);
    }
}
