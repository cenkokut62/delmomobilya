import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, TrendingDown, PieChart, DollarSign, Calendar, 
  ArrowUpRight, ArrowDownRight, Activity, Filter, Wallet, Building2
} from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';

interface GlobalStat {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export function GlobalAccounting() {
  const [stats, setStats] = useState<GlobalStat>({ totalIncome: 0, totalExpense: 0, netProfit: 0 });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadGlobalData();
  }, [filterYear]);

  const loadGlobalData = async () => {
    setLoading(true);
    
    // Yıl filtresi için tarih aralığı
    const startDate = `${filterYear}-01-01`;
    const endDate = `${filterYear}-12-31`;

    // Tüm Gelirler
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, payment_date, project_id, projects(customer_name)')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false });

    // Tüm Giderler
    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, expense_date, category, project_id, projects(customer_name)')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    const totalInc = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalExp = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

    // Son İşlemleri Birleştir
    const combinedHistory = [
      ...(payments || []).map(p => ({ ...p, type: 'income', date: p.payment_date, title: 'Tahsilat', desc: p.projects?.customer_name })),
      ...(expenses || []).map(e => ({ ...e, type: 'expense', date: e.expense_date, title: e.category, desc: e.projects?.customer_name }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20); // Son 20 işlem

    setStats({
      totalIncome: totalInc,
      totalExpense: totalExp,
      netProfit: totalInc - totalExp,
    });
    setRecentTransactions(combinedHistory);
    setLoading(false);
  };

  if (loading) {
    return (
        <div className="h-[500px] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <PieChart className="w-8 h-8 text-primary-600" />
            Genel Muhasebe
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tüm projelerin finansal durumu ve genel nakit akışı.
          </p>
        </div>
        <div className="w-48">
            <CustomSelect 
                value={filterYear}
                onChange={setFilterYear}
                options={[
                    { value: '2024', label: '2024 Yılı' },
                    { value: '2025', label: '2025 Yılı' },
                    { value: '2026', label: '2026 Yılı' }
                ]}
                icon={<Calendar className="w-4 h-4"/>}
            />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg shadow-green-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingUp className="w-32 h-32"/></div>
            <p className="text-green-100 font-bold text-sm uppercase">Toplam Gelir</p>
            <h2 className="text-4xl font-bold mt-2">₺{stats.totalIncome.toLocaleString('tr-TR')}</h2>
            <div className="mt-4 bg-white/20 inline-flex px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                <ArrowUpRight className="w-4 h-4 mr-1"/> Nakit Girişi
            </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-6 text-white shadow-lg shadow-red-500/20 relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-10"><TrendingDown className="w-32 h-32"/></div>
            <p className="text-red-100 font-bold text-sm uppercase">Toplam Gider</p>
            <h2 className="text-4xl font-bold mt-2">₺{stats.totalExpense.toLocaleString('tr-TR')}</h2>
            <div className="mt-4 bg-white/20 inline-flex px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
                <ArrowDownRight className="w-4 h-4 mr-1"/> Nakit Çıkışı
            </div>
        </div>

        <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 border border-surface-200 dark:border-surface-100 shadow-sm flex flex-col justify-center relative group overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary-50 dark:bg-primary-900/10 rounded-bl-full -mr-4 -mt-4"></div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Net Kâr / Zarar</p>
            <h2 className={`text-4xl font-bold mt-2 ${stats.netProfit >= 0 ? 'text-gray-900 dark:text-gray-100' : 'text-red-500'}`}>
                ₺{stats.netProfit.toLocaleString('tr-TR')}
            </h2>
            <div className="mt-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ${stats.netProfit >= 0 ? 'bg-primary-600' : 'bg-red-500'}`} 
                    style={{ width: `${Math.min(Math.abs(stats.netProfit) / (stats.totalIncome || 1) * 100, 100)}%` }}
                />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">
                Genel Kârlılık Oranı: %{(stats.netProfit / (stats.totalIncome || 1) * 100).toFixed(1)}
            </p>
        </div>
      </div>

      {/* Son İşlemler Tablosu */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl border border-surface-200 dark:border-surface-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600"/> Son Finansal Hareketler
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-50 dark:bg-surface-100/50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Tarih</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">İşlem</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Proje / Müşteri</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Tutar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-100/10">
                    {recentTransactions.map((t, i) => (
                        <tr key={i} className="hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                {new Date(t.date).toLocaleDateString('tr-TR')}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                    t.type === 'income' 
                                    ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    {t.type === 'income' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                                    {t.title}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 text-gray-400"/>
                                {t.desc || 'Genel Gider'}
                            </td>
                            <td className={`px-6 py-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}