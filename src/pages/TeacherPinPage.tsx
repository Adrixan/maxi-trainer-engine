/**
 * Teacher PIN entry page.
 * 
 * Allows teachers to enter their PIN to access the teacher dashboard.
 * PIN is verified against the stored teacher PIN in localStorage.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { getStorageItem, setStorageItem } from '@core/storage/localStorage';

/**
 * Teacher PIN page component.
 */
export function TeacherPinPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSettingPin, setIsSettingPin] = useState(false);
    const [newPin, setNewPin] = useState<string[]>(['', '', '', '']);
    const [confirmPin, setConfirmPin] = useState<string[]>(['', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
    const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Check if PIN is already set
    useEffect(() => {
        const storedPin = getStorageItem('app:teacherPin');
        setIsSettingPin(!storedPin);
    }, []);

    // Focus first input on mount - conditional based on mode
    useEffect(() => {
        if (isSettingPin) {
            // Focus first new PIN input when setting up
            newPinRefs.current[0]?.focus();
        } else {
            // Focus first login PIN input when logging in
            inputRefs.current[0]?.focus();
        }
    }, [isSettingPin]);

    /**
     * Handle PIN digit input.
     */
    const handlePinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPinArray = [...pin];
        newPinArray[index] = value.slice(-1);
        setPin(newPinArray);
        setError(null);

        // Move to next input - use setTimeout to ensure state update completes
        if (newPinArray[index] && index < 3) {
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 0);
        }

        // Auto-submit when 4 digits entered
        if (newPinArray.every((d) => d) && !isSettingPin) {
            handleSubmit(newPinArray.join(''));
        }
    };

    /**
     * Handle new PIN setup change.
     * Auto-advances within the 4 digits, and jumps to confirm field when all 4 digits entered.
     */
    const handleNewPinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newPinArray = [...newPin];
        newPinArray[index] = value.slice(-1);
        setNewPin(newPinArray);
        setError(null);

        // Auto-advance within the 4 digits - use setTimeout to ensure state update completes
        if (newPinArray[index] && index < 3) {
            setTimeout(() => {
                newPinRefs.current[index + 1]?.focus();
            }, 0);
        }

        // Auto-jump to confirm field when 4 digits entered
        if (newPinArray.every((d) => d)) {
            setTimeout(() => {
                confirmPinRefs.current[0]?.focus();
            }, 0);
        }
    };

    /**
     * Handle confirm PIN change.
     * Auto-advances within the 4 digits.
     */
    const handleConfirmPinChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const confirmPinArray = [...confirmPin];
        confirmPinArray[index] = value.slice(-1);
        setConfirmPin(confirmPinArray);
        setError(null);

        // Auto-advance within the 4 digits - use setTimeout to ensure state update completes
        if (confirmPinArray[index] && index < 3) {
            setTimeout(() => {
                confirmPinRefs.current[index + 1]?.focus();
            }, 0);
        }

        // Auto-submit when 4 digits entered
        if (confirmPinArray.every((d) => d) && isSettingPin) {
            handleSetupPin(confirmPinArray.join(''));
        }
    };

    /**
     * Handle key press for navigation in login PIN.
     */
    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Backspace' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    /**
     * Handle key press for navigation in new PIN.
     */
    const handleNewPinKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Backspace' && index > 0) {
            newPinRefs.current[index - 1]?.focus();
        }
    };

    /**
     * Handle key press for navigation in confirm PIN.
     */
    const handleConfirmPinKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (e.key === 'Backspace' && index > 0) {
            confirmPinRefs.current[index - 1]?.focus();
        }
    };

    /**
     * Verify the entered PIN.
     */
    const handleSubmit = async (enteredPin: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const storedPin = getStorageItem('app:teacherPin');

            if (storedPin === enteredPin) {
                navigate(ROUTES.TEACHER_DASHBOARD);
            } else {
                setError(t('teacher.wrongPin', 'Incorrect PIN. Please try again.'));
                setPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Set up a new PIN.
     */
    const handleSetupPin = async (confirmedPin: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // First check if new PIN matches
            const enteredNewPin = newPin.join('');
            const confirmed = confirmedPin;

            if (enteredNewPin !== confirmed) {
                setError(t('teacher.pinMismatch', 'PINs do not match. Please try again.'));
                setNewPin(['', '', '', '']);
                setConfirmPin(['', '', '', '']);
                inputRefs.current[0]?.focus();
                return;
            }

            // Validate PIN length
            if (enteredNewPin.length !== 4) {
                setError(t('teacher.pinLength', 'PIN must be 4 digits.'));
                return;
            }

            // Save the PIN
            setStorageItem('app:teacherPin', enteredNewPin);
            setStorageItem('app:teacherPinEnabled', true);

            // Navigate to dashboard
            navigate(ROUTES.TEACHER_DASHBOARD);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Render PIN input digits for login.
     */
    const renderPinInputs = (
        value: string[],
        onChange: (index: number, value: string) => void,
        disabled: boolean
    ) => {
        return (
            <div className="flex justify-center gap-3" role="group" aria-label={t('teacher.pinInput', 'PIN input')}>
                {value.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            inputRefs.current[index] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => onChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={disabled}
                        className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label={`${t('common.digit', 'Digit')} ${index + 1}`}
                        autoComplete="one-time-code"
                    />
                ))}
            </div>
        );
    };

    /**
     * Render PIN input digits for setup (new PIN).
     */
    const renderNewPinInputs = (
        value: string[],
        onChange: (index: number, value: string) => void,
        disabled: boolean
    ) => {
        return (
            <div className="flex justify-center gap-3" role="group" aria-label={t('teacher.newPinInput', 'New PIN input')}>
                {value.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            newPinRefs.current[index] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => onChange(index, e.target.value)}
                        onKeyDown={(e) => handleNewPinKeyDown(index, e)}
                        disabled={disabled}
                        className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label={`${t('common.digit', 'Digit')} ${index + 1}`}
                        autoComplete="one-time-code"
                    />
                ))}
            </div>
        );
    };

    /**
     * Render PIN input digits for setup (confirm PIN).
     */
    const renderConfirmPinInputs = (
        value: string[],
        onChange: (index: number, value: string) => void,
        disabled: boolean
    ) => {
        return (
            <div className="flex justify-center gap-3" role="group" aria-label={t('teacher.confirmPinInput', 'Confirm PIN input')}>
                {value.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => {
                            confirmPinRefs.current[index] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => onChange(index, e.target.value)}
                        onKeyDown={(e) => handleConfirmPinKeyDown(index, e)}
                        disabled={disabled}
                        className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        aria-label={`${t('common.digit', 'Digit')} ${index + 1}`}
                        autoComplete="one-time-code"
                    />
                ))}
            </div>
        );
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[80vh] p-4"
            role="main"
            aria-labelledby="teacher-title"
        >
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block" role="img" aria-label={t('teacher.teacher', 'Teacher')}>
                        👩‍🏫
                    </span>
                    <h1 id="teacher-title" className="text-2xl font-bold text-gray-900 mb-2">
                        {isSettingPin ? t('teacher.pinSetup', 'Create PIN') : t('teacher.pinTitle', 'Teacher Login')}
                    </h1>
                    <p className="text-gray-600">
                        {isSettingPin
                            ? t('teacher.pinSetupHint', 'Create a 4-digit PIN to protect the teacher area')
                            : t('teacher.pinSubtitle', 'Enter your PIN to access the teacher area')}
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                        role="alert"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">⚠️</span>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {/* PIN Entry Form */}
                {!isSettingPin ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(pin.join(''));
                        }}
                        className="space-y-6"
                    >
                        {renderPinInputs(pin, handlePinChange, isLoading)}

                        <button
                            type="submit"
                            disabled={!pin.every((d) => d) || isLoading}
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? t('common.loading', 'Loading...') : t('teacher.login', 'Login')}
                        </button>
                    </form>
                ) : (
                    /* PIN Setup Form */
                    <div className="space-y-8">
                        {/* New PIN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                {t('teacher.newPin', 'Enter new PIN')}
                            </label>
                            {renderNewPinInputs(newPin, handleNewPinChange, isLoading)}
                        </div>

                        {/* Confirm PIN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                {t('teacher.confirmPin', 'Confirm PIN')}
                            </label>
                            {renderConfirmPinInputs(confirmPin, handleConfirmPinChange, isLoading)}
                        </div>
                    </div>
                )}

                {/* Back to Home */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(ROUTES.HOME)}
                        className="text-gray-600 hover:text-gray-900 underline underline-offset-4"
                    >
                        {t('common.backHome', 'Back to Home')}
                    </button>
                </div>
            </div>
        </div>
    );
}
