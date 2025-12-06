import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

export function AccessDenied() {
  return (
    <div className="min-h-[600px] flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-lg">
        
        {/* Dekoratif Arka Plan Efektleri */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>

        <div className="relative bg-surface-0/80 dark:bg-surface-50/80 backdrop-blur-2xl border border-red-100 dark:border-red-900/30 p-12 rounded-3xl shadow-2xl text-center">
          
          {/* İkon Alanı */}
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-75"></div>
            <div className="relative p-6 bg-red-50 dark:bg-red-900/20 rounded-full border-2 border-red-100 dark:border-red-800">
              <ShieldAlert className="w-16 h-16 text-red-600 dark:text-red-500" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 bg-surface-0 dark:bg-surface-50 rounded-full border border-surface-200 dark:border-surface-200 shadow-sm">
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Metin Alanı */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            Erişim Kısıtlandı
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed mb-8">
            Bu alana giriş yapmak için gerekli yetkiye sahip değilsiniz. Lütfen yöneticinizle iletişime geçin.
          </p>

          {/* Aksiyon Butonu */}
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 rounded-xl font-semibold hover:transform hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
            Geri Dön
          </button>
          
        </div>
      </div>
    </div>
  );
}