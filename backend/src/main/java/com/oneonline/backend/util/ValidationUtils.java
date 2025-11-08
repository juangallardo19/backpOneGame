package com.oneonline.backend.util;

import java.util.regex.Pattern;

/**
 * Utility class for input validation.
 *
 * Provides static validation methods for:
 * - Email addresses
 * - Nicknames/usernames
 * - Passwords
 * - Room codes
 * - General string validation
 *
 * All methods return boolean (true = valid, false = invalid).
 */
public class ValidationUtils {

    /**
     * Email validation pattern (RFC 5322 simplified)
     */
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@" +
            "(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    /**
     * Nickname pattern: alphanumeric and underscores only
     */
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");

    /**
     * Room code pattern: 6 uppercase alphanumeric characters
     */
    private static final Pattern ROOM_CODE_PATTERN = Pattern.compile("^[A-Z0-9]{6}$");

    /**
     * Minimum nickname length
     */
    private static final int MIN_NICKNAME_LENGTH = 3;

    /**
     * Maximum nickname length
     */
    private static final int MAX_NICKNAME_LENGTH = 20;

    /**
     * Minimum password length
     */
    private static final int MIN_PASSWORD_LENGTH = 8;

    /**
     * Maximum password length (prevent DoS)
     */
    private static final int MAX_PASSWORD_LENGTH = 128;

