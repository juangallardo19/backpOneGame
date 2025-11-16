package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * User Profile Response DTO
 *
 * Data Transfer Object containing user profile and statistics.
 * Returned when fetching user profile information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    /**
     * User ID.
     */
    private String userId;

    /**
     * User email.
     */
    private String email;

    /**
     * User nickname/display name.
     */
    private String nickname;

    /**
     * User profile picture URL.
     */
    private String avatarUrl;

    /**
     * Authentication provider (LOCAL, GOOGLE, GITHUB).
     */
    private String authProvider;

    /**
     * User ID (alias for userId for frontend compatibility).
     */
    private String id;

    /**
     * User level/tier.
     */
    private String tier;

    /**
     * Account creation timestamp.
     */
    private Long createdAt;

    /**
     * Last login timestamp.
     */
    private Long lastLoginAt;

    /**
     * User statistics.
     */
    private Statistics stats;

    /**
     * User achievements/badges.
     */
    private List<Achievement> achievements;

    /**
     * Recent game history.
     */
    private List<GameHistory> recentGames;

    /**
     * User preferences/settings.
     */
    private Map<String, Object> preferences;

    /**
     * Statistics nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Statistics {
        private Integer totalGames;
        private Integer wins;
        private Integer losses;
        private Double winRate;
        private Integer totalPoints;
        private Double averagePoints;
        private Integer currentStreak;
        private Integer bestStreak;
        private Integer totalCardsPlayed;
        private Integer totalOnesCalledSuccess;
        private Integer totalOnesCalledFailed;
        private Integer fastestWinSeconds;
        private String favoriteColor;
    }

    /**
     * Achievement nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Achievement {
        private String achievementId;
        private String name;
        private String description;
        private String iconUrl;
        private Long unlockedAt;
        private String rarity;
    }

    /**
     * Game history nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameHistory {
        private String gameId;
        private Long playedAt;
        private Boolean won;
        private Integer score;
        private Integer playerCount;
        private Integer duration;
        private String result;
    }
}
