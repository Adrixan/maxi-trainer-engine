/**
 * Accessibility Settings Component.
 * 
 * Provides UI controls for accessibility features including:
 * - High contrast mode toggle
 * - Font size selector
 * - Animation toggle
 * - Screen reader mode toggle
 * 
 * Follows WCAG 2.1 AA guidelines for accessible controls.
 */

import { useTranslation } from 'react-i18next';
import { useAppStore, type FontSize } from '@core/stores';

/**
 * Font size options for the selector.
 */
const FONT_SIZE_OPTIONS: { value: FontSize; labelKey: string }[] = [
    { value: 'normal', labelKey: 'accessibility.fontSizeNormal' },
    { value: 'large', labelKey: 'accessibility.fontSizeLarge' },
    { value: 'extra-large', labelKey: 'accessibility.fontSizeExtraLarge' },
];

/**
 * Toggle switch component for accessibility settings.
 */
function ToggleSwitch({
    id,
    label,
    description,
    checked,
    onChange,
}: {
    id: string;
    label: string;
    description?: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
            <div className="flex-1 mr-4">
                <label
                    htmlFor={id}
                    className="font-medium text-gray-900 cursor-pointer"
                >
                    {label}
                </label>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>
            <button
                type="button"
                role="switch"
                id={id}
                aria-checked={checked}
                onClick={onChange}
                className={`
                    relative inline-flex h-7 w-12 items-center rounded-full
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                    ${checked ? 'bg-primary-600' : 'bg-gray-300'}
                `}
            >
                <span className="sr-only">{label}</span>
                <span
                    className={`
                        inline-block h-5 w-5 transform rounded-full bg-white shadow
                        transition-transform duration-200 ease-in-out
                        ${checked ? 'translate-x-6' : 'translate-x-1'}
                    `}
                />
            </button>
        </div>
    );
}

/**
 * Radio group component for font size selection.
 */
function FontSizeSelector({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: FontSize;
    options: typeof FONT_SIZE_OPTIONS;
    onChange: (size: FontSize) => void;
}) {
    const { t } = useTranslation();

    return (
        <fieldset className="py-4 border-b border-gray-200 last:border-b-0">
            <legend className="font-medium text-gray-900 mb-3">{label}</legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={`
                            px-4 py-2 rounded-lg font-medium
                            transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
                            ${value === option.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                        `}
                    >
                        {t(option.labelKey, option.value)}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

/**
 * Accessibility Settings component.
 * 
 * Provides a comprehensive UI for managing accessibility preferences.
 * All controls are keyboard accessible and properly labeled.
 */
export function AccessibilitySettings() {
    const { t } = useTranslation();
    const settings = useAppStore((s) => s.settings);
    const {
        toggleHighContrast,
        toggleAnimations,
        setFontSize,
    } = useAppStore();

    return (
        <div
            className="bg-white rounded-xl shadow-md p-6"
            role="region"
            aria-labelledby="accessibility-settings-title"
        >
            <h2
                id="accessibility-settings-title"
                className="text-xl font-bold text-gray-900 mb-4"
            >
                {t('accessibility.title', 'Accessibility Settings')}
            </h2>

            <div className="space-y-0">
                {/* High Contrast Mode */}
                <ToggleSwitch
                    id="high-contrast-toggle"
                    label={t('accessibility.highContrast', 'High Contrast Mode')}
                    description={t(
                        'accessibility.highContrastDesc',
                        'Increases contrast for better visibility'
                    )}
                    checked={settings.highContrastMode}
                    onChange={toggleHighContrast}
                />

                {/* Font Size */}
                <FontSizeSelector
                    label={t('accessibility.fontSize', 'Font Size')}
                    value={settings.fontSize}
                    options={FONT_SIZE_OPTIONS}
                    onChange={setFontSize}
                />

                {/* Animations Toggle */}
                <ToggleSwitch
                    id="animations-toggle"
                    label={t('accessibility.animations', 'Animations')}
                    description={t(
                        'accessibility.animationsDesc',
                        'Enable or disable animations (respects system preference)'
                    )}
                    checked={settings.animationsEnabled}
                    onChange={toggleAnimations}
                />

                {/* Sound Toggle */}
                <ToggleSwitch
                    id="sound-toggle"
                    label={t('accessibility.sound', 'Sound Effects')}
                    description={t(
                        'accessibility.soundDesc',
                        'Enable or disable sound effects'
                    )}
                    checked={settings.soundEnabled}
                    onChange={() => useAppStore.getState().toggleSound()}
                />
            </div>

            {/* Screen Reader Notice */}
            <div
                className="mt-6 p-4 bg-blue-50 rounded-lg"
                role="note"
                aria-label={t('accessibility.screenReaderNote', 'Screen Reader Information')}
            >
                <p className="text-sm text-blue-800">
                    {t(
                        'accessibility.screenReaderInfo',
                        'This application is designed to be accessible with screen readers. ' +
                        'Use Tab to navigate between controls and Enter or Space to activate buttons.'
                    )}
                </p>
            </div>
        </div>
    );
}

export default AccessibilitySettings;
