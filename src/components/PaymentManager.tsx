import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  PieChart, 
  FileText,
  ArrowUpRight,
  Wallet
} from 'lucide-react';
import { CustomModal } from './ui/CustomModal';
import { CustomAlert } from './ui/CustomAlert';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
}

interface PaymentManagerProps {
  projectId: string;
  totalAmount: number;
}

export function PaymentManager({ projectId, totalAmount }: PaymentManagerProps) {
  const { addToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  const loadPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });

    if (data) {
      setPayments(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) {
        addToast('warning', 'Lütfen geçerli bir tutar giriniz.');
        setLoading(false);
        return;
    }

    const { error } = await supabase.from('payments').insert({
      project_id: projectId,
      amount: amountVal,
      payment_date: formData.payment_date,
      notes: formData.notes || null,
    });

    if (!error) {
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setIsModalOpen(false);
      await loadPayments();
      addToast('success', 'Ödeme başarıyla eklendi.');
    } else {
        addToast('error', 'Ödeme eklenirken bir hata oluştu.');
    }
    setLoading(false);
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Bu ödeme kaydını silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadPayments();
      addToast('info', 'Ödeme kaydı silindi.');
    } else {
      addToast('error', 'Silme işlemi başarısız.');
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;
  const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Toplam Tutar */}
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><Wallet className="w-3.5 h-3.5"/> Toplam Bedel</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-xl text-primary-600 dark:text-primary-400 relative z-10">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Ödenen Tutar */}
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> Tahsil Edilen</p>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400 tracking-tight">
              ₺{totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 font-semibold mt-2 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg inline-block">
              %{paidPercentage.toFixed(1)} tamamlandı
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-xl text-green-600 dark:text-green-400 relative z-10">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Kalan Tutar */}
        <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1"><PieChart className="w-3.5 h-3.5"/> Kalan Bakiye</p>
            <h3 className="text-3xl font-bold text-orange-600 dark:text-orange-400 tracking-tight">
              ₺{remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-orange-100 dark:bg-orange-900/50 p-3 rounded-xl text-orange-600 dark:text-orange-400 relative z-10">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* İlerleme Çubuğu */}
      <div className="bg-surface-0 dark:bg-surface-50 p-6 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ödeme İlerlemesi</span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {remaining <= 0 ? 'Tamamı Ödendi' : `Kalan: ₺${remaining.toLocaleString('tr-TR')}`}
          </span>
        </div>
        <div className="w-full bg-surface-100 dark:bg-surface-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ width: `${Math.min(paidPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Ödeme Listesi ve Ekleme */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/50 dark:bg-surface-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-surface-50 p-2 rounded-lg border border-surface-200 dark:border-surface-200 shadow-sm text-primary-600 dark:text-primary-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ödeme Geçmişi</h3>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 font-medium text-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Ödeme Ekle
          </button>
        </div>

        <div className="p-0">
          {payments.length === 0 ? (
            <div className="p-8">
                <CustomAlert type="info" message="Bu projeye ait henüz bir ödeme kaydı bulunmamaktadır. Sağ üstteki butonu kullanarak ekleyebilirsiniz." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-100 bg-surface-50 dark:bg-surface-100/30">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tutar</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Notlar</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-100/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-200 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-surface-50 transition-colors">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(payment.payment_date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
                          ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {payment.notes ? (
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-50" />
                            <span className="line-clamp-2">{payment.notes}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => deletePayment(payment.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ödeme Ekleme Modalı */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Ödeme Ekle"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ödeme Tutarı (₺) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 font-bold">₺</span>
              </div>
              <input
                type="number"
                required
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-semibold text-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ödeme Tarihi <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full px-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notlar
            </label>
            <textarea
              rows={3}
              placeholder="Ödeme ile ilgili notlar..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-6 py-3 border border-surface-200 dark:border-surface-100 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-surface-50 dark:hover:bg-surface-100 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}