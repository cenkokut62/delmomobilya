import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Check, Circle } from 'lucide-react';

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

interface StageHistory {
  stage_id: string;
  sub_stage_id: string | null;
  entered_at: string;
}

interface ProjectTimelineProps {
  projectId: string;
  currentStageId: string | null;
  currentSubStageId: string | null;
  onStageChange: () => void;
}

export function ProjectTimeline({
  projectId,
  currentStageId,
  currentSubStageId,
  onStageChange,
}: ProjectTimelineProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [subStages, setSubStages] = useState<SubStage[]>([]);
  const [history, setHistory] = useState<StageHistory[]>([]);
  const [showStageSelector, setShowStageSelector] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState('');
  const [selectedSubStageId, setSelectedSubStageId] = useState('');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const [stagesRes, subStagesRes, historyRes] = await Promise.all([
      supabase.from('stages').select('*').order('order_index'),
      supabase.from('sub_stages').select('*').order('order_index'),
      supabase
        .from('project_stage_history')
        .select('stage_id, sub_stage_id, entered_at')
        .eq('project_id', projectId),
    ]);

    if (stagesRes.data) setStages(stagesRes.data);
    if (subStagesRes.data) setSubStages(subStagesRes.data);
    if (historyRes.data) setHistory(historyRes.data);
  };

  const updateStage = async () => {
    if (!selectedStageId) return;

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        current_stage_id: selectedStageId,
        current_sub_stage_id: selectedSubStageId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (!updateError) {
      await supabase.from('project_stage_history').insert({
        project_id: projectId,
        stage_id: selectedStageId,
        sub_stage_id: selectedSubStageId || null,
      });

      setShowStageSelector(false);
      onStageChange();
    }
  };

  const getCurrentStageIndex = () => {
    return stages.findIndex((s) => s.id === currentStageId);
  };

  const isStageCompleted = (stageId: string) => {
    return history.some((h) => h.stage_id === stageId);
  };

  const getSubStageStatus = (stageId: string, subStageId: string) => {
    return history.some(
      (h) => h.stage_id === stageId && h.sub_stage_id === subStageId
    );
  };

  const currentIndex = getCurrentStageIndex();
  const filteredSubStages = subStages.filter(
    (ss) => ss.stage_id === selectedStageId
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-semibold text-gray-900">Proje Durumu</h3>
        <button
          onClick={() => {
            setSelectedStageId(currentStageId || '');
            setSelectedSubStageId(currentSubStageId || '');
            setShowStageSelector(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Aşama Güncelle
        </button>
      </div>

      {showStageSelector && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yeni Aşama Seçin
            </label>
            <select
              value={selectedStageId}
              onChange={(e) => {
                setSelectedStageId(e.target.value);
                setSelectedSubStageId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seçiniz</option>
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
                Alt Aşama (Opsiyonel)
              </label>
              <select
                value={selectedSubStageId}
                onChange={(e) => setSelectedSubStageId(e.target.value)}
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

          <div className="flex gap-2">
            <button
              onClick={() => setShowStageSelector(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              onClick={updateStage}
              disabled={!selectedStageId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Güncelle
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{
              width: `${currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0}%`,
            }}
          />
        </div>

        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = isStageCompleted(stage.id);
            const isCurrent = stage.id === currentStageId;
            const stageSubStages = subStages.filter(
              (ss) => ss.stage_id === stage.id
            );

            return (
              <div key={stage.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                    isCompleted || isCurrent
                      ? 'bg-blue-600 border-blue-600 shadow-lg scale-110'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-8 h-8 text-white" />
                  ) : (
                    <Circle
                      className={`w-8 h-8 ${isCurrent ? 'text-white' : 'text-gray-400'}`}
                    />
                  )}
                </div>

                <div className="mt-4 text-center">
                  <p
                    className={`font-semibold text-sm ${
                      isCurrent
                        ? 'text-blue-600'
                        : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-500'
                    }`}
                  >
                    {stage.name}
                  </p>

                  {stageSubStages.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {stageSubStages.map((subStage) => {
                        const subCompleted = getSubStageStatus(
                          stage.id,
                          subStage.id
                        );
                        const subCurrent =
                          isCurrent && subStage.id === currentSubStageId;

                        return (
                          <div
                            key={subStage.id}
                            className={`text-xs px-2 py-1 rounded ${
                              subCurrent
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : subCompleted
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {subStage.name}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
