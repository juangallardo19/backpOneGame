package com.oneonline.backend.security;

import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;

/**
 * CustomUserDetailsService - Spring Security UserDetailsService Implementation
 *
 * Loads user-specific data from database for authentication.
 *
 * RESPONSIBILITIES:
 * - Load user by email (username)
 * - Convert User entity to UserDetails
 * - Provide user authorities (roles)
 *
 * Used by:
 * - JwtAuthFilter (to load user after JWT validation)
 * - AuthenticationManager (for login)
 *
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Load user by username (email)
     *
     * Called by Spring Security during authentication.
     *
     * @param username User email address
     * @return UserDetails object
     * @throws UsernameNotFoundException if user not found
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by email: {}", username);

        // Find user by email
        User user = userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));

        // Check if user is active
        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + username);
        }

        log.debug("User loaded successfully: {}", username);

        // Convert to UserDetails
        return buildUserDetails(user);
    }

    /**
     * Build UserDetails object from User entity
     *
     * @param user User entity
     * @return UserDetails object
     */
    private UserDetails buildUserDetails(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash() != null ? user.getPasswordHash() : "")
                .authorities(getAuthorities(user))
                .accountExpired(false)
                .accountLocked(!user.getIsActive())
                .credentialsExpired(false)
                .disabled(!user.getIsActive())
                .build();
    }

    /**
     * Get user authorities (roles)
     *
     * @param user User entity
     * @return Collection of granted authorities
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        // Convert user role to Spring Security authority
        String roleName = "ROLE_" + user.getRole().name();
        return Collections.singletonList(new SimpleGrantedAuthority(roleName));
    }

    /**
     * Load user by ID (custom method)
     *
     * Useful for loading user from JWT token userId claim.
     *
     * @param userId User ID
     * @return UserDetails object
     * @throws UsernameNotFoundException if user not found
     */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) throws UsernameNotFoundException {
        log.debug("Loading user by ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));

        if (!user.getIsActive()) {
            throw new UsernameNotFoundException("User account is inactive: " + userId);
        }

        return buildUserDetails(user);
    }
}
