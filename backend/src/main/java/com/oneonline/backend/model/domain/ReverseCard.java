package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Reverse card in the ONE game.
 *
 * Effect: Reverses the turn order (clockwise <-> counter-clockwise)
 *
 * Can be played on:
 * - Same color
 * - Another Reverse card
 * - Any wild card
 */
public class ReverseCard extends Card {

    public ReverseCard(CardColor color) {
        super(CardType.REVERSE, color, 0);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        if (topCard == null) {
            return true;
        }

        // Can play on same color or another reverse card
        return this.getColor() == topCard.getColor() ||
               topCard.getType() == CardType.REVERSE ||
               topCard.isWild();
    }
}
