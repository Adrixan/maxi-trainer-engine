/**
 * Router configuration for the Mini Trainer Engine.
 * 
 * Uses HashRouter for file:// protocol compatibility.
 * When the app is opened as a local file, HashRouter works
 * because it doesn't require server-side URL rewriting.
 */

import { createHashRouter, type RouteObject } from 'react-router-dom';
import { Layout } from '@core/components/layout';

/**
 * Route definitions for the application.
 * These routes map to the main pages of the trainer.
 * All routes are wrapped in the Layout component which provides
 * the persistent GameHeader with gamification stats.
 */
export const routes: RouteObject[] = [
    {
        element: <Layout />,
        children: [
            {
                path: '/',
                lazy: () => import('@/pages/HomePage').then((m) => ({ Component: m.HomePage })),
            },
            {
                path: '/themes',
                lazy: () => import('@/pages/ThemeSelectPage').then((m) => ({ Component: m.ThemeSelectPage })),
            },
            {
                path: '/themes/:themeId/levels',
                lazy: () => import('@/pages/LevelSelectPage').then((m) => ({ Component: m.LevelSelectPage })),
            },
            {
                path: '/exercise/:themeId',
                lazy: () => import('@/pages/ExercisePage').then((m) => ({ Component: m.ExercisePage })),
            },
            {
                path: '/exercise/:themeId/level/:level',
                lazy: () => import('@/pages/ExercisePage').then((m) => ({ Component: m.ExercisePage })),
            },
            {
                path: '/exercise/:themeId/:areaId',
                lazy: () => import('@/pages/ExercisePage').then((m) => ({ Component: m.ExercisePage })),
            },
            {
                path: '/profile',
                lazy: () => import('@/pages/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
            },
            {
                path: '/progress',
                lazy: () => import('@/pages/ProgressPage').then((m) => ({ Component: m.ProgressPage })),
            },
            {
                path: '/settings',
                lazy: () => import('@/pages/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
            },
            {
                path: '/results',
                lazy: () => import('@/pages/ResultsPage').then((m) => ({ Component: m.ResultsPage })),
            },
            {
                path: '/badges',
                lazy: () => import('@/pages/BadgeGalleryPage').then((m) => ({ Component: m.BadgeGalleryPage })),
            },
            {
                path: '/daily-challenge',
                lazy: () => import('@/pages/DailyChallengePage').then((m) => ({ Component: m.DailyChallengePage })),
            },
            {
                path: '/teacher/pin',
                lazy: () => import('@/pages/TeacherPinPage').then((m) => ({ Component: m.TeacherPinPage })),
            },
            {
                path: '/teacher/dashboard',
                lazy: () => import('@/pages/TeacherDashboardPage').then((m) => ({ Component: m.TeacherDashboardPage })),
            },
        ],
    },
];

/**
 * Create and configure the hash router.
 * 
 * HashRouter is used instead of BrowserRouter for file:// protocol
 * compatibility. When opened as a local file, the URL hash is the only
 * part that works without a server.
 */
export function createRouter() {
    return createHashRouter(routes);
}

/**
 * Navigation utility functions.
 */

/**
 * Route path definitions for type-safe navigation.
 */
export const ROUTES = {
    HOME: '/',
    THEMES: '/themes',
    LEVEL_SELECT: (themeId: string) => `/themes/${themeId}/levels`,
    EXERCISE: (themeId: string) => `/exercise/${themeId}`,
    EXERCISE_WITH_LEVEL: (themeId: string, level: number) => `/exercise/${themeId}/level/${level}`,
    EXERCISE_WITH_AREA: (themeId: string, areaId: string) => `/exercise/${themeId}/${areaId}`,
    PROFILE: '/profile',
    PROGRESS: '/progress',
    SETTINGS: '/settings',
    RESULTS: '/results',
    BADGES: '/badges',
    DAILY_CHALLENGE: '/daily-challenge',
    TEACHER_PIN: '/teacher/pin',
    TEACHER_DASHBOARD: '/teacher/dashboard',
} as const;

/**
 * Type for valid route paths.
 */
export type AppRoute = typeof ROUTES[keyof typeof ROUTES] | string;

/**
 * Check if a path matches a route pattern.
 * 
 * @param pattern - Route pattern (e.g., '/exercise/:themeId')
 * @param path - Current path to check
 * @returns Whether the path matches the pattern
 */
export function matchesRoute(pattern: string, path: string): boolean {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
        return false;
    }

    return patternParts.every((part, index) => {
        return part.startsWith(':') || part === pathParts[index];
    });
}

/**
 * Extract parameters from a path based on a pattern.
 * 
 * @param pattern - Route pattern (e.g., '/exercise/:themeId/:areaId')
 * @param path - Current path to extract from
 * @returns Object with extracted parameters, or null if no match
 */
export function extractParams<T extends Record<string, string>>(
    pattern: string,
    path: string
): T | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
        return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];

        if (patternPart === undefined || pathPart === undefined) {
            return null;
        }

        if (patternPart.startsWith(':')) {
            const paramName = patternPart.slice(1);
            params[paramName] = pathPart;
        } else if (patternPart !== pathPart) {
            return null;
        }
    }

    return params as T;
}

// Re-export router components for convenience
export { HashRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
