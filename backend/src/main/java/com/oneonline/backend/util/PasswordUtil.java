package com.oneonline.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.SecureRandom;

/**
 * Utility class for password operations.
 *
 * Provides static methods for:
 * - Password hashing (BCrypt)
 * - Password verification
 * - Random password generation
 * - Password strength validation
 *
 * Uses BCrypt algorithm for secure password hashing.
 * BCrypt automatically handles salting and is resistant to rainbow table attacks.
 */
public class PasswordUtil {

    /**
     * BCrypt password encoder with strength 12
     * Higher strength = more secure but slower
     */
    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder(12);

    /**
     * Characters for random password generation
     */
    private static final String PASSWORD_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

    /**
     * Default length for generated passwords
     */
    private static final int DEFAULT_PASSWORD_LENGTH = 12;

    /**
     * Secure random for password generation
     */
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Private constructor to prevent instantiation
     */
    private PasswordUtil() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Hash a plain text password using BCrypt.
     *
     * BCrypt automatically:
     * - Generates a salt
     * - Applies multiple rounds of hashing
     * - Creates a secure hash
     *
     * The result contains:
     * - Algorithm identifier
     * - Cost factor
     * - Salt
     * - Hash
     *
     * Example output: "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"
     *
     * @param rawPassword Plain text password
     * @return BCrypt hashed password
     * @throws IllegalArgumentException if password is null or empty
     */
    public static String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty");
        }

        return ENCODER.encode(rawPassword);
    }

    /**
     * Verify a plain text password against a BCrypt hash.
     *
     * Constant-time comparison to prevent timing attacks.
     *
     * @param rawPassword Plain text password to verify
     * @param hashedPassword BCrypt hashed password
     * @return true if password matches
     * @throws IllegalArgumentException if either parameter is null
     */
    public static boolean verifyPassword(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) {
            throw new IllegalArgumentException("Password and hash cannot be null");
        }

        if (rawPassword.isEmpty() || hashedPassword.isEmpty()) {
            return false;
        }

        try {
            return ENCODER.matches(rawPassword, hashedPassword);
        } catch (IllegalArgumentException e) {
            // Invalid hash format
            return false;
        }
    }

    /**
     * Generate a random password.
     *
     * Generated password contains:
     * - Uppercase letters
     * - Lowercase letters
     * - Numbers
     * - Special characters
     *
     * Default length: 12 characters
     *
     * @return Random password
     */
    public static String generateRandomPassword() {
        return generateRandomPassword(DEFAULT_PASSWORD_LENGTH);
    }

    /**
     * Generate a random password with specified length.
     *
     * @param length Length of password (minimum 8)
     * @return Random password
     * @throws IllegalArgumentException if length < 8
     */
    public static String generateRandomPassword(int length) {
        if (length < 8) {
            throw new IllegalArgumentException("Password length must be at least 8 characters");
        }

        StringBuilder password = new StringBuilder(length);

        // Ensure at least one of each type
        password.append(getRandomChar("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));  // Uppercase
        password.append(getRandomChar("abcdefghijklmnopqrstuvwxyz"));  // Lowercase
        password.append(getRandomChar("0123456789"));                   // Number
        password.append(getRandomChar("!@#$%^&*"));                    // Special

        // Fill remaining with random characters
        for (int i = 4; i < length; i++) {
            password.append(getRandomChar(PASSWORD_CHARS));
        }

        // Shuffle the password
        return shuffleString(password.toString());
    }

    /**
     * Generate a simple numeric PIN.
     *
     * Used for temporary access codes.
     *
     * @param length Length of PIN (4-8 recommended)
     * @return Numeric PIN as string
     */
    public static String generatePIN(int length) {
        if (length < 4 || length > 8) {
            throw new IllegalArgumentException("PIN length must be between 4 and 8");
        }

        StringBuilder pin = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            pin.append(RANDOM.nextInt(10)); // 0-9
        }

        return pin.toString();
    }

    /**
     * Check if a password meets strength requirements.
     *
     * Requirements:
     * - Minimum 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one digit
     *
     * @param password Password to check
     * @return true if password is strong enough
     */
    public static boolean isStrongPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }

        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;

        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            if (Character.isLowerCase(c)) hasLower = true;
            if (Character.isDigit(c)) hasDigit = true;
        }

        return hasUpper && hasLower && hasDigit;
    }

    /**
     * Calculate password strength score (0-100).
     *
     * Factors:
     * - Length (longer = better)
     * - Character variety (upper, lower, digits, special)
     * - No common patterns
     *
     * @param password Password to evaluate
     * @return Strength score (0 = very weak, 100 = very strong)
     */
    public static int calculatePasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return 0;
        }

        int score = 0;

        // Length score (max 40 points)
        score += Math.min(password.length() * 4, 40);

        // Character variety (max 40 points)
        boolean hasUpper = password.matches(".*[A-Z].*");
        boolean hasLower = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecial = password.matches(".*[!@#$%^&*()].*");

        if (hasUpper) score += 10;
        if (hasLower) score += 10;
        if (hasDigit) score += 10;
        if (hasSpecial) score += 10;

        // No common patterns (max 20 points)
        if (!password.matches(".*(.)\\1{2,}.*")) { // No repeated chars
            score += 10;
        }
        if (!password.matches(".*(012|123|234|345|456|567|678|789|890).*")) { // No sequences
            score += 10;
        }

        return Math.min(score, 100);
    }

    /**
     * Helper method to get random character from a string.
     */
    private static char getRandomChar(String chars) {
        int index = RANDOM.nextInt(chars.length());
        return chars.charAt(index);
    }

    /**
     * Helper method to shuffle a string.
     */
    private static String shuffleString(String input) {
        char[] chars = input.toCharArray();

        // Fisher-Yates shuffle
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }

        return new String(chars);
    }
}
