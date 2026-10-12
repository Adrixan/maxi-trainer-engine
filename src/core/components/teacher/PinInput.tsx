/**
 * Four-box PIN entry.
 *
 * Controlled by a plain string of digits. Typing advances to the next box,
 * Backspace steps back, and pasting a full PIN fills all boxes.
 */

import { useImperativeHandle, useRef, type ClipboardEvent, type KeyboardEvent, type Ref } from 'react';

export const PIN_LENGTH = 4;

export interface PinInputHandle {
    /** Focus the first empty box (or the last one when full). */
    focus: () => void;
}

interface PinInputProps {
    value: string;
    onChange: (value: string) => void;
    /** Accessible name of the whole group, e.g. "New PIN". */
    label: string;
    /** Prefix for the per-digit accessible names, e.g. "Digit". */
    digitLabel: string;
    disabled?: boolean;
    /** Called once when the last digit has been entered. */
    onComplete?: (pin: string) => void;
    ref?: Ref<PinInputHandle>;
}

export function PinInput({ value, onChange, label, digitLabel, disabled = false, onComplete, ref }: PinInputProps) {
    const inputs = useRef<(HTMLInputElement | null)[]>([]);

    const focusBox = (index: number) => {
        // Wait for the controlled value to render before moving focus.
        setTimeout(() => inputs.current[Math.max(0, Math.min(index, PIN_LENGTH - 1))]?.focus(), 0);
    };

    useImperativeHandle(ref, () => ({
        focus: () => focusBox(Math.min(value.length, PIN_LENGTH - 1)),
    }));

    const update = (next: string) => {
        onChange(next);
        if (next.length === PIN_LENGTH && value.length < PIN_LENGTH) onComplete?.(next);
    };

    const handleChange = (index: number, raw: string) => {
        const digit = raw.replace(/\D/g, '').slice(-1);
        if (digit === '') return;
        const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(0, PIN_LENGTH);
        update(next);
        focusBox(index + 1);
    };

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Backspace') {
            event.preventDefault();
            if (value[index] !== undefined) {
                onChange(value.slice(0, index) + value.slice(index + 1));
                focusBox(index);
            } else {
                onChange(value.slice(0, Math.max(0, index - 1)));
                focusBox(index - 1);
            }
        } else if (event.key === 'ArrowLeft') {
            focusBox(index - 1);
        } else if (event.key === 'ArrowRight') {
            focusBox(index + 1);
        }
    };

    const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
        const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
        if (digits === '') return;
        event.preventDefault();
        update(digits);
        focusBox(digits.length);
    };

    return (
        <div className="flex justify-center gap-3" role="group" aria-label={label}>
            {Array.from({ length: PIN_LENGTH }, (_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputs.current[index] = el;
                    }}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={value[index] ?? ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100"
                    aria-label={`${digitLabel} ${index + 1}`}
                    autoComplete="off"
                />
            ))}
        </div>
    );
}
