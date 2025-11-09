package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Room Response DTO
 *
 * Data Transfer Object containing room information.
 * Returned when creating, joining, or fetching room details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomResponse {

    /**
     * Room unique identifier.
     */
    private String roomId;

    /**
     * 6-character room code for joining.
     */
    private String roomCode;

    /**
     * Room name (optional, user-defined).
     */
    private String roomName;

    /**
     * Whether room is private.
     */
    private Boolean isPrivate;

    /**
     * Room status (WAITING, STARTING, IN_PROGRESS, FINISHED).
     */
    private String status;

    /**
     * Room host/creator player ID.
     */
    private String hostId;

    /**
     * List of players in the room.
     */
    private List<PlayerInfo> players;

    /**
     * Maximum number of players allowed.
     */
    private Integer maxPlayers;

    /**
     * Current number of players.
     */
    private Integer currentPlayers;

    /**
     * Game configuration settings.
     */
    private GameConfig config;

    /**
     * Room creation timestamp.
     */
    private Long createdAt;

    /**
     * Player information nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlayerInfo {
        private String playerId;
        private String nickname;
        private String userEmail; // Email of the authenticated user (for identifying current user)
        private Boolean isBot;
        private String status;
        private Boolean isHost;
    }

    /**
     * Game configuration nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class GameConfig {
        private Integer initialHandSize;
        private Integer turnTimeLimit;
        private Boolean allowBots;
        private Integer maxBots;
    }
}
