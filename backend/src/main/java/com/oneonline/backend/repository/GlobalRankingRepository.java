package com.oneonline.backend.repository;

import com.oneonline.backend.model.entity.GlobalRanking;
import com.oneonline.backend.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * GlobalRanking Repository - Database access for GlobalRanking entity
 *
 * Provides CRUD operations and custom queries for player rankings.
 *
 * METHODS:
 * - findByUser(user) - Find ranking for a specific user
 * - findTopRankings(limit) - Get top N players
 * - updateRankPositions() - Recalculate all rank positions
 *
 * Design Pattern: Repository Pattern (Spring Data JPA)
 *
 * @author Juan Gallardo
 */
@Repository
public interface GlobalRankingRepository extends JpaRepository<GlobalRanking, Long> {

    /**
     * Find ranking by User entity
     *
     * Used for:
     * - User profile display
     * - Rank lookup
     *
     * @param user User entity
     * @return Optional<GlobalRanking> if found, empty if not found
     */
    Optional<GlobalRanking> findByUser(User user);

    /**
     * Find ranking by user ID
     *
     * Used for:
     * - Efficient rank lookup without loading full User entity
     *
     * @param userId User ID
     * @return Optional<GlobalRanking> if found, empty if not found
     */
    @Query("SELECT gr FROM GlobalRanking gr WHERE gr.user.id = :userId")
    Optional<GlobalRanking> findByUserId(@Param("userId") Long userId);

    /**
     * Get top N players (leaderboard)
     *
     * Ordered by:
     * 1. Points (DESC)
     * 2. Win rate (DESC)
     * 3. Total wins (DESC)
     *
     * @param pageable Pagination (page size = top N)
     * @return Page of top rankings
     */
    @Query("SELECT gr FROM GlobalRanking gr ORDER BY gr.points DESC, gr.winRate DESC, gr.totalWins DESC")
    Page<GlobalRanking> findTopRankings(Pageable pageable);

    /**
     * Get top 100 players (default leaderboard)
     *
     * Used for:
     * - Main leaderboard page
     *
     * @return List of top 100 players
     */
    @Query(value = "SELECT * FROM global_ranking ORDER BY points DESC, win_rate DESC, total_wins DESC LIMIT 100", nativeQuery = true)
    List<GlobalRanking> findTop100ByOrderByPointsDesc();

    /**
     * Find rankings by rank position range
     *
     * Used for:
     * - Leaderboard pagination
     * - "Players near your rank"
     *
     * @param startRank Starting rank (inclusive)
     * @param endRank Ending rank (inclusive)
     * @return List of rankings in that range
     */
    @Query("SELECT gr FROM GlobalRanking gr WHERE gr.rankPosition >= :startRank AND gr.rankPosition <= :endRank ORDER BY gr.rankPosition ASC")
    List<GlobalRanking> findByRankRange(@Param("startRank") int startRank, @Param("endRank") int endRank);

    /**
     * Get player's rank position
     *
     * Used for:
     * - Quick rank lookup
     *
     * @param userId User ID
     * @return Rank position (1-based)
     */
    @Query("SELECT gr.rankPosition FROM GlobalRanking gr WHERE gr.user.id = :userId")
    Optional<Integer> getRankPositionByUserId(@Param("userId") Long userId);

    /**
     * Count players ranked above a certain points threshold
     *
     * Used for:
     * - Calculating percentile
     *
     * @param points Points threshold
     * @return Number of players above threshold
     */
    @Query("SELECT COUNT(gr) FROM GlobalRanking gr WHERE gr.points > :points")
    long countPlayersAbovePoints(@Param("points") int points);

    /**
     * Recalculate rank positions based on points
     *
     * This should be called after updating player stats.
     * Uses window function to assign ranks.
     *
     * WARNING: This is a bulk update operation
     */
    @Modifying
    @Query(value = """
        UPDATE global_ranking gr
        SET rank_position = subquery.new_rank
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, win_rate DESC, total_wins DESC) as new_rank
            FROM global_ranking
        ) AS subquery
        WHERE gr.id = subquery.id
        """, nativeQuery = true)
    void recalculateAllRankPositions();

    /**
     * Get rankings with active win streaks (3+)
     *
     * Used for:
     * - "Hot Streak" leaderboard
     *
     * @param minStreak Minimum streak length
     * @return List of players with active streaks
     */
    @Query("SELECT gr FROM GlobalRanking gr WHERE gr.currentStreak >= :minStreak ORDER BY gr.currentStreak DESC")
    List<GlobalRanking> findByActiveStreak(@Param("minStreak") int minStreak);

    /**
     * Get rankings by best streak
     *
     * Used for:
     * - "Best Streak" achievements
     *
     * @return List of players ordered by best streak DESC
     */
    @Query("SELECT gr FROM GlobalRanking gr ORDER BY gr.bestStreak DESC")
    List<GlobalRanking> findTopByBestStreak();

    /**
     * Find players who moved up in rank (rank improved)
     *
     * Used for:
     * - "Rising Stars" feature
     *
     * @return List of players who improved rank
     */
    @Query("SELECT gr FROM GlobalRanking gr WHERE gr.previousRank > gr.rankPosition AND gr.previousRank != -1 ORDER BY (gr.previousRank - gr.rankPosition) DESC")
    List<GlobalRanking> findRisingPlayers();

    /**
     * Get total number of ranked players
     *
     * Used for:
     * - Percentile calculations
     *
     * @return Total number of ranked players
     */
    @Query("SELECT COUNT(gr) FROM GlobalRanking gr")
    long countTotalRankedPlayers();
}
