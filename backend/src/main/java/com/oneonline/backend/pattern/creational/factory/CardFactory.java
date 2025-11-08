package com.oneonline.backend.pattern.creational.factory;

import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;

import java.util.ArrayList;
import java.util.List;

/**
 * FACTORY METHOD PATTERN Implementation
 *
 * Purpose:
 * Provides a centralized way to create Card objects without exposing
 * the instantiation logic to the client. Encapsulates object creation
 * and allows for easy extension of new card types.
 *
 * Pattern Benefits:
 * - Single Responsibility: All card creation logic in one place
 * - Open/Closed Principle: Easy to add new card types without modifying existing code
 * - Reduces coupling between client code and concrete card classes
 * - Simplifies card creation throughout the application
 *
 * Use Cases in ONE Game:
 * - Initializing a complete deck of 108 cards
 * - Creating individual cards during gameplay
 * - Testing and debugging (easy card creation)
 *
 * Example Usage:
 * <pre>
 * Card numberCard = CardFactory.createCard(CardType.NUMBER, CardColor.RED, 5);
 * Card skipCard = CardFactory.createCard(CardType.SKIP, CardColor.BLUE, 0);
 * List&lt;Card&gt; fullDeck = CardFactory.createStandardDeck();
 * </pre>
 */
public class CardFactory {

    /**
     * Private constructor to prevent instantiation (utility class)
     */
    private CardFactory() {
        throw new UnsupportedOperationException("Factory class cannot be instantiated");
    }

    /**
     * Factory method to create a card based on type, color, and value.
     *
     * This is the core of the Factory Method pattern - it encapsulates
     * the decision logic of which concrete Card class to instantiate.
     *
     * @param type Card type (NUMBER, SKIP, REVERSE, etc.)
     * @param color Card color (RED, YELLOW, GREEN, BLUE, WILD)
     * @param value Numeric value (0-9 for number cards, ignored for others)
     * @return Concrete Card instance
     * @throws IllegalArgumentException if type is null
     */
    public static Card createCard(CardType type, CardColor color, int value) {
        if (type == null) {
            throw new IllegalArgumentException("Card type cannot be null");
        }

        return switch (type) {
            case NUMBER -> new NumberCard(color, value);
            case SKIP -> new SkipCard(color);
            case REVERSE -> new ReverseCard(color);
            case DRAW_TWO -> new DrawTwoCard(color);
            case WILD -> new WildCard();
            case WILD_DRAW_FOUR -> new WildDrawFourCard();
        };
    }

    /**
     * Create a complete standard ONE deck (108 cards).
     *
     * Card distribution:
     * - Number cards (0-9): 76 cards
     *   - One 0 per color: 4 cards
     *   - Two of each 1-9 per color: 72 cards
     * - Skip cards: 8 cards (2 per color)
     * - Reverse cards: 8 cards (2 per color)
     * - Draw Two cards: 8 cards (2 per color)
     * - Wild cards: 4 cards
     * - Wild Draw Four cards: 4 cards
     *
     * @return List of 108 cards representing a full ONE deck
     */
    public static List<Card> createStandardDeck() {
        List<Card> deck = new ArrayList<>(108);

        // Array of colors (excluding WILD)
        CardColor[] colors = {CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE};

        // Create colored cards for each color
        for (CardColor color : colors) {
            // Add number cards
            deck.addAll(createNumberCards(color));

            // Add special cards
            deck.addAll(createSpecialCards(color));
        }

        // Add wild cards (no specific color)
        for (int i = 0; i < 4; i++) {
            deck.add(createCard(CardType.WILD, CardColor.WILD, 0));
        }

        // Add wild draw four cards
        for (int i = 0; i < 4; i++) {
            deck.add(createCard(CardType.WILD_DRAW_FOUR, CardColor.WILD, 0));
        }

        return deck;
    }

