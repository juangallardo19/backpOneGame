package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Wild card in the ONE game.
 *
 * Effect: Allows player to change the current color
 * Can be played on any card
 */
public class WildCard extends Card {

    /**
     * The color chosen by the player when playing this card
     */
    private CardColor chosenColor;

    public WildCard() {
        super(CardType.WILD, CardColor.WILD, 0);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        // Wild cards can always be played
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
}
