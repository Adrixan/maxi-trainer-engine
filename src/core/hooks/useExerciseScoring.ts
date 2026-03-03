import { useMemo } from 'react';
import type { ExerciseResult } from '@/types/exercise';

/**
 * Statistics for a single exercise type.
 */
interface ExerciseTypeStats {
    /** Total exercises of this type completed */
    total: number;
    /** Number completed correctly */
    correct: number;
    /** Accuracy percentage */
    accuracy: number;
    /** Average attempts per exercise */
    averageAttempts: number;
    /** Total stars earned */
    totalStars: number;
    /** Average stars per exercise */
    averageStars: number;
}

/**
 * Overall scoring statistics.
 */
interface ScoringStats {
    /** Total exercises completed */
    totalExercises: number;
    /** Total correct answers */
    totalCorrect: number;
    /** Overall accuracy percentage */
    overallAccuracy: number;
    /** Total stars earned */
    totalStars: number;
    /** Maximum possible stars */
    maxStars: number;
    /** Star completion percentage */
    starCompletion: number;
    /** Average attempts per exercise */
    averageAttempts: number;
    /** Average time per exercise in seconds */
    averageTimeSeconds: number;
    /** Statistics by exercise type */
    byType: Record<string, ExerciseTypeStats>;
    /** Statistics by area */
    byArea: Record<string, ExerciseTypeStats>;
    /** Statistics by level */
    byLevel: Record<number, ExerciseTypeStats>;
}

/**
 * Options for useExerciseScoring hook.
 */
interface UseExerciseScoringOptions {
    /** Maximum stars per exercise */
    maxStarsPerExercise?: number;
}

/**
 * Hook for calculating and tracking exercise scores and progress.
 * 
 * ⚠️ NOTE: This hook is NOT currently integrated into the main application flow.
 * It exists as a utility for computing statistics from ExerciseResult arrays.
 * 
 * Currently used only in tests. Should be integrated for displaying
 * session statistics and progress reports.
 */
export function useExerciseScoring(
    results: ExerciseResult[],
    options: UseExerciseScoringOptions = {}
): ScoringStats {
    const { maxStarsPerExercise = 3 } = options;

    return useMemo(() => {
        if (results.length === 0) {
            return {
                totalExercises: 0,
                totalCorrect: 0,
                overallAccuracy: 0,
                totalStars: 0,
                maxStars: 0,
                starCompletion: 0,
                averageAttempts: 0,
                averageTimeSeconds: 0,
                byType: {},
                byArea: {},
                byLevel: {},
            };
        }

        // Calculate overall stats
        const totalExercises = results.length;
        const totalCorrect = results.filter((r) => r.correct).length;
        const overallAccuracy = (totalCorrect / totalExercises) * 100;
        const totalStars = results.reduce((sum, r) => sum + r.score, 0);
        const maxStars = totalExercises * maxStarsPerExercise;
        const starCompletion = (totalStars / maxStars) * 100;
        const averageAttempts = results.reduce((sum, r) => sum + r.attempts, 0) / totalExercises;
        const averageTimeSeconds = results.reduce((sum, r) => sum + r.timeSpentSeconds, 0) / totalExercises;

        // Calculate stats by type (from exerciseId prefix)
        const byType = calculateGroupStats(results, (r) => r.exerciseId.split('-')[0] ?? 'unknown');

        // Calculate stats by area
        const byArea = calculateGroupStats(results, (r) => r.areaId);

        // Calculate stats by level
        const byLevel = calculateGroupStats(results, (r) => String(r.level));

        return {
            totalExercises,
            totalCorrect,
            overallAccuracy,
            totalStars,
            maxStars,
            starCompletion,
            averageAttempts,
            averageTimeSeconds,
            byType,
            byArea,
            byLevel,
        };
    }, [results, maxStarsPerExercise]);
}

/**
 * Calculate statistics grouped by a key extractor.
 */
function calculateGroupStats(
    results: ExerciseResult[],
    keyExtractor: (result: ExerciseResult) => string
): Record<string, ExerciseTypeStats> {
    const groups: Record<string, ExerciseResult[]> = {};

    for (const result of results) {
        const key = keyExtractor(result);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key]?.push(result);
    }

    const stats: Record<string, ExerciseTypeStats> = {};

    for (const [key, groupResults] of Object.entries(groups)) {
        const total = groupResults.length;
        const correct = groupResults.filter((r) => r.correct).length;
        const accuracy = (correct / total) * 100;
        const averageAttempts = groupResults.reduce((sum, r) => sum + r.attempts, 0) / total;
        const totalStars = groupResults.reduce((sum, r) => sum + r.score, 0);
        const averageStars = totalStars / total;

        stats[key] = {
            total,
            correct,
            accuracy,
            averageAttempts,
            totalStars,
            averageStars,
        };
    }

    return stats;
}

/**
 * Get star display string.
 */
export function getStarDisplay(stars: number): string {
    return '⭐'.repeat(Math.min(stars, 3));
}

/**
 * Calculate progress percentage.
 */
export function calculateProgress(completed: number, total: number): number {
    if (total === 0) return 0;
    return (completed / total) * 100;
}

/**
 * Check if a level threshold is met.
 */
export function isLevelThresholdMet(
    currentStars: number,
    requiredStars: number
): boolean {
    return currentStars >= requiredStars;
}

/**
 * Get level from thresholds.
 */
export function getLevelFromStars(
    stars: number,
    thresholds: Array<{ level: number; starsRequired: number }>
): number {
    const sorted = [...thresholds].sort((a, b) => b.level - a.level);
    for (const threshold of sorted) {
        if (stars >= threshold.starsRequired) {
            return threshold.level;
        }
    }
    return 1;
}

export type { ExerciseTypeStats, ScoringStats, UseExerciseScoringOptions };
