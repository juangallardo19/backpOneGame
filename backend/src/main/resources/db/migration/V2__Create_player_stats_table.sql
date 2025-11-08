-- ========================================
-- V2: Create player_stats table
-- ========================================
-- Stores player game statistics and performance metrics

CREATE TABLE player_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    total_games INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_losses INTEGER NOT NULL DEFAULT 0,
    win_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    avg_game_duration DOUBLE PRECISION DEFAULT 0.0,
    total_points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users table
    CONSTRAINT fk_player_stats_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_total_games_positive CHECK (total_games >= 0),
    CONSTRAINT chk_total_wins_positive CHECK (total_wins >= 0),
    CONSTRAINT chk_total_losses_positive CHECK (total_losses >= 0),
    CONSTRAINT chk_win_rate_range CHECK (win_rate >= 0.0 AND win_rate <= 100.0),
    CONSTRAINT chk_current_streak_positive CHECK (current_streak >= 0),
    CONSTRAINT chk_best_streak_positive CHECK (best_streak >= 0),
    CONSTRAINT chk_total_points_positive CHECK (total_points >= 0)
);

-- Indexes for performance
CREATE INDEX idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX idx_player_stats_total_wins ON player_stats(total_wins DESC);
CREATE INDEX idx_player_stats_win_rate ON player_stats(win_rate DESC);
CREATE INDEX idx_player_stats_current_streak ON player_stats(current_streak DESC);

-- Comments
COMMENT ON TABLE player_stats IS 'Player game statistics and performance metrics';
COMMENT ON COLUMN player_stats.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN player_stats.total_games IS 'Total number of games played';
COMMENT ON COLUMN player_stats.total_wins IS 'Total number of games won';
COMMENT ON COLUMN player_stats.total_losses IS 'Total number of games lost';
COMMENT ON COLUMN player_stats.win_rate IS 'Win percentage (0-100)';
COMMENT ON COLUMN player_stats.current_streak IS 'Current consecutive wins';
COMMENT ON COLUMN player_stats.best_streak IS 'Best consecutive wins ever achieved';
COMMENT ON COLUMN player_stats.avg_game_duration IS 'Average game duration in minutes';
COMMENT ON COLUMN player_stats.total_points IS 'Total ranking points earned';
