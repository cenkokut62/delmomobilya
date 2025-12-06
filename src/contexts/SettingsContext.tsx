import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme } from './ThemeContext';

interface AppSettings {
  id: string;
  logo_url: string | null;
  dark_logo_url?: string | null;
  light_primary_color: string;
  dark_primary_color: string;
  company_name: string;
}

interface SettingsContextType {
  settings: AppSettings | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Kritik Düzeltme: Tema veya Ayar değiştiğinde rengi zorla uygula
  useEffect(() => {
    if (settings) {
      const root = document.documentElement;
      
      // Temaya göre doğru rengi seç
      const activeColor = theme === 'dark' 
        ? (settings.dark_primary_color || '#60A5FA') 
        : (settings.light_primary_color || '#2563EB');
      
      // CSS değişkenini güncelle
      root.style.setProperty('--color-primary-600', activeColor);
      
      // Debug için (Gerekirse konsola bakabilirsin)
      // console.log(`Tema Rengi Güncellendi (${theme}):`, activeColor);
    }
  }, [settings, theme]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettings(data);
      } else if (!data && !error) {
        // Varsayılan ayarları oluştur
        const { data: newData } = await supabase
          .from('app_settings')
          .insert({
            light_primary_color: '#2563EB',
            dark_primary_color: '#60A5FA'
          })
          .select()
          .single();
        if(newData) setSettings(newData);
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings?.id) return;

    const { error } = await supabase
      .from('app_settings')
      .update({ ...newSettings, updated_at: new Date().toISOString() })
      .eq('id', settings.id);

    if (!error) {
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}