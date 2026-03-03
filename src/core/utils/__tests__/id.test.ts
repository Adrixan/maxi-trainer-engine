/**
 * Tests for ID generation utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
    generateId,
    generateShortId,
    generateProfileId,
    generateResultId,
    generateObservationId,
    generateFoerderplanId,
    isValidUuid,
    isValidId,
} from '../id';

describe('generateId', () => {
    it('returns a non-empty string', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('returns a UUID format when crypto.randomUUID is available', () => {
        // In jsdom environment, crypto.randomUUID should be available
        const id = generateId();
        // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(generateId());
        }
        expect(ids.size).toBe(100);
    });
});

describe('generateShortId', () => {
    it('returns a string of default length 6', () => {
        const id = generateShortId();
        expect(id.length).toBe(6);
    });

    it('returns a string of specified length', () => {
        expect(generateShortId(8).length).toBe(8);
        expect(generateShortId(10).length).toBe(10);
        expect(generateShortId(4).length).toBe(4);
    });

    it('contains only alphanumeric characters', () => {
        const id = generateShortId(20);
        expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(generateShortId());
        }
        // Most should be unique (allow some collisions due to short length)
        expect(ids.size).toBeGreaterThan(90);
    });

    it('handles length of 1', () => {
        const id = generateShortId(1);
        expect(id.length).toBe(1);
        expect(id).toMatch(/^[A-Za-z0-9]$/);
    });
});

describe('generateProfileId', () => {
    it('returns a string starting with "profile-"', () => {
        const id = generateProfileId();
        expect(id.startsWith('profile-')).toBe(true);
    });

    it('contains a UUID after the prefix', () => {
        const id = generateProfileId();
        const uuidPart = id.replace('profile-', '');
        expect(isValidUuid(uuidPart)).toBe(true);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 50; i++) {
            ids.add(generateProfileId());
        }
        expect(ids.size).toBe(50);
    });
});

describe('generateResultId', () => {
    it('returns a string starting with "result-"', () => {
        const id = generateResultId();
        expect(id.startsWith('result-')).toBe(true);
    });

    it('contains a UUID after the prefix', () => {
        const id = generateResultId();
        const uuidPart = id.replace('result-', '');
        expect(isValidUuid(uuidPart)).toBe(true);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 50; i++) {
            ids.add(generateResultId());
        }
        expect(ids.size).toBe(50);
    });
});

describe('generateObservationId', () => {
    it('returns a string starting with "obs-"', () => {
        const id = generateObservationId();
        expect(id.startsWith('obs-')).toBe(true);
    });

    it('contains a UUID after the prefix', () => {
        const id = generateObservationId();
        const uuidPart = id.replace('obs-', '');
        expect(isValidUuid(uuidPart)).toBe(true);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 50; i++) {
            ids.add(generateObservationId());
        }
        expect(ids.size).toBe(50);
    });
});

describe('generateFoerderplanId', () => {
    it('returns a string starting with "fp-"', () => {
        const id = generateFoerderplanId();
        expect(id.startsWith('fp-')).toBe(true);
    });

    it('contains a UUID after the prefix', () => {
        const id = generateFoerderplanId();
        const uuidPart = id.replace('fp-', '');
        expect(isValidUuid(uuidPart)).toBe(true);
    });

    it('generates unique IDs', () => {
        const ids = new Set<string>();
        for (let i = 0; i < 50; i++) {
            ids.add(generateFoerderplanId());
        }
        expect(ids.size).toBe(50);
    });
});

describe('isValidUuid', () => {
    it('returns true for valid UUID v4 format', () => {
        expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
        expect(isValidUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('returns true for uppercase UUID', () => {
        expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    });

    it('returns false for invalid UUID formats', () => {
        // Wrong format
        expect(isValidUuid('not-a-uuid')).toBe(false);
        // Too short
        expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
        // Missing hyphens
        expect(isValidUuid('550e8400e29b41d4a716446655440000')).toBe(false);
        // Invalid version (must be 1-5)
        expect(isValidUuid('550e8400-e29b-60d4-a716-446655440000')).toBe(false);
        // Invalid variant (must be 8, 9, a, or b)
        expect(isValidUuid('550e8400-e29b-41d4-c716-446655440000')).toBe(false);
    });

    it('returns false for empty string', () => {
        expect(isValidUuid('')).toBe(false);
    });
});

describe('isValidId', () => {
    it('returns true for valid non-empty strings', () => {
        expect(isValidId('abc123')).toBe(true);
        expect(isValidId('profile-550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        expect(isValidId('result-abc')).toBe(true);
    });

    it('returns true for UUID strings', () => {
        expect(isValidId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('returns false for empty string', () => {
        expect(isValidId('')).toBe(false);
    });

    it('returns false for strings longer than 100 characters', () => {
        const longId = 'a'.repeat(101);
        expect(isValidId(longId)).toBe(false);
    });

    it('returns true for strings up to 100 characters', () => {
        const maxId = 'a'.repeat(100);
        expect(isValidId(maxId)).toBe(true);
    });

    it('returns true for single character', () => {
        expect(isValidId('a')).toBe(true);
    });
});