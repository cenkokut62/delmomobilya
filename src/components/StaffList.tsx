import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useRBAC } from '../contexts/RBACContext'; 
import { AccessDenied } from './ui/AccessDenied'; // YENİ IMPORT
import { 
  Users, UserPlus, Search, Mail, Trash2, Pencil, Save, Loader2, Shield, KeyRound, BadgeCheck
} from 'lucide-react';
import { CustomModal } from './ui/CustomModal';
import { CustomSelect } from './ui/CustomSelect';

interface Profile {
  id: string;
  first_name: string | null; 
  last_name: string | null;
  email: string;
  role_id: string;
  created_at: string;
  roles?: { name: string }; 
}

interface Role {
  id: string;
  name: string;
}

export function StaffList() {
  const { addToast } = useToast();
  const { confirm } = useConfirmation();
  const { hasPermission } = useRBAC(); 

  const [staff, setStaff] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: ''
  });

  useEffect(() => {
    loadStaff();
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const { data } = await supabase.from('roles').select('id, name');
    if (data) setRoles(data);
  };

  const loadStaff = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .order('created_at', { ascending: false });

    if (error) addToast('error', 'Personel listesi yüklenemedi.');
    else setStaff(data || []);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
        const endpoint = modalMode === 'create' ? 'create-user' : 'update-user';
        const payload = {
            id: selectedUser?.id, 
            email: formData.email,
            password: formData.password || undefined, 
            firstName: formData.firstName,
            lastName: formData.lastName,
            roleId: formData.roleId
        };

        const { error } = await supabase.functions.invoke(endpoint, { body: payload });

        if (error) throw error;

        addToast('success', `Personel ${modalMode === 'create' ? 'eklendi' : 'güncellendi'}.`);
        setIsModalOpen(false);
        loadStaff();
    } catch (err: any) {
        console.error(err);
        addToast('error', 'İşlem başarısız: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
        setActionLoading(false);
    }
  };

  const handleDelete = async (user: Profile) => {
    if (!await confirm({ title: 'Sil', message: 'Bu personeli silmek istiyor musunuz?', type: 'danger' })) return;
    
    try {
        const { error } = await supabase.functions.invoke('delete-user', { body: { user_id: user.id } });
        if(error) throw error;
        addToast('success', 'Personel silindi.');
        loadStaff();
    } catch (err: any) {
        addToast('error', 'Silinemedi: ' + err.message);
    }
  };

  const openEditModal = (user: Profile) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '', 
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      roleId: user.role_id || ''
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ email: '', password: '', firstName: '', lastName: '', roleId: '' });
    setModalMode('create');
    setIsModalOpen(true);
  };

  // Güvenli İsim Gösterimi (Çökme Önleyici)
  const getDisplayName = (user: Profile) => {
      const first = user.first_name || '';
      const last = user.last_name || '';
      return first || last ? `${first} ${last}`.trim() : user.email;
  };

  const getInitials = (user: Profile) => {
      const first = user.first_name || '';
      const emailChar = user.email.charAt(0).toUpperCase();
      return first ? first.charAt(0).toUpperCase() : emailChar;
  };

  // YETKİ KONTROLÜ
  if (!hasPermission('can_manage_staff')) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-center justify-between col-span-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary-50 dark:bg-primary-900/10 rounded-bl-full -mr-6 -mt-6"></div>
            <div className="relative z-10">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary-600" /> Personel Yönetimi
                </h1>
                <p className="text-gray-500 mt-1">Ekip üyelerini yönetin ve yetkilendirin.</p>
            </div>
        </div>
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase">Toplam</p><p className="text-3xl font-bold mt-1">{staff.length}</p></div>
            <BadgeCheck className="w-10 h-10 text-primary-200" />
        </div>
      </div>

      <div className="bg-surface-0 dark:bg-surface-50 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex justify-between items-center">
        <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Personel ara..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-100 rounded-xl border border-surface-200 dark:border-surface-200 outline-none dark:text-white" />
        </div>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium"><UserPlus className="w-4 h-4"/> Yeni Personel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.filter(s => getDisplayName(s).toLowerCase().includes(searchTerm.toLowerCase())).map((user) => (
            <div key={user.id} className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 hover:border-primary-300 transition-colors group relative">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-blue-200 flex items-center justify-center text-lg font-bold text-primary-700">{getInitials(user)}</div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(user)} className="p-2 hover:bg-surface-100 rounded-lg text-primary-600"><Pencil className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(user)} className="p-2 hover:bg-red-50 rounded-lg text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">{getDisplayName(user)}</h3>
                <p className="text-sm text-gray-500 mb-3">{user.email}</p>
                <div className="pt-3 border-t border-surface-100 dark:border-surface-100/10 flex justify-between items-center">
                    <span className="px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-xs font-bold">{user.roles?.name || 'Rol Yok'}</span>
                </div>
            </div>
        ))}
      </div>

      <CustomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Yeni Personel' : 'Düzenle'}>
        <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Ad</label><input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 rounded-xl outline-none dark:text-white"/></div>
                <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Soyad</label><input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 rounded-xl outline-none dark:text-white"/></div>
            </div>
            <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">E-posta</label><input required disabled={modalMode === 'edit'} type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 rounded-xl outline-none dark:text-white disabled:opacity-50"/></div>
            
            <div>
                <CustomSelect 
                    label="Yetki Rolü"
                    value={formData.roleId}
                    onChange={(val) => setFormData({...formData, roleId: val})}
                    options={roles.map(r => ({ value: r.id, label: r.name }))}
                    placeholder="Rol Seçiniz"
                    icon={<Shield className="w-4 h-4"/>}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300 flex items-center gap-2"><KeyRound className="w-4 h-4"/> Şifre {modalMode === 'edit' && '(Değiştirmek için doldurun)'}</label>
                <input type="password" required={modalMode === 'create'} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 rounded-xl outline-none dark:text-white" placeholder="••••••••"/>
            </div>

            <button type="submit" disabled={actionLoading} className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold mt-4 flex items-center justify-center gap-2">
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>} Kaydet
            </button>
        </form>
      </CustomModal>
    </div>
  );
}