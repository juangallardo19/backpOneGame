package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Join Room Request DTO
 *
 * Data Transfer Object for joining an existing game room.
 * Contains room code and player identification.
 *
 * Validation Rules:
 * - roomCode is required (6 characters)
 * - playerId is required (provided by authentication)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinRoomRequest {

    /**
     * 6-character room code to join.
     */
    @NotBlank(message = "Room code is required")
    @Size(min = 6, max = 6, message = "Room code must be exactly 6 characters")
    private String roomCode;

    /**
     * Player nickname (optional, defaults to username).
     */
    private String nickname;

    /**
     * Optional password for private rooms.
     */
    private String password;
}
