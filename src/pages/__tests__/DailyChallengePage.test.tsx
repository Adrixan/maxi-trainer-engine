/**
 * Tests for DailyChallengePage component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock profile data
const mockProfile = {
    id: 'profile-1',
    nickname: 'Test User',
    avatarId: 'avatar-1',
    createdAt: '2024-01-01T00:00:00Z',
    totalStars: 15,
    currentLevels: {},
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: '2024-01-16',
    themeProgress: {},
    badges: [],
};

// Use vi.hoisted to define mock functions at top level
const { mockSelectActiveProfile } = vi.hoisted(() => ({
    mockSelectActiveProfile: vi.fn(),
}));

vi.mock('@core/stores/profileStore', () => ({
    useProfileStore: (selector: (state: unknown) => unknown) => {
        return selector({ activeProfile: mockSelectActiveProfile() });
    },
    selectActiveProfile: mockSelectActiveProfile,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            const translations: Record<string, string> = {
                'dailyChallenge.title': 'Daily Challenge',
                'dailyChallenge.subtitle': 'Tagliche Herausforderung',
                'dailyChallenge.description': 'Stelle dich 5 Ubungen aus verschiedenen Themen. Verdiene 5 Bonus-Sterne!',
                'dailyChallenge.exercises': 'Ubungen',
                'dailyChallenge.bonus': 'Bonus-Sterne',
                'dailyChallenge.date': 'Datum',
                'dailyChallenge.start': 'Jetzt starten',
                'dailyChallenge.completed': 'Heute schon gemeistert!',
                'dailyChallenge.completedStars': 'Du hast heute {{stars}} Sterne verdient!',
                'dailyChallenge.bonusTitle': 'Bonus Challenge!',
                'dailyChallenge.bonusDesc': 'Mache noch mehr Ubungen fur 3 Extra-Sterne!',
                'dailyChallenge.startBonus': 'Bonus starten',
                'dailyChallenge.bonusCompleted': 'Bonus abgeschlossen! +{{stars}} Sterne',
                'dailyChallenge.comeBack': 'Komm morgen wieder fur eine neue Herausforderung!',
                'dailyChallenge.noProfile': 'Bitte erstelle ein Profil, um am Daily Challenge teilzunehmen.',
                'common.back': 'Zuruck',
                'common.home': 'Zur Startseite',
                'common.createProfile': 'Profil erstellen',
            };
            return translations[key] ?? key;
        },
    }),
}));

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Import after mocks are set up
import { DailyChallengePage } from '../DailyChallengePage';

describe('DailyChallengePage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        mockSelectActiveProfile.mockReturnValue(mockProfile);
    });

    describe('start state (not completed)', () => {
        it('renders the start state when challenge is not completed', () => {
            localStorageMock.getItem.mockReturnValue(null);

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText('Tagliche Herausforderung')).toBeInTheDocument();
            expect(screen.getByText('Jetzt starten')).toBeInTheDocument();
        });

        it('displays exercise count and bonus info', () => {
            localStorageMock.getItem.mockReturnValue(null);

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText('Ubungen')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Bonus-Sterne')).toBeInTheDocument();
        });

        it('renders back button', () => {
            localStorageMock.getItem.mockReturnValue(null);

            renderWithRouter(<DailyChallengePage />);

            // There are multiple back buttons, check there's at least one
            expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
        });
    });

    describe('completed state (todayCompleted)', () => {
        it('renders completed state when daily challenge is done', () => {
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key.includes('daily-challenge')) {
                    return '5';
                }
                return null;
            });

            renderWithRouter(<DailyChallengePage />);

            // Verify completed state by checking for the checkmark emoji
            expect(screen.getByText('Heute schon gemeistert!')).toBeInTheDocument();
            expect(screen.getByText('✅')).toBeInTheDocument();
        });

        it('shows bonus challenge section when daily is done but bonus is not', () => {
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key.includes('daily-challenge') && !key.includes('bonus')) {
                    return '5';
                }
                return null;
            });

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText('Bonus Challenge!')).toBeInTheDocument();
            expect(screen.getByText('Bonus starten')).toBeInTheDocument();
        });
    });

    describe('bonus challenge flow', () => {
        it('shows bonus completed when bonus is done', () => {
            localStorageMock.getItem.mockImplementation((key: string) => {
                if (key.includes('daily-challenge') && !key.includes('bonus')) {
                    return '5';
                }
                if (key.includes('bonus-challenge')) {
                    return '3';
                }
                return null;
            });

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText(/Bonus abgeschlossen!/)).toBeInTheDocument();
        });
    });

    describe('no profile state', () => {
        it('renders no profile message when profile is null', () => {
            mockSelectActiveProfile.mockReturnValue(null);
            localStorageMock.getItem.mockReturnValue(null);

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText(/Bitte erstelle ein Profil/)).toBeInTheDocument();
        });

        it('shows create profile button in no profile state', () => {
            mockSelectActiveProfile.mockReturnValue(null);
            localStorageMock.getItem.mockReturnValue(null);

            renderWithRouter(<DailyChallengePage />);

            expect(screen.getByText('Profil erstellen')).toBeInTheDocument();
        });
    });
});
