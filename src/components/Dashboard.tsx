import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { supabase } from '../lib/supabase';
import { LogOut, Briefcase, Settings as SettingsIcon, LayoutGrid } from 'lucide-react';
import { ThemeSwitch } from './ui/ThemeSwitch';
import { ProjectList } from './ProjectList';
import { Settings } from './Settings';

type View = 'projects' | 'settings';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const { settings } = useSettings();
  const [currentView, setCurrentView] = useState<View>('projects');
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

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-0 transition-colors duration-300">
      <nav className="bg-surface-0 dark:bg-surface-50 shadow-sm border-b border-surface-200 dark:border-surface-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('projects')}>
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="h-24 w-auto object-contain" />
              ) : (
                <div className="bg-primary-600 p-2 rounded-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              )}
            </div>

            <div className="hidden md:flex items-center gap-1 bg-surface-50 dark:bg-surface-100 p-1 rounded-xl border border-surface-200 dark:border-surface-200">
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
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {userName || user?.email}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Yönetici</span>
              </div>
              
              <div className="h-8 w-[1px] bg-surface-200 dark:bg-surface-100 hidden md:block"></div>
              
              <ThemeSwitch />
              
              <button
                onClick={signOut}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Çıkış Yap"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="md:hidden border-t border-surface-200 dark:border-surface-100 px-4 py-2 flex gap-2 justify-center bg-surface-0 dark:bg-surface-50">
           <button
                onClick={() => setCurrentView('projects')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  currentView === 'projects' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Projeler
            </button>
            <button
                onClick={() => setCurrentView('settings')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  currentView === 'settings' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <SettingsIcon className="w-4 h-4" /> Ayarlar
            </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'projects' ? <ProjectList /> : <Settings />}
      </div>
    </div>
  );
}