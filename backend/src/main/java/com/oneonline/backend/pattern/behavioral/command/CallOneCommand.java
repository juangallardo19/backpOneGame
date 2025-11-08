package com.oneonline.backend.pattern.behavioral.command;

import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;

import java.time.Instant;

/**
 * COMMAND PATTERN - Call ONE Command
 *
 * Purpose:
 * Encapsulates the action of calling "ONE!" as a command object.
 * Players must call ONE when they have exactly one card remaining.
 *
 * Command State:
 * - Player calling ONE
 * - Previous call state (for undo)
 *
 * Undo Support:
 * - Reverts ONE call flag
 * - Useful for accidental calls or testing
 *
 * Game Rules:
 * - Must call ONE when playing second-to-last card (leaving 1 card)
 * - Failure to call ONE results in penalty (draw 2 cards)
 * - Cannot call ONE if you have more or less than 1 card
 */
public class CallOneCommand implements GameCommand {

    private final Player player;
    private final GameSession session;
    private final long timestamp;

    // State for undo
    private boolean previousCallState;

    /**
     * Constructor.
     *
     * @param player Player calling ONE
     * @param session Game session
     */
    public CallOneCommand(Player player, GameSession session) {
        if (player == null || session == null) {
            throw new IllegalArgumentException("Player and session cannot be null");
        }
        this.player = player;
        this.session = session;
        this.timestamp = Instant.now().toEpochMilli();
    }

    @Override
    public void execute() {
        validate();

        // Save state for undo
        previousCallState = player.isCalledOne();

        // Execute the call
        session.getState().callOne(player, session);

        // Notify observers
        // (Would be handled by game engine in real implementation)
    }

    @Override
    public void undo() {
        if (!isUndoable()) {
            throw new UnsupportedOperationException("Cannot undo this command");
        }

        // Restore previous call state
        player.setCalledOne(previousCallState);
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
        // Can undo within same turn
        return player.equals(session.getCurrentPlayer());
    }

    @Override
    public GameSession getSession() {
        return session;
    }

    @Override
    public String getCommandName() {
        return "CALL_ONE";
    }

    @Override
    public String getDescription() {
        return String.format("%s calls ONE!", player.getNickname());
    }

    @Override
    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public void validate() {
        // Check if player has exactly 1 card
        if (player.getHand().size() != 1) {
            throw new IllegalStateException(
                    player.getNickname() + " must have exactly 1 card to call ONE (has "
                            + player.getHand().size() + " cards)");
        }

        // Check if already called ONE
        if (player.isCalledOne()) {
            throw new IllegalStateException(
                    player.getNickname() + " has already called ONE");
        }

        // Check game state allows calling ONE
        if (!session.getState().isActionAllowed("CALL_ONE")) {
            throw new IllegalStateException("Cannot call ONE in current game state: "
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
     * Check if this is a valid ONE call.
     * Player must have exactly 1 card.
     *
     * @return true if valid
     */
    public boolean isValidCall() {
        return player.getHand().size() == 1 && !player.isCalledOne();
    }

    /**
     * Check if player should receive penalty for not calling ONE.
     *
     * @return true if penalty should be applied
     */
    public boolean shouldApplyPenalty() {
        return player.getHand().size() == 1 && !player.isCalledOne();
    }

    @Override
    public String toString() {
        return String.format("CallOneCommand{player=%s, cards=%d, time=%d}",
                player.getNickname(),
                player.getHand().size(),
                timestamp);
    }
}
