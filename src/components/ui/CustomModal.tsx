import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function CustomModal({ isOpen, onClose, title, children, size = 'md' }: CustomModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false); // DOM'da render edilip edilmediğini kontrol eder
  const [isVisible, setIsVisible] = useState(false); // Görünürlük (Opaklık/Transform) durumunu kontrol eder

  useEffect(() => {
    setMounted(true);
  }, []);

  // Açılış ve Kapanış Animasyon Yönetimi
  useEffect(() => {
    if (isOpen) {
      setShowModal(true); // Önce DOM'a ekle
      // Browser'ın DOM'u boyaması için minik bir gecikme verip animasyonu başlat
      const timer = setTimeout(() => setIsVisible(true), 10);
      
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false); // Önce animasyonu kapat (fade-out)
      // Animasyon süresi (300ms) kadar bekle, sonra DOM'dan kaldır
      const timer = setTimeout(() => setShowModal(false), 300);
      
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted || !showModal) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop / Overlay - Fade Effect */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content - Zoom & Slide Effect */}
      <div
        className={`relative bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-2xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-100 transform transition-all duration-300 ease-out ${
          isVisible 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-4'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 bg-surface-0/80 dark:bg-surface-50/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-surface-100 dark:text-gray-400 dark:hover:bg-surface-100 rounded-lg transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}