import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface CustomAlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  autoCloseDelay?: number; // ms
}

const typeMap = {
  info: {
    icon: Info,
    className: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-950 dark:border-primary-800 dark:text-primary-300',
  },
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-300',
  },
  error: {
    icon: AlertTriangle,
    className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300',
  },
};

export function CustomAlert({ type, message, onClose, autoCloseDelay }: CustomAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { icon: Icon, className } = typeMap[type];

  useEffect(() => {
    if (autoCloseDelay) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`flex items-center p-4 border rounded-lg shadow-sm transition-opacity duration-300 ${className}`}
      role="alert"
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <div className="text-sm font-medium flex-1">{message}</div>
      {onClose && (
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className={`ml-4 p-1 rounded-full hover:bg-opacity-50 transition-colors`}
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}