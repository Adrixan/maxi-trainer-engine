/**
 * Store module exports for the Mini Trainer Engine.
 * 
 * Provides centralized exports for all Zustand stores.
 */

// Application settings store
export {
    useAppStore,
    selectLocale,
    selectTheme,
    selectFontSize,
    selectHighContrast,
    selectAnimationsEnabled,
    selectSoundEnabled,
    selectTeacherAuthenticated,
} from './appStore';

export type {
    AppSettings,
    AppState,
    FontSize,
} from './appStore';

// Profile store
export {
    useProfileStore,
    selectActiveProfile,
    selectNickname,
    selectAvatar,
    selectTotalStars,
    selectCurrentStreak,
    selectLongestStreak,
    selectBadges,
    selectThemeProgress,
    selectLevel,
    selectThemeLevels,
    selectThemeLevel,
    AVATAR_EMOJIS,
    MAX_NICKNAME_LENGTH,
} from './profileStore';

export type {
    ProfileState,
} from './profileStore';

// Profile persistence
export {
    SAVE_GAME_VERSION,
    validateSaveGame,
    exportSaveGame,
    downloadSaveGame,
    importSaveGame,
    parseSaveGameFile,
    syncProfileToIndexedDB,
} from './profilePersistence';

export type {
    SaveGamePayload,
    ImportResult,
} from './profilePersistence';

// Exercise session store
export {
    useExerciseStore,
    selectCurrentExercise,
    selectProgress,
    selectStats,
    selectResults,
    selectAnswer,
    selectIsSessionActive,
    selectCorrectRate,
    MAX_ATTEMPTS_PER_EXERCISE,
} from './exerciseStore';

export type {
    ExerciseAnswer,
    SessionStats,
    ExerciseSessionState,
    SubmitAnswerResult,
} from './exerciseStore';
