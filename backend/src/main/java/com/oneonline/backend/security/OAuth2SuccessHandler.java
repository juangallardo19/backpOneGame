package com.oneonline.backend.security;

import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * OAuth2SuccessHandler - OAuth2 Authentication Success Handler
 *
 * Handles successful OAuth2 authentication (Google, GitHub).
 *
 * WORKFLOW:
 * 1. Extract user info from OAuth2User
 * 2. Find or create user in database
 * 3. Generate JWT token
 * 4. Redirect to frontend with token
 *
 * REDIRECT URL FORMAT:
 * {frontendUrl}/auth/callback?token={jwt_token}&userId={userId}
 *
 * SUPPORTED PROVIDERS:
 * - Google (email, name, picture)
 * - GitHub (login, email, avatar_url)
 *
 * @author Juan Gallardo
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @Value("${cors.allowed-origins}")
    private String frontendUrl;

    /**
     * Handle successful OAuth2 authentication
     *
     * @param request HTTP request
     * @param response HTTP response
     * @param authentication Authentication object
     * @throws IOException if redirect fails
     */
    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        log.info("OAuth2 authentication successful");

        try {
            // Extract OAuth2 user info
            OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();

            // Determine provider (Google or GitHub)
            String provider = determineProvider(oauth2User);

            // Extract email based on provider
            String email = extractEmail(oauth2User, provider);
            String nickname = extractNickname(oauth2User, provider);
            String profilePicture = extractProfilePicture(oauth2User, provider);
            String oauth2Id = extractOAuth2Id(oauth2User, provider);

            log.info("OAuth2 login: email={}, provider={}", email, provider);

            // Find or create user
            User user = userRepository.findByEmail(email)
                    .orElseGet(() -> createNewOAuth2User(email, nickname, profilePicture, oauth2Id, provider));

            // Update last login
            user.updateLastLogin();
            userRepository.save(user);

            // Generate JWT tokens
            String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail());
            String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId(), user.getEmail());

            // Redirect to frontend with token
            String redirectUrl = buildRedirectUrl(accessToken, refreshToken, user.getId());

            log.info("Redirecting to frontend: {}", redirectUrl);
            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("OAuth2 authentication failed: {}", e.getMessage(), e);

            // Redirect to frontend with error
            String errorUrl = getFrontendBaseUrl() + "/auth/error?message=" +
                    URLEncoder.encode("Authentication failed", StandardCharsets.UTF_8);
            response.sendRedirect(errorUrl);
        }
    }

    /**
     * Determine OAuth2 provider (Google or GitHub)
     *
     * @param oauth2User OAuth2 user
     * @return Provider name
     */
    private String determineProvider(OAuth2User oauth2User) {
        // Google has 'sub' attribute, GitHub has 'id'
        if (oauth2User.getAttribute("sub") != null) {
            return "GOOGLE";
        } else if (oauth2User.getAttribute("login") != null) {
            return "GITHUB";
        }
        return "UNKNOWN";
    }

    /**
     * Extract email from OAuth2User
     *
     * @param oauth2User OAuth2 user
     * @param provider Provider name
     * @return Email address
     */
    private String extractEmail(OAuth2User oauth2User, String provider) {
        return oauth2User.getAttribute("email");
    }

    /**
     * Extract nickname from OAuth2User
     *
     * @param oauth2User OAuth2 user
     * @param provider Provider name
     * @return Nickname
     */
    private String extractNickname(OAuth2User oauth2User, String provider) {
        if ("GOOGLE".equals(provider)) {
            return oauth2User.getAttribute("name");
        } else if ("GITHUB".equals(provider)) {
            return oauth2User.getAttribute("login");
        }
        return "User";
    }

    /**
     * Extract profile picture URL from OAuth2User
     *
     * @param oauth2User OAuth2 user
     * @param provider Provider name
     * @return Profile picture URL
     */
    private String extractProfilePicture(OAuth2User oauth2User, String provider) {
        if ("GOOGLE".equals(provider)) {
            return oauth2User.getAttribute("picture");
        } else if ("GITHUB".equals(provider)) {
            return oauth2User.getAttribute("avatar_url");
        }
        return null;
    }

    /**
     * Extract OAuth2 provider user ID
     *
     * @param oauth2User OAuth2 user
     * @param provider Provider name
     * @return Provider user ID
     */
    private String extractOAuth2Id(OAuth2User oauth2User, String provider) {
        if ("GOOGLE".equals(provider)) {
            return oauth2User.getAttribute("sub");
        } else if ("GITHUB".equals(provider)) {
            Object id = oauth2User.getAttribute("id");
            return id != null ? id.toString() : null;
        }
        return null;
    }

    /**
     * Create new OAuth2 user in database
     *
     * @param email User email
     * @param nickname User nickname
     * @param profilePicture Profile picture URL
     * @param oauth2Id OAuth2 provider user ID
     * @param provider Provider name
     * @return Created user
     */
    private User createNewOAuth2User(String email, String nickname, String profilePicture, String oauth2Id, String provider) {
        User user = new User();
        user.setEmail(email);
        user.setNickname(nickname != null ? nickname : email.split("@")[0]);
        user.setProfilePicture(profilePicture);
        user.setOauth2Id(oauth2Id);
        user.setAuthProvider(User.AuthProvider.valueOf(provider));
        user.setIsActive(true);
        user.setRole(User.UserRole.USER);

        return userRepository.save(user);
    }

    /**
     * Build redirect URL with JWT token
     *
     * @param accessToken Access token
     * @param refreshToken Refresh token
     * @param userId User ID
     * @return Redirect URL
     */
    private String buildRedirectUrl(String accessToken, String refreshToken, Long userId) {
        String baseUrl = getFrontendBaseUrl();

        return String.format("%s/auth/callback?token=%s&refreshToken=%s&userId=%d",
                baseUrl,
                URLEncoder.encode(accessToken, StandardCharsets.UTF_8),
                URLEncoder.encode(refreshToken, StandardCharsets.UTF_8),
                userId
        );
    }

    /**
     * Get frontend base URL from configuration
     *
     * Detects if user is coming from production (Vercel) or localhost
     * and returns the appropriate frontend URL.
     *
     * @return Frontend base URL
     */
    private String getFrontendBaseUrl() {
        if (frontendUrl == null || frontendUrl.isEmpty()) {
            return "http://localhost:3000";
        }

        // If single URL, return it
        if (!frontendUrl.contains(",")) {
            return frontendUrl.trim();
        }

        // Multiple URLs: split and find the non-localhost one for production
        String[] urls = frontendUrl.split(",");

        // Prefer HTTPS URLs (production) over HTTP (localhost)
        for (String url : urls) {
            String trimmed = url.trim();
            if (trimmed.startsWith("https://")) {
                return trimmed;
            }
        }

        // Fallback to first URL if no HTTPS found
        return urls[0].trim();
    }
}
