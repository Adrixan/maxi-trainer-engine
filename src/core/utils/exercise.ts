/**
 * Exercise utilities for validation, scoring, and data loading.
 */

import type {
    Exercise,
    ExerciseContent,
    ExerciseResult,
    StarRating,
    FillBlankContent,
    MultipleChoiceContent,
    MatchingContent,
    SentenceBuilderContent,
    SortingContent,
    WritingContent,
    ConjugationTableContent,
    ConnectorInsertContent,
    WordOrderContent,
    PictureVocabularyContent,
} from '@/types/exercise';

// ============================================================================
// Answer Validation
// ============================================================================

/**
 * Validate a fill-blank answer.
 */
export function validateFillBlankAnswer(
    content: FillBlankContent,
    answer: string
): { correct: boolean; caseError: boolean } {
    const trimmed = answer.trim();
    const allAcceptable = [content.correctAnswer, ...content.acceptableAnswers];

    // Check exact match
    if (allAcceptable.includes(trimmed)) {
        return { correct: true, caseError: false };
    }

    // Check case-insensitive match
    const lowerAnswer = trimmed.toLowerCase();
    const hasCaseError = allAcceptable.some(
        (a) => a.toLowerCase() === lowerAnswer
    );

    return { correct: false, caseError: hasCaseError };
}

/**
 * Validate a multiple choice answer.
 */
export function validateMultipleChoiceAnswer(
    content: MultipleChoiceContent,
    selectedIndex: number
): boolean {
    return selectedIndex === content.correctIndex;
}

/**
 * Validate a matching exercise answer.
 */
export function validateMatchingAnswer(
    content: MatchingContent,
    matches: Record<number, string>
): boolean {
    return content.pairs.every((pair, idx) => matches[idx] === pair.right);
}

/**
 * Validate a sentence builder answer.
 */
export function validateSentenceBuilderAnswer(
    content: SentenceBuilderContent,
    sentence: string
): boolean {
    const normalized = sentence.trim().toLowerCase();
    return content.targetSentences.some(
        (target) => target.toLowerCase() === normalized
    );
}

/**
 * Validate a sorting exercise answer.
 */
export function validateSortingAnswer(
    content: SortingContent,
    buckets: Record<number, string[]>
): { correct: boolean; results: Record<number, Record<string, boolean>> } {
    const correctMap = new Map<string, number>();
    content.categories.forEach((cat, idx) => {
        cat.items.forEach((item) => correctMap.set(item, idx));
    });

    const results: Record<number, Record<string, boolean>> = {};
    let allCorrect = true;

    content.categories.forEach((_, catIdx) => {
        results[catIdx] = {};
        const items = buckets[catIdx] || [];
        items.forEach((item) => {
            const isCorrect = correctMap.get(item) === catIdx;
            const bucket = results[catIdx];
            if (bucket) {
                bucket[item] = isCorrect;
            }
            if (!isCorrect) allCorrect = false;
        });
    });

    return { correct: allCorrect, results };
}

/**
 * Validate a writing exercise answer.
 * Writing exercises are effort-based, not correctness-based.
 */
export function validateWritingAnswer(
    content: WritingContent,
    text: string
): { valid: boolean; wordCount: number } {
    const wordCount = countWords(text);
    return {
        valid: wordCount >= content.minLength,
        wordCount,
    };
}

/**
 * Validate a conjugation table answer.
 */
export function validateConjugationTableAnswer(
    content: ConjugationTableContent,
    inputs: Record<number, string>
): { correct: boolean; results: Record<number, boolean>; caseErrors: Record<number, boolean> } {
    const results: Record<number, boolean> = {};
    const caseErrors: Record<number, boolean> = {};
    let allCorrect = true;

    content.cells.forEach((cell, idx) => {
        if (cell.prefilled) return;

        const userAnswer = (inputs[idx] ?? '').trim();
        const exactCorrect = userAnswer === cell.correctForm;
        const caseInsensitiveCorrect = userAnswer.toLowerCase() === cell.correctForm.toLowerCase();

        if (exactCorrect) {
            results[idx] = true;
            caseErrors[idx] = false;
        } else if (caseInsensitiveCorrect) {
            results[idx] = false;
            caseErrors[idx] = true;
            allCorrect = false;
        } else {
            results[idx] = false;
            caseErrors[idx] = false;
            allCorrect = false;
        }
    });

    return { correct: allCorrect, results, caseErrors };
}

