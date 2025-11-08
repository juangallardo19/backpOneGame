package com.oneonline.backend.pattern.creational.factory;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.enums.CardColor;

import java.util.List;

/**
 * ABSTRACT FACTORY PATTERN Implementation
 *
 * Purpose:
 * Provides an interface for creating families of related objects (card sets by color)
 * without specifying their concrete classes. Creates complete sets of cards
 * organized by color, ensuring consistency within each family.
 *
 * Pattern Benefits:
 * - Creates families of related objects (all cards of one color)
 * - Ensures consistency among products in a family
 * - Isolates concrete classes from client code
 * - Makes exchanging product families easy
 * - Promotes consistency among products
 *
 * Difference from Factory Method:
 * - Factory Method: Creates ONE product at a time
 * - Abstract Factory: Creates FAMILIES of related products
 *
 * Use Cases in ONE Game:
 * - Initialize all cards of a specific color at once
 * - Create color-themed decks for special game modes
 * - Testing specific color scenarios
 * - Organizing cards by color for UI display
 *
 * Example Usage:
 * <pre>
 * List&lt;Card&gt; redCards = CardSetFactory.createRedCards();    // All red cards
 * List&lt;Card&gt; blueCards = CardSetFactory.createBlueCards();  // All blue cards
 * List&lt;Card&gt; colorSet = CardSetFactory.createCardsByColor(CardColor.GREEN);
 * </pre>
 */
public class CardSetFactory {

    /**
     * Private constructor to prevent instantiation (utility class)
     */
    private CardSetFactory() {
        throw new UnsupportedOperationException("Factory class cannot be instantiated");
    }

    /**
     * Create complete set of RED cards.
     *
     * Creates family of red cards:
     * - 19 number cards (one 0, two each 1-9)
     * - 2 Skip cards
     * - 2 Reverse cards
     * - 2 Draw Two cards
     * Total: 25 red cards
     *
     * This demonstrates the Abstract Factory pattern by creating
     * a complete family of related products (all red cards).
     *
     * @return List of all red cards (25 cards)
     */
    public static List<Card> createRedCards() {
        return CardFactory.createColorCards(CardColor.RED);
    }

    /**
     * Create complete set of YELLOW cards.
     *
     * Creates family of yellow cards:
     * - 19 number cards (one 0, two each 1-9)
     * - 2 Skip cards
     * - 2 Reverse cards
     * - 2 Draw Two cards
     * Total: 25 yellow cards
     *
     * @return List of all yellow cards (25 cards)
     */
    public static List<Card> createYellowCards() {
        return CardFactory.createColorCards(CardColor.YELLOW);
    }

    /**
     * Create complete set of GREEN cards.
     *
     * Creates family of green cards:
     * - 19 number cards (one 0, two each 1-9)
     * - 2 Skip cards
     * - 2 Reverse cards
     * - 2 Draw Two cards
     * Total: 25 green cards
     *
     * @return List of all green cards (25 cards)
     */
    public static List<Card> createGreenCards() {
        return CardFactory.createColorCards(CardColor.GREEN);
    }

    /**
     * Create complete set of BLUE cards.
     *
     * Creates family of blue cards:
     * - 19 number cards (one 0, two each 1-9)
     * - 2 Skip cards
     * - 2 Reverse cards
     * - 2 Draw Two cards
     * Total: 25 blue cards
     *
     * @return List of all blue cards (25 cards)
     */
    public static List<Card> createBlueCards() {
        return CardFactory.createColorCards(CardColor.BLUE);
    }

    /**
     * Create complete set of cards by specified color.
     *
     * Generic method that creates any color family.
     * This is the "abstract" part of the pattern - one method
     * that can create any family based on input.
     *
     * @param color Color of cards to create (RED, YELLOW, GREEN, BLUE)
     * @return List of all cards for specified color (25 cards)
     * @throws IllegalArgumentException if color is WILD
     */
    public static List<Card> createCardsByColor(CardColor color) {
        if (color == CardColor.WILD) {
            throw new IllegalArgumentException("Use createWildCards() for wild cards");
        }

        return CardFactory.createColorCards(color);
    }

    /**
     * Create the family of WILD cards.
     *
     * Creates:
     * - 4 Wild cards
     * - 4 Wild Draw Four cards
     * Total: 8 wild cards
     *
     * Note: Wild cards don't have a traditional "color" but form
     * their own family in the Abstract Factory pattern.
     *
     * @return List of all wild cards (8 cards)
     */
    public static List<Card> createWildCards() {
        return CardFactory.createWildCards();
    }

    /**
     * Get the size of a standard color family.
     *
     * @return 25 (number of cards per color in standard ONE deck)
     */
    public static int getColorFamilySize() {
        return 25;
    }

    /**
     * Get the size of the wild card family.
     *
     * @return 8 (number of wild cards in standard ONE deck)
     */
    public static int getWildFamilySize() {
        return 8;
    }

    /**
     * Get all available color families.
     *
     * @return Array of colors that have card families
     */
    public static CardColor[] getAvailableColorFamilies() {
        return new CardColor[]{
            CardColor.RED,
            CardColor.YELLOW,
            CardColor.GREEN,
            CardColor.BLUE
        };
    }
}
