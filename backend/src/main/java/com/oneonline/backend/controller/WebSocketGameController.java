package com.oneonline.backend.controller;

import com.oneonline.backend.dto.response.GameStateResponse;
import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.enums.GameStatus;
import com.oneonline.backend.service.game.GameEngine;
import com.oneonline.backend.service.game.GameManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.List;
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
 * - call-uno: Player calls ONE
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
    public void handlePlayCard(
            @DestinationVariable String sessionId,
            @Payload Map<String, Object> payload,
            Principal principal) {

        log.info("🎴 [WebSocket] Player {} playing card in session {}", principal.getName(), sessionId);

        try {
            GameSession session = gameManager.getSession(sessionId);

            // Find player
            Player player = session.getPlayers().stream()
                    .filter(p -> p.getNickname().equals(principal.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

            // Find card
            String cardId = (String) payload.get("cardId");
            String chosenColor = (String) payload.get("chosenColor");

            Card card = player.getHand().stream()
                    .filter(c -> c.getCardId().equals(cardId) || c.toString().contains(cardId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Card not found in hand"));

            // If wild card and color chosen, set it
            if (card instanceof WildCard wildCard && chosenColor != null) {
                wildCard.setChosenColor(com.oneonline.backend.model.enums.CardColor.valueOf(chosenColor));
            }

            log.info("🃏 [WebSocket] Playing card: {} {}", card.getColor(), card.getValue());

            // Process move through GameEngine (this triggers Observer notifications)
            log.info("⚙️ [WebSocket] Procesando jugada con GameEngine...");
            gameEngine.processMove(player, card, session);
            log.info("✅ [WebSocket] GameEngine procesó la jugada");

            // Build and broadcast general game state (without hands)
            log.info("🔨 [WebSocket] Construyendo estado general del juego...");
            GameStateResponse generalState = buildGameStateResponse(session);

            log.info("📤 [WebSocket] ========== ENVIANDO ESTADO GENERAL ==========");
            log.info("   🎯 Destino: /topic/game/{}", sessionId);
            log.info("   📋 SessionId: {}", generalState.getSessionId());
            log.info("   🎮 Status: {}", generalState.getStatus());
            log.info("   👥 Jugadores: {}", generalState.getPlayers().size());
            for (GameStateResponse.PlayerState ps : generalState.getPlayers()) {
                log.info("      - {} ({} cartas)", ps.getNickname(), ps.getCardCount());
            }
            log.info("   🎲 Turno actual: {}", generalState.getCurrentPlayerId());
            log.info("   🃏 Carta superior: {} {}",
                generalState.getTopCard() != null ? generalState.getTopCard().getColor() : "null",
                generalState.getTopCard() != null ? generalState.getTopCard().getValue() : "null");
            log.info("   📚 Cartas en mazo: {}", generalState.getDeckSize());
            log.info("   🔄 Dirección: {}", Boolean.TRUE.equals(generalState.getClockwise()) ? "CLOCKWISE" : "COUNTER_CLOCKWISE");

            messagingTemplate.convertAndSend(
                    "/topic/game/" + sessionId,
                    Map.of(
                            "eventType", "GAME_STATE_UPDATE",
                            "timestamp", System.currentTimeMillis(),
                            "data", generalState
                    )
            );
            log.info("✅ [WebSocket] Estado general ENVIADO correctamente");

            // Send each player their personal hand
            log.info("📤 [WebSocket] ========== ENVIANDO MANOS PERSONALIZADAS ==========");
            int playerCount = 0;
            for (Player p : session.getPlayers()) {
                if (!(p instanceof BotPlayer)) {
                    playerCount++;
                    log.info("   👤 Preparando mano para: {}", p.getNickname());
                    GameStateResponse personalState = buildPersonalGameState(session, p);
                    log.info("      🎯 Destino: /user/{}/queue/game-state", p.getNickname());
                    log.info("      🃏 Cartas en mano: {}", personalState.getHand() != null ? personalState.getHand().size() : 0);
                    if (personalState.getHand() != null && !personalState.getHand().isEmpty()) {
                        for (GameStateResponse.CardInfo cardInfo : personalState.getHand()) {
                            log.info("         - {} {} (id: {})", cardInfo.getColor(), cardInfo.getValue(), cardInfo.getCardId());
                        }
                    }

                    messagingTemplate.convertAndSendToUser(
                            p.getNickname(),
                            "/queue/game-state",
                            personalState
                    );
                    log.info("   ✅ Mano ENVIADA a {}", p.getNickname());
                }
            }
            log.info("✅ [WebSocket] {} manos personalizadas enviadas", playerCount);
            log.info("✅ [WebSocket] =================================================");

        } catch (Exception e) {
            log.error("❌ [WebSocket] Error processing card play: {}", e.getMessage(), e);

            // Send error to specific user
            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    Map.of("error", e.getMessage())
            );
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
    public void handleDrawCard(
            @DestinationVariable String sessionId,
            Principal principal) {

        log.info("📥 [WebSocket] Player {} drawing card in session {}", principal.getName(), sessionId);

        try {
            GameSession session = gameManager.getSession(sessionId);

            // Find player
            Player player = session.getPlayers().stream()
                    .filter(p -> p.getNickname().equals(principal.getName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

            // Check if it's player's turn
            if (!session.getCurrentPlayer().getPlayerId().equals(player.getPlayerId())) {
                throw new IllegalStateException("Not your turn!");
            }

            // Draw card through GameEngine (triggers Observer notifications)
            log.info("⚙️ [WebSocket] Robando carta con GameEngine...");
            gameEngine.drawCard(player, session);
            log.info("✅ [WebSocket] Carta robada: jugador {} ahora tiene {} cartas", player.getNickname(), player.getHandSize());

            // Advance turn (after drawing, turn ends)
            log.info("⏭️ [WebSocket] Avanzando turno...");
            session.nextTurn();
            log.info("✅ [WebSocket] Turno avanzado, ahora es el turno de: {}", session.getCurrentPlayer().getNickname());

            // Build and broadcast general game state
            log.info("🔨 [WebSocket] Construyendo estado general del juego...");
            GameStateResponse generalState = buildGameStateResponse(session);

            log.info("📤 [WebSocket] ========== ENVIANDO ESTADO GENERAL (DRAW) ==========");
            log.info("   🎯 Destino: /topic/game/{}", sessionId);
            log.info("   📋 SessionId: {}", generalState.getSessionId());
            log.info("   🎮 Status: {}", generalState.getStatus());
            log.info("   👥 Jugadores: {}", generalState.getPlayers().size());
            for (GameStateResponse.PlayerState ps : generalState.getPlayers()) {
                log.info("      - {} ({} cartas)", ps.getNickname(), ps.getCardCount());
            }
            log.info("   🎲 Turno actual: {}", generalState.getCurrentPlayerId());
            log.info("   🃏 Carta superior: {} {}",
                generalState.getTopCard() != null ? generalState.getTopCard().getColor() : "null",
                generalState.getTopCard() != null ? generalState.getTopCard().getValue() : "null");
            log.info("   📚 Cartas en mazo: {}", generalState.getDeckSize());

            messagingTemplate.convertAndSend(
                    "/topic/game/" + sessionId,
                    Map.of(
                            "eventType", "GAME_STATE_UPDATE",
                            "timestamp", System.currentTimeMillis(),
                            "data", generalState
                    )
            );
            log.info("✅ [WebSocket] Estado general ENVIADO correctamente");

            // Send each player their personal hand
            log.info("📤 [WebSocket] ========== ENVIANDO MANOS PERSONALIZADAS (DRAW) ==========");
            int playerCount = 0;
            for (Player p : session.getPlayers()) {
                if (!(p instanceof BotPlayer)) {
                    playerCount++;
                    log.info("   👤 Preparando mano para: {}", p.getNickname());
                    GameStateResponse personalState = buildPersonalGameState(session, p);
                    log.info("      🎯 Destino: /user/{}/queue/game-state", p.getNickname());
                    log.info("      🃏 Cartas en mano: {}", personalState.getHand() != null ? personalState.getHand().size() : 0);

                    messagingTemplate.convertAndSendToUser(
                            p.getNickname(),
                            "/queue/game-state",
                            personalState
                    );
                    log.info("   ✅ Mano ENVIADA a {}", p.getNickname());
                }
            }
            log.info("✅ [WebSocket] {} manos personalizadas enviadas", playerCount);
            log.info("✅ [WebSocket] =================================================");

        } catch (Exception e) {
            log.error("❌ [WebSocket] Error processing card draw: {}", e.getMessage(), e);

            messagingTemplate.convertAndSendToUser(
                    principal.getName(),
                    "/queue/errors",
                    Map.of("error", e.getMessage())
            );
        }
    }

    /**
     * Handle ONE call via WebSocket
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

        log.info("WebSocket: Player {} calling ONE in session {}", principal.getName(), sessionId);

        try {
            // Broadcast ONE call to all players
            messagingTemplate.convertAndSend(
                    "/topic/game/" + sessionId,
                    Map.of(
                            "type", "ONE_CALLED",
                            "player", principal.getName(),
                            "timestamp", System.currentTimeMillis()
                    )
            );

        } catch (Exception e) {
            log.error("WebSocket: Error processing ONE call: {}", e.getMessage());
        }
    }

    /**
     * Handle chat message via WebSocket
     *
     * Client sends to: /app/game/{sessionId}/chat
     * Server broadcasts to: /topic/game/{sessionId} with eventType MESSAGE_RECEIVED
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

        // Get player info
        GameSession session = gameSessionManager.getSession(sessionId);
        if (session == null) {
            log.error("Session not found: {}", sessionId);
            return;
        }

        // Find player by email
        Player player = session.getAllPlayers().stream()
                .filter(p -> p.getEmail().equals(principal.getName()))
                .findFirst()
                .orElse(null);

        if (player == null) {
            log.error("Player not found with email: {}", principal.getName());
            return;
        }

        // Broadcast chat message to all players in room as structured event
        messagingTemplate.convertAndSend(
                "/topic/game/" + sessionId,
                Map.of(
                        "eventType", "MESSAGE_RECEIVED",
                        "data", Map.of(
                                "playerId", player.getPlayerId(),
                                "playerNickname", player.getNickname(),
                                "message", message,
                                "timestamp", System.currentTimeMillis()
                        )
                )
        );

        log.info("Chat message sent from {} ({}): {}", player.getNickname(), player.getPlayerId(), message);
    }

    /**
     * Handle player joining room
     *
     * CRITICAL FIX: When a player joins/reconnects to an active game session,
     * send them their current game state including their hand.
     *
     * This fixes the issue where guests reconnect after the game starts
     * and miss the initial card distribution.
     *
     * @param sessionId Game session ID (could be roomCode or actual sessionId)
     * @param principal Authenticated user (may be null if not authenticated)
     */
    @MessageMapping("/game/{sessionId}/join")
    public void handlePlayerJoin(
            @DestinationVariable String sessionId,
            Principal principal) {

        // CRITICAL: Handle case when principal is null (unauthenticated connection)
        if (principal == null) {
            log.warn("⚠️ WebSocket: Unauthenticated player attempting to join session {}", sessionId);
            return; // Silently ignore unauthenticated join attempts
        }

        log.info("🎮 [WebSocket] Player {} joining session {}", principal.getName(), sessionId);

        try {
            // Try to find game session (could be sessionId or roomCode)
            GameSession session = null;
            try {
                session = gameManager.getSession(sessionId);
            } catch (Exception e) {
                log.debug("Session not found with ID {}, ignoring", sessionId);
            }

            // If session exists and game is in progress, send player their current state
            if (session != null && session.getStatus() == GameStatus.PLAYING) {
                log.info("🎯 [WebSocket] Game in progress, sending state to {}", principal.getName());

                // Find player in session
                Player player = session.getPlayers().stream()
                        .filter(p -> p.getNickname().equals(principal.getName()))
                        .findFirst()
                        .orElse(null);

                if (player != null && !(player instanceof BotPlayer)) {
                    log.info("👤 [WebSocket] Player found in session, sending personal state");

                    // CRITICAL FIX: Only send personal state with hand to the reconnecting player
                    // DO NOT broadcast general state to all players, as it would overwrite their hands
                    GameStateResponse personalState = buildPersonalGameState(session, player);
                    log.info("🃏 [WebSocket] Sending {} cards to {}",
                            personalState.getHand() != null ? personalState.getHand().size() : 0,
                            player.getNickname());

                    messagingTemplate.convertAndSendToUser(
                            player.getNickname(),
                            "/queue/game-state",
                            personalState
                    );

                    log.info("✅ [WebSocket] Personal state with {} cards sent to {}",
                            personalState.getHand() != null ? personalState.getHand().size() : 0,
                            player.getNickname());
                } else {
                    log.debug("Player {} not found in session or is a bot", principal.getName());
                }
            } else {
                log.debug("Session {} is not in PLAYING state or doesn't exist", sessionId);
            }
        } catch (Exception e) {
            log.error("❌ [WebSocket] Error handling player join: {}", e.getMessage(), e);
        }

        // Notify all players about the join (regardless of session state)
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
        // Build player states for all players
        List<GameStateResponse.PlayerState> playerStates = session.getPlayers().stream()
                .map(p -> GameStateResponse.PlayerState.builder()
                        .playerId(p.getPlayerId())
                        .nickname(p.getNickname())
                        .cardCount(p.getHandSize())
                        .score(p.getScore())
                        .calledOne(p.hasCalledOne())
                        .isBot(p instanceof BotPlayer)
                        .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // Build top card info if exists
        GameStateResponse.CardInfo topCardInfo = null;
        if (session.getTopCard() != null) {
            Card topCard = session.getTopCard();
            topCardInfo = GameStateResponse.CardInfo.builder()
                    .cardId(topCard.getCardId())
                    .type(topCard.getType().name())
                    .color(topCard.getColor().name())
                    .value(topCard.getValue())  // Send actual value from card
                    .build();
        }

        return GameStateResponse.builder()
                .sessionId(session.getSessionId())
                .roomCode(session.getRoom().getRoomCode())
                .status(session.getStatus().name())
                .currentPlayerId(session.getCurrentPlayer().getPlayerId())
                .topCard(topCardInfo)
                .currentColor(session.getTopCard() != null ? session.getTopCard().getColor().name() : null)
                .clockwise(session.isClockwise())
                .deckSize(session.getDeck().getRemainingCards())
                .pendingDrawCount(session.getPendingDrawCount())
                .players(playerStates)
                .turnOrder(session.getPlayers().stream()
                        .map(Player::getPlayerId)
                        .collect(java.util.stream.Collectors.toList()))
                .startedAt(System.currentTimeMillis())
                .build();
    }

    /**
     * Build personalized game state for a specific player (includes their hand).
     *
     * @param session Game session
     * @param player Player to build state for
     * @return GameStateResponse with player's hand included
     */
    private GameStateResponse buildPersonalGameState(GameSession session, Player player) {
        // Build player states for all players
        List<GameStateResponse.PlayerState> playerStates = session.getPlayers().stream()
                .map(p -> GameStateResponse.PlayerState.builder()
                        .playerId(p.getPlayerId())
                        .nickname(p.getNickname())
                        .cardCount(p.getHandSize())
                        .score(p.getScore())
                        .calledOne(p.hasCalledOne())
                        .isBot(p instanceof BotPlayer)
                        .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                        .build())
                .collect(java.util.stream.Collectors.toList());

        // Build top card info if exists
        GameStateResponse.CardInfo topCardInfo = null;
        if (session.getTopCard() != null) {
            Card topCard = session.getTopCard();
            topCardInfo = GameStateResponse.CardInfo.builder()
                    .cardId(topCard.getCardId())
                    .type(topCard.getType().name())
                    .color(topCard.getColor().name())
                    .value(topCard.getValue())  // Send actual value from card
                    .build();
        }

        // Build player's hand
        List<GameStateResponse.CardInfo> hand = player.getHand().stream()
                .map(card -> GameStateResponse.CardInfo.builder()
                        .cardId(card.getCardId())
                        .type(card.getType().name())
                        .color(card.getColor().name())
                        .value(card.getValue())  // Send actual value from card
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return GameStateResponse.builder()
                .sessionId(session.getSessionId())
                .roomCode(session.getRoom().getRoomCode())
                .status(session.getStatus().name())
                .currentPlayerId(session.getCurrentPlayer().getPlayerId())
                .topCard(topCardInfo)
                .currentColor(session.getTopCard() != null ? session.getTopCard().getColor().name() : null)
                .clockwise(session.isClockwise())
                .deckSize(session.getDeck().getRemainingCards())
                .pendingDrawCount(session.getPendingDrawCount())
                .players(playerStates)
                .hand(hand)  // CRITICAL: Include player's hand
                .turnOrder(session.getPlayers().stream()
                        .map(Player::getPlayerId)
                        .collect(java.util.stream.Collectors.toList()))
                .startedAt(System.currentTimeMillis())
                .build();
    }
}
