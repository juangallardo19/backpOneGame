package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Refresh Token Request DTO
 *
 * Data Transfer Object for JWT token refresh requests.
 * Contains the refresh token to generate a new access token.
 *
 * Validation Rules:
 * - Refresh token is required
 *
 * @author Juan Gallardo
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {

    /**
     * JWT refresh token used to generate a new access token.
     */
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
