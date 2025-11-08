package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Wild Draw Four (+4) card in the ONE game.
 *
 * Effect: Allows player to change color AND forces next player to draw 4 cards
 * Can only be played legally if player has no cards of the current color
 * Can be stacked with other +4 or +2 cards if stacking is enabled
 */
public class WildDrawFourCard extends Card {

    /**
     * The color chosen by the player when playing this card
     */
    private CardColor chosenColor;

    public WildDrawFourCard() {
        super(CardType.WILD_DRAW_FOUR, CardColor.WILD, 0);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        // Wild Draw Four can technically be played on anything
        // But legality check should be done in game logic
        return true;
    }

    /**
     * Set the color chosen by the player
     *
     * @param color The new color (RED, YELLOW, GREEN, or BLUE)
     */
    public void setChosenColor(CardColor color) {
        if (color == CardColor.WILD) {
            throw new IllegalArgumentException("Cannot choose WILD as a color");
        }
        this.chosenColor = color;
    }

    /**
     * Get the color chosen by the player
     *
     * @return The chosen color, or null if not yet chosen
     */
    public CardColor getChosenColor() {
        return chosenColor;
    }

    @Override
    public CardColor getColor() {
        // Return chosen color if set, otherwise WILD
        return chosenColor != null ? chosenColor : CardColor.WILD;
    }

    /**
     * Get the number of cards the next player must draw
     *
     * @return 4 cards
     */
    public int getDrawCount() {
        return 4;
    }

    /**
     * Check if this card was played legally
     * (player had no cards matching the current color)
     *
     * @param playerHand The player's hand before playing this card
     * @param currentColor The color before this card was played
     * @return true if legal play
     */
    public boolean isLegalPlay(java.util.List<Card> playerHand, CardColor currentColor) {
        if (currentColor == CardColor.WILD) {
            return true; // Always legal if no color is set
        }

        // Check if player has any cards of the current color
        for (Card card : playerHand) {
            if (card.getColor() == currentColor && !card.isWild()) {
                return false; // Player has a card of current color, illegal play
            }
        }

        return true; // No cards of current color, legal play
    }
}
