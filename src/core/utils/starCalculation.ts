/**
 * Star calculation utilities for the Mini Trainer Engine.
 * 
 * Provides functions for calculating and displaying star ratings.
 */

import type { Score } from '@/types/gamification';

// ============================================================================
// Star Calculations
// ============================================================================

/**
 * Calculate star rating from number of attempts.
 * 1st attempt = 3 stars, 2nd attempt = 2 stars, 3rd attempt = 1 star.
 * Returns 0 if attempts exceed maxAttempts or are invalid (<= 0).
 * 
 * @param attempts - Number of attempts made (must be positive)
 * @param maxAttempts - Maximum allowed attempts (default: 3)
 * @returns Score (0-3), where 0 means exceeded max attempts or invalid input
 */
export function calculateStars(attempts: number, maxAttempts: number = 3): Score {
    // Invalid attempts (0 or negative) should not award stars
    if (attempts <= 0) return 0;
    if (attempts > maxAttempts) return 0;
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    return 1;
}

/**
 * Get star display string with emoji.
 * 
 * @param stars - Number of stars (0-3)
 * @returns String of star emojis
 */
export function getStarDisplay(stars: number): string {
    const filledStars = Math.min(Math.max(stars, 0), 3);
    const emptyStars = 3 - filledStars;
    return '⭐'.repeat(filledStars) + '☆'.repeat(emptyStars);
}

/**
 * Get star display as array for rendering.
 * 
 * @param stars - Number of stars (0-3)
 * @returns Array of boolean indicating filled stars
 */
export function getStarArray(stars: number): [boolean, boolean, boolean] {
    return [
        stars >= 1,
        stars >= 2,
        stars >= 3,
    ];
}

/**
 * Calculate total possible stars from exercise count.
 * 
 * @param exerciseCount - Number of exercises
 * @param maxStarsPerExercise - Maximum stars per exercise (default: 3)
 * @returns Total possible stars
 */
export function calculateMaxStars(exerciseCount: number, maxStarsPerExercise: number = 3): number {
    return exerciseCount * maxStarsPerExercise;
}
