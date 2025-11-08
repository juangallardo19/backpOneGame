package com.oneonline.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Register Request DTO
 *
 * Data Transfer Object for user registration requests.
 * Contains all information needed to create a new user account.
 *
 * Validation Rules:
 * - Email must be valid format and unique
 * - Nickname 3-20 characters, alphanumeric with underscores
 * - Password minimum 8 characters
 * - All fields required
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    /**
     * User email address (must be unique).
     */
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    /**
     * User display nickname (must be unique).
     */
    @NotBlank(message = "Nickname is required")
    @Size(min = 3, max = 20, message = "Nickname must be between 3 and 20 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Nickname can only contain letters, numbers, and underscores")
    private String nickname;

    /**
     * User password (plain text, will be hashed).
     */
    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;
}
