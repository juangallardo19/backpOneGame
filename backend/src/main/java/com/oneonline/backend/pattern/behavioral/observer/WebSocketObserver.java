package com.oneonline.backend.pattern.behavioral.observer;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.model.enums.CardColor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * OBSERVER PATTERN - Concrete Observer Implementation
 *
 * Purpose:
 * Sends real-time game events to WebSocket clients.
 * Implements GameObserver to receive notifications and broadcasts
 * them to connected players via WebSocket.
 *
 * Pattern Benefits:
 * - Decouples game logic from WebSocket communication
 * - Real-time updates to all connected clients
 * - Easy to test game logic without WebSocket dependency
 * - Can add multiple observers (logging, analytics) without changes
 *
 * WebSocket Topics:
 * - /topic/room/{roomId} - Room-level events
 * - /topic/game/{sessionId} - Game-level events
 * - /user/queue/notification - Personal notifications
 *
 * Use Cases:
 * - Real-time game updates to players
 * - Spectator mode updates
 * - Live tournament broadcasts
 * - Player reconnection synchronization
 */
@Component
public class WebSocketObserver implements GameObserver {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Player joined room - notify all room members.
     */
    @Override
    public void onPlayerJoined(Player player, Room room) {
        Map<String, Object> event = createEvent("PLAYER_JOINED", Map.of(
                "playerId", player.getPlayerId(),
                "nickname", player.getNickname(),
                "roomId", room.getRoomId(),
                "playerCount", room.getPlayers().size()
        ));
        sendToRoom(room.getRoomId(), event);
    }

    /**
     * Player left room - notify remaining members.
     */
    @Override
    public void onPlayerLeft(Player player, Room room) {
        Map<String, Object> event = createEvent("PLAYER_LEFT", Map.of(
                "playerId", player.getPlayerId(),
                "nickname", player.getNickname(),
                "roomId", room.getRoomId(),
                "playerCount", room.getPlayers().size()
        ));
        sendToRoom(room.getRoomId(), event);
    }

