import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PinInput } from '../PinInput';

function Harness({ onComplete }: { onComplete?: (pin: string) => void }) {
    const [value, setValue] = useState('');
    return (
        <PinInput value={value} onChange={setValue} label="PIN" digitLabel="Digit" {...(onComplete ? { onComplete } : {})} />
    );
}

const boxes = () => screen.getByRole('group', { name: 'PIN' }).querySelectorAll('input');
const values = () => [...boxes()].map((box) => box.value);

describe('PinInput', () => {
    it('fills the boxes in order and reports completion once', () => {
        const onComplete = vi.fn();
        render(<Harness onComplete={onComplete} />);
        [...'1234'].forEach((digit, i) => fireEvent.change(boxes()[i] as HTMLInputElement, { target: { value: digit } }));
        expect(values()).toEqual(['1', '2', '3', '4']);
        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith('1234');
    });

    it('places a digit typed into a later empty box in the first empty box', () => {
        render(<Harness />);
        fireEvent.change(boxes()[2] as HTMLInputElement, { target: { value: '7' } });
        expect(values()).toEqual(['7', '', '', '']);
    });

    it('ignores non-digits', () => {
        render(<Harness />);
        fireEvent.change(boxes()[0] as HTMLInputElement, { target: { value: 'a' } });
        expect(values()).toEqual(['', '', '', '']);
    });

    it('removes the previous digit with Backspace on an empty box', async () => {
        render(<Harness />);
        fireEvent.change(boxes()[0] as HTMLInputElement, { target: { value: '1' } });
        fireEvent.change(boxes()[1] as HTMLInputElement, { target: { value: '2' } });
        fireEvent.keyDown(boxes()[2] as HTMLInputElement, { key: 'Backspace' });
        await act(async () => undefined);
        expect(values()).toEqual(['1', '', '', '']);
    });

    it('accepts a pasted PIN', () => {
        const onComplete = vi.fn();
        render(<Harness onComplete={onComplete} />);
        fireEvent.paste(boxes()[0] as HTMLInputElement, { clipboardData: { getData: () => '98 76' } });
        expect(values()).toEqual(['9', '8', '7', '6']);
        expect(onComplete).toHaveBeenCalledWith('9876');
    });
});
