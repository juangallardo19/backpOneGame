package com.oneonline.backend.datastructure;

/**
 * Custom implementation of a circular doubly linked list data structure.
 *
 * ACADEMIC PURPOSE:
 * Demonstrates understanding of:
 * - Circular data structures (no null pointers, infinite loop)
 * - Bidirectional traversal with wrap-around
 * - Dynamic direction reversal
 * - Perfect for round-robin algorithms
 *
 * USED IN PROJECT FOR:
 * - Turn order management in ONE game (critical feature!)
 * - Handles Reverse card (changes direction)
 * - Handles Skip card (jumps over player)
 * - Infinite circular iteration through players
 * - No null checks needed (always has next/prev)
 *
 * EXAMPLE USAGE:
 * - Add players: [P1, P2, P3, P4]
 * - getNext() -> P2, getNext() -> P3, getNext() -> P4, getNext() -> P1 (loops back)
 * - reverse() -> Now getNext() goes backwards: P4 -> P3 -> P2 -> P1 -> P4...
 * - skip() -> Skips current player (Skip card effect)
 *
 * @param <T> The type of elements stored in this list
 */
public class CircularDoublyLinkedList<T> {

    /**
     * Inner Node class with circular next/prev pointers
     */
    private static class Node<T> {
        T data;
        Node<T> next;
        Node<T> prev;

        Node(T data) {
            this.data = data;
            this.next = this;  // Initially points to itself
            this.prev = this;  // Initially points to itself
        }
    }

    private Node<T> current;
    private int size;
    private boolean clockwise;  // Direction flag

    /**
     * Constructor - creates empty circular list
     */
    public CircularDoublyLinkedList() {
        this.current = null;
        this.size = 0;
        this.clockwise = true;
    }

    /**
     * Add element to the circular list
     * Time complexity: O(1)
     *
     * @param data The element to add
     */
    public void add(T data) {
        Node<T> newNode = new Node<>(data);

        if (current == null) {
            // First node - points to itself
            current = newNode;
        } else {
            // Insert after current
            newNode.next = current.next;
            newNode.prev = current;
            current.next.prev = newNode;
            current.next = newNode;
        }

        size++;
    }

    /**
     * Get current element without moving
     *
     * @return Current element, or null if list is empty
     */
    public T getCurrent() {
        return current != null ? current.data : null;
    }

    /**
     * Move to next element and return it
     * Direction depends on clockwise flag
     * Time complexity: O(1)
     *
     * @return Next element (never null if list not empty)
     */
    public T getNext() {
        if (current == null) {
            return null;
        }

        if (clockwise) {
            current = current.next;
        } else {
            current = current.prev;
        }

        return current.data;
    }

    /**
     * Move to previous element and return it
     * Direction depends on clockwise flag
     * Time complexity: O(1)
     *
     * @return Previous element (never null if list not empty)
     */
    public T getPrevious() {
        if (current == null) {
            return null;
        }

        if (clockwise) {
            current = current.prev;
        } else {
            current = current.next;
        }

        return current.data;
    }

    /**
     * Move to next element without returning it
     * Direction depends on clockwise flag
     * Time complexity: O(1)
     */
    public void moveNext() {
        if (current != null) {
            current = clockwise ? current.next : current.prev;
        }
    }

    /**
     * Move to previous element without returning it
     * Direction depends on clockwise flag
     * Time complexity: O(1)
     */
    public void movePrevious() {
        if (current != null) {
            current = clockwise ? current.prev : current.next;
        }
    }

    /**
     * Peek at next element without moving current pointer
     *
     * @return Next element without changing position
     */
    public T peekNext() {
        if (current == null) {
            return null;
        }

        return clockwise ? current.next.data : current.prev.data;
    }

    /**
     * Peek at previous element without moving current pointer
     *
     * @return Previous element without changing position
     */
    public T peekPrevious() {
        if (current == null) {
            return null;
        }

        return clockwise ? current.prev.data : current.next.data;
    }

    /**
     * Reverse the direction of traversal
     * CRITICAL for ONE Reverse card!
     *
     * Time complexity: O(1)
     */
    public void reverse() {
        clockwise = !clockwise;
    }

