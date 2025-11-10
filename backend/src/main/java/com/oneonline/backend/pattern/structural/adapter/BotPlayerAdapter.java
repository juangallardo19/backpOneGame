package com.oneonline.backend.pattern.structural.adapter;

import com.oneonline.backend.model.domain.BotPlayer;
import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.GameSession;
import com.oneonline.backend.model.domain.Player;
import com.oneonline.backend.model.enums.CardColor;

import java.util.List;

/**
 * ADAPTER PATTERN Implementation
 *
 * Purpose:
 * Converts the interface of BotPlayer to match the expected Player interface,
 * allowing BotPlayer objects to work seamlessly with code that expects
 * standard Player behavior. Makes incompatible interfaces compatible.
 *
 * Pattern Benefits:
 * - Allows classes with incompatible interfaces to work together
 * - Promotes code reuse (existing code doesn't need changes)
 * - Enables polymorphism (treat bots and humans uniformly)
 * - Single Responsibility (adapter handles conversion)
 * - Open/Closed Principle (extend without modifying)
 *
 * Problem Solved:
 * BotPlayer has AI-specific methods (chooseCard, chooseColor, shouldCallONE)
 * that differ from human Player's interactive methods. The adapter translates
 * between these interfaces so game logic can treat all players uniformly.
 *
 * Use Cases in ONE Game:
 * - Game engine can iterate through all players (humans + bots) uniformly
 * - Turn manager doesn't need to check if player is bot or human
 * - Simplifies game logic (no if/else for player types)
 * - Easy to add new player types in future
 *
 * Example Usage:
 * <pre>
 * BotPlayer bot = new BotPlayer(...);
 * BotPlayerAdapter adapter = new BotPlayerAdapter(bot, gameSession);
 * Card chosen = adapter.makeMove(topCard);  // Uniform interface
 * </pre>
 */
public class BotPlayerAdapter {

    /**
     * The bot being adapted (Adaptee)
     */
    private final BotPlayer bot;

    /**
     * Game session context for bot decisions
     */
    private final GameSession gameSession;

    /**
     * Constructor - wraps a BotPlayer with adapter interface
     *
     * @param bot BotPlayer to adapt
     * @param gameSession Current game session
     */
    public BotPlayerAdapter(BotPlayer bot, GameSession gameSession) {
        if (bot == null) {
            throw new IllegalArgumentException("Bot cannot be null");
        }
        if (gameSession == null) {
            throw new IllegalArgumentException("Game session cannot be null");
        }

        this.bot = bot;
        this.gameSession = gameSession;
    }

    /**
     * Adapt bot's AI decision to standard "choose card to play" interface.
     *
     * Translates BotPlayer.chooseCard() to a standard interface
     * that game logic can use uniformly for all players.
     *
     * @param topCard Current top card on discard pile
     * @return Card chosen by bot, or null if no valid card
     */
    public Card makeMove(Card topCard) {
        return bot.chooseCard(topCard, gameSession);
    }

    /**
     * Adapt bot's color selection to standard interface.
     *
     * Called when bot plays a wild card and must choose a color.
     *
     * @return Color chosen by bot
     */
    public CardColor selectColor() {
        return bot.chooseColor();
    }

    /**
     * Adapt bot's ONE calling logic to standard interface.
     *
     * Bots have probabilistic ONE calling (90% success rate).
     * This method abstracts that into a simple boolean response.
     *
     * @return true if bot calls ONE, false if bot forgets
     */
    public boolean declareONE() {
        return bot.shouldCallOne();
    }

    /**
     * Check if bot has valid cards to play.
     *
     * Delegates to underlying Player methods (BotPlayer extends Player).
     *
     * @param topCard Current top card
     * @return true if bot has playable cards
     */
    public boolean hasValidMove(Card topCard) {
        return bot.hasValidCard(topCard);
    }

    /**
     * Get all valid cards bot could play.
     *
     * @param topCard Current top card
     * @return List of valid cards
     */
    public List<Card> getValidMoves(Card topCard) {
        return bot.getValidCards(topCard);
    }

    /**
     * Execute a complete turn for the bot automatically.
     *
     * High-level method that handles:
     * 1. Choosing card to play
     * 2. Playing the card
     * 3. Selecting color if wild
     * 4. Calling ONE if needed
     *
     * This demonstrates the Adapter pattern's power - complex bot
     * behavior is simplified into one method call.
     *
     * @param topCard Current top card
     * @return Card played, or null if bot drew instead
     */
    public Card executeTurn(Card topCard) {
        // Bot decides which card to play
        Card chosenCard = bot.chooseCard(topCard, gameSession);

        if (chosenCard != null) {
            // Bot plays the card
            bot.playCard(chosenCard);

            // If wild card, bot chooses color
            if (chosenCard.isWild()) {
                CardColor chosenColor = bot.chooseColor();
                // Color would be set on the wild card here
            }

            // Bot decides whether to call ONE
            if (bot.shouldCallOne()) {
                bot.callOne();
            }

            return chosenCard;
        }

        // No valid card - bot must draw
        return null;
    }

    /**
     * Get the adapted bot player.
     *
     * Allows access to underlying bot if needed (for bot-specific operations).
     *
     * @return The BotPlayer being adapted
     */
    public BotPlayer getBot() {
        return bot;
    }

    /**
     * Get the underlying Player reference.
     *
     * Since BotPlayer extends Player, we can return it as Player.
     * This is useful for polymorphic collections.
     *
     * @return Bot as Player reference
     */
    public Player asPlayer() {
        return bot;
    }

    /**
     * Check if this adapter wraps a temporary bot (reconnection bot).
     *
     * @return true if temporary bot
     */
    public boolean isTemporaryBot() {
        return bot.isTemporary();
    }

    /**
     * Get original player if this is a temporary reconnection bot.
     *
     * @return Original player, or null if not temporary
     */
    public Player getOriginalPlayer() {
        return bot.getOriginalPlayer();
    }

    /**
     * Get bot's nickname for display.
     *
     * @return Bot nickname
     */
    public String getNickname() {
        return bot.getNickname();
    }

    /**
     * Get bot's player ID.
     *
     * @return Player ID
     */
    public String getPlayerId() {
        return bot.getPlayerId();
    }

    /**
     * Check if bot is connected.
     *
     * Bots are always "connected" (always true).
     *
     * @return true (bots don't disconnect)
     */
    public boolean isConnected() {
        return bot.isConnected();
    }

    @Override
    public String toString() {
        return String.format("BotPlayerAdapter[bot=%s, temporary=%s]",
                bot.getNickname(), bot.isTemporary());
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof BotPlayerAdapter)) return false;
        BotPlayerAdapter other = (BotPlayerAdapter) obj;
        return bot.equals(other.bot);
    }

    @Override
    public int hashCode() {
        return bot.hashCode();
    }
}
