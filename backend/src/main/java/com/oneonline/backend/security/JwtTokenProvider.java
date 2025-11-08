package com.oneonline.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JwtTokenProvider - JWT Token Generation and Validation
 *
 * Handles JWT token operations:
 * - Generate access tokens
 * - Generate refresh tokens
 * - Validate tokens
 * - Extract claims (userId, email, roles)
 * - Check expiration
 *
 * Uses JJWT library (io.jsonwebtoken)
 *
 * TOKEN STRUCTURE:
 * Header: { "alg": "HS256", "typ": "JWT" }
 * Payload: { "sub": "email", "userId": 123, "iat": ..., "exp": ... }
 * Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
 *
 * @author Juan Gallardo
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration:86400000}") // Default: 24 hours
    private long jwtExpirationMs;

    @Value("${jwt.refresh-expiration:604800000}") // Default: 7 days
    private long jwtRefreshExpirationMs;

    private SecretKey secretKey;

    /**
     * Initialize secret key after properties are loaded
     */
    @PostConstruct
    public void init() {
        // Generate secret key from configured secret
        this.secretKey = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        log.info("JWT Token Provider initialized");
    }

    /**
     * Generate access token (short-lived)
     *
     * @param userId User ID
     * @param email User email
     * @return JWT access token
     */
    public String generateAccessToken(Long userId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "access");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate refresh token (long-lived)
     *
     * @param userId User ID
     * @param email User email
     * @return JWT refresh token
     */
    public String generateRefreshToken(Long userId, String email) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("type", "refresh");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtRefreshExpirationMs))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Generate token with custom expiration
     *
     * @param userId User ID
     * @param email User email
     * @param expirationMs Custom expiration in milliseconds
     * @return JWT token
     */
    public String generateToken(Long userId, String email, long expirationMs) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validate JWT token
     *
     * Checks:
     * - Token signature is valid
     * - Token is not expired
     * - Token is not malformed
     *
     * @param token JWT token
     * @return true if valid, false otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token);
            return true;

        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (SecurityException e) {
            log.error("JWT signature validation failed: {}", e.getMessage());
        }

        return false;
    }

    /**
     * Extract email (subject) from token
     *
     * @param token JWT token
     * @return Email address
     */
    public String getEmailFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getSubject();
    }

    /**
     * Extract user ID from token
     *
     * @param token JWT token
     * @return User ID
     */
    public Long getUserIdFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }

    /**
     * Extract token type (access or refresh)
     *
     * @param token JWT token
     * @return Token type
     */
    public String getTokenType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("type", String.class);
    }

    /**
     * Extract expiration date from token
     *
     * @param token JWT token
     * @return Expiration date
     */
    public Date getExpirationFromToken(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getExpiration();
    }

    /**
     * Check if token is expired
     *
     * @param token JWT token
     * @return true if expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Date expiration = getExpirationFromToken(token);
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    /**
     * Extract all claims from token
     *
     * @param token JWT token
     * @return Claims object
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Get remaining validity time in milliseconds
     *
     * @param token JWT token
     * @return Remaining time in ms
     */
    public long getRemainingValidity(String token) {
        try {
            Date expiration = getExpirationFromToken(token);
            return expiration.getTime() - System.currentTimeMillis();
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Refresh an existing token
     *
     * Generates new token with same claims but new expiration.
     *
     * @param token Existing token
     * @return New token
     */
    public String refreshToken(String token) {
        if (!validateToken(token)) {
            throw new IllegalArgumentException("Invalid token cannot be refreshed");
        }

        String email = getEmailFromToken(token);
        Long userId = getUserIdFromToken(token);

        return generateAccessToken(userId, email);
    }

    /**
     * Get access token expiration time in milliseconds
     *
     * @return Access token expiration in ms
     */
    public long getAccessTokenExpirationMs() {
        return jwtExpirationMs;
    }

    /**
     * Get refresh token expiration time in milliseconds
     *
     * @return Refresh token expiration in ms
     */
    public long getRefreshTokenExpirationMs() {
        return jwtRefreshExpirationMs;
    }

    /**
     * Get expiration date from token (alias for getExpirationFromToken)
     *
     * @param token JWT token
     * @return Expiration date
     */
    public Date getExpirationDate(String token) {
        return getExpirationFromToken(token);
    }
}
