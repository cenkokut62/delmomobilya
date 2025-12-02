import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  ChevronRight, 
  LayoutList, 
  Check, 
  PlayCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { Accordion, AccordionItem } from './ui/Accordion';
import { CustomDrawer } from './ui/CustomDrawer';
import { SubStageDetail } from './SubStageDetail';

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

interface SubStageDetailData {
  id: string;
  project_id: string;
  stage_id: string;
  sub_stage_id: string;
  is_completed: boolean;
}

interface ProjectTimelineProps {
  projectId: string;
  currentStageId: string | null;
  currentSubStageId: string | null;
  onStageChange: () => void;
}

interface StageWithSubStages extends Stage {
  sub_stages: SubStage[];
  details: SubStageDetailData[];
}

interface ActiveSubStage {
  projectId: string;
  stageId: string;
  subStageId: string;
  stageName: string;
  subStageName: string;
}

export function ProjectTimeline({
  projectId,
  onStageChange,
}: ProjectTimelineProps) {
  const [stagesData, setStagesData] = useState<StageWithSubStages[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubStage, setActiveSubStage] = useState<ActiveSubStage | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [stagesRes, subStagesRes, detailsRes] = await Promise.all([
      supabase.from('stages').select('*').order('order_index'),
      supabase.from('sub_stages').select('*').order('order_index'),
      supabase.from('sub_stage_details').select('*').eq('project_id', projectId),
    ]);

    if (stagesRes.data && subStagesRes.data) {
      const allStages: StageWithSubStages[] = stagesRes.data.map((stage) => ({
        ...stage,
        sub_stages: subStagesRes.data!
          .filter((ss) => ss.stage_id === stage.id)
          .sort((a, b) => a.order_index - b.order_index),
        details: detailsRes.data?.filter(d => d.stage_id === stage.id) || [],
      }));
      setStagesData(allStages);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubStageClick = (stage: Stage, subStage: SubStage) => {
    setActiveSubStage({
      projectId,
      stageId: stage.id,
      subStageId: subStage.id,
      stageName: stage.name,
      subStageName: subStage.name,
    });
    setIsDrawerOpen(true);
  };

  const handleSubStageUpdate = () => {
    loadData();
    onStageChange();
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-surface-0 dark:bg-surface-50 rounded-xl shadow-sm border border-surface-200 dark:border-surface-100 p-6 text-center">
        <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Aktif aşamayı ve sıradaki alt görevi bulma mantığı
  const currentActiveIndex = stagesData.findIndex(stage => {
    const totalSub = stage.sub_stages.length;
    const completedSub = stage.details.filter(d => d.is_completed).length;
    return totalSub > 0 && completedSub < totalSub;
  });
  
  const activeStageIndex = currentActiveIndex === -1 
    ? (stagesData.every(s => s.details.filter(d => d.is_completed).length === s.sub_stages.length && s.sub_stages.length > 0) ? stagesData.length - 1 : 0)
    : currentActiveIndex;

  return (
    <div className="space-y-10">
      
      {/* --- YATAY TIMELINE (GÜÇLENDİRİLMİŞ) --- */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl shadow-lg border border-surface-200 dark:border-surface-100 p-8 pb-12 overflow-x-auto">
        <div className="flex items-start justify-between min-w-[700px] px-4">
          
          {stagesData.map((stage, index) => {
            const isCompleted = index < activeStageIndex;
            const isCurrent = index === activeStageIndex;
            const isFuture = index > activeStageIndex;
            
            // Bu aşamanın aktif alt görevini bul
            const currentSubTask = stage.sub_stages.find(ss => 
              !stage.details.some(d => d.sub_stage_id === ss.id && d.is_completed)
            );

            return (
              <div key={stage.id} className="flex-1 flex relative">
                
                {/* 1. İKON ve BAŞLIK ALANI */}
                <div className="flex flex-col items-center relative z-10 w-full">
                  
                  {/* İkon Çemberi */}
                  <div 
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 relative ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/30' 
                        : isCurrent 
                          ? 'bg-primary-600 border-primary-600 text-white shadow-xl shadow-primary-600/40 scale-110 ring-4 ring-primary-100 dark:ring-primary-900/40' 
                          : 'bg-surface-50 dark:bg-surface-100 border-surface-200 dark:border-surface-200 text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7 stroke-[3]" />
                    ) : isCurrent ? (
                      <PlayCircle className="w-7 h-7 fill-white/20 animate-pulse" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}

                    {/* Küçük Durum Badge'i (Sağ üst köşe) */}
                    {isCurrent && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-surface-50 animate-ping"></span>
                    )}
                  </div>

                  {/* Başlık ve Detay */}
                  <div className={`mt-4 text-center flex flex-col items-center transition-all duration-300 ${isCurrent ? '-translate-y-1' : ''}`}>
                    <span className={`text-sm font-bold tracking-tight mb-1 ${
                      isCurrent ? 'text-primary-700 dark:text-primary-400 text-base' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {stage.name}
                    </span>
                    
                    {/* Aktif Alt Görev Göstergesi */}
                    {isCurrent && currentSubTask ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/50 mt-1 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></div>
                        <span className="text-[11px] font-semibold text-primary-700 dark:text-primary-300 whitespace-nowrap max-w-[120px] truncate">
                          {currentSubTask.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 font-medium">
                        {stage.details.filter(d => d.is_completed).length}/{stage.sub_stages.length} Adım
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. BAĞLANTI ÇİZGİSİ (Son eleman hariç) */}
                {index < stagesData.length - 1 && (
                  <div className="absolute top-7 left-[50%] w-full h-1 -z-0">
                    {/* Gri Arkaplan Çizgisi */}
                    <div className="absolute top-0 left-0 w-full h-full bg-surface-200 dark:bg-surface-100 rounded-full"></div>
                    {/* Renkli İlerleme Çizgisi */}
                    <div 
                      className={`absolute top-0 left-0 h-full bg-green-500 rounded-full transition-all duration-1000 ease-out ${
                        isCompleted ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- DETAYLI AKORDİON LİSTESİ --- */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-6">
        <div className="flex items-center gap-3 mb-6 p-2 bg-surface-50 dark:bg-surface-100/50 rounded-xl border border-surface-100 dark:border-surface-100/10">
          <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg text-primary-600 dark:text-primary-300">
            <LayoutList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detaylı Görev Listesi</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Proje aşamalarının detaylarını buradan yönetebilirsiniz.</p>
          </div>
        </div>
        
        <div className="space-y-4"> 
          <Accordion initialIndex={activeStageIndex !== -1 ? activeStageIndex : 0}> 
            {stagesData.map((stage) => {
              const completedSubStagesCount = stage.sub_stages.filter(ss => 
                stage.details.some(d => d.sub_stage_id === ss.id && d.is_completed)
              ).length;
              const isStageCompleted = stage.sub_stages.length > 0 && completedSubStagesCount === stage.sub_stages.length;
              
              const stageStatusIcon = isStageCompleted
                ? <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />
                : <Circle className="w-6 h-6 text-primary-500 dark:text-primary-400" />;

              return (
                <AccordionItem
                  key={stage.id}
                  title={
                    <div className="flex items-center gap-4 py-2 w-full">
                      {stageStatusIcon}
                      <span className={`font-semibold text-lg ${isStageCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-200'}`}>
                        {stage.name}
                      </span>
                      {stage.sub_stages.length > 0 && (
                        <div className="ml-auto mr-4 flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-surface-200 dark:bg-surface-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 transition-all duration-500" 
                              style={{ width: `${(completedSubStagesCount / stage.sub_stages.length) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            isStageCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {completedSubStagesCount}/{stage.sub_stages.length}
                          </span>
                        </div>
                      )}
                    </div>
                  }
                  isOpen={false}
                  onToggle={() => {}} 
                >
                  <div className="space-y-3 pt-4 px-2">
                    {stage.sub_stages.length === 0 ? (
                      <div className="flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-100 rounded-xl border border-dashed border-surface-200 dark:border-surface-200">
                        <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Bu aşama için alt görev tanımlanmamış.</p>
                      </div>
                    ) : (
                      stage.sub_stages.map((subStage) => {
                        const isSubCompleted = stage.details.some(
                            d => d.sub_stage_id === subStage.id && d.is_completed
                        );
                        
                        return (
                          <div
                            key={subStage.id}
                            onClick={() => handleSubStageClick(stage, subStage)}
                            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border group relative overflow-hidden ${
                              isSubCompleted
                                ? 'bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-800 hover:border-green-300'
                                : 'bg-white dark:bg-surface-50 border-surface-200 dark:border-surface-100 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
                            }`}
                          >
                            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
                              isSubCompleted ? 'bg-green-500' : 'bg-transparent group-hover:bg-primary-500'
                            }`} />

                            <div className="flex items-center gap-4 pl-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isSubCompleted 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300 dark:border-gray-600 group-hover:border-primary-500 bg-white dark:bg-surface-50'
                              }`}>
                                {isSubCompleted ? <Check className="w-3.5 h-3.5 text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-primary-500 transition-colors" />}
                              </div>
                              <span className={`font-medium transition-colors ${
                                isSubCompleted ? 'text-green-800 dark:text-green-300 line-through opacity-70' : 'text-gray-700 dark:text-gray-200 group-hover:text-primary-700 dark:group-hover:text-primary-300'
                              }`}>
                                {subStage.name}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                               <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-surface-100 dark:bg-surface-200 text-gray-500 dark:text-gray-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                                 <span className="hidden sm:inline">Yönet</span> 
                                 <ChevronRight className='w-3.5 h-3.5' />
                               </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>

      <CustomDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        title={activeSubStage ? activeSubStage.subStageName : ''}
        size="lg"
      >
        {activeSubStage ? (
          <SubStageDetail
            projectId={activeSubStage.projectId}
            stageId={activeSubStage.stageId}
            subStageId={activeSubStage.subStageId}
            stageName={activeSubStage.stageName}
            subStageName={activeSubStage.subStageName}
            onUpdate={handleSubStageUpdate}
          />
        ) : (
            <div /> 
        )}
      </CustomDrawer>
    </div>
  );
}