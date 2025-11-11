package com.oneonline.backend.service.auth;

import com.oneonline.backend.model.entity.GlobalRanking;
import com.oneonline.backend.model.entity.PlayerStats;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.GlobalRankingRepository;
import com.oneonline.backend.repository.PlayerStatsRepository;
import com.oneonline.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * OAuth2Service - OAuth2 Authentication Service
 *
 * Handles OAuth2 post-login processing for Google and GitHub.
 *
 * RESPONSIBILITIES:
 * - Process OAuth2 authentication success
 * - Create or update OAuth2 users in database
 * - Link OAuth2 accounts to existing users
 * - Update OAuth2 user profiles
 *
 * SUPPORTED PROVIDERS:
 * - Google (GOOGLE)
 * - GitHub (GITHUB)
 *
 * USER DATA:
 * - Email (required)
 * - Name/Nickname (from provider)
 * - Profile picture (from provider)
 * - OAuth2 provider user ID
 *
 * Used by:
 * - OAuth2SuccessHandler (after successful OAuth2 login)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OAuth2Service {

    private final UserRepository userRepository;
    private final PlayerStatsRepository playerStatsRepository;
    private final GlobalRankingRepository globalRankingRepository;

    /**
     * Process OAuth2 post-login
     *
     * WORKFLOW:
     * 1. Check if user exists by email
     * 2. If exists:
     *    - Update OAuth2 info if needed
     *    - Update last login timestamp
     * 3. If not exists:
     *    - Create new user with OAuth2 data
     *    - Create PlayerStats for new user
     * 4. Return user entity
     *
     * @param email User email from OAuth2 provider
     * @param nickname User nickname/name from OAuth2 provider
     * @param profilePicture Profile picture URL from OAuth2 provider
     * @param oauth2Id OAuth2 provider user ID
     * @param provider Provider name (GOOGLE or GITHUB)
     * @return User entity (created or updated)
     */
    @Transactional
    public User processOAuthPostLogin(
            String email,
            String nickname,
            String profilePicture,
            String oauth2Id,
            User.AuthProvider provider) {

        log.info("Processing OAuth2 post-login: email={}, provider={}", email, provider);

        // Check if user exists by email
        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null) {
            // User exists - update OAuth2 info if needed
            log.debug("User already exists: {}", email);

            boolean needsUpdate = false;

            // Update OAuth2 ID if not set
            if (user.getOauth2Id() == null && oauth2Id != null) {
                user.setOauth2Id(oauth2Id);
                needsUpdate = true;
                log.debug("Updated OAuth2 ID for user: {}", email);
            }

            // Update auth provider if different (user switched to OAuth2)
            if (user.getAuthProvider() != provider) {
                log.info("User switched from {} to {}: {}", user.getAuthProvider(), provider, email);
                user.setAuthProvider(provider);
                needsUpdate = true;
            }

            // Update profile picture if changed
            if (profilePicture != null && !profilePicture.equals(user.getProfilePicture())) {
                user.setProfilePicture(profilePicture);
                needsUpdate = true;
                log.debug("Updated profile picture for user: {}", email);
            }

            // Update last login
            user.updateLastLogin();
            needsUpdate = true;

            if (needsUpdate) {
                user = userRepository.save(user);
                log.info("Updated OAuth2 user: {}", email);
            }

        } else {
            // User doesn't exist - create new OAuth2 user
            log.info("Creating new OAuth2 user: email={}, provider={}", email, provider);

            user = createNewOAuth2User(email, nickname, profilePicture, oauth2Id, provider);
            log.info("Created new OAuth2 user: {} (ID: {})", email, user.getId());
        }

        return user;
    }

    /**
     * Create new OAuth2 user in database
     *
     * WORKFLOW:
     * 1. Create User entity with OAuth2 data
     * 2. Set auth provider (GOOGLE or GITHUB)
     * 3. Set default values (active, role)
     * 4. Save user to database
     * 5. Create PlayerStats for new user
     * 6. Return user entity
     *
     * @param email User email
     * @param nickname User nickname (from provider or generated from email)
     * @param profilePicture Profile picture URL
     * @param oauth2Id OAuth2 provider user ID
     * @param provider Provider name (GOOGLE or GITHUB)
     * @return Created User entity
     */
    @Transactional
    protected User createNewOAuth2User(
            String email,
            String nickname,
            String profilePicture,
            String oauth2Id,
            User.AuthProvider provider) {

        log.debug("Creating new OAuth2 user: email={}, provider={}", email, provider);

        // Generate nickname from email if not provided
        if (nickname == null || nickname.isBlank()) {
            nickname = generateNicknameFromEmail(email);
            log.debug("Generated nickname from email: {}", nickname);
        }

        // Ensure nickname is unique
        nickname = ensureUniqueNickname(nickname);

        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setNickname(nickname);
        user.setProfilePicture(profilePicture);
        user.setOauth2Id(oauth2Id);
        user.setAuthProvider(provider);
        user.setPasswordHash(null); // OAuth2 users don't have passwords
        user.setIsActive(true);
        user.setRole(User.UserRole.USER);

        // Save user
        user = userRepository.save(user);
        log.info("OAuth2 user saved: {} (ID: {})", email, user.getId());

        // Create player stats
        createPlayerStatsForUser(user);

        // Create global ranking entry
        createGlobalRankingForUser(user);

        return user;
    }

    /**
     * Generate nickname from email
     *
     * Extracts the username part from email (before @).
     * Example: "john.doe@example.com" -> "john.doe"
     *
     * @param email User email
     * @return Generated nickname
     */
    private String generateNicknameFromEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "User" + System.currentTimeMillis();
        }
        return email.substring(0, email.indexOf("@"));
    }

    /**
     * Ensure nickname is unique
     *
     * If nickname already exists, append a number to make it unique.
     * Example: "john" -> "john1", "john2", etc.
     *
     * @param nickname Desired nickname
     * @return Unique nickname
     */
    private String ensureUniqueNickname(String nickname) {
        String originalNickname = nickname;
        int counter = 1;

        while (userRepository.existsByNickname(nickname)) {
            nickname = originalNickname + counter;
            counter++;
            log.debug("Nickname '{}' exists, trying: {}", originalNickname, nickname);
        }

        if (!nickname.equals(originalNickname)) {
            log.info("Nickname changed from '{}' to '{}' for uniqueness", originalNickname, nickname);
        }

        return nickname;
    }

    /**
     * Create PlayerStats entity for new user
     *
     * Initializes all statistics to zero.
     *
     * @param user User entity
     */
    private void createPlayerStatsForUser(User user) {
        log.debug("Creating player stats for user: {}", user.getId());

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
    }

    /**
     * Create GlobalRanking entity for new user
     *
     * Initializes ranking with zero points and unranked position.
     *
     * @param user User entity
     */
    private void createGlobalRankingForUser(User user) {
        log.debug("Creating global ranking for user: {}", user.getId());

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
        log.debug("Global ranking created for user: {}", user.getId());
    }

    /**
     * Link OAuth2 account to existing user
     *
     * Used when a user registered with email/password wants to link
     * their Google or GitHub account.
     *
     * @param userId Existing user ID
     * @param oauth2Id OAuth2 provider user ID
     * @param provider Provider name (GOOGLE or GITHUB)
     * @return Updated User entity
     */
    @Transactional
    public User linkOAuth2Account(Long userId, String oauth2Id, User.AuthProvider provider) {
        log.info("Linking OAuth2 account: userId={}, provider={}", userId, provider);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Update OAuth2 info
        user.setOauth2Id(oauth2Id);
        user.setAuthProvider(provider);

        user = userRepository.save(user);
        log.info("OAuth2 account linked successfully: userId={}, provider={}", userId, provider);

        return user;
    }

    /**
     * Unlink OAuth2 account from user
     *
     * Used when a user wants to unlink their Google or GitHub account
     * and switch back to email/password authentication.
     *
     * @param userId User ID
     * @return Updated User entity
     */
    @Transactional
    public User unlinkOAuth2Account(Long userId) {
        log.info("Unlinking OAuth2 account: userId={}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        // Check if user has a password (can't unlink if no password set)
        if (user.getPasswordHash() == null) {
            throw new IllegalStateException("Cannot unlink OAuth2 account: No password set. Please set a password first.");
        }

        // Unlink OAuth2
        user.setOauth2Id(null);
        user.setAuthProvider(User.AuthProvider.LOCAL);

        user = userRepository.save(user);
        log.info("OAuth2 account unlinked successfully: userId={}", userId);

        return user;
    }
}
