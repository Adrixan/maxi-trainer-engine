import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hintButtonStyles } from '@core/utils/exerciseStyles';

interface HintButtonProps {
    hints: string[];
}

/**
 * Reusable hint/tip display: reveals hints one at a time via a 💡 button.
 * Accessible with keyboard navigation and screen reader support.
 */
export function HintButton({ hints }: HintButtonProps) {
    const { t } = useTranslation();
    const [hintIndex, setHintIndex] = useState(-1); // -1 = no hint shown

    if (hints.length === 0) return null;

    const showNextHint = () => {
        if (hintIndex < hints.length - 1) {
            setHintIndex((i) => i + 1);
        }
    };

    return (
        <div className="space-y-2">
            {hintIndex >= 0 && (
                <div
                    className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 animate-fadeIn"
                    role="status"
                    aria-live="polite"
                >
                    <p className="text-sm text-yellow-800 font-medium">
                        💡 {hints[hintIndex]}
                    </p>
                </div>
            )}
            {hintIndex < hints.length - 1 && (
                <button
                    onClick={showNextHint}
                    className={`${hintButtonStyles({ variant: hintIndex >= 0 ? 'active' : 'default' })} ${hintIndex >= 0 ? 'text-sm' : 'text-sm'}`}
                    aria-label={hintIndex >= 0
                        ? t('exercises.hintNext', { current: hintIndex + 1, total: hints.length })
                        : t('exercises.hintShow', { total: hints.length })
                    }
                >
                    💡 {t('exercises.hint')}{hintIndex >= 0 ? ` (${hintIndex + 2}/${hints.length})` : ''}
                </button>
            )}
        </div>
    );
}
