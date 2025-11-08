package com.oneonline.backend.pattern.structural.decorator;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Consumer;

/**
 * DECORATOR PATTERN - Concrete Decorator for Special Effects
 *
 * Purpose:
 * Adds special game effects to cards dynamically without modifying
 * the original card classes. Implements specific effect behaviors
 * that can be applied to any card.
 *
 * Pattern Benefits:
 * - Add effects to cards at runtime
 * - Combine multiple effects on same card
 * - Easy to add new effect types
 * - No need to modify existing card classes
 *
 * Available Effects:
 * - DOUBLE_POINTS: Card worth 2x points when played
 * - SKIP_NEXT_TWO: Skips two players instead of one
 * - REVERSE_TWICE: Reverses direction twice (effectively no change, but counts as action)
 * - DRAW_EXTRA: Opponent draws one extra card
 * - REFLECT: Reflects the effect back to previous player
 * - IMMUNITY: Player immune to next attack card
 * - STEAL_TURN: Player gets another turn immediately
 * - COLOR_WILD: Card can be played on any color
 *
 * Use Cases in ONE Game:
 * - Special event cards during tournaments
 * - Power-up cards from achievements
 * - Temporary buffs from game events
 * - Custom game modes with special rules
 *
 * Example Usage:
 * <pre>
 * Card skipCard = new SkipCard(CardColor.RED);
 * Card poweredSkip = new EffectDecorator(skipCard, "SKIP_NEXT_TWO");
 * poweredSkip.applyEffect(gameSession);  // Skips 2 players instead of 1
 * </pre>
 */
public class EffectDecorator extends CardDecorator {

    /**
     * The effect type identifier
     */
    private final String effectType;

    /**
     * Additional parameters for the effect
     */
    private final Map<String, Object> effectParams;

    /**
     * Registry of available effects and their implementations
     */
    private static final Map<String, Consumer<GameSession>> EFFECT_REGISTRY = new HashMap<>();

    static {
        // Initialize effect implementations
        initializeEffects();
    }

    /**
     * Constructor with effect type.
     *
     * @param card Card to decorate
     * @param effectType Type of effect to apply
     */
    public EffectDecorator(Card card, String effectType) {
        super(card);
        if (effectType == null || effectType.isEmpty()) {
            throw new IllegalArgumentException("Effect type cannot be null or empty");
        }
        this.effectType = effectType.toUpperCase();
        this.effectParams = new HashMap<>();
    }

    /**
     * Constructor with effect type and parameters.
     *
     * @param card Card to decorate
     * @param effectType Type of effect to apply
     * @param params Additional parameters for the effect
     */
    public EffectDecorator(Card card, String effectType, Map<String, Object> params) {
        super(card);
        if (effectType == null || effectType.isEmpty()) {
            throw new IllegalArgumentException("Effect type cannot be null or empty");
        }
        this.effectType = effectType.toUpperCase();
        this.effectParams = params != null ? new HashMap<>(params) : new HashMap<>();
    }

    /**
     * Apply the decorated card's effect PLUS the special effect.
     *
     * This is the core of the Decorator pattern - we first apply the
     * base card's effect, then add our special effect on top.
     *
     * @param session Current game session
     */
    @Override
    public void applyEffect(GameSession session) {
        // First apply the base card's effect
        applyBaseEffect(session);

        // Then apply the special effect
        applySpecialEffect(session);
    }

    /**
     * Apply the base card's effect.
     *
     * Since Card is abstract and doesn't have an applyEffect method,
     * we simulate it based on card type.
     *
     * @param session Game session
     */
    private void applyBaseEffect(GameSession session) {
        // This would normally call decoratedCard.applyEffect(session)
        // but since base Card doesn't have this method, we handle it here
        // In a real implementation, Card would have an applyEffect method
    }

    /**
     * Apply the special effect based on effect type.
     *
     * @param session Game session
     */
    private void applySpecialEffect(GameSession session) {
        switch (effectType) {
            case "DOUBLE_POINTS" -> applyDoublePoints(session);
            case "SKIP_NEXT_TWO" -> applySkipNextTwo(session);
            case "REVERSE_TWICE" -> applyReverseTwice(session);
            case "DRAW_EXTRA" -> applyDrawExtra(session);
            case "REFLECT" -> applyReflect(session);
            case "IMMUNITY" -> applyImmunity(session);
            case "STEAL_TURN" -> applyStealTurn(session);
            case "COLOR_WILD" -> applyColorWild(session);
            default -> throw new IllegalArgumentException("Unknown effect type: " + effectType);
        }
    }

    /**
     * DOUBLE_POINTS effect: Card worth 2x points.
     */
    private void applyDoublePoints(GameSession session) {
        // Points are calculated when card is played
        // This effect is handled in getValue() override
    }

