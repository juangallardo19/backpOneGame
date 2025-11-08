package com.oneonline.backend.service.auth;

import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Date;

/**
 * JwtService - JWT Token Service
 *
 * Wrapper service around JwtTokenProvider for token operations.
 *
 * RESPONSIBILITIES:
 * - Generate JWT access tokens
 * - Generate JWT refresh tokens
 * - Validate JWT tokens
 * - Extract claims from tokens (email, userId, expiration)
 *
 * TOKEN TYPES:
 * - Access Token: Short-lived (24 hours), used for API authentication
 * - Refresh Token: Long-lived (7 days), used to obtain new access tokens
 *
 * ALGORITHM:
 * - HS256 (HMAC with SHA-256)
 * - Secret key from environment variable
 *
 * Used by:
 * - AuthService (token generation)
 * - JwtAuthFilter (token validation)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JwtService {

    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Generate access token for user
     *
     * Access tokens are short-lived (24 hours) and used for authenticating
     * API requests via the Authorization header.
     *
     * @param user User entity
     * @return JWT access token
     */
    public String generateAccessToken(User user) {
        log.debug("Generating access token for user: {}", user.getEmail());
        return jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
    }

    /**
     * Generate access token for user ID and email
     *
     * Convenience method for generating tokens without loading full User entity.
     *
     * @param userId User ID
     * @param email User email
     * @return JWT access token
     */
    public String generateAccessToken(Long userId, String email) {
        log.debug("Generating access token for user: {} (ID: {})", email, userId);
        return jwtTokenProvider.generateAccessToken(userId, email);
    }

    /**
     * Generate refresh token for user
     *
     * Refresh tokens are long-lived (7 days) and used to obtain new access tokens
     * without requiring the user to log in again.
     *
     * @param user User entity
     * @return JWT refresh token
     */
    public String generateRefreshToken(User user) {
        log.debug("Generating refresh token for user: {}", user.getEmail());
        return jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());
    }

    /**
     * Generate refresh token for user ID and email
     *
     * Convenience method for generating refresh tokens without loading full User entity.
     *
     * @param userId User ID
     * @param email User email
     * @return JWT refresh token
     */
    public String generateRefreshToken(Long userId, String email) {
        log.debug("Generating refresh token for user: {} (ID: {})", email, userId);
        return jwtTokenProvider.generateRefreshToken(userId, email);
    }

    /**
     * Validate JWT token
     *
     * Checks if token is:
     * - Well-formed
     * - Not expired
     * - Has valid signature
     *
     * @param token JWT token to validate
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        boolean isValid = jwtTokenProvider.validateToken(token);
        log.debug("Token validation result: {}", isValid ? "valid" : "invalid");
        return isValid;
    }

    /**
     * Extract email from JWT token
     *
     * Gets the subject (email) claim from the token.
     *
     * @param token JWT token
     * @return User email
     */
    public String getEmailFromToken(String token) {
        String email = jwtTokenProvider.getEmailFromToken(token);
        log.debug("Extracted email from token: {}", email);
        return email;
    }

    /**
     * Extract user ID from JWT token
     *
     * Gets the userId claim from the token.
     *
     * @param token JWT token
     * @return User ID
     */
    public Long getUserIdFromToken(String token) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        log.debug("Extracted user ID from token: {}", userId);
        return userId;
    }

    /**
     * Get token expiration date
     *
     * Gets the expiration timestamp from the token.
     *
     * @param token JWT token
     * @return Expiration date
     */
    public Date getExpirationDate(String token) {
        Date expirationDate = jwtTokenProvider.getExpirationDate(token);
        log.debug("Token expires at: {}", expirationDate);
        return expirationDate;
    }

    /**
     * Check if token is expired
     *
     * Compares token expiration date with current time.
     *
     * @param token JWT token
     * @return true if expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        Date expirationDate = getExpirationDate(token);
        boolean isExpired = expirationDate.before(new Date());
        log.debug("Token expired: {}", isExpired);
        return isExpired;
    }

    /**
     * Get access token expiration time in milliseconds
     *
     * @return Expiration time in milliseconds (24 hours)
     */
    public Long getAccessTokenExpirationMs() {
        return jwtTokenProvider.getAccessTokenExpirationMs();
    }

    /**
     * Get refresh token expiration time in milliseconds
     *
     * @return Expiration time in milliseconds (7 days)
     */
    public Long getRefreshTokenExpirationMs() {
        return jwtTokenProvider.getRefreshTokenExpirationMs();
    }
}
