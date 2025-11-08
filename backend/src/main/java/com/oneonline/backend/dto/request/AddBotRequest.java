package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Add Bot Request DTO
 *
 * Data Transfer Object for adding a bot player to a room.
 * Contains bot configuration and difficulty level.
 *
 * Validation Rules:
 * - roomCode is required
 * - difficulty between 1-3 (1=Easy, 2=Medium, 3=Hard)
 * - botName optional (auto-generated if not provided)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddBotRequest {

    /**
     * Room code to add bot to.
     */
    @NotBlank(message = "Room code is required")
    private String roomCode;

    /**
     * Bot difficulty level (1=Easy, 2=Medium, 3=Hard).
     */
    @Min(value = 1, message = "Difficulty minimum is 1 (Easy)")
    @Max(value = 3, message = "Difficulty maximum is 3 (Hard)")
    private Integer difficulty = 2;

    /**
     * Custom bot name (optional, auto-generated if not provided).
     */
    private String botName;
}
