/**
 * Layout component.
 * 
 * Provides a consistent layout wrapper for all pages with the GameHeader.
 */

import { Outlet } from 'react-router-dom';
import { GameHeader } from './GameHeader';
import { LiveRegionProvider } from '@core/components/accessibility';

/**
 * Layout component that wraps all pages.
 * 
 * Includes:
 * - GameHeader with gamification stats and audio toggle
 * - Main content area with proper accessibility attributes
 * - Live region for screen reader announcements
 */
export function Layout() {
    return (
        <LiveRegionProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Persistent header */}
                <GameHeader />

                {/* Main content area */}
                <main
                    id="main-content"
                    className="flex-1 w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-6"
                    role="main"
                    tabIndex={-1}
                >
                    <Outlet />
                </main>
            </div>
        </LiveRegionProvider>
    );
}

export default Layout;
