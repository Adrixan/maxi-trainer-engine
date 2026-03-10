/**
 * Profile-related constants for the Mini Trainer Engine.
 * 
 * Contains configuration values used by profile creation and management.
 */

/**
 * Available avatar emojis for profile creation.
 * Neutral options (no cute animals).
 */
export const AVATAR_EMOJIS = [
    '⭐', // Star
    '🔷', // Diamond
    '🔶', // Orange diamond
    '🟢', // Green circle
    '🔵', // Blue circle
    '🟣', // Purple circle
    '📚', // Books
    '✏️', // Pencil
    '🎓', // Graduation cap
    '🏅', // Medal
    '💡', // Light bulb
    '🔑', // Key
] as const;

/**
 * Maximum nickname length for user profiles.
 */
export const MAX_NICKNAME_LENGTH = 20;

export default {
    AVATAR_EMOJIS,
    MAX_NICKNAME_LENGTH,
};
