package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Ranking Response DTO
 *
 * Data Transfer Object containing ranking/leaderboard information.
 * Returned when fetching global or filtered rankings.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingResponse {

    /**
     * Ranking type (GLOBAL, WEEKLY, MONTHLY, FRIENDS).
     */
    private String rankingType;

    /**
     * Total number of ranked players.
     */
    private Integer totalPlayers;

    /**
     * List of ranked players.
     */
    private List<RankEntry> rankings;

    /**
     * Current user's rank entry (if applicable).
     */
    private RankEntry currentUserRank;

    /**
     * Timestamp when ranking was generated.
     */
    private Long generatedAt;

    /**
     * Ranking period start (for weekly/monthly).
     */
    private Long periodStart;

    /**
     * Ranking period end (for weekly/monthly).
     */
    private Long periodEnd;

    /**
     * Rank entry nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RankEntry {
        /**
         * Rank position (1 = first place).
         */
        private Integer rank;

        /**
         * Player ID.
         */
        private String playerId;

        /**
         * Player nickname.
         */
        private String nickname;

        /**
         * Total wins.
         */
        private Integer wins;

        /**
         * Total losses.
         */
        private Integer losses;

        /**
         * Total games played.
         */
        private Integer gamesPlayed;

        /**
         * Win rate percentage.
         */
        private Double winRate;

        /**
         * Total points/score.
         */
        private Integer totalPoints;

        /**
         * Average points per game.
         */
        private Double averagePoints;

        /**
         * Current win streak.
         */
        private Integer winStreak;

        /**
         * Best win streak ever.
         */
        private Integer bestStreak;

        /**
         * Rank change from previous period (+/- positions).
         */
        private Integer rankChange;

        /**
         * Player level/tier.
         */
        private String tier;
    }
}
