package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.dto.GameEndResultDto;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;
import com.oneonline.backend.model.enums.GameStatus;
import com.oneonline.backend.pattern.behavioral.command.GameCommand;
import com.oneonline.backend.pattern.behavioral.command.PlayCardCommand;
import com.oneonline.backend.service.bot.BotStrategy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.Stack;

/**
 * GameEngine Service
 *
 * Main orchestrator for game logic.
 * Coordinates all game services to execute moves and manage game flow.
 *
 * RESPONSIBILITIES:
 * - Process player moves (play card, draw card)
 * - Validate moves using CardValidator
 * - Apply card effects using EffectProcessor
 * - Check win conditions
 * - Handle penalties
 * - Manage game commands (for undo/redo)
 * - Execute bot turns automatically
 *
 * DESIGN PATTERNS:
 * - Command Pattern: Encapsulates moves for undo/redo
 * - Strategy Pattern: Different card validation strategies
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GameEngine {

    private final CardValidator cardValidator;
    private final EffectProcessor effectProcessor;
    private final OneManager oneManager;
    private final BotStrategy botStrategy;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameEndService gameEndService;

    /**
     * Command history for undo functionality
     */
    private final Stack<GameCommand> commandHistory = new Stack<>();

    /**
     * Process a player move (play card)
     *
     * Workflow:
     * 1. Validate it's player's turn
     * 2. Validate card can be played
     * 3. Execute move
     * 4. Apply card effect
     * 5. Check ONE call
     * 6. Check win condition
     * 7. Advance turn
     * 8. Process bot turns (if triggered by human)
     *
     * @param player Player making move
     * @param card Card to play
     * @param session Game session
     * @return true if move successful
     * @throws IllegalArgumentException if move invalid
     */
    public boolean processMove(Player player, Card card, GameSession session) {
        return processMove(player, card, session, true);
    }

    /**
     * Process a player move with option to trigger bot turns
     *
     * @param player Player making move
     * @param card Card to play
     * @param session Game session
     * @param triggerBots Whether to process bot turns after this move
     * @return true if move successful
     * @throws IllegalArgumentException if move invalid
     */
    private boolean processMove(Player player, Card card, GameSession session, boolean triggerBots) {
        TurnManager turnManager = session.getTurnManager();

        // Validate it's player's turn
        if (!turnManager.getCurrentPlayer().getPlayerId().equals(player.getPlayerId())) {
            throw new IllegalArgumentException("Not your turn!");
        }

        // Validate move
        if (!validateMove(player, card, session)) {
            throw new IllegalArgumentException("Invalid card play");
        }

        // Create and execute command (for undo functionality)
        GameCommand command = new PlayCardCommand(player, card, session);
        command.execute();
        commandHistory.push(command);

        // Apply card effect (returns true if effect already handled turn advancement)
        boolean effectHandledTurnAdvancement = applyCardEffect(card, session, turnManager);

        // Check ONE call
        oneManager.checkOneCall(player);

        // Check win condition
        Optional<Player> winner = checkWinCondition(session);
        if (winner.isPresent()) {
            // Process game end: save history, update stats, update rankings
            GameEndResultDto results = gameEndService.processGameEnd(
                    session,
                    winner.get(),
                    session.getGameStartTime()
            );

            // End the game session
            session.endGame(winner.get());

            // CRITICAL: Reset room completely so a new game can be started
            // This clears gameSession, updates status to WAITING, and resets player hands
            Room room = session.getRoom();
            if (room != null) {
                room.reset();
                log.info("🔄 Room {} reset complete - ready for new game", room.getRoomCode());
            }

            // Send results to all players via WebSocket using the correct event format
            messagingTemplate.convertAndSend(
                    "/topic/game/" + session.getSessionId(),
                    Map.of(
                            "eventType", "GAME_ENDED",
                            "timestamp", System.currentTimeMillis(),
                            "data", results
                    )
            );

            log.info("🏆 Game over! Winner: {} | Results sent to all players", winner.get().getNickname());
            return true;
        }

        // Advance turn only if effect didn't already handle it
        if (!effectHandledTurnAdvancement) {
            turnManager.nextTurn();
        }

        log.info("Move processed: {} played {}", player.getNickname(), card);

        // IMPORTANT: Process bot turns automatically (only if triggered by human to avoid recursion)
        if (triggerBots && !(player instanceof BotPlayer)) {
            processBotTurns(session);
        }

        return true;
    }

    /**
     * Player draws a card from deck
     *
     * Called when:
     * - Player has no valid cards
     * - Player chooses to draw
     * - Penalty (Draw Two, Draw Four, no UNO)
     *
     * @param player Player drawing
     * @param session Game session
     * @return Drawn card (or null if deck empty)
     */
    public Card drawCard(Player player, GameSession session) {
        Card card = session.getDeck().drawCard();

        if (card == null) {
            // Deck empty, refill from discard pile
            log.warn("Deck empty, refilling from discard pile");
            session.getDeck().refillFromDiscard(session.getDiscardPile());
            card = session.getDeck().drawCard();
        }

        if (card != null) {
            player.drawCard(card);
            log.info("Player {} drew a card", player.getNickname());
        } else {
            log.error("Failed to draw card - deck completely empty!");
        }

        return card;
    }

    /**
     * Validate if move is legal
     *
     * Checks:
     * - Player has the card
     * - Card can be played on top card
     * - Wild Draw Four legality (if applicable)
     *
     * @param player Player making move
     * @param card Card to play
     * @param session Game session
     * @return true if valid
     */
    public boolean validateMove(Player player, Card card, GameSession session) {
        // Check player has the card
        if (!player.hasCard(card)) {
            log.warn("Player {} doesn't have card {}", player.getNickname(), card);
            return false;
        }

        Card topCard = session.getTopCard();

        // Validate with CardValidator
        if (!cardValidator.isValidMove(card, topCard)) {
            return false;
        }

        // Special validation for Wild Draw Four
        if (card instanceof WildDrawFourCard wildDrawFour) {
            boolean legal = cardValidator.canPlayWildDrawFourLegally(
                wildDrawFour, topCard, player.getHand());

            if (!legal) {
                log.warn("Wild Draw Four played illegally by {}", player.getNickname());
                // In real game, another player can challenge
                // For now, we allow it but log warning
            }
        }

        return true;
    }

    /**
     * Apply card effect after it's played
     *
     * Different effects for different card types:
     * - NUMBER: No effect
     * - SKIP: Skip next player (handles turn advancement internally)
     * - REVERSE: Reverse turn order
     * - DRAW_TWO: Next player draws 2 and loses turn
     * - WILD: Player chooses color
     * - WILD_DRAW_FOUR: Next player draws 4 and loses turn, player chooses color
     *
     * @param card Card played
     * @param session Game session
     * @param turnManager Turn manager
     * @return true if effect already handled turn advancement, false otherwise
     */
    public boolean applyCardEffect(Card card, GameSession session, TurnManager turnManager) {
        CardType type = card.getType();

        switch (type) {
            case NUMBER -> {
                // No effect
                log.debug("Number card played - no effect");
                return false;
            }

            case SKIP -> {
                effectProcessor.processSkipEffect(turnManager);
                // Skip already advanced turn twice (skipped next player)
                return true;
            }

            case REVERSE -> {
                int playerCount = turnManager.getPlayerCount();
                effectProcessor.processReverseEffect(turnManager);
                // In 2-player game, Reverse acts as Skip (turn already advanced)
                // In 3+ player game, only direction changed (need to advance turn)
                return playerCount == 2;
            }

            case DRAW_TWO -> {
                Player nextPlayer = turnManager.peekNextPlayer();
                effectProcessor.processDrawTwoEffect(session, nextPlayer);
                boolean stackingEnabled = session.getConfiguration().isAllowStackingCards();
                // If stacking disabled, next player drew and lost turn (skip them completely)
                if (!stackingEnabled) {
                    // Next player draws and loses turn, so skip them
                    turnManager.skipNextPlayer();
                    return true; // Turn already advanced (skipped the player who drew)
                }
                return false; // Normal turn advancement (with stacking, next player can play)
            }

            case WILD_DRAW_FOUR -> {
                Player nextPlayer = turnManager.peekNextPlayer();
                effectProcessor.processDrawFourEffect(session, nextPlayer);
                boolean stackingEnabled = session.getConfiguration().isAllowStackingCards();
                // If stacking disabled, next player drew and lost turn (skip them completely)
                if (!stackingEnabled) {
                    // Next player draws and loses turn, so skip them
                    turnManager.skipNextPlayer();
                    return true; // Turn already advanced (skipped the player who drew)
                }
                return false; // Normal turn advancement (with stacking, next player can play)
            }

            case WILD -> {
                // Color already chosen when card was played
                log.debug("Wild card played - color chosen");
                return false;
            }
        }

        return false;
    }

    /**
     * Check win condition
     *
     * Player wins if they have 0 cards.
     *
     * @param session Game session
     * @return Optional<Player> winner if someone won
     */
    public Optional<Player> checkWinCondition(GameSession session) {
        for (Player player : session.getPlayers()) {
            if (player.hasWon()) {
                return Optional.of(player);
            }
        }
        return Optional.empty();
    }

    /**
     * Penalize player
     *
     * Used for:
     * - Not calling ONE
     * - Illegal Wild Draw Four
     * - Breaking rules
     *
     * @param player Player to penalize
     * @param reason Reason for penalty
     * @param cardCount Number of cards to draw
     * @param session Game session
     */
    public void penalizePlayer(Player player, String reason, int cardCount, GameSession session) {
        log.warn("Player {} penalized: {} (+{} cards)", player.getNickname(), reason, cardCount);

        for (int i = 0; i < cardCount; i++) {
            drawCard(player, session);
        }
    }

    /**
     * Force player to draw pending effect cards
     *
     * When player cannot stack Draw Two / Draw Four.
     *
     * @param player Player to draw
     * @param session Game session
     */
    public void processPlayerDrawPenalty(Player player, GameSession session) {
        effectProcessor.processPendingEffects(session, player);
    }

    /**
     * Undo last move
     *
     * Reverts last command (if undoable).
     *
     * @return true if undo successful
     */
    public boolean undoLastMove() {
        if (commandHistory.isEmpty()) {
            log.warn("No moves to undo");
            return false;
        }

        GameCommand lastCommand = commandHistory.peek();

        if (!lastCommand.isUndoable()) {
            log.warn("Last move cannot be undone");
            return false;
        }

        lastCommand.undo();
        commandHistory.pop();

        log.info("Move undone");
        return true;
    }

    /**
     * Clear command history
     *
     * Called at end of game.
     */
    public void clearHistory() {
        commandHistory.clear();
    }

    /**
     * Check if player can stack draw cards (+2 or +4)
     *
     * Player can stack if they have Draw Two or Wild Draw Four cards in hand.
     *
     * @param player Player to check
     * @param session Game session
     * @return true if player has +2 or +4 cards to stack
     */
    public boolean canStackDrawCards(Player player, GameSession session) {
        // Check if stacking is enabled in configuration
        if (!session.getConfiguration().isAllowStackingCards()) {
            return false;
        }

        // Check if player has any Draw Two or Wild Draw Four cards
        for (Card card : player.getHand()) {
            if (card.getType() == CardType.DRAW_TWO || card.getType() == CardType.WILD_DRAW_FOUR) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if player must draw card
     *
     * Player must draw if they have no valid cards.
     *
     * @param player Player to check
     * @param session Game session
     * @return true if must draw
     */
    public boolean mustDrawCard(Player player, GameSession session) {
        Card topCard = session.getTopCard();
        return cardValidator.mustDrawCard(player.getHand(), topCard);
    }

    /**
     * Get number of valid cards in player's hand
     *
     * @param player Player
     * @param session Game session
     * @return Number of valid cards
     */
    public int countValidPlays(Player player, GameSession session) {
        Card topCard = session.getTopCard();
        return cardValidator.countValidPlays(player.getHand(), topCard);
    }

    /**
     * Start game session
     *
     * Initializes game state:
     * - Deal cards
     * - Set first card
     * - Start turn manager
     *
     * @param session Game session to start
     */
    public void startGame(GameSession session) {
        // Validate game can start
        if (session.getPlayers().size() < 2) {
            throw new IllegalStateException("Need at least 2 players to start");
        }

        // Game already started
        if (session.getStatus() == GameStatus.PLAYING) {
            log.warn("Game already started");
            return;
        }

        session.start();
        log.info("Game started with {} players", session.getPlayers().size());

        // IMPORTANT: If first player is a bot, start processing bot turns
        Player firstPlayer = session.getTurnManager().getCurrentPlayer();
        if (firstPlayer instanceof BotPlayer) {
            log.info("🤖 First player is a bot, processing bot turns...");
            processBotTurns(session);
        }
    }

    /**
     * Process bot turns automatically
     *
     * After a human player plays, this method checks if the next player(s)
     * are bots and executes their turns automatically until a human's turn.
     *
     * This creates a seamless experience where bots play instantly without
     * waiting for user input.
     *
     * @param session Game session
     */
    public void processBotTurns(GameSession session) {
        TurnManager turnManager = session.getTurnManager();

        // Process bot turns until we reach a human player
        while (turnManager.getCurrentPlayer() instanceof BotPlayer && session.getStatus() == GameStatus.PLAYING) {
            BotPlayer bot = (BotPlayer) turnManager.getCurrentPlayer();
            log.info("🤖 Bot {} turn - processing automatically", bot.getNickname());

            try {
                // Let bot choose a card using strategy
                Card chosenCard = botStrategy.chooseCard(bot, session.getTopCard(), session);

                if (chosenCard != null) {
                    log.info("🃏 Bot {} chose to play: {} {}", bot.getNickname(), chosenCard.getColor(), chosenCard.getValue());

                    // If it's a wild card, let bot choose color
                    if (chosenCard instanceof WildCard wildCard) {
                        CardColor chosenColor = botStrategy.chooseColor(bot);
                        wildCard.setChosenColor(chosenColor);
                        log.info("🎨 Bot {} chose color: {}", bot.getNickname(), chosenColor);
                    }

                    // Process the bot's move (don't trigger more bots to avoid recursion)
                    processMove(bot, chosenCard, session, false);

                    // Check if bot should call ONE
                    if (bot.getHandSize() == 1 && botStrategy.shouldCallOne(bot)) {
                        oneManager.callOne(bot, session);
                        log.info("🔔 Bot {} called ONE!", bot.getNickname());
                    }

                } else {
                    // Bot has no valid cards
                    // IMPORTANT: Check if there are pending draw effects (+2, +4 stacking)
                    if (session.getPendingDrawCount() > 0) {
                        // Bot cannot stack, must draw all pending cards and lose turn
                        int pendingCards = session.getPendingDrawCount();
                        log.info("⚠️ Bot {} cannot stack, drawing {} pending cards and losing turn",
                            bot.getNickname(), pendingCards);

                        // Process pending effects (bot draws all cards and loses turn)
                        effectProcessor.processPendingEffects(session, bot);

                        // Turn ends, advance to next player
                        turnManager.nextTurn();
                        log.info("⏭️ Bot {} drew {} cards and lost turn", bot.getNickname(), pendingCards);
                    } else {
                        // Normal draw (no pending effects)
                        log.info("📥 Bot {} has no valid cards, drawing...", bot.getNickname());
                        Card drawnCard = drawCard(bot, session);

                        if (drawnCard != null) {
                            log.info("🎴 Bot {} drew a card", bot.getNickname());

                            // Check if drawn card can be played immediately
                            if (cardValidator.isValidMove(drawnCard, session.getTopCard())) {
                                log.info("✨ Bot {} can play the drawn card!", bot.getNickname());

                                // If it's a wild card, choose color
                                if (drawnCard instanceof WildCard wildCard) {
                                    CardColor chosenColor = botStrategy.chooseColor(bot);
                                    wildCard.setChosenColor(chosenColor);
                                    log.info("🎨 Bot {} chose color: {}", bot.getNickname(), chosenColor);
                                }

                                // Play the drawn card (don't trigger more bots)
                                processMove(bot, drawnCard, session, false);
                            } else {
                                // Can't play drawn card, turn ends
                                log.info("⏭️ Bot {} can't play drawn card, turn ends", bot.getNickname());
                                turnManager.nextTurn();

                                // Note: We don't call processBotTurns() recursively here
                                // because we'll continue in the while loop
                            }
                        }
                    }
                }

                // Brief delay for realism (bots shouldn't play instantly)
                try {
                    Thread.sleep(500); // 0.5 second delay
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }

            } catch (Exception e) {
                log.error("❌ Error processing bot turn for {}: {}", bot.getNickname(), e.getMessage(), e);
                // Advance turn to avoid infinite loop
                turnManager.nextTurn();
            }
        }

        log.info("✅ Bot turn processing complete. Current player: {}", turnManager.getCurrentPlayer().getNickname());

        // CRITICAL: After bot turns complete, check if current player is human with pending draws
        // If human cannot stack, force them to draw penalty cards automatically
        Player currentPlayer = turnManager.getCurrentPlayer();
        if (!(currentPlayer instanceof BotPlayer) && session.getPendingDrawCount() > 0) {
            if (!canStackDrawCards(currentPlayer, session)) {
                // Player cannot stack, force them to draw all pending cards
                int pendingCards = session.getPendingDrawCount();
                log.info("⚠️ Player {} cannot stack, forcing draw of {} pending cards",
                    currentPlayer.getNickname(), pendingCards);

                effectProcessor.processPendingEffects(session, currentPlayer);

                // Advance turn after penalty
                turnManager.nextTurn();
                log.info("⏭️ Player {} drew {} cards and lost turn. Next player: {}",
                    currentPlayer.getNickname(), pendingCards, turnManager.getCurrentPlayer().getNickname());

                // IMPORTANT: Process bot turns again if next player is a bot
                // This is safe because:
                // 1. processPendingEffects() resets pending count to 0
                // 2. The while loop in processBotTurns() will only execute if currentPlayer is BotPlayer
                // 3. No infinite recursion can occur
                processBotTurns(session);
            }
        }
    }
}
