import { X } from 'lucide-react';
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-full sm:w-80',
  md: 'w-full sm:w-[400px]',
  lg: 'w-full sm:w-[500px] lg:w-[600px]',
};

export function CustomDrawer({ isOpen, onClose, title, children, side = 'right', size = 'lg' }: CustomDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    
    // Body scroll kilidi
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ESC tuşu desteği
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const drawerClasses = `fixed top-0 bottom-0 h-full bg-surface-0 dark:bg-surface-50 shadow-2xl z-[9999] transition-transform duration-300 ease-out transform ${sizeMap[size]} ${
    side === 'right' ? 'right-0' : 'left-0'
  } ${
    isOpen
      ? (side === 'right' ? 'translate-x-0' : 'translate-x-0')
      : (side === 'right' ? 'translate-x-full' : '-translate-x-full')
  }`;

  const overlayClasses = `fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 z-[9998] ${
    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
  }`;

  // Portal ile body'ye render et
  return createPortal(
    <>
      {/* Overlay */}
      <div className={overlayClasses} onClick={onClose} aria-hidden="true" />
      
      {/* Drawer */}
      <div ref={drawerRef} className={drawerClasses} role="dialog" aria-modal="true">
        <div className="flex flex-col h-full border-l border-surface-200 dark:border-surface-100">
          {/* Header */}
          <div className="sticky top-0 bg-surface-0/95 dark:bg-surface-50/95 backdrop-blur border-b border-surface-200 dark:border-surface-100 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-surface-100 dark:text-gray-400 dark:hover:bg-surface-100 rounded-lg transition-colors"
              aria-label="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
            {children}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}