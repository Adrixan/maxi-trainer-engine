/**
 * Accessibility Utility Functions.
 * 
 * Provides helper functions for focus management and accessibility features.
 * These utilities complement the React hooks for use in imperative contexts.
 */

// ============================================================================
// Focusable Element Detection
// ============================================================================

/**
 * Selector for all focusable elements.
 */
const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Get all focusable elements within a container.
 * 
 * @param element - Container element to search within
 * @returns Array of focusable elements in DOM order
 * 
 * @example
 * ```ts
 * const focusables = getFocusableElements(modalElement);
 * console.log(`Found ${focusables.length} focusable elements`);
 * ```
 */
export function getFocusableElements(element: HTMLElement): HTMLElement[] {
    return Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Focus the first focusable element within a container.
 * 
 * @param element - Container element to search within
 * @returns The focused element, or null if none found
 * 
 * @example
 * ```ts
 * focusFirstFocusable(dialogElement);
 * ```
 */
export function focusFirstFocusable(element: HTMLElement): HTMLElement | null {
    const focusables = getFocusableElements(element);
    if (focusables.length === 0) return null;

    focusables[0]?.focus();
    return focusables[0] ?? null;
}

/**
 * Focus the last focusable element within a container.
 * 
 * @param element - Container element to search within
 * @returns The focused element, or null if none found
 * 
 * @example
 * ```ts
 * // Focus the last button in a dialog
 * focusLastFocusable(dialogElement);
 * ```
 */
export function focusLastFocusable(element: HTMLElement): HTMLElement | null {
    const focusables = getFocusableElements(element);
    if (focusables.length === 0) return null;

    const last = focusables[focusables.length - 1];
    last?.focus();
    return last ?? null;
}

// ============================================================================
// Focus Trap
// ============================================================================

/**
 * Focus trap state for cleanup.
 */
interface FocusTrapState {
    /** Event handler reference for cleanup */
    handler: (e: KeyboardEvent) => void;
    /** Previously focused element to restore */
    previousFocus: HTMLElement | null;
}

/**
 * Active focus traps for cleanup.
 */
const activeTraps = new Map<HTMLElement, FocusTrapState>();

/**
 * Create a focus trap on an element.
 * 
 * Traps keyboard focus within the element, cycling from last to first
 * element when Tab is pressed. Call the returned cleanup function to
 * remove the trap and restore focus.
 * 
 * @param element - Element to trap focus within
 * @param options - Focus trap options
 * @returns Cleanup function to remove the trap
 * 
 * @example
 * ```ts
 * const cleanup = trapFocus(modalElement);
 * // Later, when closing the modal:
 * cleanup();
 * ```
 */
export function trapFocus(
    element: HTMLElement,
    options: {
        /** Auto-focus first element when trap is created */
        autoFocus?: boolean;
        /** Callback when Escape is pressed */
        onEscape?: () => void;
    } = {}
): () => void {
    const { autoFocus = true, onEscape } = options;

    // Remove any existing trap on this element
    const existing = activeTraps.get(element);
    if (existing) {
        element.removeEventListener('keydown', existing.handler);
    }

    // Store the previously focused element
    const previousFocus = document.activeElement as HTMLElement | null;

    // Create the keyboard handler
    const handler = (e: KeyboardEvent) => {
        // Handle Escape key
        if (e.key === 'Escape' && onEscape) {
            e.preventDefault();
            onEscape();
            return;
        }

        // Only handle Tab key
        if (e.key !== 'Tab') return;

        const focusables = getFocusableElements(element);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (!first || !last) return;

        if (e.shiftKey) {
            // Shift + Tab: moving backwards
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // Tab: moving forwards
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };

    // Add event listener
    element.addEventListener('keydown', handler);

    // Store state
    activeTraps.set(element, { handler, previousFocus });

    // Auto-focus first element
    if (autoFocus) {
        setTimeout(() => {
            focusFirstFocusable(element);
        }, 50);
    }

    // Return cleanup function
    return () => {
        element.removeEventListener('keydown', handler);
        activeTraps.delete(element);

        // Restore previous focus
        if (previousFocus && typeof previousFocus.focus === 'function') {
            previousFocus.focus();
        }
    };
}

// ============================================================================
// Focus Management Utilities
// ============================================================================

/**
 * Save the currently focused element.
 * 
 * @returns The currently focused element, or null if none
 * 
 * @example
 * ```ts
 * const savedFocus = saveFocus();
 * // ... do something that changes focus
 * restoreFocus(savedFocus);
 * ```
 */
export function saveFocus(): HTMLElement | null {
    return document.activeElement as HTMLElement | null;
}

/**
 * Restore focus to a previously saved element.
 * 
 * @param element - Element to restore focus to
 * 
 * @example
 * ```ts
 * const savedFocus = saveFocus();
 * // ... open modal, interact, close modal
 * restoreFocus(savedFocus);
 * ```
 */
export function restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
        element.focus();
    }
}

/**
 * Check if an element is focusable.
 * 
 * @param element - Element to check
 * @returns True if the element is focusable
 * 
 * @example
 * ```ts
 * if (isFocusable(buttonElement)) {
 *   buttonElement.focus();
 * }
 * ```
 */
export function isFocusable(element: HTMLElement): boolean {
    if (element.hasAttribute('disabled')) return false;
    if (element.getAttribute('tabindex') === '-1') return false;

    const tagName = element.tagName.toLowerCase();

    // Check for naturally focusable elements
    if (['button', 'a', 'input', 'select', 'textarea'].includes(tagName)) {
        // For links, check if it has an href
        if (tagName === 'a') {
            return element.hasAttribute('href');
        }
        return true;
    }

    // Check for tabindex
    return element.hasAttribute('tabindex');
}

/**
 * Get the next focusable element after a given element.
 * 
 * @param element - Reference element
 * @returns The next focusable element in DOM order, or null
 */
export function getNextFocusable(element: HTMLElement): HTMLElement | null {
    const allFocusable = getFocusableElements(document.body);
    const index = allFocusable.indexOf(element);

    if (index === -1 || index === allFocusable.length - 1) {
        return allFocusable[0] ?? null;
    }

    return allFocusable[index + 1] ?? null;
}

/**
 * Get the previous focusable element before a given element.
 * 
 * @param element - Reference element
 * @returns The previous focusable element in DOM order, or null
 */
export function getPreviousFocusable(element: HTMLElement): HTMLElement | null {
    const allFocusable = getFocusableElements(document.body);
    const index = allFocusable.indexOf(element);

    if (index === -1 || index === 0) {
        return allFocusable[allFocusable.length - 1] ?? null;
    }

    return allFocusable[index - 1] ?? null;
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * Announce a message to screen readers.
 * 
 * Creates a temporary live region, announces the message,
 * and removes the region after the announcement.
 * 
 * @param message - Message to announce
 * @param priority - 'polite' (waits for pause) or 'assertive' (interrupts)
 * 
 * @example
 * ```ts
 * announceToScreenReader('Exercise completed!');
 * announceToScreenReader('Error occurred', 'assertive');
 * ```
 */
export function announceToScreenReader(
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
): void {
    const region = document.createElement('div');
    region.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
    region.setAttribute('aria-live', priority);
    region.setAttribute('aria-atomic', 'true');
    region.className = 'sr-only';
    region.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';

    document.body.appendChild(region);

    // Clear first, then set message (ensures same message can be announced twice)
    region.textContent = '';
    setTimeout(() => {
        region.textContent = message;
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(region);
        }, 1000);
    }, 50);
}