    /**
     * SKIP_NEXT_TWO effect: Skip two players instead of one.
     */
    private void applySkipNextTwo(GameSession session) {
        if (session != null && session.getTurnManager() != null) {
            // Skip one additional player (base skip already skips one)
            session.getTurnManager().skipNextPlayer();
        }
    }

    /**
     * REVERSE_TWICE effect: Reverse direction twice.
     */
    private void applyReverseTwice(GameSession session) {
        if (session != null) {
            session.setClockwise(!session.isClockwise());
            session.setClockwise(!session.isClockwise());
        }
    }

    /**
     * DRAW_EXTRA effect: Next player draws one extra card.
     */
    private void applyDrawExtra(GameSession session) {
        if (session != null) {
            int currentDraw = session.getPendingDrawCount();
            session.setPendingDrawCount(currentDraw + 1);
        }
    }

    /**
     * REFLECT effect: Reflect the card's effect back to previous player.
     */
    private void applyReflect(GameSession session) {
        if (session != null && session.getTurnManager() != null) {
            // Reverse direction temporarily to get previous player
            session.getTurnManager().reverseTurnOrder();
            Player previousPlayer = session.getTurnManager().peekNextPlayer();
            session.getTurnManager().reverseTurnOrder();

            // Apply effect to previous player
            // Implementation would depend on card type
        }
    }

    /**
     * IMMUNITY effect: Current player immune to next attack card.
     */
    private void applyImmunity(GameSession session) {
        if (session != null && session.getCurrentPlayer() != null) {
            // Set immunity flag on player
            // Would need immunity field in Player class
            effectParams.put("immunityGranted", true);
        }
    }

    /**
     * STEAL_TURN effect: Current player gets another turn.
     */
    private void applyStealTurn(GameSession session) {
        if (session != null && session.getTurnManager() != null) {
            // Reverse direction, advance turn, then reverse back
            // This effectively gives current player another turn
            session.getTurnManager().reverseTurnOrder();
            session.getTurnManager().nextTurn();
            session.getTurnManager().reverseTurnOrder();
        }
    }

    /**
     * COLOR_WILD effect: Card can be played on any color.
     */
    private void applyColorWild(GameSession session) {
        // This effect is handled in canPlayOn() override
    }

    /**
     * Override getValue to apply DOUBLE_POINTS effect.
     *
     * @return Card value (doubled if DOUBLE_POINTS effect active)
     */
    @Override
    public int getValue() {
        int baseValue = decoratedCard.getValue();
        if ("DOUBLE_POINTS".equals(effectType)) {
            return baseValue * 2;
        }
        return baseValue;
    }

    /**
     * Override canPlayOn to apply COLOR_WILD effect.
     *
     * @param topCard Top card on discard pile
     * @return true if can play
     */
    @Override
    public boolean canPlayOn(Card topCard) {
        if ("COLOR_WILD".equals(effectType)) {
            return true;  // Can play on any card
        }
        return decoratedCard.canPlayOn(topCard);
    }

    /**
     * Get the effect type.
     *
     * @return Effect type identifier
     */
    public String getEffectType() {
        return effectType;
    }

    /**
     * Get effect parameters.
     *
     * @return Map of effect parameters
     */
    public Map<String, Object> getEffectParams() {
        return new HashMap<>(effectParams);
    }

    /**
     * Set an effect parameter.
     *
     * @param key Parameter name
     * @param value Parameter value
     */
    public void setEffectParam(String key, Object value) {
        effectParams.put(key, value);
    }

    /**
     * Get an effect parameter.
     *
     * @param key Parameter name
     * @return Parameter value, or null if not set
     */
    public Object getEffectParam(String key) {
        return effectParams.get(key);
    }

    /**
     * Check if effect is active.
     *
     * Some effects might have duration or conditions.
     *
     * @return true if effect is currently active
     */
    public boolean isEffectActive() {
        // Could check duration, conditions, etc.
        return true;
    }

    /**
     * Initialize the effect registry.
     * This is where we'd register effect implementations if using
     * a more dynamic approach.
     */
    private static void initializeEffects() {
        // Registry could be populated with lambda implementations
        // For now, we use switch statement in applySpecialEffect
    }

    @Override
    public String toString() {
        return String.format("EffectDecorator[effect=%s, card=%s]",
                effectType, decoratedCard.toString());
    }

    /**
     * Get a description of what this effect does.
     *
     * @return Human-readable effect description
     */
    public String getEffectDescription() {
        return switch (effectType) {
            case "DOUBLE_POINTS" -> "Worth 2x points";
            case "SKIP_NEXT_TWO" -> "Skips two players";
            case "REVERSE_TWICE" -> "Reverses direction twice";
            case "DRAW_EXTRA" -> "Opponent draws +1 extra card";
            case "REFLECT" -> "Reflects effect to previous player";
            case "IMMUNITY" -> "Grants immunity to next attack";
            case "STEAL_TURN" -> "Play again immediately";
            case "COLOR_WILD" -> "Can play on any color";
            default -> "Unknown effect";
        };
    }
}
