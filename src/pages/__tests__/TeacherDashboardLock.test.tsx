/**
 * The teacher area locks when the dashboard is left, but not while React
 * StrictMode replays the mount effects in development.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TeacherDashboardPage } from '../TeacherDashboardPage';
import { useAppStore } from '@core/stores';

vi.mock('@core/storage', () => ({
    getAllProfiles: vi.fn().mockResolvedValue([]),
    deleteProfile: vi.fn().mockResolvedValue(undefined),
}));

const router = { future: { v7_startTransition: true, v7_relativeSplatPath: true } } as const;

beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.setState({ teacherAuthenticated: true });
});

describe('teacher dashboard lock', () => {
    it('stays unlocked while mounted, also under StrictMode', async () => {
        render(
            <StrictMode>
                <MemoryRouter {...router}>
                    <TeacherDashboardPage />
                </MemoryRouter>
            </StrictMode>,
        );
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(useAppStore.getState().teacherAuthenticated).toBe(true);
    });

    it('locks after the dashboard is left', async () => {
        const { unmount } = render(
            <MemoryRouter {...router}>
                <TeacherDashboardPage />
            </MemoryRouter>,
        );
        unmount();
        await act(async () => {
            await vi.runAllTimersAsync();
        });
        expect(useAppStore.getState().teacherAuthenticated).toBe(false);
    });
});
