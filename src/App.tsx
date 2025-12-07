import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { RBACProvider } from './contexts/RBACContext';
import { LockProvider, useLock } from './contexts/LockContext'; // YENİ
import { LockScreen } from './components/LockScreen'; // YENİ
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

// İçerik Bileşeni: Kilit Durumunu Kontrol Eder
function AppContent() {
  const { user, loading } = useAuth();
  const { isLocked } = useLock(); // Kilit durumunu al

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Eğer kilitliyse LockScreen'i üst katmana bas */}
      {isLocked && <LockScreen />}
      
      {/* Kullanıcı varsa Dashboard, yoksa Login */}
      {user ? <Dashboard /> : <Auth />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ConfirmationProvider>
          <SettingsProvider>
            <AuthProvider>
              <RBACProvider>
                <LockProvider> {/* LockProvider eklendi */}
                  <AppContent />
                </LockProvider>
              </RBACProvider>
            </AuthProvider>
          </SettingsProvider>
        </ConfirmationProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;