    /**
     * Card played - notify all players in game.
     */
    @Override
    public void onCardPlayed(Player player, Card card, GameSession session) {
        Map<String, Object> event = createEvent("CARD_PLAYED", Map.of(
                "playerId", player.getPlayerId(),
                "cardId", card.getCardId(),
                "cardType", card.getType().name(),
                "cardColor", card.getColor().name(),
                "cardValue", card.getValue(),
                "remainingCards", player.getHand().size()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Card drawn - notify all players.
     */
    @Override
    public void onCardDrawn(Player player, int cardCount, GameSession session) {
        Map<String, Object> event = createEvent("CARD_DRAWN", Map.of(
                "playerId", player.getPlayerId(),
                "cardCount", cardCount,
                "totalCards", player.getHand().size()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * ONE called - notify all players.
     */
    @Override
    public void onOneCalled(Player player, GameSession session) {
        Map<String, Object> event = createEvent("ONE_CALLED", Map.of(
                "playerId", player.getPlayerId(),
                "nickname", player.getNickname()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * ONE penalty - notify all players.
     */
    @Override
    public void onOnePenalty(Player player, int penaltyCards, GameSession session) {
        Map<String, Object> event = createEvent("ONE_PENALTY", Map.of(
                "playerId", player.getPlayerId(),
                "penaltyCards", penaltyCards,
                "totalCards", player.getHand().size()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Game ended - notify all players with final results.
     */
    @Override
    public void onGameEnded(Player winner, GameSession session) {
        Map<String, Object> event = createEvent("GAME_ENDED", Map.of(
                "winnerId", winner.getPlayerId(),
                "winnerNickname", winner.getNickname(),
                "finalScores", calculateScores(session)
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Game started - notify all players.
     */
    @Override
    public void onGameStarted(GameSession session) {
        Map<String, Object> event = createEvent("GAME_STARTED", Map.of(
                "sessionId", session.getSessionId(),
                "startingPlayer", session.getCurrentPlayer().getPlayerId(),
                "direction", session.isClockwise() ? "CLOCKWISE" : "COUNTER_CLOCKWISE"
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Turn changed - notify all players.
     */
    @Override
    public void onTurnChanged(Player currentPlayer, GameSession session) {
        Map<String, Object> event = createEvent("TURN_CHANGED", Map.of(
                "currentPlayerId", currentPlayer.getPlayerId(),
                "nickname", currentPlayer.getNickname()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Direction reversed - notify all players.
     */
    @Override
    public void onDirectionReversed(boolean clockwise, GameSession session) {
        Map<String, Object> event = createEvent("DIRECTION_REVERSED", Map.of(
                "direction", clockwise ? "CLOCKWISE" : "COUNTER_CLOCKWISE"
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Player skipped - notify all players.
     */
    @Override
    public void onPlayerSkipped(Player skippedPlayer, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_SKIPPED", Map.of(
                "playerId", skippedPlayer.getPlayerId(),
                "nickname", skippedPlayer.getNickname()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Color changed - notify all players.
     */
    @Override
    public void onColorChanged(Player player, CardColor newColor, GameSession session) {
        Map<String, Object> event = createEvent("COLOR_CHANGED", Map.of(
                "playerId", player.getPlayerId(),
                "newColor", newColor.name()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Player disconnected - notify all players.
     */
    @Override
    public void onPlayerDisconnected(Player player, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_DISCONNECTED", Map.of(
                "playerId", player.getPlayerId(),
                "nickname", player.getNickname()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Player reconnected - notify all players.
     */
    @Override
    public void onPlayerReconnected(Player player, GameSession session) {
        Map<String, Object> event = createEvent("PLAYER_RECONNECTED", Map.of(
                "playerId", player.getPlayerId(),
                "nickname", player.getNickname()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Room created - notify lobby.
     */
    @Override
    public void onRoomCreated(Room room) {
        Map<String, Object> event = createEvent("ROOM_CREATED", Map.of(
                "roomId", room.getRoomId(),
                "roomCode", room.getRoomCode(),
                "isPrivate", room.isPrivate()
        ));
        sendToLobby(event);
    }

    /**
     * Room deleted - notify lobby.
     */
    @Override
    public void onRoomDeleted(Room room) {
        Map<String, Object> event = createEvent("ROOM_DELETED", Map.of(
                "roomId", room.getRoomId()
        ));
        sendToLobby(event);
    }

    /**
     * Game paused - notify all players.
     */
    @Override
    public void onGamePaused(GameSession session) {
        Map<String, Object> event = createEvent("GAME_PAUSED", Map.of(
                "sessionId", session.getSessionId()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Game resumed - notify all players.
     */
    @Override
    public void onGameResumed(GameSession session) {
        Map<String, Object> event = createEvent("GAME_RESUMED", Map.of(
                "sessionId", session.getSessionId()
        ));
        sendToGame(session.getSessionId(), event);
    }

    /**
     * Create standardized event structure.
     *
     * @param eventType Type of event
     * @param data Event data
     * @return Event map
     */
    private Map<String, Object> createEvent(String eventType, Map<String, Object> data) {
        Map<String, Object> event = new HashMap<>();
        event.put("eventType", eventType);
        event.put("timestamp", Instant.now().toEpochMilli());
        event.put("data", data);
        return event;
    }

    /**
     * Send event to room topic.
     *
     * @param roomId Room ID
     * @param event Event data
     */
    private void sendToRoom(String roomId, Map<String, Object> event) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId, event);
    }

    /**
     * Send event to game topic.
     *
     * @param sessionId Session ID
     * @param event Event data
     */
    private void sendToGame(String sessionId, Map<String, Object> event) {
        messagingTemplate.convertAndSend("/topic/game/" + sessionId, event);
    }

    /**
     * Send event to lobby topic.
     *
     * @param event Event data
     */
    private void sendToLobby(Map<String, Object> event) {
        messagingTemplate.convertAndSend("/topic/lobby", event);
    }

    /**
     * Send personal notification to specific player.
     *
     * @param playerId Player ID
     * @param event Event data
     */
    private void sendToPlayer(String playerId, Map<String, Object> event) {
        messagingTemplate.convertAndSendToUser(playerId, "/queue/notification", event);
    }

    /**
     * Calculate final scores for all players.
     *
     * @param session Game session
     * @return Map of player IDs to scores
     */
    private Map<String, Integer> calculateScores(GameSession session) {
        Map<String, Integer> scores = new HashMap<>();
        // Calculate scores based on remaining cards
        // Implementation depends on scoring rules
        return scores;
    }
}
