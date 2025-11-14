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
     * When a user's WebSocket connection is closed, this method logs the
     * disconnection but DOES NOT automatically remove them from their room.
     *
     * IMPORTANT DESIGN DECISION:
     * We do NOT auto-remove users on WebSocket disconnect because:
     * 1. WebSocket disconnects happen during normal game flow (room → game transition)
     * 2. Users should only leave rooms via explicit API call to /api/rooms/{code}/leave
     * 3. This prevents users from being kicked out during WebSocket reconnections
     *
     * Users will be removed from rooms when:
     * - They explicitly call the leave room endpoint
     * - The frontend cleanup calls the leave API when navigating away
     * - They are kicked by the room leader
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

        // Find which room the user is currently in (for logging only)
        Optional<Room> currentRoomOpt = gameManager.findUserCurrentRoom(userEmail);

        if (currentRoomOpt.isPresent()) {
            Room currentRoom = currentRoomOpt.get();
            String roomCode = currentRoom.getRoomCode();

            log.info("🔌 [WebSocket] User {} was in room {} but will remain in room (can reconnect later)",
                userEmail, roomCode);
            log.info("💡 [WebSocket] User will only leave room via explicit API call or kick");
        } else {
            log.debug("🔌 [WebSocket] User {} was not in any room", userEmail);
        }

        log.debug("🔌 [WebSocket] Remaining active sessions: {}", sessionUserMap.size());
    }
}
