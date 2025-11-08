package com.oneonline.backend.pattern.structural.decorator;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * DECORATOR PATTERN - Concrete Decorator for Power-Ups
 *
 * Purpose:
 * Adds temporary power-up abilities to cards that enhance gameplay.
 * Unlike EffectDecorator which modifies card effects, PowerUpDecorator
 * adds player-focused abilities and bonuses.
 *
 * Pattern Benefits:
 * - Add power-ups dynamically without modifying cards
 * - Stack multiple power-ups on same card
 * - Easy to add new power-up types
 * - Temporary/timed power-ups support
 * - Can be combined with EffectDecorator
 *
 * Available Power-Ups:
 * - SHIELD: Protect from next attack card (Draw Two, Draw Four)
 * - VISION: See next player's hand
 * - FORTUNE: Draw extra card from deck
 * - SWAP_HANDS: Swap hands with target player
 * - CHOOSE_COLOR: Force color change to your advantage
 * - UNDO: Cancel last card played (within same turn)
 * - MIRROR: Copy last card effect
 * - SPEED_BOOST: Skip turn time limit for one turn
 * - CARD_BLOCK: Block one specific card type for next player
 * - DRAW_CHOICE: Draw and choose best card to keep
 *
 * Use Cases in ONE Game:
 * - Achievement rewards
 * - Special event bonuses
 * - Tournament power-ups
 * - In-game purchases (if monetized)
 * - Daily login bonuses
 * - Streak rewards
 *
 * Example Usage:
 * <pre>
 * Card normalCard = new DrawTwoCard(CardColor.BLUE);
 * Card shieldedCard = new PowerUpDecorator(normalCard, "SHIELD");
 * // Now playing this card also grants shield to player
 *
 * // Chain multiple power-ups
 * Card superCard = new PowerUpDecorator(
 *     new PowerUpDecorator(normalCard, "SHIELD"),
 *     "VISION"
 * );
 * // Card has both SHIELD and VISION power-ups
 * </pre>
 */
public class PowerUpDecorator extends CardDecorator {

    /**
     * The power-up type
     */
    private final String powerUpType;

    /**
     * Power-up parameters (duration, target, etc.)
     */
    private final Map<String, Object> powerUpParams;

    /**
     * When power-up was activated
     */
    private Instant activationTime;

    /**
     * Duration in seconds (0 = permanent until used)
     */
    private int durationSeconds;

    /**
     * Whether power-up has been used/consumed
     */
    private boolean consumed;

    /**
     * Constructor with power-up type.
     *
     * @param card Card to decorate
     * @param powerUpType Type of power-up
     */
    public PowerUpDecorator(Card card, String powerUpType) {
        super(card);
        if (powerUpType == null || powerUpType.isEmpty()) {
            throw new IllegalArgumentException("Power-up type cannot be null or empty");
        }
        this.powerUpType = powerUpType.toUpperCase();
        this.powerUpParams = new HashMap<>();
        this.consumed = false;
        this.durationSeconds = 0;  // Permanent until used
    }

    /**
     * Constructor with power-up type and duration.
     *
     * @param card Card to decorate
     * @param powerUpType Type of power-up
     * @param durationSeconds Duration in seconds (0 = until used)
     */
    public PowerUpDecorator(Card card, String powerUpType, int durationSeconds) {
        super(card);
        if (powerUpType == null || powerUpType.isEmpty()) {
            throw new IllegalArgumentException("Power-up type cannot be null or empty");
        }
        this.powerUpType = powerUpType.toUpperCase();
        this.powerUpParams = new HashMap<>();
        this.consumed = false;
        this.durationSeconds = durationSeconds;
    }

    /**
     * Apply the card's effect plus activate the power-up.
     *
     * @param session Current game session
     */
    @Override
    public void applyEffect(GameSession session) {
        // Apply base card effect first
        // (Card doesn't have applyEffect, but in real implementation it would)

        // Then activate power-up if not consumed
        if (!consumed && !isExpired()) {
            activatePowerUp(session);
        }
    }

