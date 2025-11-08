package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Number card (0-9) in the ONE game.
 *
 * Can be played on:
 * - Same color
 * - Same number
 * - Any wild card
 */
public class NumberCard extends Card {

    public NumberCard(CardColor color, int value) {
        super(CardType.NUMBER, color, value);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        if (topCard == null) {
            return true; // First card can always be played
        }

        // Can play on same color or same number
        return this.getColor() == topCard.getColor() ||
               (topCard.getType() == CardType.NUMBER && this.getValue() == topCard.getValue()) ||
               topCard.isWild();
    }
}
