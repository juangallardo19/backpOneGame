package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Abstract base class for all ONE game cards.
 *
 * Represents a single card in the game with type, color, and value.
 * Subclasses implement specific card behavior and play rules.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class Card {

    /**
     * Unique identifier for this card instance
     */
    private String cardId;

    /**
     * Type of card (NUMBER, SKIP, REVERSE, DRAW_TWO, WILD, WILD_DRAW_FOUR)
     */
    private CardType type;

    /**
     * Color of the card (RED, YELLOW, GREEN, BLUE, WILD)
     */
    private CardColor color;

    /**
     * Numeric value (0-9 for number cards, special values for action cards)
     */
    private int value;

    /**
     * Constructor to auto-generate card ID
     */
    public Card(CardType type, CardColor color, int value) {
        this.cardId = UUID.randomUUID().toString();
        this.type = type;
        this.color = color;
        this.value = value;
    }

    /**
     * Check if this card can be played on top of the given card.
     *
     * @param topCard The card currently on top of the discard pile
     * @return true if this card can be legally played on topCard
     */
    public abstract boolean canPlayOn(Card topCard);

    /**
     * Get the point value of this card for scoring
     *
     * @return Point value (number cards = face value, action cards = 20, wilds = 50)
     */
    public int getPointValue() {
        switch (type) {
            case NUMBER:
                return value;
            case SKIP:
            case REVERSE:
            case DRAW_TWO:
                return 20;
            case WILD:
            case WILD_DRAW_FOUR:
                return 50;
            default:
                return 0;
        }
    }

    /**
     * Check if this is a wild card (can change color)
     *
     * @return true if card is WILD or WILD_DRAW_FOUR
     */
    public boolean isWild() {
        return type == CardType.WILD || type == CardType.WILD_DRAW_FOUR;
    }

    /**
     * Check if this is an action card (has special effect)
     *
     * @return true if card has a special effect
     */
    public boolean isActionCard() {
        return type == CardType.SKIP ||
               type == CardType.REVERSE ||
               type == CardType.DRAW_TWO ||
               type == CardType.WILD_DRAW_FOUR;
    }

    @Override
    public String toString() {
        return color + " " + type + (type == CardType.NUMBER ? " " + value : "");
    }
}
