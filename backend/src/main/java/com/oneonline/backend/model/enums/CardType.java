package com.oneonline.backend.model.enums;

/**
 * Enum representing the different types of cards in the ONE card game.
 *
 * Card Types:
 * - NUMBER: Standard numbered cards (0-9)
 * - SKIP: Skips the next player's turn
 * - REVERSE: Reverses the turn order
 * - DRAW_TWO: Forces next player to draw 2 cards
 * - WILD: Allows player to change the current color
 * - WILD_DRAW_FOUR: Changes color and forces next player to draw 4 cards
 */
public enum CardType {
    NUMBER,
    SKIP,
    REVERSE,
    DRAW_TWO,
    WILD,
    WILD_DRAW_FOUR
}
