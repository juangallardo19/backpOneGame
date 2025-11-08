package com.oneonline.backend.pattern.behavioral.command;

import com.oneonline.backend.model.domain.GameSession;

/**
 * COMMAND PATTERN Interface
 *
 * Purpose:
 * Encapsulates game actions as objects, allowing parameterization of
 * clients with different requests, queuing of requests, logging of
 * requests, and support for undoable operations.
 *
 * Pattern Benefits:
 * - Decouples invoker from receiver
 * - Commands can be queued and executed later
 * - Supports undo/redo operations
 * - Easy to add new commands without changing existing code
 * - Command history and logging
 * - Macro commands (sequence of commands)
 *
 * Use Cases in ONE Game:
 * - Undo last move
 * - Replay game from history
 * - Save game state at each command
 * - Validate commands before execution
 * - Network command transmission
 * - Bot AI decision making
 * - Tournament replay system
 *
 * Example Usage:
 * <pre>
 * GameCommand playCard = new PlayCardCommand(player, card, session);
 * if (playCard.canExecute()) {
 *     playCard.execute();
 *     // Later, if needed:
 *     playCard.undo();
 * }
 * </pre>
 */
public interface GameCommand {

    /**
     * Execute the command.
     * Performs the game action encapsulated by this command.
     *
     * @throws IllegalStateException if command cannot be executed
     */
    void execute();

    /**
     * Undo the command.
     * Reverts the game action, restoring previous state.
     *
     * @throws UnsupportedOperationException if command is not undoable
     */
    void undo();

    /**
     * Check if command can be executed in current game state.
     *
     * @return true if command is valid and can execute
     */
    boolean canExecute();

    /**
     * Check if this command can be undone.
     *
     * @return true if undo is supported
     */
    boolean isUndoable();

    /**
     * Get the game session this command operates on.
     *
     * @return Game session
     */
    GameSession getSession();

    /**
     * Get command name/type.
     *
     * @return Command identifier (e.g., "PLAY_CARD", "DRAW_CARD")
     */
    String getCommandName();

    /**
     * Get command description for logging/history.
     *
     * @return Human-readable command description
     */
    String getDescription();

    /**
     * Get timestamp when command was created.
     *
     * @return Creation timestamp in milliseconds
     */
    long getTimestamp();

    /**
     * Validate command before execution.
     * More detailed validation than canExecute().
     *
     * @throws IllegalStateException if validation fails with reason
     */
    void validate();
}
