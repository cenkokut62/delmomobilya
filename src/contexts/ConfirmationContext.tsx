import React, { createContext, useContext, useState, useRef } from 'react';
import { CustomModal } from '../components/ui/CustomModal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: 'Onay Gerekli',
    message: '',
    confirmText: 'Evet, Onaylıyorum',
    cancelText: 'İptal',
    type: 'danger'
  });

  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: ConfirmationOptions): Promise<boolean> => {
    setOptions({
      title: opts.title || 'Onay Gerekli',
      message: opts.message,
      confirmText: opts.confirmText || 'Evet, Onaylıyorum',
      cancelText: opts.cancelText || 'İptal',
      type: opts.type || 'danger'
    });
    setIsOpen(true);

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  };

  const handleConfirm = () => {
    if (resolver.current) resolver.current(true);
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (resolver.current) resolver.current(false);
    setIsOpen(false);
  };

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      
      {/* Global Confirmation Modal */}
      <CustomModal
        isOpen={isOpen}
        onClose={handleCancel}
        title={options.title || 'Uyarı'}
        size="sm"
      >
        <div className="flex flex-col items-center text-center p-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            options.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 
            'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {options.message}
          </p>

          <div className="flex gap-3 w-full">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-surface-200 dark:border-surface-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
            >
              {options.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium transition-colors shadow-lg shadow-opacity-20 ${
                options.type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
                  : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30'
              }`}
            >
              {options.confirmText}
            </button>
          </div>
        </div>
      </CustomModal>
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (context === undefined) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}