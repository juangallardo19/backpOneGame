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
     * JWT refresh token for obtaining new access tokens.
     */
    private String refreshToken;

    /**
     * Token type (typically "Bearer").
     */
    @Builder.Default
    private String tokenType = "Bearer";

    /**
     * User information.
     */
    private UserProfileResponse user;

    /**
     * Token expiration time in milliseconds.
     */
    private Long expiresAt;

    /**
     * Expiration duration in milliseconds (for frontend compatibility).
     */
    private Long expiresIn;

    // Legacy fields for backward compatibility (deprecated)
    /**
     * @deprecated Use user.id instead
     */
    @Deprecated
    private String userId;

    /**
     * @deprecated Use user.email instead
     */
    @Deprecated
    private String email;

    /**
     * @deprecated Use user.nickname instead
     */
    @Deprecated
    private String nickname;

    /**
     * @deprecated Use user.roles instead
     */
    @Deprecated
    private String[] roles;
}
