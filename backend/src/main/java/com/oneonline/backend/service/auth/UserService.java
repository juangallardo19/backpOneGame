package com.oneonline.backend.service.auth;

import com.oneonline.backend.exception.UnauthorizedException;
import com.oneonline.backend.exception.UserAlreadyExistsException;
import com.oneonline.backend.exception.UserNotFoundException;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * UserService - User Management Service
 *
 * Handles CRUD operations for users.
 *
 * RESPONSIBILITIES:
 * - Create, read, update, delete users
 * - Change user passwords
 * - Activate/deactivate user accounts
 * - Update user profiles
 * - User search operations
 *
 * SECURITY:
 * - Password hashing with BCrypt
 * - Password validation
 * - Email/nickname uniqueness validation
 *
 * Used by:
 * - AuthController (user management)
 * - AdminController (future feature)
 * - Other services (user lookups)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get user by ID
     *
     * @param userId User ID
     * @return User entity
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserById(Long userId) {
        log.debug("Fetching user by ID: {}", userId);

        return userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("User not found: {}", userId);
                    return new UserNotFoundException(userId);
                });
    }

    /**
     * Get user by email
     *
     * @param email User email
     * @return User entity
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        log.debug("Fetching user by email: {}", email);

        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", email);
                    return new UserNotFoundException("email", email);
                });
    }

    /**
     * Get user by nickname
     *
     * @param nickname User nickname
     * @return User entity
     * @throws UserNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public User getUserByNickname(String nickname) {
        log.debug("Fetching user by nickname: {}", nickname);

        return userRepository.findByNickname(nickname)
                .orElseThrow(() -> {
                    log.warn("User not found with nickname: {}", nickname);
                    return new UserNotFoundException("nickname", nickname);
                });
    }

    /**
     * Find user by email (returns Optional)
     *
     * @param email User email
     * @return Optional<User>
     */
    @Transactional(readOnly = true)
    public Optional<User> findUserByEmail(String email) {
        log.debug("Finding user by email: {}", email);
        return userRepository.findByEmail(email);
    }

    /**
     * Get all active users
     *
     * @return List of active users
     */
    @Transactional(readOnly = true)
    public List<User> getAllActiveUsers() {
        log.debug("Fetching all active users");
        return userRepository.findAllByIsActive(true);
    }

    /**
     * Create new user
     *
     * Used for manual user creation (admin feature).
     * For registration, use AuthService.register().
     *
     * @param user User entity to create
     * @return Created user
     * @throws UserAlreadyExistsException if email or nickname already exists
     */
    @Transactional
    public User createUser(User user) {
        log.info("Creating new user: {}", user.getEmail());

        // Validate email uniqueness
        if (userRepository.existsByEmail(user.getEmail())) {
            log.warn("Cannot create user: Email already exists: {}", user.getEmail());
            throw new UserAlreadyExistsException("Email already exists: " + user.getEmail());
        }

        // Validate nickname uniqueness
        if (userRepository.existsByNickname(user.getNickname())) {
            log.warn("Cannot create user: Nickname already exists: {}", user.getNickname());
            throw new UserAlreadyExistsException("Nickname already exists: " + user.getNickname());
        }

        // Save user
        User createdUser = userRepository.save(user);
        log.info("User created successfully: {} (ID: {})", createdUser.getEmail(), createdUser.getId());

        return createdUser;
    }

    /**
     * Update user profile
     *
     * Updates user information (nickname, profile picture).
     * Does NOT update email, password, or auth provider.
     *
     * @param userId User ID
     * @param nickname New nickname (optional)
     * @param profilePicture New profile picture URL (optional)
     * @return Updated user
     * @throws UserNotFoundException if user not found
     * @throws UserAlreadyExistsException if new nickname already exists
     */
    @Transactional
    public User updateUserProfile(Long userId, String nickname, String profilePicture) {
        log.info("Updating user profile: userId={}", userId);

        // Find user
        User user = getUserById(userId);

        // Update nickname if provided
        if (nickname != null && !nickname.isBlank() && !nickname.equals(user.getNickname())) {
            // Check if new nickname is available
            if (userRepository.existsByNickname(nickname)) {
                log.warn("Cannot update user: Nickname already exists: {}", nickname);
                throw new UserAlreadyExistsException("Nickname already exists: " + nickname);
            }
            user.setNickname(nickname);
            log.debug("Updated nickname for user {}: {}", userId, nickname);
        }

        // Update profile picture if provided
        if (profilePicture != null && !profilePicture.isBlank()) {
            user.setProfilePicture(profilePicture);
            log.debug("Updated profile picture for user {}", userId);
        }

        // Save changes
        user = userRepository.save(user);
        log.info("User profile updated successfully: userId={}", userId);

        return user;
    }

    /**
     * Change user password
     *
     * WORKFLOW:
     * 1. Validate user exists
     * 2. Validate old password (if user is LOCAL)
     * 3. Hash new password with BCrypt
     * 4. Update password in database
     *
     * @param userId User ID
     * @param oldPassword Current password (for validation)
     * @param newPassword New password (plain text, will be hashed)
     * @throws UserNotFoundException if user not found
     * @throws UnauthorizedException if old password is incorrect
     * @throws IllegalStateException if user is OAuth2 (cannot change password)
     */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        log.info("Changing password for user: {}", userId);

        // Find user
        User user = getUserById(userId);

        // Check if user is LOCAL (OAuth2 users don't have passwords)
        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            log.warn("Cannot change password: User is OAuth2: userId={}, provider={}",
                    userId, user.getAuthProvider());
            throw new IllegalStateException("Cannot change password for OAuth2 users");
        }

        // Validate old password
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            log.warn("Password change failed: Invalid old password for user: {}", userId);
            throw new UnauthorizedException("Current password is incorrect");
        }

        // Hash and set new password
        String newPasswordHash = passwordEncoder.encode(newPassword);
        user.setPasswordHash(newPasswordHash);

        // Save changes
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", userId);
    }

    /**
     * Delete user (soft delete - deactivate)
     *
     * Sets isActive to false instead of actually deleting the record.
     * This preserves game history and statistics.
     *
     * @param userId User ID
     * @throws UserNotFoundException if user not found
     */
    @Transactional
    public void deleteUser(Long userId) {
        log.info("Deleting (deactivating) user: {}", userId);

        // Find user
        User user = getUserById(userId);

        // Deactivate user
        user.setIsActive(false);

        // Save changes
        userRepository.save(user);
        log.info("User deactivated successfully: {}", userId);
    }

    /**
     * Activate user account
     *
     * Sets isActive to true. Used for reactivating deactivated accounts.
     *
     * @param userId User ID
     * @throws UserNotFoundException if user not found
     */
    @Transactional
    public void activateUser(Long userId) {
        log.info("Activating user: {}", userId);

        // Find user
        User user = getUserById(userId);

        // Activate user
        user.setIsActive(true);

        // Save changes
        userRepository.save(user);
        log.info("User activated successfully: {}", userId);
    }

    /**
     * Check if user exists by ID
     *
     * @param userId User ID
     * @return true if exists, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean userExists(Long userId) {
        boolean exists = userRepository.existsById(userId);
        log.debug("User exists check: userId={}, exists={}", userId, exists);
        return exists;
    }

    /**
     * Check if email is available
     *
     * @param email Email to check
     * @return true if available, false if taken
     */
    @Transactional(readOnly = true)
    public boolean isEmailAvailable(String email) {
        boolean available = !userRepository.existsByEmail(email);
        log.debug("Email availability check: {}, available={}", email, available);
        return available;
    }

    /**
     * Check if nickname is available
     *
     * @param nickname Nickname to check
     * @return true if available, false if taken
     */
    @Transactional(readOnly = true)
    public boolean isNicknameAvailable(String nickname) {
        boolean available = !userRepository.existsByNickname(nickname);
        log.debug("Nickname availability check: {}, available={}", nickname, available);
        return available;
    }

    /**
     * Count total users
     *
     * @return Total number of users
     */
    @Transactional(readOnly = true)
    public long countTotalUsers() {
        long count = userRepository.count();
        log.debug("Total users count: {}", count);
        return count;
    }

    /**
     * Count active users
     *
     * @return Number of active users
     */
    @Transactional(readOnly = true)
    public long countActiveUsers() {
        long count = userRepository.findAllByIsActive(true).size();
        log.debug("Active users count: {}", count);
        return count;
    }

    /**
     * Count users by auth provider
     *
     * @param provider Auth provider (LOCAL, GOOGLE, GITHUB)
     * @return Number of users with that provider
     */
    @Transactional(readOnly = true)
    public long countUsersByProvider(User.AuthProvider provider) {
        long count = userRepository.countByAuthProvider(provider);
        log.debug("Users by provider {}: {}", provider, count);
        return count;
    }
}
