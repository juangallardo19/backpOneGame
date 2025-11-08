package com.oneonline.backend.service.game;

import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.model.enums.CardType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * CardValidator Service
 *
 * Validates card plays according to ONE game rules.
 *
 * VALIDATION RULES:
 * 1. Number cards: Must match color OR number
 * 2. Action cards (Skip, Reverse, Draw Two): Must match color OR type
 * 3. Wild cards: Can be played anytime
 * 4. Wild Draw Four: Can only be played if no other valid cards
 *
 * RESPONSIBILITIES:
 * - Validate if a card can be played on top of another
 * - Find all valid cards in a hand
 * - Validate Wild Draw Four legality
 *
 * @author Juan Gallardo
 */
@Slf4j
@Service
public class CardValidator {

    /**
     * Check if a card can be played on top of another card
     *
     * @param cardToPlay Card player wants to play
     * @param topCard Current card on discard pile
     * @return true if valid move, false otherwise
     */
    public boolean isValidMove(Card cardToPlay, Card topCard) {
        // Use the Card's built-in validation method
        boolean canPlay = cardToPlay.canPlayOn(topCard);

        if (canPlay) {
            log.debug("Valid move: {} on {}", cardToPlay, topCard);
        } else {
            log.debug("Invalid move: {} cannot be played on {}", cardToPlay, topCard);
        }

        return canPlay;
    }

    /**
     * Check if number card can be played
     *
     * Rules:
     * - Must match color OR
     * - Must match number
     *
     * @param numberCard Number card to play
     * @param topCard Top card on pile
     * @return true if valid
     */
    public boolean canPlayNumberCard(NumberCard numberCard, Card topCard) {
        // Same color
        if (numberCard.getColor() == topCard.getColor()) {
            return true;
        }

        // Same number (if top card is also a number card)
        if (topCard instanceof NumberCard topNumberCard) {
            return numberCard.getValue() == topNumberCard.getValue();
        }

        return false;
    }

    /**
     * Check if action card (Skip, Reverse, Draw Two) can be played
     *
     * Rules:
     * - Must match color OR
     * - Must match type (Skip on Skip, Reverse on Reverse, etc.)
     *
     * @param actionCard Action card to play
     * @param topCard Top card on pile
     * @return true if valid
     */
    public boolean canPlayActionCard(Card actionCard, Card topCard) {
        // Same color
        if (actionCard.getColor() == topCard.getColor()) {
            return true;
        }

        // Same type (e.g., Skip on Skip, Reverse on Reverse)
        if (actionCard.getType() == topCard.getType()) {
            return true;
        }

        return false;
    }

    /**
     * Check if Wild card can be played
     *
     * Wild cards can ALWAYS be played (except when restricted by house rules)
     *
     * @param wildCard Wild card to play
     * @param topCard Top card on pile
     * @return true (always valid)
     */
    public boolean canPlayWildCard(WildCard wildCard, Card topCard) {
        // Wild cards can always be played
        return true;
    }

    /**
     * Check if Wild Draw Four can be played LEGALLY
     *
     * Official ONE rules:
     * - Wild Draw Four can only be played if player has NO other valid cards
     * - If challenged and illegal, player draws 4 instead
     *
     * @param wildDrawFour Wild Draw Four card
     * @param topCard Top card on pile
     * @param playerHand Player's full hand
     * @return true if legal play
     */
    public boolean canPlayWildDrawFourLegally(WildDrawFourCard wildDrawFour, Card topCard, List<Card> playerHand) {
        // Check if player has any other valid cards
        for (Card card : playerHand) {
            // Skip the Wild Draw Four itself
            if (card.equals(wildDrawFour)) {
                continue;
            }

            // If any other card is valid, Wild Draw Four is illegal
            if (isValidMove(card, topCard)) {
                log.warn("Wild Draw Four played illegally - player has valid card: {}", card);
                return false;
            }
        }

        // No other valid cards - legal play
        return true;
    }

    /**
     * Get all valid cards from a hand
     *
     * Returns list of cards that can be played on top card.
     *
     * @param hand Player's hand
     * @param topCard Top card on discard pile
     * @return List of valid cards
     */
    public List<Card> getValidCards(List<Card> hand, Card topCard) {
        List<Card> validCards = new ArrayList<>();

        for (Card card : hand) {
            if (isValidMove(card, topCard)) {
                validCards.add(card);
            }
        }

        log.debug("Found {} valid cards out of {}", validCards.size(), hand.size());
        return validCards;
    }

    /**
     * Check if player has any valid cards to play
     *
     * @param hand Player's hand
     * @param topCard Top card on discard pile
     * @return true if at least one valid card exists
     */
    public boolean hasValidCard(List<Card> hand, Card topCard) {
        return hand.stream().anyMatch(card -> isValidMove(card, topCard));
    }

    /**
     * Validate color choice for Wild card
     *
     * @param color Chosen color
     * @return true if valid (not WILD)
     */
    public boolean isValidColorChoice(CardColor color) {
        return color != CardColor.WILD && color != null;
    }

    /**
     * Check if card matches color
     *
     * @param card Card to check
     * @param color Color to match
     * @return true if matches
     */
    public boolean matchesColor(Card card, CardColor color) {
        return card.getColor() == color || card.getColor() == CardColor.WILD;
    }

    /**
     * Check if card matches number
     *
     * @param card Card to check
     * @param number Number to match
     * @return true if matches
     */
    public boolean matchesNumber(Card card, int number) {
        if (card instanceof NumberCard numberCard) {
            return numberCard.getValue() == number;
        }
        return false;
    }

    /**
     * Check if card matches type
     *
     * @param card Card to check
     * @param type Type to match
     * @return true if matches
     */
    public boolean matchesType(Card card, CardType type) {
        return card.getType() == type;
    }

    /**
     * Validate if player must draw card
     *
     * Player must draw if no valid cards in hand.
     *
     * @param hand Player's hand
     * @param topCard Top card
     * @return true if must draw
     */
    public boolean mustDrawCard(List<Card> hand, Card topCard) {
        return !hasValidCard(hand, topCard);
    }

    /**
     * Count number of valid plays in hand
     *
     * @param hand Player's hand
     * @param topCard Top card
     * @return Number of valid cards
     */
    public int countValidPlays(List<Card> hand, Card topCard) {
        return (int) hand.stream()
            .filter(card -> isValidMove(card, topCard))
            .count();
    }
}
