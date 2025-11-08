package com.oneonline.backend.controller;

import com.oneonline.backend.dto.response.RankingResponse;
import com.oneonline.backend.model.entity.GlobalRanking;
import com.oneonline.backend.model.entity.PlayerStats;
import com.oneonline.backend.repository.GlobalRankingRepository;
import com.oneonline.backend.repository.PlayerStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * RankingController - REST API for rankings and statistics
 *
 * Handles global rankings, player stats, and leaderboards.
 *
 * ENDPOINTS:
 * - GET /api/ranking/global - Top 100 global players
 * - GET /api/ranking/global/top/{limit} - Top N players
 * - GET /api/ranking/player/{userId} - Player statistics
 * - GET /api/ranking/streak - Players with active streaks
 * - GET /api/ranking/rising - Rising players (rank improved)
 *
 * SECURITY:
 * - Most endpoints are public (read-only)
 * - Player-specific endpoints require authentication
 *
 * @author Juan Gallardo
 */
@RestController
@RequestMapping("/api/ranking")
@RequiredArgsConstructor
@Validated
@Slf4j
public class RankingController {

    private final GlobalRankingRepository rankingRepository;
    private final PlayerStatsRepository statsRepository;

    /**
     * Get top 100 global players
     *
     * GET /api/ranking/global
     *
     * Returns leaderboard sorted by:
     * 1. Points (DESC)
     * 2. Win rate (DESC)
     * 3. Total wins (DESC)
     *
     * Response:
     * [
     *   {
     *     "rank": 1,
     *     "userId": 123,
     *     "nickname": "ProPlayer",
     *     "points": 5000,
     *     "totalWins": 250,
     *     "winRate": 75.5,
     *     "currentStreak": 10,
     *     "rankChange": 2  // +2 positions up
     *   },
     *   ...
     * ]
     *
     * @return List of top 100 players
     */
    @GetMapping("/global")
    public ResponseEntity<List<RankingResponse>> getGlobalRanking() {
        log.debug("Fetching global top 100 ranking");

        Pageable pageable = PageRequest.of(0, 100);
        Page<GlobalRanking> rankings = rankingRepository.findTopRankings(pageable);

        List<RankingResponse> response = rankings.stream()
                .map(this::mapToRankingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get top N players
     *
     * GET /api/ranking/global/top/{limit}
     *
     * Example: /api/ranking/global/top/10 for top 10
     *
     * @param limit Number of top players (max 500)
     * @return List of top N players
     */
    @GetMapping("/global/top/{limit}")
    public ResponseEntity<List<RankingResponse>> getTopNPlayers(
            @PathVariable int limit) {

        log.debug("Fetching top {} players", limit);

        // Limit to max 500 for performance
        int actualLimit = Math.min(limit, 500);

        Pageable pageable = PageRequest.of(0, actualLimit);
        Page<GlobalRanking> rankings = rankingRepository.findTopRankings(pageable);

        List<RankingResponse> response = rankings.stream()
                .map(this::mapToRankingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get player statistics
     *
     * GET /api/ranking/player/{userId}
     *
     * Response:
     * {
     *   "rank": 42,
     *   "userId": 123,
     *   "nickname": "Player1",
     *   "totalGames": 100,
     *   "totalWins": 65,
     *   "totalLosses": 35,
     *   "winRate": 65.0,
     *   "currentStreak": 5,
     *   "bestStreak": 15,
     *   "points": 1500
     * }
     *
     * @param userId User ID
     * @return Player statistics
     */
    @GetMapping("/player/{userId}")
    public ResponseEntity<RankingResponse> getPlayerStats(@PathVariable Long userId) {
        log.debug("Fetching stats for user: {}", userId);

        // Get player stats
        PlayerStats stats = statsRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Player stats not found"));

        // Get ranking
        GlobalRanking ranking = rankingRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Player ranking not found"));

        RankingResponse.RankEntry rankEntry = RankingResponse.RankEntry.builder()
                .rank(ranking.getRankPosition())
                .playerId(userId.toString())
                .nickname(ranking.getUser().getNickname())
                .totalPoints(ranking.getPoints())
                .gamesPlayed(stats.getTotalGames())
                .wins(stats.getTotalWins())
                .losses(stats.getTotalLosses())
                .winRate(stats.getWinRate())
                .winStreak(stats.getCurrentStreak())
                .bestStreak(stats.getBestStreak())
                .rankChange(ranking.getRankPosition() - ranking.getPreviousRank())
                .build();

        RankingResponse response = RankingResponse.builder()
                .rankingType("GLOBAL")
                .currentUserRank(rankEntry)
                .generatedAt(System.currentTimeMillis())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Get players with active winning streaks
     *
     * GET /api/ranking/streak?minStreak=3
     *
     * Returns players with active streaks of 3+ consecutive wins.
     *
     * @param minStreak Minimum streak length (default: 3)
     * @return List of players with streaks
     */
    @GetMapping("/streak")
    public ResponseEntity<List<RankingResponse>> getPlayersWithStreaks(
            @RequestParam(defaultValue = "3") int minStreak) {

        log.debug("Fetching players with streak >= {}", minStreak);

        List<GlobalRanking> rankings = rankingRepository.findByActiveStreak(minStreak);

        List<RankingResponse> response = rankings.stream()
                .map(this::mapToRankingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get rising players (rank improved)
     *
     * GET /api/ranking/rising
     *
     * Returns players who moved up in ranking recently.
     * Sorted by rank improvement (DESC).
     *
     * @return List of rising players
     */
    @GetMapping("/rising")
    public ResponseEntity<List<RankingResponse>> getRisingPlayers() {
        log.debug("Fetching rising players");

        List<GlobalRanking> rankings = rankingRepository.findRisingPlayers();

        List<RankingResponse> response = rankings.stream()
                .limit(50) // Top 50 rising players
                .map(this::mapToRankingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get rankings by rank range
     *
     * GET /api/ranking/range?start=10&end=20
     *
     * Returns players in rank positions 10-20.
     *
     * @param start Start rank (inclusive)
     * @param end End rank (inclusive)
     * @return List of players in range
     */
    @GetMapping("/range")
    public ResponseEntity<List<RankingResponse>> getRankingByRange(
            @RequestParam int start,
            @RequestParam int end) {

        log.debug("Fetching rankings from {} to {}", start, end);

        // Validate range
        if (start < 1 || end < start || (end - start) > 100) {
            throw new IllegalArgumentException("Invalid range (max 100 positions)");
        }

        List<GlobalRanking> rankings = rankingRepository.findByRankRange(start, end);

        List<RankingResponse> response = rankings.stream()
                .map(this::mapToRankingResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Get overall statistics
     *
     * GET /api/ranking/stats
     *
     * Response:
     * {
     *   "totalPlayers": 1000,
     *   "totalGames": 50000,
     *   "averageWinRate": 45.2
     * }
     *
     * @return Overall statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getOverallStats() {
        log.debug("Fetching overall statistics");

        long totalPlayers = rankingRepository.countTotalRankedPlayers();
        Long totalGames = statsRepository.getTotalGamesPlayed();
        Double avgWinRate = statsRepository.getAverageWinRate();

        return ResponseEntity.ok(java.util.Map.of(
                "totalPlayers", totalPlayers,
                "totalGames", totalGames != null ? totalGames : 0,
                "averageWinRate", avgWinRate != null ? avgWinRate : 0.0
        ));
    }

    /**
     * Recalculate all rankings
     *
     * POST /api/ranking/recalculate
     *
     * Admin endpoint to trigger ranking recalculation.
     * Should be called periodically or after major updates.
     *
     * @return Success message
     */
    @PostMapping("/recalculate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> recalculateRankings() {
        log.info("Recalculating all rankings");

        rankingRepository.recalculateAllRankPositions();

        log.info("Rankings recalculated successfully");

        return ResponseEntity.ok("Rankings recalculated");
    }

    /**
     * Map GlobalRanking entity to RankingResponse DTO
     *
     * @param ranking GlobalRanking entity
     * @return RankingResponse DTO
     */
    private RankingResponse mapToRankingResponse(GlobalRanking ranking) {
        RankingResponse.RankEntry rankEntry = RankingResponse.RankEntry.builder()
                .rank(ranking.getRankPosition())
                .playerId(ranking.getUser().getId().toString())
                .nickname(ranking.getUser().getNickname())
                .totalPoints(ranking.getPoints())
                .wins(ranking.getTotalWins())
                .gamesPlayed(ranking.getTotalGames())
                .winRate(ranking.getWinRate())
                .winStreak(ranking.getCurrentStreak())
                .bestStreak(ranking.getBestStreak())
                .rankChange(ranking.getRankPosition() - ranking.getPreviousRank())
                .build();

        return RankingResponse.builder()
                .rankingType("GLOBAL")
                .currentUserRank(rankEntry)
                .generatedAt(System.currentTimeMillis())
                .build();
    }
}