    /**
     * Private constructor to prevent instantiation
     */
    private ValidationUtils() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Validate email address format.
     *
     * Rules:
     * - Must match RFC 5322 format (simplified)
     * - Must have @ symbol
     * - Must have valid domain
     * - Maximum length: 254 characters
     *
     * Examples of VALID emails:
     * - user@example.com
     * - john.doe@company.co.uk
     * - test123@test-domain.org
     *
     * Examples of INVALID emails:
     * - user@
     * - @example.com
     * - user space@example.com
     * - user@.com
     *
     * @param email Email address to validate
     * @return true if email is valid
     */
    public static boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }

        // Check length (RFC 5321)
        if (email.length() > 254) {
            return false;
        }

        return EMAIL_PATTERN.matcher(email).matches();
    }

    /**
     * Validate nickname/username.
     *
     * Rules:
     * - Length: 3-20 characters
     * - Alphanumeric and underscores only
     * - Cannot start with underscore
     * - No consecutive underscores
     * - No profanity (basic check)
     *
     * Examples of VALID nicknames:
     * - Player123
     * - john_doe
     * - Alice
     *
     * Examples of INVALID nicknames:
     * - ab (too short)
     * - _user (starts with underscore)
     * - user__name (consecutive underscores)
     * - user@123 (invalid characters)
     *
     * @param nickname Nickname to validate
     * @return true if nickname is valid
     */
    public static boolean isValidNickname(String nickname) {
        if (nickname == null || nickname.isEmpty()) {
            return false;
        }

        // Check length
        if (nickname.length() < MIN_NICKNAME_LENGTH || nickname.length() > MAX_NICKNAME_LENGTH) {
            return false;
        }

        // Check pattern
        if (!NICKNAME_PATTERN.matcher(nickname).matches()) {
            return false;
        }

        // Cannot start with underscore
        if (nickname.startsWith("_")) {
            return false;
        }

        // No consecutive underscores
        if (nickname.contains("__")) {
            return false;
        }

        // Basic profanity filter (extend as needed)
        String lowerNickname = nickname.toLowerCase();
        String[] blockedWords = {"admin", "moderator", "system", "bot", "null", "undefined"};
        for (String blocked : blockedWords) {
            if (lowerNickname.contains(blocked)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validate password strength.
     *
     * Rules:
     * - Minimum 8 characters
     * - Maximum 128 characters
     * - At least one letter (optional: can be enforced)
     * - At least one digit (optional: can be enforced)
     *
     * Note: For stricter validation, use PasswordUtil.isStrongPassword()
     *
     * @param password Password to validate
     * @return true if password meets minimum requirements
     */
    public static boolean isValidPassword(String password) {
        if (password == null || password.isEmpty()) {
            return false;
        }

        // Check length
        if (password.length() < MIN_PASSWORD_LENGTH || password.length() > MAX_PASSWORD_LENGTH) {
            return false;
        }

        // Basic requirement: must have at least one letter and one digit
        boolean hasLetter = password.matches(".*[a-zA-Z].*");
        boolean hasDigit = password.matches(".*\\d.*");

        return hasLetter && hasDigit;
    }

    /**
     * Validate room code format.
     *
     * Rules:
     * - Exactly 6 characters
     * - Uppercase letters and numbers only
     * - No special characters
     *
     * @param roomCode Room code to validate
     * @return true if room code is valid format
     */
    public static boolean isValidRoomCode(String roomCode) {
        if (roomCode == null || roomCode.isEmpty()) {
            return false;
        }

        return ROOM_CODE_PATTERN.matcher(roomCode).matches();
    }

    /**
     * Validate string is not null or empty.
     *
     * @param value String to check
     * @return true if string is not null and not empty
     */
    public static boolean isNotEmpty(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /**
     * Validate string is not blank (null, empty, or whitespace only).
     *
     * @param value String to check
     * @return true if string has content
     */
    public static boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    /**
     * Validate string length is within range.
     *
     * @param value String to check
     * @param minLength Minimum length (inclusive)
     * @param maxLength Maximum length (inclusive)
     * @return true if length is in range
     */
    public static boolean isLengthInRange(String value, int minLength, int maxLength) {
        if (value == null) {
            return false;
        }

        int length = value.length();
        return length >= minLength && length <= maxLength;
    }

    /**
     * Validate integer is within range.
     *
     * @param value Value to check
     * @param min Minimum value (inclusive)
     * @param max Maximum value (inclusive)
     * @return true if value is in range
     */
    public static boolean isInRange(int value, int min, int max) {
        return value >= min && value <= max;
    }

    /**
     * Validate phone number format (international).
     *
     * Simple validation for international phone numbers.
     * Accepts formats like: +1234567890, +1-234-567-8900
     *
     * @param phoneNumber Phone number to validate
     * @return true if phone number looks valid
     */
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return false;
        }

        // Remove common formatting characters
        String cleaned = phoneNumber.replaceAll("[\\s\\-\\(\\)\\.]", "");

        // Must start with + and have 7-15 digits
        return cleaned.matches("^\\+\\d{7,15}$");
    }

    /**
     * Validate URL format.
     *
     * Basic URL validation (http/https).
     *
     * @param url URL to validate
     * @return true if URL looks valid
     */
    public static boolean isValidUrl(String url) {
        if (url == null || url.isEmpty()) {
            return false;
        }

        try {
            new java.net.URL(url);
            return url.startsWith("http://") || url.startsWith("https://");
        } catch (java.net.MalformedURLException e) {
            return false;
        }
    }

    /**
     * Validate UUID format.
     *
     * @param uuid UUID string to validate
     * @return true if valid UUID format
     */
    public static boolean isValidUUID(String uuid) {
        if (uuid == null || uuid.isEmpty()) {
            return false;
        }

        try {
            java.util.UUID.fromString(uuid);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Sanitize string for safe storage/display.
     *
     * Removes potentially dangerous characters and trims whitespace.
     *
     * @param input Input string
     * @return Sanitized string
     */
    public static String sanitize(String input) {
        if (input == null) {
            return "";
        }

        // Remove HTML tags
        String sanitized = input.replaceAll("<[^>]*>", "");

        // Remove SQL injection attempts (basic)
        sanitized = sanitized.replaceAll("(?i)(--|;|'|\")", "");

        // Trim and normalize whitespace
        sanitized = sanitized.trim().replaceAll("\\s+", " ");

        return sanitized;
    }

    /**
     * Check if string contains only alphanumeric characters.
     *
     * @param value String to check
     * @return true if only letters and numbers
     */
    public static boolean isAlphanumeric(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }

        return value.matches("^[a-zA-Z0-9]+$");
    }

    /**
     * Check if string is a valid hexadecimal color code.
     *
     * Examples: #FF0000, #abc, #123456
     *
     * @param color Color code to validate
     * @return true if valid hex color
     */
    public static boolean isValidHexColor(String color) {
        if (color == null || color.isEmpty()) {
            return false;
        }

        return color.matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    }
}
