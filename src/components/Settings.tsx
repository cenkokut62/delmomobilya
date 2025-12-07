import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useRBAC } from '../contexts/RBACContext';
import { CustomSelect } from './ui/CustomSelect';
import { AccessDenied } from './ui/AccessDenied';
import { 
  Settings as SettingsIcon, Plus, Trash2, GripVertical, Save, Upload, Sun, Moon, Building2, Palette, Layers, GitPullRequest, CheckCircle2, Layout, Image as ImageIcon, Type, List, Shield, Lock, CheckSquare, Edit
} from 'lucide-react';

interface Stage { id: string; name: string; order_index: number; }
interface SubStage { id: string; stage_id: string; name: string; order_index: number; }
interface Role { id: string; name: string; permissions: any; }

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  const { confirm } = useConfirmation();
  const { hasPermission } = useRBAC(); 

  const [activeTab, setActiveTab] = useState<'general' | 'roles'>('general');
  
  // State'ler
  const [stages, setStages] = useState<Stage[]>([]);
  const [subStages, setSubStages] = useState<SubStage[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Inputları
  const [newStageName, setNewStageName] = useState('');
  const [newSubStageName, setNewSubStageName] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  
  // Renk ve Firma
  const [lightColor, setLightColor] = useState(settings?.light_primary_color || '#2563EB');
  const [darkColor, setDarkColor] = useState(settings?.dark_primary_color || '#60A5FA');
  const [companyName, setCompanyName] = useState(settings?.company_name || '');
  const [lightLogoUploading, setLightLogoUploading] = useState(false);
  const [darkLogoUploading, setDarkLogoUploading] = useState(false);

  // Rol Yönetimi
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  
  // GÜNCELLEME: Yeni yetki 'can_manage_expenses' eklendi
  const [permissionForm, setPermissionForm] = useState({
    can_manage_staff: false,
    can_manage_settings: false,
    can_delete_payment: false,
    can_delete_file: false,
    can_delete_comment: false,
    can_view_financials: true,
    can_manage_expenses: false, // YENİ
  });

  // Drag & Drop State
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);
  const [draggedSubStageId, setDraggedSubStageId] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
        setLightColor(settings.light_primary_color);
        setDarkColor(settings.dark_primary_color);
        setCompanyName(settings.company_name || '');
    }
  }, [settings]);

  useEffect(() => {
    loadStages();
    loadSubStages();
    loadRoles();
  }, []);

  const loadStages = async () => {
    const { data } = await supabase.from('stages').select('*').order('order_index');
    if (data) setStages(data);
  };

  const loadSubStages = async () => {
    const { data } = await supabase.from('sub_stages').select('*').order('order_index');
    if (data) setSubStages(data);
  };

  const loadRoles = async () => {
    const { data } = await supabase.from('roles').select('*').order('created_at');
    if (data) setRoles(data);
  };

  // --- ROL İŞLEMLERİ ---
  const handleRoleEdit = (role: Role) => {
      setEditingRoleId(role.id);
      setRoleName(role.name);
      setPermissionForm(role.permissions || {});
  };

  const handleRoleCancel = () => {
      setEditingRoleId(null);
      setRoleName('');
      // GÜNCELLEME: Formu sıfırlarken yeni yetkiyi de sıfırla
      setPermissionForm({
          can_manage_staff: false, 
          can_manage_settings: false, 
          can_delete_payment: false,
          can_delete_file: false, 
          can_delete_comment: false, 
          can_view_financials: true,
          can_manage_expenses: false // YENİ
      });
  };

  const saveRole = async () => {
    if (!roleName.trim()) return;
    setLoading(true);
    
    if (editingRoleId) {
        // Güncelleme
        const { error } = await supabase.from('roles').update({
            name: roleName,
            permissions: permissionForm
        }).eq('id', editingRoleId);

        if (error) addToast('error', 'Güncelleme başarısız');
        else addToast('success', 'Rol güncellendi');
    } else {
        // Ekleme
        const { error } = await supabase.from('roles').insert({
            name: roleName,
            permissions: permissionForm
        });

        if (error) addToast('error', 'Rol eklenemedi');
        else addToast('success', 'Yeni rol oluşturuldu');
    }
    
    handleRoleCancel(); // Formu temizle
    loadRoles();
    setLoading(false);
  };

  const deleteRole = async (id: string) => {
    if (!await confirm({ title: 'Rolü Sil', message: 'Bu rolü silmek istediğinizden emin misiniz?', type: 'danger' })) return;
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) addToast('error', 'Silinemedi. Kullanımda olabilir.');
    else { addToast('success', 'Rol silindi.'); loadRoles(); }
  };

  // --- DRAG AND DROP ---
  const handleStageDragStart = (e: React.DragEvent, id: string) => { setDraggedStageId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleStageDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleStageDrop = async (e: React.DragEvent, targetId: string) => { e.preventDefault(); if (!draggedStageId || draggedStageId === targetId) return; const draggedIndex = stages.findIndex(s => s.id === draggedStageId); const targetIndex = stages.findIndex(s => s.id === targetId); if (draggedIndex === -1 || targetIndex === -1) return; const newStages = [...stages]; const [reorderedItem] = newStages.splice(draggedIndex, 1); newStages.splice(targetIndex, 0, reorderedItem); const updatedStages = newStages.map((s, index) => ({ ...s, order_index: index + 1 })); setStages(updatedStages); setDraggedStageId(null); try { const updates = updatedStages.map(s => ({ id: s.id, name: s.name, order_index: s.order_index })); const { error } = await supabase.from('stages').upsert(updates); if (error) throw error; addToast('success', 'Sıralama güncellendi'); } catch (error) { addToast('error', 'Sıralama güncellenemedi'); loadStages(); } };
  const handleSubStageDragStart = (e: React.DragEvent, id: string) => { setDraggedSubStageId(id); e.dataTransfer.effectAllowed = 'move'; };
  const handleSubStageDrop = async (e: React.DragEvent, targetId: string) => { e.preventDefault(); if (!draggedSubStageId || draggedSubStageId === targetId || !selectedStageId) return; const currentSubStages = subStages.filter(s => s.stage_id === selectedStageId); const otherSubStages = subStages.filter(s => s.stage_id !== selectedStageId); const draggedIndex = currentSubStages.findIndex(s => s.id === draggedSubStageId); const targetIndex = currentSubStages.findIndex(s => s.id === targetId); if (draggedIndex === -1 || targetIndex === -1) return; const newCurrentSubStages = [...currentSubStages]; const [reorderedItem] = newCurrentSubStages.splice(draggedIndex, 1); newCurrentSubStages.splice(targetIndex, 0, reorderedItem); const updatedCurrentSubStages = newCurrentSubStages.map((s, index) => ({ ...s, order_index: index + 1 })); setSubStages([...otherSubStages, ...updatedCurrentSubStages].sort((a, b) => a.order_index - b.order_index)); setDraggedSubStageId(null); try { const updates = updatedCurrentSubStages.map(s => ({ id: s.id, stage_id: s.stage_id, name: s.name, order_index: s.order_index })); const { error } = await supabase.from('sub_stages').upsert(updates); if (error) throw error; addToast('success', 'Sıralama güncellendi'); } catch (error) { addToast('error', 'Sıralama güncellenemedi'); loadSubStages(); } };

  // --- CRUD İŞLEMLERİ ---
  const addStage = async () => { if (!newStageName.trim()) return; setLoading(true); const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) : 0; const { error } = await supabase.from('stages').insert({ name: newStageName, order_index: maxOrder + 1 }); if (!error) { setNewStageName(''); await loadStages(); addToast('success', 'Yeni aşama eklendi'); } setLoading(false); };
  const addSubStage = async () => { if (!newSubStageName.trim() || !selectedStageId) return; setLoading(true); const stageSubStages = subStages.filter(ss => ss.stage_id === selectedStageId); const maxOrder = stageSubStages.length > 0 ? Math.max(...stageSubStages.map(s => s.order_index)) : 0; const { error } = await supabase.from('sub_stages').insert({ name: newSubStageName, stage_id: selectedStageId, order_index: maxOrder + 1 }); if (!error) { setNewSubStageName(''); await loadSubStages(); addToast('success', 'Alt görev eklendi'); } setLoading(false); };
  const deleteStage = async (id: string) => { if (!await confirm({ title: 'Aşamayı Sil', message: 'Onaylıyor musunuz?', confirmText: 'Sil', type: 'danger' })) return; const { error } = await supabase.from('stages').delete().eq('id', id); if (!error) { await loadStages(); await loadSubStages(); addToast('success', 'Aşama silindi'); } };
  const deleteSubStage = async (id: string) => { if (!await confirm({ title: 'Alt Görevi Sil', message: 'Onaylıyor musunuz?', confirmText: 'Sil', type: 'danger' })) return; const { error } = await supabase.from('sub_stages').delete().eq('id', id); if (!error) { await loadSubStages(); addToast('success', 'Alt görev silindi'); } };
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => { const file = e.target.files?.[0]; if (!file) return; if (type === 'light') setLightLogoUploading(true); else setDarkLogoUploading(true); const fileExt = file.name.split('.').pop(); const fileName = `logo-${type}-${Date.now()}.${fileExt}`; const filePath = `${fileName}`; try { const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, file, { upsert: true }); if (uploadError) throw uploadError; const { data: { publicUrl } } = supabase.storage.from('app-assets').getPublicUrl(filePath); const updateData = type === 'light' ? { logo_url: publicUrl } : { dark_logo_url: publicUrl }; await updateSettings(updateData); addToast('success', 'Logo güncellendi'); } catch (error: any) { addToast('error', 'Yükleme hatası'); } finally { if (type === 'light') setLightLogoUploading(false); else setDarkLogoUploading(false); } };
  const saveSettings = async () => { setLoading(true); await updateSettings({ light_primary_color: lightColor, dark_primary_color: darkColor, company_name: companyName }); setLoading(false); addToast('success', 'Ayarlar kaydedildi.'); };

  // --- YETKİ KONTROLÜ (GÜNCEL TASARIM) ---
  if (!hasPermission('can_manage_settings')) {
      return <AccessDenied />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-primary-600" />
            Sistem Ayarları
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 ml-1">
            Genel görünüm, iş akışları ve yetkilendirme yönetimi.
          </p>
        </div>
        <div className="flex bg-surface-0 dark:bg-surface-50 p-1 rounded-xl border border-surface-200 dark:border-surface-100">
            <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'general' ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>Genel Ayarlar</button>
            <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'roles' ? 'bg-primary-600 text-white shadow' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>Roller ve Yetkiler</button>
        </div>
      </div>

      {/* TAB 1: GENEL AYARLAR */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
             {/* MARKALAR VE RENKLER */}
             <div className="lg:col-span-2 space-y-8">
                <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-8 shadow-sm border border-surface-200 dark:border-surface-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400"><Building2 className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Kurumsal Kimlik</h3>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Firma Resmi Ünvanı</label>
                            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl outline-none dark:text-white" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Açık Tema Logosu</label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-dashed border-surface-200 dark:border-surface-200 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">Yükle</span>
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'light')} disabled={lightLogoUploading} />
                                </label>
                                {settings?.logo_url && <img src={settings.logo_url} className="h-12 object-contain mx-auto" />}
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Koyu Tema Logosu</label>
                                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-dashed border-surface-200 dark:border-surface-200 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400" /><span className="text-sm text-gray-500">Yükle</span>
                                    <input type="file" hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'dark')} disabled={darkLogoUploading} />
                                </label>
                                {settings?.dark_logo_url && <img src={settings.dark_logo_url} className="h-12 object-contain mx-auto bg-gray-900 rounded p-1" />}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* İŞ AKIŞI YÖNETİMİ */}
                <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100">
                   <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-orange-600 dark:text-orange-400"><Layers className="w-6 h-6" /></div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Süreç Yönetimi (İş Akışı)</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Sol: Ana Aşamalar */}
                        <div className="flex flex-col h-[500px]">
                            <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Ana Aşamalar</h4>
                            <div className="flex gap-2 mb-4">
                                <input type="text" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} className="flex-1 px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-sm outline-none dark:text-white" placeholder="Aşama Ekle" onKeyPress={(e) => e.key === 'Enter' && addStage()}/>
                                <button onClick={addStage} className="p-2 bg-primary-600 text-white rounded-xl"><Plus className="w-5 h-5"/></button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                {stages.map((s, i) => (
                                    <div key={s.id} draggable onDragStart={(e) => handleStageDragStart(e, s.id)} onDragOver={handleStageDragOver} onDrop={(e) => handleStageDrop(e, s.id)} className={`flex items-center gap-3 p-3 bg-white dark:bg-surface-100/50 border border-surface-200 dark:border-surface-100 rounded-xl cursor-move ${draggedStageId === s.id ? 'opacity-50 border-dashed' : ''}`}>
                                        <span className="w-6 h-6 rounded-full bg-surface-100 dark:bg-surface-200 text-xs flex items-center justify-center font-bold text-gray-500">{i+1}</span>
                                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</span>
                                        <button onClick={() => deleteStage(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Sağ: Alt Görevler */}
                        <div className="flex flex-col h-[500px]">
                            <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wide">Alt Görevler</h4>
                            <div className="space-y-3 mb-4">
                                <CustomSelect value={selectedStageId} onChange={setSelectedStageId} options={stages.map(s => ({ value: s.id, label: s.name }))} placeholder="Aşama Seçiniz" />
                                <div className="flex gap-2">
                                    <input type="text" value={newSubStageName} onChange={(e) => setNewSubStageName(e.target.value)} className="flex-1 px-4 py-2 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-sm outline-none dark:text-white" placeholder="Görev Ekle" disabled={!selectedStageId} onKeyPress={(e) => e.key === 'Enter' && addSubStage()}/>
                                    <button onClick={addSubStage} disabled={!selectedStageId} className="p-2 bg-primary-600 text-white rounded-xl disabled:opacity-50"><Plus className="w-5 h-5"/></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                {stages.map(stage => {
                                    if(stage.id !== selectedStageId) return null;
                                    const ss = subStages.filter(s => s.stage_id === stage.id);
                                    return ss.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 py-4 italic">Bu aşamada henüz görev yok.</p>
                                    ) : (
                                        ss.map(sub => (
                                            <div key={sub.id} draggable onDragStart={(e) => handleSubStageDragStart(e, sub.id)} onDragOver={handleStageDragOver} onDrop={(e) => handleSubStageDrop(e, sub.id)} className={`flex items-center gap-3 p-3 bg-white dark:bg-surface-100/50 border border-surface-200 dark:border-surface-100 rounded-xl cursor-move ${draggedSubStageId === sub.id ? 'opacity-50 border-dashed' : ''}`}>
                                                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                                                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{sub.name}</span>
                                                <button onClick={() => deleteSubStage(sub.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        ))
                                    );
                                })}
                            </div>
                        </div>
                   </div>
                </div>
             </div>
             
             {/* Renkler (Sağ Panel) */}
             <div className="lg:col-span-1 space-y-6">
                <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 sticky top-24">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 dark:text-indigo-400"><Palette className="w-6 h-6" /></div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Renkler</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Açık Tema</label>
                            <div className="flex gap-2">
                                <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent" />
                                <div className="flex-1 h-10 bg-surface-50 dark:bg-surface-100 rounded-lg border border-surface-200 dark:border-surface-200 flex items-center px-3 text-xs font-mono">{lightColor}</div>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Koyu Tema</label>
                            <div className="flex gap-2">
                                <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer bg-transparent" />
                                <div className="flex-1 h-10 bg-surface-50 dark:bg-surface-100 rounded-lg border border-surface-200 dark:border-surface-200 flex items-center px-3 text-xs font-mono">{darkColor}</div>
                            </div>
                        </div>
                        <button onClick={saveSettings} disabled={loading} className="w-full mt-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold transition-colors shadow-lg shadow-primary-600/20">Ayarları Kaydet</button>
                    </div>
                </div>
             </div>
        </div>
      )}

      {/* TAB 2: ROLLER VE YETKİLER */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Rol Listesi */}
            <div className="lg:col-span-1 bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col h-[600px]">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-green-600" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Tanımlı Roller</h3>
                </div>
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {roles.map((role) => (
                        <div 
                            key={role.id} 
                            onClick={() => handleRoleEdit(role)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-colors group relative ${
                                editingRoleId === role.id 
                                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700 ring-1 ring-primary-500' 
                                : 'bg-surface-50 dark:bg-surface-100 border-surface-200 dark:border-surface-200 hover:border-primary-300'
                            }`}
                        >
                            <h4 className="font-bold text-gray-900 dark:text-white">{role.name}</h4>
                            <p className="text-xs text-gray-500 mt-1">Yetkiler: {Object.keys(role.permissions || {}).filter(k => role.permissions[k]).length} adet</p>
                            {role.name !== 'Yönetici' && (
                                <button onClick={(e) => { e.stopPropagation(); deleteRole(role.id); }} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <button onClick={handleRoleCancel} className="mt-4 w-full py-2 text-sm font-medium text-gray-500 hover:text-primary-600 border border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">
                    + Yeni Rol Ekle
                </button>
            </div>

            {/* Rol Düzenleme / Ekleme */}
            <div className="lg:col-span-2 bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {editingRoleId ? <Edit className="w-6 h-6 text-blue-600" /> : <Plus className="w-6 h-6 text-primary-600" />}
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">{editingRoleId ? 'Rolü Düzenle' : 'Yeni Rol Oluştur'}</h3>
                    </div>
                    {editingRoleId && <button onClick={handleRoleCancel} className="text-sm text-red-500 hover:underline">İptal</button>}
                </div>
                
                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rol Adı (Title)</label>
                        <input 
                            type="text" 
                            value={roleName} 
                            onChange={(e) => setRoleName(e.target.value)} 
                            placeholder="Örn: Muhasebe Sorumlusu" 
                            className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl outline-none dark:text-white focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* GÜNCELLEME: YETKİ LİSTESİ */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Yetkiler</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'can_manage_staff', label: 'Personel Yönetimi (Ekle/Sil)' },
                                { key: 'can_manage_settings', label: 'Sistem Ayarlarına Erişim' },
                                { key: 'can_view_financials', label: 'Finansal Verileri Görme (Muhasebe)' },
                                { key: 'can_delete_payment', label: 'Ödeme (Gelir) Kaydı Silme' },
                                { key: 'can_manage_expenses', label: 'Gider/Masraf Yönetimi (Ekle/Sil)' }, // Yeni Yetki
                                { key: 'can_delete_file', label: 'Dosya Silme' },
                                { key: 'can_delete_comment', label: 'Yorum Silme' },
                            ].map((perm) => (
                                <label key={perm.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${permissionForm[perm.key as keyof typeof permissionForm] ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800' : 'bg-surface-50 dark:bg-surface-100 border-surface-200 dark:border-surface-200'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={permissionForm[perm.key as keyof typeof permissionForm]} 
                                        onChange={(e) => setPermissionForm({...permissionForm, [perm.key]: e.target.checked})}
                                        className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{perm.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-6 mt-auto border-t border-surface-100 dark:border-surface-100/10">
                    <button 
                        onClick={saveRole} 
                        disabled={loading || !roleName} 
                        className="w-full py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-semibold shadow-lg shadow-primary-600/20 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {editingRoleId ? 'Güncelle' : 'Kaydet'}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}