package com.oneonline.backend.datastructure;

import com.oneonline.backend.model.domain.Card;
import com.oneonline.backend.model.domain.Player;

import java.util.ArrayList;
import java.util.List;

/**
 * Custom implementation of a decision tree for bot AI strategy.
 *
 * ACADEMIC PURPOSE:
 * Demonstrates understanding of:
 * - Tree data structures
 * - Game AI and minimax-like algorithms
 * - Recursive tree building and traversal
 * - Heuristic evaluation functions
 * - Lookahead search strategies
 *
 * USED IN PROJECT FOR:
 * - Bot AI decision making (BotPlayer)
 * - Evaluate multiple moves ahead (lookahead depth)
 * - Calculate utility scores for each possible move
 * - Find optimal card to play
 * - Strategic planning (not just random play)
 *
 * EXAMPLE:
 * - Bot has hand: [Red 5, Blue 7, Wild, Skip]
 * - Tree explores: What happens if I play each card?
 * - Calculates scores based on:
 *   - Remaining cards in hand
 *   - Opponent hand sizes
 *   - Card types (special cards = higher value)
 * - Returns best move
 *
 * @param <T> Type of game state (typically GameSession or simplified state)
 */
public class DecisionTree<T> {

    /**
     * Node in the decision tree
     */
    public static class DecisionNode<T> {
        private T gameState;              // State of the game at this node
        private Card cardToPlay;          // Card that led to this state
        private Player player;            // Player who plays this card
        private double utilityScore;      // Evaluated score of this state
        private int depth;                // Depth in tree (0 = root)
        private List<DecisionNode<T>> children;  // Possible next moves

        public DecisionNode(T gameState, Card cardToPlay, Player player, int depth) {
            this.gameState = gameState;
            this.cardToPlay = cardToPlay;
            this.player = player;
            this.depth = depth;
            this.utilityScore = 0.0;
            this.children = new ArrayList<>();
        }

        // Getters
        public T getGameState() {
            return gameState;
        }

        public Card getCardToPlay() {
            return cardToPlay;
        }

        public Player getPlayer() {
            return player;
        }

        public double getUtilityScore() {
            return utilityScore;
        }

        public void setUtilityScore(double score) {
            this.utilityScore = score;
        }

        public int getDepth() {
            return depth;
        }

        public List<DecisionNode<T>> getChildren() {
            return children;
        }

        public void addChild(DecisionNode<T> child) {
            children.add(child);
        }

        public boolean isLeaf() {
            return children.isEmpty();
        }

        @Override
        public String toString() {
            return String.format("Node[depth=%d, card=%s, score=%.2f, children=%d]",
                    depth, cardToPlay, utilityScore, children.size());
        }
    }

    private DecisionNode<T> root;
    private int maxDepth;

    /**
     * Constructor
     *
     * @param maxDepth Maximum depth to build tree (lookahead)
     */
    public DecisionTree(int maxDepth) {
        this.root = null;
        this.maxDepth = maxDepth;
    }

    /**
     * Build decision tree from current game state
     * Time complexity: O(b^d) where b = branching factor, d = depth
     *
     * @param initialState Starting game state
     * @param currentPlayer Player making decision
     * @return Root node of built tree
     */
    public DecisionNode<T> buildTree(T initialState, Player currentPlayer) {
        root = new DecisionNode<>(initialState, null, currentPlayer, 0);
        expandNode(root);
        return root;
    }

    /**
     * Recursively expand a node by exploring possible moves
     *
     * @param node Node to expand
     */
    private void expandNode(DecisionNode<T> node) {
        if (node.getDepth() >= maxDepth) {
            return;  // Max depth reached
        }

        // In a real implementation, this would:
        // 1. Get all valid cards player can play
        // 2. For each card, simulate playing it
        // 3. Create child node with resulting state
        // 4. Recursively expand children

        // Placeholder for academic demonstration
        // Actual implementation would integrate with GameSession
    }

    /**
     * Evaluate utility score of a game state
     * Higher score = better for the player
     *
     * Factors considered:
     * - Cards remaining in hand (fewer = better)
     * - Type of cards (special cards = more valuable)
     * - Opponent hand sizes (larger = better for us)
     * - Distance to winning
     *
     * @param state Game state to evaluate
     * @param player Player to evaluate for
     * @return Utility score
     */
    public double evaluateState(T state, Player player) {
        double score = 0.0;

        if (player == null) {
            return score;
        }

        // Factor 1: Fewer cards in hand is better
        int handSize = player.getHand().size();
        score += (10 - handSize) * 10;  // Max 100 points if hand is empty

        // Factor 2: Having special cards is valuable
        long specialCards = player.getHand().stream()
                .filter(Card::isActionCard)
                .count();
        score += specialCards * 5;

        // Factor 3: Having wild cards is very valuable
        long wildCards = player.getHand().stream()
                .filter(Card::isWild)
                .count();
        score += wildCards * 15;

        // Factor 4: Close to UNO is high priority
        if (handSize == 1) {
            score += 50;  // About to win!
        } else if (handSize == 2) {
            score += 25;  // Very close
        }

        return score;
    }

