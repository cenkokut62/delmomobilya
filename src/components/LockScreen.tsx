import { useState, useEffect } from 'react';
import { useLock } from '../contexts/LockContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Lock, ArrowRight, Loader2, User } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function LockScreen() {
  const { unlockScreen } = useLock();
  const { user } = useAuth();
  const { settings } = useSettings();
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
        });
    }
  }, [user]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await unlockScreen(password);
    
    if (error) {
      setError('Şifre yanlış.');
      setLoading(false);
    }
    // Başarılı olursa LockContext otomatik olarak ekranı kapatacak
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl transition-all duration-500">
      {/* Arka Plan Görseli (Blur) */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=2600&auto=format&fit=crop')` }}
      ></div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md">
          
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white/10">
             <Lock className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Oturum Kilitlendi</h2>
          <p className="text-gray-300 text-sm mb-8">Devam etmek için şifrenizi girin</p>

          <div className="flex items-center justify-center gap-3 mb-8 bg-black/20 p-3 rounded-xl border border-white/5">
             <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                {userName ? userName.charAt(0).toUpperCase() : <User className="w-5 h-5"/>}
             </div>
             <div className="text-left">
                 <p className="text-white font-semibold text-sm">{userName || 'Kullanıcı'}</p>
                 <p className="text-gray-400 text-xs">{user?.email}</p>
             </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3.5 bg-black/30 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-widest"
                  placeholder="••••••••"
                  autoFocus
                />
            </div>

            {error && <p className="text-red-400 text-sm bg-red-900/20 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-primary-900 rounded-xl font-bold hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kilidi Aç <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
          
          <div className="mt-6 text-xs text-gray-500">
            {settings?.company_name || 'Delmo Mobilya'} <br></br>Güvenlik Sistemi
          </div>
          <div className="mt-6 text-xs text-gray-500">
            Design & Powered By: Cera Dijital & Yazılım Hizmetleri
          </div>
        </div>
      </div>
    </div>
  );
}