import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { 
  LogIn, Mail, Lock, Loader2, Armchair, Sparkles, Check, User, X, 
  ArrowLeft, Send, KeyRound, ShieldCheck, Fingerprint, RefreshCw
} from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // GÜNCELLEME: OTP Kutucukları (8 Haneli)
  const [otpValues, setOtpValues] = useState(new Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [savedUser, setSavedUser] = useState<{email: string, name?: string} | null>(null);
  
  // Reset Akışı: 'none' | 'email' | 'otp' | 'new-password'
  const [resetStep, setResetStep] = useState<'none' | 'email' | 'otp' | 'new-password'>('none');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, sendOtp, verifyOtp, updateUserPassword } = useAuth();
  const { settings } = useSettings();

  useEffect(() => {
    // Reset akışını hatırla (Sayfa yenilenirse)
    const isResetFlow = localStorage.getItem('reset_flow') === 'true';
    const savedEmail = localStorage.getItem('reset_email');
    
    if (isResetFlow) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setResetStep('new-password');
            } else if (savedEmail) {
                setEmail(savedEmail);
                setResetStep('otp');
            }
        });
    }

    const rememberEmail = localStorage.getItem('cera_remember_email');
    if (rememberEmail && !isResetFlow) {
      setEmail(rememberEmail);
      setRememberMe(true);
      fetchProfileName(rememberEmail);
    }
  }, []);

  const fetchProfileName = async (emailAddr: string) => {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('email', emailAddr).single();
    if (data) {
        setSavedUser({ email: emailAddr, name: `${data.first_name || ''} ${data.last_name || ''}`.trim() });
    } else {
        setSavedUser({ email: emailAddr });
    }
  };

  const handleSwitchAccount = () => {
    setSavedUser(null);
    setEmail('');
    setPassword('');
    setRememberMe(false);
    localStorage.removeItem('cera_remember_email');
  };

  // --- OTP KUTUCUKLARI (8 HANELİ) ---
  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 7) inputRefs.current[index + 1]?.focus(); // 8 hane için index 7
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 8).split(''); // 8 hane kopyala
    if (pastedData.every(char => /^\d+$/.test(char))) {
        const newOtp = [...otpValues];
        pastedData.forEach((val, i) => { if (i < 8) newOtp[i] = val; });
        setOtpValues(newOtp);
        const nextIndex = Math.min(pastedData.length, 7);
        inputRefs.current[nextIndex]?.focus();
    }
  };

  // --- İŞLEMLER ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      if (rememberMe) localStorage.setItem('cera_remember_email', email);
      else localStorage.removeItem('cera_remember_email');
    } catch (err: any) {
      setError('Giriş başarısız. Bilgilerinizi kontrol ediniz.');
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Lütfen e-posta adresinizi girin.');
    setError(''); setLoading(true);
    try {
        const { error } = await sendOtp(email);
        if (error) throw error;
        localStorage.setItem('reset_flow', 'true');
        localStorage.setItem('reset_email', email);
        setResetStep('otp');
        setSuccessMsg(`Kod gönderildi: ${email}`);
        setOtpValues(new Array(8).fill('')); // Reset 8 boxes
    } catch (err: any) {
        setError('Kod gönderilemedi. E-posta adresinizi kontrol edin.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length !== 8) return setError('Lütfen 8 haneli kodu eksiksiz girin.'); // 8 hane kontrolü
    setError(''); setLoading(true);
    try {
        const { error } = await verifyOtp(email, code);
        if (error) throw error;
        setResetStep('new-password');
        setSuccessMsg('Kod doğrulandı. Yeni şifre zamanı!');
    } catch (err: any) {
        setError('Geçersiz veya süresi dolmuş kod.');
    } finally { setLoading(false); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('Şifre en az 6 karakter olmalıdır.');
    setError(''); setLoading(true);
    try {
        const { error } = await updateUserPassword(newPassword);
        if (error) throw error;
        localStorage.removeItem('reset_flow');
        localStorage.removeItem('reset_email');
        setSuccessMsg('Şifreniz güncellendi! Yönlendiriliyorsunuz...');
        setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
        setError('Şifre güncellenemedi: ' + err.message);
    } finally { setLoading(false); }
  };

  const getInitials = (name?: string) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : <User className="w-6 h-6" />;
  const cancelReset = () => { setResetStep('none'); setError(''); setSuccessMsg(''); localStorage.removeItem('reset_flow'); localStorage.removeItem('reset_email'); };

  // --- ADIM GÖSTERGESİ (PROGRESS BAR) ---
  const renderSteps = () => {
    const steps = [
      { id: 'email', icon: Mail, label: 'E-posta' },
      { id: 'otp', icon: KeyRound, label: 'Doğrulama' },
      { id: 'new-password', icon: ShieldCheck, label: 'Yeni Şifre' }
    ];
    const currentIndex = steps.findIndex(s => s.id === resetStep);

    return (
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-surface-0 dark:bg-surface-50 px-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isActive 
                  ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/30' 
                  : 'bg-white dark:bg-surface-100 border-gray-300 dark:border-gray-600 text-gray-400'
              }`}>
                <step.icon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex w-full bg-surface-50 dark:bg-surface-0 transition-colors duration-500 font-sans">
      
      {/* SOL TARAF (BANNER - ORİJİNAL TASARIM) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-slate-900 items-center justify-center">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-80"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=2600&auto=format&fit=crop')`, filter: 'brightness(0.7) contrast(1.1)' }}
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

      {/* SAĞ TARAF (FORM) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-surface-0 dark:bg-surface-50 relative">
        <div className="w-full max-w-[420px] space-y-6 animate-fade-in relative z-10">
            
            {/* MOBİL LOGO */}
            <div className="lg:hidden text-center mb-8">
                <div className="flex justify-center mb-4">
                    {settings?.logo_url ? <img src={settings.logo_url} className="w-20 h-auto object-contain" alt="Logo" /> : <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg"><Armchair className="w-8 h-8 text-white" /></div>}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{settings?.company_name || 'Delmo Mobilya'}</h2>
            </div>

            {/* ADIM GÖSTERGESİ (Sadece Reset Modunda) */}
            {resetStep !== 'none' && renderSteps()}

            {/* BAŞLIK ALANI */}
            <div className="text-center lg:text-left mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {resetStep === 'new-password' ? 'Güvenli Şifre' : 
                     resetStep === 'otp' ? 'Güvenlik Kontrolü' :
                     resetStep === 'email' ? 'Hesap Kurtarma' :
                     (savedUser ? `Tekrar Merhaba, ${savedUser.name?.split(' ')[0]}` : 'Hoş Geldiniz')}
                </h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {resetStep === 'new-password' ? 'Hesabınızı güvende tutmak için güçlü bir şifre seçin.' :
                     resetStep === 'otp' ? 'Kimliğinizi doğrulamak için kodu girin.' :
                     resetStep === 'email' ? 'Endişelenmeyin, size yardımcı olacağız.' :
                     'Yönetim paneline erişmek için giriş yapın.'}
                </p>
            </div>

            {/* FORM CONTAINER */}
            <div className="relative">
                {/* 1. ADIM: E-POSTA İLE KURTARMA */}
                {resetStep === 'email' && (
                    <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">E-posta Adresiniz</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none" placeholder="ornek@sirket.com" autoFocus />
                            </div>
                        </div>
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2 animate-pulse"><X className="w-4 h-4"/>{error}</div>}
                        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 flex justify-center items-center gap-2 active:scale-95">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Doğrulama Kodu Gönder</>}
                        </button>
                        <button type="button" onClick={cancelReset} className="w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 py-2">İptal Et ve Geri Dön</button>
                    </form>
                )}

                {/* 2. ADIM: OTP GİRİŞİ (8 KUTUCUKLU & ESTETİK) */}
                {resetStep === 'otp' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6 border border-blue-100 dark:border-blue-800">
                                <Mail className="w-4 h-4" /> <span>{email}</span>
                            </div>
                            
                            {/* 8 KUTUCUK */}
                            <div className="flex justify-center gap-2 sm:gap-2">
                                {otpValues.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        className={`w-9 h-12 sm:w-10 sm:h-12 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none 
                                            ${digit 
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm shadow-primary-500/20' 
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-100 text-gray-900 dark:text-white focus:border-primary-400 focus:shadow-md'
                                            }`}
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4">Kodu yapıştırmak için ilk kutuya tıklayıp CTRL+V yapabilirsiniz.</p>
                        </div>
                        
                        {successMsg && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4"/> {successMsg}</div>}
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center justify-center gap-2"><X className="w-4 h-4"/> {error}</div>}
                        
                        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/30 flex justify-center items-center gap-2 active:scale-95">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Fingerprint className="w-5 h-5" /> Kodu Doğrula</>}
                        </button>
                        <button type="button" onClick={() => setResetStep('email')} className="w-full text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 py-2">E-posta Adresini Değiştir</button>
                    </form>
                )}

                {/* 3. ADIM: YENİ ŞİFRE BELİRLEME */}
                {resetStep === 'new-password' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800 mb-6">
                            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">Güvenlik İpucu</h4>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Şifreniz en az 6 karakter olmalı ve tahmin edilmesi zor olmalıdır.</p>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">Yeni Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none" placeholder="••••••••" minLength={6} autoFocus />
                            </div>
                        </div>

                        {successMsg && <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm flex items-center justify-center gap-2"><Check className="w-4 h-4"/> {successMsg}</div>}
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2"><X className="w-4 h-4"/>{error}</div>}

                        <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 flex justify-center items-center gap-2 active:scale-95">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> Şifreyi Güncelle ve Giriş Yap</>}
                        </button>
                    </form>
                )}

                {/* NORMAL GİRİŞ FORMU */}
                {resetStep === 'none' && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-left-8 duration-500">
                        {savedUser ? (
                            <div className="bg-surface-50 dark:bg-surface-100 p-5 rounded-2xl border border-surface-200 dark:border-surface-200 flex items-center justify-between mb-6 relative overflow-hidden group hover:border-primary-300 transition-colors cursor-pointer" onClick={() => document.getElementById('passwordInput')?.focus()}>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white dark:border-surface-100">
                                        {getInitials(savedUser.name)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Hesap</span>
                                        <span className="text-base font-bold text-gray-900 dark:text-white">{savedUser.name || savedUser.email}</span>
                                    </div>
                                </div>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleSwitchAccount(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all relative z-10">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="group">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">E-posta Adresi</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none" placeholder="ad@sirket.com" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex items-center justify-between mb-1 ml-1">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Şifre</label>
                                <button type="button" onClick={() => { setResetStep('email'); setError(''); }} className="text-xs font-semibold text-primary-600 hover:text-primary-700 focus:outline-none hover:underline">Şifremi Unuttum?</button>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                                </div>
                                <input id="passwordInput" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-surface-200 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all outline-none" placeholder="••••••••" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-primary-600 border-primary-600' : 'border-gray-300 dark:border-gray-600 bg-transparent group-hover:border-primary-500'}`}>
                                    {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">Beni Hatırla</span>
                            </label>
                        </div>

                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2 animate-pulse"><X className="w-4 h-4"/>{error}</div>}

                        <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200 shadow-xl shadow-primary-600/30 hover:shadow-primary-600/50 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden active:scale-95">
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                            <span className="flex items-center gap-2 relative z-10">
                                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Giriş Yapılıyor...</> : <><LogIn className="w-5 h-5" /> {savedUser ? 'Tekrar Giriş Yap' : 'Güvenli Giriş Yap'}</>}
                            </span>
                        </button>
                    </form>
                )}
            </div>

            {/* FOOTER */}
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