import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Plus, Trash2, GripVertical } from 'lucide-react';

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
  const [stages, setStages] = useState<Stage[]>([]);
  const [subStages, setSubStages] = useState<SubStage[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [newSubStageName, setNewSubStageName] = useState('');
  const [selectedStageId, setSelectedStageId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStages();
    loadSubStages();
  }, []);

  const loadStages = async () => {
    const { data, error } = await supabase
      .from('stages')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setStages(data);
    }
  };

  const loadSubStages = async () => {
    const { data, error } = await supabase
      .from('sub_stages')
      .select('*')
      .order('order_index');

    if (!error && data) {
      setSubStages(data);
    }
  };

  const addStage = async () => {
    if (!newStageName.trim()) return;

    setLoading(true);
    const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order_index)) : 0;

    const { error } = await supabase
      .from('stages')
      .insert({ name: newStageName, order_index: maxOrder + 1 });

    if (!error) {
      setNewStageName('');
      await loadStages();
    }
    setLoading(false);
  };

  const addSubStage = async () => {
    if (!newSubStageName.trim() || !selectedStageId) return;

    setLoading(true);
    const stageSubStages = subStages.filter(ss => ss.stage_id === selectedStageId);
    const maxOrder = stageSubStages.length > 0 ? Math.max(...stageSubStages.map(s => s.order_index)) : 0;

    const { error } = await supabase
      .from('sub_stages')
      .insert({
        name: newSubStageName,
        stage_id: selectedStageId,
        order_index: maxOrder + 1
      });

    if (!error) {
      setNewSubStageName('');
      await loadSubStages();
    }
    setLoading(false);
  };

  const deleteStage = async (id: string) => {
    if (!confirm('Bu aşamayı silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('stages')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadStages();
      await loadSubStages();
    }
  };

  const deleteSubStage = async (id: string) => {
    if (!confirm('Bu alt aşamayı silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('sub_stages')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadSubStages();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-3 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Ayarlar</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Ana Aşamalar</h3>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Yeni aşama adı"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addStage()}
            />
            <button
              onClick={addStage}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-gray-400" />
                <span className="flex-1 font-medium text-gray-900">{stage.name}</span>
                <button
                  onClick={() => deleteStage(stage.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Alt Aşamalar</h3>

          <div className="space-y-3 mb-6">
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Ana aşama seçin</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubStageName}
                onChange={(e) => setNewSubStageName(e.target.value)}
                placeholder="Yeni alt aşama adı"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && addSubStage()}
                disabled={!selectedStageId}
              />
              <button
                onClick={addSubStage}
                disabled={loading || !selectedStageId}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {stages.map((stage) => {
              const stageSubStages = subStages.filter(ss => ss.stage_id === stage.id);
              if (stageSubStages.length === 0) return null;

              return (
                <div key={stage.id} className="space-y-2">
                  <h4 className="font-semibold text-gray-700 text-sm">{stage.name}</h4>
                  {stageSubStages.map((subStage) => (
                    <div
                      key={subStage.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors ml-4"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-gray-900">{subStage.name}</span>
                      <button
                        onClick={() => deleteSubStage(subStage.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
