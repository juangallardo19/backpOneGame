package com.oneonline.backend.config;

import com.oneonline.backend.security.JwtAuthFilter;
import com.oneonline.backend.security.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security Configuration for ONE Online Backend
 *
 * Configures:
 * - JWT authentication filter
 * - OAuth2 login (Google, GitHub)
 * - CORS policy
 * - Public/Protected endpoints
 * - BCrypt password encoding
 * - Stateless session management
 *
 * Design Pattern: None (Configuration class)
 *
 * @author Juan Gallardo
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final OAuth2SuccessHandler oauth2SuccessHandler;

    /**
     * Configures HTTP security for the application
     *
     * PUBLIC ENDPOINTS:
     * - /api/auth/** (login, register, refresh)
     * - /oauth2/** (OAuth2 authorization)
     * - /ws/** (WebSocket connections)
     * - /error (Spring Boot error page)
     *
     * PROTECTED ENDPOINTS:
     * - /api/rooms/** (room management)
     * - /api/game/** (game actions)
     * - /api/ranking/** (leaderboard)
     * - /api/users/** (user profile)
     *
     * @param http HttpSecurity configuration object
     * @return Configured SecurityFilterChain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for REST API (using JWT tokens)
            .csrf(AbstractHttpConfigurer::disable)

            // Configure authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints - no authentication required
                .requestMatchers(
                    "/api/auth/**",           // Authentication endpoints
                    "/oauth2/**",             // OAuth2 authorization
                    "/login/oauth2/**",       // OAuth2 login callback
                    "/ws/**",                 // WebSocket connections
                    "/error",                 // Spring error page
                    "/actuator/health",       // Health check
                    "/api/ranking/global",    // Public global ranking
                    "/api/ranking/initialize", // Public initialization endpoint
                    "/api/ranking/stats",      // Public ranking stats
                    "/api/rooms/**/beacon-leave" // sendBeacon leave endpoint (validates token manually)
                ).permitAll()

                // Protected endpoints - JWT required
                .requestMatchers(
                    "/api/rooms/**",          // Room management
                    "/api/game/**",           // Game actions
                    "/api/ranking/**",        // Other ranking endpoints (require auth)
                    "/api/users/**"           // User profile management
                ).authenticated()

                // All other requests require authentication
                .anyRequest().authenticated()
            )

            // Configure OAuth2 login
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(authorization -> authorization
                    .baseUri("/oauth2/authorize")
                )
                .redirectionEndpoint(redirection -> redirection
                    .baseUri("/oauth2/callback/*")
                )
                .successHandler(oauth2SuccessHandler)  // Generate JWT after OAuth2 success
            )

            // Stateless session - no server-side sessions (using JWT)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            // Add JWT filter before UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Password encoder using BCrypt algorithm
     *
     * BCrypt is a secure password hashing function with:
     * - Salt generation (automatic)
     * - Configurable cost factor (default: 10)
     * - Resistance to rainbow table attacks
     *
     * @return BCryptPasswordEncoder instance
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Cost factor 12 for extra security
    }

    /**
     * Authentication manager for manual authentication
     *
     * Used by AuthService for login validation
     *
     * @param config Spring's authentication configuration
     * @return AuthenticationManager instance
     * @throws Exception if configuration fails
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
