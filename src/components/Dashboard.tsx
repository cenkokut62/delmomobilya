import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Briefcase, Settings as SettingsIcon } from 'lucide-react';
import { ProjectList } from './ProjectList';
import { Settings } from './Settings';

type View = 'projects' | 'settings';

export function Dashboard() {
  const { signOut, user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('projects');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Mobilya CRM</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 inline-flex gap-2">
            <button
              onClick={() => setCurrentView('projects')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'projects'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Projeler
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                currentView === 'settings'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <SettingsIcon className="w-5 h-5" />
              Ayarlar
            </button>
          </div>
        </div>

        <div>{currentView === 'projects' ? <ProjectList /> : <Settings />}</div>
      </div>
    </div>
  );
}
