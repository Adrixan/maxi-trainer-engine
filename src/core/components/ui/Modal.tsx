/**
 * Reusable Modal component for dialogs and overlays.
 * 
 * Provides accessible modal dialogs with focus trapping,
 * keyboard navigation, and animation support.
 */

import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from '@core/hooks/useFocusTrap';

// ============================================================================
// Types
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when modal should close */
    onClose: () => void;
    /** Modal title */
    title?: string;
    /** Modal size */
    size?: ModalSize;
    /** Whether to show close button */
    showCloseButton?: boolean;
    /** Whether clicking overlay closes modal */
    closeOnOverlayClick?: boolean;
    /** Whether pressing Escape closes modal */
    closeOnEscape?: boolean;
    /** Children content */
    children: React.ReactNode;
    /** Additional className for modal content */
    className?: string;
    /** Aria label for accessibility */
    ariaLabel?: string;
}

export interface ModalFooterProps {
    /** Children content */
    children: React.ReactNode;
    /** Additional className */
    className?: string;
}

// ============================================================================
// Style Variants
// ============================================================================

const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw] max-h-[90vh]',
};

// ============================================================================
// Component
// ============================================================================

/**
 * Modal dialog component with accessibility features.
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <ModalFooter>
 *     <Button intent="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
 *     <Button intent="primary" onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 */
export function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    children,
    className = '',
    ariaLabel,
}: ModalProps) {
    const { t } = useTranslation();
    const modalRef = useFocusTrap<HTMLDivElement>({ active: isOpen });
    const previousActiveElement = useRef<HTMLElement | null>(null);

    // Store the previously focused element and restore it on close
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            // Focus the modal container
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        } else {
            // Restore focus to the previously focused element
            previousActiveElement.current?.focus();
        }
    }, [isOpen]);

    // Handle Escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') {
                onClose();
            }
        },
        [closeOnEscape, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            aria-label={ariaLabel}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
                onClick={handleOverlayClick}
                aria-hidden="true"
            />

            {/* Modal content */}
            <div
                ref={modalRef}
                tabIndex={-1}
                className={`relative w-full ${sizeStyles[size]} bg-white rounded-2xl shadow-xl animate-scaleIn ${className}`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        {title && (
                            <h2
                                id="modal-title"
                                className="text-lg font-bold text-gray-900"
                            >
                                {title}
                            </h2>
                        )}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label={t('common.close')}
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="p-4">{children}</div>
            </div>
        </div>
    );

    // Render in a portal
    return createPortal(modalContent, document.body);
}

/**
 * Modal footer for action buttons.
 */
export function ModalFooter({ children, className = '' }: ModalFooterProps) {
    return (
        <div
            className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100 ${className}`}
        >
            {children}
        </div>
    );
}
