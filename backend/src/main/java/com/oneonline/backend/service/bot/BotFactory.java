package com.oneonline.backend.service.bot;

import com.oneonline.backend.model.domain.BotPlayer;
import com.oneonline.backend.model.domain.Player;
import lombok.extern.slf4j.Slf4j;

/**
 * BotFactory - Factory Method Pattern for creating Bot Players
 *
 * This factory creates bot players for the ONE Online game.
 *
 * DESIGN PATTERN: Factory Method
 * - Static factory methods for creating different types of bots
 * - No instance creation (utility class)
 *
 * BOT TYPES:
 * 1. Regular Bot: General purpose bot with auto-incrementing name (Bot1, Bot2, etc.)
 * 2. Temporary Bot: Replacement bot for disconnected players (RF16 - Reconnection System)
 *
 * USAGE:
 * - createBot() - Creates a regular bot player
 * - createTemporaryBot(Player) - Creates a temporary replacement bot
 * - restoreOriginalPlayer(BotPlayer) - Restores original player from temp bot
 *
 * @author Juan Gallardo
 */
@Slf4j
public final class BotFactory {

    /**
     * Counter for auto-incrementing bot names (Bot1, Bot2, Bot3, etc.)
     */
    private static int botCounter = 1;

    /**
     * Private constructor to prevent instantiation
     */
    private BotFactory() {
        throw new UnsupportedOperationException("Utility class - cannot be instantiated");
    }

    /**
     * Create a regular bot player with auto-incrementing name
     *
     * WORKFLOW:
     * 1. Generate nickname: "Bot" + counter
     * 2. Increment counter
     * 3. Create BotPlayer with generated nickname
     * 4. Return bot player
     *
     * EXAMPLE:
     * - First call: Bot1
     * - Second call: Bot2
     * - Third call: Bot3
     *
     * Used for:
     * - Filling empty slots in game rooms
     * - Testing games with AI opponents
     *
     * @return New BotPlayer instance with unique name
     */
    public static BotPlayer createBot() {
        String nickname = "Bot" + botCounter++;
        log.debug("Creating regular bot: {}", nickname);

        BotPlayer bot = BotPlayer.builder()
                .nickname(nickname)
                .temporary(false)
                .originalPlayer(null)
                .build();

        log.info("Regular bot created: {}", nickname);
        return bot;
    }

    /**
     * Create a temporary bot to replace a disconnected player
     *
     * WORKFLOW:
     * 1. Create temporary bot with name "TempBot_[original player nickname]"
     * 2. Mark bot as temporary
     * 3. Store reference to original player
     * 4. Copy player state (hand, score, etc.)
     * 5. Return temporary bot
     *
     * RECONNECTION SYSTEM (RF16):
     * - When player disconnects, they are replaced by a temporary bot
     * - Bot plays on behalf of disconnected player
     * - When player reconnects, bot is replaced by original player
     * - Player state is preserved during disconnection
     *
     * Used for:
     * - Player disconnection handling
     * - Maintaining game flow during network issues
     * - Reconnection system (RF16)
     *
     * @param originalPlayer The player who disconnected
     * @return Temporary BotPlayer with copied state
     */
    public static BotPlayer createTemporaryBot(Player originalPlayer) {
        if (originalPlayer == null) {
            throw new IllegalArgumentException("Original player cannot be null");
        }

        String tempNickname = "TempBot_" + originalPlayer.getNickname();
        log.debug("Creating temporary bot for player: {}", originalPlayer.getNickname());

        BotPlayer tempBot = BotPlayer.builder()
                .nickname(tempNickname)
                .temporary(true)
                .originalPlayer(originalPlayer)
                .build();

        // Copy player state from original player
        tempBot.setHand(originalPlayer.getHand()); // Copy hand reference
        tempBot.setScore(originalPlayer.getScore());
        tempBot.setPlayerId(originalPlayer.getPlayerId()); // Keep same player ID
        tempBot.setRoomLeader(originalPlayer.isRoomLeader());
        tempBot.setStatus(originalPlayer.getStatus());
        tempBot.setCalledUno(originalPlayer.isCalledUno()); // ONE call status
        tempBot.setConnected(true); // Bot is always connected

        log.info("Temporary bot created: {} replacing {}", tempNickname, originalPlayer.getNickname());
        return tempBot;
    }

    /**
     * Restore original player from temporary bot
     *
     * WORKFLOW:
     * 1. Verify bot is temporary
     * 2. Get original player reference
     * 3. Copy updated state from bot to original player
     * 4. Return original player
     *
     * STATE RESTORATION:
     * - Hand is copied (may have changed during bot play)
     * - Score is copied (may have increased)
     * - ONE call status is copied
     * - Player is marked as connected
     *
     * Used for:
     * - Player reconnection
     * - Restoring player state after disconnection
     *
     * @param tempBot The temporary bot to restore from
     * @return Original Player with updated state
     * @throws IllegalStateException if bot is not temporary
     * @throws IllegalArgumentException if bot or original player is null
     */
    public static Player restoreOriginalPlayer(BotPlayer tempBot) {
        if (tempBot == null) {
            throw new IllegalArgumentException("Temporary bot cannot be null");
        }

        if (!tempBot.isTemporary()) {
            throw new IllegalStateException("Bot is not temporary - cannot restore original player");
        }

        Player originalPlayer = tempBot.getOriginalPlayer();
        if (originalPlayer == null) {
            throw new IllegalStateException("No original player reference found in temporary bot");
        }

        log.debug("Restoring original player: {} from {}",
                originalPlayer.getNickname(), tempBot.getNickname());

        // Restore updated state from bot to original player
        originalPlayer.setHand(tempBot.getHand()); // Restore hand (may have changed)
        originalPlayer.setScore(tempBot.getScore()); // Restore score (may have increased)
        originalPlayer.setCalledUno(tempBot.isCalledUno()); // Restore ONE status
        originalPlayer.setConnected(true); // Mark player as reconnected

        log.info("Original player restored: {} (hand: {} cards, score: {})",
                originalPlayer.getNickname(),
                originalPlayer.getHand().size(),
                originalPlayer.getScore());

        return originalPlayer;
    }

    /**
     * Reset bot counter (for testing purposes)
     *
     * Resets the bot counter to 1, so next bot will be Bot1.
     *
     * WARNING: Should only be used in tests
     */
    public static void resetBotCounter() {
        log.debug("Resetting bot counter from {} to 1", botCounter);
        botCounter = 1;
    }

    /**
     * Get current bot counter value
     *
     * Used for:
     * - Testing
     * - Debugging
     *
     * @return Current bot counter value
     */
    public static int getBotCounter() {
        return botCounter;
    }

    /**
     * Check if a player is a bot
     *
     * Used for:
     * - Determining if player is AI
     * - Skipping certain operations for bots
     *
     * @param player Player to check
     * @return true if player is a bot, false otherwise
     */
    public static boolean isBot(Player player) {
        return player instanceof BotPlayer;
    }

    /**
     * Check if a player is a temporary bot
     *
     * Used for:
     * - Reconnection system
     * - Determining if player can be replaced
     *
     * @param player Player to check
     * @return true if player is a temporary bot, false otherwise
     */
    public static boolean isTemporaryBot(Player player) {
        if (player instanceof BotPlayer) {
            return ((BotPlayer) player).isTemporary();
        }
        return false;
    }
}
