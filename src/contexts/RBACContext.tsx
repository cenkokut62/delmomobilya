import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

// 1. Yeni yetkiyi buraya ekliyoruz: can_manage_expenses
interface Permissions {
  can_manage_staff?: boolean;
  can_manage_settings?: boolean;
  can_delete_payment?: boolean;
  can_delete_file?: boolean;
  can_delete_comment?: boolean;
  can_view_financials?: boolean;
  can_manage_expenses?: boolean; // YENİ EKLENDİ
  [key: string]: boolean | undefined;
}

interface RBACContextType {
  permissions: Permissions;
  roleName: string;
  hasPermission: (permission: keyof Permissions) => boolean;
  loading: boolean;
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export function RBACProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [roleName, setRoleName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    if (!user) {
      setPermissions({});
      setRoleName('');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          role_id,
          roles (
            name,
            permissions
          )
        `)
        .eq('id', user.id)
        .single();

      if (data && data.roles) {
        // @ts-ignore
        setRoleName(data.roles.name);
        // @ts-ignore
        setPermissions(data.roles.permissions || {});
      } else {
        setRoleName('Misafir');
        setPermissions({});
      }
    } catch (error) {
      console.error('Yetki kontrol hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [user]);

  const hasPermission = (permission: keyof Permissions) => {
    return !!permissions[permission];
  };

  return (
    <RBACContext.Provider value={{ permissions, roleName, hasPermission, loading, refreshPermissions: fetchPermissions }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error('useRBAC must be used within a RBACProvider');
  }
  return context;
}