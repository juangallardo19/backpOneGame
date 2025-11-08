package com.oneonline.backend.exception;

/**
 * RoomNotFoundException - Thrown when game room is not found
 *
 * HTTP Status: 404 NOT FOUND
 *
 * Used when:
 * - Room code doesn't exist
 * - Room was closed/deleted
 * - Invalid room code format
 *
 * @author Juan Gallardo
 */
public class RoomNotFoundException extends RuntimeException {

    public RoomNotFoundException(String message) {
        super(message);
    }

    public static RoomNotFoundException byRoomCode(String roomCode) {
        return new RoomNotFoundException("Room not found with code: " + roomCode);
    }
}
