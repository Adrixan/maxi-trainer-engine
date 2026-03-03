/**
 * Profile-related constants for the Mini Trainer Engine.
 * 
 * Contains configuration values used by profile creation and management.
 */

/**
 * Available avatar emojis for profile creation.
 */
export const AVATAR_EMOJIS = [
    '🦊', // Fox
    '🐻', // Bear
    '🐰', // Bunny
    '🦁', // Lion
    '🐸', // Frog
    '🐼', // Panda
    '🦄', // Unicorn
    '🐕', // Dog
    '🐱', // Cat
    '🐵', // Monkey
    '🦋', // Butterfly
    '🌟', // Star
] as const;

/**
 * Maximum nickname length for user profiles.
 */
export const MAX_NICKNAME_LENGTH = 20;

export default {
    AVATAR_EMOJIS,
    MAX_NICKNAME_LENGTH,
};
