package com.oneonline.backend.controller;

import com.oneonline.backend.dto.request.PlayCardRequest;
import com.oneonline.backend.dto.response.GameStateResponse;
import com.oneonline.backend.model.domain.*;
import com.oneonline.backend.model.enums.CardColor;
import com.oneonline.backend.service.game.GameEngine;
import com.oneonline.backend.service.game.GameManager;
import com.oneonline.backend.service.game.OneManager;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * GameController - REST API for game operations
 *
 * Handles in-game actions like playing cards, drawing, calling ONE, etc.
 *
 * ENDPOINTS:
 * - POST /api/game/{sessionId}/start - Start game session
 * - POST /api/game/{sessionId}/play - Play a card
 * - POST /api/game/{sessionId}/draw - Draw a card
 * - POST /api/game/{sessionId}/one - Call ONE
 * - GET /api/game/{sessionId}/state - Get current game state
 * - POST /api/game/{sessionId}/undo - Undo last move
 * - POST /api/game/{sessionId}/catch-one/{playerId} - Catch player without ONE
 *
 * SECURITY:
 * - All endpoints require authentication
 *
 * @author Juan Gallardo
 */
@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@Validated
@Slf4j
@PreAuthorize("isAuthenticated()")
public class GameController {

    private final GameEngine gameEngine;
    private final GameManager gameManager = GameManager.getInstance();
    private final OneManager oneManager;

    /**
     * Start a game session
     *
     * POST /api/game/{sessionId}/start
     *
     * Initializes the game:
     * - Deals cards to all players
     * - Sets up turn order
     * - Places first card
     *
     * @param sessionId Game session ID
     * @return GameStateResponse with initial game state
     */
    @PostMapping("/{sessionId}/start")
    public ResponseEntity<GameStateResponse> startGame(@PathVariable String sessionId) {
        log.info("Starting game session: {}", sessionId);

        GameSession session = gameManager.getSession(sessionId);

        // Start game
        gameEngine.startGame(session);

        log.info("Game session {} started", sessionId);

        GameStateResponse response = mapToGameStateResponse(session);
        return ResponseEntity.ok(response);
    }

