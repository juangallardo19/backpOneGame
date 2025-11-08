package com.oneonline.backend.pattern.behavioral.command;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * COMMAND PATTERN - Draw Card Command
 *
 * Purpose:
 * Encapsulates the action of drawing cards as a command object.
 * Allows validation, execution, and undo of draw actions.
 *
 * Command State:
 * - Player who draws
 * - Number of cards to draw
 * - Cards that were drawn (for undo)
 *
 * Undo Support:
 * - Removes drawn cards from player's hand
 * - Returns cards to deck
 * - Restores deck order
 */
public class DrawCardCommand implements GameCommand {

    private final Player player;
    private final GameSession session;
    private final int cardCount;
    private final long timestamp;

    // State for undo
    private List<Card> drawnCards;

    /**
     * Constructor for drawing specified number of cards.
     *
     * @param player Player drawing cards
     * @param session Game session
     * @param cardCount Number of cards to draw
     */
    public DrawCardCommand(Player player, GameSession session, int cardCount) {
        if (player == null || session == null) {
            throw new IllegalArgumentException("Player and session cannot be null");
        }
        if (cardCount < 1) {
            throw new IllegalArgumentException("Must draw at least 1 card");
        }
        this.player = player;
        this.session = session;
        this.cardCount = cardCount;
        this.timestamp = Instant.now().toEpochMilli();
        this.drawnCards = new ArrayList<>();
    }

    /**
     * Constructor for drawing single card.
     *
     * @param player Player drawing card
     * @param session Game session
     */
    public DrawCardCommand(Player player, GameSession session) {
        this(player, session, 1);
    }

    @Override
    public void execute() {
        validate();

        drawnCards.clear();

        // Draw specified number of cards
        for (int i = 0; i < cardCount; i++) {
            // Check if deck needs reshuffling
            if (session.getDeck().isEmpty()) {
                reshuffleDeck();
            }

            // Draw card
            Card card = session.getDeck().draw();
            player.addCard(card);
            drawnCards.add(card);
        }

        // Use state pattern to handle draw
        session.getState().drawCard(player, session);
    }

    @Override
    public void undo() {
        if (!isUndoable()) {
            throw new UnsupportedOperationException("Cannot undo this command");
        }

        // Remove drawn cards from player's hand
        for (Card card : drawnCards) {
            player.getHand().remove(card);
            // Return card to deck
            session.getDeck().addCard(card);
        }

        drawnCards.clear();
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
        // Can undo if we have record of drawn cards
        return drawnCards != null && !drawnCards.isEmpty();
    }

    @Override
    public GameSession getSession() {
        return session;
    }

    @Override
    public String getCommandName() {
        return "DRAW_CARD";
    }

    @Override
    public String getDescription() {
        return String.format("%s draws %d card(s)",
                player.getNickname(),
                cardCount);
    }

    @Override
    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public void validate() {
        // Check if it's player's turn (for normal draw)
        // Some draws (penalty) might not require turn check
        if (!player.equals(session.getCurrentPlayer())) {
            // Allow penalty draws even when not player's turn
            if (session.getPendingDrawCount() == 0) {
                throw new IllegalStateException("Not " + player.getNickname() + "'s turn");
            }
        }

        // Check if deck has enough cards (or can reshuffle)
        int availableCards = session.getDeck().size() + session.getDiscardPile().size() - 1;
        if (availableCards < cardCount) {
            throw new IllegalStateException("Not enough cards available to draw");
        }

        // Check game state allows drawing cards
        if (!session.getState().isActionAllowed("DRAW_CARD")) {
            throw new IllegalStateException("Cannot draw cards in current game state: "
                    + session.getState().getStateName());
        }
    }

    /**
     * Reshuffle discard pile into deck.
     * Keeps top card on discard pile.
     */
    private void reshuffleDeck() {
        if (session.getDiscardPile().size() <= 1) {
            throw new IllegalStateException("Cannot reshuffle - not enough cards");
        }

        // Keep top card
        Card topCard = session.getDiscardPile().pop();

        // Move all other cards to deck
        while (!session.getDiscardPile().isEmpty()) {
            Card card = session.getDiscardPile().pop();
            session.getDeck().addCard(card);
        }

        // Shuffle deck
        session.getDeck().shuffle();

        // Restore top card
        session.getDiscardPile().push(topCard);
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
     * Get number of cards to draw.
     *
     * @return Card count
     */
    public int getCardCount() {
        return cardCount;
    }

    /**
     * Get cards that were drawn (after execution).
     *
     * @return List of drawn cards
     */
    public List<Card> getDrawnCards() {
        return new ArrayList<>(drawnCards);
    }

    @Override
    public String toString() {
        return String.format("DrawCardCommand{player=%s, count=%d, time=%d}",
                player.getNickname(),
                cardCount,
                timestamp);
    }
}
