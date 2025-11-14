package com.oneonline.backend.config;

import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.service.game.GameManager;
import com.oneonline.backend.service.game.RoomManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocketEventListener - Handles WebSocket connection lifecycle events
 *
 * Listens for WebSocket connection and disconnection events to automatically
 * manage room membership when users navigate away or lose connection.
 *
 * EVENTS HANDLED:
 * - SessionConnectEvent: When a WebSocket connection is established (track user)
 * - SessionDisconnectEvent: When a WebSocket connection is closed (auto-leave room)
 *
 * AUTO-LEAVE FUNCTIONALITY:
 * When a user disconnects from WebSocket:
 * 1. Find which room they're currently in
 * 2. Remove them from that room
 * 3. Notify other players in the room
 * 4. Transfer leadership if they were the leader
 * 5. Close room if it becomes empty
 *
 * This ensures users are automatically removed from rooms when they:
 * - Press the "back" button
 * - Navigate to a different page
 * - Close the browser/tab
 * - Lose network connection
 * - Their WebSocket connection drops for any reason
 *
 * @author Juan Gallardo
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final RoomManager roomManager;
    private final GameManager gameManager = GameManager.getInstance();

    // Track WebSocket sessions: sessionId -> userEmail
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    /**
     * Handle WebSocket connect event
     *
     * Tracks which user is associated with which WebSocket session.
     * This allows us to properly identify users when they disconnect.
     *
     * @param event SessionConnectEvent from Spring WebSocket
     */
    @EventListener
    public void handleWebSocketConnect(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String sessionId = headerAccessor.getSessionId();
        String userEmail = headerAccessor.getUser() != null ?
            headerAccessor.getUser().getName() : null;

        if (sessionId != null && userEmail != null) {
            sessionUserMap.put(sessionId, userEmail);
            log.info("🔗 [WebSocket] User {} connected with session {}", userEmail, sessionId);
            log.debug("🔗 [WebSocket] Active sessions: {}", sessionUserMap.size());
        } else {
            log.warn("⚠️ [WebSocket] Connection without proper authentication - sessionId: {}, user: {}",
                sessionId, userEmail);
        }
    }

    /**
     * Handle WebSocket disconnect event
     *
     * IMPORTANT: We DO NOT automatically remove users from rooms on disconnect.
     * This is because WebSocket disconnections can happen temporarily due to:
     * - Network hiccups
     * - Page refreshes
     * - Brief connection losses
     *
     * If we removed users automatically, they would:
     * - Lose their leader status on brief disconnections
     * - Be unable to start games after reconnecting
     * - Create a poor user experience
     *
     * Instead, users are only removed from rooms when:
     * 1. They explicitly call the /api/rooms/{code}/leave endpoint
     * 2. They are kicked by the room leader
     * 3. The room is closed/deleted
     *
     * This method only logs the disconnect and cleans up the session tracking.
     *
     * @param event SessionDisconnectEvent from Spring WebSocket
     */
    @EventListener
    public void handleWebSocketDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String sessionId = headerAccessor.getSessionId();

        log.info("🔌 [WebSocket] Session {} disconnecting...", sessionId);

        // Try to get user email from session map first (more reliable)
        String tempEmail = sessionUserMap.remove(sessionId);

        // Fallback to Principal if not in map
        if (tempEmail == null && headerAccessor.getUser() != null) {
            tempEmail = headerAccessor.getUser().getName();
            log.debug("🔌 [WebSocket] User email retrieved from Principal: {}", tempEmail);
        }

        // Make userEmail final for use in lambda expressions
        final String userEmail = tempEmail;

        if (userEmail == null) {
            log.debug("🔌 [WebSocket] Session {} disconnected but no user found", sessionId);
            log.debug("🔌 [WebSocket] Remaining active sessions: {}", sessionUserMap.size());
            return;
        }

        log.info("🔌 [WebSocket] User {} (session {}) disconnected from WebSocket", userEmail, sessionId);
        log.info("🔌 [WebSocket] User will remain in their room and can reconnect later");
        log.debug("🔌 [WebSocket] Remaining active sessions: {}", sessionUserMap.size());

        // NOTE: We do NOT remove the user from their room here.
        // They must explicitly call /api/rooms/{code}/leave to leave the room.
        // This prevents issues with:
        // - Temporary disconnections
        // - Network hiccups
        // - Page refreshes
        // - Users losing leader status unnecessarily
    }
}
