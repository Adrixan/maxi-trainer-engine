/**
 * Main application component for the Mini Trainer Engine.
 * 
 * This component is kept for reference but routing is now handled
 * by the router configuration in @core/router.
 * 
 * The app uses HashRouter for file:// protocol compatibility.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@core/stores';
import { SkipToContent } from '@core/components/accessibility';

/**
 * App component that sets up global application state.
 * 
 * Handles:
 * - Syncing accessibility settings to DOM attributes
 * - Setting up document direction for i18n
 * - Providing skip-to-content link for keyboard navigation
 */
function App() {
    const { i18n } = useTranslation();
    const fontSize = useAppStore((s) => s.settings.fontSize);
    const highContrast = useAppStore((s) => s.settings.highContrastMode);
    const animationsEnabled = useAppStore((s) => s.settings.animationsEnabled);

    // Sync data-attributes on <html> so global CSS can respond
    useEffect(() => {
        document.documentElement.setAttribute('data-font-size', fontSize);
    }, [fontSize]);

    useEffect(() => {
        document.documentElement.toggleAttribute('data-high-contrast', highContrast);
    }, [highContrast]);

    useEffect(() => {
        document.documentElement.toggleAttribute('data-reduce-motion', !animationsEnabled);
    }, [animationsEnabled]);

    // Set document direction based on locale
    useEffect(() => {
        const dir = i18n.dir(i18n.language);
        document.documentElement.setAttribute('dir', dir);
    }, [i18n, i18n.language]);

    // This component provides accessibility wrappers but doesn't render main content
    // Routing is handled by the router in @core/router
    // LiveRegionProvider is now in the Layout component
    return <SkipToContent />;
}

export default App;
