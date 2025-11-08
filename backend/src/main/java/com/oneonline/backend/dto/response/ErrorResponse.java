package com.oneonline.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Error Response DTO
 *
 * Data Transfer Object for error responses.
 * Provides consistent error format across the API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorResponse {

    /**
     * HTTP status code.
     */
    private Integer status;

    /**
     * Error type/code (e.g., "VALIDATION_ERROR", "NOT_FOUND").
     */
    private String error;

    /**
     * Human-readable error message.
     */
    private String message;

    /**
     * Detailed error description (optional).
     */
    private String details;

    /**
     * Request path that caused the error.
     */
    private String path;

    /**
     * Timestamp when error occurred.
     */
    private Long timestamp;

    /**
     * Validation errors (for 400 Bad Request).
     */
    private Map<String, String> validationErrors;

    /**
     * Stack trace (only in development mode).
     */
    private List<String> stackTrace;

    /**
     * Error reference ID for support/debugging.
     */
    private String errorId;

    /**
     * Create simple error response.
     *
     * @param status HTTP status code
     * @param error Error type
     * @param message Error message
     * @return ErrorResponse
     */
    public static ErrorResponse of(Integer status, String error, String message) {
        return ErrorResponse.builder()
                .status(status)
                .error(error)
                .message(message)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Create validation error response.
     *
     * @param validationErrors Map of field -> error message
     * @return ErrorResponse
     */
    public static ErrorResponse validationError(Map<String, String> validationErrors) {
        return ErrorResponse.builder()
                .status(400)
                .error("VALIDATION_ERROR")
                .message("Request validation failed")
                .validationErrors(validationErrors)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Create not found error response.
     *
     * @param resource Resource that was not found
     * @return ErrorResponse
     */
    public static ErrorResponse notFound(String resource) {
        return ErrorResponse.builder()
                .status(404)
                .error("NOT_FOUND")
                .message(resource + " not found")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Create unauthorized error response.
     *
     * @return ErrorResponse
     */
    public static ErrorResponse unauthorized() {
        return ErrorResponse.builder()
                .status(401)
                .error("UNAUTHORIZED")
                .message("Authentication required")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * Create forbidden error response.
     *
     * @return ErrorResponse
     */
    public static ErrorResponse forbidden() {
        return ErrorResponse.builder()
                .status(403)
                .error("FORBIDDEN")
                .message("Access denied")
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
