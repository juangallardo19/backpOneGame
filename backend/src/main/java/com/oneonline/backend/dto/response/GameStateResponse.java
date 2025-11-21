package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Game State Response DTO
 *
 * Data Transfer Object containing complete game state information.
 * Sent to clients to synchronize game state, especially after reconnection.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameStateResponse {

    /**
     * Game session ID.
     */
    private String sessionId;

    /**
     * Room code.
     */
    private String roomCode;

    /**
     * Game status (LOBBY, DEALING_CARDS, PLAYING, PAUSED, GAME_OVER).
     */
    private String status;

    /**
     * Current player's turn ID.
     */
    private String currentPlayerId;

    /**
     * Top card on discard pile.
     */
    private CardInfo topCard;

    /**
     * Current active color (for wild cards).
     */
    private String currentColor;

    /**
     * Play direction (true = clockwise, false = counter-clockwise).
     */
    private Boolean clockwise;

    /**
     * Number of cards remaining in deck.
     */
    private Integer deckSize;

    /**
     * Number of cards pending to draw (Draw Two/Four effect).
     */
    private Integer pendingDrawCount;

    /**
     * All players in game with their info.
     */
    private List<PlayerState> players;

    /**
     * Player's own hand (only sent to that player).
     */
    private List<CardInfo> hand;

    /**
     * Turn order (player IDs in sequence).
     */
    private List<String> turnOrder;

    /**
     * Game start timestamp.
     */
    private Long startedAt;

    /**
     * Current turn start timestamp.
     */
    private Long turnStartedAt;

    /**
     * Turn time limit in seconds.
     */
    private Integer turnTimeLimit;

    /**
     * Winner player ID (if game over).
     */
    private String winnerId;

    /**
     * Final scores (if game over).
     */
    private Map<String, Integer> finalScores;

    /**
     * IDs of cards that the current player can play.
     * This list is calculated server-side to ensure consistency.
     */
    private List<String> playableCardIds;

    /**
     * Number of stacked draw cards (+2/+4).
     * Used for stacking logic where players can stack draw cards.
     */
    private Integer stackingCount;

    /**
     * Card information nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CardInfo {
        private String cardId;
        private String type;
        private String color;
        private Integer value;
    }

    /**
     * Player state nested DTO.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlayerState {
        private String playerId;
        private String nickname;
        private Boolean isBot;
        private Integer cardCount;
        private Boolean calledOne;
        private String status;
        private Integer score;
    }
}
