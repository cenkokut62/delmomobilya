import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ConfirmationProvider } from './contexts/ConfirmationContext';
import { RBACProvider } from './contexts/RBACContext';
import { LockProvider, useLock } from './contexts/LockContext';
import { LockScreen } from './components/LockScreen';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const { isLocked } = useLock();

  // YENİ: Şifre sıfırlama akışı devam ediyor mu kontrolü
  const isResetFlow = localStorage.getItem('reset_flow') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-0 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {isLocked && <LockScreen />}
      {/* Kullanıcı giriş yapmış olsa bile reset akışındaysa Auth ekranını göster */}
      {user && !isResetFlow ? <Dashboard /> : <Auth />}
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
                <LockProvider>
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