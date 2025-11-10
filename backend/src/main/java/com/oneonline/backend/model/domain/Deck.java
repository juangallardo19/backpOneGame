package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.CardColor;
import lombok.Data;

import java.util.Collections;
import java.util.Stack;

/**
 * Deck of ONE cards (108 total cards).
 *
 * Standard ONE deck composition:
 * - Number cards (0-9): 76 cards
 *   - One 0 per color (4 cards)
 *   - Two of each 1-9 per color (72 cards)
 * - Skip cards: 8 cards (2 per color)
 * - Reverse cards: 8 cards (2 per color)
 * - Draw Two cards: 8 cards (2 per color)
 * - Wild cards: 4 cards
 * - Wild Draw Four cards: 4 cards
 *
 * Total: 108 cards
 */
@Data
public class Deck {

    /**
     * Stack of cards in the deck
     */
    private Stack<Card> cards;

    /**
     * Constructor initializes and shuffles the deck
     */
    public Deck() {
        this.cards = new Stack<>();
        initialize();
        shuffle();
    }

    /**
     * Initialize deck with all 108 ONE cards
     */
    public void initialize() {
        cards.clear();

        // Add colored cards for each color (RED, YELLOW, GREEN, BLUE)
        CardColor[] colors = {CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE};

        for (CardColor color : colors) {
            // Add one 0 card per color
            cards.push(new NumberCard(color, 0));

            // Add two of each 1-9 per color
            for (int value = 1; value <= 9; value++) {
                cards.push(new NumberCard(color, value));
                cards.push(new NumberCard(color, value));
            }

            // Add two Skip cards per color
            cards.push(new SkipCard(color));
            cards.push(new SkipCard(color));

            // Add two Reverse cards per color
            cards.push(new ReverseCard(color));
            cards.push(new ReverseCard(color));

            // Add two Draw Two cards per color
            cards.push(new DrawTwoCard(color));
            cards.push(new DrawTwoCard(color));
        }

        // Add 4 Wild cards
        for (int i = 0; i < 4; i++) {
            cards.push(new WildCard());
        }

        // Add 4 Wild Draw Four cards
        for (int i = 0; i < 4; i++) {
            cards.push(new WildDrawFourCard());
        }

        // Log deck composition for debugging
        long numberCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.NUMBER).count();
        long skipCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.SKIP).count();
        long reverseCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.REVERSE).count();
        long drawTwoCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.DRAW_TWO).count();
        long wildCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.WILD).count();
        long wildDrawFourCards = cards.stream().filter(c -> c.getType() == com.oneonline.backend.model.enums.CardType.WILD_DRAW_FOUR).count();

        System.out.println("=== DECK INITIALIZED ===");
        System.out.println("Total cards: " + cards.size());
        System.out.println("Number cards: " + numberCards);
        System.out.println("Skip cards: " + skipCards);
        System.out.println("Reverse cards: " + reverseCards);
        System.out.println("Draw Two cards: " + drawTwoCards);
        System.out.println("Wild cards: " + wildCards);
        System.out.println("Wild Draw Four cards: " + wildDrawFourCards);
        System.out.println("========================");
    }

    /**
     * Shuffle the deck
     */
    public void shuffle() {
        Collections.shuffle(cards);
    }

    /**
     * Draw a card from the top of the deck
     *
     * @return The drawn card, or null if deck is empty
     */
    public Card drawCard() {
        if (cards.isEmpty()) {
            return null;
        }
        return cards.pop();
    }

    /**
     * Check if deck is empty
     *
     * @return true if no cards remain
     */
    public boolean isEmpty() {
        return cards.isEmpty();
    }

    /**
     * Get the number of cards remaining in deck
     *
     * @return Number of cards
     */
    public int size() {
        return cards.size();
    }

    /**
     * Refill deck from discard pile
     *
     * @param discardPile The discard pile to refill from
     * @param topCard The current top card (keep it on discard pile)
     */
    public void refillFromDiscard(Stack<Card> discardPile, Card topCard) {
        if (discardPile.size() <= 1) {
            return; // Not enough cards to refill
        }

        // Remove top card temporarily
        Card savedTopCard = discardPile.pop();

        // Move all remaining cards to deck
        while (!discardPile.isEmpty()) {
            Card card = discardPile.pop();

            // Reset wild card colors
            if (card instanceof WildCard) {
                ((WildCard) card).setChosenColor(null);
            } else if (card instanceof WildDrawFourCard) {
                ((WildDrawFourCard) card).setChosenColor(null);
            }

            cards.push(card);
        }

        // Put top card back
        discardPile.push(savedTopCard);

        // Shuffle the refilled deck
        shuffle();
    }

    /**
     * Draw a card from the deck (alias for drawCard)
     *
     * @return The drawn card, or null if deck is empty
     */
    public Card draw() {
        return drawCard();
    }

    /**
     * Add a card to the deck
     *
     * @param card The card to add
     */
    public void addCard(Card card) {
        if (card != null) {
            cards.push(card);
        }
    }

    /**
     * Get remaining cards count (alias for size)
     *
     * @return Number of cards remaining
     */
    public int getRemainingCards() {
        return size();
    }

    /**
     * Reset the deck (reinitialize and shuffle)
     */
    public void reset() {
        initialize();
        shuffle();
    }

    /**
     * Refill deck from discard pile (overload without topCard parameter)
     *
     * @param discardPile The discard pile to refill from
     */
    public void refillFromDiscard(Stack<Card> discardPile) {
        if (discardPile.isEmpty()) {
            return;
        }
        Card topCard = discardPile.peek();
        refillFromDiscard(discardPile, topCard);
    }

    /**
     * Get the total number of cards in a standard ONE deck
     *
     * @return 108
     */
    public static int getTotalCards() {
        return 108;
    }

    @Override
    public String toString() {
        return "Deck with " + cards.size() + " cards";
    }
}
