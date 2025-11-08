-- ========================================
-- V1: Create users table
-- ========================================
-- Stores user authentication and profile information
-- Supports LOCAL (email/password), GOOGLE, and GITHUB authentication

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    nickname VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(100),
    auth_provider VARCHAR(20) NOT NULL,
    profile_picture VARCHAR(500),
    oauth2_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',

    -- Constraints
    CONSTRAINT uk_user_email UNIQUE (email),
    CONSTRAINT uk_user_nickname UNIQUE (nickname),
    CONSTRAINT chk_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE', 'GITHUB')),
    CONSTRAINT chk_user_role CHECK (role IN ('USER', 'ADMIN'))
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_nickname ON users(nickname);
CREATE INDEX idx_users_oauth2_id ON users(oauth2_id);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Comments
COMMENT ON TABLE users IS 'Stores registered users with authentication details';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN users.nickname IS 'Display name shown in game (unique)';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password (null for OAuth2 users)';
COMMENT ON COLUMN users.auth_provider IS 'Authentication method: LOCAL, GOOGLE, or GITHUB';
COMMENT ON COLUMN users.oauth2_id IS 'OAuth2 provider user ID (Google sub or GitHub ID)';
COMMENT ON COLUMN users.profile_picture IS 'URL to profile picture';
COMMENT ON COLUMN users.is_active IS 'Account status (false if banned or deleted)';
COMMENT ON COLUMN users.role IS 'User role: USER or ADMIN';
