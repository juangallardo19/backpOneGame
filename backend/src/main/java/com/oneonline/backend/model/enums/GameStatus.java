package com.oneonline.backend.model.enums;

/**
 * Enum representing the different states of a game session.
 *
 * Game States:
 * - LOBBY: Players are waiting in the lobby before the game starts
 * - DEALING_CARDS: System is dealing initial cards to all players
 * - PLAYING: Game is in progress, players are taking turns
 * - PAUSED: Game is temporarily paused (e.g., waiting for reconnection)
 * - GAME_OVER: Game has ended, winner has been determined
 */
public enum GameStatus {
    LOBBY,
    DEALING_CARDS,
    PLAYING,
    PAUSED,
    GAME_OVER
}
