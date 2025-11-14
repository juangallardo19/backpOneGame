package com.oneonline.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * WebSocketHandshakeInterceptor - Captures query parameters during WebSocket handshake
 *
 * PROBLEM: SockJS passes query parameters in the initial HTTP handshake, but they're not
 * available in the STOMP CONNECT frame. This interceptor captures them and stores them
 * in WebSocket session attributes so they can be accessed later.
 *
 * CRITICAL FOR: JWT token authentication via query parameter (?token=xxx)
 *
 * FLOW:
 * 1. Client connects to /ws?token=xxx
 * 2. This interceptor runs BEFORE the WebSocket upgrade
 * 3. Extracts "token" from query string
 * 4. Stores it in WebSocket session attributes
 * 5. Later, WebSocketAuthInterceptor can access it from session attributes
 *
 * @author Juan Gallardo
 */
@Component
@Slf4j
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {

    /**
     * Called before the WebSocket handshake
     *
     * Captures query parameters from the HTTP request and stores them
     * in WebSocket session attributes for later access.
     *
     * @param request HTTP request (contains query params)
     * @param response HTTP response
     * @param wsHandler WebSocket handler
     * @param attributes Session attributes (will be available in STOMP accessor)
     * @return true to proceed with handshake, false to reject
     */
    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        log.info("🤝 [WebSocket Handshake] ========== HANDSHAKE INITIATED ==========");

        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpRequest = servletRequest.getServletRequest();

            // Log request details
            log.info("🤝 [WebSocket Handshake] URI: {}", httpRequest.getRequestURI());
            log.info("🤝 [WebSocket Handshake] Query string: {}", httpRequest.getQueryString());

            // Extract query parameters
            String token = httpRequest.getParameter("token");
            String auth = httpRequest.getParameter("auth");

            log.info("🤝 [WebSocket Handshake] Token parameter: {}", token != null ? "***TOKEN***" : "null");
            log.info("🤝 [WebSocket Handshake] Auth parameter: {}", auth != null ? "***AUTH***" : "null");

            // Store in session attributes if present
            if (token != null && !token.isEmpty()) {
                attributes.put("token", token);
                log.info("✅ [WebSocket Handshake] Token stored in session attributes");
            }

            if (auth != null && !auth.isEmpty()) {
                attributes.put("auth", auth);
                log.info("✅ [WebSocket Handshake] Auth stored in session attributes");
            }

            // Also store remote address for logging
            String remoteAddr = httpRequest.getRemoteAddr();
            attributes.put("remoteAddr", remoteAddr);
            log.info("🤝 [WebSocket Handshake] Remote address: {}", remoteAddr);
        }

        log.info("✅ [WebSocket Handshake] Handshake accepted, proceeding with WebSocket upgrade");
        return true; // Proceed with handshake
    }

    /**
     * Called after the WebSocket handshake
     *
     * @param request HTTP request
     * @param response HTTP response
     * @param wsHandler WebSocket handler
     * @param exception Exception if handshake failed, null if successful
     */
    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {

        if (exception != null) {
            log.error("❌ [WebSocket Handshake] Handshake failed: {}", exception.getMessage());
        } else {
            log.info("✅ [WebSocket Handshake] Handshake completed successfully");
        }
    }
}
