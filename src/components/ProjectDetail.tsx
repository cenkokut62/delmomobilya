import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useRBAC } from '../contexts/RBACContext';
// Rich Text Editor Importları
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { 
  ArrowLeft, 
  LayoutDashboard, 
  ListTodo, 
  CreditCard, 
  Files, 
  Calendar, 
  Briefcase, 
  StickyNote, 
  Pencil, 
  Save, 
  X, 
  Loader2, 
  Wallet,
  Activity,
  PhoneCall,
  Send,
  Building2,
  Hash,
  FileText,
  Download,
  Phone,
  Mail
} from 'lucide-react';
import { ProjectTimeline } from './ProjectTimeline';
import { PaymentManager } from './PaymentManager';
import { ProjectActivities } from './ProjectActivities';
import { Accordion, AccordionItem } from './ui/Accordion';

// --- TİPLER ---
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
  notes: string | null;
  stages: Stage | null; 
  sub_stages: SubStage | null;
  payments: { amount: number }[];
}

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onUpdate: () => void;
}

type TabType = 'overview' | 'timeline' | 'payments' | 'files';

export function ProjectDetail({ projectId, onBack, onUpdate }: ProjectDetailProps) {
  const { addToast } = useToast();
  const { hasPermission } = useRBAC();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [projectFiles, setProjectFiles] = useState<any[]>([]);
  
  // Not Düzenleme State'leri
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // İlerleme ve Finansal Hesaplamalar
  const [totalStages, setTotalStages] = useState(0);
  const [currentStageOrder, setCurrentStageOrder] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  // Quill Editor Konfigürasyonu
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'], // Kalın, İtalik, Altı Çizili
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Listeler
      ['clean'] // Biçimlendirmeyi temizle
    ],
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        stages!current_stage_id (name, order_index),
        sub_stages!current_sub_stage_id (name),
        payments (amount)
      `)
      .eq('id', projectId)
      .maybeSingle();

    const { data: stagesData } = await supabase.from('stages').select('id, order_index');
    if (stagesData) setTotalStages(stagesData.length);

    if (error) console.error("Proje yükleme hatası:", error);

    if (data) {
      const stageData = Array.isArray(data.stages) ? data.stages[0] : data.stages;
      const subStageData = Array.isArray(data.sub_stages) ? data.sub_stages[0] : data.sub_stages;
      
      const paid = data.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
      setTotalPaid(paid);

      setProject({ 
          ...data, 
          stages: stageData as any,
          sub_stages: subStageData as SubStage
      });
      setNoteContent(data.notes || '');
      setCurrentStageOrder(stageData?.order_index || 0);
    }
    setLoading(false);
  };

  const progressPercentage = totalStages > 0 ? Math.round((currentStageOrder / totalStages) * 100) : 0;
  const financialPercentage = project && project.total_amount > 0 ? Math.round((totalPaid / project.total_amount) * 100) : 0;

  // Dosyaları Yükle
  useEffect(() => {
      if (activeTab === 'files') {
          const loadFiles = async () => {
            try {
              const { data, error } = await supabase
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
              
              if (error) throw error;
              if (data) setProjectFiles(data);
            } catch (err) {
              console.error("Dosya yükleme hatası:", err);
              setProjectFiles([]);
            }
          };
          loadFiles();
      }
  }, [activeTab, projectId]);

  const groupedFiles = useMemo(() => {
    if (!projectFiles || projectFiles.length === 0) return {};
    return projectFiles.reduce((acc: Record<string, any[]>, file: any) => {
      const stageDetails = Array.isArray(file.sub_stage_details) ? file.sub_stage_details[0] : file.sub_stage_details;
      const stages = stageDetails?.stages;
      const stageName = Array.isArray(stages) ? stages[0]?.name : stages?.name || 'Diğer';
      if (!acc[stageName]) acc[stageName] = [];
      acc[stageName].push(file);
      return acc;
    }, {});
  }, [projectFiles]);

  const handleDownload = (path: string) => {
      const url = `${supabase.storage.url}/object/public/project-files/${path}`;
      window.open(url, '_blank');
  };

  const handleSaveNote = async () => {
    if (!project) return;
    setSavingNote(true);

    const { error } = await supabase
        .from('projects')
        .update({ notes: noteContent, updated_at: new Date().toISOString() })
        .eq('id', project.id);

    if (error) {
        addToast('error', 'Not kaydedilirken hata oluştu.');
    } else {
        setProject({ ...project, notes: noteContent });
        setIsEditingNote(false);
        addToast('success', 'Proje notları güncellendi.');
    }
    setSavingNote(false);
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <button 
                onClick={onBack} 
                className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 mb-2 transition-colors"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                Projeler Listesine Dön
            </button>
            <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.customer_name}</h1>
                <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold uppercase tracking-wider border border-primary-200 dark:border-primary-800">
                    {project.stages?.name || 'Başlangıç'}
                </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5" /> Proje ID: <span className="font-mono">{project.id.slice(0, 8)}</span>
            </p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-100 rounded-xl shadow-sm whitespace-nowrap">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">Oluşturma</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{new Date(project.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-100 rounded-xl shadow-sm whitespace-nowrap">
                <Activity className="w-4 h-4 text-green-500" />
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase font-bold">İlerleme</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">%{progressPercentage}</span>
                </div>
            </div>
            
            {hasPermission('can_view_financials') && (
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-0 dark:bg-surface-50 border border-surface-200 dark:border-surface-100 rounded-xl shadow-sm whitespace-nowrap">
                    <Wallet className="w-4 h-4 text-primary-500" />
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Bütçe</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">₺{project.total_amount.toLocaleString('tr-TR')}</span>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* --- SEKMELER --- */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-1.5 mb-8 flex overflow-x-auto gap-1">
        {[
            { id: 'overview', icon: LayoutDashboard, label: 'Genel Bakış', visible: true },
            { id: 'timeline', icon: ListTodo, label: 'Süreç Yönetimi', visible: true },
            { id: 'payments', icon: CreditCard, label: 'Ödemeler', visible: hasPermission('can_view_financials') },
            { id: 'files', icon: Files, label: 'Dosyalar', visible: true }
        ].filter(tab => tab.visible).map(tab => (
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

      {/* --- ANA İÇERİK --- */}
      <div className="space-y-6">
        
        {/* TAB 1: GENEL BAKIŞ */}
        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in items-start">
                
                {/* SOL BÜYÜK BLOK */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    
                    {/* ÜST SATIR: Müşteri ve Finans */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[380px]">
                        
                        {/* 1. MÜŞTERİ KARTI */}
                        <div className={`bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 relative overflow-hidden group flex flex-col h-full ${!hasPermission('can_view_financials') ? 'md:col-span-2' : ''}`}>
                            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-primary-600 to-blue-500 opacity-5"></div>
                            <div className="relative z-10 flex flex-col items-center text-center mt-2 flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-surface-100 p-1 shadow-lg mb-3 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-100 to-blue-200 dark:from-primary-900 dark:to-blue-800 flex items-center justify-center text-xl font-bold text-primary-700 dark:text-primary-300">
                                        {project.customer_name.charAt(0)}
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{project.customer_name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> Müşteri Profili
                                </p>
                            </div>

                            <div className="mt-4 space-y-2 flex-1 overflow-hidden">
                                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                                    <div className="p-1.5 bg-gray-50 dark:bg-surface-100 rounded-lg text-gray-500"><Phone className="w-3.5 h-3.5" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-[10px] text-gray-400 font-medium uppercase">Telefon</p><p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{project.phone}</p></div>
                                </div>
                                <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                                    <div className="p-1.5 bg-gray-50 dark:bg-surface-100 rounded-lg text-gray-500"><Mail className="w-3.5 h-3.5" /></div>
                                    <div className="flex-1 min-w-0"><p className="text-[10px] text-gray-400 font-medium uppercase">E-posta</p><p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{project.email || '-'}</p></div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto pt-4">
                                <a href={`tel:${project.phone}`} className="flex-1 py-2 rounded-lg bg-primary-50 dark:bg-surface-100 hover:bg-primary-100 dark:hover:bg-surface-200 text-primary-700 dark:text-primary-300 transition-colors flex items-center justify-center gap-2 text-xs font-bold"><PhoneCall className="w-3.5 h-3.5" /> Ara</a>
                                <a href={`mailto:${project.email}`} className="flex-1 py-2 rounded-lg bg-surface-50 dark:bg-surface-100 hover:bg-surface-100 dark:hover:bg-surface-200 text-gray-600 dark:text-gray-300 transition-colors flex items-center justify-center gap-2 text-xs font-bold border border-surface-200 dark:border-surface-200"><Send className="w-3.5 h-3.5" /> Mail</a>
                            </div>
                        </div>

                        {/* 2. FİNANSAL DURUM KARTI */}
                        {hasPermission('can_view_financials') && (
                            <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400"><Wallet className="w-4 h-4" /></div>
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100">Finansal</h3>
                                    </div>
                                    <div className="relative w-10 h-10 flex items-center justify-center">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-surface-100 dark:text-surface-200" />
                                            <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={100} strokeDashoffset={100 - (100 * financialPercentage) / 100} className="text-green-500 transition-all duration-1000" strokeLinecap="round" />
                                        </svg>
                                        <span className="absolute text-[8px] font-bold text-gray-700 dark:text-gray-300">%{financialPercentage}</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-3">
                                    <div className="flex justify-between items-center p-2.5 bg-surface-50 dark:bg-surface-100 rounded-xl"><span className="text-xs font-medium text-gray-500">Toplam</span><span className="text-sm font-bold text-gray-900 dark:text-gray-100">₺{project.total_amount.toLocaleString('tr-TR')}</span></div>
                                    <div className="flex justify-between items-center p-2.5 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30"><span className="text-xs font-medium text-green-700 dark:text-green-400">Ödenen</span><span className="text-sm font-bold text-green-700 dark:text-green-400">₺{totalPaid.toLocaleString('tr-TR')}</span></div>
                                    <div className="flex justify-between items-center p-2.5 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30"><span className="text-xs font-medium text-red-700 dark:text-red-400">Kalan</span><span className="text-sm font-bold text-red-700 dark:text-red-400">₺{(project.total_amount - totalPaid).toLocaleString('tr-TR')}</span></div>
                                </div>
                                <button onClick={() => setActiveTab('payments')} className="w-full mt-4 py-2 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-dashed border-primary-200 dark:border-primary-800">Ödeme Detaylarını Yönet</button>
                            </div>
                        )}
                    </div>

                    {/* ALT SATIR: Aşama ve Notlar (Sabit Yükseklik: 280px) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[280px]">
                        {/* 3. AŞAMA KARTI */}
                        <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400"><Briefcase className="w-4 h-4" /></div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Proje Aşaması</h3>
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Aktif Süreç</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">{project.stages?.name}</p>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{project.sub_stages?.name || 'Alt aşama yok'}</p>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Tamamlanma</span><span className="font-bold text-primary-600 dark:text-primary-400">%{progressPercentage}</span></div>
                                <div className="w-full bg-surface-100 dark:bg-surface-200 rounded-full h-2 overflow-hidden"><div className="bg-primary-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div></div>
                                <div className="flex justify-between mt-4 pt-4 border-t border-surface-100 dark:border-surface-100/10">
                                    <div><p className="text-[10px] text-gray-400 uppercase">Başlangıç</p><p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{new Date(project.created_at).toLocaleDateString('tr-TR')}</p></div>
                                    <div className="text-right"><p className="text-[10px] text-gray-400 uppercase">Son İşlem</p><p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{new Date(project.updated_at).toLocaleDateString('tr-TR')}</p></div>
                                </div>
                            </div>
                        </div>

                        {/* 4. NOTLAR KARTI (Zengin Metin Editörü Güncellemesi) */}
                        <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col h-full relative group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400"><StickyNote className="w-4 h-4" /></div>
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Özel Notlar</h3>
                                </div>
                                {!isEditingNote && <button onClick={() => setIsEditingNote(true)} className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-100 rounded-lg text-gray-400 hover:text-primary-600 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {isEditingNote ? (
                                    <div className="h-full flex flex-col relative">
                                        {/* Editör Container */}
                                        <div className="h-full bg-white dark:bg-surface-100 rounded-xl overflow-hidden flex flex-col pb-10">
                                            <ReactQuill 
                                                theme="snow"
                                                value={noteContent} 
                                                onChange={setNoteContent}
                                                modules={quillModules}
                                                formats={quillFormats}
                                                className="h-full flex flex-col [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 dark:[&_.ql-toolbar]:border-gray-700 [&_.ql-container]:border-0 [&_.ql-container]:flex-1 [&_.ql-editor]:text-sm [&_.ql-editor]:text-gray-700 dark:[&_.ql-editor]:text-gray-300"
                                                placeholder="Notlarınızı buraya yazın..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 absolute bottom-2 right-2 z-50">
                                            <button onClick={() => setIsEditingNote(false)} className="p-1.5 rounded-lg bg-white dark:bg-surface-200 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50"><X className="w-3.5 h-3.5" /></button>
                                            <button onClick={handleSaveNote} disabled={savingNote} className="p-1.5 bg-yellow-400 text-yellow-900 rounded-lg shadow-sm hover:bg-yellow-500 transition-colors">{savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div 
                                        className="h-full overflow-y-auto custom-scrollbar cursor-pointer p-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors"
                                        onClick={() => setIsEditingNote(true)}
                                    >
                                        {project.notes ? (
                                            <div 
                                                className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1"
                                                dangerouslySetInnerHTML={{ __html: project.notes }}
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-gray-400 italic text-xs">Not eklemek için tıklayın.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAĞ BLOK (TIMELINE) */}
                <div className="lg:col-span-1 h-[684px]">
                    <ProjectActivities projectId={projectId} />
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
          <PaymentManager 
            projectId={projectId} 
            totalAmount={project.total_amount} 
            customerDetails={{
                name: project.customer_name,
                phone: project.phone,
                email: project.email,
                address: project.address
            }}
            onUpdate={loadProject}
          />
        )}

        {/* TAB 4: DOSYALAR */}
        {activeTab === 'files' && (
            <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 p-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6 p-2 bg-surface-50 dark:bg-surface-100/50 rounded-xl border border-surface-100 dark:border-surface-100/10">
                    <div className="bg-primary-100 dark:bg-primary-900 p-2 rounded-lg text-primary-600 dark:text-primary-300"><Files className="w-5 h-5" /></div>
                    <div><h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Proje Dosyaları</h3><p className="text-sm text-gray-500 dark:text-gray-400">Tüm proje dokümanları</p></div>
                </div>
                
                {!projectFiles || projectFiles.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-surface-200 dark:border-surface-200 rounded-xl">
                        <Files className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 dark:text-gray-400">Bu projeye henüz dosya yüklenmemiş.</p>
                    </div>
                ) : (
                    <Accordion>
                        {Object.entries(groupedFiles).map(([stageName, files]) => (
                            <AccordionItem key={stageName} title={<div className="flex items-center gap-2"><span className="font-semibold text-gray-900 dark:text-gray-100">{stageName}</span><span className="bg-surface-100 dark:bg-surface-200 text-gray-500 text-xs px-2 py-0.5 rounded-full">{files.length} Dosya</span></div>} isOpen={false} onToggle={()=>{}}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                                    {files.map((file: any) => (
                                        <div key={file.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-100/50 rounded-xl border border-surface-200 dark:border-surface-200 hover:border-primary-300 dark:hover:border-primary-700 transition-colors group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-white dark:bg-surface-200 p-2.5 rounded-lg text-primary-600 shadow-sm border border-surface-100 dark:border-surface-300"><FileText className="w-5 h-5" /></div>
                                                <div className="min-w-0"><p className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{file.file_name}</p><p className="text-xs text-gray-500 flex items-center gap-1"><span>{file.sub_stage_details?.sub_stages?.name}</span><span>•</span><span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span></p></div>
                                            </div>
                                            <button onClick={() => handleDownload(file.file_url)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-white dark:hover:bg-surface-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="İndir"><Download className="w-5 h-5" /></button>
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