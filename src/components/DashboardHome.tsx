import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, Users, Briefcase, Activity, 
  Clock, CheckCircle2, AlertCircle, ArrowRight, Wallet
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  completedTasks: number;
  pendingTasks: number;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  activity_type: string;
  user_name?: string;
}

interface StageDistribution {
  name: string;
  count: number;
  color: string;
}

export function DashboardHome({ onChangeView }: { onChangeView: (view: any) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    monthlyRevenue: 0,
    monthlyExpense: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stageDist, setStageDist] = useState<StageDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    try {
      // 1. Kullanıcı Bilgisi
      const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user!.id).single();
      if (profile) setUserName(profile.first_name || '');

      // 2. Proje İstatistikleri
      const { data: projects } = await supabase.from('projects').select('id, current_stage_id, stages(name)');
      const { data: stages } = await supabase.from('stages').select('id, name').order('order_index');
      
      // 3. Finansal Veriler (Bu Ay)
      const { data: payments } = await supabase.from('payments').select('amount').gte('payment_date', startOfMonth);
      const { data: expenses } = await supabase.from('expenses').select('amount').gte('expense_date', startOfMonth);

      // 4. Son Aktiviteler
      const { data: recentActivities } = await supabase
        .from('project_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      // --- HESAPLAMALAR ---
      
      // Proje Sayıları
      const totalProjects = projects?.length || 0;
      // "Tamamlandı" dışındaki her şey aktif kabul edilebilir veya stage ismine göre filtreleyebilirsiniz
      const activeProjects = projects?.filter(p => p.stages?.name !== 'Tamamlandı' && p.stages?.name !== 'İptal').length || 0;

      // Aşama Dağılımı (Grafik İçin)
      const dist: StageDistribution[] = [];
      const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-green-500'];
      
      stages?.forEach((stage, index) => {
        const count = projects?.filter(p => p.current_stage_id === stage.id).length || 0;
        if (count > 0) {
          dist.push({
            name: stage.name,
            count: count,
            color: colors[index % colors.length]
          });
        }
      });

      // Finansal Toplamlar
      const monthlyRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const monthlyExpense = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

      // Kullanıcı İsimlerini Eşleştirme (Aktiviteler için)
      const userIds = new Set(recentActivities?.map(a => a.user_id).filter(Boolean));
      let userMap: Record<string, string> = {};
      if (userIds.size > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, first_name, last_name').in('id', Array.from(userIds));
        profiles?.forEach(p => { userMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim(); });
      }

      setStats({
        totalProjects,
        activeProjects,
        monthlyRevenue,
        monthlyExpense,
        completedTasks: 0, // Alt görev detaylarından hesaplanabilir
        pendingTasks: 0
      });

      setStageDist(dist);
      
      setActivities(recentActivities?.map(a => ({
        ...a,
        user_name: a.user_id ? (userMap[a.user_id] || 'Sistem') : 'Sistem'
      })) || []);

    } catch (error) {
      console.error('Dashboard veri hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'Tünaydın';
    return 'İyi Akşamlar';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. HERO SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-0 dark:bg-surface-50 p-6 rounded-3xl border border-surface-200 dark:border-surface-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/20 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getGreeting()}, <span className="text-primary-600 dark:text-primary-400">{userName}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
            İşletmenizin bugünkü özeti aşağıda. Şu an <strong className="text-gray-800 dark:text-gray-200">{stats.activeProjects} aktif proje</strong> üzerinde çalışılıyor.
          </p>
        </div>

        <div className="flex gap-3 relative z-10">
          <button onClick={() => onChangeView('projects')} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2">
            <Briefcase className="w-4 h-4" /> Projelerim
          </button>
          <button onClick={() => onChangeView('accounting')} className="px-5 py-2.5 bg-surface-50 dark:bg-surface-100 text-gray-700 dark:text-gray-200 rounded-xl font-semibold border border-surface-200 dark:border-surface-200 hover:bg-surface-100 dark:hover:bg-surface-200 transition-all flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Finans
          </button>
        </div>
      </div>

      {/* 2. ANA İSTATİSTİKLER (GRID) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Aktif Projeler */}
        <div className="bg-white dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm flex items-center justify-between group hover:border-primary-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aktif İşler</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stats.activeProjects}</h3>
            <p className="text-xs text-gray-500 mt-1">Toplam {stats.totalProjects} proje</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Aylık Ciro */}
        <div className="bg-white dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm flex items-center justify-between group hover:border-green-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bu Ay Ciro</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">₺{stats.monthlyRevenue.toLocaleString('tr-TR')}</h3>
            <p className="text-xs text-green-600 flex items-center mt-1 font-medium"><TrendingUp className="w-3 h-3 mr-1" /> Nakit Girişi</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Aylık Gider */}
        <div className="bg-white dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm flex items-center justify-between group hover:border-red-300 transition-colors">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bu Ay Gider</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">₺{stats.monthlyExpense.toLocaleString('tr-TR')}</h3>
            <p className="text-xs text-red-600 flex items-center mt-1 font-medium"><TrendingDown className="w-3 h-3 mr-1" /> Masraflar</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        {/* Ekip/Personel */}
        <div className="bg-white dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm flex items-center justify-between group hover:border-purple-300 transition-colors cursor-pointer" onClick={() => onChangeView('staff')}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ekip Yönetimi</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">Personel</h3>
            <p className="text-xs text-purple-600 flex items-center mt-1 font-medium">Listeyi Görüntüle <ArrowRight className="w-3 h-3 ml-1" /></p>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. ORTA BÖLÜM: PROJE DAĞILIMI VE AKTİVİTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol: Proje Aşamaları Durumu */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-50 rounded-3xl p-6 border border-surface-200 dark:border-surface-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary-600" /> Proje Dağılımı
            </h3>
          </div>
          
          {stageDist.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-10">
              <Briefcase className="w-12 h-12 mb-2 opacity-20" />
              <p>Henüz aktif proje yok.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stageDist.map((item) => (
                <div key={item.name} className="group">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="text-xs font-bold text-gray-500 bg-surface-100 dark:bg-surface-200 px-2 py-0.5 rounded-md">{item.count} Proje</span>
                  </div>
                  <div className="w-full bg-surface-100 dark:bg-surface-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${item.color}`} 
                      style={{ width: `${(item.count / stats.totalProjects) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ: Canlı Aktivite Akışı */}
        <div className="lg:col-span-1 bg-white dark:bg-surface-50 rounded-3xl p-6 border border-surface-200 dark:border-surface-100 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Son Hareketler</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
            {activities.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-10">Henüz aktivite yok.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="relative pl-4 border-l-2 border-surface-100 dark:border-surface-100/10">
                  <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-surface-200 dark:bg-surface-600 ring-4 ring-white dark:ring-surface-50"></div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{act.user_name}</span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium line-clamp-2">{act.title}</p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}