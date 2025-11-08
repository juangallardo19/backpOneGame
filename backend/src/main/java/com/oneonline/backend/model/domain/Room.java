package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.RoomStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;

/**
 * Represents a game room where players can join and play ONE.
 *
 * Manages players, bots, and game configuration.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    /**
     * Unique identifier for this room
     */
    @Builder.Default
    private String roomId = UUID.randomUUID().toString();

    /**
     * 6-character alphanumeric code for joining the room
     */
    private String roomCode;

    /**
     * Room leader (creator) who can modify settings
     */
    private Player roomLeader;

    /**
     * List of human players in the room (max 4 total including bots)
     */
    @Builder.Default
    private List<Player> players = new ArrayList<>();

    /**
     * List of bot players in the room
     */
    @Builder.Default
    private List<BotPlayer> bots = new ArrayList<>();

    /**
     * Whether the room is private (requires code to join)
     */
    @Builder.Default
    private boolean privateRoom = false;

    /**
     * Game configuration for this room
     */
    @Builder.Default
    private GameConfiguration config = GameConfiguration.getDefault();

    /**
     * Active game session (null if no game in progress)
     */
    private GameSession gameSession;

    /**
     * Current status of the room
     */
    @Builder.Default
    private RoomStatus status = RoomStatus.WAITING;

    /**
     * Maximum total players (humans + bots)
     */
    private static final int MAX_TOTAL_PLAYERS = 4;

    /**
     * Minimum players to start a game
     */
    private static final int MIN_PLAYERS_TO_START = 2;

    /**
     * Generate a random 6-character room code
     *
     * @return 6-character alphanumeric code (uppercase)
     */
    public static String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        StringBuilder code = new StringBuilder(6);

        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        return code.toString();
    }

    /**
     * Initialize room with a generated code
     */
    public void initializeRoomCode() {
        if (this.roomCode == null || this.roomCode.isEmpty()) {
            this.roomCode = generateRoomCode();
        }
    }

    /**
     * Add a player to the room
     *
     * @param player The player to add
     * @return true if player was added successfully
     */
    public boolean addPlayer(Player player) {
        if (getTotalPlayerCount() >= MAX_TOTAL_PLAYERS) {
            return false;
        }

        if (status != RoomStatus.WAITING) {
            return false;
        }

        if (!players.contains(player)) {
            players.add(player);

            // First player becomes room leader
            if (players.size() == 1) {
                roomLeader = player;
                player.setRoomLeader(true);
            }

            return true;
        }

        return false;
    }

    /**
     * Remove a player from the room
     *
     * @param player The player to remove
     * @return true if player was removed
     */
    public boolean removePlayer(Player player) {
        if (status == RoomStatus.IN_PROGRESS) {
            return false; // Cannot remove during game
        }

        boolean removed = players.remove(player);

        if (removed && player.equals(roomLeader)) {
            // Transfer leadership to next player
            transferLeadership();
        }

        return removed;
    }

    /**
     * Add a bot to the room
     *
     * @return The created bot, or null if room is full
     */
    public BotPlayer addBot() {
        if (getTotalPlayerCount() >= MAX_TOTAL_PLAYERS) {
            return null;
        }

        if (status != RoomStatus.WAITING) {
            return null;
        }

        BotPlayer bot = BotPlayer.builder()
                .nickname("Bot_" + (bots.size() + 1))
                .temporary(false)
                .build();

        bots.add(bot);
        return bot;
    }

    /**
     * Remove a bot from the room
     *
     * @param bot The bot to remove
     * @return true if bot was removed
     */
    public boolean removeBot(BotPlayer bot) {
        if (status == RoomStatus.IN_PROGRESS) {
            return false;
        }

        return bots.remove(bot);
    }

    /**
     * Get total number of players (humans + bots)
     *
     * @return Total player count
     */
    public int getTotalPlayerCount() {
        return players.size() + bots.size();
    }

    /**
     * Get all players (humans + bots) combined
     *
     * @return List of all players
     */
    public List<Player> getAllPlayers() {
        List<Player> allPlayers = new ArrayList<>(players);
        allPlayers.addAll(bots);
        return allPlayers;
    }

    /**
     * Check if room can start a game
     *
     * @return true if minimum player count is met
     */
    public boolean canStart() {
        return getTotalPlayerCount() >= MIN_PLAYERS_TO_START &&
               getTotalPlayerCount() <= MAX_TOTAL_PLAYERS &&
               status == RoomStatus.WAITING;
    }

    /**
     * Transfer room leadership to the next player
     */
    public void transferLeadership() {
        if (roomLeader != null) {
            roomLeader.setRoomLeader(false);
        }

        if (!players.isEmpty()) {
            roomLeader = players.get(0);
            roomLeader.setRoomLeader(true);
        } else {
            roomLeader = null;
        }
    }

    /**
     * Transfer leadership to a specific player
     *
     * @param newLeader The new room leader
     * @return true if leadership was transferred
     */
    public boolean transferLeadership(Player newLeader) {
        if (!players.contains(newLeader)) {
            return false;
        }

        if (roomLeader != null) {
            roomLeader.setRoomLeader(false);
        }

        roomLeader = newLeader;
        newLeader.setRoomLeader(true);

        return true;
    }

    /**
     * Kick a player from the room (leader only)
     *
     * @param player The player to kick
     * @return true if player was kicked
     */
    public boolean kickPlayer(Player player) {
        if (player.equals(roomLeader)) {
            return false; // Cannot kick leader
        }

        return removePlayer(player);
    }

    /**
     * Start the game session
     *
     * @return The created game session, or null if cannot start
     */
    public GameSession startGame() {
        if (!canStart()) {
            return null;
        }

        status = RoomStatus.STARTING;

        gameSession = GameSession.builder()
                .room(this)
                .build();

        gameSession.start();

        status = RoomStatus.IN_PROGRESS;

        return gameSession;
    }

    /**
     * End the current game session
     */
    public void endGame() {
        gameSession = null;
        status = RoomStatus.FINISHED;
    }

    /**
     * Reset room for a new game
     */
    public void reset() {
        gameSession = null;
        status = RoomStatus.WAITING;

        // Clear player hands
        for (Player player : getAllPlayers()) {
            player.resetHand();
        }
    }

    /**
     * Get room leader (alias method for compatibility)
     *
     * @return Room leader
     */
    public Player getLeader() {
        return roomLeader;
    }

    /**
     * Set room leader (alias method for compatibility)
     *
     * @param player New leader
     */
    public void setLeader(Player player) {
        this.roomLeader = player;
    }

    /**
     * Check if room is private (alias method for compatibility)
     *
     * @return true if private
     */
    public boolean isPrivate() {
        return privateRoom;
    }

    /**
     * Get game configuration (alias method for compatibility)
     *
     * @return Game configuration
     */
    public GameConfiguration getConfiguration() {
        return config;
    }

    /**
     * Check if room is full (alias method for compatibility)
     *
     * @return true if full
     */
    public boolean isFull() {
        return getTotalPlayerCount() >= 4;
    }

    /**
     * Check if player is in room (alias method for compatibility)
     *
     * @param playerId Player ID
     * @return true if player in room
     */
    public boolean hasPlayer(String playerId) {
        return getAllPlayers().stream().anyMatch(p -> p.getPlayerId().equals(playerId));
    }

    /**
     * Remove player by ID (alias method for compatibility)
     *
     * @param playerId Player ID to remove
     * @return true if removed
     */
    public boolean removePlayerById(String playerId) {
        Player player = getAllPlayers().stream()
            .filter(p -> p.getPlayerId().equals(playerId))
            .findFirst().orElse(null);

        if (player == null) {
            return false;
        }

        if (player instanceof BotPlayer) {
            return bots.remove(player);
        }
        return players.remove(player);
    }

    @Override
    public String toString() {
        return "Room " + roomCode + " [" + status + "] - " +
               getTotalPlayerCount() + " players (" +
               players.size() + " human, " + bots.size() + " bots)";
    }
}
