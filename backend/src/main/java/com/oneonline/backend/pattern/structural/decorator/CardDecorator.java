package com.oneonline.backend.pattern.structural.decorator;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * DECORATOR PATTERN Implementation (Abstract Base Decorator)
 *
 * Purpose:
 * Provides a flexible way to add new behaviors/effects to cards dynamically
 * without modifying the original Card classes. Wraps a card and adds extra
 * functionality while maintaining the same interface.
 *
 * Pattern Benefits:
 * - Add responsibilities to objects dynamically
 * - More flexible than static inheritance
 * - Avoid feature-laden classes high in hierarchy
 * - Combine multiple decorators for complex effects
 * - Single Responsibility Principle (each decorator adds one behavior)
 * - Open/Closed Principle (extend without modifying)
 *
 * Use Cases in ONE Game:
 * - Add temporary power-ups to cards (double points, immunity, etc.)
 * - Apply special effects (bounce back, mirror, etc.)
 * - Add visual effects for special events
 * - Implement temporary rule modifications
 * - Chain multiple effects on single card
 *
 * Example Usage:
 * <pre>
 * Card normalCard = new SkipCard(CardColor.RED);
 * Card doublePointsCard = new EffectDecorator(normalCard, "DOUBLE_POINTS");
 * Card powerUpCard = new PowerUpDecorator(doublePointsCard, "IMMUNITY");
 * // Now the card has both double points AND immunity effects
 * </pre>
 *
 * Decorator vs Inheritance:
 * - Inheritance: Static, compile-time, single extension path
 * - Decorator: Dynamic, runtime, multiple combinations possible
 */
public abstract class CardDecorator extends Card {

    /**
     * The card being decorated (wrapped)
     * All operations will be delegated to this card first,
     * then additional behavior is added.
     */
    protected Card decoratedCard;

    /**
     * Constructor - wraps an existing card.
     *
     * @param card Card to decorate (wrap)
     */
    public CardDecorator(Card card) {
        if (card == null) {
            throw new IllegalArgumentException("Decorated card cannot be null");
        }
        this.decoratedCard = card;
    }

    /**
     * Delegate to wrapped card's canPlayOn method.
     *
     * Decorators typically don't change the basic card rules,
     * but subclasses can override if needed.
     *
     * @param topCard Current top card
     * @return true if this card can be played on topCard
     */
    @Override
    public boolean canPlayOn(Card topCard) {
        return decoratedCard.canPlayOn(topCard);
    }

    /**
     * Apply the card's effect, including decorated effects.
     *
     * This is where the Decorator pattern shines - the base card's
     * effect is applied first, then additional effects are layered on.
     *
     * Subclasses MUST override this to add their specific behavior.
     *
     * @param session Current game session
     */
    public abstract void applyEffect(GameSession session);

    /**
     * Get the card's score value.
     *
     * Decorators can modify the score (e.g., double points power-up).
     * Default: delegate to wrapped card.
     *
     * @return Card's point value
     */
    @Override
    public int getValue() {
        return decoratedCard.getValue();
    }

    /**
     * Get the card's color.
     *
     * Decorators typically don't change color, but could for special effects.
     *
     * @return Card color
     */
    @Override
    public CardColor getColor() {
        return decoratedCard.getColor();
    }

    /**
     * Get the card's type.
     *
     * @return Card type
     */
    @Override
    public CardType getType() {
        return decoratedCard.getType();
    }

    /**
     * Check if card is wild.
     *
     * @return true if wild card
     */
    @Override
    public boolean isWild() {
        return decoratedCard.isWild();
    }

    /**
     * Get the underlying decorated card.
     *
     * Useful for accessing the original card without decorations,
     * or for checking what type of card is being decorated.
     *
     * @return The wrapped Card object
     */
    public Card getDecoratedCard() {
        return decoratedCard;
    }

    /**
     * Unwrap all decorators to get the base card.
     *
     * If multiple decorators are chained, this method recursively
     * unwraps them all to get to the original card.
     *
     * Example:
     * PowerUpDecorator -> EffectDecorator -> SkipCard
     * unwrap() returns the SkipCard
     *
     * @return The innermost (original) Card
     */
    public Card unwrap() {
        Card current = decoratedCard;
        while (current instanceof CardDecorator) {
            current = ((CardDecorator) current).getDecoratedCard();
        }
        return current;
    }

    /**
     * Check if this decorator chain contains a specific effect.
     *
     * Useful for checking if a card has a particular power-up
     * without needing to know the decorator structure.
     *
     * @param decoratorClass Class of decorator to search for
     * @return true if decorator found in chain
     */
    public boolean hasDecorator(Class<? extends CardDecorator> decoratorClass) {
        if (decoratorClass.isInstance(this)) {
            return true;
        }
        if (decoratedCard instanceof CardDecorator) {
            return ((CardDecorator) decoratedCard).hasDecorator(decoratorClass);
        }
        return false;
    }

    /**
     * Count how many decorators are in the chain.
     *
     * @return Number of decorators wrapping the base card
     */
    public int getDecoratorDepth() {
        if (decoratedCard instanceof CardDecorator) {
            return 1 + ((CardDecorator) decoratedCard).getDecoratorDepth();
        }
        return 1;
    }

    /**
     * Get card ID from underlying card.
     *
     * @return Card ID
     */
    @Override
    public String getCardId() {
        return decoratedCard.getCardId();
    }

    /**
     * String representation showing decoration.
     *
     * @return Human-readable string
     */
    @Override
    public String toString() {
        return String.format("%s[decorating=%s]",
                this.getClass().getSimpleName(),
                decoratedCard.toString());
    }

    /**
     * Equality based on decorated card.
     *
     * Two decorators are equal if they decorate the same card.
     * Note: This doesn't consider the decorator type itself.
     *
     * @param obj Object to compare
     * @return true if decorating same card
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof CardDecorator)) return false;
        CardDecorator other = (CardDecorator) obj;
        return decoratedCard.equals(other.decoratedCard);
    }

    /**
     * Hash code based on decorated card.
     *
     * @return Hash code
     */
    @Override
    public int hashCode() {
        return decoratedCard.hashCode();
    }
}
