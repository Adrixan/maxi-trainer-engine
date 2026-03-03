/**
 * User profile type definitions for the Mini Trainer Engine.
 * 
 * This module defines user/child profiles, student profiles for teacher dashboards,
 * and related types for progress tracking.
 */

import type { ObservationAreaId, ThemeId } from './exercise';
import type { ThemeProgress } from './config';

// ============================================================================
// Badge Types
// ============================================================================

/**
 * Achievement badge earned by a user.
 */
export interface Badge {
    /** Unique identifier for this badge type */
    id: string;
    /** Display name */
    name: string;
    /** Description of how to earn this badge */
    description: string;
    /** Icon identifier (emoji or icon name) */
    icon: string;
    /** ISO 8601 timestamp when the badge was earned */
    earnedAt: string;
}

// ============================================================================
// User/Child Profile
// ============================================================================

/**
 * Progress tracking for an observation area.
 */
export interface AreaProgress {
    /** Current level in this area */
    currentLevel: number;
    /** Total stars earned in this area */
    starsEarned: number;
    /** Number of exercises completed in this area */
    exercisesCompleted: number;
}

/**
 * User/child profile for the learning application.
 * Stores progress, achievements, and preferences.
 */
export interface UserProfile {
    /** Unique identifier for this profile */
    id: string;
    /** Display nickname */
    nickname: string;
    /** Avatar identifier (emoji or avatar ID) */
    avatarId: string;
    /** ISO 8601 timestamp when profile was created */
    createdAt: string;
    /** Current level in each observation area */
    currentLevels: Record<ObservationAreaId, number>;
    /** Total stars earned across all exercises */
    totalStars: number;
    /** Current streak (consecutive days with activity) */
    currentStreak: number;
    /** Longest streak achieved */
    longestStreak: number;
    /** ISO 8601 date of last activity */
    lastActiveDate: string;
    /** Progress in each theme */
    themeProgress: Record<ThemeId, ThemeProgress>;
    /** Highest completed level per theme (1-4). Tracks which level user has finished per theme. */
    themeLevels?: Record<ThemeId, number>;
    /** Badges earned by this user */
    badges: Badge[];
}

/**
 * Legacy alias for UserProfile.
 * @deprecated Use UserProfile instead.
 */
export type ChildProfile = UserProfile;

// ============================================================================
// Student Profile (Teacher Dashboard)
// ============================================================================

/**
 * Support measure types for student profiles.
 */
export type SupportMeasure =
    | 'deutschfoerderklasse'
    | 'deutschfoerderkurs'
    | 'daz-foerderung'
    | 'sprachsensibler-unterricht'
    | 'keine';

/**
 * Student enrollment status.
 */
export type StudentStatus = 'ausserordentlich' | 'ordentlich';

/**
 * Student profile for teacher dashboard.
 * Contains detailed information for educational tracking.
 */
export interface StudentProfile {
    /** Unique identifier for this student */
    id: string;
    /** Student's full name */
    name: string;
    /** Date of birth (ISO 8601 date) */
    dateOfBirth?: string;
    /** Class name or identifier */
    className?: string;
    /** Student's first languages */
    firstLanguages: string[];
    /** Duration of German language instruction in months */
    contactDurationMonths: number;
    /** Enrollment status */
    status: StudentStatus;
    /** Current support measure */
    supportMeasure: SupportMeasure;
    /** Additional notes about the student */
    notes: string;
    /** ISO 8601 timestamp when profile was created */
    createdAt: string;
    /** ISO 8601 timestamp when profile was last updated */
    updatedAt: string;
}

// ============================================================================
// Foerderplan (Support Plan)
// ============================================================================

/**
 * Entry in a support plan (Foerderplan).
 * Defines goals and activities for one observation area.
 */
export interface FoerderplanEntry {
    /** Reference to the observation area */
    areaId: ObservationAreaId;
    /** Current level in this area */
    currentLevel: number;
    /** Target level to achieve */
    targetLevel: number;
    /** Goals for consolidating current skills */
    goalsConsolidate: string;
    /** Goals for preparing next level skills */
    goalsPrepare: string;
    /** Activities for integrative support */
    activitiesIntegrative: string;
    /** Activities for parallel support */
    activitiesParallel: string;
    /** Documentation notes */
    documentation: string;
}

/**
 * Support plan (Foerderplan) for a student.
 * Comprehensive plan for language development support.
 */
export interface Foerderplan {
    /** Unique identifier for this plan */
    id: string;
    /** Reference to the student */
    studentId: string;
    /** Time period this plan covers */
    period: string;
    /** Teachers involved in this plan */
    involvedTeachers: string[];
    /** Plan entries for each observation area */
    entries: FoerderplanEntry[];
    /** ISO 8601 timestamp when plan was created */
    createdAt: string;
    /** ISO 8601 timestamp when plan was last updated */
    updatedAt: string;
}

// ============================================================================
// Observation Records
// ============================================================================

/**
 * Time point for observations (e.g., start/middle/end of year).
 */
export type TimePoint = 't1' | 't2' | 't3';

/**
 * Rating scale for frequency observations.
 */
export type FrequencyRating = 'nie' | 'selten' | 'oft' | 'immer';

/**
 * Observation record for a single observation area.
 */
export interface AreaObservation {
    /** Reference to the observation area */
    areaId: ObservationAreaId;
    /** Achieved level in this area */
    achievedLevel: number;
    /** Notes for this observation */
    notes: string;
    /** Strategy checkboxes (for 'strategien' area) */
    strategyChecks?: Record<string, boolean>;
    /** Orthography ratings (for 'orthografie' area) */
    orthographyRatings?: Record<string, FrequencyRating>;
    /** Text type ratings (for 'textkompetenz' area) */
    textTypeRatings?: Record<string, number>;
    /** Productive skill level (for areas with productive/receptive distinction) */
    productiveLevel?: number;
    /** Receptive skill level (for areas with productive/receptive distinction) */
    receptiveLevel?: number;
}

/**
 * Complete observation record for a student at a time point.
 */
export interface ObservationRecord {
    /** Unique identifier for this record */
    id: string;
    /** Reference to the student */
    studentId: string;
    /** Time point of this observation */
    timePoint: TimePoint;
    /** Date of the observation (ISO 8601 date) */
    date: string;
    /** Observations for each area */
    observations: AreaObservation[];
    /** General notes for this observation session */
    notes: string;
    /** ISO 8601 timestamp when record was created */
    createdAt: string;
    /** ISO 8601 timestamp when record was last updated */
    updatedAt: string;
}
