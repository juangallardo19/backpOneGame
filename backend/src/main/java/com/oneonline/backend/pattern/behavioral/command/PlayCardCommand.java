package com.oneonline.backend.pattern.behavioral.command;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;

import java.time.Instant;

/**
 * COMMAND PATTERN - Play Card Command
 *
 * Purpose:
 * Encapsulates the action of playing a card as a command object.
 * Allows validation, execution, and undo of card play actions.
 *
 * Command State:
 * - Player who plays
 * - Card being played
 * - Previous game state (for undo)
 *
 * Undo Support:
 * - Restores card to player's hand
 * - Removes card from discard pile
 * - Reverts turn to previous player
 * - Restores previous game state
 */
public class PlayCardCommand implements GameCommand {

    private final Player player;
    private final Card card;
    private final GameSession session;
    private final long timestamp;

    // State for undo
    private Player previousPlayer;
    private boolean wasCalledOne;
    private Card topCardBeforePlay;

    public PlayCardCommand(Player player, Card card, GameSession session) {
        if (player == null || card == null || session == null) {
            throw new IllegalArgumentException("Player, card, and session cannot be null");
        }
        this.player = player;
        this.card = card;
        this.session = session;
        this.timestamp = Instant.now().toEpochMilli();
    }

    @Override
    public void execute() {
        validate();

        // Save state for undo
        previousPlayer = session.getCurrentPlayer();
        wasCalledOne = player.isCalledOne();
        topCardBeforePlay = session.getDiscardPile().isEmpty() ? null : session.getDiscardPile().peek();

        // Execute the play
        session.getState().playCard(player, card, session);

        // Reset ONE call flag after playing
        if (player.getHand().size() != 1) {
            player.setCalledOne(false);
        }
    }

    @Override
    public void undo() {
        if (!isUndoable()) {
            throw new UnsupportedOperationException("Cannot undo this command");
        }

        // Remove card from discard pile
        if (!session.getDiscardPile().isEmpty() && session.getDiscardPile().peek().equals(card)) {
            session.getDiscardPile().pop();
        }

        // Return card to player's hand
        player.addCard(card);

        // Restore ONE call state
        player.setCalledOne(wasCalledOne);

        // Restore previous player
        session.setCurrentPlayer(previousPlayer);

        // Restore top card
        if (topCardBeforePlay != null && !session.getDiscardPile().contains(topCardBeforePlay)) {
            session.getDiscardPile().push(topCardBeforePlay);
        }
    }

    @Override
    public boolean canExecute() {
        try {
            validate();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public boolean isUndoable() {
        // Can only undo if it's the most recent action
        // and game hasn't progressed significantly
        return previousPlayer != null;
    }

    @Override
    public GameSession getSession() {
        return session;
    }

    @Override
    public String getCommandName() {
        return "PLAY_CARD";
    }

    @Override
    public String getDescription() {
        return String.format("%s plays %s %s",
                player.getNickname(),
                card.getColor().name(),
                card.getType().name());
    }

    @Override
    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public void validate() {
        // Check if it's player's turn
        if (!player.equals(session.getCurrentPlayer())) {
            throw new IllegalStateException("Not " + player.getNickname() + "'s turn");
        }

        // Check if player has the card
        if (!player.getHand().contains(card)) {
            throw new IllegalStateException("Player does not have this card");
        }

        // Check if card can be played on top card
        Card topCard = session.getDiscardPile().peek();
        if (topCard != null && !card.canPlayOn(topCard)) {
            throw new IllegalStateException(String.format(
                    "Cannot play %s %s on %s %s",
                    card.getColor(), card.getType(),
                    topCard.getColor(), topCard.getType()));
        }

        // Check game state allows playing cards
        if (!session.getState().isActionAllowed("PLAY_CARD")) {
            throw new IllegalStateException("Cannot play cards in current game state: "
                    + session.getState().getStateName());
        }
    }

    /**
     * Get the player executing this command.
     *
     * @return Player
     */
    public Player getPlayer() {
        return player;
    }

    /**
     * Get the card being played.
     *
     * @return Card
     */
    public Card getCard() {
        return card;
    }

    @Override
    public String toString() {
        return String.format("PlayCardCommand{player=%s, card=%s %s, time=%d}",
                player.getNickname(),
                card.getColor(),
                card.getType(),
                timestamp);
    }
}
