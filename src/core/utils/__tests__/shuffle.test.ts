/**
 * Tests for shuffle utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    shuffle,
    secureShuffle,
    shuffleInPlace,
    getRandomElement,
    getRandomElements,
    getRandomIndex,
    shuffleString,
    shuffleWithChange,
    createSeededRandom,
    seededShuffle,
} from '../shuffle';

describe('shuffle', () => {
    it('returns a new array (does not mutate original)', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffle(original);
        expect(original).toEqual([1, 2, 3, 4, 5]);
        expect(result).not.toBe(original);
    });

    it('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffle(original);
        expect(result.sort()).toEqual(original.sort());
    });

    it('returns empty array for empty input', () => {
        expect(shuffle([])).toEqual([]);
    });

    it('returns single element array unchanged', () => {
        expect(shuffle([1])).toEqual([1]);
    });

    it('works with strings', () => {
        const original = ['a', 'b', 'c', 'd'];
        const result = shuffle(original);
        expect(result.sort()).toEqual(original.sort());
    });

    it('works with objects', () => {
        const original = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const result = shuffle(original);
        expect(result.sort((a, b) => a.id - b.id)).toEqual(original);
    });

    it('produces different orders on multiple calls (statistical)', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const results = new Set<string>();

        // Run multiple shuffles and check we get different orders
        for (let i = 0; i < 50; i++) {
            results.add(shuffle(original).join(','));
        }

        // With 10 elements, we should see multiple different orders
        expect(results.size).toBeGreaterThan(5);
    });
});

describe('secureShuffle', () => {
    it('returns a new array', () => {
        const original = [1, 2, 3, 4, 5];
        const result = secureShuffle(original);
        expect(result).not.toBe(original);
    });

    it('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const result = secureShuffle(original);
        expect(result.sort()).toEqual(original.sort());
    });

    it('returns empty array for empty input', () => {
        expect(secureShuffle([])).toEqual([]);
    });

    it('returns single element array unchanged', () => {
        expect(secureShuffle([1])).toEqual([1]);
    });
});

describe('shuffleInPlace', () => {
    it('mutates the original array', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffleInPlace(original);
        expect(result).toBe(original);
    });

    it('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        shuffleInPlace(original);
        expect(original.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns empty array for empty input', () => {
        const arr: number[] = [];
        expect(shuffleInPlace(arr)).toEqual([]);
    });

    it('returns single element array unchanged', () => {
        const arr = [1];
        expect(shuffleInPlace(arr)).toEqual([1]);
    });
});

describe('getRandomElement', () => {
    it('returns an element from the array', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = getRandomElement(arr);
        expect(arr).toContain(result);
    });

    it('returns undefined for empty array', () => {
        expect(getRandomElement([])).toBeUndefined();
    });

    it('returns the only element for single element array', () => {
        expect(getRandomElement([42])).toBe(42);
    });

    it('returns different elements on multiple calls (statistical)', () => {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const results = new Set<number>();

        for (let i = 0; i < 50; i++) {
            const el = getRandomElement(arr);
            if (el !== undefined) results.add(el);
        }

        // Should have picked multiple different elements
        expect(results.size).toBeGreaterThan(3);
    });
});

describe('getRandomElements', () => {
    it('returns empty array for count <= 0', () => {
        expect(getRandomElements([1, 2, 3], 0)).toEqual([]);
        expect(getRandomElements([1, 2, 3], -1)).toEqual([]);
    });

    it('returns all elements when count >= length', () => {
        const arr = [1, 2, 3];
        const result = getRandomElements(arr, 5);
        expect(result.sort()).toEqual(arr);
    });

    it('returns specified number of unique elements', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = getRandomElements(arr, 3);
        expect(result.length).toBe(3);

        // All elements should be from original array
        for (const el of result) {
            expect(arr).toContain(el);
        }

        // No duplicates
        expect(new Set(result).size).toBe(3);
    });

    it('returns empty array for empty input', () => {
        expect(getRandomElements([], 3)).toEqual([]);
    });
});

describe('getRandomIndex', () => {
    it('returns a valid index', () => {
        const arr = [1, 2, 3, 4, 5];
        const result = getRandomIndex(arr);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(arr.length);
    });

    it('returns -1 for empty array', () => {
        expect(getRandomIndex([])).toBe(-1);
    });

    it('returns 0 for single element array', () => {
        expect(getRandomIndex([1])).toBe(0);
    });
});

describe('shuffleString', () => {
    it('returns a string of same length', () => {
        expect(shuffleString('hello').length).toBe(5);
    });

    it('preserves all characters', () => {
        const original = 'hello';
        const result = shuffleString(original);
        expect(result.split('').sort().join('')).toBe(original.split('').sort().join(''));
    });

    it('returns empty string for empty input', () => {
        expect(shuffleString('')).toBe('');
    });

    it('returns single character unchanged', () => {
        expect(shuffleString('a')).toBe('a');
    });
});

describe('shuffleWithChange', () => {
    it('returns array with different order', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffleWithChange(original);
        expect(result).not.toEqual(original);
    });

    it('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const result = shuffleWithChange(original);
        expect(result.sort()).toEqual(original.sort());
    });

    it('returns copy for single element array', () => {
        const original = [1];
        const result = shuffleWithChange(original);
        expect(result).toEqual([1]);
        expect(result).not.toBe(original);
    });

    it('returns copy for empty array', () => {
        expect(shuffleWithChange([])).toEqual([]);
    });

    it('returns copy for two element array (may be same or different)', () => {
        const original = [1, 2];
        const result = shuffleWithChange(original);
        expect(result.length).toBe(2);
        expect(result.sort()).toEqual(original.sort());
    });
});

describe('createSeededRandom', () => {
    it('returns a function', () => {
        expect(typeof createSeededRandom(123)).toBe('function');
    });

    it('returns numbers between 0 and 1', () => {
        const random = createSeededRandom(123);
        for (let i = 0; i < 100; i++) {
            const value = random();
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(1);
        }
    });

    it('produces same sequence for same seed', () => {
        const random1 = createSeededRandom(456);
        const random2 = createSeededRandom(456);

        const sequence1 = Array.from({ length: 10 }, () => random1());
        const sequence2 = Array.from({ length: 10 }, () => random2());

        expect(sequence1).toEqual(sequence2);
    });

    it('produces different sequences for different seeds', () => {
        const random1 = createSeededRandom(111);
        const random2 = createSeededRandom(222);

        const sequence1 = Array.from({ length: 10 }, () => random1());
        const sequence2 = Array.from({ length: 10 }, () => random2());

        expect(sequence1).not.toEqual(sequence2);
    });
});

describe('seededShuffle', () => {
    it('returns a new array', () => {
        const original = [1, 2, 3, 4, 5];
        const result = seededShuffle(original, 123);
        expect(result).not.toBe(original);
    });

    it('preserves all elements', () => {
        const original = [1, 2, 3, 4, 5];
        const result = seededShuffle(original, 123);
        expect(result.sort()).toEqual(original.sort());
    });

    it('produces same result for same seed', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result1 = seededShuffle(original, 456);
        const result2 = seededShuffle(original, 456);
        expect(result1).toEqual(result2);
    });

    it('produces different results for different seeds', () => {
        const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result1 = seededShuffle(original, 111);
        const result2 = seededShuffle(original, 222);
        expect(result1).not.toEqual(result2);
    });

    it('returns empty array for empty input', () => {
        expect(seededShuffle([], 123)).toEqual([]);
    });

    it('returns single element array unchanged', () => {
        expect(seededShuffle([1], 123)).toEqual([1]);
    });

    it('is reproducible across multiple calls', () => {
        const original = ['a', 'b', 'c', 'd', 'e'];
        const seed = 789;

        // Multiple calls with same seed should produce same result
        const results = Array.from({ length: 5 }, () => seededShuffle(original, seed));

        for (const result of results) {
            expect(result).toEqual(results[0]);
        }
    });

    it('works with objects', () => {
        const original = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const result = seededShuffle(original, 123);
        expect(result.length).toBe(3);
        expect(result.map(o => o.id).sort()).toEqual([1, 2, 3]);
    });
});