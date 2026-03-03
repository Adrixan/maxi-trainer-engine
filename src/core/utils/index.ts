/**
 * Utility module exports for the Mini Trainer Engine.
 * 
 * Provides centralized exports for all utility functions.
 */

// ID generation
export {
    generateId,
    generateShortId,
    generateProfileId,
    generateResultId,
    generateObservationId,
    generateFoerderplanId,
    isValidUuid,
    isValidId,
} from './id';

// Array shuffling
export {
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
} from './shuffle';

// Validation
export {
    validateTrainerConfig,
    validateExercises,
    validateExercise,
    isValidExerciseType,
    isValidDifficulty,
    isValidLocale,
} from './validation';

// Exercise utilities
export {
    // Answer validation
    validateFillBlankAnswer,
    validateMultipleChoiceAnswer,
    validateMatchingAnswer,
    validateSentenceBuilderAnswer,
    validateSortingAnswer,
    validateWritingAnswer,
    validateConjugationTableAnswer,
    validateConnectorInsertAnswer,
    validateWordOrderAnswer,
    validatePictureVocabularyAnswer,
    // Score calculation
    calculateStars,
    calculateTotalStars,
    calculateAccuracy,
    calculateProgress,
    // Utility functions
    countWords,
    shuffleArray,
    formatTime,
    getStarDisplay,
    isEmptyAnswer,
    normalizeText,
    textMatches,
    // Exercise data loading
    loadExercises,
    filterExercises,
    selectRandomExercises,
    groupExercises,
    getUniqueValues,
} from './exercise';

// Gamification utilities
export {
    getStarArray,
    calculateLevel,
    getStarsForNextLevel,
    getProgressPercentage,
    getLevelProgress,
    updateStreak,
    isStreakAtRisk,
    getStreakDisplay,
    checkBadge,
    checkBadgeById,
    formatOrdinal,
    getMotivationalMessage,
    calculateMaxStars,
    DEFAULT_STARS_PER_LEVEL,
    type StreakResult,
} from './gamification';

// Badge system
export {
    checkAllBadges,
    getBadgeProgress,
    getAllBadgesWithProgress,
    sortBadgesByType,
    getNextBadges,
    checkStarMilestone,
    checkStreakMilestone,
    checkLevelMilestone,
    checkThemeCompletion,
    checkAreaMastery,
    STAR_MILESTONE_BADGES,
    STREAK_MILESTONE_BADGES,
    LEVEL_MILESTONE_BADGES,
    DEFAULT_BADGES,
    type BadgeType,
    type BadgeDefinitionWithMeta,
} from './badges';

// Accessibility utilities
export {
    getFocusableElements,
    focusFirstFocusable,
    focusLastFocusable,
    trapFocus,
    saveFocus,
    restoreFocus,
    isFocusable,
    getNextFocusable,
    getPreviousFocusable,
    announceToScreenReader,
} from './accessibility';

// Sound effects
export {
    soundManager,
    playSound,
    playCorrect,
    playIncorrect,
    playLevelUp,
    playBadge,
    playStar,
    type SoundEffect,
    type SoundManager,
} from './sounds';

// CVA (Class Variance Authority) for variant styling
export {
    cva,
    type VariantProps,
    buttonVariants,
    type ButtonVariants,
    cardVariants,
    type CardVariants,
    badgeVariants,
    type BadgeVariants,
    inputVariants,
    type InputVariants,
    progressVariants,
    progressBarVariants,
    type ProgressVariants,
    type ProgressBarVariants,
} from './cva';

// Exercise styles
export {
    solutionStateStyles,
    feedbackStyles,
    optionStyles,
    inputFieldStyles,
    hintButtonStyles,
    getSolutionClasses,
    getFeedbackClasses,
    type SolutionState,
    type FeedbackType,
    type OptionVariant,
    type InputFieldState,
} from './exerciseStyles';
