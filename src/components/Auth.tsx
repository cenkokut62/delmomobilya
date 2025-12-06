import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Lock } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: any) {
      setError('Giriş başarısız. Bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-0 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-surface-200 dark:border-surface-100 relative overflow-hidden">
        
        {/* Dekoratif Arka Plan */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-500 to-blue-600"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center justify-center mb-8 relative z-10">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-2xl mb-4">
            <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Yönetim Paneli</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
            Devam etmek için lütfen giriş yapın
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
              E-posta Adresi
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none dark:text-white"
              placeholder="ornek@sirket.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
              Şifre
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3.5 rounded-xl font-semibold hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Giriş Yapılıyor...'
            ) : (
              <>
                <LogIn className="w-5 h-5" /> Giriş Yap
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © 2025 Delmo Mobilya CRM. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </div>
  );
}