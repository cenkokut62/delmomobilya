import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Filter, 
  SlidersHorizontal, 
  DollarSign, 
  PieChart, 
  TrendingUp, 
  LayoutGrid, 
  List as ListIcon, 
  User, 
  Calendar, 
  BarChart3, 
  CreditCard, 
  Phone, 
  ArrowRight,
  CheckCircle2,
  Clock,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { ProjectForm } from './ProjectForm';
import { ProjectDetail } from './ProjectDetail';
import { useToast } from '../contexts/ToastContext';
import { CustomSelect } from './ui/CustomSelect'; 

interface Payment {
  amount: number;
}

interface Project {
  id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  address: string;
  total_amount: number;
  current_stage_id: string | null;
  created_at: string;
  payments: Payment[];
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
}

type ViewMode = 'grid' | 'list';
type PaymentStatus = 'all' | 'paid' | 'partial' | 'unpaid';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

export function ProjectList() {
  const { addToast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list'); 
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<PaymentStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, payments(amount)')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('id, name, order_index')
        .order('order_index');

      if (stagesError) throw stagesError;

      setProjects(projectsData || []);
      setStages(stagesData || []);
    } catch (error: any) {
      console.error('Veri yükleme hatası:', error);
      addToast('error', 'Projeler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStats = (project: Project) => {
    const totalPaid = project.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const percentage = project.total_amount > 0 ? (totalPaid / project.total_amount) * 100 : 0;
    
    let status: PaymentStatus = 'unpaid';
    if (percentage >= 99.9) status = 'paid'; 
    else if (percentage > 0) status = 'partial';

    return { totalPaid, percentage, status };
  };

  const getStageProgress = (stageId: string | null) => {
    if (!stageId || stages.length === 0) return 0;
    const stageIndex = stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return 0;
    return Math.round(((stageIndex + 1) / stages.length) * 100);
  };

  const getStageName = (stageId: string | null) => {
    if (!stageId) return 'Başlangıç';
    return stages.find((s) => s.id === stageId)?.name || 'Bilinmiyor';
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const searchMatch = 
          project.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.phone.includes(searchTerm);
        if (!searchMatch) return false;

        if (selectedStage !== 'all' && project.current_stage_id !== selectedStage) return false;

        if (selectedPaymentStatus !== 'all') {
          const { status } = getPaymentStats(project);
          if (status !== selectedPaymentStatus) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'amount_high': return b.total_amount - a.total_amount;
          case 'amount_low': return a.total_amount - b.total_amount;
          default: return 0;
        }
      });
  }, [projects, searchTerm, selectedStage, selectedPaymentStatus, sortBy]);

  const stats = useMemo(() => {
    const total = projects.length;
    const totalRevenue = projects.reduce((sum, p) => sum + p.total_amount, 0);
    const activeProjects = projects.length; 
    return { total, totalRevenue, activeProjects };
  }, [projects]);

  if (selectedProjectId) {
    return (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setSelectedProjectId(null)}
        onUpdate={loadData}
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Proje</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toplam Hacim</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              ₺{(stats.totalRevenue / 1000).toFixed(1)}k
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-center justify-between group hover:shadow-md transition-all">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktif İşler</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.activeProjects}</h3>
          </div>
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-surface-0 dark:bg-surface-50 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        
        <div className={`relative transition-all duration-300 w-full ${isSearchFocused ? 'xl:w-96' : 'xl:w-72'}`}>
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${isSearchFocused ? 'text-primary-600' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Proje, müşteri veya telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-gray-100 text-sm"
          />
        </div>

        {/* DÜZELTİLEN KISIM: overflow-x-auto kaldırıldı, flex-wrap eklendi */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto flex-wrap pb-2 sm:pb-0">
          
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="w-full sm:w-48">
                <CustomSelect
                    value={selectedStage}
                    onChange={setSelectedStage}
                    options={[
                        { value: 'all', label: 'Tüm Aşamalar' },
                        ...stages.map(s => ({ value: s.id, label: s.name }))
                    ]}
                    icon={<Filter className="w-4 h-4" />}
                />
            </div>

            <div className="w-full sm:w-48">
                <CustomSelect
                    value={selectedPaymentStatus}
                    onChange={(val) => setSelectedPaymentStatus(val as PaymentStatus)}
                    options={[
                        { value: 'all', label: 'Ödeme: Tümü' },
                        { value: 'paid', label: 'Tamamlandı' },
                        { value: 'partial', label: 'Kısmi' },
                        { value: 'unpaid', label: 'Ödenmedi' },
                    ]}
                    icon={<DollarSign className="w-4 h-4" />}
                />
            </div>

            <div className="w-full sm:w-48">
                <CustomSelect
                    value={sortBy}
                    onChange={(val) => setSortBy(val as SortOption)}
                    options={[
                        { value: 'newest', label: 'En Yeni' },
                        { value: 'oldest', label: 'En Eski' },
                        { value: 'amount_high', label: 'Tutar (Yüksek)' },
                        { value: 'amount_low', label: 'Tutar (Düşük)' },
                    ]}
                    icon={<SlidersHorizontal className="w-4 h-4" />}
                />
            </div>
          </div>

          <div className="w-[1px] h-8 bg-surface-200 dark:bg-surface-100 hidden sm:block mx-1"></div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex bg-surface-50 dark:bg-surface-100 p-1 rounded-lg border border-surface-200 dark:border-surface-200">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    <ListIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-surface-50 text-primary-600 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex-1 sm:flex-none px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 font-semibold text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Yeni Proje
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Projeler yükleniyor...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-surface-50 dark:bg-surface-100 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Proje Bulunamadı</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm">
            Aradığınız kriterlere uygun proje bulunmamaktadır.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedStage('all'); setSelectedPaymentStatus('all'); }}
            className="mt-6 text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <>
            {viewMode === 'list' ? (
                <div className="overflow-hidden bg-surface-0 dark:bg-surface-50 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-100 bg-surface-50/50 dark:bg-surface-100/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" /> Müşteri / İletişim
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Tarih
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4" /> Proje Aşaması
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[180px]">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" /> Finansal Durum
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        İşlem
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-100/10">
                                {filteredProjects.map((project) => {
                                    const paymentStats = getPaymentStats(project);
                                    const stageProgress = getStageProgress(project.current_stage_id);
                                    const stageName = getStageName(project.current_stage_id);

                                    return (
                                        <tr 
                                            key={project.id} 
                                            onClick={() => setSelectedProjectId(project.id)}
                                            className="group hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm border border-primary-200 dark:border-primary-800">
                                                        {project.customer_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                            {project.customer_name}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                            <Phone className="w-3 h-3" /> {project.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        {new Date(project.created_at).toLocaleDateString('tr-TR')}
                                                    </span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Oluşturuldu
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="w-full max-w-[240px]">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                                            {stageName}
                                                        </span>
                                                        <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                                                            %{stageProgress}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-surface-200 dark:bg-surface-200 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className="bg-primary-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                                                            style={{ width: `${stageProgress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        ₺{project.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {paymentStats.status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                                <CheckCircle2 className="w-3 h-3" /> Ödendi
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-2 w-full max-w-[120px]">
                                                                <div className="flex-1 bg-surface-200 dark:bg-surface-200 h-1.5 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full ${paymentStats.status === 'partial' ? 'bg-orange-500' : 'bg-red-500'}`}
                                                                        style={{ width: `${paymentStats.percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] text-gray-500">%{paymentStats.percentage.toFixed(0)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-100 transition-all group-hover:translate-x-1">
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {filteredProjects.map((project) => {
                    const paymentStats = getPaymentStats(project);
                    const stageName = getStageName(project.current_stage_id);
                    
                    return (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className="group bg-surface-0 dark:bg-surface-50 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 cursor-pointer relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                              {project.customer_name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{new Date(project.created_at).toLocaleDateString('tr-TR')}</span>
                            </div>
                          </div>
                          <div className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-surface-100 dark:hover:bg-surface-100 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Proje Bedeli</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              ₺{project.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className={`${paymentStats.status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                                {paymentStats.status === 'paid' ? 'Ödeme Tamamlandı' : 'Ödeme Durumu'}
                              </span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">%{paymentStats.percentage.toFixed(0)}</span>
                            </div>
                            <div className="w-full h-2 bg-surface-100 dark:bg-surface-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${
                                  paymentStats.status === 'paid' ? 'bg-green-500' : 
                                  paymentStats.status === 'partial' ? 'bg-orange-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${Math.min(paymentStats.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-100/10">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {stageName}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            Detaylar <ChevronRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
            )}
        </>
      )}

      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            loadData();
            addToast('success', 'Yeni proje başarıyla oluşturuldu.');
          }}
        />
      )}
    </div>
  );
}