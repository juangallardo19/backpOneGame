package com.oneonline.backend.datastructure;

/**
 * Custom implementation of a singly linked list data structure.
 *
 * ACADEMIC PURPOSE:
 * Demonstrates understanding of:
 * - Node-based data structures
 * - Linear data organization
 * - Dynamic memory allocation
 * - O(1) insertion at head, O(n) access by index
 *
 * USED IN PROJECT FOR:
 * - Player card hands (dynamic size, frequent additions/removals)
 * - Temporary collections where order matters
 *
 * @param <T> The type of elements stored in this list
 */
public class LinkedList<T> {

    /**
     * Inner Node class representing each element in the list
     */
    private static class Node<T> {
        T data;
        Node<T> next;

        Node(T data) {
            this.data = data;
            this.next = null;
        }
    }

    private Node<T> head;
    private int size;

    /**
     * Constructor - creates empty list
     */
    public LinkedList() {
        this.head = null;
        this.size = 0;
    }

    /**
     * Add element to the end of the list
     * Time complexity: O(n)
     *
     * @param data The element to add
     */
    public void add(T data) {
        Node<T> newNode = new Node<>(data);

        if (head == null) {
            head = newNode;
        } else {
            Node<T> current = head;
            while (current.next != null) {
                current = current.next;
            }
            current.next = newNode;
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
        newNode.next = head;
        head = newNode;
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

        Node<T> newNode = new Node<>(data);
        Node<T> current = head;

        for (int i = 0; i < index - 1; i++) {
            current = current.next;
        }

        newNode.next = current.next;
        current.next = newNode;
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

        T removedData;

        if (index == 0) {
            removedData = head.data;
            head = head.next;
        } else {
            Node<T> current = head;
            for (int i = 0; i < index - 1; i++) {
                current = current.next;
            }
            removedData = current.next.data;
            current.next = current.next.next;
        }

        size--;
        return removedData;
    }

    /**
     * Remove first occurrence of element
     * Time complexity: O(n)
     *
     * @param data Element to remove
     * @return true if element was found and removed
     */
    public boolean remove(T data) {
        if (head == null) {
            return false;
        }

        if (head.data.equals(data)) {
            head = head.next;
            size--;
            return true;
        }

        Node<T> current = head;
        while (current.next != null) {
            if (current.next.data.equals(data)) {
                current.next = current.next.next;
                size--;
                return true;
            }
            current = current.next;
        }

        return false;
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

        Node<T> current = head;
        for (int i = 0; i < index; i++) {
            current = current.next;
        }

        return current.data;
    }

    /**
     * Check if list contains element
     * Time complexity: O(n)
     *
     * @param data Element to search for
     * @return true if element exists in list
     */
    public boolean contains(T data) {
        Node<T> current = head;
        while (current != null) {
            if (current.data.equals(data)) {
                return true;
            }
            current = current.next;
        }
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
     * Clear all elements from the list
     */
    public void clear() {
        head = null;
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
                sb.append(", ");
            }
            current = current.next;
        }

        sb.append("]");
        return sb.toString();
    }
}
