package com.oneonline.backend.service.auth;

import com.oneonline.backend.dto.request.LoginRequest;
import com.oneonline.backend.dto.request.RegisterRequest;
import com.oneonline.backend.dto.response.AuthResponse;
import com.oneonline.backend.dto.response.UserProfileResponse;
import com.oneonline.backend.exception.UnauthorizedException;
import com.oneonline.backend.exception.UserAlreadyExistsException;
import com.oneonline.backend.exception.UserNotFoundException;
import com.oneonline.backend.model.entity.GlobalRanking;
import com.oneonline.backend.model.entity.PlayerStats;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.GlobalRankingRepository;
import com.oneonline.backend.repository.PlayerStatsRepository;
import com.oneonline.backend.repository.UserRepository;
import com.oneonline.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneId;

/**
 * AuthService - Authentication Service
 *
 * Handles user registration, login, and profile operations.
 *
 * RESPONSIBILITIES:
 * - User registration with email/password
 * - User login with credential validation
 * - JWT token generation
 * - User profile retrieval
 * - Email/nickname availability checks
 * - Token refresh operations
 *
 * SECURITY:
 * - BCrypt password hashing
 * - JWT token generation (24h access, 7d refresh)
 * - Email uniqueness validation
 * - Nickname uniqueness validation
 *
 * Used by:
 * - AuthController (REST API)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final GlobalRankingRepository globalRankingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    /**
     * Register a new user with email and password
     *
     * WORKFLOW:
     * 1. Validate email and nickname uniqueness
     * 2. Hash password with BCrypt
     * 3. Create User entity with LOCAL auth provider
     * 4. Save user to database
     * 5. Create PlayerStats entity for the user
     * 6. Generate JWT access and refresh tokens
     * 7. Return AuthResponse with tokens and user info
     *
     * @param request Registration data (email, nickname, password)
     * @return AuthResponse with JWT tokens and user info
     * @throws UserAlreadyExistsException if email or nickname already exists
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting registration for email: {}", request.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already registered: " + request.getEmail());
        }

        // Check if nickname already exists
        if (userRepository.existsByNickname(request.getNickname())) {
            log.warn("Registration failed: Nickname already exists: {}", request.getNickname());
            throw new UserAlreadyExistsException("Nickname already taken: " + request.getNickname());
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setNickname(request.getNickname());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setIsActive(true);
        user.setRole(User.UserRole.USER);

        // Save user
        user = userRepository.save(user);
        log.info("User registered successfully: {} (ID: {})", user.getEmail(), user.getId());

        // Create player stats
        PlayerStats stats = new PlayerStats();
        stats.setUser(user);
        stats.setTotalGames(0);
        stats.setTotalWins(0);
        stats.setTotalLosses(0);
        stats.setWinRate(0.0);
        stats.setCurrentStreak(0);
        stats.setBestStreak(0);
        stats.setTotalPoints(0);
        playerStatsRepository.save(stats);
        log.debug("Player stats created for user: {}", user.getId());

        // Create global ranking entry
        GlobalRanking ranking = new GlobalRanking();
        ranking.setUser(user);
        ranking.setRankPosition(0); // Will be calculated when rankings are recalculated
        ranking.setPreviousRank(-1); // New entry
        ranking.setTotalWins(0);
        ranking.setWinRate(0.0);
        ranking.setPoints(0);
        ranking.setCurrentStreak(0);
        ranking.setBestStreak(0);
        ranking.setTotalGames(0);
        globalRankingRepository.save(ranking);
        log.debug("Global ranking entry created for user: {}", user.getId());

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        Long expiresAt = System.currentTimeMillis() + jwtTokenProvider.getAccessTokenExpirationMs();
        Long expiresIn = jwtTokenProvider.getAccessTokenExpirationMs();

        log.info("JWT tokens generated for user: {}", user.getEmail());

        // Build user profile response (simplified for auth)
        UserProfileResponse userProfile = UserProfileResponse.builder()
                .id(user.getId().toString())
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatarUrl(user.getProfilePicture())
                .authProvider(user.getAuthProvider().name())
                .createdAt(user.getCreatedAt() != null ?
                    user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .lastLoginAt(user.getLastLogin() != null ?
                    user.getLastLogin().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .build();

        // Build and return response
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userProfile)
                .expiresAt(expiresAt)
                .expiresIn(expiresIn)
                // Legacy fields for backward compatibility
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .roles(new String[]{user.getRole().name()})
                .build();
    }

    /**
     * Login with email and password
     *
     * WORKFLOW:
     * 1. Find user by email
     * 2. Validate password with BCrypt
     * 3. Check if user is active
     * 4. Update last login timestamp
     * 5. Generate JWT access and refresh tokens
     * 6. Return AuthResponse with tokens and user info
     *
     * @param request Login credentials (email, password)
     * @return AuthResponse with JWT tokens and user info
     * @throws UserNotFoundException if user not found
     * @throws UnauthorizedException if password is invalid or user is inactive
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found: {}", request.getEmail());
                    return new UnauthorizedException("Invalid email or password");
                });

        // Check if user is LOCAL auth provider
        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            log.warn("Login failed: User registered with {}: {}", user.getAuthProvider(), request.getEmail());
            throw new UnauthorizedException("Please login with " + user.getAuthProvider().name());
        }

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed: Invalid password for user: {}", request.getEmail());
            throw new UnauthorizedException("Invalid email or password");
        }

        // Check if user is active
        if (!user.getIsActive()) {
            log.warn("Login failed: User account is inactive: {}", request.getEmail());
            throw new UnauthorizedException("Account is inactive. Please contact support.");
        }

        // Update last login
        user.updateLastLogin();
        userRepository.save(user);
        log.debug("Updated last login for user: {}", user.getEmail());

        // Generate JWT tokens
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        Long expiresAt = System.currentTimeMillis() + jwtTokenProvider.getAccessTokenExpirationMs();
        Long expiresIn = jwtTokenProvider.getAccessTokenExpirationMs();

        log.info("User logged in successfully: {}", user.getEmail());

        // Build user profile response (simplified for auth)
        UserProfileResponse userProfile = UserProfileResponse.builder()
                .id(user.getId().toString())
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatarUrl(user.getProfilePicture())
                .authProvider(user.getAuthProvider().name())
                .createdAt(user.getCreatedAt() != null ?
                    user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .lastLoginAt(user.getLastLogin() != null ?
                    user.getLastLogin().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .build();

        // Build and return response
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .user(userProfile)
                .expiresAt(expiresAt)
                .expiresIn(expiresIn)
                // Legacy fields for backward compatibility
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .roles(new String[]{user.getRole().name()})
                .build();
    }

    /**
     * Refresh JWT access token using refresh token
     *
     * WORKFLOW:
     * 1. Validate refresh token
     * 2. Extract user email from token
     * 3. Load user from database
     * 4. Generate new access and refresh tokens
     * 5. Return AuthResponse with new tokens
     *
     * @param refreshToken Refresh token
     * @return AuthResponse with new JWT tokens
     * @throws UnauthorizedException if refresh token is invalid
     */
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        log.debug("Token refresh requested");

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            log.warn("Token refresh failed: Invalid refresh token");
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // Extract email from token
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        log.debug("Refreshing token for user: {}", email);

        // Load user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Token refresh failed: User not found: {}", email);
                    return new UserNotFoundException("User not found: " + email);
                });

        // Check if user is active
        if (!user.getIsActive()) {
            log.warn("Token refresh failed: User account is inactive: {}", email);
            throw new UnauthorizedException("Account is inactive");
        }

        // Generate new tokens
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());
        Long expiresAt = System.currentTimeMillis() + jwtTokenProvider.getAccessTokenExpirationMs();
        Long expiresIn = jwtTokenProvider.getAccessTokenExpirationMs();

        log.info("Token refreshed successfully for user: {}", email);

        // Build user profile response (simplified for auth)
        UserProfileResponse userProfile = UserProfileResponse.builder()
                .id(user.getId().toString())
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatarUrl(user.getProfilePicture())
                .authProvider(user.getAuthProvider().name())
                .createdAt(user.getCreatedAt() != null ?
                    user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .lastLoginAt(user.getLastLogin() != null ?
                    user.getLastLogin().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() : null)
                .build();

        // Build and return response
        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .user(userProfile)
                .expiresAt(expiresAt)
                .expiresIn(expiresIn)
                // Legacy fields for backward compatibility
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .roles(new String[]{user.getRole().name()})
                .build();
    }

    /**
     * Get current authenticated user profile
     *
     * WORKFLOW:
     * 1. Find user by email
     * 2. Load player stats
     * 3. Build UserProfileResponse with user and stats data
     * 4. Return profile response
     *
     * @param email User email (from JWT token)
     * @return UserProfileResponse with user profile and statistics
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String email) {
        log.debug("Fetching profile for user: {}", email);

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", email);
                    return new UserNotFoundException("User not found: " + email);
                });

        // Load player stats
        PlayerStats stats = playerStatsRepository.findByUserId(user.getId())
                .orElse(null);

        // Build statistics DTO
        UserProfileResponse.Statistics statisticsDto = null;
        if (stats != null) {
            statisticsDto = UserProfileResponse.Statistics.builder()
                    .totalGames(stats.getTotalGames())
                    .wins(stats.getTotalWins())
                    .losses(stats.getTotalLosses())
                    .winRate(stats.getWinRate())
                    .totalPoints(stats.getTotalPoints())
                    .averagePoints(stats.getTotalGames() > 0
                            ? (double) stats.getTotalPoints() / stats.getTotalGames()
                            : 0.0)
                    .currentStreak(stats.getCurrentStreak())
                    .bestStreak(stats.getBestStreak())
                    .totalCardsPlayed(0) // TODO: Track this metric
                    .totalOnesCalledSuccess(0) // TODO: Track this metric
                    .totalOnesCalledFailed(0) // TODO: Track this metric
                    .fastestWinSeconds(null) // TODO: Track this metric
                    .favoriteColor(null) // TODO: Track this metric
                    .build();
        }

        // Build and return profile response
        return UserProfileResponse.builder()
                .userId(user.getId().toString())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatarUrl(user.getProfilePicture())
                .tier("BRONZE") // TODO: Calculate tier from stats
                .createdAt(user.getCreatedAt() != null
                        ? user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                        : null)
                .lastLoginAt(user.getLastLogin() != null
                        ? user.getLastLogin().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                        : null)
                .stats(statisticsDto)
                .achievements(null) // TODO: Load achievements
                .recentGames(null) // TODO: Load recent games
                .preferences(null) // TODO: Load user preferences
                .build();
    }

    /**
     * Check if email is available for registration
     *
     * @param email Email to check
     * @return true if available, false if already taken
     */
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        boolean available = !userRepository.existsByEmail(email);
        log.debug("Email availability check: {} - {}", email, available ? "available" : "taken");
        return available;
    }

    /**
     * Check if nickname is available for registration
     *
     * @param nickname Nickname to check
     * @return true if available, false if already taken
     */
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        boolean available = !userRepository.existsByNickname(nickname);
        log.debug("Nickname availability check: {} - {}", nickname, available ? "available" : "taken");
        return available;
    }
}
