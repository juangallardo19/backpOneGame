package com.oneonline.backend.exception;

/**
 * UserNotFoundException - Thrown when user is not found
 *
 * HTTP Status: 404 NOT FOUND
 *
 * Used when:
 * - User ID doesn't exist in database
 * - Email not found during login
 * - User lookup fails
 *
 * @author Juan Gallardo
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(Long userId) {
        super("User not found with ID: " + userId);
    }

    public UserNotFoundException(String field, String value) {
        super(String.format("User not found with %s: %s", field, value));
    }
}
