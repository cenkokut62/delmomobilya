import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import { Settings as SettingsIcon, Plus, Trash2, GripVertical, Save, Upload, Sun, Moon } from 'lucide-react';

interface Stage {
  id: string;
  name: string;
  order_index: number;
}

interface SubStage {
  id: string;
  stage_id: string;
  name: string;
  order_index: number;
}

export function Settings() {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();
  
  const [stages, setStages] = useState<Stage[]>([]);
  const [subStages, setSubStages] = useState<SubStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newSubStageName, setNewSubStageName] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [lightLogoUploading, setLightLogoUploading] = useState(false);
  const [darkLogoUploading, setDarkLogoUploading] = useState(false);
  
  const [lightColor, setLightColor] = useState(settings?.light_primary_color || '#2563EB');
  const [darkColor, setDarkColor] = useState(settings?.dark_primary_color || '#60A5FA');

  // Ayarlar yüklendiğinde state'i güncelle
  useEffect(() => {
    if (settings) {
        setLightColor(settings.light_primary_color);
        setDarkColor(settings.dark_primary_color);
    }
  }, [settings]);

  useEffect(() => {
    loadStages();
    loadSubStages();
  }, []);

  const loadStages = async () => {
    const { data } = await supabase.from('stages').select('*').order('order_index');
    if (data) setStages(data);
  };

  const loadSubStages = async () => {
    const { data } = await supabase.from('sub_stages').select('*').order('order_index');
    if (data) setSubStages(data);
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;
    setLoading(true);
    const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) : 0;
    const { error } = await supabase.from('stages').insert({ name: newStageName, order_index: maxOrder + 1 });
    if (!error) { 
      setNewStageName(''); 
      await loadStages(); 
      addToast('success', 'Aşama eklendi'); 
    }
    setLoading(false);
  };

  const addSubStage = async () => {
    if (!newSubStageName.trim() || !selectedStageId) return;
    setLoading(true);
    const stageSubStages = subStages.filter(ss => ss.stage_id === selectedStageId);
    const maxOrder = stageSubStages.length > 0 ? Math.max(...stageSubStages.map(s => s.order_index)) : 0;
    const { error } = await supabase.from('sub_stages').insert({ name: newSubStageName, stage_id: selectedStageId, order_index: maxOrder + 1 });
    if (!error) { 
      setNewSubStageName(''); 
      await loadSubStages(); 
      addToast('success', 'Alt aşama eklendi'); 
    }
    setLoading(false);
  };

  const deleteStage = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('stages').delete().eq('id', id);
    if (!error) { 
      await loadStages(); 
      await loadSubStages(); 
      addToast('success', 'Aşama silindi'); 
    }
  };

  const deleteSubStage = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('sub_stages').delete().eq('id', id);
    if (!error) { 
      await loadSubStages(); 
      addToast('success', 'Alt aşama silindi'); 
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'light') setLightLogoUploading(true);
    else setDarkLogoUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `logo-${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('app-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('app-assets').getPublicUrl(filePath);
      
      const updateData = type === 'light' ? { logo_url: publicUrl } : { dark_logo_url: publicUrl };
      await updateSettings(updateData);
      
      addToast('success', `${type === 'light' ? 'Açık' : 'Koyu'} tema logosu güncellendi`);
    } catch (error: any) {
      addToast('error', 'Logo yüklenemedi: ' + error.message);
    } finally {
      if (type === 'light') setLightLogoUploading(false);
      else setDarkLogoUploading(false);
    }
  };

  const saveColors = async () => {
    await updateSettings({
      light_primary_color: lightColor,
      dark_primary_color: darkColor
    });
    addToast('success', 'Renk ayarları kaydedildi ve uygulandı.');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Görünüm Ayarları */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-xl shadow-sm border border-surface-200 dark:border-surface-100 p-6 transition-colors duration-300">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary-600" />
          Görünüm ve Marka
        </h3>
        
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Logo Ayarları */}
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b border-surface-200 dark:border-surface-200 pb-2">Logolar</h4>
            
            {/* Açık Tema Logo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-500" /> Açık Tema Logosu
                </label>
                <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-surface-200 dark:border-surface-100 bg-white flex items-center justify-center overflow-hidden p-2">
                    {settings?.logo_url ? (
                    <img src={settings.logo_url} alt="Light Logo" className="w-full h-full object-contain" />
                    ) : (
                    <span className="text-xs text-gray-400">Yok</span>
                    )}
                </div>
                <label className="cursor-pointer bg-white dark:bg-surface-100 border border-surface-200 dark:border-surface-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {lightLogoUploading ? '...' : 'Yükle'}
                    <input type="file" hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'light')} disabled={lightLogoUploading} />
                </label>
                </div>
            </div>

            {/* Koyu Tema Logo */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-500" /> Koyu Tema Logosu
                </label>
                <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border border-surface-200 dark:border-surface-100 bg-gray-900 flex items-center justify-center overflow-hidden p-2">
                    {settings?.dark_logo_url ? (
                    <img src={settings.dark_logo_url} alt="Dark Logo" className="w-full h-full object-contain" />
                    ) : (
                    <span className="text-xs text-gray-500">Yok</span>
                    )}
                </div>
                <label className="cursor-pointer bg-white dark:bg-surface-100 border border-surface-200 dark:border-surface-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-50 transition-colors flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {darkLogoUploading ? '...' : 'Yükle'}
                    <input type="file" hidden accept="image/*" onChange={(e) => handleLogoUpload(e, 'dark')} disabled={darkLogoUploading} />
                </label>
                </div>
            </div>
          </div>

          {/* Renk Ayarları */}
          <div className="space-y-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 border-b border-surface-200 dark:border-surface-200 pb-2">Tema Renkleri</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-100 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: lightColor }}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Açık Tema Rengi</span>
                </div>
                <input type="color" value={lightColor} onChange={(e) => setLightColor(e.target.value)} className="h-8 w-14 rounded cursor-pointer border-0 bg-transparent" />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-100 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gray-600" style={{ backgroundColor: darkColor }}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Koyu Tema Rengi</span>
                </div>
                <input type="color" value={darkColor} onChange={(e) => setDarkColor(e.target.value)} className="h-8 w-14 rounded cursor-pointer border-0 bg-transparent" />
              </div>

              <button onClick={saveColors} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 text-sm font-semibold transition-all shadow-lg shadow-primary-600/20 active:scale-95">
                <Save className="w-4 h-4" /> Ayarları Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-surface-0 dark:bg-surface-50 rounded-xl shadow-sm border border-surface-200 dark:border-surface-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Ana Aşamalar</h3>
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Yeni aşama adı"
              className="flex-1 px-4 py-2 border border-surface-200 dark:border-surface-100 dark:bg-surface-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && addStage()}
            />
            <button
              onClick={addStage}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-100 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="flex-1 font-medium text-gray-900 dark:text-gray-100">{stage.name}</span>
                <button
                  onClick={() => deleteStage(stage.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-0 dark:bg-surface-50 rounded-xl shadow-sm border border-surface-200 dark:border-surface-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Alt Aşamalar</h3>
          <div className="space-y-3 mb-6">
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full px-4 py-2 border border-surface-200 dark:border-surface-100 dark:bg-surface-100 rounded-lg dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Ana aşama seçin</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubStageName}
                onChange={(e) => setNewSubStageName(e.target.value)}
                placeholder="Yeni alt aşama adı"
                className="flex-1 px-4 py-2 border border-surface-200 dark:border-surface-100 dark:bg-surface-100 rounded-lg dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!selectedStageId}
                onKeyPress={(e) => e.key === 'Enter' && addSubStage()}
              />
              <button
                onClick={addSubStage}
                disabled={loading || !selectedStageId}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {stages.map((stage) => {
              const ss = subStages.filter(s => s.stage_id === stage.id);
              if (ss.length === 0) return null;
              return (
                <div key={stage.id} className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400">{stage.name}</h4>
                  {ss.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-100 rounded-lg ml-4 hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
                    >
                      <span className="flex-1 text-gray-900 dark:text-gray-100">{sub.name}</span>
                      <button
                        onClick={() => deleteSubStage(sub.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}