package com.oneonline.backend.exception;

/**
 * InvalidMoveException - Thrown when game move is invalid
 *
 * HTTP Status: 400 BAD REQUEST
 *
 * Used when:
 * - Card cannot be played on top card
 * - Not player's turn
 * - Invalid card selection
 * - Game rules violation
 *
 * @author Juan Gallardo
 */
public class InvalidMoveException extends RuntimeException {

    public InvalidMoveException(String message) {
        super(message);
    }

    public InvalidMoveException(String cardType, String reason) {
        super(String.format("Invalid move: Cannot play %s - %s", cardType, reason));
    }
}
