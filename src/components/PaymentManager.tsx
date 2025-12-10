import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { useSettings } from '../contexts/SettingsContext';
import { useConfirmation } from '../contexts/ConfirmationContext';
import { useRBAC } from '../contexts/RBACContext';
import { logActivity } from '../lib/logger';
import { jsPDF } from 'jspdf';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Wallet, 
  Download, 
  Banknote, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PieChart
} from 'lucide-react';
import { CustomModal } from './ui/CustomModal';
import { CustomAlert } from './ui/CustomAlert';
import { CustomSelect } from './ui/CustomSelect';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string; 
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  payment_type?: string;
}

interface PaymentManagerProps {
  projectId: string;
  totalAmount: number;
  customerDetails: {
    name: string;
    phone: string;
    email: string | null;
    address: string;
  };
  onUpdate?: () => void;
}

const trToEn = (text: string) => {
  if(!text) return "";
  return text
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c');
};

export function PaymentManager({ projectId, totalAmount, customerDetails, onUpdate }: PaymentManagerProps) {
  const { addToast } = useToast();
  const { settings } = useSettings();
  const { confirm } = useConfirmation();
  const { hasPermission } = useRBAC();
  
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    loadTransactions();
  }, [projectId]);

  const loadTransactions = async () => {
    setLoading(true);
    
    // Gelirleri Çek
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId);

    // Giderleri Çek
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('project_id', projectId);

    const combined: Transaction[] = [
      ...(payments || []).map(p => ({
        id: p.id,
        type: 'income' as const,
        category: p.payment_type, 
        payment_type: p.payment_type,
        amount: p.amount,
        date: p.payment_date,
        description: p.notes,
        created_at: p.created_at
      })),
      ...(expenses || []).map(e => ({
        id: e.id,
        type: 'expense' as const,
        category: e.category,
        amount: e.amount,
        date: e.expense_date,
        description: e.description,
        created_by: e.created_by,
        created_at: e.created_at
      }))
    ];

    // Tarihe göre sırala (Yeniden eskiye)
    combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(combined);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) {
        return addToast('warning', 'Geçerli bir tutar giriniz.');
    }

    setLoading(true);
    
    if (activeTab === 'income') {
      // ÖDEME EKLEME
      const { error } = await supabase.from('payments').insert({
        project_id: projectId,
        amount: amountVal,
        payment_date: formData.date,
        payment_type: formData.category || 'Nakit',
        notes: formData.description || null,
      });

      if (!error) {
        await logActivity(projectId, 'Ödeme Alındı', `${formData.category} ile ödeme alındı.`, 'payment', { amount: amountVal });
        addToast('success', 'Tahsilat kaydedildi.');
      } else {
        addToast('error', 'Hata oluştu.');
      }
    } else {
      // GİDER EKLEME YETKİ KONTROLÜ
      if (!hasPermission('can_manage_expenses')) {
          setLoading(false);
          return addToast('error', 'Gider ekleme yetkiniz bulunmuyor.');
      }

      // GİDER EKLEME
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('expenses').insert({
        project_id: projectId,
        category: formData.category || 'Genel',
        amount: amountVal,
        expense_date: formData.date,
        description: formData.description || null,
        created_by: user?.id
      });

      if (!error) {
        await logActivity(projectId, 'Gider Eklendi', `${formData.category} masrafı girildi.`, 'update', { amount: amountVal });
        addToast('success', 'Gider kaydedildi.');
      } else {
        addToast('error', 'Hata oluştu.');
      }
    }

    setIsModalOpen(false);
    setFormData({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    await loadTransactions();
    if (onUpdate) onUpdate();
    setLoading(false);
  };

  const handleDelete = async (id: string, type: 'income' | 'expense') => {
    // SİLME YETKİ KONTROLLERİ
    if (type === 'income' && !hasPermission('can_delete_payment')) {
        return addToast('error', 'Ödeme silme yetkiniz yok.');
    }
    if (type === 'expense' && !hasPermission('can_manage_expenses')) {
        return addToast('error', 'Gider silme yetkiniz yok.');
    }

    if (!await confirm({ title: 'Sil', message: 'Bu kaydı silmek istediğinizden emin misiniz?', type: 'danger' })) return;

    const table = type === 'income' ? 'payments' : 'expenses';
    const { error } = await supabase.from(table).delete().eq('id', id);

    if (!error) {
      addToast('info', 'Kayıt silindi.');
      loadTransactions();
      if (onUpdate) onUpdate();
    } else {
      addToast('error', 'Silinemedi.');
    }
  };

  const generateReceipt = (transaction: Transaction) => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
    const companyName = settings?.company_name ? trToEn(settings.company_name) : "Firma Unvani Girilmemis";
    const primaryColor = [37, 99, 235]; 

    // Logo Ekleme (Varsa)
    if (settings?.logo_url) {
        try {
            const img = new Image();
            img.src = settings.logo_url;
            doc.addImage(img, 'PNG', 10, 10, 25, 25, undefined, 'FAST');
        } catch (e) {}
    }

    // Başlıklar
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAHSILAT MAKBUZU', 195, 20, { align: 'right' });

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${new Date(transaction.date).toLocaleDateString('tr-TR')}`, 195, 30, { align: 'right' });
    doc.text(`Belge No: #${transaction.id.slice(0, 8).toUpperCase()}`, 195, 35, { align: 'right' });

    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(10, 42, 200, 42);

    const boxY = 50;
    
    // Müşteri Alanı Kutusu
    doc.setDrawColor(220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(10, boxY, 90, 35, 2, 2, 'FD');
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text('MUSTERI (SAYIN)', 15, boxY + 6);
    doc.setFontSize(11); doc.setTextColor(0); doc.setFont('helvetica', 'bold');
    doc.text(trToEn(customerDetails.name), 15, boxY + 12);

    // --- Firma Alanı Kutusu ve KAŞE ---
    doc.setFillColor(245, 248, 255);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(110, boxY, 90, 35, 2, 2, 'FD'); // Kutu başlangıcı x=110, y=50, genişlik=90, yükseklik=35
    
    // Firma Adı Metni
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text('ALICI (FIRMA)', 115, boxY + 6);
    doc.setFontSize(11); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); doc.setFont('helvetica', 'bold');
    doc.text(companyName, 115, boxY + 12);

    // KAŞE GÖRSELİ EKLEME
    try {
      const stampImg = new Image();
      // Public klasöründeki dosya yolu. Eğer farklı bir yere koyduysanız burayı güncelleyin.
      stampImg.src = '/kase.jpeg'; 
      
      // Kaşenin konumu ve boyutu ayarları
      const stampWidth = 30; 
      const stampHeight = 30; 
      // Kutunun sağ alt köşesine hizalama hesaplaması (Kutu X + Genişlik - Kaşe Genişliği - Boşluk)
      const stampX = 110 + 90 - stampWidth - 2; 
      const stampY = boxY + 35 - stampHeight - 2;

      // Görseli PDF'e ekle (Şeffaflık destekleyen PNG formatında olmalı)
      doc.addImage(stampImg, 'PNG', stampX, stampY, stampWidth, stampHeight, undefined, 'FAST');
    } catch (e) {
      console.error("Kaşe görseli eklenirken hata oluştu:", e);
    }
    // -----------------------------------

    // Tablo Alanı
    const tableY = 95;
    doc.setFillColor(245, 245, 245); doc.setDrawColor(245, 245, 245);
    doc.rect(10, tableY, 190, 8, 'F');
    doc.setFontSize(9); doc.setTextColor(80); doc.setFont('helvetica', 'bold');
    doc.text('ACIKLAMA', 15, tableY + 5.5);
    doc.text('ODEME TURU', 100, tableY + 5.5);
    doc.text('TUTAR', 195, tableY + 5.5, { align: 'right' });

    doc.setFontSize(11); doc.setTextColor(0); doc.setFont('helvetica', 'normal');
    doc.text(transaction.description ? trToEn(transaction.description) : "Tahsilat", 15, tableY + 15);
    doc.text(trToEn(transaction.category), 100, tableY + 15);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${transaction.amount.toLocaleString('tr-TR')} TL`, 195, tableY + 15, { align: 'right' });

    doc.save(`Makbuz_${trToEn(customerDetails.name)}_${transaction.id.slice(0,6)}.pdf`);
    addToast('info', 'Makbuz indiriliyor...');
  };

  // İstatistikler
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const remainingBalance = totalAmount - totalIncome;
  const paidPercentage = totalAmount > 0 ? (totalIncome / totalAmount) * 100 : 0;

  const incomeOptions = [
    { value: 'Nakit', label: 'Nakit' },
    { value: 'Kredi Kartı', label: 'Kredi Kartı' },
    { value: 'Havale / EFT', label: 'Havale / EFT' },
    { value: 'Çek / Senet', label: 'Çek / Senet' }
  ];

  const expenseOptions = [
    { value: 'Malzeme', label: 'Malzeme Alımı' },
    { value: 'İşçilik', label: 'İşçilik / Usta' },
    { value: 'Nakliye', label: 'Nakliye / Lojistik' },
    { value: 'Yemek', label: 'Yemek / İaşe' },
    { value: 'Diğer', label: 'Diğer Giderler' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. FİNANSAL KARTLAR (BENTO) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Toplam Bütçe */}
        <div className="bg-surface-0 dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase">Sözleşme Tutarı</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">₺{totalAmount.toLocaleString('tr-TR')}</h3>
          <div className="mt-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-900/30">
            Anlaşılan Tutar
          </div>
        </div>

        {/* Toplam Tahsilat */}
        <div className="bg-surface-0 dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp className="w-24 h-24" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase">Toplam Tahsilat</p>
          <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            +₺{totalIncome.toLocaleString('tr-TR')}
          </h3>
          <div className="w-full bg-surface-100 dark:bg-surface-200 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(paidPercentage, 100)}%` }}></div>
          </div>
        </div>

        {/* Kalan Bakiye */}
        <div className="bg-surface-0 dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><PieChart className="w-24 h-24" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase">Kalan Bakiye</p>
          <h3 className={`text-2xl font-bold mt-1 ${remainingBalance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
            ₺{remainingBalance.toLocaleString('tr-TR')}
          </h3>
          <p className="text-xs text-gray-400 mt-2">
            Tahsil Edilecek: <span className="font-bold">%{totalAmount > 0 ? ((remainingBalance / totalAmount) * 100).toFixed(1) : '0'}</span>
          </p>
        </div>

        {/* Toplam Gider */}
        <div className="bg-surface-0 dark:bg-surface-50 p-5 rounded-2xl border border-surface-200 dark:border-surface-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown className="w-24 h-24" /></div>
          <p className="text-xs font-bold text-gray-400 uppercase">Toplam Gider</p>
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            -₺{totalExpense.toLocaleString('tr-TR')}
          </h3>
          <p className="text-xs text-gray-400 mt-2">Proje Masrafları</p>
        </div>
      </div>

      {/* 2. İŞLEM LİSTESİ VE FİLTRELEME */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-100 overflow-hidden flex flex-col h-[600px]">
        
        {/* Tab Header */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/50 dark:bg-surface-100/50">
          <div className="flex bg-surface-200 dark:bg-surface-200 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('income')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'income' 
                  ? 'bg-white dark:bg-surface-50 text-green-600 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" /> Gelirler
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'expense' 
                  ? 'bg-white dark:bg-surface-50 text-red-600 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" /> Giderler
            </button>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'expense' && !hasPermission('can_manage_expenses')) {
                  return addToast('error', 'Gider ekleme yetkiniz yok.');
              }
              setFormData({ category: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
              setIsModalOpen(true);
            }}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              activeTab === 'income' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
            }`}
          >
            <Plus className="w-4 h-4" />
            {activeTab === 'income' ? 'Tahsilat Ekle' : 'Masraf Ekle'}
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-50 dark:bg-surface-100 shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tarih</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Açıklama</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Tutar</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-100/10">
              {transactions.filter(t => t.type === activeTab).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Wallet className="w-12 h-12 mb-3 opacity-20" />
                      <p>Bu kategoride henüz kayıt bulunamadı.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.filter(t => t.type === activeTab).map((t) => (
                  <tr key={t.id} className="group hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400"/>
                        {new Date(t.date).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        t.type === 'income' 
                          ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                          : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                      }`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {t.description || '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}₺{t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t.type === 'income' && (
                          <button onClick={() => generateReceipt(t)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Makbuz">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {((t.type === 'income' && hasPermission('can_delete_payment')) || (t.type === 'expense' && hasPermission('can_manage_expenses'))) && (
                            <button onClick={() => handleDelete(t.id, t.type)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sil">
                            <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EKLEME MODALI */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'income' ? 'Yeni Tahsilat Ekle' : 'Yeni Masraf Ekle'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tutar (₺)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₺</span>
              <input 
                type="number" required step="0.01" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full pl-10 pr-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" 
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tarih</label>
              <input 
                type="date" required 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
              />
            </div>
            <div>
              <CustomSelect
                label={activeTab === 'income' ? "Ödeme Yöntemi" : "Gider Kategorisi"}
                value={formData.category}
                onChange={(val) => setFormData({...formData, category: val})}
                options={activeTab === 'income' ? incomeOptions : expenseOptions}
                placeholder="Seçiniz"
                icon={activeTab === 'income' ? <CreditCard className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Açıklama</label>
            <textarea 
              rows={3} 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-3 bg-surface-50 dark:bg-surface-100 border border-surface-200 dark:border-surface-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:text-white"
              placeholder="Detaylı açıklama..."
            />
          </div>

          <button type="submit" disabled={loading} className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </CustomModal>
    </div>
  );
}