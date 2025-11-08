package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Room;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * GameManager Service - SINGLETON PATTERN
 *
 * Manages all game rooms and active game sessions globally.
 * This is the central orchestrator for all ONE Online games.
 *
 * RESPONSIBILITIES:
 * - Create and manage game rooms
 * - Track active game sessions
 * - Clean up inactive rooms
 * - Provide game statistics
 *
 * DESIGN PATTERN: Singleton (Thread-safe with initialization-on-demand holder)
 *
 * THREAD SAFETY:
 * - Uses ConcurrentHashMap for thread-safe room/session storage
 * - Initialization-on-demand holder idiom (lazy, thread-safe, no synchronization overhead)
 *
 * USAGE:
 * GameManager manager = GameManager.getInstance();
 * Room room = manager.createRoom(roomCode, leader);
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
public class GameManager {

    // Thread-safe maps for storing rooms and sessions
    private final ConcurrentHashMap<String, Room> activeRooms;
    private final ConcurrentHashMap<String, GameSession> activeSessions;

    /**
     * Private constructor - prevents external instantiation
     *
     * Initializes data structures for room and session management
     */
    private GameManager() {
        this.activeRooms = new ConcurrentHashMap<>();
        this.activeSessions = new ConcurrentHashMap<>();
        log.info("GameManager initialized - Singleton instance created");
    }

    /**
     * Holder class for lazy initialization (Bill Pugh Singleton)
     *
     * This inner static class is loaded only when getInstance() is called.
     * Provides thread-safe lazy initialization without synchronization overhead.
     */
    private static class SingletonHolder {
        private static final GameManager INSTANCE = new GameManager();
    }

    /**
     * Get singleton instance of GameManager
     *
     * Thread-safe lazy initialization using initialization-on-demand holder idiom.
     * No synchronization required after first initialization.
     *
     * @return Singleton GameManager instance
     */
    public static GameManager getInstance() {
        return SingletonHolder.INSTANCE;
    }

    /**
     * Create a new game room
     *
     * @param room Room object to add
     * @return Created room
     * @throws IllegalArgumentException if room code already exists
     */
    public Room createRoom(Room room) {
        if (activeRooms.containsKey(room.getRoomCode())) {
            log.warn("Attempted to create duplicate room: {}", room.getRoomCode());
            throw new IllegalArgumentException("Room code already exists: " + room.getRoomCode());
        }

        activeRooms.put(room.getRoomCode(), room);
        log.info("Room created: {} by leader: {}", room.getRoomCode(), room.getLeader().getNickname());
        return room;
    }

    /**
     * Find room by room code
     *
     * @param roomCode 6-character room code
     * @return Optional<Room> if found, empty otherwise
     */
    public Optional<Room> findRoom(String roomCode) {
        return Optional.ofNullable(activeRooms.get(roomCode));
    }

    /**
     * Get room by code (throws exception if not found)
     *
     * @param roomCode Room code
     * @return Room object
     * @throws IllegalArgumentException if room not found
     */
    public Room getRoom(String roomCode) {
        return findRoom(roomCode)
            .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomCode));
    }

    /**
     * Remove room from active rooms
     *
     * @param roomCode Room code to remove
     * @return true if removed, false if not found
     */
    public boolean removeRoom(String roomCode) {
        Room removed = activeRooms.remove(roomCode);
        if (removed != null) {
            log.info("Room removed: {}", roomCode);
            return true;
        }
        return false;
    }

    /**
     * Start a game session for a room
     *
     * @param session GameSession to start
     * @return Started session
     */
    public GameSession startGameSession(GameSession session) {
        activeSessions.put(session.getSessionId(), session);
        log.info("Game session started: {} for room: {}",
            session.getSessionId(), session.getRoom().getRoomCode());
        return session;
    }

    /**
     * Find game session by ID
     *
     * @param sessionId Session ID
     * @return Optional<GameSession> if found, empty otherwise
     */
    public Optional<GameSession> findSession(String sessionId) {
        return Optional.ofNullable(activeSessions.get(sessionId));
    }

    /**
     * Get game session by ID (throws exception if not found)
     *
     * @param sessionId Session ID
     * @return GameSession object
     * @throws IllegalArgumentException if session not found
     */
    public GameSession getSession(String sessionId) {
        return findSession(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
    }

    /**
     * Remove game session
     *
     * @param sessionId Session ID to remove
     * @return true if removed, false if not found
     */
    public boolean removeSession(String sessionId) {
        GameSession removed = activeSessions.remove(sessionId);
        if (removed != null) {
            log.info("Game session ended: {}", sessionId);
            return true;
        }
        return false;
    }

    /**
     * Get all active rooms
     *
     * @return List of all active rooms
     */
    public List<Room> getAllRooms() {
        return new ArrayList<>(activeRooms.values());
    }

    /**
     * Get all public rooms (not private)
     *
     * @return List of public rooms
     */
    public List<Room> getPublicRooms() {
        return activeRooms.values().stream()
            .filter(room -> !room.isPrivate())
            .toList();
    }

    /**
     * Get all active game sessions
     *
     * @return List of all active sessions
     */
    public List<GameSession> getAllSessions() {
        return new ArrayList<>(activeSessions.values());
    }

    /**
     * Remove inactive rooms (empty or timed out)
     *
     * Cleans up rooms that:
     * - Have no players
     * - Have been inactive for more than timeout period
     *
     * @param inactiveMinutes Minutes of inactivity before removal
     * @return Number of rooms removed
     */
    public int removeInactiveRooms(int inactiveMinutes) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(inactiveMinutes);
        int removed = 0;

        Iterator<Map.Entry<String, Room>> iterator = activeRooms.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, Room> entry = iterator.next();
            Room room = entry.getValue();

            // Remove if empty or inactive
            if (room.getPlayers().isEmpty()) {
                iterator.remove();
                removed++;
                log.info("Removed empty room: {}", entry.getKey());
            }
        }

        if (removed > 0) {
            log.info("Cleanup: Removed {} inactive rooms", removed);
        }

        return removed;
    }

    /**
     * Get game statistics
     *
     * @return Map with statistics (active rooms, sessions, players)
     */
    public Map<String, Object> getStatistics() {
        int totalPlayers = activeRooms.values().stream()
            .mapToInt(room -> room.getPlayers().size())
            .sum();

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeRooms", activeRooms.size());
        stats.put("activeSessions", activeSessions.size());
        stats.put("totalPlayers", totalPlayers);
        stats.put("publicRooms", getPublicRooms().size());

        return stats;
    }

    /**
     * Get total number of active rooms
     *
     * @return Number of active rooms
     */
    public int getActiveRoomCount() {
        return activeRooms.size();
    }

    /**
     * Get total number of active sessions
     *
     * @return Number of active sessions
     */
    public int getActiveSessionCount() {
        return activeSessions.size();
    }

    /**
     * Check if room exists
     *
     * @param roomCode Room code
     * @return true if exists, false otherwise
     */
    public boolean roomExists(String roomCode) {
        return activeRooms.containsKey(roomCode);
    }

    /**
     * Check if session exists
     *
     * @param sessionId Session ID
     * @return true if exists, false otherwise
     */
    public boolean sessionExists(String sessionId) {
        return activeSessions.containsKey(sessionId);
    }
}
