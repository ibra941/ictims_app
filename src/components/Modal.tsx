import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div
      id="modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="modal-content"
        className={`bg-white rounded-2xl shadow-2xl border border-[#E9EBEF] w-full ${maxWidthClasses} overflow-hidden transform transition-all animate-in fade-in duration-200 my-auto max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-[#E9EBEF] flex items-center justify-between bg-white shrink-0">
          <h3 id="modal-headline" className="text-base sm:text-lg font-black tracking-tight text-[#1B3A5C] uppercase truncate pr-2">
            {title}
          </h3>
          <button
            id="modal-close-btn"
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F5F6F8] p-1.5 sm:p-2 rounded-xl transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto text-sm text-[#1A1A1A] flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-t border-[#E9EBEF] bg-[#F5F6F8] flex items-center justify-end gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
