package com.oneonline.backend.exception;

/**
 * UserAlreadyExistsException - Thrown when trying to register with existing email/nickname
 *
 * HTTP Status: 409 CONFLICT
 *
 * Used when:
 * - Email already exists during registration
 * - Nickname already exists during registration
 * - User tries to create duplicate account
 *
 * @author Juan Gallardo
 */
public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String message) {
        super(message);
    }

    public UserAlreadyExistsException(String field, String value) {
        super(String.format("%s already exists: %s", field, value));
    }
}
