package com.oneonline.backend.exception;

/**
 * ForbiddenException - Thrown when user lacks permission
 *
 * HTTP Status: 403 FORBIDDEN
 *
 * Used when:
 * - User authenticated but lacks permission
 * - Only room leader can perform action
 * - Only admin can access resource
 * - Insufficient privileges
 *
 * @author Juan Gallardo
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }

    public ForbiddenException() {
        super("Forbidden - Insufficient permissions");
    }
}
