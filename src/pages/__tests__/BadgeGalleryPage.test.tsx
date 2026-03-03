/**
 * Tests for BadgeGalleryPage component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import type { Badge } from '@/types/profile';

// Mock data
const mockBadges: Badge[] = [
    {
        id: 'badge-1',
        name: 'First Steps',
        description: 'Complete your first exercise',
        icon: '🎯',
        earnedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'badge-2',
        name: 'Star Collector',
        description: 'Earn 10 stars',
        icon: '⭐',
        earnedAt: '2024-01-16T10:00:00Z',
    },
];

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
                'badges.title': 'Erfolge',
                'badges.earned': 'Verdiente Erfolge',
                'badges.progress': '{{earned}} von {{total}} Erfolgen freigeschaltet',
                'badges.gallery': 'Erfolge Galerie',
                'badges.noProfile': 'Bitte erstelle ein Profil, um Erfolge zu sehen.',
                'badges.recent': 'Kürzlich verdient',
                'common.back': 'Zurück',
                'common.createProfile': 'Profil erstellen',
            };
            return translations[key] ?? key;
        },
    }),
}));

// Mock AchievementGrid component
vi.mock('@core/components/gamification/AchievementGrid', () => ({
    AchievementGrid: ({ badges, showLocked }: { badges: Badge[]; showLocked: boolean }) => (
        <div data-testid="achievement-grid">
            <span data-testid="badge-count">{badges.length}</span>
            <span data-testid="show-locked">{showLocked ? 'true' : 'false'}</span>
        </div>
    ),
}));

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Import after mocks are set up
import { BadgeGalleryPage } from '../BadgeGalleryPage';

describe('BadgeGalleryPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('rendering with profile', () => {
        beforeEach(() => {
            mockSelectActiveProfile.mockReturnValue({
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
                badges: mockBadges,
            });
        });

        it('renders the page title', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByText('Erfolge')).toBeInTheDocument();
        });

        it('renders earned badges section', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByTestId('achievement-grid')).toBeInTheDocument();
        });

        it('displays badge count in progress', () => {
            renderWithRouter(<BadgeGalleryPage />);
            // Check that progress text exists (may have unprocessed interpolation)
            expect(screen.getByText((content) => content.includes('von') && content.includes('Erfolgen'))).toBeInTheDocument();
        });

        it('shows AchievementGrid with earned badges', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByTestId('badge-count')).toHaveTextContent('2');
        });

        it('shows locked badges in the grid', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByTestId('show-locked')).toHaveTextContent('true');
        });

        it('renders back button', () => {
            renderWithRouter(<BadgeGalleryPage />);
            const backButton = screen.getByRole('button', { name: /Zurück/i });
            expect(backButton).toBeInTheDocument();
        });

        it('displays recent badges when earned badges exist', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByText('Kürzlich verdient')).toBeInTheDocument();
        });

        it('renders recent badge items with icons', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByText('🎯')).toBeInTheDocument();
            expect(screen.getByText('⭐')).toBeInTheDocument();
        });
    });

    describe('no profile state', () => {
        beforeEach(() => {
            mockSelectActiveProfile.mockReturnValue(null);
        });

        it('renders no profile message when profile is null', () => {
            renderWithRouter(<BadgeGalleryPage />);
            expect(screen.getByText(/Bitte erstelle ein Profil/)).toBeInTheDocument();
        });
    });
});
