import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Save } from 'lucide-react';

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
    const { data } = await supabase
      .from('stages')
      .select('*')
      .order('order_index');

    if (data) {
      setStages(data);
      if (data.length > 0) {
        setFormData(prev => ({ ...prev, current_stage_id: data[0].id }));
      }
    }
  };

  const loadSubStages = async () => {
    const { data } = await supabase
      .from('sub_stages')
      .select('*')
      .order('order_index');

    if (data) {
      setSubStages(data);
    }
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

  const filteredSubStages = subStages.filter(
    ss => ss.stage_id === formData.current_stage_id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Yeni Proje</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Müşteri Adı Soyadı *
              </label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proje Bedeli (₺) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açık Adres *
            </label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Başlangıç Aşaması
              </label>
              <select
                value={formData.current_stage_id}
                onChange={(e) => setFormData({ ...formData, current_stage_id: e.target.value, current_sub_stage_id: '' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredSubStages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alt Aşama
                </label>
                <select
                  value={formData.current_sub_stage_id}
                  onChange={(e) => setFormData({ ...formData, current_sub_stage_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seçiniz</option>
                  {filteredSubStages.map((subStage) => (
                    <option key={subStage.id} value={subStage.id}>
                      {subStage.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
