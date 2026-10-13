/**
 * Teacher PIN page.
 *
 * Creates the teacher PIN on first use and asks for it afterwards. The PIN is a
 * classroom lock that keeps children out of the teacher area. It is checked in
 * the browser and is therefore not a security boundary (see appStore.ts).
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@core/router';
import { useAppStore, selectHasTeacherPin } from '@core/stores';
import { PinInput, PIN_LENGTH, type PinInputHandle } from '@core/components/teacher/PinInput';

/** Remaining whole seconds until `lockedUntil`, re-evaluated every second. */
function useLockCountdown(lockedUntil: number): number {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        if (lockedUntil <= Date.now()) return;
        setNow(Date.now());
        const timer = setInterval(() => {
            setNow(Date.now());
            if (Date.now() >= lockedUntil) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [lockedUntil]);

    return Math.max(0, Math.ceil((lockedUntil - now) / 1000));
}

export function TeacherPinPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const hasPin = useAppStore(selectHasTeacherPin);
    const lockedUntil = useAppStore((s) => s.teacherAuth.lockedUntil);
    const verifyPin = useAppStore((s) => s.verifyPin);
    const setTeacherPin = useAppStore((s) => s.setTeacherPin);
    const lockSeconds = useLockCountdown(lockedUntil);

    // The page shows the setup form only if no PIN existed when it opened.
    const [isSetup] = useState(!hasPin);
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState<string | null>(null);

    const loginRef = useRef<PinInputHandle>(null);
    const newRef = useRef<PinInputHandle>(null);
    const confirmRef = useRef<PinInputHandle>(null);

    useEffect(() => {
        (isSetup ? newRef : loginRef).current?.focus();
    }, [isSetup]);

    const isLocked = lockSeconds > 0;

    useEffect(() => {
        if (!isLocked) loginRef.current?.focus();
    }, [isLocked]);

    const handleLogin = (entered: string) => {
        const result = verifyPin(entered);
        if (result.status === 'ok') {
            navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
            return;
        }
        setPin('');
        if (result.status === 'locked') {
            setError(null);
        } else if (result.status === 'wrong') {
            setError(t('teacher.wrongPinAttempts', { count: result.attemptsLeft, defaultValue: 'Incorrect PIN. Attempts left: {{count}}' }));
            loginRef.current?.focus();
        } else {
            setError(t('teacher.wrongPin', 'Incorrect PIN. Please try again.'));
        }
    };

    const handleSetup = (confirmed: string) => {
        if (confirmed !== newPin) {
            setError(t('teacher.pinMismatch', 'PINs do not match. Please try again.'));
            setNewPin('');
            setConfirmPin('');
            newRef.current?.focus();
            return;
        }
        if (!setTeacherPin(confirmed)) {
            setError(t('teacher.pinLength', 'PIN must be 4 digits.'));
            return;
        }
        navigate(ROUTES.TEACHER_DASHBOARD, { replace: true });
    };

    const digitLabel = t('common.digit', 'Digit');

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[80vh] p-4"
            role="main"
            aria-labelledby="teacher-title"
        >
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <span className="text-6xl mb-4 block" role="img" aria-label={t('teacher.teacher', 'Teacher')}>
                        👩‍🏫
                    </span>
                    <h1 id="teacher-title" className="text-2xl font-bold text-gray-900 mb-2">
                        {isSetup ? t('teacher.pinSetup', 'Create PIN') : t('teacher.pinTitle', 'Teacher Login')}
                    </h1>
                    <p className="text-gray-600">
                        {isSetup
                            ? t('teacher.pinSetupHint', 'Create a 4-digit PIN to protect the teacher area')
                            : t('teacher.pinSubtitle', 'Enter your PIN to access the teacher area')}
                    </p>
                </div>

                {isLocked && !isSetup && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg" role="alert">
                        <span className="text-sm text-amber-800">
                            {t('teacher.locked', {
                                count: lockSeconds,
                                defaultValue: 'Too many wrong attempts. Try again in {{count}} s.',
                            })}
                        </span>
                    </div>
                )}

                {error && !isLocked && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                        <div className="flex items-center gap-2">
                            <span className="text-red-600">⚠️</span>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    </div>
                )}

                {isSetup ? (
                    <div className="space-y-8">
                        <div>
                            <p className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                {t('teacher.newPin', 'Enter new PIN')}
                            </p>
                            <PinInput
                                ref={newRef}
                                value={newPin}
                                onChange={(v) => { setNewPin(v); setError(null); }}
                                onComplete={() => confirmRef.current?.focus()}
                                label={t('teacher.newPinInput', 'New PIN input')}
                                digitLabel={digitLabel}
                            />
                        </div>
                        <div>
                            <p className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                {t('teacher.confirmPin', 'Confirm PIN')}
                            </p>
                            <PinInput
                                ref={confirmRef}
                                value={confirmPin}
                                onChange={(v) => { setConfirmPin(v); setError(null); }}
                                onComplete={handleSetup}
                                label={t('teacher.confirmPinInput', 'Confirm PIN input')}
                                digitLabel={digitLabel}
                                disabled={newPin.length < PIN_LENGTH}
                            />
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            {t('teacher.pinNotice', 'The PIN only keeps children out of this area. It is stored on this device and does not replace access control.')}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <PinInput
                            ref={loginRef}
                            value={pin}
                            onChange={(v) => { setPin(v); setError(null); }}
                            onComplete={handleLogin}
                            label={t('teacher.pinInput', 'PIN input')}
                            digitLabel={digitLabel}
                            disabled={isLocked}
                        />
                        <p className="text-xs text-gray-500 text-center">
                            {t('teacher.pinForgotten', 'Forgot the PIN? Clearing the browser data of this app removes it (and the saved progress).')}
                        </p>
                    </div>
                )}

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
