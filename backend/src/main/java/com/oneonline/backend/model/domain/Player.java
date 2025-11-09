package com.oneonline.backend.model.domain;

import com.oneonline.backend.model.enums.PlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Represents a player in a ONE game session.
 *
 * This is an in-memory domain object (not a JPA entity).
 * Player data persists only during the game session.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    /**
     * Unique identifier for this player
     */
    @Builder.Default
    private String playerId = UUID.randomUUID().toString();

    /**
     * User ID from the authentication system (for identifying the actual user)
     */
    private Long userId;

    /**
     * User email from authentication (for identifying current user)
     */
    private String userEmail;

    /**
     * Player's nickname
     */
    private String nickname;

    /**
     * Cards currently in player's hand
     */
    private List<Card> hand = new ArrayList<>();

    /**
     * Player's current score in the game
     */
    private int score = 0;

    /**
     * Whether player is currently connected
     */
    private boolean connected = true;

    /**
     * Whether this player is the room leader
     */
    private boolean roomLeader = false;

    /**
     * Current status of the player
     */
    private PlayerStatus status = PlayerStatus.WAITING;

    /**
     * Whether player has called "ONE" when they have one card
     */
    private boolean calledOne = false;

    /**
     * Play a card from the player's hand
     *
     * @param card The card to play
     * @return true if card was in hand and removed successfully
     */
    public boolean playCard(Card card) {
        if (hand.contains(card)) {
            hand.remove(card);

            // Reset UNO call if player no longer has 1 card
            if (hand.size() != 1) {
                calledOne = false;
            }

            return true;
        }
        return false;
    }

    /**
     * Draw a card and add it to player's hand
     *
     * @param card The card to draw
     */
    public void drawCard(Card card) {
        if (card != null) {
            hand.add(card);

            // Reset UNO call when drawing cards
            if (hand.size() > 1) {
                calledOne = false;
            }
        }
    }

    /**
     * Check if player has UNO (exactly 1 card left)
     *
     * @return true if player has exactly 1 card
     */
    public boolean hasOne() {
        return hand.size() == 1;
    }

    /**
     * Check if player has won (no cards left)
     *
     * @return true if hand is empty
     */
    public boolean hasWon() {
        return hand.isEmpty();
    }

    /**
     * Get all valid cards that can be played on the given top card
     *
     * @param topCard The card currently on top of discard pile
     * @return List of cards from hand that can be played
     */
    public List<Card> getValidCards(Card topCard) {
        return hand.stream()
                .filter(card -> card.canPlayOn(topCard))
                .collect(Collectors.toList());
    }

    /**
     * Check if player has any valid cards to play
     *
     * @param topCard The card currently on top of discard pile
     * @return true if player has at least one playable card
     */
    public boolean hasValidCard(Card topCard) {
        return hand.stream().anyMatch(card -> card.canPlayOn(topCard));
    }

    /**
     * Calculate total points from cards in hand (for scoring when game ends)
     *
     * @return Sum of point values of all cards in hand
     */
    public int calculateHandPoints() {
        return hand.stream()
                .mapToInt(Card::getPointValue)
                .sum();
    }

    /**
     * Call "ONE" when player has one card left
     */
    public void callOne() {
        if (hasOne()) {
            this.calledOne = true;
        }
    }

    /**
     * Check if player should be penalized for not calling UNO
     *
     * @return true if player has 1 card but didn't call UNO
     */
    public boolean shouldBePenalized() {
        return hasOne() && !calledOne;
    }

    /**
     * Reset player's hand for a new round
     */
    public void resetHand() {
        hand.clear();
        calledOne = false;
    }

    /**
     * Get number of cards in hand
     *
     * @return Hand size
     */
    public int getHandSize() {
        return hand.size();
    }

    /**
     * Check if player has called ONE
     *
     * @return true if player called ONE
     */
    public boolean hasCalledOne() {
        return calledOne;
    }

    /**
     * Reset ONE call status
     */
    public void resetOneCall() {
        calledOne = false;
    }

    /**
     * Check if player has a specific card
     *
     * @param card Card to check
     * @return true if card is in hand
     */
    public boolean hasCard(Card card) {
        return hand.contains(card);
    }

    /**
     * Add a card to player's hand (alias for drawCard)
     *
     * @param card The card to add
     */
    public void addCard(Card card) {
        drawCard(card);
    }

    /**
     * Check if player has called UNO (alias for hasCalledOne)
     *
     * @return true if player called UNO
     */
    public boolean isCalledUno() {
        return hasCalledOne();
    }

    /**
     * Set the UNO call status
     *
     * @param called Whether player has called UNO
     */
    public void setCalledUno(boolean called) {
        this.calledOne = called;
    }

    @Override
    public String toString() {
        return nickname + " (" + hand.size() + " cards, " + score + " points)";
    }
}
