/**
 * Exercise-related type definitions for the Mini Trainer Engine.
 * 
 * This module defines all exercise types, content structures, and result types
 * used throughout the application.
 */

/**
 * All supported exercise types.
 * Each type has a corresponding content interface and component.
 */
export type ExerciseType =
    | 'fill-blank'
    | 'multiple-choice'
    | 'matching'
    | 'sentence-builder'
    | 'sorting'
    | 'writing'
    | 'conjugation-table'
    | 'connector-insert'
    | 'word-order'
    | 'picture-vocabulary';

/**
 * Template literal type for observation area identifiers.
 * Customized per trainer based on diagnostic framework.
 */
export type ObservationAreaId = `${string}`;

/**
 * Template literal type for theme identifiers.
 * Customized per trainer based on content themes.
 */
export type ThemeId = `${string}`;

// ============================================================================
// Exercise Content Types (Discriminated Union Members)
// ============================================================================

/**
 * Fill-in-the-blank exercise content.
 * User must fill in a blank placeholder in a sentence.
 */
export interface FillBlankContent {
    /** Discriminant for exercise content union */
    type: 'fill-blank';
    /** Sentence containing {{blank}} placeholder */
    sentence: string;
    /** The primary correct answer */
    correctAnswer: string;
    /** Additional acceptable answers (synonyms, variations) */
    acceptableAnswers: string[];
    /** If set, a numeric digit answer triggers a follow-up asking for the written word form */
    numericWordForm?: string;
}

/**
 * Multiple choice exercise content.
 * User selects one correct answer from multiple options.
 */
export interface MultipleChoiceContent {
    /** Discriminant for exercise content union */
    type: 'multiple-choice';
    /** The question prompt */
    question: string;
    /** Array of answer options */
    options: string[];
    /** Index of the correct option in the options array */
    correctIndex: number;
}

/**
 * Matching exercise content.
 * User matches items from left column to right column.
 */
export interface MatchingContent {
    /** Discriminant for exercise content union */
    type: 'matching';
    /** Pairs to be matched, presented as separate left/right lists */
    pairs: { left: string; right: string }[];
}

/**
 * Sentence builder exercise content.
 * User constructs sentences from word columns.
 */
export interface SentenceBuilderContent {
    /** Discriminant for exercise content union */
    type: 'sentence-builder';
    /** Word columns with labels */
    columns: {
        /** Column label (e.g., "Subject", "Verb", "Object") */
        label: string;
        /** Words available in this column */
        words: string[];
    }[];
    /** Target sentences that can be constructed */
    targetSentences: string[];
}

/**
 * Sorting/categorization exercise content.
 * User sorts items into categories.
 */
export interface SortingContent {
    /** Discriminant for exercise content union */
    type: 'sorting';
    /** Categories with their correct items */
    categories: { label: string; items: string[] }[];
}

/**
 * Free writing exercise content.
 * User writes text based on a prompt with optional scaffolding.
 */
export interface WritingContent {
    /** Discriminant for exercise content union */
    type: 'writing';
    /** The writing prompt */
    prompt: string;
    /** Level of scaffolding provided */
    scaffoldLevel: string;
    /** Hints to help the user */
    scaffoldHints: string[];
    /** Starter words to begin the sentence */
    starterWords: string[];
    /** Minimum required length for the response */
    minLength: number;
    /** The correct sentence that must be formed (required for strict mode) */
    correctSentence?: string;
}

/**
 * Conjugation table exercise content.
 * User fills in verb conjugation forms.
 */
export interface ConjugationTableContent {
    /** Discriminant for exercise content union */
    type: 'conjugation-table';
    /** The verb to conjugate */
    verb: string;
    /** The tense for conjugation */
    tense: string;
    /** Table cells with person and form information */
    cells: {
        /** Person/pronoun (e.g., "ich", "du", "er/sie/es") */
        person: string;
        /** The correct conjugated form */
        correctForm: string;
        /** Whether this cell is pre-filled as a hint */
        prefilled: boolean;
    }[];
}

