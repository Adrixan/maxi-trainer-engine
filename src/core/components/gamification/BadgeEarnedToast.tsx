/**
 * Badge Earned Toast component.
 * 
 * Toast notification for displaying newly earned badges.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@core/stores/appStore';
import { playBadge } from '@core/utils/sounds';
import type { Badge } from '@/types/profile';

interface BadgeEarnedToastProps {
    /** The badge that was earned */
    badge: Badge;
    /** Callback when toast is dismissed */
    onDismiss: () => void;
    /** Auto-dismiss duration in milliseconds */
    duration?: number;
}

/**
 * Toast notification for new badge achievements.
 * Auto-dismisses after specified duration or on click.
 */
export function BadgeEarnedToast({
    badge,
    onDismiss,
    duration = 4000
}: BadgeEarnedToastProps) {
    const { t } = useTranslation();
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Trigger entrance animation after mount
    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Play badge sound on mount
    useEffect(() => {
        const soundEnabled = useAppStore.getState().settings.soundEnabled;
        playBadge(soundEnabled);
    }, []);

    // Auto-dismiss
    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration]);

    // Announce to screen readers
    useEffect(() => {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = t('gamification.newBadge', { defaultValue: `Erfolg freigeschaltet: ${badge.name}! ${badge.description}` });
        document.body.appendChild(announcement);

        return () => {
            document.body.removeChild(announcement);
        };
    }, [badge, t]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss();
        }, 300);
    };

    return (
        <div
            className={`
                fixed bottom-4 right-4 z-50 max-w-sm
                transform transition-all duration-300 ease-out
                ${isVisible && !isExiting
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-4 opacity-0'
                }
            `}
            role="alert"
            aria-label={`Badge earned: ${badge.name}`}
        >
            <div
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 flex items-center gap-3 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={handleDismiss}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleDismiss();
                    }
                }}
                tabIndex={0}
            >
                {/* Badge Icon */}
                <div
                    className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl animate-badgePop"
                    aria-hidden="true"
                >
                    {badge.icon}
                </div>

                {/* Badge Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">
                            {t('gamification.badgeEarned', 'Abzeichen verdient!')}
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 truncate">
                        {badge.name}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                        {badge.description}
                    </p>
                </div>

                {/* Close button */}
                <button
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss();
                    }}
                    aria-label={t('common.close', 'Schließen')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Progress bar for auto-dismiss */}
            <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-shrink"
                    style={{ animationDuration: `${duration}ms` }}
                />
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes badgePop {
                    0% { transform: scale(0); }
                    50% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                
                .animate-badgePop {
                    animation: badgePop 0.5s ease-out;
                }
                
                .animate-shrink {
                    animation: shrink linear forwards;
                }
                
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }
            `}</style>
        </div>
    );
}

export default BadgeEarnedToast;
