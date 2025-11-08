-- ========================================
-- V3: Create game_history table
-- ========================================
-- Stores completed game records with results and statistics

CREATE TABLE game_history (
    id BIGSERIAL PRIMARY KEY,
    room_code VARCHAR(6) NOT NULL,
    winner_id BIGINT NOT NULL,
    player_ids BIGINT[] NOT NULL,
    final_scores JSONB NOT NULL,
    duration_minutes INTEGER NOT NULL,
    player_count INTEGER NOT NULL,
    total_cards_played INTEGER,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users table (winner)
    CONSTRAINT fk_game_history_winner FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_room_code_length CHECK (LENGTH(room_code) = 6),
    CONSTRAINT chk_duration_positive CHECK (duration_minutes >= 0),
    CONSTRAINT chk_player_count_range CHECK (player_count >= 2 AND player_count <= 4),
    CONSTRAINT chk_total_cards_positive CHECK (total_cards_played >= 0 OR total_cards_played IS NULL),
    CONSTRAINT chk_ended_after_started CHECK (ended_at > started_at)
);

-- Indexes for performance
CREATE INDEX idx_game_history_room_code ON game_history(room_code);
CREATE INDEX idx_game_history_winner_id ON game_history(winner_id);
CREATE INDEX idx_game_history_started_at ON game_history(started_at DESC);
CREATE INDEX idx_game_history_ended_at ON game_history(ended_at DESC);
CREATE INDEX idx_game_history_player_count ON game_history(player_count);

-- Index for player_ids array queries (PostgreSQL GIN index)
CREATE INDEX idx_game_history_player_ids ON game_history USING GIN (player_ids);

-- Comments
COMMENT ON TABLE game_history IS 'Historical record of completed games';
COMMENT ON COLUMN game_history.room_code IS '6-character alphanumeric room code';
COMMENT ON COLUMN game_history.winner_id IS 'User ID of the winner';
COMMENT ON COLUMN game_history.player_ids IS 'Array of all player user IDs';
COMMENT ON COLUMN game_history.final_scores IS 'JSON object mapping player_id to final score';
COMMENT ON COLUMN game_history.duration_minutes IS 'Game duration in minutes';
COMMENT ON COLUMN game_history.player_count IS 'Number of players (2-4)';
COMMENT ON COLUMN game_history.total_cards_played IS 'Total number of cards played during game';
COMMENT ON COLUMN game_history.started_at IS 'Game start timestamp';
COMMENT ON COLUMN game_history.ended_at IS 'Game end timestamp';
