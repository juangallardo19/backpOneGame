package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Play Card Request DTO
 *
 * Data Transfer Object for playing a card during a game.
 * Contains card identifier and optional color choice for wild cards.
 *
 * Validation Rules:
 * - cardId is required
 * - chosenColor required only for wild cards
 * - chosenColor must be RED, YELLOW, GREEN, or BLUE (not WILD)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayCardRequest {

    /**
     * ID of the card to play.
     */
    @NotBlank(message = "Card ID is required")
    private String cardId;

    /**
     * Chosen color for wild cards (RED, YELLOW, GREEN, BLUE).
     * Required when playing WILD or WILD_DRAW_FOUR.
     */
    private String chosenColor;

    /**
     * Whether to call "ONE!" with this play.
     * Set true when playing second-to-last card.
     */
    private Boolean callOne = false;
}
