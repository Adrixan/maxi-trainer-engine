/**
 * Array shuffling utilities for the Mini Trainer Engine.
 * 
 * Provides functions for randomizing arrays, particularly useful
 * for shuffling exercise options and question orders.
 */

// ============================================================================
// Shuffling Functions
// ============================================================================

/**
 * Shuffle an array using the Fisher-Yates algorithm.
 * Returns a new array (does not mutate the original).
 * 
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];

    // Fisher-Yates shuffle
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements
        const temp = result[i];
        result[i] = result[j] as T;
        result[j] = temp as T;
    }

    return result;
}

/**
 * Shuffle an array using cryptographically secure random values.
 * Returns a new array (does not mutate the original).
 * 
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function secureShuffle<T>(array: readonly T[]): T[] {
    const result = [...array];

    // Use crypto.getRandomValues if available
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const values = new Uint32Array(result.length);
        crypto.getRandomValues(values);

        // Fisher-Yates shuffle with crypto random
        for (let i = result.length - 1; i > 0; i--) {
            const val = values[i];
            const j = (val ?? 0) % (i + 1);
            const temp = result[i];
            result[i] = result[j] as T;
            result[j] = temp as T;
        }
    } else {
        // Fallback to regular shuffle
        return shuffle(array);
    }

    return result;
}

/**
 * Shuffle an array in place using the Fisher-Yates algorithm.
 * Mutates the original array.
 * 
 * @param array - The array to shuffle in place
 * @returns The same array (now shuffled)
 */
export function shuffleInPlace<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Swap elements
        const temp = array[i];
        array[i] = array[j] as T;
        array[j] = temp as T;
    }

    return array;
}

/**
 * Get a random element from an array.
 * 
 * @param array - The array to pick from
 * @returns A random element, or undefined if array is empty
 */
export function getRandomElement<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = Math.floor(Math.random() * array.length);
    return array[index];
}

/**
 * Get multiple random elements from an array without replacement.
 * 
 * @param array - The array to pick from
 * @param count - Number of elements to pick
 * @returns Array of random elements
 */
export function getRandomElements<T>(array: readonly T[], count: number): T[] {
    if (count <= 0) return [];
    if (count >= array.length) return [...array];

    const shuffled = shuffle(array);
    return shuffled.slice(0, count);
}

/**
 * Get a random index from an array.
 * 
 * @param array - The array to get an index for
 * @returns A random valid index, or -1 if array is empty
 */
export function getRandomIndex<T>(array: readonly T[]): number {
    if (array.length === 0) return -1;
    return Math.floor(Math.random() * array.length);
}

/**
 * Shuffle string characters.
 * 
 * @param str - The string to shuffle
 * @returns A new string with characters shuffled
 */
export function shuffleString(str: string): string {
    return shuffle(str.split('')).join('');
}

/**
 * Create a shuffled copy of an array with guaranteed different order.
 * If the array has fewer than 2 elements, returns a copy as-is.
 * 
 * @param array - The array to shuffle
 * @returns A new shuffled array with different order
 */
export function shuffleWithChange<T>(array: readonly T[]): T[] {
    if (array.length < 2) return [...array];

    let result: T[];
    do {
        result = shuffle(array);
    } while (arraysEqual(array, result));

    return result;
}

/**
 * Check if two arrays have the same elements in the same order.
 */
function arraysEqual<T>(a: readonly T[], b: readonly T[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Create a seeded random number generator for reproducible shuffles.
 * 
 * @param seed - The seed value
 * @returns A function that returns random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
    return function seededRandom(): number {
        // Simple LCG (Linear Congruential Generator)
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    };
}

/**
 * Shuffle an array with a seed for reproducible results.
 * 
 * @param array - The array to shuffle
 * @param seed - The seed value
 * @returns A new shuffled array
 */
export function seededShuffle<T>(array: readonly T[], seed: number): T[] {
    const result = [...array];
    const random = createSeededRandom(seed);

    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp = result[i];
        result[i] = result[j] as T;
        result[j] = temp as T;
    }

    return result;
}
