/**
 * Tests for useExerciseScoring hook.
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExerciseScoring, getStarDisplay, calculateProgress, isLevelThresholdMet, getLevelFromStars } from '../useExerciseScoring';
import { calculateStars } from '@core/utils/gamification';
import type { ExerciseResult } from '@/types/exercise';

// Alias for backward compatibility with test names
const calculateStarRating = calculateStars;

// Helper to create mock exercise results
function createMockResult(overrides: Partial<ExerciseResult> = {}): ExerciseResult {
    return {
        id: 'result-1',
        childProfileId: 'profile-1',
        exerciseId: 'mc-exercise-1',
        areaId: 'area-1',
        themeId: 'theme-1',
        level: 1,
        correct: true,
        score: 3,
        attempts: 1,
        timeSpentSeconds: 30,
        completedAt: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('useExerciseScoring', () => {
    describe('with empty results', () => {
        it('returns zero values for empty results array', () => {
            const { result } = renderHook(() => useExerciseScoring([]));

            expect(result.current.totalExercises).toBe(0);
            expect(result.current.totalCorrect).toBe(0);
            expect(result.current.overallAccuracy).toBe(0);
            expect(result.current.totalStars).toBe(0);
            expect(result.current.maxStars).toBe(0);
            expect(result.current.starCompletion).toBe(0);
            expect(result.current.averageAttempts).toBe(0);
            expect(result.current.averageTimeSeconds).toBe(0);
            expect(result.current.byType).toEqual({});
            expect(result.current.byArea).toEqual({});
            expect(result.current.byLevel).toEqual({});
        });
    });

    describe('with single result', () => {
        it('calculates correct stats for single correct result', () => {
            const results = [createMockResult()];

            const { result } = renderHook(() => useExerciseScoring(results));

            expect(result.current.totalExercises).toBe(1);
            expect(result.current.totalCorrect).toBe(1);
            expect(result.current.overallAccuracy).toBe(100);
            expect(result.current.totalStars).toBe(3);
            expect(result.current.maxStars).toBe(3);
            expect(result.current.starCompletion).toBe(100);
            expect(result.current.averageAttempts).toBe(1);
            expect(result.current.averageTimeSeconds).toBe(30);
        });

        it('calculates correct stats for single incorrect result', () => {
            const results = [createMockResult({ correct: false, score: 0, attempts: 3 })];

            const { result } = renderHook(() => useExerciseScoring(results));

            expect(result.current.totalExercises).toBe(1);
            expect(result.current.totalCorrect).toBe(0);
            expect(result.current.overallAccuracy).toBe(0);
            expect(result.current.totalStars).toBe(0);
        });
    });

    describe('with multiple results', () => {
        it('calculates overall statistics correctly', () => {
            const results = [
                createMockResult({ id: 'r1', correct: true, score: 3, attempts: 1, timeSpentSeconds: 20 }),
                createMockResult({ id: 'r2', correct: true, score: 2, attempts: 2, timeSpentSeconds: 40 }),
                createMockResult({ id: 'r3', correct: false, score: 1, attempts: 3, timeSpentSeconds: 60 }),
            ];

            const { result } = renderHook(() => useExerciseScoring(results));

            expect(result.current.totalExercises).toBe(3);
            expect(result.current.totalCorrect).toBe(2);
            expect(result.current.overallAccuracy).toBeCloseTo(66.67, 1);
            expect(result.current.totalStars).toBe(6);
            expect(result.current.maxStars).toBe(9);
            expect(result.current.starCompletion).toBeCloseTo(66.67, 1);
            expect(result.current.averageAttempts).toBe(2);
            expect(result.current.averageTimeSeconds).toBe(40);
        });

        it('groups statistics by exercise type', () => {
            const results = [
                createMockResult({ exerciseId: 'mc-exercise-1', correct: true, score: 3, attempts: 1 }),
                createMockResult({ exerciseId: 'mc-exercise-2', correct: false, score: 1, attempts: 3 }),
                createMockResult({ exerciseId: 'fb-exercise-1', correct: true, score: 2, attempts: 2 }),
            ];

            const { result } = renderHook(() => useExerciseScoring(results));

            // Type 'mc' (multiple-choice)
            expect(result.current.byType['mc']!.total).toBe(2);
            expect(result.current.byType['mc']!.correct).toBe(1);
            expect(result.current.byType['mc']!.accuracy).toBe(50);
            expect(result.current.byType['mc']!.totalStars).toBe(4);
            expect(result.current.byType['mc']!.averageAttempts).toBe(2);

            // Type 'fb' (fill-blank)
            expect(result.current.byType['fb']!.total).toBe(1);
            expect(result.current.byType['fb']!.correct).toBe(1);
            expect(result.current.byType['fb']!.accuracy).toBe(100);
        });

        it('groups statistics by area', () => {
            const results = [
                createMockResult({ areaId: 'grammar', correct: true, score: 3, attempts: 1 }),
                createMockResult({ areaId: 'grammar', correct: true, score: 2, attempts: 2 }),
                createMockResult({ areaId: 'vocabulary', correct: false, score: 0, attempts: 3 }),
            ];

            const { result } = renderHook(() => useExerciseScoring(results));

            expect(result.current.byArea['grammar']!.total).toBe(2);
            expect(result.current.byArea['grammar']!.correct).toBe(2);
            expect(result.current.byArea['grammar']!.accuracy).toBe(100);

            expect(result.current.byArea['vocabulary']!.total).toBe(1);
            expect(result.current.byArea['vocabulary']!.correct).toBe(0);
            expect(result.current.byArea['vocabulary']!.accuracy).toBe(0);
        });

        it('groups statistics by level', () => {
            const results = [
                createMockResult({ level: 1, correct: true, score: 3, attempts: 1 }),
                createMockResult({ level: 1, correct: false, score: 1, attempts: 3 }),
                createMockResult({ level: 2, correct: true, score: 2, attempts: 2 }),
            ];

            const { result } = renderHook(() => useExerciseScoring(results));

            expect(result.current.byLevel['1']!.total).toBe(2);
            expect(result.current.byLevel['1']!.correct).toBe(1);
            expect(result.current.byLevel['1']!.accuracy).toBe(50);

            expect(result.current.byLevel['2']!.total).toBe(1);
            expect(result.current.byLevel['2']!.correct).toBe(1);
            expect(result.current.byLevel['2']!.accuracy).toBe(100);
        });
    });

    describe('with custom maxStarsPerExercise', () => {
        it('uses custom max stars per exercise', () => {
            const results = [createMockResult({ score: 5 })];

            const { result } = renderHook(() =>
                useExerciseScoring(results, { maxStarsPerExercise: 5 })
            );

            expect(result.current.maxStars).toBe(5);
            expect(result.current.starCompletion).toBe(100);
        });
    });
});

describe('calculateStarRating', () => {
    it('returns 3 stars for 1 attempt', () => {
        expect(calculateStarRating(1)).toBe(3);
    });

    it('returns 2 stars for 2 attempts', () => {
        expect(calculateStarRating(2)).toBe(2);
    });

    it('returns 1 star for 3 attempts, 0 for more', () => {
        expect(calculateStarRating(3)).toBe(1);
        expect(calculateStarRating(4)).toBe(0);
        expect(calculateStarRating(10)).toBe(0);
    });
});

describe('getStarDisplay', () => {
    it('returns correct star emoji string', () => {
        expect(getStarDisplay(0)).toBe('');
        expect(getStarDisplay(1)).toBe('⭐');
        expect(getStarDisplay(2)).toBe('⭐⭐');
        expect(getStarDisplay(3)).toBe('⭐⭐⭐');
    });

    it('caps at 3 stars', () => {
        expect(getStarDisplay(5)).toBe('⭐⭐⭐');
    });
});

describe('calculateProgress', () => {
    it('calculates progress percentage', () => {
        expect(calculateProgress(5, 10)).toBe(50);
        expect(calculateProgress(3, 4)).toBe(75);
        expect(calculateProgress(1, 3)).toBeCloseTo(33.33, 1);
    });

    it('returns 0 for zero total', () => {
        expect(calculateProgress(0, 0)).toBe(0);
    });
});

describe('isLevelThresholdMet', () => {
    it('returns true when threshold is met', () => {
        expect(isLevelThresholdMet(10, 10)).toBe(true);
        expect(isLevelThresholdMet(15, 10)).toBe(true);
    });

    it('returns false when threshold is not met', () => {
        expect(isLevelThresholdMet(5, 10)).toBe(false);
        expect(isLevelThresholdMet(9, 10)).toBe(false);
    });
});

describe('getLevelFromStars', () => {
    const thresholds = [
        { level: 1, starsRequired: 0 },
        { level: 2, starsRequired: 10 },
        { level: 3, starsRequired: 25 },
        { level: 4, starsRequired: 50 },
    ];

    it('returns correct level based on stars', () => {
        expect(getLevelFromStars(0, thresholds)).toBe(1);
        expect(getLevelFromStars(5, thresholds)).toBe(1);
        expect(getLevelFromStars(10, thresholds)).toBe(2);
        expect(getLevelFromStars(24, thresholds)).toBe(2);
        expect(getLevelFromStars(25, thresholds)).toBe(3);
        expect(getLevelFromStars(50, thresholds)).toBe(4);
        expect(getLevelFromStars(100, thresholds)).toBe(4);
    });

    it('returns 1 for empty thresholds', () => {
        expect(getLevelFromStars(10, [])).toBe(1);
    });
});