    /**
     * Activate the power-up effect.
     *
     * @param session Game session
     */
    private void activatePowerUp(GameSession session) {
        if (activationTime == null) {
            activationTime = Instant.now();
        }

        switch (powerUpType) {
            case "SHIELD" -> activateShield(session);
            case "VISION" -> activateVision(session);
            case "FORTUNE" -> activateFortune(session);
            case "SWAP_HANDS" -> activateSwapHands(session);
            case "CHOOSE_COLOR" -> activateChooseColor(session);
            case "UNDO" -> activateUndo(session);
            case "MIRROR" -> activateMirror(session);
            case "SPEED_BOOST" -> activateSpeedBoost(session);
            case "CARD_BLOCK" -> activateCardBlock(session);
            case "DRAW_CHOICE" -> activateDrawChoice(session);
            default -> throw new IllegalArgumentException("Unknown power-up: " + powerUpType);
        }

        consumed = true;  // Most power-ups are single-use
    }

    /**
     * SHIELD: Protect from next attack card.
     */
    private void activateShield(GameSession session) {
        if (session != null && session.getCurrentPlayer() != null) {
            powerUpParams.put("shieldActive", true);
            powerUpParams.put("protectedPlayer", session.getCurrentPlayer().getPlayerId());
            // In real implementation, would set shield flag on player
        }
    }

    /**
     * VISION: See next player's hand.
     */
    private void activateVision(GameSession session) {
        if (session != null && session.getTurnOrder() != null) {
            Player nextPlayer = session.getTurnOrder().peek();
            if (nextPlayer != null) {
                powerUpParams.put("revealedHand", nextPlayer.getHand());
                powerUpParams.put("revealedPlayer", nextPlayer.getPlayerId());
                // In real implementation, would send hand info to current player
            }
        }
    }

    /**
     * FORTUNE: Draw extra card from deck.
     */
    private void activateFortune(GameSession session) {
        if (session != null && session.getCurrentPlayer() != null) {
            powerUpParams.put("extraDrawGranted", true);
            // In real implementation, player would draw one extra card
        }
    }

    /**
     * SWAP_HANDS: Swap hands with target player.
     */
    private void activateSwapHands(GameSession session) {
        if (session != null && session.getCurrentPlayer() != null) {
            String targetPlayerId = (String) powerUpParams.get("targetPlayer");
            if (targetPlayerId != null) {
                // In real implementation, would swap hands
                powerUpParams.put("handsSwapped", true);
            }
        }
    }

    /**
     * CHOOSE_COLOR: Force color change.
     */
    private void activateChooseColor(GameSession session) {
        if (session != null) {
            powerUpParams.put("colorChoiceGranted", true);
            // Player gets to choose color even if not playing wild
        }
    }

    /**
     * UNDO: Cancel last card played.
     */
    private void activateUndo(GameSession session) {
        if (session != null && session.getDiscardPile() != null && !session.getDiscardPile().isEmpty()) {
            powerUpParams.put("undoAvailable", true);
            // In real implementation, would restore previous game state
        }
    }

    /**
     * MIRROR: Copy last card effect.
     */
    private void activateMirror(GameSession session) {
        if (session != null && session.getDiscardPile() != null && !session.getDiscardPile().isEmpty()) {
            Card lastCard = session.getDiscardPile().peek();
            powerUpParams.put("mirroredCard", lastCard);
            // Apply same effect as last card
        }
    }

    /**
     * SPEED_BOOST: No turn time limit.
     */
    private void activateSpeedBoost(GameSession session) {
        if (session != null) {
            powerUpParams.put("speedBoostActive", true);
            powerUpParams.put("originalTimeLimit", session.getTurnStartTime());
            // Extend turn time limit significantly
        }
    }

    /**
     * CARD_BLOCK: Block specific card type for next player.
     */
    private void activateCardBlock(GameSession session) {
        if (session != null) {
            String blockedCardType = (String) powerUpParams.get("blockedCardType");
            if (blockedCardType != null) {
                powerUpParams.put("cardBlockActive", true);
                // Next player can't play specified card type
            }
        }
    }

