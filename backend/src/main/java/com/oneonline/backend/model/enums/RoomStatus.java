package com.oneonline.backend.model.enums;

/**
 * Enum representing the different states a game room can be in.
 *
 * Room States:
 * - WAITING: Room is open and waiting for players to join
 * - STARTING: Room has enough players and game is about to start
 * - IN_PROGRESS: Game is currently being played
 * - FINISHED: Game has ended and room will be closed
 */
public enum RoomStatus {
    WAITING,
    STARTING,
    IN_PROGRESS,
    FINISHED
}