    /**
     * Find the best move (highest utility score) from root's children
     * Uses minimax-like approach
     *
     * @return Best child node, or null if no children
     */
    public DecisionNode<T> findBestMove() {
        if (root == null || root.getChildren().isEmpty()) {
            return null;
        }

        DecisionNode<T> bestNode = null;
        double bestScore = Double.NEGATIVE_INFINITY;

        for (DecisionNode<T> child : root.getChildren()) {
            double score = child.getUtilityScore();

            if (score > bestScore) {
                bestScore = score;
                bestNode = child;
            }
        }

        return bestNode;
    }

    /**
     * Perform depth-first traversal of tree
     *
     * @param node Starting node
     * @param visitor Visitor function to apply to each node
     */
    public void depthFirstTraversal(DecisionNode<T> node, java.util.function.Consumer<DecisionNode<T>> visitor) {
        if (node == null) {
            return;
        }

        visitor.accept(node);

        for (DecisionNode<T> child : node.getChildren()) {
            depthFirstTraversal(child, visitor);
        }
    }

    /**
     * Perform breadth-first traversal of tree
     *
     * @param visitor Visitor function to apply to each node
     */
    public void breadthFirstTraversal(java.util.function.Consumer<DecisionNode<T>> visitor) {
        if (root == null) {
            return;
        }

        java.util.Queue<DecisionNode<T>> queue = new java.util.LinkedList<>();
        queue.offer(root);

        while (!queue.isEmpty()) {
            DecisionNode<T> node = queue.poll();
            visitor.accept(node);

            for (DecisionNode<T> child : node.getChildren()) {
                queue.offer(child);
            }
        }
    }

    /**
     * Get total number of nodes in tree
     *
     * @return Node count
     */
    public int getNodeCount() {
        if (root == null) {
            return 0;
        }

        int[] count = {0};
        depthFirstTraversal(root, node -> count[0]++);
        return count[0];
    }

    /**
     * Get maximum depth actually reached in tree
     *
     * @return Max depth
     */
    public int getActualDepth() {
        if (root == null) {
            return 0;
        }

        int[] maxDepth = {0};
        depthFirstTraversal(root, node -> {
            if (node.getDepth() > maxDepth[0]) {
                maxDepth[0] = node.getDepth();
            }
        });

        return maxDepth[0];
    }

    /**
     * Clear the tree
     */
    public void clear() {
        root = null;
    }

    /**
     * Get root node
     *
     * @return Root of tree
     */
    public DecisionNode<T> getRoot() {
        return root;
    }

    /**
     * Set maximum lookahead depth
     *
     * @param maxDepth New max depth
     */
    public void setMaxDepth(int maxDepth) {
        this.maxDepth = maxDepth;
    }

    /**
     * Get maximum configured depth
     *
     * @return Max depth
     */
    public int getMaxDepth() {
        return maxDepth;
    }

    @Override
    public String toString() {
        if (root == null) {
            return "DecisionTree: (empty)";
        }

        return String.format("DecisionTree: %d nodes, max depth %d/%d",
                getNodeCount(), getActualDepth(), maxDepth);
    }

    /**
     * Print tree structure (for debugging)
     *
     * @return String representation of tree
     */
    public String printTree() {
        if (root == null) {
            return "Empty tree";
        }

        StringBuilder sb = new StringBuilder();
        printNode(root, "", true, sb);
        return sb.toString();
    }

    /**
     * Helper method to recursively print tree structure
     */
    private void printNode(DecisionNode<T> node, String prefix, boolean isTail, StringBuilder sb) {
        sb.append(prefix)
          .append(isTail ? "   " : "   ")
          .append(node)
          .append("\n");

        List<DecisionNode<T>> children = node.getChildren();
        for (int i = 0; i < children.size(); i++) {
            boolean isLast = (i == children.size() - 1);
            printNode(children.get(i), prefix + (isTail ? "    " : "   "), isLast, sb);
        }
    }
}
