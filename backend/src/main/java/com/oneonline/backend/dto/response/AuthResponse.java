package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication Response DTO
 *
 * Data Transfer Object returned after successful login or registration.
 * Contains JWT token and user information.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    /**
     * JWT access token for authenticated requests.
     */
    private String token;

    /**
     * Token type (typically "Bearer").
     */
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * User ID.
     */
    private String userId;

    /**
     * User email.
     */
    private String email;

    /**
     * User nickname/display name.
     */
    private String nickname;

    /**
     * User roles/authorities.
     */
    private String[] roles;

    /**
     * Token expiration time in milliseconds.
     */
    private Long expiresAt;
}
