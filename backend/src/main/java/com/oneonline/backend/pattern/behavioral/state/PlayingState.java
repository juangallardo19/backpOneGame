package com.oneonline.backend.pattern.behavioral.state;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.GameStatus;

/**
 * STATE PATTERN - Playing State Implementation
 *
 * Purpose:
 * Represents active gameplay state.
 * In this state, players can play cards, draw cards, and perform game actions.
 *
 * Allowed Actions:
 * - Play cards
 * - Draw cards
 * - Call ONE
 * - Choose color (for wild cards)
 * - Pause game
 * - End game
 *
 * Forbidden Actions:
 * - Join game (game in progress)
 * - Start game (already started)
 *
 * State Transitions:
 * - PlayingState -> GameOverState (when player wins)
 * - PlayingState -> LobbyState (when game cancelled)
 */
public class PlayingState implements GameState {

    @Override
    public void enter(GameSession session) {
        session.setStatus(GameStatus.PLAYING);

        // Initialize game if needed
        if (session.getDeck() == null || session.getDeck().isEmpty()) {
            // Deck should be initialized before entering this state
            // But we can add safety check here
        }

        // Set first player if not set
        if (session.getCurrentPlayer() == null && !session.getPlayers().isEmpty()) {
            session.setCurrentPlayer(session.getPlayers().get(0));
        }
    }

    @Override
    public void exit(GameSession session) {
        // Cleanup when leaving playing state
    }

    @Override
    public void playCard(Player player, Card card, GameSession session) {
        // Validate it's player's turn
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        // Validate card can be played
        Card topCard = session.getDiscardPile().peek();
        if (!card.canPlayOn(topCard)) {
            throw new IllegalStateException("Cannot play this card on " + topCard);
        }

        // Remove card from player's hand
        if (!player.getHand().remove(card)) {
            throw new IllegalStateException("Card not in player's hand");
        }

        // Add to discard pile
        session.getDiscardPile().push(card);

        // Check for win condition
        if (player.getHand().isEmpty()) {
            endGame(session, player);
            return;
        }

        // Check for ONE penalty (if player has 1 card but didn't call ONE)
        if (player.getHand().size() == 1 && !player.isCalledOne()) {
            // Apply penalty (handled by game engine)
        }

        // IMPORTANT: DO NOT advance turn here!
        // Turn advancement is handled by GameEngine AFTER applying card effects
        // This allows special cards (Skip, Reverse, Draw Two, etc.) to work correctly
        // session.nextTurn(); // REMOVED - GameEngine handles turn advancement
    }

    @Override
    public void drawCard(Player player, GameSession session) {
        // Validate it's player's turn
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        // Draw card from deck
        if (session.getDeck().isEmpty()) {
            // Reshuffle discard pile into deck
            Card topCard = session.getDiscardPile().pop();
            while (!session.getDiscardPile().isEmpty()) {
                session.getDeck().addCard(session.getDiscardPile().pop());
            }
            session.getDeck().shuffle();
            session.getDiscardPile().push(topCard);
        }

        Card drawnCard = session.getDeck().draw();
        player.addCard(drawnCard);

        // Player can play drawn card if valid, or end turn
        // This logic would be handled by game engine
    }

    @Override
    public void callOne(Player player, GameSession session) {
        // Player must have exactly 1 card to call ONE
        if (player.getHand().size() != 1) {
            throw new IllegalStateException("Can only call ONE when you have 1 card");
        }

        player.setCalledOne(true);
    }

    @Override
    public void chooseColor(Player player, CardColor color, GameSession session) {
        // Validate it's player's turn
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not your turn!");
        }

        // Validate a wild card was just played
        Card topCard = session.getDiscardPile().peek();
        if (!topCard.isWild()) {
            throw new IllegalStateException("Can only choose color after playing wild card");
        }

        // Set chosen color
        session.setCurrentColor(color);
    }

    @Override
    public void playerJoin(Player player, GameSession session) {
        throw new IllegalStateException("Cannot join game in progress.");
    }

    @Override
    public void playerLeave(Player player, GameSession session) {
        // Remove player
        session.getPlayers().remove(player);
        session.getTurnOrder().remove(player);

        // If not enough players left, end game
        if (session.getPlayers().size() < 2) {
            endGame(session, null); // No winner, game cancelled
        }

        // If current player left, move to next
        if (player.equals(session.getCurrentPlayer())) {
            session.nextTurn();
        }
    }

    @Override
    public void startGame(GameSession session) {
        throw new IllegalStateException("Game already started.");
    }

    @Override
    public void pauseGame(GameSession session) {
        session.setStatus(GameStatus.PAUSED);
        // State remains PlayingState, just paused
    }

    @Override
    public void resumeGame(GameSession session) {
        session.setStatus(GameStatus.PLAYING);
        // Resume from paused state
    }

    @Override
    public void endGame(GameSession session, Player winner) {
        // Transition to GameOver state
        session.setState(new GameOverState(winner));
    }

    @Override
    public String getStateName() {
        return "PLAYING";
    }

    @Override
    public boolean isActionAllowed(String action) {
        return switch (action) {
            case "PLAY_CARD", "DRAW_CARD", "CALL_ONE", "CHOOSE_COLOR", "LEAVE", "PAUSE", "END" -> true;
            case "JOIN", "START_GAME", "RESUME" -> false;
            default -> false;
        };
    }

    @Override
    public String getStateDescription() {
        return "Game in progress";
    }

    @Override
    public String toString() {
        return "PlayingState{}";
    }
}