/**
 * Validate a connector insert answer.
 */
export function validateConnectorInsertAnswer(
    content: ConnectorInsertContent,
    selected: string
): boolean {
    return selected === content.correctConnector;
}

/**
 * Validate a word order answer.
 */
export function validateWordOrderAnswer(
    content: WordOrderContent,
    order: string[]
): boolean {
    return order.every((word, idx) => word === content.correctOrder[idx]);
}

/**
 * Validate a picture vocabulary answer.
 */
export function validatePictureVocabularyAnswer(
    content: PictureVocabularyContent,
    selected: string
): boolean {
    return (
        selected === content.correctAnswer ||
        (content.acceptableAnswers?.includes(selected) ?? false)
    );
}

// ============================================================================
// Score Calculation
// ============================================================================

/**
 * Calculate star rating based on attempts.
 * 1 attempt = 3 stars, 2 attempts = 2 stars, 3+ attempts = 1 star.
 */
export function calculateStars(attempts: number): StarRating {
    if (attempts === 1) return 3;
    if (attempts === 2) return 2;
    return 1;
}

/**
 * Calculate total stars from results.
 */
export function calculateTotalStars(results: ExerciseResult[]): number {
    return results.reduce((sum, r) => sum + r.score, 0);
}

/**
 * Calculate accuracy percentage.
 */
export function calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
}

/**
 * Calculate progress percentage.
 */
export function calculateProgress(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Count words in a string.
 */
export function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 */
export function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j] as T;
        copy[j] = temp as T;
    }
    return copy;
}

/**
 * Format time in seconds to a readable string.
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
}

/**
 * Get star display string.
 */
export function getStarDisplay(stars: number): string {
    return '⭐'.repeat(Math.min(Math.max(stars, 0), 3));
}

/**
 * Check if an answer is empty or whitespace-only.
 */
export function isEmptyAnswer(answer: string | null | undefined): boolean {
    return !answer || answer.trim().length === 0;
}

/**
 * Normalize text for comparison (lowercase, trimmed).
 */
export function normalizeText(text: string): string {
    return text.trim().toLowerCase();
}

/**
 * Check if two texts match (case-insensitive).
 */
export function textMatches(a: string, b: string): boolean {
    return normalizeText(a) === normalizeText(b);
}

// ============================================================================
// Exercise Data Loading
// ============================================================================

/**
 * Load exercises from the global exercise data.
 */
export function loadExercises(): Exercise[] {
    // The exercise data is loaded via a script tag in index.html
    // and exposed as a global variable
    const globalData = (window as unknown as { __TRAINER_EXERCISES__?: { exercises: Exercise[] } }).__TRAINER_EXERCISES__;
    return globalData?.exercises ?? [];
}

/**
 * Filter exercises by criteria.
 */
export function filterExercises(
    exercises: Exercise[],
    filters: {
        areaId?: string;
        themeId?: string;
        level?: number;
        difficulty?: 1 | 2 | 3;
        type?: ExerciseContent['type'];
    }
): Exercise[] {
    return exercises.filter((exercise) => {
        if (filters.areaId && exercise.areaId !== filters.areaId) return false;
        if (filters.themeId && exercise.themeId !== filters.themeId) return false;
        if (filters.level !== undefined && exercise.level !== filters.level) return false;
        if (filters.difficulty && exercise.difficulty !== filters.difficulty) return false;
        if (filters.type && exercise.content.type !== filters.type) return false;
        return true;
    });
}

/**
 * Select a random subset of exercises.
 */
export function selectRandomExercises(
    exercises: Exercise[],
    count: number
): Exercise[] {
    const shuffled = shuffleArray(exercises);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Group exercises by a key.
 */
export function groupExercises<K extends string>(
    exercises: Exercise[],
    keyFn: (exercise: Exercise) => K
): Record<K, Exercise[]> {
    const groups = {} as Record<K, Exercise[]>;
    for (const exercise of exercises) {
        const key = keyFn(exercise);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key]?.push(exercise);
    }
    return groups;
}

/**
 * Get unique values from exercises.
 */
export function getUniqueValues<T>(
    exercises: Exercise[],
    valueFn: (exercise: Exercise) => T
): T[] {
    const values = new Set(exercises.map(valueFn));
    return Array.from(values);
}
