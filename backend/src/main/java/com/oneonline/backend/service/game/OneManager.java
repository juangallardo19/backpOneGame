package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * OneManager Service
 *
 * Manages "ONE" calls when players have one card remaining.
 *
 * ONE RULES:
 * - When player has exactly 1 card, must call "ONE"
 * - If not called and caught by another player, penalized with +2 cards
 * - Must call ONE before next player starts their turn
 *
 * RESPONSIBILITIES:
 * - Track ONE calls
 * - Validate ONE eligibility
 * - Apply penalties for missed ONE calls
 * - Detect when ONE should be called
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
public class OneManager {

    /**
     * Penalty for not calling ONE
     */
    private static final int NO_ONE_PENALTY = 2;

    /**
     * Time window to call ONE (milliseconds)
     * Players have this much time to call ONE after playing their second-to-last card
     */
    private static final long ONE_CALL_WINDOW_MS = 3000; // 3 seconds

    /**
     * Tracks when players reached 1 card (for penalty window)
     * Key: Player ID, Value: Timestamp when they reached 1 card
     */
    private final Map<String, LocalDateTime> oneCardTimestamps = new HashMap<>();

    /**
     * Call ONE for a player
     *
     * Validates:
     * - Player has 1 or 2 cards (can call preemptively with 2 cards before playing)
     * - ONE not already called
     *
     * UNO RULE: Players must call ONE BEFORE playing their second-to-last card.
     * Therefore, we allow calling ONE when player has 2 cards (anticipatory call).
     *
     * @param player Player calling ONE
     * @param session Game session
     * @return true if ONE call successful, false if invalid
     */
    public boolean callOne(Player player, GameSession session) {
        int handSize = player.getHandSize();

        // Check if player has 1 or 2 cards (valid UNO call states)
        if (handSize < 1 || handSize > 2) {
            log.warn("Player {} attempted to call ONE with {} cards (must have 1 or 2 cards)",
                player.getNickname(), handSize);
            return false;
        }

        // Check if already called
        if (player.hasCalledOne()) {
            log.warn("Player {} already called ONE", player.getNickname());
            return false;
        }

        // Mark ONE as called
        player.callOne();

        // Remove from penalty tracking
        oneCardTimestamps.remove(player.getPlayerId());

        log.info("Player {} called ONE! ({} card(s) remaining)", player.getNickname(), handSize);
        return true;
    }

    /**
     * Check if player should call ONE
     *
     * Called after player plays a card.
     * If player now has 1 card, start penalty timer.
     *
     * @param player Player to check
     * @return true if player has 1 card and should call ONE
     */
    public boolean checkOneCall(Player player) {
        if (hasOneCard(player)) {
            // Start penalty timer if not already started
            oneCardTimestamps.putIfAbsent(player.getPlayerId(), LocalDateTime.now());
            return true;
        } else {
            // Player has 0 or 2+ cards, reset ONE status
            player.resetOneCall();
            oneCardTimestamps.remove(player.getPlayerId());
            return false;
        }
    }

    /**
     * Penalize player for not calling ONE
     *
     * Called when:
     * - Another player catches them
     * - Time window expires
     *
     * @param player Player to penalize
     * @param session Game session
     * @return Number of cards drawn as penalty
     */
    public int penalizeNoOne(Player player, GameSession session) {
        // Check if player has 1 card and hasn't called ONE
        if (!hasOneCard(player)) {
            log.warn("Cannot penalize {} - doesn't have 1 card", player.getNickname());
            return 0;
        }

        if (player.hasCalledOne()) {
            log.warn("Cannot penalize {} - ONE already called", player.getNickname());
            return 0;
        }

        // Draw penalty cards
        for (int i = 0; i < NO_ONE_PENALTY; i++) {
            Card card = session.getDeck().drawCard();
            if (card != null) {
                player.drawCard(card);
            } else {
                // Deck empty, refill from discard pile
                session.getDeck().refillFromDiscard(session.getDiscardPile());
                card = session.getDeck().drawCard();
                if (card != null) {
                    player.drawCard(card);
                }
            }
        }

        // Reset ONE call status
        player.resetOneCall();
        oneCardTimestamps.remove(player.getPlayerId());

        log.info("Player {} penalized for not calling ONE: +{} cards",
            player.getNickname(), NO_ONE_PENALTY);

        return NO_ONE_PENALTY;
    }

