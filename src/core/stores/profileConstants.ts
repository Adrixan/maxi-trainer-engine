/**
 * Profile-related constants for the Mini Trainer Engine.
 * 
 * Contains configuration values used by profile creation and management.
 */

/**
 * Available avatar emojis for profile creation (trainer.config.json).
 */
export const AVATAR_EMOJIS: readonly string[] = __TRAINER__.avatars;

/**
 * Maximum nickname length for user profiles.
 */
export const MAX_NICKNAME_LENGTH = 20;

export default {
    AVATAR_EMOJIS,
    MAX_NICKNAME_LENGTH,
};
