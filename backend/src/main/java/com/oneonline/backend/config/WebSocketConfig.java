package com.oneonline.backend.config;

import com.oneonline.backend.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket Configuration for Real-time Communication
 *
 * Implements STOMP (Simple Text Oriented Messaging Protocol) over WebSocket
 * for bidirectional real-time communication between server and clients.
 *
 * ENDPOINTS:
 * - /ws - WebSocket connection endpoint
 *
 * MESSAGE DESTINATIONS:
 * - /app/** - Messages from client to server
 * - /topic/** - Broadcast messages (1-to-many)
 * - /queue/** - Point-to-point messages (1-to-1)
 *
 * USAGE EXAMPLE:
 * Client subscribes to: /topic/game/{sessionId}
 * Client sends to: /app/game/{sessionId}/play-card
 * Server broadcasts to: /topic/game/{sessionId}
 *
 * FEATURES:
 * - SockJS fallback for browsers without WebSocket support
 * - CORS enabled for frontend integration
 * - STOMP protocol for structured messaging
 *
 * Design Pattern: Observer Pattern (via WebSocket subscriptions)
 *
 * @author Juan Gallardo
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    /**
     * Configure message broker for routing messages
     *
     * MESSAGE BROKER PREFIXES:
     * - /topic - For broadcasting to all subscribed clients
     *   Example: /topic/game/ABC123 -> All players in room ABC123
     *
     * - /queue - For sending to specific user
     *   Example: /queue/notifications -> Only to that user
     *
     * APPLICATION DESTINATION PREFIX:
     * - /app - Messages sent from client to server
     *   Example: Client sends to /app/game/play-card
     *            Server handles with @MessageMapping("/game/play-card")
     *
     * @param registry Message broker registry
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple broker for /topic and /queue destinations
        registry.enableSimpleBroker("/topic", "/queue");

        // Set prefix for messages from client to server
        registry.setApplicationDestinationPrefixes("/app");

        // Set prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Register STOMP endpoints for WebSocket connections
     *
     * ENDPOINT: /ws
     * - Main WebSocket connection point
     * - SockJS fallback enabled for compatibility
     * - CORS allowed from frontend origins
     *
     * CONNECTION FLOW:
     * 1. Client connects to: ws://localhost:8080/ws
     * 2. Upgrade to WebSocket protocol
     * 3. STOMP handshake
     * 4. Subscribe to topics: /topic/game/{sessionId}
     * 5. Send messages to: /app/game/{sessionId}/action
     *
     * @param registry STOMP endpoint registry
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:3000",              // Local development
                    "http://localhost:5173",              // Vite development
                    "https://*.vercel.app",               // Vercel deployments
                    "https://oneonline-frontend.vercel.app" // Production frontend
                )
                .withSockJS();  // Enable SockJS fallback for older browsers
    }

    /**
     * Configure client inbound channel interceptors
     *
     * CRITICAL: Register JWT authentication interceptor here
     *
     * This interceptor runs BEFORE any message is processed, allowing us to:
     * 1. Extract JWT token from connection headers/params
     * 2. Validate the token
     * 3. Set authenticated Principal in WebSocket session
     * 4. All subsequent messages will have authenticated user
     *
     * Without this, guest players cannot receive their cards because
     * Principal is null and they fail authentication checks.
     *
     * @param registration Channel registration
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
