package com.oneonline.backend.service.ranking;

import com.oneonline.backend.model.entity.GameHistory;
import com.oneonline.backend.model.entity.GlobalRanking;
import com.oneonline.backend.model.entity.PlayerStats;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.GameHistoryRepository;
import com.oneonline.backend.repository.GlobalRankingRepository;
import com.oneonline.backend.repository.PlayerStatsRepository;
import com.oneonline.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * RankingService - Global Ranking Management Service
 *
 * Handles global leaderboard operations and ranking calculations.
 *
 * RESPONSIBILITIES:
 * - Get global top 100 leaderboard
 * - Get room-specific top winners
 * - Update global ranking after games
 * - Calculate ranking points
 * - Recalculate all rank positions
 *
 * RANKING ALGORITHM:
 * Primary: Total points (wins, placements, streaks)
 * Tiebreaker 1: Win rate
 * Tiebreaker 2: Total wins
 *
 * POINTS SYSTEM:
 * - 1st place: +50 points
 * - 2nd place: +10 points
 * - 3rd place: 0 points
 * - 4th place: 0 points
 * - Streak bonus: +1 per consecutive win (max +5)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RankingService {

    private final GlobalRankingRepository globalRankingRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final UserRepository userRepository;

    /**
     * Get global top 100 players
     *
     * Returns the top 100 players ordered by:
     * 1. Points (DESC)
     * 2. Win rate (DESC)
     * 3. Total wins (DESC)
     *
     * @return List of top 100 global rankings
     */
    @Transactional(readOnly = true)
    public List<GlobalRanking> getGlobalTop100() {
        log.debug("Fetching global top 100 rankings");
        List<GlobalRanking> top100 = globalRankingRepository.findTop100ByOrderByPointsDesc();
        log.info("Retrieved {} players from global leaderboard", top100.size());
        return top100;
    }

    /**
     * Get top winners for a specific room
     *
     * Returns all winners from games played in the specified room,
     * ordered by number of wins in that room.
     *
     * @param roomCode 6-character room code
     * @return List of users who won games in that room, with win counts
     */
    @Transactional(readOnly = true)
    public Map<User, Integer> getRoomTopWinners(String roomCode) {
        log.debug("Fetching top winners for room: {}", roomCode);

        // Get all games from this room
        List<GameHistory> roomGames = gameHistoryRepository.findByRoomCode(roomCode);

        // Count wins per user
        Map<User, Integer> winCounts = new HashMap<>();
        for (GameHistory game : roomGames) {
            if (game.getWinner() != null) {
                winCounts.merge(game.getWinner(), 1, Integer::sum);
            }
        }

        log.info("Found {} winners in room {}", winCounts.size(), roomCode);
        return winCounts;
    }

    /**
     * Update global ranking for a user after game ends
     *
     * WORKFLOW:
     * 1. Find or create GlobalRanking for user
     * 2. Sync stats from PlayerStats
     * 3. Calculate and add points based on placement
     * 4. Save ranking
     * 5. Optionally recalculate all positions
     *
     * @param userId User ID
     * @param placement Player's placement in game (1 = winner, 2 = second, etc.)
     * @param playerCount Total players in game
     */
    @Transactional
    public void updateGlobalRanking(Long userId, int placement, int playerCount) {
        log.debug("Updating global ranking for user: {} (placement: {}/{})",
                userId, placement, playerCount);

        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Find or create ranking
        GlobalRanking ranking = globalRankingRepository.findByUserId(userId)
                .orElseGet(() -> createNewRanking(user));

        // Sync stats from PlayerStats
        PlayerStats stats = playerStatsRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("PlayerStats not found: " + userId));

        ranking.syncFromPlayerStats(stats);

        // Add points based on placement
        ranking.addPointsForPosition(placement, playerCount);

        // Save ranking
        globalRankingRepository.save(ranking);
        log.info("Updated global ranking for user {} (new points: {}, position: {})",
                userId, ranking.getPoints(), ranking.getRankPosition());

        // Note: Rank positions are recalculated in batch for performance
    }

    /**
     * Calculate ranking points based on wins, losses, and win rate
     *
     * Alternative points calculation (not used in default system)
     *
     * Formula:
     * - Base points: wins * 10
     * - Win rate bonus: winRate * 100
     * - Penalty for losses: losses * -1
     *
     * @param wins Total wins
     * @param losses Total losses
     * @param winRate Win rate (0-100)
     * @return Calculated points
     */
    public int calculatePoints(int wins, int losses, double winRate) {
        int basePoints = wins * 10;
        int winRateBonus = (int) (winRate * 100);
        int lossPenalty = losses * -1;

        int totalPoints = basePoints + winRateBonus + lossPenalty;

        log.debug("Calculated points: {} (wins={}, losses={}, winRate={})",
                totalPoints, wins, losses, winRate);

        return Math.max(0, totalPoints); // Minimum 0 points
    }

    /**
     * Recalculate all rank positions
     *
     * WORKFLOW:
     * 1. Execute native SQL to update all rank positions
     * 2. Rank is calculated using ROW_NUMBER() window function
     * 3. Order by: points DESC, win rate DESC, total wins DESC
     *
     * PERFORMANCE:
     * - Uses database window function for efficiency
     * - Single batch update query
     * - Should be called after multiple game completions
     *
     * WHEN TO CALL:
     * - After batch game updates
     * - Daily maintenance
     * - Manual admin trigger
     */
    @Transactional
    public void recalculateAllRanks() {
        log.info("Recalculating all rank positions...");

        globalRankingRepository.recalculateAllRankPositions();

        long totalPlayers = globalRankingRepository.count();
        log.info("Recalculated rank positions for {} players", totalPlayers);
    }

    /**
     * Get user's rank position
     *
     * @param userId User ID
     * @return Rank position (1-based), or 0 if not ranked
     */
    @Transactional(readOnly = true)
    public int getUserRankPosition(Long userId) {
        return globalRankingRepository.getRankPositionByUserId(userId)
                .orElse(0);
    }

    /**
     * Get user's global ranking
     *
     * @param userId User ID
     * @return GlobalRanking entity, or null if not ranked
     */
    @Transactional(readOnly = true)
    public GlobalRanking getUserRanking(Long userId) {
        return globalRankingRepository.findByUserId(userId)
                .orElse(null);
    }

    /**
     * Get players near user's rank (+/-10 positions)
     *
     * Used for:
     * - Showing context on leaderboard
     * - Competitive motivation
     *
     * @param userId User ID
     * @return List of rankings near user's position
     */
    @Transactional(readOnly = true)
    public List<GlobalRanking> getPlayersNearRank(Long userId) {
        int userRank = getUserRankPosition(userId);

        if (userRank == 0) {
            return List.of();
        }

        int startRank = Math.max(1, userRank - 10);
        int endRank = userRank + 10;

        return globalRankingRepository.findByRankRange(startRank, endRank);
    }

    /**
     * Get rising stars (players who improved rank the most)
     *
     * @return List of players with biggest rank improvements
     */
    @Transactional(readOnly = true)
    public List<GlobalRanking> getRisingStars() {
        return globalRankingRepository.findRisingPlayers();
    }

    /**
     * Get players with active win streaks (3+)
     *
     * @return List of players with hot streaks
     */
    @Transactional(readOnly = true)
    public List<GlobalRanking> getHotStreaks() {
        return globalRankingRepository.findByActiveStreak(3);
    }

    /**
     * Create new ranking entry for user
     *
     * @param user User entity
     * @return New GlobalRanking entity
     */
    private GlobalRanking createNewRanking(User user) {
        log.debug("Creating new ranking entry for user: {}", user.getEmail());

        GlobalRanking ranking = new GlobalRanking();
        ranking.setUser(user);
        ranking.setRankPosition(0); // Will be calculated
        ranking.setPreviousRank(-1); // New entry
        ranking.setTotalWins(0);
        ranking.setWinRate(0.0);
        ranking.setPoints(0);
        ranking.setCurrentStreak(0);
        ranking.setBestStreak(0);
        ranking.setTotalGames(0);

        return ranking;
    }

    /**
     * Calculate user's percentile rank
     *
     * Example: 95th percentile means user is in top 5%
     *
     * @param userId User ID
     * @return Percentile (0-100)
     */
    @Transactional(readOnly = true)
    public double getUserPercentile(Long userId) {
        int userRank = getUserRankPosition(userId);
        long totalPlayers = globalRankingRepository.countTotalRankedPlayers();

        if (totalPlayers == 0 || userRank == 0) {
            return 0.0;
        }

        // Calculate percentile: (1 - rank / total) * 100
        double percentile = (1.0 - (double) userRank / totalPlayers) * 100;

        log.debug("User {} percentile: {:.2f}% (rank {}/{})",
                userId, percentile, userRank, totalPlayers);

        return percentile;
    }

    /**
     * Get top players by best streak
     *
     * @return List of players with highest best streaks
     */
    @Transactional(readOnly = true)
    public List<GlobalRanking> getTopByBestStreak() {
        return globalRankingRepository.findTopByBestStreak();
    }
}
