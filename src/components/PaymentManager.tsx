import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Plus, Trash2, Calendar } from 'lucide-react';

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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
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

    const { error } = await supabase.from('payments').insert({
      project_id: projectId,
      amount: parseFloat(formData.amount),
      payment_date: formData.payment_date,
      notes: formData.notes || null,
    });

    if (!error) {
      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowForm(false);
      await loadPayments();
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm('Bu ödemeyi silmek istediğinizden emin misiniz?')) return;

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadPayments();
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;
  const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Ödemeler</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ödeme Ekle
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium mb-1">Toplam Tutar</p>
          <p className="text-2xl font-bold text-blue-900">
            ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium mb-1">Ödenen</p>
          <p className="text-2xl font-bold text-green-900">
            ₺{totalPaid.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium mb-1">Kalan</p>
          <p className="text-2xl font-bold text-orange-900">
            ₺{remaining.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Ödeme İlerlemesi</span>
          <span className="text-sm font-medium text-gray-900">{paidPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(paidPercentage, 100)}%` }}
          />
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Tutarı (₺) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ödeme Tarihi *
              </label>
              <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {payments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Henüz ödeme kaydı yok</p>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.payment_date).toLocaleDateString('tr-TR')}
                  </p>
                  {payment.notes && (
                    <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => deletePayment(payment.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
