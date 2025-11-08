package com.oneonline.backend.datastructure;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Custom implementation of a graph data structure for tracking player relationships.
 *
 * ACADEMIC PURPOSE:
 * Demonstrates understanding of:
 * - Graph theory (nodes and edges)
 * - Adjacency list representation
 * - Weighted/directed edges
 * - Graph traversal and analysis
 *
 * USED IN PROJECT FOR:
 * - Track player interactions (who played against whom)
 * - Record special card targeting (Draw Two, Wild Draw Four)
 * - Analyze player rivalries and dynamics
 * - Bot AI can use this for strategic decisions
 * - Statistics and game history analysis
 *
 * EXAMPLE:
 * - addInteraction("Alice", "Bob", PLAYED_AGAINST) -> Records game interaction
 * - addInteraction("Alice", "Bob", DRAW_TWO) -> Alice played Draw Two on Bob
 * - getPlayerRelations("Alice") -> Returns all Alice's interactions
 *
 * @param <T> The type representing a player (typically String playerId)
 */
public class PlayerRelationGraph<T> {

    /**
     * Types of interactions between players
     */
    public enum InteractionType {
        PLAYED_AGAINST,     // General game interaction
        DRAW_TWO,          // Played +2 on player
        WILD_DRAW_FOUR,    // Played +4 on player
        SKIPPED,           // Skipped player's turn
        REVERSED,          // Reversed turn affecting player
        WON_AGAINST        // Won game against player
    }

    /**
     * Represents an edge in the graph (interaction between players)
     */
    public static class Interaction<T> {
        private final T targetPlayer;
        private final InteractionType type;
        private int count;  // Number of times this interaction occurred

        public Interaction(T targetPlayer, InteractionType type) {
            this.targetPlayer = targetPlayer;
            this.type = type;
            this.count = 1;
        }

        public T getTargetPlayer() {
            return targetPlayer;
        }

        public InteractionType getType() {
            return type;
        }

        public int getCount() {
            return count;
        }

        public void incrementCount() {
            count++;
        }

        @Override
        public String toString() {
            return type + " -> " + targetPlayer + " (x" + count + ")";
        }
    }

    /**
     * Node in the graph representing a player
     */
    private static class PlayerNode<T> {
        private final T playerId;
        private final Map<String, Interaction<T>> interactions;  // Key: targetId_type

        public PlayerNode(T playerId) {
            this.playerId = playerId;
            this.interactions = new HashMap<>();
        }

        public T getPlayerId() {
            return playerId;
        }

        public Map<String, Interaction<T>> getInteractions() {
            return interactions;
        }

        public void addInteraction(T target, InteractionType type) {
            String key = target.toString() + "_" + type.name();

            if (interactions.containsKey(key)) {
                interactions.get(key).incrementCount();
            } else {
                interactions.put(key, new Interaction<>(target, type));
            }
        }
    }

    // Adjacency list representation
    private final Map<T, PlayerNode<T>> nodes;

    /**
     * Constructor - creates empty graph
     */
    public PlayerRelationGraph() {
        this.nodes = new HashMap<>();
    }

    /**
     * Add a player to the graph
     * Time complexity: O(1)
     *
     * @param playerId The player identifier
     */
    public void addPlayer(T playerId) {
        if (!nodes.containsKey(playerId)) {
            nodes.put(playerId, new PlayerNode<>(playerId));
        }
    }

    /**
     * Add an interaction between two players (directed edge)
     * Time complexity: O(1)
     *
     * @param fromPlayer Source player
     * @param toPlayer Target player
     * @param type Type of interaction
     */
    public void addInteraction(T fromPlayer, T toPlayer, InteractionType type) {
        // Ensure both players exist in graph
        addPlayer(fromPlayer);
        addPlayer(toPlayer);

        // Add directed edge
        nodes.get(fromPlayer).addInteraction(toPlayer, type);
    }

    /**
     * Get all interactions for a specific player
     * Time complexity: O(1)
     *
     * @param playerId The player to query
     * @return Map of all interactions, or empty map if player not found
     */
    public Map<String, Interaction<T>> getPlayerRelations(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return new HashMap<>();
        }

