/**
 * Tests for the teacher PIN flow and the teacher route guard.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { TeacherPinPage } from '../TeacherPinPage';
import { requireTeacher } from '@core/router';
import { useAppStore } from '@core/stores';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (_key: string, options?: string | { defaultValue?: string; count?: number }) => {
            if (typeof options === 'string' || options === undefined) return options ?? _key;
            return (options.defaultValue ?? _key).replace('{{count}}', String(options.count));
        },
    }),
}));

const EMPTY_AUTH = { pinHash: '', pinSalt: '', failedAttempts: 0, lockedUntil: 0 };

function renderApp(initialPath: string) {
    const router = createMemoryRouter(
        [
            { path: '/teacher/pin', element: <TeacherPinPage /> },
            { path: '/teacher/dashboard', loader: requireTeacher, element: <h1>Dashboard</h1> },
            { path: '/', element: <h1>Home</h1> },
        ],
        { initialEntries: [initialPath] },
    );
    render(<RouterProvider router={router} />);
    return router;
}

/** Type a PIN into the four boxes of the PIN group with the given accessible name. */
function typePin(groupName: string, pin: string) {
    const group = screen.getByRole('group', { name: groupName });
    const boxes = group.querySelectorAll('input');
    [...pin].forEach((digit, i) => fireEvent.change(boxes[i] as HTMLInputElement, { target: { value: digit } }));
}

beforeEach(() => {
    useAppStore.setState({ teacherAuth: EMPTY_AUTH, teacherAuthenticated: false });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('teacher route guard', () => {
    it('redirects to the PIN page when the dashboard is opened directly', async () => {
        const router = renderApp('/teacher/dashboard');
        await screen.findByRole('heading', { name: 'Create PIN' });
        expect(router.state.location.pathname).toBe('/teacher/pin');
        expect(screen.queryByText('Dashboard')).toBeNull();
    });

    it('lets an unlocked session through', async () => {
        useAppStore.setState({ teacherAuthenticated: true });
        renderApp('/teacher/dashboard');
        await screen.findByRole('heading', { name: 'Dashboard' });
    });
});

describe('PIN setup', () => {
    it('creates the PIN and opens the dashboard', async () => {
        renderApp('/teacher/pin');
        typePin('New PIN input', '2468');
        typePin('Confirm PIN input', '2468');

        await screen.findByRole('heading', { name: 'Dashboard' });
        expect(useAppStore.getState().teacherAuth.pinHash).not.toBe('');
        expect(useAppStore.getState().verifyPin('2468')).toEqual({ status: 'ok' });
    });

    it('rejects a mismatching confirmation', async () => {
        renderApp('/teacher/pin');
        typePin('New PIN input', '2468');
        typePin('Confirm PIN input', '1357');

        expect((await screen.findByRole('alert')).textContent).toContain('PINs do not match');
        expect(useAppStore.getState().teacherAuth.pinHash).toBe('');
    });
});

describe('PIN login', () => {
    beforeEach(() => {
        act(() => {
            useAppStore.getState().setTeacherPin('2468');
            useAppStore.getState().logoutTeacher();
        });
    });

    it('opens the dashboard with the right PIN', async () => {
        renderApp('/teacher/pin');
        typePin('PIN input', '2468');
        await screen.findByRole('heading', { name: 'Dashboard' });
    });

    it('shows the remaining attempts after a wrong PIN and clears the boxes', async () => {
        renderApp('/teacher/pin');
        typePin('PIN input', '0000');

        expect((await screen.findByRole('alert')).textContent).toContain('Attempts left: 4');
        const boxes = screen.getByRole('group', { name: 'PIN input' }).querySelectorAll('input');
        expect([...boxes].every((box) => box.value === '')).toBe(true);
    });

    it('blocks further input after too many wrong attempts', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderApp('/teacher/pin');
        for (let i = 0; i < 5; i++) typePin('PIN input', '0000');

        const alert = await screen.findByRole('alert');
        expect(alert.textContent).toMatch(/Try again in \d+ s/);
        const boxes = screen.getByRole('group', { name: 'PIN input' }).querySelectorAll('input');
        expect([...boxes].every((box) => box.disabled)).toBe(true);
    });

    it('accepts a pasted PIN', async () => {
        renderApp('/teacher/pin');
        const first = screen.getByRole('group', { name: 'PIN input' }).querySelector('input') as HTMLInputElement;
        fireEvent.paste(first, { clipboardData: { getData: () => '2468' } });
        await screen.findByRole('heading', { name: 'Dashboard' });
    });
});