    /**
     * Play a card
     *
     * POST /api/game/{sessionId}/play
     *
     * Request body:
     * {
     *   "cardId": "card-uuid-123",
     *   "chosenColor": "RED"  // Only for Wild cards
     * }
     *
     * Response: Updated game state
     *
     * @param sessionId Game session ID
     * @param request Card to play
     * @param authentication Current user
     * @return Updated game state
     */
    @PostMapping("/{sessionId}/play")
    public ResponseEntity<GameStateResponse> playCard(
            @PathVariable String sessionId,
            @Valid @RequestBody PlayCardRequest request,
            Authentication authentication) {

        log.info("Player {} playing card in session {}", authentication.getName(), sessionId);

        GameSession session = gameManager.getSession(sessionId);

        // Find player
        Player player = session.getPlayers().stream()
                .filter(p -> p.getNickname().equals(authentication.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

        // Find card in player's hand
        Card card = player.getHand().stream()
                .filter(c -> c.toString().contains(request.getCardId())) // Simplified matching
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Card not found in hand"));

        // If Wild card, set chosen color
        if (card instanceof WildCard wildCard && request.getChosenColor() != null) {
            wildCard.setChosenColor(CardColor.valueOf(request.getChosenColor()));
        }

        // Process move
        gameEngine.processMove(player, card, session);

        log.info("Card played successfully in session {}", sessionId);

        GameStateResponse response = mapToGameStateResponse(session);
        return ResponseEntity.ok(response);
    }

    /**
     * Draw a card from the deck
     *
     * POST /api/game/{sessionId}/draw
     *
     * Player draws a card when:
     * - They have no valid cards to play
     * - They choose to draw strategically
     *
     * @param sessionId Game session ID
     * @param authentication Current user
     * @return Updated game state
     */
    @PostMapping("/{sessionId}/draw")
    public ResponseEntity<GameStateResponse> drawCard(
            @PathVariable String sessionId,
            Authentication authentication) {

        log.info("Player {} drawing card in session {}", authentication.getName(), sessionId);

        GameSession session = gameManager.getSession(sessionId);

        // Find player
        Player player = session.getPlayers().stream()
                .filter(p -> p.getNickname().equals(authentication.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

        // Verify it's player's turn
        if (!session.getTurnManager().getCurrentPlayer().getPlayerId().equals(player.getPlayerId())) {
            throw new IllegalArgumentException("Not your turn!");
        }

        // Draw card
        Card drawnCard = gameEngine.drawCard(player, session);

        // Advance turn (after draw, turn ends)
        session.getTurnManager().nextTurn();

        log.info("Player {} drew a card in session {}", authentication.getName(), sessionId);

        GameStateResponse response = mapToGameStateResponse(session);
        return ResponseEntity.ok(response);
    }

    /**
     * Call ONE
     *
     * POST /api/game/{sessionId}/uno
     *
     * Player calls ONE when they have 1 card remaining.
     * Must be called before next player's turn.
     *
     * @param sessionId Game session ID
     * @param authentication Current user
     * @return Success message
     */
    @PostMapping("/{sessionId}/uno")
    public ResponseEntity<String> callOne(
            @PathVariable String sessionId,
            Authentication authentication) {

        log.info("Player {} calling ONE in session {}", authentication.getName(), sessionId);

        GameSession session = gameManager.getSession(sessionId);

        // Find player
        Player player = session.getPlayers().stream()
                .filter(p -> p.getNickname().equals(authentication.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

        // Call ONE
        boolean success = oneManager.callOne(player, session);

        if (!success) {
            return ResponseEntity.badRequest().body("Invalid ONE call");
        }

        log.info("UNO called successfully by {} in session {}", authentication.getName(), sessionId);

        return ResponseEntity.ok("ONE!");
    }

    /**
     * Get current game state
     *
     * GET /api/game/{sessionId}/state
     *
     * Returns complete game state:
     * - All players and their hand sizes
     * - Current turn
     * - Top card
     * - Discard pile size
     * - Deck size
     *
     * @param sessionId Game session ID
     * @param authentication Current user
     * @return GameStateResponse
     */
    @GetMapping("/{sessionId}/state")
    public ResponseEntity<GameStateResponse> getGameState(
            @PathVariable String sessionId,
            Authentication authentication) {
        log.debug("Fetching game state for session: {} and user: {}", sessionId, authentication.getName());

        GameSession session = gameManager.getSession(sessionId);

        GameStateResponse response = mapToGameStateResponse(session, authentication);
        return ResponseEntity.ok(response);
    }

    /**
     * Undo last move
     *
     * POST /api/game/{sessionId}/undo
     *
     * Reverts the last move (if allowed by game rules).
     *
     * @param sessionId Game session ID
     * @return Updated game state
     */
    @PostMapping("/{sessionId}/undo")
    public ResponseEntity<?> undoLastMove(@PathVariable String sessionId) {
        log.info("Undo requested for session: {}", sessionId);

        boolean success = gameEngine.undoLastMove();

        if (!success) {
            return ResponseEntity.badRequest().body("Cannot undo last move");
        }

        GameSession session = gameManager.getSession(sessionId);
        GameStateResponse response = mapToGameStateResponse(session);

        return ResponseEntity.ok(response);
    }

    /**
     * Catch a player who didn't call ONE
     *
     * POST /api/game/{sessionId}/catch-uno/{playerId}
     *
     * Any player can catch another player who has 1 card but didn't call ONE.
     * Caught player draws +2 cards as penalty.
     *
     * @param sessionId Game session ID
     * @param playerId Player to catch
     * @param authentication Current user (catching player)
     * @return Success message
     */
    @PostMapping("/{sessionId}/catch-uno/{playerId}")
    public ResponseEntity<String> catchPlayerWithoutOne(
            @PathVariable String sessionId,
            @PathVariable String playerId,
            Authentication authentication) {

        log.info("Player {} catching player {} for no UNO in session {}",
                authentication.getName(), playerId, sessionId);

        GameSession session = gameManager.getSession(sessionId);

        // Find both players
        Player caughtPlayer = session.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not found"));

        Player catchingPlayer = session.getPlayers().stream()
                .filter(p -> p.getNickname().equals(authentication.getName()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Player not in game"));

        // Catch player
        boolean success = oneManager.catchPlayerWithoutOne(caughtPlayer, catchingPlayer, session);

        if (!success) {
            return ResponseEntity.badRequest().body("Invalid catch attempt");
        }

        return ResponseEntity.ok("Player caught! Penalty applied.");
    }

    /**
     * Map GameSession to GameStateResponse DTO
     *
     * @param session Game session
     * @param authentication Current user (optional - only needed for hand data)
     * @return GameStateResponse DTO
     */
    private GameStateResponse mapToGameStateResponse(GameSession session, Authentication authentication) {
        // Find current player if authentication is provided
        Player currentPlayer = null;
        List<GameStateResponse.CardInfo> hand = null;

        if (authentication != null) {
            currentPlayer = session.getPlayers().stream()
                    .filter(p -> p.getNickname().equals(authentication.getName()))
                    .findFirst()
                    .orElse(null);

            // Include player's hand
            if (currentPlayer != null) {
                hand = currentPlayer.getHand().stream()
                        .map(card -> GameStateResponse.CardInfo.builder()
                                .cardId(card.getCardId())
                                .type(card.getType().name())
                                .color(card.getColor().name())
                                .value(card instanceof NumberCard ? ((NumberCard) card).getValue() : null)
                                .build())
                        .collect(Collectors.toList());
            }
        }

        return GameStateResponse.builder()
                .sessionId(session.getSessionId())
                .roomCode(session.getRoom().getRoomCode())
                .status(session.getStatus().name())
                .players(session.getPlayers().stream()
                        .map(p -> GameStateResponse.PlayerState.builder()
                                .playerId(p.getPlayerId())
                                .nickname(p.getNickname())
                                .cardCount(p.getHandSize())
                                .score(p.getScore())
                                .calledOne(p.hasCalledOne())
                                .isBot(p instanceof BotPlayer)
                                .build())
                        .collect(Collectors.toList()))
                .currentPlayerId(session.getTurnManager().getCurrentPlayer().getPlayerId())
                .topCard(session.getTopCard() != null ? GameStateResponse.CardInfo.builder()
                        .cardId(session.getTopCard().getCardId())
                        .type(session.getTopCard().getType().name())
                        .color(session.getTopCard().getColor().name())
                        .value(session.getTopCard() instanceof NumberCard ?
                                ((NumberCard) session.getTopCard()).getValue() : null)
                        .build() : null)
                .hand(hand)
                .deckSize(session.getDeck().getRemainingCards())
                .discardPileSize(session.getDiscardPile().size())
                .direction(session.getTurnManager().isClockwise() ? "CLOCKWISE" : "COUNTER_CLOCKWISE")
                .pendingDrawCount(session.getPendingDrawCount())
                .clockwise(session.getTurnManager().isClockwise())
                .build();
    }

    /**
     * Map GameSession to GameStateResponse DTO (without authentication)
     *
     * @param session Game session
     * @return GameStateResponse DTO
     */
    private GameStateResponse mapToGameStateResponse(GameSession session) {
        return mapToGameStateResponse(session, null);
    }
}
