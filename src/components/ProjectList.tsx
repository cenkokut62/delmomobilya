import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Filter, 
  SlidersHorizontal, 
  Calendar, 
  MoreVertical, 
  DollarSign, 
  PieChart, 
  TrendingUp,
  ChevronDown,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { ProjectForm } from './ProjectForm';
import { ProjectDetail } from './ProjectDetail';
import { useToast } from '../contexts/ToastContext';

// Tipler
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
  payments: Payment[]; // Join ile gelecek
}

interface Stage {
  id: string;
  name: string;
}

type ViewMode = 'grid' | 'list';
type PaymentStatus = 'all' | 'paid' | 'partial' | 'unpaid';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

export function ProjectList() {
  const { addToast } = useToast();
  
  // Veri State'leri
  const [projects, setProjects] = useState<Project[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State'leri
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filtre State'leri
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
      // Projeleri ve ödemeleri çek
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, payments(amount)')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Aşamaları çek
      const { data: stagesData, error: stagesError } = await supabase
        .from('stages')
        .select('id, name')
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

  // Helper: Ödeme Durumu Hesapla
  const getPaymentStats = (project: Project) => {
    const totalPaid = project.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const percentage = project.total_amount > 0 ? (totalPaid / project.total_amount) * 100 : 0;
    
    let status: PaymentStatus = 'unpaid';
    if (percentage >= 100) status = 'paid';
    else if (percentage > 0) status = 'partial';

    return { totalPaid, percentage, status };
  };

  // Filtreleme ve Sıralama Mantığı
  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        // 1. Metin Arama
        const searchMatch = 
          project.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.phone.includes(searchTerm);
        if (!searchMatch) return false;

        // 2. Aşama Filtresi
        if (selectedStage !== 'all' && project.current_stage_id !== selectedStage) return false;

        // 3. Ödeme Durumu Filtresi
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

  // İstatistikler
  const stats = useMemo(() => {
    const total = projects.length;
    const totalRevenue = projects.reduce((sum, p) => sum + p.total_amount, 0);
    const activeProjects = projects.filter(p => {
       // Son aşamada değilse aktiftir (Basit mantık: son aşamayı 'Tamamlandı' varsayıyoruz veya son index)
       // Burada stages dizisinin son elemanının ID'sine bakabiliriz ama şimdilik stage ID varsa aktif sayalım.
       return p.current_stage_id !== null;
    }).length;

    return { total, totalRevenue, activeProjects };
  }, [projects]);

  const getStageName = (stageId: string | null) => {
    if (!stageId) return 'Belirsiz';
    return stages.find((s) => s.id === stageId)?.name || 'Belirsiz';
  };

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
    <div className="space-y-8">
      {/* --- ÜST İSTATİSTİK PANELİ --- */}
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

      {/* --- FİLTRELEME VE ARAMA ÇUBUĞU --- */}
      <div className="bg-surface-0 dark:bg-surface-50 p-4 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Sol: Arama */}
          <div className={`relative transition-all duration-300 ${isSearchFocused ? 'md:w-96' : 'md:w-64'} w-full`}>
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${isSearchFocused ? 'text-primary-600' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Proje, müşteri veya telefon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Sağ: Filtreler ve Butonlar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto overflow-x-auto">
            
            {/* Aşama Filtresi */}
            <div className="relative group w-full sm:w-auto">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full sm:w-40 appearance-none pl-4 pr-10 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              >
                <option value="all">Tüm Aşamalar</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary-600 transition-colors" />
            </div>

            {/* Ödeme Filtresi */}
            <div className="relative group w-full sm:w-auto">
              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full sm:w-40 appearance-none pl-4 pr-10 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              >
                <option value="all">Ödeme: Tümü</option>
                <option value="paid">Tamamlandı</option>
                <option value="partial">Kısmi</option>
                <option value="unpaid">Ödenmedi</option>
              </select>
              <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-green-600 transition-colors" />
            </div>

            {/* Sıralama */}
            <div className="relative group w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full sm:w-40 appearance-none pl-4 pr-10 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-200 transition-colors"
              >
                <option value="newest">En Yeni</option>
                <option value="oldest">En Eski</option>
                <option value="amount_high">Tutar (Yüksek)</option>
                <option value="amount_low">Tutar (Düşük)</option>
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-hover:text-primary-600 transition-colors" />
            </div>

            <div className="w-[1px] h-8 bg-surface-200 dark:bg-surface-100 hidden sm:block mx-1"></div>

            {/* Yeni Proje Butonu */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:scale-95 transition-all shadow-lg shadow-primary-600/25 flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Yeni Proje</span>
              <span className="sm:hidden">Ekle</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- PROJE LİSTESİ (KARTLAR) --- */}
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
            Aradığınız kriterlere uygun proje bulunmamaktadır. Filtreleri temizlemeyi veya yeni bir proje oluşturmayı deneyin.
          </p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedStage('all'); setSelectedPaymentStatus('all'); }}
            className="mt-6 text-primary-600 hover:text-primary-700 font-medium hover:underline"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {filteredProjects.map((project) => {
            const paymentStats = getPaymentStats(project);
            
            return (
              <div
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className="group bg-surface-0 dark:bg-surface-50 rounded-2xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 hover:shadow-xl hover:-translate-y-1 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 cursor-pointer relative overflow-hidden"
              >
                {/* Üst Dekorasyon Çizgisi */}
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
                  
                  {/* Ödeme İlerleme Çubuğu */}
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
                    {getStageName(project.current_stage_id)}
                  </span>
                  
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Detaylar <ChevronDown className="w-4 h-4 -rotate-90" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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