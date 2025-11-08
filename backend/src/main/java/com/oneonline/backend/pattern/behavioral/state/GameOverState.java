package com.oneonline.backend.pattern.behavioral.state;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.GameStatus;

/**
 * STATE PATTERN - Game Over State Implementation
 *
 * Purpose:
 * Represents the final state after game ends.
 * In this state, game is finished and results are displayed.
 *
 * Allowed Actions:
 * - Leave game
 * - View final scores
 *
 * Forbidden Actions:
 * - Play cards
 * - Draw cards
 * - Start game (need to create new session)
 *
 * State Transitions:
 * - GameOverState -> LobbyState (if rematch/play again)
 * - GameOverState -> (deleted) (if session ends)
 */
public class GameOverState implements GameState {

    /**
     * Winner of the game (null if game cancelled/no winner)
     */
    private final Player winner;

    /**
     * Constructor with winner.
     *
     * @param winner Winning player (can be null)
     */
    public GameOverState(Player winner) {
        this.winner = winner;
    }

    /**
     * Constructor without winner (game cancelled).
     */
    public GameOverState() {
        this(null);
    }

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.GAME_OVER);
        session.setWinner(winner);

        // Calculate final scores
        calculateFinalScores(session);

        // Clear current player
        session.setCurrentPlayer(null);
    }

    @Override
    public void exit(GameSession session) {
        // Cleanup when leaving game over state
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        throw new IllegalStateException("Game is over. Cannot play cards.");
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        throw new IllegalStateException("Game is over. Cannot draw cards.");
    }

    @Override
    public void callOne(Player player, GameSession session) {
        throw new IllegalStateException("Game is over. Cannot call ONE.");
    }

    @Override
    public void chooseColor(Player player, CardColor color, GameSession session) {
        throw new IllegalStateException("Game is over. Cannot choose color.");
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        throw new IllegalStateException("Game is over. Cannot join.");
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        // Allow players to leave after game over
        session.getPlayers().remove(player);
    }

    @Override
    public void startGame(GameSession session) {
        throw new IllegalStateException("Game is over. Create a new session to play again.");
    }

    @Override
    public void pauseGame(GameSession session) {
        throw new IllegalStateException("Game is over. Cannot pause.");
    }

    @Override
    public void resumeGame(GameSession session) {
        throw new IllegalStateException("Game is over. Cannot resume.");
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        // Already in game over state, do nothing
    }

    @Override
    public String getStateName() {
        return "GAME_OVER";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return switch (action) {
            case "LEAVE", "VIEW_SCORES" -> true;
            case "PLAY_CARD", "DRAW_CARD", "CALL_ONE", "CHOOSE_COLOR", "JOIN", "START_GAME", "PAUSE", "RESUME", "END" -> false;
            default -> false;
        };
    }

    @Override
    public String getStateDescription() {
        if (winner != null) {
            return "Game over - Winner: " + winner.getNickname();
        }
        return "Game over - No winner";
    }

    /**
     * Get the winner of the game.
     *
     * @return Winning player (null if no winner)
     */
    public Player getWinner() {
        return winner;
    }

    /**
     * Check if there is a winner.
     *
     * @return true if winner exists
     */
    public boolean hasWinner() {
        return winner != null;
    }

    /**
     * Calculate final scores for all players.
     * In ONE, winner gets 0 points, others get points based on cards in hand.
     *
     * @param session Game session
     */
    private void calculateFinalScores(GameSession session) {
        for (Player player : session.getPlayers()) {
            if (player.equals(winner)) {
                player.setScore(0);
            } else {
                int score = calculatePlayerScore(player);
                player.setScore(score);
            }
        }
    }

    /**
     * Calculate score for a player based on remaining cards.
     *
     * ONE Scoring Rules:
     * - Number cards (0-9): Face value
     * - Skip/Reverse/Draw Two: 20 points each
     * - Wild/Wild Draw Four: 50 points each
     *
     * @param player Player to calculate score for
     * @return Total score
     */
    private int calculatePlayerScore(Player player) {
        int totalScore = 0;
        for (Card card : player.getHand()) {
            totalScore += card.getValue();
        }
        return totalScore;
    }

    @Override
    public String toString() {
        return "GameOverState{winner=" + (winner != null ? winner.getNickname() : "none") + "}";
    }
}
