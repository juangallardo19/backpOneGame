package com.oneonline.backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Entity - Represents registered users in the database
 *
 * This entity stores user authentication and profile information.
 * Users can register via:
 * - Traditional email/password (LOCAL)
 * - Google OAuth2 (GOOGLE)
 * - GitHub OAuth2 (GITHUB)
 *
 * TABLE: users
 *
 * RELATIONSHIPS:
 * - One-to-One with PlayerStats (statistics)
 * - One-to-One with GlobalRanking (ranking position)
 * - One-to-Many with GameHistory (won games)
 *
 * UNIQUE CONSTRAINTS:
 * - email (unique, not null)
 * - nickname (unique, not null)
 *
 * Design Pattern: None (JPA Entity)
 *
 * @author Juan Gallardo
 */
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_email", columnNames = "email"),
    @UniqueConstraint(name = "uk_user_nickname", columnNames = "nickname")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    /**
     * Primary key - Auto-generated ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User email address (unique)
     * Used for login and OAuth2 identification
     */
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    /**
     * User display name (unique)
     * Shown in game rooms and leaderboards
     */
    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    /**
     * Password hash (BCrypt)
     * Only used for LOCAL auth provider
     * Null for OAuth2 users (GOOGLE, GITHUB)
     */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /**
     * Authentication provider
     * Values: LOCAL, GOOGLE, GITHUB
     */
    @Column(name = "auth_provider", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider;

    /**
     * Profile picture URL
     * - For LOCAL: default avatar or uploaded image
     * - For GOOGLE: user's Google profile picture
     * - For GITHUB: user's GitHub avatar
     */
    @Column(name = "profile_picture", length = 500)
    private String profilePicture;

    /**
     * OAuth2 provider user ID
     * - For GOOGLE: Google sub (subject)
     * - For GITHUB: GitHub user ID
     * - For LOCAL: null
     */
    @Column(name = "oauth2_id", length = 100)
    private String oauth2Id;

    /**
     * Account creation timestamp
     * Set automatically on first insert
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Last login timestamp
     * Updated on every successful login
     */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    /**
     * Account active status
     * False if banned or deleted
     */
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * User role (for future admin features)
     * Values: USER, ADMIN
     */
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    /**
     * Set created_at timestamp before first insert
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.role == null) {
            this.role = UserRole.USER;
        }
    }

    /**
     * Update last_login timestamp
     */
    public void updateLastLogin() {
        this.lastLogin = LocalDateTime.now();
    }

    /**
     * Authentication Provider Enum
     */
    public enum AuthProvider {
        LOCAL,    // Email/password registration
        GOOGLE,   // Google OAuth2
        GITHUB    // GitHub OAuth2
    }

    /**
     * User Role Enum
     */
    public enum UserRole {
        USER,     // Regular player
        ADMIN     // Administrator (future feature)
    }
}
