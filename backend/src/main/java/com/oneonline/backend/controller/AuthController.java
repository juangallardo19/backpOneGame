package com.oneonline.backend.controller;

import com.oneonline.backend.dto.request.LoginRequest;
import com.oneonline.backend.dto.request.RefreshTokenRequest;
import com.oneonline.backend.dto.request.RegisterRequest;
import com.oneonline.backend.dto.response.AuthResponse;
import com.oneonline.backend.dto.response.UserProfileResponse;
import com.oneonline.backend.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController - REST API for user authentication
 *
 * Handles user registration, login, logout, and profile operations.
 *
 * ENDPOINTS:
 * - POST /api/auth/register - Register new user
 * - POST /api/auth/login - Login with credentials
 * - POST /api/auth/logout - Logout current user
 * - GET /api/auth/me - Get current user profile
 * - POST /api/auth/refresh - Refresh JWT token
 *
 * AUTHENTICATION:
 * - /register and /login are public
 * - /me, /logout, /refresh require authentication
 *
 * @author Juan Gallardo
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
@Slf4j
public class AuthController {

    private final AuthService authService;

    /**
     * Register a new user
     *
     * POST /api/auth/register
     *
     * Request body:
     * {
     *   "email": "user@example.com",
     *   "nickname": "Player1",
     *   "password": "securePassword123"
     * }
     *
     * Response:
     * {
     *   "token": "jwt.token.here",
     *   "refreshToken": "refresh.token.here",
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "nickname": "Player1",
     *   "expiresIn": 86400000
     * }
     *
     * @param request Registration data
     * @return AuthResponse with JWT token and user info
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", request.getEmail());

        AuthResponse response = authService.register(request);

        log.info("User registered successfully: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with email and password
     *
     * POST /api/auth/login
     *
     * Request body:
     * {
     *   "email": "user@example.com",
     *   "password": "securePassword123"
     * }
     *
     * Response: Same as /register
     *
     * @param request Login credentials
     * @return AuthResponse with JWT token and user info
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        AuthResponse response = authService.login(request);

        log.info("User logged in successfully: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * Logout current user
     *
     * POST /api/auth/logout
     *
     * Invalidates the current JWT token (if token blacklist is implemented).
     * Client should discard the token.
     *
     * @return Success message
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "unknown";

        log.info("User logged out: {}", username);

        // In a production system, you would:
        // 1. Add token to blacklist
        // 2. Clear any server-side sessions
        // For JWT stateless approach, client simply discards the token

        return ResponseEntity.ok("Logged out successfully");
    }

    /**
     * Get current authenticated user profile
     *
     * GET /api/auth/me
     *
     * Requires: Authorization header with JWT token
     *
     * Response:
     * {
     *   "userId": 1,
     *   "email": "user@example.com",
     *   "nickname": "Player1",
     *   "profilePicture": "https://...",
     *   "authProvider": "LOCAL",
     *   "createdAt": "2025-11-06T10:00:00",
     *   "stats": { ... }
     * }
     *
     * @return UserProfileResponse with user details
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        log.debug("Fetching profile for user: {}", email);

        UserProfileResponse profile = authService.getCurrentUserProfile(email);

        return ResponseEntity.ok(profile);
    }

    /**
     * Refresh JWT token
     *
     * POST /api/auth/refresh
     *
     * Request body:
     * {
     *   "refreshToken": "refresh.token.here"
     * }
     *
     * Response: New JWT token
     *
     * @param request Refresh token request containing the refresh token
     * @return New AuthResponse with new token
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.debug("Token refresh requested");

        AuthResponse response = authService.refreshToken(request.getRefreshToken());

        return ResponseEntity.ok(response);
    }

    /**
     * Check if email is available
     *
     * GET /api/auth/check-email?email=user@example.com
     *
     * @param email Email to check
     * @return true if available, false if taken
     */
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailAvailable(@RequestParam String email) {
        boolean available = authService.isEmailAvailable(email);
        return ResponseEntity.ok(available);
    }

    /**
     * Check if nickname is available
     *
     * GET /api/auth/check-nickname?nickname=Player1
     *
     * @param nickname Nickname to check
     * @return true if available, false if taken
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNicknameAvailable(@RequestParam String nickname) {
        boolean available = authService.isNicknameAvailable(nickname);
        return ResponseEntity.ok(available);
    }
}
