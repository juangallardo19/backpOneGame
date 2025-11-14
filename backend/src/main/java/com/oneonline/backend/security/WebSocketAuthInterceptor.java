package com.oneonline.backend.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * WebSocketAuthInterceptor - JWT Authentication for WebSocket Connections
 *
 * PROBLEM: WebSocket connections were not authenticated, causing guests to not receive game state.
 *
 * SOLUTION: This interceptor extracts JWT token from:
 * 1. WebSocket connection headers (Authorization header)
 * 2. Query parameters (?token=xxx)
 *
 * Then validates the token and sets the authenticated Principal.
 *
 * FLOW:
 * 1. Client connects to WebSocket with token
 * 2. Interceptor extracts token from headers or params
 * 3. Validates token using JwtTokenProvider
 * 4. Extracts user email from token
 * 5. Creates authenticated Principal
 * 6. Sets Principal in message headers
 * 7. User is now authenticated for all WebSocket messages
 *
 * USAGE:
 * Frontend should connect with:
 * - Header: Authorization: Bearer <token>
 * OR
 * - Query param: ws://localhost:8080/ws?token=<token>
 *
 * @author Claude + Juan Gallardo
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Log ALL commands to see what's happening
        if (accessor != null) {
            log.debug("📨 [WebSocket Auth] Message received - Command: {}, SessionId: {}",
                accessor.getCommand(), accessor.getSessionId());
        }

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            log.info("🔐 [WebSocket Auth] CONNECT command detected - New WebSocket connection attempt");

            // Extract token from headers or query params
            String token = extractToken(accessor);

            if (token != null) {
                log.info("🔑 [WebSocket Auth] Token found, validating...");

                try {
                    // Validate token
                    if (jwtTokenProvider.validateToken(token)) {
                        // Extract user email from token
                        String email = jwtTokenProvider.getEmailFromToken(token);
                        Long userId = jwtTokenProvider.getUserIdFromToken(token);

                        log.info("✅ [WebSocket Auth] Token valid for user: {} (ID: {})", email, userId);

                        // Create authentication with user email as principal
                        List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_USER")
                        );

                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(email, null, authorities);

                        // Set authenticated user in WebSocket session
                        accessor.setUser(authentication);

                        log.info("🎉 [WebSocket Auth] User {} authenticated successfully for WebSocket", email);
                    } else {
                        log.warn("⚠️ [WebSocket Auth] Invalid JWT token");
                    }
                } catch (Exception e) {
                    log.error("❌ [WebSocket Auth] Error validating token: {}", e.getMessage(), e);
                }
            } else {
                log.warn("⚠️ [WebSocket Auth] No token found in CONNECT command (checked headers and query params)");
                // Log all available headers for debugging
                log.warn("⚠️ [WebSocket Auth] Available native headers: {}", accessor.toNativeHeaderMap());
            }
        }

        return message;
    }

    /**
     * Extract JWT token from WebSocket connection
     *
     * Checks in order:
     * 1. Authorization header: "Bearer <token>"
     * 2. Query parameter: "token"
     * 3. Native header: "Authorization" (without Bearer)
     * 4. Native header: "auth" or "Auth"
     *
     * @param accessor STOMP header accessor
     * @return JWT token or null
     */
    private String extractToken(StompHeaderAccessor accessor) {
        log.debug("🔍 [WebSocket Auth] Extracting token from headers...");
        log.debug("🔍 [WebSocket Auth] All native headers: {}", accessor.toNativeHeaderMap());

        // 1. Check Authorization header with Bearer prefix
        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        log.debug("🔍 [WebSocket Auth] Authorization header: {}", authHeaders);

        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                log.info("🔍 [WebSocket Auth] ✅ Token found in Authorization header (Bearer)");
                return token;
            }
            // Check if token is passed directly without "Bearer"
            if (authHeader != null && !authHeader.isEmpty()) {
                log.info("🔍 [WebSocket Auth] ✅ Token found directly in Authorization header (no Bearer prefix)");
                return authHeader;
            }
        }

        // 2. Check lowercase authorization header
        authHeaders = accessor.getNativeHeader("authorization");
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String authHeader = authHeaders.get(0);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                log.info("🔍 [WebSocket Auth] ✅ Token found in authorization header (Bearer)");
                return token;
            }
            if (authHeader != null && !authHeader.isEmpty()) {
                log.info("🔍 [WebSocket Auth] ✅ Token found in authorization header (no Bearer)");
                return authHeader;
            }
        }

        // 3. Check token query parameter (for SockJS fallback)
        List<String> tokenParams = accessor.getNativeHeader("token");
        log.debug("🔍 [WebSocket Auth] token parameter: {}", tokenParams);

        if (tokenParams != null && !tokenParams.isEmpty()) {
            log.info("🔍 [WebSocket Auth] ✅ Token found in query parameter");
            return tokenParams.get(0);
        }

        // 4. Check auth header
        List<String> authParam = accessor.getNativeHeader("auth");
        if (authParam != null && !authParam.isEmpty()) {
            log.info("🔍 [WebSocket Auth] ✅ Token found in auth parameter");
            return authParam.get(0);
        }

        log.warn("❌ [WebSocket Auth] No token found in any header");
        return null;
    }
}
