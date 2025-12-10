import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useRBAC } from '../contexts/RBACContext';
import { useLock } from '../contexts/LockContext';
import { useTheme } from '../contexts/ThemeContext'; // ThemeContext eklendi
import { supabase } from '../lib/supabase';
import { 
  LogOut, Briefcase, Settings as SettingsIcon, LayoutGrid, 
  Users, PieChart, Home, Lock 
} from 'lucide-react';
import { ThemeSwitch } from './ui/ThemeSwitch';
import { ProjectList } from './ProjectList';
import { Settings } from './Settings';
import { StaffList } from './StaffList';
import { GlobalAccounting } from './GlobalAccounting';
import { DashboardHome } from './DashboardHome';
import { AccessDenied } from './ui/AccessDenied';

type View = 'home' | 'projects' | 'settings' | 'staff' | 'accounting';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const { hasPermission } = useRBAC();
  const { lockScreen } = useLock();
  const { theme } = useTheme(); // Tema bilgisini çek
  
  const [currentView, setCurrentView] = useState<View>('home');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserName(`${data.first_name || ''} ${data.last_name || ''}`.trim());
          }
        });
    }
  }, [user]);

  // Tema ve ayara göre doğru logoyu belirle
  const logoSrc = (theme === 'dark' && settings?.dark_logo_url) 
    ? settings.dark_logo_url 
    : settings?.logo_url;

  const renderContent = () => {
    switch (currentView) {
      case 'home': return <DashboardHome onChangeView={setCurrentView} />;
      case 'projects': return <ProjectList />;
      case 'settings': return <Settings />;
      case 'staff': return <StaffList />;
      case 'accounting': 
        return hasPermission('can_view_financials') ? <GlobalAccounting /> : <AccessDenied />;
      default: return <DashboardHome onChangeView={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-0 transition-colors duration-300">
      <nav className="bg-surface-0 dark:bg-surface-50 shadow-sm border-b border-surface-200 dark:border-surface-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* LOGO ALANI */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('home')}>
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            {/* MASAÜSTÜ NAVİGASYON */}
            <div className="hidden md:flex items-center gap-1 bg-surface-50 dark:bg-surface-100 p-1 rounded-xl border border-surface-200 dark:border-surface-200">
              <button
                onClick={() => setCurrentView('home')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'home'
                    ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Home className="w-4 h-4" />
                Genel Bakış
              </button>

              <button
                onClick={() => setCurrentView('projects')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentView === 'projects'
                    ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Projeler
              </button>
              
              {hasPermission('can_manage_staff') && (
                <button
                  onClick={() => setCurrentView('staff')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'staff'
                      ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Personel
                </button>
              )}

              {hasPermission('can_view_financials') && (
                <button
                  onClick={() => setCurrentView('accounting')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'accounting'
                      ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  Muhasebe
                </button>
              )}

              {hasPermission('can_manage_settings') && (
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentView === 'settings'
                      ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  Ayarlar
                </button>
              )}
            </div>

            {/* SAĞ TARAF: KULLANICI & THEME & ACTIONS */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {userName || user?.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Yönetim Paneli</span>
              </div>
              
              <div className="h-8 w-[1px] bg-surface-200 dark:bg-surface-100 hidden md:block"></div>
              
              <ThemeSwitch />
              
              <div className="flex items-center gap-1">
                  <button 
                    onClick={lockScreen}
                    className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Ekranı Kilitle"
                  >
                    <Lock className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={signOut}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* MOBİL NAVİGASYON */}
        <div className="md:hidden border-t border-surface-200 dark:border-surface-100 px-4 py-2 bg-surface-0 dark:bg-surface-50 overflow-x-auto no-scrollbar">
           <div className="flex gap-2 min-w-max">
              <button 
                onClick={() => setCurrentView('home')} 
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentView === 'home' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
              >
                  <Home className="w-4 h-4" /> Genel
              </button>
              <button 
                onClick={() => setCurrentView('projects')} 
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentView === 'projects' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
              >
                  <LayoutGrid className="w-4 h-4" /> Projeler
              </button>
              
              {hasPermission('can_view_financials') && (
                <button 
                    onClick={() => setCurrentView('accounting')} 
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentView === 'accounting' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    <PieChart className="w-4 h-4" /> Muhasebe
                </button>
              )}

              {hasPermission('can_manage_staff') && (
                <button 
                    onClick={() => setCurrentView('staff')} 
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentView === 'staff' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    <Users className="w-4 h-4" /> Ekip
                </button>
              )}

              {hasPermission('can_manage_settings') && (
                <button 
                    onClick={() => setCurrentView('settings')} 
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${currentView === 'settings' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'}`}
                >
                    <SettingsIcon className="w-4 h-4" /> Ayarlar
                </button>
              )}
           </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>
    </div>
  );
}