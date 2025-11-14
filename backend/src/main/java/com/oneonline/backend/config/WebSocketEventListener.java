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
     * When a user's WebSocket connection is closed (by navigating away,
     * closing browser, etc.), this method automatically removes them from
     * their current room.
     *
     * FLOW:
     * 1. Extract user email from WebSocket session or session map
     * 2. Find which room the user is in
     * 3. Find the player object in that room
     * 4. Call RoomManager.leaveRoom() to properly remove them
     * 5. RoomManager handles notifications, leadership transfer, room cleanup
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

        try {
            // Find which room the user is currently in
            Optional<Room> currentRoomOpt = gameManager.findUserCurrentRoom(userEmail);

            if (currentRoomOpt.isEmpty()) {
                log.debug("🔌 [WebSocket] User {} was not in any room", userEmail);
                return;
            }

            Room currentRoom = currentRoomOpt.get();
            String roomCode = currentRoom.getRoomCode();

            log.info("🔌 [WebSocket] User {} was in room {}, removing them...", userEmail, roomCode);

            // Find the player object in the room
            Optional<Player> playerOpt = currentRoom.getPlayers().stream()
                .filter(p -> userEmail.equals(p.getUserEmail()))
                .findFirst();

            if (playerOpt.isEmpty()) {
                log.warn("🔌 [WebSocket] User {} in room {} but player object not found", userEmail, roomCode);
                // Still untrack the user even if player not found
                gameManager.untrackUser(userEmail);
                return;
            }

            Player player = playerOpt.get();

            // Use RoomManager to properly leave the room
            // This handles:
            // - Removing player from room
            // - Untracking user from GameManager
            // - WebSocket notifications to other players
            // - Leadership transfer if needed
            // - Room cleanup if empty
            Room updatedRoom = roomManager.leaveRoom(roomCode, player);

            if (updatedRoom == null) {
                log.info("✅ [WebSocket] Room {} closed after {} left (no players remaining)",
                    roomCode, userEmail);
            } else {
                log.info("✅ [WebSocket] User {} successfully removed from room {} on disconnect",
                    userEmail, roomCode);
            }

        } catch (Exception e) {
            log.error("❌ [WebSocket] Error handling disconnect for user {}: {}",
                userEmail, e.getMessage(), e);

            // Even if there's an error, try to untrack the user
            try {
                gameManager.untrackUser(userEmail);
            } catch (Exception ex) {
                log.error("❌ [WebSocket] Failed to untrack user {}: {}", userEmail, ex.getMessage());
            }
        } finally {
            log.debug("🔌 [WebSocket] Remaining active sessions: {}", sessionUserMap.size());
        }
    }
}
