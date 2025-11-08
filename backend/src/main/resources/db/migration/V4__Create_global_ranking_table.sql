-- ========================================
-- V4: Create global_ranking table
-- ========================================
-- Stores player rankings and leaderboard data

CREATE TABLE global_ranking (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    rank_position INTEGER NOT NULL DEFAULT 0,
    previous_rank INTEGER DEFAULT -1,
    total_wins INTEGER NOT NULL DEFAULT 0,
    win_rate DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    points INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    total_games INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key to users table
    CONSTRAINT fk_global_ranking_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_ranking_user UNIQUE (user_id),

    -- Constraints
    CONSTRAINT chk_rank_position_positive CHECK (rank_position >= 0),
    CONSTRAINT chk_total_wins_positive CHECK (total_wins >= 0),
    CONSTRAINT chk_win_rate_range CHECK (win_rate >= 0.0 AND win_rate <= 100.0),
    CONSTRAINT chk_points_positive CHECK (points >= 0),
    CONSTRAINT chk_current_streak_positive CHECK (current_streak >= 0),
    CONSTRAINT chk_best_streak_positive CHECK (best_streak >= 0),
    CONSTRAINT chk_total_games_positive CHECK (total_games >= 0)
);

-- Indexes for performance (critical for leaderboard queries)
CREATE INDEX idx_ranking_position ON global_ranking(rank_position ASC);
CREATE INDEX idx_ranking_points ON global_ranking(points DESC, win_rate DESC, total_wins DESC);
CREATE INDEX idx_ranking_user_id ON global_ranking(user_id);
CREATE INDEX idx_ranking_current_streak ON global_ranking(current_streak DESC);
CREATE INDEX idx_ranking_best_streak ON global_ranking(best_streak DESC);

-- Comments
COMMENT ON TABLE global_ranking IS 'Global player rankings and leaderboard';
COMMENT ON COLUMN global_ranking.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN global_ranking.rank_position IS 'Global rank position (1 = best)';
COMMENT ON COLUMN global_ranking.previous_rank IS 'Previous rank for showing trend (-1 = new entry)';
COMMENT ON COLUMN global_ranking.total_wins IS 'Total games won (synced from player_stats)';
COMMENT ON COLUMN global_ranking.win_rate IS 'Win percentage 0-100 (synced from player_stats)';
COMMENT ON COLUMN global_ranking.points IS 'Ranking points (1st=10, 2nd=5, 3rd=2, 4th=1 + streak bonus)';
COMMENT ON COLUMN global_ranking.current_streak IS 'Current winning streak (synced from player_stats)';
COMMENT ON COLUMN global_ranking.best_streak IS 'Best winning streak ever (synced from player_stats)';
COMMENT ON COLUMN global_ranking.total_games IS 'Total games played (synced from player_stats)';
COMMENT ON COLUMN global_ranking.last_updated IS 'Last ranking update timestamp';

-- ========================================
-- Trigger: Auto-update last_updated timestamp
-- ========================================
CREATE OR REPLACE FUNCTION update_ranking_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ranking_timestamp
    BEFORE UPDATE ON global_ranking
    FOR EACH ROW
    EXECUTE FUNCTION update_ranking_timestamp();

-- ========================================
-- Function: Recalculate all rank positions
-- ========================================
-- This function recalculates rank positions based on points
-- Call with: SELECT recalculate_rankings();

CREATE OR REPLACE FUNCTION recalculate_rankings()
RETURNS void AS $$
BEGIN
    WITH ranked_players AS (
        SELECT id,
               ROW_NUMBER() OVER (ORDER BY points DESC, win_rate DESC, total_wins DESC) AS new_rank
        FROM global_ranking
    )
    UPDATE global_ranking gr
    SET previous_rank = gr.rank_position,
        rank_position = rp.new_rank
    FROM ranked_players rp
    WHERE gr.id = rp.id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_rankings() IS 'Recalculates all rank positions based on points, win_rate, and total_wins';