        return nodes.get(playerId).getInteractions();
    }

    /**
     * Get count of specific interaction type between two players
     *
     * @param fromPlayer Source player
     * @param toPlayer Target player
     * @param type Type of interaction
     * @return Count of interactions, or 0 if none
     */
    public int getInteractionCount(T fromPlayer, T toPlayer, InteractionType type) {
        if (!nodes.containsKey(fromPlayer)) {
            return 0;
        }

        String key = toPlayer.toString() + "_" + type.name();
        Interaction<T> interaction = nodes.get(fromPlayer).getInteractions().get(key);

        return interaction != null ? interaction.getCount() : 0;
    }

    /**
     * Get total number of interactions from a player
     *
     * @param playerId The player to query
     * @return Total interaction count
     */
    public int getTotalInteractions(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return 0;
        }

        return nodes.get(playerId).getInteractions().values().stream()
                .mapToInt(Interaction::getCount)
                .sum();
    }

    /**
     * Find who a player interacted with most
     *
     * @param playerId The player to query
     * @return Player with most interactions, or null if none
     */
    public T getMostFrequentTarget(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return null;
        }

        Map<T, Integer> targetCounts = new HashMap<>();

        // Sum all interactions per target
        for (Interaction<T> interaction : nodes.get(playerId).getInteractions().values()) {
            T target = interaction.getTargetPlayer();
            targetCounts.put(target, targetCounts.getOrDefault(target, 0) + interaction.getCount());
        }

        // Find max
        return targetCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    /**
     * Check if two players have any interactions
     *
     * @param player1 First player
     * @param player2 Second player
     * @return true if any interaction exists (either direction)
     */
    public boolean hasInteraction(T player1, T player2) {
        if (!nodes.containsKey(player1) || !nodes.containsKey(player2)) {
            return false;
        }

        // Check both directions
        for (Interaction<T> interaction : nodes.get(player1).getInteractions().values()) {
            if (interaction.getTargetPlayer().equals(player2)) {
                return true;
            }
        }

        for (Interaction<T> interaction : nodes.get(player2).getInteractions().values()) {
            if (interaction.getTargetPlayer().equals(player1)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all players in the graph
     *
     * @return Set of all player IDs
     */
    public Set<T> getAllPlayers() {
        return new HashSet<>(nodes.keySet());
    }

    /**
     * Get number of players in graph
     *
     * @return Player count
     */
    public int getPlayerCount() {
        return nodes.size();
    }

    /**
     * Remove a player from the graph
     *
     * @param playerId Player to remove
     * @return true if player was removed
     */
    public boolean removePlayer(T playerId) {
        if (!nodes.containsKey(playerId)) {
            return false;
        }

        // Remove node
        nodes.remove(playerId);

        // Remove all edges pointing to this player
        for (PlayerNode<T> node : nodes.values()) {
            node.getInteractions().entrySet()
                    .removeIf(entry -> entry.getValue().getTargetPlayer().equals(playerId));
        }

        return true;
    }

    /**
     * Clear all data from graph
     */
    public void clear() {
        nodes.clear();
    }

    /**
     * Check if graph is empty
     *
     * @return true if no players in graph
     */
    public boolean isEmpty() {
        return nodes.isEmpty();
    }

    @Override
    public String toString() {
        if (nodes.isEmpty()) {
            return "PlayerRelationGraph: (empty)";
        }

        StringBuilder sb = new StringBuilder("PlayerRelationGraph:\n");

        for (PlayerNode<T> node : nodes.values()) {
            sb.append("  ").append(node.getPlayerId()).append(":\n");

            if (node.getInteractions().isEmpty()) {
                sb.append("    (no interactions)\n");
            } else {
                for (Interaction<T> interaction : node.getInteractions().values()) {
                    sb.append("    ").append(interaction).append("\n");
                }
            }
        }

        return sb.toString();
    }

    /**
     * Get statistics about interactions in the graph
     *
     * @return Summary string
     */
    public String getStatistics() {
        int totalPlayers = nodes.size();
        int totalInteractions = nodes.values().stream()
                .mapToInt(node -> node.getInteractions().size())
                .sum();

        return String.format("Players: %d, Total Interactions: %d, Avg per player: %.2f",
                totalPlayers, totalInteractions,
                totalPlayers > 0 ? (double) totalInteractions / totalPlayers : 0);
    }
}
