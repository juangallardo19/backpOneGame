package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

/**
 * Draw Two (+2) card in the ONE game.
 *
 * Effect: Forces the next player to draw 2 cards
 * Can be stacked with other +2 cards if stacking is enabled
 *
 * Can be played on:
 * - Same color
 * - Another Draw Two card
 * - Any wild card
 */
public class DrawTwoCard extends Card {

    public DrawTwoCard(CardColor color) {
        super(CardType.DRAW_TWO, color, 0);
    }

    @Override
    public boolean canPlayOn(Card topCard) {
        if (topCard == null) {
            return true;
        }

        // Can play on same color or another draw two card
        return this.getColor() == topCard.getColor() ||
               topCard.getType() == CardType.DRAW_TWO ||
               topCard.isWild();
    }

    /**
     * Get the number of cards the next player must draw
     *
     * @return 2 cards
     */
    public int getDrawCount() {
        return 2;
    }
}