    /**
     * Skip the next player (move two positions forward)
     * CRITICAL for ONE Skip card!
     *
     * Time complexity: O(1)
     * @return The skipped element
     */
    public T skip() {
        if (current == null) {
            return null;
        }

        T skipped = peekNext();

        // Move two positions
        if (clockwise) {
            current = current.next.next;
        } else {
            current = current.prev.prev;
        }

        return skipped;
    }

    /**
     * Remove current element and move to next
     * Time complexity: O(1)
     *
     * @return The removed element
     */
    public T removeCurrent() {
        if (current == null) {
            return null;
        }

        T data = current.data;

        if (size == 1) {
            current = null;
        } else {
            Node<T> toRemove = current;

            // Update pointers
            toRemove.prev.next = toRemove.next;
            toRemove.next.prev = toRemove.prev;

            // Move to next
            current = clockwise ? toRemove.next : toRemove.prev;
        }

        size--;
        return data;
    }

    /**
     * Remove specific element from the list
     * Time complexity: O(n)
     *
     * @param data Element to remove
     * @return true if element was found and removed
     */
    public boolean remove(T data) {
        if (current == null) {
            return false;
        }

        Node<T> start = current;
        do {
            if (current.data.equals(data)) {
                removeCurrent();
                return true;
            }
            current = current.next;
        } while (current != start);

        return false;
    }

    /**
     * Check if list contains element
     * Time complexity: O(n)
     *
     * @param data Element to search for
     * @return true if element exists
     */
    public boolean contains(T data) {
        if (current == null) {
            return false;
        }

        Node<T> start = current;
        do {
            if (current.data.equals(data)) {
                return true;
            }
            current = current.next;
        } while (current != start);

        return false;
    }

    /**
     * Set current pointer to specific element
     *
     * @param data Element to set as current
     * @return true if element was found
     */
    public boolean setCurrent(T data) {
        if (current == null) {
            return false;
        }

        Node<T> start = current;
        do {
            if (current.data.equals(data)) {
                return true;
            }
            current = current.next;
        } while (current != start);

        return false;
    }

    /**
     * Get the number of elements in the list
     *
     * @return Size of the list
     */
    public int size() {
        return size;
    }

    /**
     * Check if list is empty
     *
     * @return true if list has no elements
     */
    public boolean isEmpty() {
        return size == 0;
    }

    /**
     * Check current direction
     *
     * @return true if moving clockwise, false if counter-clockwise
     */
    public boolean isClockwise() {
        return clockwise;
    }

    /**
     * Set direction explicitly
     *
     * @param clockwise true for clockwise, false for counter-clockwise
     */
    public void setClockwise(boolean clockwise) {
        this.clockwise = clockwise;
    }

    /**
     * Clear all elements
     */
    public void clear() {
        current = null;
        size = 0;
        clockwise = true;
    }

    /**
     * Get all elements in current direction order
     *
     * @return String representation of list
     */
    @Override
    public String toString() {
        if (current == null) {
            return "[]";
        }

        StringBuilder sb = new StringBuilder("[");
        Node<T> start = current;
        boolean first = true;

        do {
            if (!first) {
                sb.append(" -> ");
            }
            sb.append(current.data);
            if (current == start && !first) {
                sb.append(" (current)");
            }
            first = false;
            current = clockwise ? current.next : current.prev;
        } while (current != start);

        sb.append("] ");
        sb.append(clockwise ? "clockwise" : "counter-clockwise");

        return sb.toString();
    }

    /**
     * Get string showing the circular nature with arrows
     *
     * @return Visual representation of circular list
     */
    public String toCircularString() {
        if (current == null) {
            return "� (empty)";
        }

        StringBuilder sb = new StringBuilder();
        Node<T> start = current;

        do {
            if (current == start) {
                sb.append("[").append(current.data).append("]");
            } else {
                sb.append(current.data);
            }
            sb.append(clockwise ? " � " : " � ");
            current = current.next;
        } while (current != start);

        sb.append("(loops back)");
        return sb.toString();
    }
}