    /**
     * DRAW_CHOICE: Draw and choose best card.
     */
    private void activateDrawChoice(GameSession session) {
        if (session != null && session.getCurrentPlayer() != null) {
            powerUpParams.put("drawChoiceGranted", true);
            // Player draws 3 cards and keeps best one, others go back
        }
    }

    /**
     * Check if power-up has expired.
     *
     * @return true if expired
     */
    public boolean isExpired() {
        if (durationSeconds == 0) {
            return false;  // Permanent until used
        }
        if (activationTime == null) {
            return false;  // Not activated yet
        }
        Instant expirationTime = activationTime.plusSeconds(durationSeconds);
        return Instant.now().isAfter(expirationTime);
    }

    /**
     * Check if power-up is still active.
     *
     * @return true if active and not expired
     */
    public boolean isActive() {
        return !consumed && !isExpired();
    }

    /**
     * Manually consume the power-up.
     */
    public void consume() {
        this.consumed = true;
    }

    /**
     * Reset power-up (allow reuse).
     * Useful for testing or special game modes.
     */
    public void reset() {
        this.consumed = false;
        this.activationTime = null;
        this.powerUpParams.clear();
    }

    /**
     * Get power-up type.
     *
     * @return Power-up type
     */
    public String getPowerUpType() {
        return powerUpType;
    }

    /**
     * Get remaining duration in seconds.
     *
     * @return Seconds remaining (0 if permanent/expired)
     */
    public long getRemainingSeconds() {
        if (durationSeconds == 0 || activationTime == null) {
            return 0;
        }
        Instant expirationTime = activationTime.plusSeconds(durationSeconds);
        long remaining = expirationTime.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    /**
     * Get power-up parameters.
     *
     * @return Map of parameters
     */
    public Map<String, Object> getPowerUpParams() {
        return new HashMap<>(powerUpParams);
    }

    /**
     * Set power-up parameter.
     *
     * @param key Parameter name
     * @param value Parameter value
     */
    public void setPowerUpParam(String key, Object value) {
        powerUpParams.put(key, value);
    }

    /**
     * Get power-up parameter.
     *
     * @param key Parameter name
     * @return Parameter value
     */
    public Object getPowerUpParam(String key) {
        return powerUpParams.get(key);
    }

    /**
     * Get power-up description.
     *
     * @return Human-readable description
     */
    public String getPowerUpDescription() {
        return switch (powerUpType) {
            case "SHIELD" -> "Blocks next attack card";
            case "VISION" -> "Reveals next player's hand";
            case "FORTUNE" -> "Draw one extra card";
            case "SWAP_HANDS" -> "Swap hands with another player";
            case "CHOOSE_COLOR" -> "Force color change";
            case "UNDO" -> "Cancel last card played";
            case "MIRROR" -> "Copy last card's effect";
            case "SPEED_BOOST" -> "No turn time limit";
            case "CARD_BLOCK" -> "Block card type for next player";
            case "DRAW_CHOICE" -> "Draw 3, keep 1";
            default -> "Unknown power-up";
        };
    }

    @Override
    public String toString() {
        String status = consumed ? "used" : (isExpired() ? "expired" : "active");
        return String.format("PowerUpDecorator[powerUp=%s, status=%s, card=%s]",
                powerUpType, status, decoratedCard.toString());
    }

    /**
     * Check if this is a defensive power-up.
     *
     * @return true if defensive (Shield, etc.)
     */
    public boolean isDefensive() {
        return "SHIELD".equals(powerUpType);
    }

    /**
     * Check if this is an offensive power-up.
     *
     * @return true if offensive (Card Block, etc.)
     */
    public boolean isOffensive() {
        return "CARD_BLOCK".equals(powerUpType) || "SWAP_HANDS".equals(powerUpType);
    }

    /**
     * Check if this is an information power-up.
     *
     * @return true if reveals information (Vision)
     */
    public boolean isInformational() {
        return "VISION".equals(powerUpType);
    }
}
