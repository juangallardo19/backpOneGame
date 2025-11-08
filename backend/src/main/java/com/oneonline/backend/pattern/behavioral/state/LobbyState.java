package com.oneonline.backend.pattern.behavioral.state;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.GameStatus;

/**
 * STATE PATTERN - Lobby State Implementation
 *
 * Purpose:
 * Represents the lobby/waiting state before game starts.
 * In this state, players can join/leave, but cannot play cards.
 *
 * Allowed Actions:
 * - Join game
 * - Leave game
 * - Start game (when requirements met)
 *
 * Forbidden Actions:
 * - Play cards
 * - Draw cards
 * - Call ONE
 *
 * State Transitions:
 * - LobbyState -> PlayingState (when game starts)
 * - LobbyState -> (deleted) (when all players leave)
 */
public class LobbyState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.LOBBY);
        // Reset any previous game state
        if (session.getDeck() != null) {
            session.getDeck().reset();
        }
        // Clear discard pile
        if (session.getDiscardPile() != null) {
            session.getDiscardPile().clear();
        }
    }

    @Override
    public void exit(GameSession session) {
        // Cleanup before leaving lobby state
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        throw new IllegalStateException("Cannot play cards in lobby. Start the game first.");
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        throw new IllegalStateException("Cannot draw cards in lobby. Start the game first.");
    }

    @Override
    public void callOne(Player player, GameSession session) {
        throw new IllegalStateException("Cannot call ONE in lobby. Start the game first.");
    }

    @Override
    public void chooseColor(Player player, CardColor color, GameSession session) {
        throw new IllegalStateException("Cannot choose color in lobby. Start the game first.");
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        if (session.getPlayers().size() >= session.getMaxPlayers()) {
            throw new IllegalStateException("Room is full. Cannot join.");
        }
        session.getPlayers().add(player);
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        session.getPlayers().remove(player);
        // If all players leave, session should be cleaned up externally
    }

    @Override
    public void startGame(GameSession session) {
        // Validate minimum players
        if (session.getPlayers().size() < 2) {
            throw new IllegalStateException("Need at least 2 players to start game.");
        }

        // Transition to Playing state
        session.setState(new PlayingState());
    }

    @Override
    public void pauseGame(GameSession session) {
        throw new IllegalStateException("Cannot pause game in lobby. No game running.");
    }

    @Override
    public void resumeGame(GameSession session) {
        throw new IllegalStateException("Cannot resume game in lobby. No game running.");
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        throw new IllegalStateException("Cannot end game in lobby. No game running.");
    }

    @Override
    public String getStateName() {
        return "LOBBY";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return switch (action) {
            case "JOIN", "LEAVE", "START_GAME" -> true;
            case "PLAY_CARD", "DRAW_CARD", "CALL_ONE", "CHOOSE_COLOR", "PAUSE", "RESUME", "END" -> false;
            default -> false;
        };
    }

    @Override
    public String getStateDescription() {
        return "Waiting in lobby for players to join";
    }

    @Override
    public String toString() {
        return "LobbyState{}";
    }
}
