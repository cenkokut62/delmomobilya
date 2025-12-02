import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  LayoutDashboard, 
  ListTodo, 
  CreditCard, 
  Files, 
  FileText, 
  Download,
  Calendar,
  Clock,
  Briefcase,
  Hash,
  CheckCircle2
} from 'lucide-react';
import { ProjectTimeline } from './ProjectTimeline';
import { PaymentManager } from './PaymentManager';
import { Accordion, AccordionItem } from './ui/Accordion';

// Tipler
interface Stage { name: string; }
interface SubStage { name: string; }

interface Project {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number;
  current_stage_id: string | null;
  current_sub_stage_id: string | null;
  created_at: string;
  updated_at: string;
  stages: Stage | null; 
  sub_stages: SubStage | null;
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onUpdate: () => void;
}

type TabType = 'overview' | 'timeline' | 'payments' | 'files';

export function ProjectDetail({ projectId, onBack, onUpdate }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Varsayılan: Genel Bakış
  const [projectFiles, setProjectFiles] = useState<any[]>([]);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    // İlişkili verileri (stages, sub_stages) çekiyoruz
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        stages!current_stage_id (name),
        sub_stages!current_sub_stage_id (name)
      `)
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
        console.error("Proje yükleme hatası:", error);
    }

    if (data) {
      // Supabase'den gelen dizi/obje yapısını güvenli hale getiriyoruz
      const stageData = Array.isArray(data.stages) ? data.stages[0] : data.stages;
      const subStageData = Array.isArray(data.sub_stages) ? data.sub_stages[0] : data.sub_stages;
      
      setProject({ 
          ...data, 
          stages: stageData as Stage,
          sub_stages: subStageData as SubStage
      });
    }
    setLoading(false);
  };

  // Dosyaları Yükle (Sadece Files tabı aktifse)
  useEffect(() => {
      if (activeTab === 'files') {
          const loadFiles = async () => {
            const { data } = await supabase
              .from('sub_stage_files')
              .select(`
                id, file_name, file_url, created_at,
                sub_stage_details!inner (
                    project_id,
                    sub_stages (name),
                    stages (name)
                )
              `)
              .eq('sub_stage_details.project_id', projectId);
            
            if (data) setProjectFiles(data);
          };
          loadFiles();
      }
  }, [activeTab, projectId]);

  const handleDownload = (path: string) => {
      const url = `${supabase.storage.url}/object/public/project-files/${path}`;
      window.open(url, '_blank');
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500 animate-pulse">Proje detayları yükleniyor...</p>
    </div>
  );

  if (!project) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <Files className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Proje Bulunamadı</h3>
        <p className="text-gray-500 mt-2">Aradığınız proje silinmiş veya taşınmış olabilir.</p>
        <button onClick={onBack} className="mt-6 text-primary-600 font-medium hover:underline">Geri Dön</button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* --- HEADER --- */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
            onClick={onBack} 
            className="self-start flex items-center gap-2 px-4 py-2.5 bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-100 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-surface-50 dark:hover:bg-surface-100 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
          <span className="font-medium">Listeye Dön</span>
        </button>
        
        <div className="text-left sm:text-right">
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="px-2.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider border border-primary-100 dark:border-primary-800">
                {project.stages?.name || 'Taslak'}
            </span>
            {project.sub_stages?.name && (
                <>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{project.sub_stages.name}</span>
                </>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{project.customer_name}</h1>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-1.5 mb-8 flex overflow-x-auto gap-1">
        {[
            { id: 'overview', icon: LayoutDashboard, label: 'Genel Bakış' },
            { id: 'timeline', icon: ListTodo, label: 'Süreç Yönetimi' },
            { id: 'payments', icon: CreditCard, label: 'Ödemeler' },
            { id: 'files', icon: Files, label: 'Dosyalar' }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 min-w-[140px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20 transform scale-[1.02]' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-surface-50 dark:hover:bg-surface-100 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
                <tab.icon className={`w-4.5 h-4.5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} /> 
                {tab.label}
            </button>
        ))}
      </div>

      {/* --- CONTENT --- */}
      <div className="space-y-6">
        
        {/* TAB 1: GENEL BAKIŞ (MODERN) */}
        {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
                
                {/* Üst Bilgi Kartları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bütçe Kartı */}
                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <p className="text-primary-100 text-sm font-medium mb-1">Toplam Proje Bedeli</p>
                            <h3 className="text-3xl font-bold tracking-tight">₺{project.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
                            <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Finansal Özet</span>
                            </div>
                        </div>
                    </div>

                    {/* Tarih Kartı */}
                    <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col justify-between group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Başlangıç Tarihi</p>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary-600" />
                                {new Date(project.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </h3>
                        </div>
                        <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-100/10">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Son Güncelleme: {new Date(project.updated_at).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                    </div>

                    {/* Durum Kartı */}
                    <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col justify-between group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Proje Durumu</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.stages?.name}</h3>
                                    <p className="text-xs text-gray-500">{project.sub_stages?.name || 'Alt aşama yok'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-surface-100 dark:bg-surface-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Alt Kısım: Müşteri Kartı ve Detaylar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Sol: Müşteri Bilgileri */}
                    <div className="lg:col-span-2 bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 overflow-hidden">
                        <div className="p-6 border-b border-surface-200 dark:border-surface-100 flex items-center justify-between bg-surface-50/50 dark:bg-surface-100/50">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <User className="w-5 h-5 text-primary-600" /> Müşteri Bilgileri
                            </h3>
                            <span className="text-xs font-mono text-gray-400 bg-surface-100 dark:bg-surface-200 px-2 py-1 rounded">ID: {project.id.slice(0, 8)}</span>
                        </div>
                        
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Avatar Placeholder */}
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-blue-200 dark:from-primary-900 dark:to-blue-900 flex items-center justify-center text-3xl font-bold text-primary-700 dark:text-primary-300 shadow-inner flex-shrink-0">
                                    {project.customer_name.charAt(0)}
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ad Soyad</label>
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{project.customer_name}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Telefon</label>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <p className="text-base font-medium text-gray-900 dark:text-gray-100">{project.phone}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">E-posta</label>
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <p className="text-base font-medium text-gray-900 dark:text-gray-100">{project.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Konum</label>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            <p className="text-base font-medium text-gray-900 dark:text-gray-100 leading-snug">{project.address}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ: Hızlı Notlar / Ekstra Bilgi (Opsiyonel alan) */}
                    <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-6 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-surface-50 dark:bg-surface-100 rounded-full flex items-center justify-center mb-4">
                            <Hash className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Proje Notları</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Bu proje için henüz özel bir not eklenmemiş. Süreç yönetimi sekmesinden detaylı notlar ekleyebilirsiniz.
                        </p>
                        <button 
                            onClick={() => setActiveTab('timeline')}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            Süreç Yönetimine Git &rarr;
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* TAB 2: SÜREÇ YÖNETİMİ */}
        {activeTab === 'timeline' && (
          <ProjectTimeline 
            projectId={projectId} 
            currentStageId={project.current_stage_id} 
            currentSubStageId={project.current_sub_stage_id} 
            onStageChange={() => { loadProject(); onUpdate(); }} 
          />
        )}

        {/* TAB 3: ÖDEMELER */}
        {activeTab === 'payments' && (
          <PaymentManager projectId={projectId} totalAmount={project.total_amount} />
        )}

        {/* TAB 4: DOSYALAR */}
        {activeTab === 'files' && (
            <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 p-2 bg-surface-50 dark:bg-surface-100/50 rounded-xl border border-surface-100 dark:border-surface-100/10">
                    <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg text-primary-600 dark:text-primary-300">
                        <Files className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Proje Dosyaları</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Tüm proje dosyalarına buradan erişebilirsiniz.</p>
                    </div>
                </div>
                
                {projectFiles.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-surface-200 dark:border-surface-200 rounded-xl">
                        <Files className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">Bu projeye henüz dosya yüklenmemiş.</p>
                        <p className="text-xs text-gray-400 mt-1">Süreç yönetimi sekmesinden ilgili aşamaya dosya ekleyebilirsiniz.</p>
                    </div>
                ) : (
                    <Accordion>
                        {Object.entries(projectFiles.reduce((acc, file) => {
                            const stageName = file.sub_stage_details?.stages?.name || 'Diğer';
                            if (!acc[stageName]) acc[stageName] = [];
                            acc[stageName].push(file);
                            return acc;
                        }, {} as Record<string, any[]>)).map(([stageName, files]) => (
                            <AccordionItem 
                                key={stageName} 
                                title={
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{stageName}</span>
                                        <span className="bg-surface-100 dark:bg-surface-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">{files.length} Dosya</span>
                                    </div>
                                } 
                                isOpen={false} 
                                onToggle={()=>{}}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                    {files.map((file: any) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-100/50 rounded-xl border border-surface-200 dark:border-surface-200 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-white dark:bg-surface-200 p-2 rounded-lg text-primary-600 shadow-sm border border-surface-100 dark:border-surface-300">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{file.file_name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <span>{file.sub_stage_details?.sub_stages?.name}</span>
                                                        <span>•</span>
                                                        <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleDownload(file.file_url)}
                                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-surface-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="İndir"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        )}
      </div>
    </div>
  );
}