    /**
     * Check if player has exactly one card
     *
     * @param player Player to check
     * @return true if exactly 1 card
     */
    public boolean hasOneCard(Player player) {
        return player.getHandSize() == 1;
    }

    /**
     * Check if player is eligible to call ONE
     *
     * @param player Player to check
     * @return true if has 1 card and hasn't called yet
     */
    public boolean canCallOne(Player player) {
        return hasOneCard(player) && !player.hasCalledOne();
    }

    /**
     * Check if ONE call window has expired
     *
     * Players have limited time to call ONE after reaching 1 card.
     *
     * @param playerId Player ID
     * @return true if window expired
     */
    public boolean hasOneWindowExpired(String playerId) {
        LocalDateTime timestamp = oneCardTimestamps.get(playerId);
        if (timestamp == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        long elapsedMs = java.time.Duration.between(timestamp, now).toMillis();

        return elapsedMs > ONE_CALL_WINDOW_MS;
    }

    /**
     * Auto-check and penalize expired ONE windows
     *
     * Called at end of each turn to check if any player
     * missed their ONE call window.
     *
     * @param session Game session
     * @return Number of players penalized
     */
    public int checkAndPenalizeExpiredWindows(GameSession session) {
        int penalized = 0;

        for (Player player : session.getPlayers()) {
            if (hasOneCard(player) &&
                !player.hasCalledOne() &&
                hasOneWindowExpired(player.getPlayerId())) {

                penalizeNoOne(player, session);
                penalized++;
            }
        }

        return penalized;
    }

    /**
     * Catch another player who didn't call ONE
     *
     * Any player can call out another player who has 1 card
     * but didn't call ONE.
     *
     * @param caughtPlayer Player who was caught
     * @param catchingPlayer Player who caught them
     * @param session Game session
     * @return true if catch was valid and penalty applied
     */
    public boolean catchPlayerWithoutOne(Player caughtPlayer, Player catchingPlayer, GameSession session) {
        // Validate catch
        if (!hasOneCard(caughtPlayer)) {
            log.warn("{} attempted to catch {} but they don't have 1 card",
                catchingPlayer.getNickname(), caughtPlayer.getNickname());
            return false;
        }

        if (caughtPlayer.hasCalledOne()) {
            log.warn("{} attempted to catch {} but ONE was already called",
                catchingPlayer.getNickname(), caughtPlayer.getNickname());
            return false;
        }

        // Apply penalty
        penalizeNoOne(caughtPlayer, session);

        log.info("{} caught {} without ONE call!",
            catchingPlayer.getNickname(), caughtPlayer.getNickname());

        return true;
    }

    /**
     * Reset ONE status for player
     *
     * Called when player draws/plays cards and no longer has 1 card.
     *
     * @param player Player to reset
     */
    public void resetOneStatus(Player player) {
        player.resetOneCall();
        oneCardTimestamps.remove(player.getPlayerId());
    }

    /**
     * Clear all ONE tracking data
     *
     * Called at end of game or round.
     */
    public void clearAll() {
        oneCardTimestamps.clear();
        log.debug("ONE tracking data cleared");
    }

    /**
     * Get number of players who need to call ONE
     *
     * @param session Game session
     * @return Count of players with 1 card who haven't called ONE
     */
    public int getPlayersNeedingOneCall(GameSession session) {
        return (int) session.getPlayers().stream()
            .filter(this::hasOneCard)
            .filter(p -> !p.hasCalledOne())
            .count();
    }
}