    /**
     * Create all number cards (0-9) for a specific color.
     *
     * Creates:
     * - One 0 card
     * - Two of each 1-9 card
     * Total: 19 cards per color
     *
     * @param color Card color
     * @return List of number cards for the specified color
     */
    public static List<Card> createNumberCards(CardColor color) {
        List<Card> cards = new ArrayList<>(19);

        // Add one 0 card
        cards.add(createCard(CardType.NUMBER, color, 0));

        // Add two of each 1-9 card
        for (int value = 1; value <= 9; value++) {
            cards.add(createCard(CardType.NUMBER, color, value));
            cards.add(createCard(CardType.NUMBER, color, value));
        }

        return cards;
    }

    /**
     * Create all special/action cards for a specific color.
     *
     * Creates (2 of each):
     * - Skip cards: 2
     * - Reverse cards: 2
     * - Draw Two cards: 2
     * Total: 6 cards per color
     *
     * @param color Card color
     * @return List of special cards for the specified color
     */
    public static List<Card> createSpecialCards(CardColor color) {
        List<Card> cards = new ArrayList<>(6);

        // Add two Skip cards
        cards.add(createCard(CardType.SKIP, color, 0));
        cards.add(createCard(CardType.SKIP, color, 0));

        // Add two Reverse cards
        cards.add(createCard(CardType.REVERSE, color, 0));
        cards.add(createCard(CardType.REVERSE, color, 0));

        // Add two Draw Two cards
        cards.add(createCard(CardType.DRAW_TWO, color, 0));
        cards.add(createCard(CardType.DRAW_TWO, color, 0));

        return cards;
    }

    /**
     * Create all cards of a specific color (number + special).
     *
     * Convenience method that combines number and special cards.
     * Total: 25 cards per color (19 number + 6 special)
     *
     * @param color Card color
     * @return List of all cards for the specified color
     */
    public static List<Card> createColorCards(CardColor color) {
        List<Card> cards = new ArrayList<>(25);
        cards.addAll(createNumberCards(color));
        cards.addAll(createSpecialCards(color));
        return cards;
    }

    /**
     * Create only wild cards (Wild + Wild Draw Four).
     *
     * Creates:
     * - 4 Wild cards
     * - 4 Wild Draw Four cards
     * Total: 8 wild cards
     *
     * @return List of all wild cards
     */
    public static List<Card> createWildCards() {
        List<Card> cards = new ArrayList<>(8);

        for (int i = 0; i < 4; i++) {
            cards.add(createCard(CardType.WILD, CardColor.WILD, 0));
            cards.add(createCard(CardType.WILD_DRAW_FOUR, CardColor.WILD, 0));
        }

        return cards;
    }

    /**
     * Create a custom deck with specified quantities of each card type.
     *
     * Useful for testing or custom game modes.
     *
     * @param numberCardsPerColor Number of each number card per color
     * @param specialCardsPerColor Number of each special card per color
     * @param wildCards Number of wild cards
     * @param wildDrawFourCards Number of wild draw four cards
     * @return Custom deck
     */
    public static List<Card> createCustomDeck(int numberCardsPerColor,
                                               int specialCardsPerColor,
                                               int wildCards,
                                               int wildDrawFourCards) {
        List<Card> deck = new ArrayList<>();
        CardColor[] colors = {CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE};

        for (CardColor color : colors) {
            // Number cards
            for (int value = 0; value <= 9; value++) {
                for (int i = 0; i < numberCardsPerColor; i++) {
                    deck.add(createCard(CardType.NUMBER, color, value));
                }
            }

            // Special cards
            for (int i = 0; i < specialCardsPerColor; i++) {
                deck.add(createCard(CardType.SKIP, color, 0));
                deck.add(createCard(CardType.REVERSE, color, 0));
                deck.add(createCard(CardType.DRAW_TWO, color, 0));
            }
        }

        // Wild cards
        for (int i = 0; i < wildCards; i++) {
            deck.add(createCard(CardType.WILD, CardColor.WILD, 0));
        }

        for (int i = 0; i < wildDrawFourCards; i++) {
            deck.add(createCard(CardType.WILD_DRAW_FOUR, CardColor.WILD, 0));
        }

        return deck;
    }

    /**
     * Get the total number of cards in a standard ONE deck.
     *
     * @return 108 (standard deck size)
     */
    public static int getStandardDeckSize() {
        return 108;
    }
}
