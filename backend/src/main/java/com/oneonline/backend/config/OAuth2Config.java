package com.oneonline.backend.config;

import org.springframework.context.annotation.Configuration;

/**
 * OAuth2 Configuration for Social Login
 *
 * Supports authentication via:
 * - Google OAuth2
 * - GitHub OAuth2
 *
 * FLOW:
 * 1. User clicks "Login with Google/GitHub"
 * 2. Redirected to /oauth2/authorize/{provider}
 * 3. User authorizes on provider's page
 * 4. Provider redirects to /oauth2/callback/{provider}
 * 5. OAuth2SuccessHandler generates JWT token
 * 6. Frontend receives JWT token
 *
 * CONFIGURATION:
 * OAuth2 client details are configured in application.properties:
 *
 * spring.security.oauth2.client.registration.google.client-id=...
 * spring.security.oauth2.client.registration.google.client-secret=...
 * spring.security.oauth2.client.registration.google.scope=profile,email
 *
 * spring.security.oauth2.client.registration.github.client-id=...
 * spring.security.oauth2.client.registration.github.client-secret=...
 * spring.security.oauth2.client.registration.github.scope=user:email
 *
 * USER ATTRIBUTE MAPPING:
 * Google:
 * - email -> user.email
 * - name -> user.nickname
 * - picture -> user.profilePicture
 * - sub (subject) -> OAuth2 provider ID
 *
 * GitHub:
 * - email -> user.email
 * - login -> user.nickname
 * - avatar_url -> user.profilePicture
 * - id -> OAuth2 provider ID
 *
 * Design Pattern: None (Configuration class)
 *
 * @author Juan Gallardo
 * @see com.oneonline.backend.security.OAuth2SuccessHandler
 */
@Configuration
public class OAuth2Config {

    // OAuth2 configuration is handled by Spring Security auto-configuration
    // and application.properties settings

    // Custom OAuth2UserService can be added here if needed for advanced mapping
}
