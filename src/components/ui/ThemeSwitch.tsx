import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Cloud, Star } from 'lucide-react';

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative group w-20 h-10 rounded-full p-1 cursor-pointer transition-all duration-500 ease-in-out shadow-inner overflow-hidden border
        ${isDark 
          ? 'bg-slate-900 border-slate-700 shadow-slate-900/50' 
          : 'bg-sky-400 border-sky-300 shadow-sky-400/50'
        }
      `}
      aria-label="Tema Değiştir"
    >
      {/* --- ARKA PLAN EFEKTLERİ --- */}
      
      {/* Yıldızlar (Sadece Dark Modda görünür) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-100' : 'opacity-0'}`}>
        <Star className="absolute top-2 left-2 w-2 h-2 text-white fill-white opacity-80 animate-pulse" />
        <Star className="absolute bottom-2 left-5 w-1.5 h-1.5 text-white fill-white opacity-60" />
        <Star className="absolute top-3 left-8 w-1 h-1 text-white fill-white opacity-70" />
        {/* Kayan yıldız efekti */}
        <div className="absolute top-2 left-10 w-8 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rotate-[-45deg] opacity-40"></div>
      </div>

      {/* Bulutlar (Sadece Light Modda görünür) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'opacity-0' : 'opacity-100'}`}>
        <Cloud className="absolute top-1 right-2 w-4 h-4 text-white fill-white opacity-80 animate-bounce duration-[3000ms]" />
        <Cloud className="absolute bottom-0 right-6 w-5 h-5 text-white fill-white opacity-60 translate-y-1" />
        <Cloud className="absolute top-2 right-10 w-3 h-3 text-white fill-white opacity-70" />
      </div>

      {/* --- HAREKETLİ KNOB (GÜNEŞ / AY) --- */}
      <div
        className={`
          relative w-8 h-8 rounded-full shadow-md transform transition-all duration-500 ease-spring
          flex items-center justify-center
          ${isDark 
            ? 'translate-x-10 bg-slate-100 rotate-0' 
            : 'translate-x-0 bg-yellow-300 rotate-180'
          }
        `}
        style={{
            // Gölge ve Parlama Efektleri
            boxShadow: isDark 
                ? 'inset -3px -2px 5px -2px rgba(0,0,0,0.3), 0 0 10px 2px rgba(255,255,255,0.1)' // Ay Krateri ve Parıltısı
                : 'inset -2px -2px 6px -2px rgba(245, 158, 11, 0.5), 0 0 15px 2px rgba(253, 224, 71, 0.6)' // Güneş Parıltısı
        }}
      >
        {/* İkon Geçişleri */}
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Ay İkonu */}
            <Moon 
                className={`
                    absolute w-5 h-5 text-slate-600 transition-all duration-500
                    ${isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 rotate-90'}
                `} 
                fill="currentColor"
            />
            {/* Güneş İkonu */}
            <Sun 
                className={`
                    absolute w-5 h-5 text-orange-500 transition-all duration-500
                    ${isDark ? 'opacity-0 scale-50 -rotate-90' : 'opacity-100 scale-100 rotate-0'}
                `} 
                // fill="currentColor" // İçi dolu olmasın, daha şık duruyor
            />
        </div>
      </div>
    </button>
  );
}