/**
 * Connector insertion exercise content.
 * User selects the correct connector to join sentence parts.
 */
export interface ConnectorInsertContent {
    /** Discriminant for exercise content union */
    type: 'connector-insert';
    /** First part of the sentence */
    sentencePart1: string;
    /** Second part of the sentence */
    sentencePart2: string;
    /** The correct connector word */
    correctConnector: string;
    /** Available connector options */
    options: string[];
}

/**
 * Word order exercise content.
 * User arranges scrambled words into correct order.
 */
export interface WordOrderContent {
    /** Discriminant for exercise content union */
    type: 'word-order';
    /** The words in correct order (primary solution) */
    correctOrder: string[];
    /** Additional valid word orders (alternate correct sentences) */
    alternateOrders?: string[][];
    /** The words in scrambled order */
    scrambled: string[];
}

/**
 * Picture vocabulary exercise content.
 * User identifies vocabulary from a picture prompt.
 */
export interface PictureVocabularyContent {
    /** Discriminant for exercise content union */
    type: 'picture-vocabulary';
    /** Emoji or unicode symbol used as the picture prompt */
    picture: string;
    /** Accessible description of the picture for screen readers */
    pictureAlt: string;
    /** The correct vocabulary word */
    correctAnswer: string;
    /** Additional acceptable answers (synonyms, etc.) */
    acceptableAnswers: string[];
    /** Distractor options for multiple-choice mode */
    options: string[];
}

/**
 * Discriminated union for all exercise content types.
 * The 'type' field determines which content shape is used.
 */
export type ExerciseContent =
    | FillBlankContent
    | MultipleChoiceContent
    | MatchingContent
    | SentenceBuilderContent
    | SortingContent
    | WritingContent
    | ConjugationTableContent
    | ConnectorInsertContent
    | WordOrderContent
    | PictureVocabularyContent;

// ============================================================================
// Exercise Definition
// ============================================================================

/**
 * Difficulty level for exercises.
 * 1 = Easy, 2 = Medium, 3 = Hard
 */
export type ExerciseDifficulty = 1 | 2 | 3;

/**
 * Complete exercise definition.
 * Represents a single exercise with all its metadata and content.
 */
export interface Exercise {
    /** Unique identifier for this exercise */
    id: string;
    /** Type of exercise, determines the content shape */
    type: ExerciseType;
    /** Reference to the observation/diagnostic area */
    areaId: ObservationAreaId;
    /** Reference to the content theme */
    themeId: ThemeId;
    /** Level within the observation area (1-based) */
    level: number;
    /** Difficulty rating (1-3) */
    difficulty: ExerciseDifficulty;
    /** Instruction text displayed to the user */
    instruction: string;
    /** Exercise-specific content (discriminated by type) */
    content: ExerciseContent;
    /** Array of hints available to the user */
    hints: string[];
    /** Feedback message shown on correct answer */
    feedbackCorrect: string;
    /** Feedback message shown on incorrect answer */
    feedbackIncorrect: string;
}

// ============================================================================
// Exercise Result
// ============================================================================

/**
 * Star rating type (1-3 stars).
 * Represents the quality of completion for an exercise.
 */
export type StarRating = 1 | 2 | 3;

/**
 * Recorded result of an exercise attempt.
 * Stored for progress tracking and analytics.
 */
export interface ExerciseResult {
    /** Unique identifier for this result record */
    id: string;
    /** Reference to the user/child profile */
    childProfileId: string;
    /** Reference to the exercise */
    exerciseId: string;
    /** Observation area this exercise belongs to */
    areaId: ObservationAreaId;
    /** Theme this exercise belongs to */
    themeId: ThemeId;
    /** Level of the exercise */
    level: number;
    /** Whether the answer was correct */
    correct: boolean;
    /** Star rating earned (0-3) */
    score: number;
    /** Number of attempts made */
    attempts: number;
    /** Time spent on the exercise in seconds */
    timeSpentSeconds: number;
    /** ISO 8601 timestamp when the exercise was completed */
    completedAt: string;
}
