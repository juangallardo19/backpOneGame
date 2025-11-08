package com.oneonline.backend.exception;

/**
 * UnauthorizedException - Thrown when user is not authorized
 *
 * HTTP Status: 401 UNAUTHORIZED
 *
 * Used when:
 * - Invalid JWT token
 * - Expired token
 * - Missing authentication
 * - Invalid credentials
 *
 * @author Juan Gallardo
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    public UnauthorizedException() {
        super("Unauthorized access - Authentication required");
    }
}
