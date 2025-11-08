package com.oneonline.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthFilter - JWT Authentication Filter
 *
 * Extends OncePerRequestFilter to ensure single execution per request.
 *
 * WORKFLOW:
 * 1. Extract JWT token from Authorization header
 * 2. Validate token using JwtTokenProvider
 * 3. Extract user email from token
 * 4. Load user details from database
 * 5. Set authentication in SecurityContext
 * 6. Continue filter chain
 *
 * AUTHORIZATION HEADER FORMAT:
 * Authorization: Bearer <jwt_token>
 *
 * PUBLIC ENDPOINTS (skipped):
 * - /api/auth/login
 * - /api/auth/register
 * - /oauth2/**
 * - /error
 * - /actuator/health
 *
 * @author Juan Gallardo
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    /**
     * Filter method executed once per request
     *
     * @param request HTTP request
     * @param response HTTP response
     * @param filterChain Filter chain
     * @throws ServletException Servlet exception
     * @throws IOException IO exception
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        try {
            // Extract JWT token from Authorization header
            String jwt = extractJwtFromRequest(request);

            // If token exists and is valid
            if (jwt != null && jwtTokenProvider.validateToken(jwt)) {

                // Extract user email from token
                String email = jwtTokenProvider.getEmailFromToken(jwt);

                // Load user details from database
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                // Create authentication object
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                // Set authentication details
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // Set authentication in SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.debug("JWT authentication successful for user: {}", email);

            } else if (jwt != null) {
                log.warn("Invalid JWT token in request");
            }

        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }

        // Continue filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Extract JWT token from Authorization header
     *
     * Expected format: "Bearer <token>"
     *
     * @param request HTTP request
     * @return JWT token or null if not found
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");

        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Remove "Bearer " prefix
        }

        return null;
    }

    /**
     * Determine if filter should be applied to this request
     *
     * Skip filter for public endpoints.
     *
     * @param request HTTP request
     * @return true if should skip filter
     */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();

        // Public endpoints that don't require authentication
        return path.startsWith("/api/auth/login") ||
               path.startsWith("/api/auth/register") ||
               path.startsWith("/api/auth/check-") ||
               path.startsWith("/oauth2/") ||
               path.startsWith("/login/oauth2/") ||
               path.equals("/error") ||
               path.startsWith("/actuator/health") ||
               path.startsWith("/ws") || // WebSocket initial connection
               path.startsWith("/favicon.ico");
    }
}
