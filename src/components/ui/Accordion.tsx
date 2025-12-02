import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import React from 'react';

interface AccordionItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export const AccordionItem = ({ title, children, isOpen, onToggle }: AccordionItemProps) => {
  return (
    <div className="border-b border-surface-200 dark:border-surface-100">
      <button
        className="flex justify-between items-center w-full py-4 px-5 text-left font-semibold text-gray-900 dark:text-gray-100 bg-surface-0 dark:bg-surface-50 hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-lg w-full">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300`}
        style={{ 
            maxHeight: isOpen ? '2000px' : '0', 
            opacity: isOpen ? '1' : '0' 
        }}
      >
        <div className="px-5 pb-4 bg-surface-50 dark:bg-surface-100">{children}</div>
      </div>
    </div>
  );
};

interface AccordionProps {
  children: React.ReactElement<typeof AccordionItem>[] | React.ReactElement<typeof AccordionItem>;
  initialIndex?: number;
}

export function Accordion({ children, initialIndex = 0 }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(initialIndex);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-100 overflow-hidden shadow-sm">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen: openIndex === index,
            onToggle: () => handleToggle(index),
          });
        }
        return child;
      })}
    </div>
  );
}