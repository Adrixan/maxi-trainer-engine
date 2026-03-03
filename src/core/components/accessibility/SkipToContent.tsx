/**
 * Skip-to-Content Link Component.
 * 
 * Provides a hidden link that becomes visible on focus,
 * allowing keyboard users to skip navigation and jump
 * directly to the main content area.
 * 
 * Required for WCAG 2.1 AA compliance (Success Criterion 2.4.1).
 */

import { useTranslation } from 'react-i18next';

/**
 * Props for the SkipToContent component.
 */
interface SkipToContentProps {
    /** Target element ID to skip to (default: 'main-content') */
    targetId?: string;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Skip-to-Content link component.
 * 
 * Renders as a visually hidden link that becomes visible
 * when it receives keyboard focus. Clicking or activating
 * the link moves focus to the main content area.
 * 
 * @example
 * ```tsx
 * <SkipToContent />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipToContent({
    targetId = 'main-content',
    className = '',
}: SkipToContentProps) {
    const { t } = useTranslation();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            // Set tabindex to make the element focusable
            target.setAttribute('tabindex', '-1');
            target.focus();
            // Remove tabindex after blur to avoid adding it to the tab order
            target.addEventListener('blur', () => {
                target.removeAttribute('tabindex');
            }, { once: true });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const target = document.getElementById(targetId);
            if (target) {
                target.setAttribute('tabindex', '-1');
                target.focus();
                target.addEventListener('blur', () => {
                    target.removeAttribute('tabindex');
                }, { once: true });
            }
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            className={`
                skip-to-content
                sr-only focus:not-sr-only
                focus:absolute focus:top-4 focus:left-4 focus:z-50
                focus:px-4 focus:py-2
                focus:bg-primary-600 focus:text-white
                focus:rounded-lg focus:shadow-lg
                focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600
                transition-all duration-150
                ${className}
            `}
        >
            {t('accessibility.skipToContent', 'Skip to main content')}
        </a>
    );
}

export default SkipToContent;
