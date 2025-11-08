package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardType;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedList;
import java.util.Queue;

/**
 * EffectProcessor Service
 *
 * Processes special card effects in the game:
 * - Draw Two (+2 cards)
 * - Draw Four (+4 cards)
 * - Skip (skip next player)
 * - Reverse (reverse turn order)
 *
 * FEATURES:
 * - Effect stacking (+2 on +2, +4 on +4)
 * - Effect queue for pending effects
 * - Integration with TurnManager
 *
 * RESPONSIBILITIES:
 * - Process card effects
 * - Manage effect queue
 * - Handle effect stacking
 * - Apply penalties
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EffectProcessor {

    /**
     * Queue of pending effects to be processed
     * Uses LinkedList for FIFO queue behavior
     */
    @Getter
    private final Queue<GameEffect> effectQueue = new LinkedList<>();

    /**
     * Process Draw Two card effect
     *
     * If stacking enabled:
     * - Add +2 to pending draw count
     * - Next player can stack another +2 or must draw all
     *
     * If stacking disabled:
     * - Next player immediately draws 2 cards and loses turn
     *
     * @param session Game session
     * @param targetPlayer Player who must draw (next player)
     */
    public void processDrawTwoEffect(GameSession session, Player targetPlayer) {
        boolean stackingEnabled = session.getConfiguration().isAllowStackingCards();

        if (stackingEnabled) {
            // Add to pending draw count
            session.addPendingDrawCount(2);
            log.info("Draw Two effect: Pending draw count = {}", session.getPendingDrawCount());
        } else {
            // Immediate draw, skip turn
            drawCardsAndSkipTurn(session, targetPlayer, 2);
        }
    }

    /**
     * Process Draw Four card effect
     *
     * Similar to Draw Two, but:
     * - Adds +4 cards
     * - Player chooses color
     *
     * @param session Game session
     * @param targetPlayer Player who must draw
     */
    public void processDrawFourEffect(GameSession session, Player targetPlayer) {
        boolean stackingEnabled = session.getConfiguration().isAllowStackingCards();

        if (stackingEnabled) {
            // Add to pending draw count
            session.addPendingDrawCount(4);
            log.info("Draw Four effect: Pending draw count = {}", session.getPendingDrawCount());
        } else {
            // Immediate draw, skip turn
            drawCardsAndSkipTurn(session, targetPlayer, 4);
        }
    }

    /**
     * Process Skip card effect
     *
     * Skips the next player's turn.
     *
     * @param turnManager Turn manager
     */
    public void processSkipEffect(TurnManager turnManager) {
        Player skippedPlayer = turnManager.peekNextPlayer();
        turnManager.skipNextPlayer();

        log.info("Skip effect: {} was skipped", skippedPlayer.getNickname());
    }

    /**
     * Process Reverse card effect
     *
     * Reverses turn order (clockwise -> counter-clockwise).
     *
     * Special case:
     * - In 2-player game, Reverse acts like Skip
     *
     * @param turnManager Turn manager
     */
    public void processReverseEffect(TurnManager turnManager) {
        int playerCount = turnManager.getPlayerCount();

        if (playerCount == 2) {
            // In 2-player game, Reverse = Skip
            processSkipEffect(turnManager);
            log.info("Reverse effect: Acts as Skip in 2-player game");
        } else {
            // Reverse turn order
            boolean newDirection = turnManager.reverseTurnOrder();
            log.info("Reverse effect: Turn order reversed. Direction: {}",
                newDirection ? "Clockwise" : "Counter-clockwise");
        }
    }

    /**
     * Stack a Draw effect (+2 or +4)
     *
     * Player plays another Draw card to add to pending count.
     *
     * @param session Game session
     * @param cardType Type of card (DRAW_TWO or WILD_DRAW_FOUR)
     */
    public void stackEffect(GameSession session, CardType cardType) {
        int additionalCards = switch (cardType) {
            case DRAW_TWO -> 2;
            case WILD_DRAW_FOUR -> 4;
            default -> throw new IllegalArgumentException("Cannot stack card type: " + cardType);
        };

        session.addPendingDrawCount(additionalCards);
        log.info("Effect stacked: +{} cards. Total pending: {}",
            additionalCards, session.getPendingDrawCount());
    }

    /**
     * Process all pending effects
     *
     * Called when player cannot stack and must draw.
     *
     * @param session Game session
     * @param player Player who must draw
     */
    public void processPendingEffects(GameSession session, Player player) {
        int pendingDraws = session.getPendingDrawCount();

        if (pendingDraws > 0) {
            // Player must draw all pending cards and lose turn
            drawCardsAndSkipTurn(session, player, pendingDraws);

            // Reset pending count
            session.resetPendingDrawCount();
            log.info("Pending effects processed: {} drew {} cards", player.getNickname(), pendingDraws);
        }
    }

    /**
     * Force player to draw cards and skip their turn
     *
     * Used when player cannot/will not stack draw effects.
     *
     * @param session Game session
     * @param player Player drawing cards
     * @param cardCount Number of cards to draw
     */
    private void drawCardsAndSkipTurn(GameSession session, Player player, int cardCount) {
        for (int i = 0; i < cardCount; i++) {
            Card drawnCard = session.getDeck().drawCard();
            if (drawnCard != null) {
                player.drawCard(drawnCard);
            } else {
                log.warn("Deck empty during draw effect. Refilling from discard pile.");
                session.getDeck().refillFromDiscard(session.getDiscardPile());
                drawnCard = session.getDeck().drawCard();
                if (drawnCard != null) {
                    player.drawCard(drawnCard);
                }
            }
        }

        log.info("Player {} drew {} cards due to effect and lost turn",
            player.getNickname(), cardCount);
    }

    /**
     * Check if pending draw effects exist
     *
     * @param session Game session
     * @return true if pending draws > 0
     */
    public boolean hasPendingDrawEffects(GameSession session) {
        return session.getPendingDrawCount() > 0;
    }

    /**
     * Add effect to queue
     *
     * @param effect Game effect to queue
     */
    public void queueEffect(GameEffect effect) {
        effectQueue.offer(effect);
        log.debug("Effect queued: {}", effect.type);
    }

    /**
     * Process next effect in queue
     *
     * @param session Game session
     * @param turnManager Turn manager
     */
    public void processNextEffect(GameSession session, TurnManager turnManager) {
        GameEffect effect = effectQueue.poll();

        if (effect == null) {
            return;
        }

        switch (effect.type) {
            case DRAW_TWO -> processDrawTwoEffect(session, effect.targetPlayer);
            case DRAW_FOUR -> processDrawFourEffect(session, effect.targetPlayer);
            case SKIP -> processSkipEffect(turnManager);
            case REVERSE -> processReverseEffect(turnManager);
        }
    }

    /**
     * Clear all pending effects
     *
     * @param session Game session
     */
    public void clearPendingEffects(GameSession session) {
        session.resetPendingDrawCount();
        effectQueue.clear();
        log.info("All pending effects cleared");
    }

    /**
     * Game Effect class
     *
     * Represents a pending card effect.
     */
    public static class GameEffect {
        public final EffectType type;
        public final Player targetPlayer;

        public GameEffect(EffectType type, Player targetPlayer) {
            this.type = type;
            this.targetPlayer = targetPlayer;
        }
    }

    /**
     * Effect types
     */
    public enum EffectType {
        DRAW_TWO,
        DRAW_FOUR,
        SKIP,
        REVERSE
    }
}
