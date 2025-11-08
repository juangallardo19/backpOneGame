package com.oneonline.backend.repository;

import com.oneonline.backend.model.entity.GameHistory;
import com.oneonline.backend.model.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * GameHistory Repository - Database access for GameHistory entity
 *
 * Provides CRUD operations and custom queries for game history.
 *
 * METHODS:
 * - findByRoomCode(roomCode) - Find games by room code
 * - findByWinner(user) - Find all games won by a user
 * - findRecentGames(limit) - Get most recent games
 * - findPlayerGameHistory(userId) - Get all games a player participated in
 *
 * Design Pattern: Repository Pattern (Spring Data JPA)
 *
 * @author Juan Gallardo
 */
@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, Long> {

    /**
     * Find all games by room code
     *
     * Used for:
     * - Room history
     * - Statistics for a specific room
     *
     * @param roomCode 6-character room code
     * @return List of game history records
     */
    List<GameHistory> findByRoomCode(String roomCode);

    /**
     * Find all games won by a specific user
     *
     * Used for:
     * - User game history
     * - Win statistics
     *
     * @param winner User entity
     * @return List of games won by that user
     */
    List<GameHistory> findByWinner(User winner);

    /**
     * Find all games won by user ID (non-paginated)
     *
     * Used for:
     * - Loading all wins for a user
     * - Statistics calculations
     *
     * @param winnerId User ID
     * @return List of games won by that user
     */
    @Query("SELECT gh FROM GameHistory gh WHERE gh.winner.id = :winnerId ORDER BY gh.endedAt DESC")
    List<GameHistory> findByWinnerId(@Param("winnerId") Long winnerId);

    /**
     * Find all games won by user ID with pagination
     *
     * Used for:
     * - User profile page
     * - Win history
     *
     * @param winnerId User ID
     * @param pageable Pagination parameters
     * @return Page of game history
     */
    @Query("SELECT gh FROM GameHistory gh WHERE gh.winner.id = :winnerId ORDER BY gh.endedAt DESC")
    Page<GameHistory> findByWinnerIdPaginated(@Param("winnerId") Long winnerId, Pageable pageable);

    /**
     * Find games where a specific player participated
     *
     * Uses PostgreSQL array contains operator
     *
     * @param playerId Player user ID
     * @return List of games where player participated
     */
    @Query(value = "SELECT * FROM game_history WHERE :playerId = ANY(player_ids) ORDER BY ended_at DESC",
           nativeQuery = true)
    List<GameHistory> findByPlayerIdInArray(@Param("playerId") Long playerId);

    /**
     * Find recent games (last N games)
     *
     * Used for:
     * - Homepage "Recent Games"
     * - Activity feed
     *
     * @param pageable Pagination (page size = limit)
     * @return Page of recent games
     */
    @Query("SELECT gh FROM GameHistory gh ORDER BY gh.endedAt DESC")
    Page<GameHistory> findRecentGames(Pageable pageable);

    /**
     * Find games between date range
     *
     * Used for:
     * - Analytics
     * - Daily/weekly/monthly statistics
     *
     * @param startDate Start date
     * @param endDate End date
     * @return List of games in that period
     */
    @Query("SELECT gh FROM GameHistory gh WHERE gh.startedAt >= :startDate AND gh.endedAt <= :endDate ORDER BY gh.startedAt DESC")
    List<GameHistory> findGamesBetweenDates(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    /**
     * Count total games played
     *
     * Used for:
     * - Analytics dashboard
     *
     * @return Total number of games
     */
    @Query("SELECT COUNT(gh) FROM GameHistory gh")
    long countTotalGames();

    /**
     * Get average game duration
     *
     * Used for:
     * - Analytics
     * - Expected game time estimation
     *
     * @return Average duration in minutes
     */
    @Query("SELECT AVG(gh.durationMinutes) FROM GameHistory gh")
    Double getAverageGameDuration();

    /**
     * Get most active room codes
     *
     * Used for:
     * - Popular rooms statistics
     *
     * @param limit Number of top rooms
     * @return List of room codes ordered by game count
     */
    @Query("SELECT gh.roomCode, COUNT(gh) as gameCount FROM GameHistory gh GROUP BY gh.roomCode ORDER BY gameCount DESC")
    List<Object[]> findMostActiveRooms(@Param("limit") int limit);

    /**
     * Find games by player count
     *
     * Used for:
     * - Analytics by game size (2v2, 3-player, 4-player)
     *
     * @param playerCount Number of players
     * @return List of games with that player count
     */
    @Query("SELECT gh FROM GameHistory gh WHERE gh.playerCount = :playerCount ORDER BY gh.endedAt DESC")
    List<GameHistory> findByPlayerCount(@Param("playerCount") int playerCount);
}
