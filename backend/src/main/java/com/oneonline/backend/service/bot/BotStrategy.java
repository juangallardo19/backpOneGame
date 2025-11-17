package com.oneonline.backend.service.bot;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

/**
 * STRATEGY PATTERN Implementation - Bot AI Strategy
 *
 * Purpose:
 * Defines the algorithm for bot decision-making in the ONE card game.
 * Encapsulates the AI logic to choose the best card to play.
 *
 * Pattern Benefits:
 * - Separates AI logic from bot implementation
 * - Easy to test and modify AI behavior
 * - Can be swapped at runtime if needed
 * - Follows Open/Closed Principle
 *
 * Bot Strategy Algorithm:
 * 1. Prefer special/action cards (Skip, Reverse, Draw Two)
 * 2. Prefer Wild cards when strategic
 * 3. Play cards that match current color
 * 4. Play cards that match current number
 * 5. Consider opponent hand sizes
 * 6. Try to get down to 1 card (win condition)
 *
 * Use Cases:
 * - Bot player chooses which card to play
 * - Bot selects color after playing Wild card
 * - Bot decides whether to call ONE
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
public class BotStrategy {

    private final Random random = new Random();

    /**
     * Choose the best card to play based on game state
     *
     * Algorithm Priority:
     * 1. If pending draw effects exist, ONLY choose +2 or +4 cards (stacking)
     * 2. If hand has 2 cards, prefer special cards to win faster
     * 3. Prefer Wild Draw Four when opponents have few cards
     * 4. Prefer action cards (Skip, Reverse, Draw Two)
     * 5. Prefer cards matching current color
     * 6. Play number cards
     * 7. Play Wild cards as last resort
     *
     * @param bot Bot player choosing card
     * @param topCard Current card on discard pile
     * @param session Current game session
     * @return Card to play, or null if no valid card
     */
    public Card chooseCard(Player bot, Card topCard, GameSession session) {
        List<Card> validCards = bot.getValidCards(topCard);

        if (validCards.isEmpty()) {
            log.debug("Bot {} has no valid cards", bot.getNickname());
            return null;
        }

        // CRITICAL FIX: If there are pending draw effects, bot can ONLY play +2 or +4 to stack
        // Otherwise bot must draw the pending cards (return null)
        int pendingDrawCount = session.getPendingDrawCount();
        if (pendingDrawCount > 0) {
            log.info("🎯 Bot {} must stack or draw {} pending cards", bot.getNickname(), pendingDrawCount);

            // Filter only stackable cards (+2 or +4)
            List<Card> stackableCards = validCards.stream()
                    .filter(card -> card.getType().name().equals("DRAW_TWO") ||
                                   card.getType().name().equals("WILD_DRAW_FOUR"))
                    .collect(java.util.stream.Collectors.toList());

            if (stackableCards.isEmpty()) {
                log.info("❌ Bot {} has no stackable cards, must draw {} pending cards",
                    bot.getNickname(), pendingDrawCount);
                return null; // Bot cannot stack, must draw
            }

            // Bot can stack! Choose the best stackable card
            log.info("✅ Bot {} can stack! Has {} stackable cards", bot.getNickname(), stackableCards.size());
            return stackableCards.get(random.nextInt(stackableCards.size()));
        }

        // Strategy 1: If bot has 2 cards, prioritize winning
        if (bot.getHandSize() == 2) {
            return chooseCardForWinning(validCards, topCard);
        }

        // Strategy 2: Consider opponent hand sizes
        Player nextPlayer = getNextPlayer(bot, session);
        if (nextPlayer != null && nextPlayer.getHandSize() <= 2) {
            // Next player close to winning - be aggressive
            return chooseAggressiveCard(validCards, topCard);
        }

        // Strategy 3: Normal play - balanced approach
        return chooseBalancedCard(validCards, topCard);
    }

    /**
     * Choose card when bot is close to winning (2 cards left)
     *
     * Priority:
     * 1. Action cards (guarantee win on next turn)
     * 2. Wild cards (flexible)
     * 3. Any valid card
     *
     * @param validCards List of valid cards
     * @param topCard Current top card
     * @return Best card for winning
     */
    private Card chooseCardForWinning(List<Card> validCards, Card topCard) {
        // Prefer action cards (Skip, Reverse, Draw Two)
        List<Card> actionCards = validCards.stream()
                .filter(Card::isActionCard)
                .collect(Collectors.toList());

        if (!actionCards.isEmpty()) {
            log.debug("Bot choosing action card for winning strategy");
            return actionCards.get(random.nextInt(actionCards.size()));
        }

        // Prefer Wild cards
        List<Card> wildCards = validCards.stream()
                .filter(Card::isWild)
                .collect(Collectors.toList());

        if (!wildCards.isEmpty()) {
            log.debug("Bot choosing wild card for winning strategy");
            return wildCards.get(random.nextInt(wildCards.size()));
        }

        // Play any valid card
        return validCards.get(random.nextInt(validCards.size()));
    }

    /**
     * Choose aggressive card when opponent is close to winning
     *
     * Priority:
     * 1. Draw Two (+2 cards to opponent)
     * 2. Wild Draw Four (+4 cards to opponent)
     * 3. Skip (deny opponent's turn)
     * 4. Other valid cards
     *
     * @param validCards List of valid cards
     * @param topCard Current top card
     * @return Best aggressive card
     */
    private Card chooseAggressiveCard(List<Card> validCards, Card topCard) {
        // Prefer Draw Two
        List<Card> drawTwoCards = validCards.stream()
                .filter(card -> card.getType().name().equals("DRAW_TWO"))
                .collect(Collectors.toList());

        if (!drawTwoCards.isEmpty()) {
            log.debug("Bot choosing Draw Two to slow opponent");
            return drawTwoCards.get(random.nextInt(drawTwoCards.size()));
        }

        // Prefer Wild Draw Four
        List<Card> wildDrawFourCards = validCards.stream()
                .filter(card -> card.getType().name().equals("WILD_DRAW_FOUR"))
                .collect(Collectors.toList());

        if (!wildDrawFourCards.isEmpty()) {
            log.debug("Bot choosing Wild Draw Four to slow opponent");
            return wildDrawFourCards.get(random.nextInt(wildDrawFourCards.size()));
        }

        // Prefer Skip
        List<Card> skipCards = validCards.stream()
                .filter(card -> card.getType().name().equals("SKIP"))
                .collect(Collectors.toList());

        if (!skipCards.isEmpty()) {
            log.debug("Bot choosing Skip to deny opponent turn");
            return skipCards.get(random.nextInt(skipCards.size()));
        }

        // Play any valid card
        return validCards.get(random.nextInt(validCards.size()));
    }

    /**
     * Choose balanced card for normal gameplay
     *
     * Priority:
     * 1. Action cards (strategic value)
     * 2. Cards matching current color
     * 3. Number cards
     * 4. Wild cards (last resort - save for later)
     *
     * @param validCards List of valid cards
     * @param topCard Current top card
     * @return Best balanced card
     */
    private Card chooseBalancedCard(List<Card> validCards, Card topCard) {
        // Prefer action cards
        List<Card> actionCards = validCards.stream()
                .filter(Card::isActionCard)
                .collect(Collectors.toList());

        if (!actionCards.isEmpty() && random.nextDouble() > 0.3) {
            log.debug("Bot choosing action card (balanced strategy)");
            return actionCards.get(random.nextInt(actionCards.size()));
        }

        // Prefer cards matching current color (not wild)
        List<Card> colorMatchCards = validCards.stream()
                .filter(card -> !card.isWild() && card.getColor() == topCard.getColor())
                .collect(Collectors.toList());

        if (!colorMatchCards.isEmpty()) {
            log.debug("Bot choosing color-matching card");
            return colorMatchCards.get(random.nextInt(colorMatchCards.size()));
        }

        // Prefer number cards over wild cards
        List<Card> numberCards = validCards.stream()
                .filter(card -> card.getType().name().equals("NUMBER"))
                .collect(Collectors.toList());

        if (!numberCards.isEmpty()) {
            log.debug("Bot choosing number card");
            return numberCards.get(random.nextInt(numberCards.size()));
        }

        // Play any valid card (probably a wild card)
        log.debug("Bot playing fallback card");
        return validCards.get(random.nextInt(validCards.size()));
    }

    /**
     * Choose color after playing Wild card
     *
     * Strategy:
     * 1. Count cards of each color in hand
     * 2. Choose color with most cards
     * 3. If tie, random selection
     *
     * @param bot Bot player choosing color
     * @return Chosen color
     */
    public CardColor chooseColor(Player bot) {
        List<Card> hand = bot.getHand();

        // Count cards of each color
        int redCount = 0, yellowCount = 0, greenCount = 0, blueCount = 0;

        for (Card card : hand) {
            if (card.isWild()) continue; // Skip wild cards

            switch (card.getColor()) {
                case RED -> redCount++;
                case YELLOW -> yellowCount++;
                case GREEN -> greenCount++;
                case BLUE -> blueCount++;
            }
        }

        // Find color with most cards
        int maxCount = Math.max(Math.max(redCount, yellowCount), Math.max(greenCount, blueCount));

        if (maxCount == 0) {
            // No colored cards, random choice
            CardColor[] colors = {CardColor.RED, CardColor.YELLOW, CardColor.GREEN, CardColor.BLUE};
            CardColor chosen = colors[random.nextInt(colors.length)];
            log.debug("Bot choosing random color: {}", chosen);
            return chosen;
        }

        // Choose color with most cards
        if (redCount == maxCount) {
            log.debug("Bot choosing RED (most cards in hand)");
            return CardColor.RED;
        } else if (yellowCount == maxCount) {
            log.debug("Bot choosing YELLOW (most cards in hand)");
            return CardColor.YELLOW;
        } else if (greenCount == maxCount) {
            log.debug("Bot choosing GREEN (most cards in hand)");
            return CardColor.GREEN;
        } else {
            log.debug("Bot choosing BLUE (most cards in hand)");
            return CardColor.BLUE;
        }
    }

    /**
     * Decide whether bot should call ONE
     *
     * Strategy:
     * - Bots have 90% success rate (sometimes "forget" to call ONE)
     * - This adds realism and gives human players a chance
     *
     * @param bot Bot player
     * @return true if bot calls ONE, false if bot "forgets"
     */
    public boolean shouldCallOne(Player bot) {
        if (bot.getHandSize() != 1) {
            return false;
        }

        // 90% chance bot remembers to call ONE
        boolean shouldCall = random.nextDouble() < 0.90;
        log.debug("Bot {} {} call ONE", bot.getNickname(), shouldCall ? "will" : "forgot to");
        return shouldCall;
    }

    /**
     * Get next player in turn order
     *
     * @param currentPlayer Current player
     * @param session Game session
     * @return Next player, or null if cannot determine
     */
    private Player getNextPlayer(Player currentPlayer, GameSession session) {
        try {
            // This would use the CircularDoublyLinkedList to get next player
            // Implementation depends on GameSession structure
            return session.peekNextPlayer();
        } catch (Exception e) {
            log.warn("Could not get next player: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Evaluate card value for strategic decisions
     *
     * Higher value = more strategic importance
     *
     * @param card Card to evaluate
     * @return Strategic value score
     */
    private int getCardValue(Card card) {
        if (card.isWild()) {
            return card.getType().name().equals("WILD_DRAW_FOUR") ? 50 : 40;
        }

        if (card.isActionCard()) {
            return switch (card.getType().name()) {
                case "DRAW_TWO" -> 30;
                case "SKIP" -> 25;
                case "REVERSE" -> 20;
                default -> 10;
            };
        }

        // Number cards
        return card.getValue();
    }
}
