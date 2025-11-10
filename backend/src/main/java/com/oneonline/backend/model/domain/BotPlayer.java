package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Bot player that extends Player with AI decision-making capabilities.
 *
 * AI Strategy (single difficulty):
 * 1. Prefer Wild Draw Four > Draw Two > Skip/Reverse > Wild > Same Color > Random
 * 2. Color selection: Choose color with most cards in hand
 * 3. ONE calling: 90% success rate
 */
@Data
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BotPlayer extends Player {

    /**
     * Whether this is a temporary bot replacing a disconnected player
     */
    @Builder.Default
    private boolean temporary = false;

    /**
     * Reference to the original player (for reconnection)
     */
    private Player originalPlayer;

    /**
     * Random instance for AI decisions
     */
    private static final Random RANDOM = new Random();

    /**
     * ONE calling success rate (90%)
     */
    private static final double ONE_CALL_SUCCESS_RATE = 0.9;

    /**
     * Choose the best card to play using AI strategy
     *
     * Priority:
     * 1. Wild Draw Four (if legal)
     * 2. Draw Two
     * 3. Skip/Reverse
     * 4. Wild
     * 5. Same color
     * 6. Random valid card
     *
     * @param topCard The current top card on discard pile
     * @param session The game session (for checking legality)
     * @return The chosen card, or null if no valid cards
     */
    public Card chooseCard(Card topCard, GameSession session) {
        List<Card> validCards = getValidCards(topCard);

        if (validCards.isEmpty()) {
            return null;
        }

        // Priority 1: Wild Draw Four (check legality)
        Optional<Card> wildDrawFour = validCards.stream()
                .filter(card -> card instanceof WildDrawFourCard)
                .findFirst();

        if (wildDrawFour.isPresent()) {
            WildDrawFourCard card = (WildDrawFourCard) wildDrawFour.get();
            if (card.isLegalPlay(getHand(), topCard.getColor())) {
                card.setChosenColor(chooseColor());
                return card;
            }
        }

        // Priority 2: Draw Two
        Optional<Card> drawTwo = validCards.stream()
                .filter(card -> card instanceof DrawTwoCard)
                .findFirst();

        if (drawTwo.isPresent()) {
            return drawTwo.get();
        }

        // Priority 3: Skip or Reverse
        Optional<Card> skipReverse = validCards.stream()
                .filter(card -> card instanceof SkipCard || card instanceof ReverseCard)
                .findFirst();

        if (skipReverse.isPresent()) {
            return skipReverse.get();
        }

        // Priority 4: Wild (not draw four)
        Optional<Card> wild = validCards.stream()
                .filter(card -> card instanceof WildCard && !(card instanceof WildDrawFourCard))
                .findFirst();

        if (wild.isPresent()) {
            WildCard card = (WildCard) wild.get();
            card.setChosenColor(chooseColor());
            return card;
        }

        // Priority 5: Same color as top card
        Optional<Card> sameColor = validCards.stream()
                .filter(card -> card.getColor() == topCard.getColor())
                .findFirst();

        if (sameColor.isPresent()) {
            return sameColor.get();
        }

        // Priority 6: Random valid card
        return validCards.get(RANDOM.nextInt(validCards.size()));
    }

    /**
     * Choose the best color for a wild card.
     *
     * Strategy: Choose the color that appears most in bot's hand
     *
     * @return The chosen color (RED, YELLOW, GREEN, or BLUE)
     */
    public CardColor chooseColor() {
        Map<CardColor, Long> colorCounts = getHand().stream()
                .filter(card -> card.getColor() != CardColor.WILD)
                .collect(Collectors.groupingBy(Card::getColor, Collectors.counting()));

        if (colorCounts.isEmpty()) {
            // If no colored cards, choose random
            CardColor[] colors = {CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE};
            return colors[RANDOM.nextInt(colors.length)];
        }

        // Return color with highest count
        return colorCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(CardColor.RED);
    }

    /**
     * Determine if bot should call "ONE" (90% success rate)
     *
     * @return true if bot calls ONE (90% of the time)
     */
    public boolean shouldCallOne() {
        if (!hasOne()) {
            return false;
        }

        // 90% chance of calling ONE
        return RANDOM.nextDouble() < ONE_CALL_SUCCESS_RATE;
    }

    /**
     * Execute bot's turn automatically
     *
     * @param topCard The current top card
     * @param session The game session
     * @return true if bot played a card, false if drew
     */
    public boolean executeTurn(Card topCard, GameSession session) {
        Card chosenCard = chooseCard(topCard, session);

        if (chosenCard != null) {
            playCard(chosenCard);

            // Auto-call ONE if needed
            if (shouldCallOne()) {
                callOne();
            }

            return true;
        }

        // No valid card, must draw
        return false;
    }

    /**
     * Check if this bot is temporary (replacing a disconnected player)
     *
     * @return true if temporary
     */
    public boolean isTemporary() {
        return temporary;
    }

    /**
     * Get the original player this bot is replacing
     *
     * @return Original player, or null if not a replacement bot
     */
    public Player getOriginalPlayer() {
        return originalPlayer;
    }

    @Override
    public String toString() {
        String botType = temporary ? "TempBot" : "Bot";
        return botType + ": " + getNickname() + " (" + getHand().size() + " cards)";
    }
}
