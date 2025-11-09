package com.oneonline.backend.controller;

import com.oneonline.backend.dto.request.AddBotRequest;
import com.oneonline.backend.dto.request.CreateRoomRequest;
import com.oneonline.backend.dto.request.JoinRoomRequest;
import com.oneonline.backend.dto.response.RoomResponse;
import com.oneonline.backend.model.domain.BotPlayer;
import com.oneonline.backend.model.domain.GameConfiguration;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.domain.Room;
import com.oneonline.backend.pattern.creational.builder.GameConfigBuilder;
import com.oneonline.backend.service.game.GameManager;
import com.oneonline.backend.service.game.RoomManager;
import com.oneonline.backend.util.CodeGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * RoomController - REST API for game room management
 *
 * Handles room creation, joining, leaving, and player management.
 *
 * ENDPOINTS:
 * - POST /api/rooms - Create new room
 * - GET /api/rooms/public - List public rooms
 * - POST /api/rooms/{code}/join - Join room
 * - DELETE /api/rooms/{code}/leave - Leave room
 * - PUT /api/rooms/{code}/kick/{playerId} - Kick player (leader only)
 * - POST /api/rooms/{code}/bot - Add bot
 * - DELETE /api/rooms/{code}/bot/{botId} - Remove bot
 * - PUT /api/rooms/{code}/leader/{playerId} - Transfer leadership
 *
 * SECURITY:
 * - All endpoints require authentication
 *
 * @author Juan Gallardo
 */
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@Validated
@Slf4j
@PreAuthorize("isAuthenticated()")
public class RoomController {

    private final RoomManager roomManager;

