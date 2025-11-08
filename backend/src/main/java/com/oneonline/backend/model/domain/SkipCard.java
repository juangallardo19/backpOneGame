package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Skip card in the ONE game.
 *
 * Effect: Skips the next player's turn
 *
 * Can be played on:
 * - Same color
 * - Another Skip card
 * - Any wild card
 */
public class SkipCard extends Card {

    public SkipCard(CardColor color) {
        super(CardType.SKIP, color, 0);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        if (topCard == null) {
            return true;
        }

        // Can play on same color or another skip card
        return this.getColor() == topCard.getColor() ||
               topCard.getType() == CardType.SKIP ||
               topCard.isWild();
    }
}
