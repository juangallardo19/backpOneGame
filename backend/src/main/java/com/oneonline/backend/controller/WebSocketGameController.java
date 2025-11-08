package com.oneonline.backend.controller;

import com.oneonline.backend.dto.response.GameStateResponse;
import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.service.game.GameEngine;
import com.oneonline.backend.service.game.GameManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Map;

/**
 * WebSocketGameController - WebSocket handler for real-time game events
 *
 * Handles real-time game communication via STOMP over WebSocket.
 *
 * MESSAGE DESTINATIONS:
 * - Client sends to: /app/game/{sessionId}/action
 * - Server broadcasts to: /topic/game/{sessionId}
 * - Server sends to user: /queue/notifications
 *
 * SUPPORTED ACTIONS:
 * - play-card: Player plays a card
 * - draw-card: Player draws a card
 * - call-uno: Player calls UNO
 * - chat: Send chat message
 * - player-joined: Player joined game
 * - player-left: Player left game
 *
 * CLIENT CONNECTION:
 * 1. Connect to ws://localhost:8080/ws
 * 2. Subscribe to /topic/game/{sessionId}
 * 3. Send messages to /app/game/{sessionId}/play-card
 * 4. Receive broadcasts on subscribed topic
 *
 * @author Juan Gallardo
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketGameController {

    private final SimpMessagingTemplate messagingTemplate;
    private final GameEngine gameEngine;
    private final GameManager gameManager = GameManager.getInstance();

    /**
     * Handle card play via WebSocket
     *
     * Client sends to: /app/game/{sessionId}/play-card
     * Server broadcasts to: /topic/game/{sessionId}
     *
     * Message:
     * {
     *   "cardId": "card-123",
     *   "chosenColor": "RED"
     * }
     *
     * @param sessionId Game session ID
     * @param payload Card play payload
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/play-card")
    @SendTo("/topic/game/{sessionId}")
    public GameStateResponse handlePlayCard(
            @DestinationVariable String sessionId,
            @Payload Map<String, Object> payload,
            Principal principal) {

        log.info("WebSocket: Player {} playing card in session {}", principal.getName(), sessionId);

        try {
            GameSession session = gameManager.getSession(sessionId);

            // Find player
            Player player = session.getPlayers().stream()
                    .filter(p -> p.getNickname().equals(principal.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

            // Find card
            String cardId = (String) payload.get("cardId");
            Card card = player.getHand().stream()
                    .filter(c -> c.toString().contains(cardId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Card not found"));

            // Process move
            gameEngine.processMove(player, card, session);

            // Broadcast updated game state to all players
            GameStateResponse response = buildGameStateResponse(session);

            log.info("WebSocket: Card played successfully, broadcasting to all players");

            return response;

        } catch (Exception e) {
            log.error("WebSocket: Error processing card play: {}", e.getMessage());

            // Send error to specific user
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    Map.of("error", e.getMessage())
            );

            return null;
        }
    }

    /**
     * Handle card draw via WebSocket
     *
     * Client sends to: /app/game/{sessionId}/draw-card
     * Server broadcasts to: /topic/game/{sessionId}
     *
     * @param sessionId Game session ID
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/draw-card")
    @SendTo("/topic/game/{sessionId}")
    public GameStateResponse handleDrawCard(
            @DestinationVariable String sessionId,
            Principal principal) {

        log.info("WebSocket: Player {} drawing card in session {}", principal.getName(), sessionId);

        try {
            GameSession session = gameManager.getSession(sessionId);

            // Find player
            Player player = session.getPlayers().stream()
                    .filter(p -> p.getNickname().equals(principal.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

            // Draw card
            gameEngine.drawCard(player, session);

            // Advance turn
            session.getTurnManager().nextTurn();

            // Broadcast updated game state
            return buildGameStateResponse(session);

        } catch (Exception e) {
            log.error("WebSocket: Error processing card draw: {}", e.getMessage());

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    Map.of("error", e.getMessage())
            );

            return null;
        }
    }

    /**
     * Handle UNO call via WebSocket
     *
     * Client sends to: /app/game/{sessionId}/call-uno
     * Server broadcasts to: /topic/game/{sessionId}
     *
     * @param sessionId Game session ID
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/call-uno")
    public void handleCallUno(
            @DestinationVariable String sessionId,
            Principal principal) {

        log.info("WebSocket: Player {} calling UNO in session {}", principal.getName(), sessionId);

        try {
            // Broadcast UNO call to all players
            messagingTemplate.convertAndSend(
                    "/topic/game/" + sessionId,
                    Map.of(
                            "type", "ONE_CALLED",
                            "player", principal.getName(),
                            "timestamp", System.currentTimeMillis()
                    )
            );

        } catch (Exception e) {
            log.error("WebSocket: Error processing UNO call: {}", e.getMessage());
        }
    }

    /**
     * Handle chat message via WebSocket
     *
     * Client sends to: /app/game/{sessionId}/chat
     * Server broadcasts to: /topic/game/{sessionId}/chat
     *
     * Message:
     * {
     *   "message": "Hello everyone!"
     * }
     *
     * @param sessionId Game session ID
     * @param payload Chat message payload
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/chat")
    public void handleChatMessage(
            @DestinationVariable String sessionId,
            @Payload Map<String, String> payload,
            Principal principal) {

        log.debug("WebSocket: Chat message in session {} from {}", sessionId, principal.getName());

        String message = payload.get("message");

        // Broadcast chat message to all players in room
        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId + "/chat",
                Map.of(
                        "sender", principal.getName(),
                        "message", message,
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    /**
     * Handle player joining room
     *
     * @param sessionId Game session ID
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/join")
    public void handlePlayerJoin(
            @DestinationVariable String sessionId,
            Principal principal) {

        log.info("WebSocket: Player {} joining session {}", principal.getName(), sessionId);

        // Notify all players
        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId,
                Map.of(
                        "type", "PLAYER_JOINED",
                        "player", principal.getName(),
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    /**
     * Handle player leaving room
     *
     * @param sessionId Game session ID
     * @param principal Authenticated user
     */
    @MessageMapping("/game/{sessionId}/leave")
    public void handlePlayerLeave(
            @DestinationVariable String sessionId,
            Principal principal) {

        log.info("WebSocket: Player {} leaving session {}", principal.getName(), sessionId);

        // Notify all players
        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId,
                Map.of(
                        "type", "PLAYER_LEFT",
                        "player", principal.getName(),
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    /**
     * Broadcast game state change to all players
     *
     * This method can be called from services to push updates.
     *
     * @param sessionId Game session ID
     * @param eventType Type of event
     * @param data Additional data
     */
    public void broadcastGameEvent(String sessionId, String eventType, Object data) {
        log.debug("WebSocket: Broadcasting event {} to session {}", eventType, sessionId);

        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId,
                Map.of(
                        "type", eventType,
                        "data", data,
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    /**
     * Send notification to specific user
     *
     * @param username User to notify
     * @param message Notification message
     */
    public void sendUserNotification(String username, String message) {
        log.debug("WebSocket: Sending notification to user {}", username);

        messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                Map.of(
                        "message", message,
                        "timestamp", System.currentTimeMillis()
                )
        );
    }

    /**
     * Build GameStateResponse from GameSession
     *
     * @param session Game session
     * @return GameStateResponse DTO
     */
    private GameStateResponse buildGameStateResponse(GameSession session) {
        return GameStateResponse.builder()
                .sessionId(session.getSessionId())
                .roomCode(session.getRoom().getRoomCode())
                .status(session.getStatus().name())
                .currentTurn(session.getTurnManager().getCurrentPlayer().getPlayerId())
                .topCard(session.getTopCard())
                .deckSize(session.getDeck().getRemainingCards())
                .discardPileSize(session.getDiscardPile().size())
                .direction(session.getTurnManager().isClockwise() ? "CLOCKWISE" : "COUNTER_CLOCKWISE")
                .pendingDrawCount(session.getPendingDrawCount())
                .build();
    }
}
