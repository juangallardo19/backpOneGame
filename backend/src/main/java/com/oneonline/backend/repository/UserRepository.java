package com.oneonline.backend.repository;

import com.oneonline.backend.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * User Repository - Database access for User entity
 *
 * Provides CRUD operations and custom queries for users.
 *
 * METHODS:
 * - findByEmail(email) - Find user by email (for login)
 * - findByNickname(nickname) - Find user by nickname (unique check)
 * - findByOauth2Id(oauth2Id) - Find user by OAuth2 ID
 * - existsByEmail(email) - Check if email exists (for registration)
 * - existsByNickname(nickname) - Check if nickname exists (for registration)
 *
 * Design Pattern: Repository Pattern (Spring Data JPA)
 *
 * @author Juan Gallardo
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find user by email address
     *
     * Used for:
     * - Login validation
     * - Password recovery
     * - OAuth2 user lookup
     *
     * @param email User email address
     * @return Optional<User> if found, empty if not found
     */
    Optional<User> findByEmail(String email);

    /**
     * Find user by nickname (display name)
     *
     * Used for:
     * - Nickname uniqueness validation
     * - User search
     *
     * @param nickname User display name
     * @return Optional<User> if found, empty if not found
     */
    Optional<User> findByNickname(String nickname);

    /**
     * Find user by OAuth2 provider ID
     *
     * Used for:
     * - OAuth2 login (Google, GitHub)
     * - Linking OAuth2 accounts
     *
     * @param oauth2Id OAuth2 provider user ID
     * @return Optional<User> if found, empty if not found
     */
    Optional<User> findByOauth2Id(String oauth2Id);

    /**
     * Find user by email and auth provider
     *
     * Used for:
     * - Preventing duplicate accounts with different providers
     *
     * @param email User email
     * @param authProvider Authentication provider (LOCAL, GOOGLE, GITHUB)
     * @return Optional<User> if found, empty if not found
     */
    Optional<User> findByEmailAndAuthProvider(String email, User.AuthProvider authProvider);

    /**
     * Find user by auth provider and provider ID
     *
     * Used for:
     * - OAuth2 login (alternative to findByOauth2Id)
     * - Provider-specific lookups
     *
     * @param provider Authentication provider (LOCAL, GOOGLE, GITHUB)
     * @param providerId OAuth2 provider user ID
     * @return Optional<User> if found, empty if not found
     */
    @Query("SELECT u FROM User u WHERE u.authProvider = :provider AND u.oauth2Id = :providerId")
    Optional<User> findByAuthProviderAndProviderId(
        @Param("provider") User.AuthProvider provider,
        @Param("providerId") String providerId
    );

    /**
     * Check if email already exists
     *
     * Used for:
     * - Registration validation
     *
     * @param email Email to check
     * @return true if exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Check if nickname already exists
     *
     * Used for:
     * - Registration validation
     * - Profile update validation
     *
     * @param nickname Nickname to check
     * @return true if exists, false otherwise
     */
    boolean existsByNickname(String nickname);

    /**
     * Find all active users
     *
     * Used for:
     * - Admin dashboard
     * - User listing
     *
     * @param isActive Active status
     * @return List of active users
     */
    @Query("SELECT u FROM User u WHERE u.isActive = :isActive")
    java.util.List<User> findAllByIsActive(@Param("isActive") Boolean isActive);

    /**
     * Count users by auth provider
     *
     * Used for:
     * - Analytics
     * - Admin statistics
     *
     * @param authProvider Authentication provider
     * @return Number of users with that provider
     */
    long countByAuthProvider(User.AuthProvider authProvider);
}
