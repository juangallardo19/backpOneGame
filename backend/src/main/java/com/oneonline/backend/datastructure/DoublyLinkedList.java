package com.oneonline.backend.datastructure;

/**
 * Custom implementation of a doubly linked list data structure.
 *
 * ACADEMIC PURPOSE:
 * Demonstrates understanding of:
 * - Bidirectional node traversal
 * - Previous and next pointer management
 * - Efficient insertion/deletion at both ends
 * - O(1) insertion at head/tail, O(n) access by index
 *
 * USED IN PROJECT FOR:
 * - Game move history (navigate forward and backward through moves)
 * - Undo/redo functionality
 * - Bidirectional iteration through game states
 *
 * @param <T> The type of elements stored in this list
 */
public class DoublyLinkedList<T> {

    /**
     * Inner Node class with both next and previous pointers
     */
    private static class Node<T> {
        T data;
        Node<T> next;
        Node<T> prev;

        Node(T data) {
            this.data = data;
            this.next = null;
            this.prev = null;
        }
    }

    private Node<T> head;
    private Node<T> tail;
    private int size;

    /**
     * Constructor - creates empty list
     */
    public DoublyLinkedList() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * Add element to the end of the list
     * Time complexity: O(1)
     *
     * @param data The element to add
     */
    public void add(T data) {
        Node<T> newNode = new Node<>(data);

        if (tail == null) {
            head = tail = newNode;
        } else {
            tail.next = newNode;
            newNode.prev = tail;
            tail = newNode;
        }

        size++;
    }

    /**
     * Add element at the beginning of the list
     * Time complexity: O(1)
     *
     * @param data The element to add
     */
    public void addFirst(T data) {
        Node<T> newNode = new Node<>(data);

        if (head == null) {
            head = tail = newNode;
        } else {
            newNode.next = head;
            head.prev = newNode;
            head = newNode;
        }

        size++;
    }

    /**
     * Add element at specific index
     * Time complexity: O(n)
     *
     * @param index Position to insert at
     * @param data Element to insert
     * @throws IndexOutOfBoundsException if index is invalid
     */
    public void add(int index, T data) {
        if (index < 0 || index > size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }

        if (index == 0) {
            addFirst(data);
            return;
        }

        if (index == size) {
            add(data);
            return;
        }

        Node<T> newNode = new Node<>(data);
        Node<T> current = getNodeAt(index);

        newNode.prev = current.prev;
        newNode.next = current;
        current.prev.next = newNode;
        current.prev = newNode;

        size++;
    }

    /**
     * Remove element at specific index
     * Time complexity: O(n)
     *
     * @param index Position of element to remove
     * @return The removed element
     * @throws IndexOutOfBoundsException if index is invalid
     */
    public T remove(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }

        Node<T> nodeToRemove = getNodeAt(index);
        return removeNode(nodeToRemove);
    }

    /**
     * Remove first occurrence of element
     * Time complexity: O(n)
     *
     * @param data Element to remove
     * @return true if element was found and removed
     */
    public boolean remove(T data) {
        Node<T> current = head;

        while (current != null) {
            if (current.data.equals(data)) {
                removeNode(current);
                return true;
            }
            current = current.next;
        }

        return false;
    }

    /**
     * Helper method to remove a specific node
     *
     * @param node The node to remove
     * @return The data from removed node
     */
    private T removeNode(Node<T> node) {
        if (node.prev != null) {
            node.prev.next = node.next;
        } else {
            head = node.next;
        }

        if (node.next != null) {
            node.next.prev = node.prev;
        } else {
            tail = node.prev;
        }

        size--;
        return node.data;
    }

    /**
     * Get element at specific index
     * Time complexity: O(n)
     *
     * @param index Position of element
     * @return Element at index
     * @throws IndexOutOfBoundsException if index is invalid
     */
    public T get(int index) {
        if (index < 0 || index >= size) {
            throw new IndexOutOfBoundsException("Index: " + index + ", Size: " + size);
        }

        return getNodeAt(index).data;
    }

    /**
     * Helper method to get node at specific index
     * Optimized: traverses from nearest end (head or tail)
     *
     * @param index Position of node
     * @return Node at index
     */
    private Node<T> getNodeAt(int index) {
        Node<T> current;

        // Optimize by starting from nearest end
        if (index < size / 2) {
            // Traverse from head
            current = head;
            for (int i = 0; i < index; i++) {
                current = current.next;
            }
        } else {
            // Traverse from tail
            current = tail;
            for (int i = size - 1; i > index; i--) {
                current = current.prev;
            }
        }

        return current;
    }

    /**
     * Navigate forward through the list starting from head
     *
     * @return Iterator-like access to traverse forward
     */
    public ForwardIterator forwardIterator() {
        return new ForwardIterator();
    }

    /**
     * Navigate backward through the list starting from tail
     *
     * @return Iterator-like access to traverse backward
     */
    public BackwardIterator backwardIterator() {
        return new BackwardIterator();
    }

    /**
     * Inner class for forward iteration
     */
    public class ForwardIterator {
        private Node<T> current = head;

        public boolean hasNext() {
            return current != null;
        }

        public T next() {
            if (!hasNext()) {
                return null;
            }
            T data = current.data;
            current = current.next;
            return data;
        }
    }

    /**
     * Inner class for backward iteration
     */
    public class BackwardIterator {
        private Node<T> current = tail;

        public boolean hasNext() {
            return current != null;
        }

        public T next() {
            if (!hasNext()) {
                return null;
            }
            T data = current.data;
            current = current.prev;
            return data;
        }
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
     * Clear all elements from the list
     */
    public void clear() {
        head = null;
        tail = null;
        size = 0;
    }

    /**
     * Get first element without removing
     *
     * @return First element, or null if empty
     */
    public T getFirst() {
        return head != null ? head.data : null;
    }

    /**
     * Get last element without removing
     *
     * @return Last element, or null if empty
     */
    public T getLast() {
        return tail != null ? tail.data : null;
    }

    @Override
    public String toString() {
        if (head == null) {
            return "[]";
        }

        StringBuilder sb = new StringBuilder("[");
        Node<T> current = head;

        while (current != null) {
            sb.append(current.data);
            if (current.next != null) {
                sb.append(" <-> ");
            }
            current = current.next;
        }

        sb.append("]");
        return sb.toString();
    }
}
