import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Save, User, Phone, Mail, MapPin, DollarSign, Layers, GitPullRequest } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect'; // YENİ

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

interface ProjectFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectForm({ onClose, onSuccess }: ProjectFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [subStages, setSubStages] = useState<SubStage[]>([]);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    email: '',
    address: '',
    total_amount: '',
    current_stage_id: '',
    current_sub_stage_id: '',
  });

  useEffect(() => {
    loadStages();
    loadSubStages();
  }, []);

  const loadStages = async () => {
    const { data } = await supabase.from('stages').select('*').order('order_index');
    if (data) {
      setStages(data);
      if (data.length > 0) setFormData(prev => ({ ...prev, current_stage_id: data[0].id }));
    }
  };

  const loadSubStages = async () => {
    const { data } = await supabase.from('sub_stages').select('*').order('order_index');
    if (data) setSubStages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        customer_name: formData.customer_name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address,
        total_amount: parseFloat(formData.total_amount) || 0,
        current_stage_id: formData.current_stage_id || null,
        current_sub_stage_id: formData.current_sub_stage_id || null,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (!projectError && project) {
      await supabase.from('project_stage_history').insert({
        project_id: project.id,
        stage_id: formData.current_stage_id,
        sub_stage_id: formData.current_sub_stage_id || null,
      });
      onSuccess();
    }
    setLoading(false);
  };

  const filteredSubStages = subStages.filter(ss => ss.stage_id === formData.current_stage_id);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-surface-200 dark:border-surface-100 animate-in zoom-in-95 duration-200">
        <div className="sticky top-0 bg-surface-0/80 dark:bg-surface-50/80 backdrop-blur-md border-b border-surface-200 dark:border-surface-100 px-8 py-5 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Yeni Proje</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-100 rounded-xl transition-colors text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Müşteri Adı Soyadı *</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white transition-all"
                  placeholder="Ad Soyad"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefon *</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white transition-all"
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white transition-all"
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proje Bedeli (₺) *</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white transition-all font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açık Adres *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <textarea
                required
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:text-white transition-all resize-none"
                placeholder="Tam adres..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
                <CustomSelect
                    label="Başlangıç Aşaması"
                    value={formData.current_stage_id}
                    onChange={(val) => setFormData({ ...formData, current_stage_id: val, current_sub_stage_id: '' })}
                    options={stages.map(s => ({ value: s.id, label: s.name }))}
                    icon={<Layers className="w-5 h-5" />}
                />
            </div>

            {filteredSubStages.length > 0 && (
              <div>
                <CustomSelect
                    label="Alt Aşama"
                    value={formData.current_sub_stage_id}
                    onChange={(val) => setFormData({ ...formData, current_sub_stage_id: val })}
                    options={[{ value: '', label: 'Seçiniz' }, ...filteredSubStages.map(s => ({ value: s.id, label: s.name }))]}
                    icon={<GitPullRequest className="w-5 h-5" />}
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-surface-200 dark:border-surface-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 border border-surface-200 dark:border-surface-200 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}