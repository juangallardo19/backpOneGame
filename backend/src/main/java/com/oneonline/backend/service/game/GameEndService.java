package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.BotPlayer;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.dto.GameEndResultDto;
import com.oneonline.backend.model.dto.PlayerResultDto;
import com.oneonline.backend.model.entity.GameHistory;
import com.oneonline.backend.model.entity.User;
import com.oneonline.backend.repository.GameHistoryRepository;
import com.oneonline.backend.repository.UserRepository;
import com.oneonline.backend.service.ranking.RankingService;
import com.oneonline.backend.service.ranking.StatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GameEndService - Handles game completion and results processing
 *
 * Responsibilities:
 * - Calculate player rankings based on remaining cards
 * - Save game history to database
 * - Update player statistics
 * - Update global rankings
 * - Create formatted results table
 *
 * Called when:
 * - A player reaches 0 cards (wins)
 * - Game is forcefully ended
 *
 * IMPORTANT:
 * - Only human players (with userId) get stats/ranking updates
 * - Bots are included in results table but not in database updates
 *
 * @version 1.0
 * @author Juan Gallardo
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GameEndService {

    private final GameHistoryRepository gameHistoryRepository;
    private final UserRepository userRepository;
    private final StatsService statsService;
    private final RankingService rankingService;

    /**
     * Process game end and generate complete results
     *
     * WORKFLOW:
     * 1. Calculate player positions based on remaining cards
     * 2. Determine points earned for each position
     * 3. Save game history to database
     * 4. Update player statistics (only human players)
     * 5. Update global rankings (only human players)
     * 6. Return formatted results DTO
     *
     * @param session Game session that ended
     * @param winner Winning player (0 cards)
     * @param startTime Game start timestamp
     * @return GameEndResultDto with all results and rankings
     */
    @Transactional
    public GameEndResultDto processGameEnd(GameSession session, Player winner, LocalDateTime startTime) {
        log.info("🏁 Processing game end for session: {} - Winner: {}",
                session.getSessionId(), winner.getNickname());

        LocalDateTime endTime = LocalDateTime.now();
        int durationMinutes = calculateDuration(startTime, endTime);

        // 1. Calculate player rankings based on remaining cards
        List<PlayerResultDto> playerRankings = calculatePlayerRankings(session, winner);

        // 2. Save game history
        GameHistory gameHistory = saveGameHistory(session, winner, playerRankings, startTime, endTime, durationMinutes);

        // 3. Update stats and rankings for human players only
        updatePlayerStatsAndRankings(playerRankings, durationMinutes, session.getPlayers().size());

        // 4. Create and return results DTO
        GameEndResultDto results = GameEndResultDto.builder()
                .roomCode(session.getRoom().getCode())
                .sessionId(session.getSessionId())
                .winnerNickname(winner.getNickname())
                .winnerId(winner.getUserId())
                .playerRankings(playerRankings)
                .durationMinutes(durationMinutes)
                .startedAt(startTime)
                .endedAt(endTime)
                .totalPlayers(session.getPlayers().size())
                .totalCardsPlayed(calculateTotalCardsPlayed(session))
                .build();

        log.info("✅ Game end processing complete. Winner: {} | Duration: {}min | Players: {}",
                winner.getNickname(), durationMinutes, playerRankings.size());

        return results;
    }

    /**
     * Calculate player rankings based on remaining cards
     *
     * Ranking logic:
     * 1. Winner (0 cards) = 1st place
     * 2. Others ranked by card count (fewer cards = better position)
     * 3. Ties broken by hand points (fewer points = better)
     *
     * @param session Game session
     * @param winner Winning player
     * @return List of PlayerResultDto sorted by position
     */
    private List<PlayerResultDto> calculatePlayerRankings(GameSession session, Player winner) {
        List<PlayerResultDto> rankings = new ArrayList<>();

        // Create a list of all players with their card counts
        List<Player> allPlayers = new ArrayList<>(session.getPlayers());

        // Sort players by:
        // 1. Card count (ascending - fewer cards = better)
        // 2. Hand points (ascending - fewer points = better if card count is same)
        allPlayers.sort((p1, p2) -> {
            int cardDiff = Integer.compare(p1.getHandSize(), p2.getHandSize());
            if (cardDiff != 0) {
                return cardDiff;
            }
            // If same card count, sort by hand points
            return Integer.compare(p1.calculateHandPoints(), p2.calculateHandPoints());
        });

        // Assign positions and calculate points
        for (int i = 0; i < allPlayers.size(); i++) {
            Player player = allPlayers.get(i);
            int position = i + 1; // 1-based position
            int pointsEarned = calculatePointsForPosition(position);

            PlayerResultDto result = PlayerResultDto.builder()
                    .position(position)
                    .userId(player.getUserId())
                    .nickname(player.getNickname())
                    .remainingCards(player.getHandSize())
                    .handPoints(player.calculateHandPoints())
                    .pointsEarned(pointsEarned)
                    .isWinner(player.getPlayerId().equals(winner.getPlayerId()))
                    .isBot(player instanceof BotPlayer)
                    .build();

            rankings.add(result);

            log.debug("📊 Position {}: {} - {} cards, {} points in hand, earned {} ranking points",
                    position, player.getNickname(), player.getHandSize(),
                    player.calculateHandPoints(), pointsEarned);
        }

        return rankings;
    }

    /**
     * Calculate points earned for placement
     *
     * Points system:
     * - 1st place: 50 points
     * - 2nd place: 10 points
     * - 3rd place: 0 points
     * - 4th place: 0 points
     *
     * @param position Player's position (1-based)
     * @return Points earned
     */
    private int calculatePointsForPosition(int position) {
        return switch (position) {
            case 1 -> 50;
            case 2 -> 10;
            case 3, 4 -> 0;
            default -> 0;
        };
    }

    /**
     * Save game history to database
     *
     * @param session Game session
     * @param winner Winning player
     * @param rankings Player rankings
     * @param startTime Game start time
     * @param endTime Game end time
     * @param durationMinutes Game duration
     * @return Saved GameHistory entity
     */
    private GameHistory saveGameHistory(GameSession session, Player winner,
                                        List<PlayerResultDto> rankings,
                                        LocalDateTime startTime, LocalDateTime endTime,
                                        int durationMinutes) {
        // Collect user IDs (exclude bots without user IDs)
        Long[] playerIds = session.getPlayers().stream()
                .map(Player::getUserId)
                .filter(Objects::nonNull)
                .toArray(Long[]::new);

        // Create final scores map (playerId -> hand points)
        Map<String, Integer> finalScores = rankings.stream()
                .filter(r -> r.getUserId() != null)
                .collect(Collectors.toMap(
                        r -> r.getUserId().toString(),
                        PlayerResultDto::getHandPoints
                ));

        // Find winner user entity (may be null if bot)
        User winnerUser = null;
        if (winner.getUserId() != null) {
            winnerUser = userRepository.findById(winner.getUserId()).orElse(null);
        }

        // If winner is a bot, use first human player as winner for history
        // (GameHistory requires a User, not null)
        if (winnerUser == null) {
            log.warn("Winner is a bot, finding first human player for game history");
            winnerUser = session.getPlayers().stream()
                    .filter(p -> p.getUserId() != null)
                    .findFirst()
                    .flatMap(p -> userRepository.findById(p.getUserId()))
                    .orElse(null);
        }

        // If still null, cannot save game history
        if (winnerUser == null) {
            log.error("Cannot save game history: no human players found");
            return null;
        }

        // Calculate total cards played (initial cards - remaining cards)
        int initialCardCount = session.getConfiguration().getInitialCardCount();
        int totalCardsDealt = initialCardCount * session.getPlayers().size();
        int remainingCards = session.getPlayers().stream()
                .mapToInt(Player::getHandSize)
                .sum();
        int totalCardsPlayed = totalCardsDealt - remainingCards;

        GameHistory history = new GameHistory();
        history.setRoomCode(session.getRoom().getCode());
        history.setWinner(winnerUser);
        history.setPlayerIds(playerIds);
        history.setFinalScores(finalScores);
        history.setDurationMinutes(durationMinutes);
        history.setPlayerCount(session.getPlayers().size());
        history.setTotalCardsPlayed(totalCardsPlayed);
        history.setStartedAt(startTime);
        history.setEndedAt(endTime);

        GameHistory saved = gameHistoryRepository.save(history);
        log.info("💾 Game history saved: ID={}, Room={}, Winner={}",
                saved.getId(), saved.getRoomCode(), saved.getWinner().getNickname());

        return saved;
    }

    /**
     * Update player statistics and global rankings
     *
     * Only updates human players (with userId).
     * Bots are excluded from stats/rankings.
     *
     * @param rankings Player rankings
     * @param durationMinutes Game duration
     * @param totalPlayers Total players in game
     */
    private void updatePlayerStatsAndRankings(List<PlayerResultDto> rankings,
                                               int durationMinutes, int totalPlayers) {
        for (PlayerResultDto result : rankings) {
            // Skip bots (no userId)
            if (result.getUserId() == null) {
                log.debug("⏭️  Skipping bot player: {}", result.getNickname());
                continue;
            }

            try {
                boolean won = result.getPosition() == 1;

                // Update player statistics
                statsService.updatePlayerStats(
                        result.getUserId(),
                        won,
                        durationMinutes,
                        result.getPosition()
                );

                // Update global ranking
                rankingService.updateGlobalRanking(
                        result.getUserId(),
                        result.getPosition(),
                        totalPlayers
                );

                log.info("📈 Updated stats for {}: Position={}, Points=+{}",
                        result.getNickname(), result.getPosition(), result.getPointsEarned());

            } catch (Exception e) {
                log.error("❌ Failed to update stats for user {}: {}",
                        result.getUserId(), e.getMessage(), e);
            }
        }

        // Recalculate all rank positions
        try {
            rankingService.recalculateAllRanks();
            log.info("🔄 Global rankings recalculated");
        } catch (Exception e) {
            log.error("❌ Failed to recalculate rankings: {}", e.getMessage(), e);
        }
    }

    /**
     * Calculate game duration in minutes
     *
     * @param startTime Start timestamp
     * @param endTime End timestamp
     * @return Duration in minutes
     */
    private int calculateDuration(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return 0;
        }
        long minutes = Duration.between(startTime, endTime).toMinutes();
        return Math.max(1, (int) minutes); // Minimum 1 minute
    }

    /**
     * Calculate total cards played during game
     *
     * @param session Game session
     * @return Total cards played
     */
    private int calculateTotalCardsPlayed(GameSession session) {
        // Cards played = cards in discard pile
        return session.getDiscardPile() != null ? session.getDiscardPile().size() : 0;
    }
}
