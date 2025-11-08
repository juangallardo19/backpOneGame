package com.oneonline.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * Allows frontend applications from different origins to access the API.
 *
 * ALLOWED ORIGINS:
 * - http://localhost:3000 (React default)
 * - http://localhost:5173 (Vite default)
 * - https://oneonline-frontend.vercel.app (Production)
 *
 * ALLOWED METHODS:
 * - GET, POST, PUT, DELETE, OPTIONS
 *
 * ALLOWED HEADERS:
 * - Authorization (for JWT tokens)
 * - Content-Type (for JSON payloads)
 * - X-Requested-With
 *
 * CREDENTIALS:
 * - Allow credentials: true (for cookies and authorization headers)
 *
 * MAX AGE:
 * - 3600 seconds (1 hour) - Browser caches preflight OPTIONS requests
 *
 * Design Pattern: None (Configuration class)
 *
 * @author Juan Gallardo
 */
@Configuration
public class CorsConfig {

    /**
     * Configure CORS policy for all endpoints
     *
     * This configuration allows frontend applications to make cross-origin
     * requests to the backend API with proper authentication headers.
     *
     * @return CorsConfigurationSource with configured CORS rules
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Allowed origins (frontend URLs)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:3000",              // React development
            "http://localhost:5173",              // Vite development
            "http://localhost:4200",              // Angular development
            "https://*.vercel.app",               // Vercel deployments
            "https://oneonline-frontend.vercel.app" // Production frontend
        ));

        // Allowed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ));

        // Allowed headers
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",      // JWT tokens
            "Content-Type",       // JSON payloads
            "Accept",
            "X-Requested-With",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));

        // Expose headers to frontend
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "X-Total-Count",
            "X-Page-Number",
            "X-Page-Size"
        ));

        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);

        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        // Apply CORS configuration to all endpoints
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
