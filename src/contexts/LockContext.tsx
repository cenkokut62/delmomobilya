import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface LockContextType {
  isLocked: boolean;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<{ error: any }>;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export function LockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Sayfa yenilendiğinde kilitli kalsın diye localStorage kullanıyoruz
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem('app_is_locked') === 'true';
  });

  const lockScreen = () => {
    setIsLocked(true);
    localStorage.setItem('app_is_locked', 'true');
  };

  const unlockScreen = async (password: string) => {
    if (!user || !user.email) return { error: { message: 'Kullanıcı bulunamadı' } };

    // Şifreyi doğrulamak için tekrar giriş denemesi yapıyoruz
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (!error) {
      setIsLocked(false);
      localStorage.removeItem('app_is_locked');
    }

    return { error };
  };

  return (
    <LockContext.Provider value={{ isLocked, lockScreen, unlockScreen }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
}