    /**
     * Create a new game room
     *
     * POST /api/rooms
     *
     * Request body:
     * {
     *   "isPrivate": false,
     *   "maxPlayers": 4,
     *   "turnTimeLimit": 60,
     *   "allowStackingCards": true,
     *   "pointsToWin": 500
     * }
     *
     * Response:
     * {
     *   "roomCode": "ABC123",
     *   "leader": { ... },
     *   "players": [ ... ],
     *   "isPrivate": false,
     *   "status": "WAITING",
     *   "configuration": { ... }
     * }
     *
     * @param request Room configuration
     * @param authentication Current user
     * @return RoomResponse with room details
     */
    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication) {

        log.info("Creating room for user: {}", authentication.getName());

        // Create player from authenticated user
        String playerId = CodeGenerator.generatePlayerId();
        Player creator = Player.builder()
                .playerId(playerId)
                .userEmail(authentication.getName()) // Store user email for identification
                .nickname(authentication.getName())
                .build();

        // Build game configuration
        GameConfiguration config = new GameConfigBuilder()
                .withMaxPlayers(request.getMaxPlayers() != null ? request.getMaxPlayers() : 4)
                .withInitialCardCount(request.getInitialHandSize() != null ? request.getInitialHandSize() : 7)
                .withTurnTimeLimit(request.getTurnTimeLimit() != null ? request.getTurnTimeLimit() : 60)
                .withAllowStackingCards(request.getAllowStackingCards() != null ? request.getAllowStackingCards() : true)
                .withPointsToWin(request.getPointsToWin() != null ? request.getPointsToWin() : 500)
                .withTournamentMode(request.getTournamentMode() != null ? request.getTournamentMode() : false)
                .build();

        // Create room
        Room room = request.getIsPrivate() != null && request.getIsPrivate()
                ? roomManager.createPrivateRoom(creator, config)
                : roomManager.createRoom(creator, config);

        log.info("Room created: {}", room.getRoomCode());

        RoomResponse response = mapToRoomResponse(room);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all public rooms
     *
     * GET /api/rooms/public
     *
     * Returns list of public rooms available to join.
     *
     * @return List of public rooms
     */
    @GetMapping("/public")
    public ResponseEntity<List<RoomResponse>> getPublicRooms() {
        log.debug("Fetching public rooms");

        List<Room> publicRooms = roomManager.getPublicRooms();

        List<RoomResponse> response = publicRooms.stream()
                .map(this::mapToRoomResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Join an existing room
     *
     * POST /api/rooms/{code}/join
     *
     * Request body:
     * {
     *   "nickname": "Player2"
     * }
     *
     * @param code Room code (6 characters)
     * @param request Join request with nickname
     * @param authentication Current user
     * @return Updated room
     */
    @PostMapping("/{code}/join")
    public ResponseEntity<RoomResponse> joinRoom(
            @PathVariable String code,
            @Valid @RequestBody JoinRoomRequest request,
            Authentication authentication) {

        log.info("User {} joining room {}", authentication.getName(), code);

        // Create player
        String playerId = CodeGenerator.generatePlayerId();
        String nickname = request.getNickname() != null ? request.getNickname() : authentication.getName();
        Player player = Player.builder()
                .playerId(playerId)
                .userEmail(authentication.getName()) // Store user email for identification
                .nickname(nickname)
                .build();

        // Join room
        Room room = roomManager.joinRoom(code, player);

        log.info("User {} joined room {}", nickname, code);

        RoomResponse response = mapToRoomResponse(room);
        return ResponseEntity.ok(response);
    }

    /**
     * Leave a room
     *
     * DELETE /api/rooms/{code}/leave
     *
     * If leader leaves, leadership is transferred.
     * If room becomes empty, it's closed.
     *
     * @param code Room code
     * @param authentication Current user
     * @return Success message or updated room
     */
    @DeleteMapping("/{code}/leave")
    public ResponseEntity<?> leaveRoom(
            @PathVariable String code,
            Authentication authentication) {

        log.info("User {} leaving room {}", authentication.getName(), code);

        // Find player in room
        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        Player player = room.getPlayers().stream()
                .filter(p -> p.getNickname().equals(authentication.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not in room"));

        // Leave room
        Room updatedRoom = roomManager.leaveRoom(code, player);

        if (updatedRoom == null) {
            // Room closed
            return ResponseEntity.ok("Room closed");
        }

        RoomResponse response = mapToRoomResponse(updatedRoom);
        return ResponseEntity.ok(response);
    }

    /**
     * Kick a player from the room (leader only)
     *
     * PUT /api/rooms/{code}/kick/{playerId}
     *
     * Only the room leader can kick players.
     *
     * @param code Room code
     * @param playerId Player ID to kick
     * @param authentication Current user (must be leader)
     * @return Updated room
     */
    @PutMapping("/{code}/kick/{playerId}")
    public ResponseEntity<?> kickPlayer(
            @PathVariable String code,
            @PathVariable String playerId,
            Authentication authentication) {

        log.info("Kick request in room {} for player {}", code, playerId);

        // Get leader's player ID from room
        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        String leaderId = room.getLeader().getPlayerId();

        // Kick player
        Room updatedRoom = roomManager.kickPlayer(code, leaderId, playerId);

        log.info("Player {} kicked from room {}", playerId, code);

        // If room was closed (no players remaining), return success message
        if (updatedRoom == null) {
            return ResponseEntity.ok("Room closed - no players remaining");
        }

        RoomResponse response = mapToRoomResponse(updatedRoom);
        return ResponseEntity.ok(response);
    }

    /**
     * Add a bot to the room
     *
     * POST /api/rooms/{code}/bot
     *
     * Request body (optional):
     * {
     *   "difficulty": "MEDIUM"
     * }
     *
     * @param code Room code
     * @param request Bot configuration (optional)
     * @return Updated room with bot added
     */
    @PostMapping("/{code}/bot")
    public ResponseEntity<RoomResponse> addBot(
            @PathVariable String code,
            @RequestBody(required = false) AddBotRequest request) {

        log.info("Adding bot to room {}", code);

        // Add bot (difficulty not used in this version)
        BotPlayer bot = roomManager.addBot(code);

        // Get updated room
        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        log.info("Bot {} added to room {}", bot.getNickname(), code);

        RoomResponse response = mapToRoomResponse(room);
        return ResponseEntity.ok(response);
    }

    /**
     * Remove a bot from the room
     *
     * DELETE /api/rooms/{code}/bot/{botId}
     *
     * @param code Room code
     * @param botId Bot player ID
     * @return Updated room
     */
    @DeleteMapping("/{code}/bot/{botId}")
    public ResponseEntity<RoomResponse> removeBot(
            @PathVariable String code,
            @PathVariable String botId) {

        log.info("Removing bot {} from room {}", botId, code);

        Room room = roomManager.removeBot(code, botId);

        log.info("Bot removed from room {}", code);

        RoomResponse response = mapToRoomResponse(room);
        return ResponseEntity.ok(response);
    }

    /**
     * Transfer room leadership
     *
     * PUT /api/rooms/{code}/leader/{newLeaderId}
     *
     * Current leader can transfer leadership to another player.
     *
     * @param code Room code
     * @param newLeaderId New leader player ID
     * @param authentication Current user (must be current leader)
     * @return Updated room
     */
    @PutMapping("/{code}/leader/{newLeaderId}")
    public ResponseEntity<RoomResponse> transferLeadership(
            @PathVariable String code,
            @PathVariable String newLeaderId,
            Authentication authentication) {

        log.info("Leadership transfer in room {} to player {}", code, newLeaderId);

        // Get current leader ID
        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        String currentLeaderId = room.getLeader().getPlayerId();

        // Transfer leadership
        Room updatedRoom = roomManager.transferLeadership(code, currentLeaderId, newLeaderId);

        log.info("Leadership transferred in room {}", code);

        RoomResponse response = mapToRoomResponse(updatedRoom);
        return ResponseEntity.ok(response);
    }

    /**
     * Get room details
     *
     * GET /api/rooms/{code}
     *
     * @param code Room code
     * @return Room details
     */
    @GetMapping("/{code}")
    public ResponseEntity<RoomResponse> getRoom(@PathVariable String code) {
        log.debug("Fetching room: {}", code);

        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        RoomResponse response = mapToRoomResponse(room);
        return ResponseEntity.ok(response);
    }

    /**
     * Start game from room
     *
     * POST /api/rooms/{code}/start
     *
     * Creates a game session from the room and starts the game.
     * Requires at least 2 players (human or bot).
     *
     * @param code Room code
     * @param authentication Current user (must be leader)
     * @return Room with updated status
     */
    @PostMapping("/{code}/start")
    public ResponseEntity<?> startGame(
            @PathVariable String code,
            Authentication authentication) {

        log.info("Start game request for room {} by {}", code, authentication.getName());

        Room room = roomManager.findRoom(code)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + code));

        // Verify caller is leader
        if (!room.getLeader().getUserEmail().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only room leader can start the game");
        }

        // Validate minimum players
        if (room.getTotalPlayerCount() < 2) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Need at least 2 players to start the game");
        }

        try {
            // Create game session from room
            GameSession session = GameSession.builder()
                    .room(room)
                    .build();

            // Register session with GameManager
            GameManager.getInstance().startGameSession(session);

            // CRITICAL: Initialize the game (deal cards, setup turn order, etc.)
            session.start();

            // Update room status
            room.setStatus(com.oneonline.backend.model.enums.RoomStatus.IN_PROGRESS);
            room.setGameSession(session);

            log.info("Game started for room {}, session ID: {}", code, session.getSessionId());

            // Return session info so frontend knows the sessionId
            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("roomCode", code);
            response.put("status", "STARTED");
            response.put("message", "Game started successfully");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error starting game for room {}: {}", code, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to start game: " + e.getMessage());
        }
    }

    /**
     * Map Room entity to RoomResponse DTO
     *
     * @param room Room entity
     * @return RoomResponse DTO
     */
    private RoomResponse mapToRoomResponse(Room room) {
        // Map ALL players (humans + bots) to PlayerInfo DTOs
        List<RoomResponse.PlayerInfo> playerInfoList = room.getAllPlayers().stream()
                .map(player -> RoomResponse.PlayerInfo.builder()
                        .playerId(player.getPlayerId())
                        .nickname(player.getNickname())
                        .userEmail(player.getUserEmail()) // Include user email for frontend identification
                        .isBot(player instanceof BotPlayer)
                        .status(player.getStatus() != null ? player.getStatus().name() : "WAITING")
                        .isHost(room.getLeader() != null && player.getPlayerId().equals(room.getLeader().getPlayerId()))
                        .build())
                .collect(Collectors.toList());

        // Map game configuration
        RoomResponse.GameConfig config = null;
        if (room.getConfiguration() != null) {
            config = RoomResponse.GameConfig.builder()
                    .initialHandSize(room.getConfiguration().getInitialHandSize())
                    .turnTimeLimit(room.getConfiguration().getTurnTimeLimit())
                    .allowBots(room.getConfiguration().isAllowBots())
                    .maxBots(room.getConfiguration().getMaxBots())
                    .build();
        }

        return RoomResponse.builder()
                .roomId(room.getRoomCode()) // Using roomCode as roomId
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .hostId(room.getLeader() != null ? room.getLeader().getPlayerId() : null)
                .isPrivate(room.isPrivate())
                .status(room.getStatus() != null ? room.getStatus().name() : "WAITING")
                .players(playerInfoList) // Includes ALL players (humans + bots)
                .currentPlayers(room.getTotalPlayerCount()) // Total count including bots
                .maxPlayers(room.getConfiguration() != null ? room.getConfiguration().getMaxPlayers() : 4)
                .config(config)
                .createdAt(room.getCreatedAt() != null ?
                    room.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() :
                    System.currentTimeMillis())
                .build();
    }
}
