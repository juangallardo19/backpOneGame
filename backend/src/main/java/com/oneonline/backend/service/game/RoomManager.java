package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.BotPlayer;
import com.oneonline.backend.model.domain.GameConfiguration;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.pattern.behavioral.observer.GameObserver;
import com.oneonline.backend.pattern.creational.builder.RoomBuilder;
import com.oneonline.backend.util.CodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * RoomManager Service
 *
 * Manages game room operations:
 * - Create/join/leave rooms
 * - Add/remove bots
 * - Kick players (leader only)
 * - Transfer leadership
 * - Room visibility (public/private)
 *
 * RESPONSIBILITIES:
 * - Room lifecycle management
 * - Player capacity validation
 * - Bot management
 * - Leadership operations
 * - WebSocket notifications for room events
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RoomManager {

    private final GameManager gameManager = GameManager.getInstance();
    private final GameObserver webSocketObserver; // ⬅️ ESTE ES EL CAMBIO CLAVE

    /**
     * Create a new game room
     *
     * Generates a unique 6-character room code and creates a room
     * with the specified configuration.
     *
     * @param creator Player who creates the room (becomes leader)
     * @param config Game configuration settings
     * @return Created room
     */
    public Room createRoom(Player creator, GameConfiguration config) {
        // Generate unique room code
        String roomCode = generateUniqueRoomCode();

        // Build room using Builder pattern
        Room room = new RoomBuilder()
            .withRoomCode(roomCode)
            .withLeader(creator)
            .withConfiguration(config)
            .withPrivate(false)
            .build();

        // Add creator as first player
        room.addPlayer(creator);

        // Register room with GameManager
        gameManager.createRoom(room);

        log.info("Room created: {} by {}", roomCode, creator.getNickname());

        // NOTIFY: Room created via WebSocket
        webSocketObserver.onRoomCreated(room);

        // NOTIFY: Creator joined room via WebSocket
        webSocketObserver.onPlayerJoined(creator, room);

        return room;
    }

    /**
     * Create a private room (not visible in public listings)
     *
     * @param creator Room creator
     * @param config Game configuration
     * @return Created private room
     */
    public Room createPrivateRoom(Player creator, GameConfiguration config) {
        String roomCode = generateUniqueRoomCode();

        Room room = new RoomBuilder()
            .withRoomCode(roomCode)
            .withLeader(creator)
            .withConfiguration(config)
            .withPrivate(true)
            .build();

        room.addPlayer(creator);
        gameManager.createRoom(room);

        log.info("Private room created: {} by {}", roomCode, creator.getNickname());

        // NOTIFY: Private room created via WebSocket
        webSocketObserver.onRoomCreated(room);

        // NOTIFY: Creator joined room via WebSocket
        webSocketObserver.onPlayerJoined(creator, room);

        return room;
    }

    /**
     * Join an existing room
     *
     * Validates:
     * - Room exists
     * - Room not full
     * - Player not already in room
     *
     * @param roomCode 6-character room code
     * @param player Player joining
     * @return Updated room
     * @throws IllegalArgumentException if validation fails
     */
    public Room joinRoom(String roomCode, Player player) {
        Room room = gameManager.getRoom(roomCode);

        // Validate room capacity
        if (room.isFull()) {
            throw new IllegalArgumentException("Room is full: " + roomCode);
        }

        // Check if player already in room
        if (room.hasPlayer(player.getPlayerId())) {
            throw new IllegalArgumentException("Player already in room");
        }

        // Add player to room
        room.addPlayer(player);

        log.info("Player {} joined room {}", player.getNickname(), roomCode);

        // NOTIFY: Player joined room via WebSocket - THIS IS THE KEY FIX!
        // This notifies all other players in the room that someone joined
        webSocketObserver.onPlayerJoined(player, room);

        return room;
    }

    /**
     * Leave a room
     *
     * If leader leaves:
     * - Transfer leadership to another player
     * - Or close room if no players left
     *
     * @param roomCode Room code
     * @param player Player leaving
     * @return Updated room, or null if room closed
     */
    public Room leaveRoom(String roomCode, Player player) {
        Room room = gameManager.getRoom(roomCode);

        // Remove player
        room.removePlayerById(player.getPlayerId());

        log.info("Player {} left room {}", player.getNickname(), roomCode);

        // NOTIFY: Player left room via WebSocket
        webSocketObserver.onPlayerLeft(player, room);

        // If room empty, remove it
        if (room.getPlayers().isEmpty()) {
            gameManager.removeRoom(roomCode);
            webSocketObserver.onRoomDeleted(room);
            log.info("Room {} closed (no players)", roomCode);
            return null;
        }

        // If leader left, transfer leadership
        if (room.getLeader().getPlayerId().equals(player.getPlayerId())) {
            Player newLeader = room.getPlayers().get(0);
            room.setLeader(newLeader);
            log.info("Leadership transferred to {} in room {}", newLeader.getNickname(), roomCode);
        }

        return room;
    }

    /**
     * Add a bot to the room
     *
     * Validates:
     * - Room not full
     * - Max 3 bots per room
     *
     * @param roomCode Room code
     * @return Created bot player
     * @throws IllegalArgumentException if validation fails
     */
    public BotPlayer addBot(String roomCode) {
        Room room = gameManager.getRoom(roomCode);

        // Validate capacity
        if (room.isFull()) {
            throw new IllegalArgumentException("Room is full, cannot add bot");
        }

        // Count existing bots from the bots list
        int botCount = room.getBots().size();

        if (botCount >= 3) {
            throw new IllegalArgumentException("Maximum 3 bots per room");
        }

        // Use Room's addBot() method which handles everything correctly
        BotPlayer bot = room.addBot();

        if (bot == null) {
            throw new IllegalArgumentException("Failed to add bot to room");
        }

        log.info("Bot {} added to room {}", bot.getNickname(), roomCode);

        // NOTIFY: Bot joined room via WebSocket (treat bot like a player joining)
        webSocketObserver.onPlayerJoined(bot, room);

        return bot;
    }

    /**
     * Remove a bot from the room
     *
     * @param roomCode Room code
     * @param botId Bot player ID
     * @return Updated room
     * @throws IllegalArgumentException if bot not found
     */
    public Room removeBot(String roomCode, String botId) {
        Room room = gameManager.getRoom(roomCode);

        // Find bot in the bots list
        Optional<BotPlayer> botOpt = room.getBots().stream()
            .filter(b -> b.getPlayerId().equals(botId))
            .findFirst();

        if (botOpt.isEmpty()) {
            throw new IllegalArgumentException("Bot not found: " + botId);
        }

        BotPlayer bot = botOpt.get();

        // Remove bot using Room's removeBot method
        boolean removed = room.removeBot(bot);

        if (!removed) {
            throw new IllegalArgumentException("Failed to remove bot: " + botId);
        }

        log.info("Bot {} removed from room {}", bot.getNickname(), roomCode);

        // NOTIFY: Bot left room via WebSocket
        webSocketObserver.onPlayerLeft(bot, room);

        return room;
    }

    /**
     * Kick a player from the room (leader only)
     *
     * @param roomCode Room code
     * @param leaderId Leader player ID (for validation)
     * @param targetPlayerId Player to kick
     * @return Updated room
     * @throws IllegalArgumentException if not authorized or player not found
     */
    public Room kickPlayer(String roomCode, String leaderId, String targetPlayerId) {
        Room room = gameManager.getRoom(roomCode);

        // Verify caller is leader
        if (!room.getLeader().getPlayerId().equals(leaderId)) {
            throw new IllegalArgumentException("Only room leader can kick players");
        }

        // Cannot kick self
        if (leaderId.equals(targetPlayerId)) {
            throw new IllegalArgumentException("Leader cannot kick themselves");
        }

        // Find target player
        Optional<Player> targetOpt = room.getPlayers().stream()
            .filter(p -> p.getPlayerId().equals(targetPlayerId))
            .findFirst();

        if (targetOpt.isEmpty()) {
            throw new IllegalArgumentException("Player not found: " + targetPlayerId);
        }

        // Get player reference before removing
        Player kickedPlayer = targetOpt.get();

        // Remove player
        room.removePlayerById(targetPlayerId);

        log.info("Player {} kicked from room {} by leader {}",
            kickedPlayer.getNickname(), roomCode, room.getLeader().getNickname());

        // CRITICAL: Notify all clients via WebSocket that player was kicked
        webSocketObserver.onPlayerLeft(kickedPlayer, room);

        // If room empty (no human players), remove it
        if (room.getPlayers().isEmpty()) {
            gameManager.removeRoom(roomCode);
            webSocketObserver.onRoomDeleted(room);
            log.info("Room {} closed (no players remaining)", roomCode);
            return null;
        }

        // If kicked player was leader, transfer leadership to next player
        if (kickedPlayer.getPlayerId().equals(room.getLeader().getPlayerId())) {
            Player newLeader = room.getPlayers().get(0);
            room.setLeader(newLeader);
            newLeader.setRoomLeader(true);
            log.info("Leadership transferred to {} in room {}", newLeader.getNickname(), roomCode);

            // NOTE: onPlayerLeft() already notified clients, no additional notification needed
        }

        return room;
    }

    /**
     * Transfer room leadership to another player
     *
     * @param roomCode Room code
     * @param currentLeaderId Current leader ID (for validation)
     * @param newLeaderId New leader player ID
     * @return Updated room
     * @throws IllegalArgumentException if validation fails
     */
    public Room transferLeadership(String roomCode, String currentLeaderId, String newLeaderId) {
        Room room = gameManager.getRoom(roomCode);

        // Verify caller is current leader
        if (!room.getLeader().getPlayerId().equals(currentLeaderId)) {
            throw new IllegalArgumentException("Only current leader can transfer leadership");
        }

        // Find new leader
        Optional<Player> newLeaderOpt = room.getPlayers().stream()
            .filter(p -> p.getPlayerId().equals(newLeaderId))
            .findFirst();

        if (newLeaderOpt.isEmpty()) {
            throw new IllegalArgumentException("New leader not found in room");
        }

        // Cannot transfer to bot
        if (newLeaderOpt.get() instanceof BotPlayer) {
            throw new IllegalArgumentException("Cannot transfer leadership to bot");
        }

        // Transfer leadership
        Player newLeader = newLeaderOpt.get();
        room.setLeader(newLeader);

        log.info("Leadership transferred from {} to {} in room {}",
            currentLeaderId, newLeader.getNickname(), roomCode);

        return room;
    }

    /**
     * Get all public rooms (visible in lobby)
     *
     * @return List of public rooms
     */
    public List<Room> getPublicRooms() {
        return gameManager.getPublicRooms();
    }

    /**
     * Get room by code
     *
     * @param roomCode Room code
     * @return Optional<Room> if found
     */
    public Optional<Room> findRoom(String roomCode) {
        return gameManager.findRoom(roomCode);
    }

    /**
     * Check if room exists
     *
     * @param roomCode Room code
     * @return true if exists
     */
    public boolean roomExists(String roomCode) {
        return gameManager.roomExists(roomCode);
    }

    /**
     * Generate a unique room code
     *
     * Keeps generating until a unique code is found.
     *
     * @return Unique 6-character room code
     */
    private String generateUniqueRoomCode() {
        String roomCode;
        int attempts = 0;
        final int MAX_ATTEMPTS = 100;

        do {
            roomCode = CodeGenerator.generateRoomCode();
            attempts++;

            if (attempts >= MAX_ATTEMPTS) {
                throw new RuntimeException("Failed to generate unique room code after " + MAX_ATTEMPTS + " attempts");
            }
        } while (gameManager.roomExists(roomCode));

        return roomCode;
    }
}
