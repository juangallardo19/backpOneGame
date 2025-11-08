package com.oneonline.backend.pattern.creational.singleton;

import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Room;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SINGLETON PATTERN Implementation for Game Management
 *
 * Purpose:
 * Ensures only ONE instance of GameManager exists throughout the application.
 * Centrally manages all active game sessions and rooms, providing a global
 * point of access to game state.
 *
 * Pattern Benefits:
 * - Controlled access to sole instance
 * - Reduced namespace pollution
 * - Permits refinement of operations and representation
 * - Permits variable number of instances (can be extended to limited pool)
 * - More flexible than class operations (static methods)
 *
 * Thread Safety:
 * This implementation uses the "Initialization-on-demand holder" idiom,
 * which is thread-safe without requiring synchronization.
 *
 * Use Cases in ONE Game:
 * - Central registry of all active game rooms
 * - Central registry of all active game sessions
 * - Room lookup by code
 * - Session lookup by ID
 * - Global game statistics
 * - Prevent multiple game managers
 *
 * Example Usage:
 * <pre>
 * GameManager manager = GameManager.getInstance();
 * manager.addRoom(room);
 * Room found = manager.getRoomByCode("ABC123");
 * </pre>
 */
public class GameManager {

    /**
     * Map of all active rooms (key: room code)
     */
    private final Map<String, Room> rooms;

    /**
     * Map of all active game sessions (key: session ID)
     */
    private final Map<String, GameSession> sessions;

    /**
     * Map of room codes to session IDs (for quick lookup)
     */
    private final Map<String, String> roomToSession;

    /**
     * Private constructor prevents external instantiation.
     * Called only once by the Holder class.
     */
    private GameManager() {
        // Use ConcurrentHashMap for thread safety
        this.rooms = new ConcurrentHashMap<>();
        this.sessions = new ConcurrentHashMap<>();
        this.roomToSession = new ConcurrentHashMap<>();
    }

    /**
     * Static inner class for lazy initialization (Initialization-on-demand holder idiom).
     *
     * The Holder class is not loaded until getInstance() is called,
     * ensuring lazy initialization. The JVM guarantees thread safety
     * during class initialization.
     */
    private static class Holder {
        private static final GameManager INSTANCE = new GameManager();
    }

    /**
     * Get the singleton instance of GameManager.
     *
     * Thread-safe lazy initialization without synchronization overhead.
     *
     * @return The single GameManager instance
     */
    public static GameManager getInstance() {
        return Holder.INSTANCE;
    }

    /**
     * Add a room to the manager.
     *
     * @param room Room to add
     * @return true if added, false if room code already exists
     */
    public boolean addRoom(Room room) {
        if (room == null || room.getRoomCode() == null) {
            return false;
        }

        // Only add if room code doesn't exist
        return rooms.putIfAbsent(room.getRoomCode(), room) == null;
    }

    /**
     * Remove a room from the manager.
     *
     * Also removes associated game session if exists.
     *
     * @param roomCode Room code
     * @return The removed room, or null if not found
     */
    public Room removeRoom(String roomCode) {
        if (roomCode == null) {
            return null;
        }

        // Remove associated session
        String sessionId = roomToSession.remove(roomCode);
        if (sessionId != null) {
            sessions.remove(sessionId);
        }

        return rooms.remove(roomCode);
    }

    /**
     * Get room by room code.
     *
     * @param roomCode 6-character room code
     * @return Room if found, null otherwise
     */
    public Room getRoomByCode(String roomCode) {
        return rooms.get(roomCode);
    }

    /**
     * Check if a room exists.
     *
     * @param roomCode Room code to check
     * @return true if room exists
     */
    public boolean roomExists(String roomCode) {
        return rooms.containsKey(roomCode);
    }

    /**
     * Add a game session to the manager.
     *
     * @param session Game session to add
     * @return true if added, false if session ID already exists
     */
    public boolean addSession(GameSession session) {
        if (session == null || session.getSessionId() == null) {
            return false;
        }

        boolean added = sessions.putIfAbsent(session.getSessionId(), session) == null;

        // Map room to session
        if (added && session.getRoom() != null) {
            roomToSession.put(session.getRoom().getRoomCode(), session.getSessionId());
        }

        return added;
    }

    /**
     * Remove a game session from the manager.
     *
     * @param sessionId Session ID
     * @return The removed session, or null if not found
     */
    public GameSession removeSession(String sessionId) {
        if (sessionId == null) {
            return null;
        }

        GameSession removed = sessions.remove(sessionId);

        // Remove room to session mapping
        if (removed != null && removed.getRoom() != null) {
            roomToSession.remove(removed.getRoom().getRoomCode());
        }

        return removed;
    }

    /**
     * Get session by session ID.
     *
     * @param sessionId Session ID
     * @return GameSession if found, null otherwise
     */
    public GameSession getSessionById(String sessionId) {
        return sessions.get(sessionId);
    }

    /**
     * Get session by room code.
     *
     * @param roomCode Room code
     * @return GameSession if found, null otherwise
     */
    public GameSession getSessionByRoomCode(String roomCode) {
        String sessionId = roomToSession.get(roomCode);
        return sessionId != null ? sessions.get(sessionId) : null;
    }

    /**
     * Check if a session exists.
     *
     * @param sessionId Session ID to check
     * @return true if session exists
     */
    public boolean sessionExists(String sessionId) {
        return sessions.containsKey(sessionId);
    }

    /**
     * Get all active rooms.
     *
     * @return Map of all rooms (key: room code)
     */
    public Map<String, Room> getAllRooms() {
        return new ConcurrentHashMap<>(rooms); // Return copy for safety
    }

    /**
     * Get all active sessions.
     *
     * @return Map of all sessions (key: session ID)
     */
    public Map<String, GameSession> getAllSessions() {
        return new ConcurrentHashMap<>(sessions); // Return copy for safety
    }

    /**
     * Get total number of active rooms.
     *
     * @return Room count
     */
    public int getRoomCount() {
        return rooms.size();
    }

    /**
     * Get total number of active sessions.
     *
     * @return Session count
     */
    public int getSessionCount() {
        return sessions.size();
    }

    /**
     * Get total number of active players across all rooms.
     *
     * @return Total player count
     */
    public int getTotalPlayerCount() {
        return rooms.values().stream()
                .mapToInt(Room::getTotalPlayerCount)
                .sum();
    }

    /**
     * Clear all rooms and sessions.
     *
     * WARNING: This will end all active games!
     * Use with caution (typically for testing or server shutdown).
     */
    public void clearAll() {
        rooms.clear();
        sessions.clear();
        roomToSession.clear();
    }

    /**
     * Get statistics about the game manager.
     *
     * @return Summary string
     */
    public String getStatistics() {
        return String.format(
                "GameManager Stats: %d rooms, %d sessions, %d total players",
                getRoomCount(),
                getSessionCount(),
                getTotalPlayerCount()
        );
    }

    /**
     * Prevent cloning of singleton instance.
     *
     * @throws CloneNotSupportedException always
     */
    @Override
    protected Object clone() throws CloneNotSupportedException {
        throw new CloneNotSupportedException("Cannot clone singleton instance");
    }

    @Override
    public String toString() {
        return String.format("GameManager[rooms=%d, sessions=%d, players=%d]",
                getRoomCount(), getSessionCount(), getTotalPlayerCount());
    }
}
