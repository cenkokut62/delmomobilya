import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, Loader2, ArrowRight, Armchair, Sparkles, Check, User, X } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [savedUser, setSavedUser] = useState<{email: string, name?: string} | null>(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { settings } = useSettings();

  // Component yüklendiğinde "Beni Hatırla" kontrolü ve İsim Çekme
  useEffect(() => {
    const savedEmail = localStorage.getItem('cera_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      
      // Profil bilgisini çek
      const fetchProfileName = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('email', savedEmail)
            .single();
            
        if (data) {
            setSavedUser({
                email: savedEmail,
                name: `${data.first_name || ''} ${data.last_name || ''}`.trim()
            });
        } else {
            setSavedUser({ email: savedEmail });
        }
      };
      
      fetchProfileName();
    }
  }, []);

  // Farklı hesaba geçiş (Kayıtlı maili temizle)
  const handleSwitchAccount = () => {
    setSavedUser(null);
    setEmail('');
    setPassword('');
    setRememberMe(false);
    localStorage.removeItem('cera_remember_email');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;

      if (rememberMe) {
        localStorage.setItem('cera_remember_email', email);
      } else {
        localStorage.removeItem('cera_remember_email');
      }

    } catch (err: any) {
      setError('Giriş başarısız. Bilgilerinizi kontrol ediniz.');
    } finally {
      setLoading(false);
    }
  };

  // İsim baş harflerini al
  const getInitials = (name?: string) => {
      if (!name) return <User className="w-6 h-6" />;
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="min-h-screen flex w-full bg-surface-50 dark:bg-surface-0 transition-colors duration-500 font-sans">
      
      {/* SOL TARAF */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-900 items-center justify-center">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=2600&auto=format&fit=crop')`,
            filter: 'brightness(0.7) contrast(1.1)' 
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent z-10"></div>
        <div className="relative z-20 w-full max-w-lg p-12 mx-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="mb-8 transform group-hover:scale-105 transition-transform duration-500">
                {settings?.logo_url ? (
                    <img src={settings.logo_url} className="w-32 h-auto object-contain drop-shadow-2xl filter brightness-0 invert" alt="Logo" />
                ) : (
                    <Armchair className="w-24 h-24 text-white drop-shadow-lg" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
                {settings?.company_name || 'Delmo Mobilya'}
              </h1>
              <div className="h-1 w-20 bg-primary-500 rounded-full mb-6"></div>
              <p className="text-gray-200 text-lg leading-relaxed font-light">
                "Tasarım, üretim ve süreç yönetimini tek bir noktadan, <span className="font-semibold text-white">profesyonelce</span> yönetin."
              </p>
              <div className="mt-8 flex items-center gap-2 text-sm text-gray-400 bg-black/20 px-4 py-2 rounded-full border border-white/10">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Enterprise CRM Çözümleri</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-surface-0 dark:bg-surface-50 relative">
        <div className="w-full max-w-[420px] space-y-8 animate-fade-in relative z-10">
            
            <div className="lg:hidden text-center mb-8">
                <div className="flex justify-center mb-4">
                    {settings?.logo_url ? (
                        <img src={settings.logo_url} className="w-20 h-auto object-contain" alt="Logo" />
                    ) : (
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Armchair className="w-8 h-8 text-white" />
                        </div>
                    )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{settings?.company_name || 'Delmo Mobilya'}</h2>
            </div>

            <div className="text-center lg:text-left">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {savedUser ? `Tekrar Merhaba, ${savedUser.name?.split(' ')[0]}` : 'Hoş Geldiniz'}
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {savedUser ? 'Oturumunuza devam etmek için şifrenizi girin.' : 'Hesabınıza giriş yaparak yönetim paneline erişin.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                
                {savedUser ? (
                    // KAYITLI KULLANICI GÖRÜNÜMÜ (AVATARLI)
                    <div className="bg-surface-50 dark:bg-surface-100 p-5 rounded-2xl border border-surface-200 dark:border-surface-200 flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-2 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white dark:border-surface-100">
                                {getInitials(savedUser.name)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Hesap</span>
                                <span className="text-base font-bold text-gray-900 dark:text-white">{savedUser.name || savedUser.email}</span>
                                {savedUser.name && <span className="text-xs text-gray-400">{savedUser.email}</span>}
                            </div>
                        </div>
                        <button type="button" onClick={handleSwitchAccount} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all relative z-10" title="Farklı hesapla giriş yap">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    // STANDART EMAIL GİRİŞİ
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                                E-posta Adresi
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                                    placeholder="ad@sirket.com"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-5">
                    <div>
                        <div className="flex items-center justify-between mb-1.5 ml-1">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Şifre
                            </label>
                            {!savedUser && (
                                <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">Şifremi Unuttum?</a>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600 bg-transparent group-hover:border-primary-500'}`}>
                            {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">Beni Hatırla</span>
                    </label>
                    {savedUser && <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">Şifremi Unuttum?</a>}
                </div>

                {error && (
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></div>
                        {error}
                    </div>
                )}

                <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-xl shadow-primary-600/30 hover:shadow-primary-600/50 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden active:scale-95">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                    <span className="flex items-center gap-2 relative z-10">
                        {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Giriş Yapılıyor...</> : <><LogIn className="w-5 h-5" /> {savedUser ? 'Tekrar Giriş Yap' : 'Güvenli Giriş Yap'}</>}
                    </span>
                </button>
            </form>

            <div className="mt-12 pt-6 border-t border-surface-100 dark:border-surface-100/10 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-2">© 2025 {settings?.company_name || 'Delmo Mobilya'}. Tüm hakları saklıdır.</p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-600 font-semibold tracking-wide uppercase opacity-70 hover:opacity-100 transition-opacity cursor-default">
                    <span>Design & Development by</span>
                    <span className="text-primary-600 dark:text-primary-500">Cera Dijital ve Yazılım Hizmetleri</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}