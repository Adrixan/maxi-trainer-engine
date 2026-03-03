/**
 * Level Up Celebration component.
 * 
 * Full-screen celebration overlay with CSS confetti for level-ups.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@core/hooks/useFocusTrap';

interface LevelUpCelebrationProps {
    /** The new level achieved */
    newLevel: number;
    /** Callback when celebration is complete */
    onDone: () => void;
    /** Auto-dismiss duration in milliseconds */
    duration?: number;
}

const CONFETTI_COLORS = [
    '#FF6B6B', '#FFE66D', '#4ECDC4', '#45B7D1',
    '#96CEB4', '#FF9FF3', '#F8B500', '#7BED9F',
    '#70A1FF', '#FF6348', '#A29BFE', '#FD79A8',
];

const LEVEL_EMOJI: Record<number, string> = {
    2: '🌟',
    3: '🚀',
    4: '👑',
    5: '💎',
    10: '🏆',
    20: '🎖️',
};

/**
 * Get emoji for a specific level.
 */
function getLevelEmoji(level: number): string {
    return LEVEL_EMOJI[level] ?? '⭐';
}

/**
 * Get title for a level.
 */
function getLevelTitle(level: number, t: (key: string, defaultValue: string) => string): string {
    if (level >= 20) return t('levelTitles.grandMaster', 'Großmeister');
    if (level >= 15) return t('levelTitles.expert', 'Experte');
    if (level >= 10) return t('levelTitles.champion', 'Champion');
    if (level >= 5) return t('levelTitles.achiever', 'Achiever');
    if (level >= 3) return t('levelTitles.risingStar', 'Aufsteigender Stern');
    return t('levelTitles.beginner', 'Anfänger');
}

/**
 * Full-screen celebration overlay with CSS confetti for level-ups.
 * Auto-dismisses after specified duration or on tap.
 */
export function LevelUpCelebration({
    newLevel,
    onDone,
    duration = 4500
}: LevelUpCelebrationProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(true);
    const dialogRef = useFocusTrap<HTMLDivElement>();

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onDone();
        }, duration);
        return () => clearTimeout(timer);
    }, [onDone, duration]);

    useEffect(() => {
        // Announce to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = t('gamification.newLevel', { level: newLevel, defaultValue: `Glückwunsch! Du hast Level ${newLevel} erreicht!` });
        document.body.appendChild(announcement);

        return () => {
            document.body.removeChild(announcement);
        };
    }, [newLevel, t]);

    if (!visible) return null;

    // Generate confetti particles with randomized properties
    const confettiPieces = Array.from({ length: 40 }, (_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length] ?? CONFETTI_COLORS[0];
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const animDuration = 2 + Math.random() * 2;
        const size = 6 + Math.random() * 6;
        const rotation = Math.random() * 360;
        const isCircle = i % 3 === 0;

        return (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    position: 'absolute',
                    left: `${left}%`,
                    top: '-12px',
                    width: `${size}px`,
                    height: isCircle ? `${size}px` : `${size * 0.4}px`,
                    backgroundColor: color,
                    borderRadius: isCircle ? '50%' : '2px',
                    transform: `rotate(${rotation}deg)`,
                    animation: `confettiFall ${animDuration}s ease-in ${delay}s forwards`,
                    opacity: 0,
                }}
            />
        );
    });

    const emoji = getLevelEmoji(newLevel);
    const title = getLevelTitle(newLevel, t);

    const handleClick = () => {
        setVisible(false);
        onDone();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setVisible(false);
            onDone();
        }
    };

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={`Level up celebration: Level ${newLevel}`}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50 animate-fadeIn" />

            {/* Confetti layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {confettiPieces}
            </div>

            {/* Card */}
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-xs w-full text-center animate-bounceIn z-10">
                {/* Pulsing glow ring */}
                <div className="absolute inset-0 rounded-3xl animate-levelGlow pointer-events-none" />

                <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">
                    {t('gamification.levelUp', 'Level-Up!')}
                </p>

                {/* Big emoji */}
                <div className="text-7xl my-3 animate-levelEmoji" aria-hidden="true">
                    {emoji}
                </div>

                {/* Level number */}
                <div className="text-5xl font-black text-gray-800 mb-1">
                    {t('theme.levelLabel', { level: newLevel, defaultValue: `Level ${newLevel}` })}
                </div>

                {/* Title */}
                <div className="text-lg font-bold text-primary mb-3">
                    {title}
                </div>

                {/* Stars decoration */}
                <div className="flex justify-center gap-1 mb-4" aria-hidden="true">
                    {Array.from({ length: Math.min(newLevel, 10) }, (_, i) => (
                        <span
                            key={i}
                            className="text-2xl"
                            style={{ animation: `starPop 0.5s ease-out ${0.3 + i * 0.15}s both` }}
                        >
                            ⭐
                        </span>
                    ))}
                </div>

                <p className="text-sm text-gray-600 font-medium">
                    {t('gamification.continue', 'Tippe zum Fortfahren')}
                </p>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes bounceIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                @keyframes confettiFall {
                    0% { 
                        transform: translateY(0) rotate(0deg); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(100vh) rotate(720deg); 
                        opacity: 0; 
                    }
                }
                
                @keyframes levelGlow {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); 
                    }
                    50% { 
                        box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); 
                    }
                }
                
                @keyframes levelEmoji {
                    0% { transform: scale(0) rotate(-180deg); }
                    50% { transform: scale(1.2) rotate(10deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                
                @keyframes starPop {
                    0% { transform: scale(0); opacity: 0; }
                    50% { transform: scale(1.3); }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-bounceIn {
                    animation: bounceIn 0.6s ease-out;
                }
                
                .animate-levelGlow {
                    animation: levelGlow 2s ease-in-out infinite;
                }
                
                .animate-levelEmoji {
                    animation: levelEmoji 0.8s ease-out;
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

export default LevelUpCelebration;
