package com.oneonline.backend.model.enums;

/**
 * Enum representing the different states a player can be in during a game.
 *
 * Player States:
 * - WAITING: Player is waiting in the lobby before game starts
 * - ACTIVE: Player is in the game and ready to play
 * - PLAYING_TURN: It's currently this player's turn
 * - DISCONNECTED: Player has lost connection
 * - RECONNECTING: Player is attempting to reconnect to the game
 */
public enum PlayerStatus {
    WAITING,
    ACTIVE,
    PLAYING_TURN,
    DISCONNECTED,
    RECONNECTING
}
