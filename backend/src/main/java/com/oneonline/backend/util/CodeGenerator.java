package com.oneonline.backend.util;

import java.security.SecureRandom;
import java.util.UUID;

/**
 * Utility class for generating various codes and identifiers.
 *
 * Provides static methods for:
 * - Room codes (6-character alphanumeric)
 * - Player IDs (UUID)
 * - Session IDs (UUID)
 * - Game codes
 *
 * All methods are thread-safe using SecureRandom.
 */
public class CodeGenerator {

    /**
     * Characters allowed in room codes (uppercase alphanumeric)
     */
    private static final String ROOM_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    /**
     * Length of room codes
     */
    private static final int ROOM_CODE_LENGTH = 6;

    /**
     * Secure random instance for thread-safe random generation
     */
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Private constructor to prevent instantiation
     */
    private CodeGenerator() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    /**
     * Generate a random 6-character room code.
     *
     * Format: UPPERCASE alphanumeric (A-Z, 0-9)
     * Example: "A4K9J2", "XYZ123"
     *
     * @return 6-character room code
     */
    public static String generateRoomCode() {
        StringBuilder code = new StringBuilder(ROOM_CODE_LENGTH);

        for (int i = 0; i < ROOM_CODE_LENGTH; i++) {
            int index = RANDOM.nextInt(ROOM_CODE_CHARS.length());
            code.append(ROOM_CODE_CHARS.charAt(index));
        }

        return code.toString();
    }

    /**
     * Generate a unique player ID.
     *
     * Uses UUID v4 (random)
     *
     * @return UUID string (e.g., "550e8400-e29b-41d4-a716-446655440000")
     */
    public static String generatePlayerId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Generate a unique session ID.
     *
     * Uses UUID v4 (random)
     *
     * @return UUID string
     */
    public static String generateSessionId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Generate a unique game ID.
     *
     * Uses UUID v4 (random)
     *
     * @return UUID string
     */
    public static String generateGameId() {
        return UUID.randomUUID().toString();
    }

    /**
     * Generate a random verification code (numeric).
     *
     * Used for email verification, password reset, etc.
     *
     * @param length Length of the code (typically 6)
     * @return Numeric code as string
     */
    public static String generateVerificationCode(int length) {
        StringBuilder code = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            code.append(RANDOM.nextInt(10)); // 0-9
        }

        return code.toString();
    }

    /**
     * Generate a random alphanumeric token.
     *
     * Used for API tokens, invite links, etc.
     *
     * @param length Length of the token
     * @return Random alphanumeric string
     */
    public static String generateToken(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder token = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(chars.length());
            token.append(chars.charAt(index));
        }

        return token.toString();
    }

    /**
     * Check if a room code is valid format.
     *
     * Valid format: 6 uppercase alphanumeric characters
     *
     * @param code Room code to validate
     * @return true if valid format
     */
    public static boolean isValidRoomCode(String code) {
        if (code == null || code.length() != ROOM_CODE_LENGTH) {
            return false;
        }

        return code.matches("[A-Z0-9]{" + ROOM_CODE_LENGTH + "}");
    }

    /**
     * Check if a UUID string is valid.
     *
     * @param uuid UUID string to validate
     * @return true if valid UUID format
     */
    public static boolean isValidUUID(String uuid) {
        if (uuid == null) {
            return false;
        }

        try {
            UUID.fromString(uuid);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
