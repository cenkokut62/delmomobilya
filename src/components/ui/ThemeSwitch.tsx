import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
        theme === 'dark' ? 'bg-surface-200' : 'bg-surface-200'
      }`}
      aria-label="Tema Değiştir"
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === 'dark' 
            ? 'translate-x-7 bg-surface-0 text-gray-900' 
            : 'translate-x-0 bg-white text-yellow-500'
        }`}
      >
        {theme === 'dark' ? (
          <Moon className="w-3 h-3" />
        ) : (
          <Sun className="w-3 h-3" />
        )}
      </div>
    </button>
  );
}