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
  PieChart, 
  FileText, 
  ArrowUpRight, 
  Wallet, 
  Download, 
  Banknote, 
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CustomModal } from './ui/CustomModal';
import { CustomAlert } from './ui/CustomAlert';
import { CustomSelect } from './ui/CustomSelect';

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_type: string;
  notes: string | null;
  created_at: string;
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
  onUpdate?: () => void; // YENİ EKLENDİ: Güncelleme Tetikleyici
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
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_type: 'Nakit',
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
      payment_type: formData.payment_type,
      notes: formData.notes || null,
    });

    if (!error) {
      await logActivity(
        projectId, 
        'Ödeme Alındı', 
        `${formData.payment_type} ile ödeme girişi yapıldı.`, 
        'payment', 
        { amount: amountVal }
      );

      setFormData({
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_type: 'Nakit',
        notes: '',
      });
      setIsModalOpen(false);
      await loadPayments();
      if (onUpdate) onUpdate(); // ANA SAYFAYI GÜNCELLE
      addToast('success', 'Ödeme başarıyla eklendi.');
    } else {
        addToast('error', 'Ödeme eklenirken hata oluştu.');
    }
    setLoading(false);
  };

  const deletePayment = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Ödemeyi Sil',
      message: 'Bu ödeme kaydını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      confirmText: 'Evet, Sil',
      cancelText: 'Vazgeç',
      type: 'danger'
    });

    if (!isConfirmed) return;

    const { data: paymentToDelete } = await supabase.from('payments').select('amount, payment_type').eq('id', id).single();

    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (!error) {
      if(paymentToDelete) {
          await logActivity(
              projectId, 
              'Ödeme Silindi', 
              `${paymentToDelete.payment_type} ile alınan ödeme kaydı silindi.`, 
              'delete',
              { amount: paymentToDelete.amount }
          );
      }
      await loadPayments();
      if (onUpdate) onUpdate(); // ANA SAYFAYI GÜNCELLE
      addToast('info', 'Ödeme kaydı silindi.');
    } else {
      addToast('error', 'Silme işlemi başarısız.');
    }
  };

  const generateReceipt = (payment: Payment) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a5'
    });

    const companyName = settings?.company_name ? trToEn(settings.company_name) : "Firma Unvani Girilmemis";
    const primaryColor = [37, 99, 235]; 

    if (settings?.logo_url) {
        try {
            const img = new Image();
            img.src = settings.logo_url;
            doc.addImage(img, 'PNG', 10, 10, 25, 25, undefined, 'FAST');
        } catch (e) {}
    }

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('TAHSILAT MAKBUZU', 195, 20, { align: 'right' });

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tarih: ${new Date(payment.payment_date).toLocaleDateString('tr-TR')}`, 195, 30, { align: 'right' });
    doc.text(`Belge No: #${payment.id.slice(0, 8).toUpperCase()}`, 195, 35, { align: 'right' });

    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(10, 42, 200, 42);

    const boxY = 50;
    const boxHeight = 35;
    const boxPadding = 5;
    
    doc.setDrawColor(220);
    doc.setFillColor(252, 252, 252); 
    doc.roundedRect(10, boxY, 90, boxHeight, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text('MUSTERI (SAYIN)', 10 + boxPadding, boxY + 6);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    
    const customerNameLines = doc.splitTextToSize(trToEn(customerDetails.name), 80);
    doc.text(customerNameLines, 10 + boxPadding, boxY + 12);
    
    let contactY = boxY + 12 + (customerNameLines.length * 4);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80);
    if(customerDetails.phone) {
        doc.text(`Tel: ${customerDetails.phone}`, 10 + boxPadding, contactY);
        contactY += 4;
    }
    if(customerDetails.email) {
        doc.text(`E-posta: ${trToEn(customerDetails.email)}`, 10 + boxPadding, contactY);
    }

    doc.setFillColor(245, 248, 255); 
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]); 
    doc.roundedRect(110, boxY, 90, boxHeight, 2, 2, 'FD');
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('ALICI (FIRMA)', 110 + boxPadding, boxY + 6);
    
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    
    const companyNameLines = doc.splitTextToSize(companyName, 80);
    doc.text(companyNameLines, 110 + boxPadding, boxY + 12);
    
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.setFont('helvetica', 'normal');
    const footerOffset = (companyNameLines.length - 1) * 4;
    doc.text('Bu belge resmi evrak niteligindedir.', 110 + boxPadding, boxY + 30 + footerOffset);

    const tableY = 95;
    
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(245, 245, 245);
    doc.rect(10, tableY, 190, 8, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.setFont('helvetica', 'bold');
    doc.text('ODEME DETAYI', 15, tableY + 5.5);
    doc.text('ODEME TIPI', 100, tableY + 5.5);
    doc.text('TUTAR', 195, tableY + 5.5, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    
    const noteText = payment.notes ? trToEn(payment.notes) : "Tahsilat";
    const noteLines = doc.splitTextToSize(noteText, 80);
    doc.text(noteLines, 15, tableY + 15);
    
    doc.text(trToEn(payment.payment_type), 100, tableY + 15);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(14);
    doc.text(`${payment.amount.toLocaleString('tr-TR')} TL`, 195, tableY + 15, { align: 'right' });

    doc.setDrawColor(230);
    doc.setLineWidth(0.2);
    doc.line(10, tableY + 22, 200, tableY + 22);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'italic');
    const legalText = `Isbu tutar, ${trToEn(customerDetails.name)} tarafindan ${trToEn(payment.payment_type)} olarak ${companyName}'na odenmistir.`;
    const legalLines = doc.splitTextToSize(legalText, 180);
    
    let legalY = 122;
    doc.text(legalLines, 105, legalY, { align: 'center' });

    const signY = 135;
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont('helvetica', 'bold');
    
    doc.text('TESLIM EDEN', 40, signY, { align: 'center' });
    doc.text('TESLIM ALAN', 170, signY, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text(trToEn(customerDetails.name), 40, signY + 5, { align: 'center' });
    
    const signCompanyLines = doc.splitTextToSize(companyName, 60);
    doc.text(signCompanyLines, 170, signY + 5, { align: 'center' });

    doc.save(`Makbuz_${trToEn(customerDetails.name.replace(/\s+/g, '_'))}_${payment.id.slice(0,6)}.pdf`);
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalAmount - totalPaid;
  const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  const lastPayment = payments.length > 0 ? payments[0] : null;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* --- BENTO GRID İSTATİSTİKLER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. HERO KART: Finansal Özet (Geniş) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary-600/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 text-primary-100 mb-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-medium text-sm tracking-wide">TOPLAM BÜTÇE</span>
                    </div>
                    <h2 className="text-4xl font-bold tracking-tight">₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h2>
                    <p className="text-primary-100 mt-2 text-sm max-w-md">Proje kapsamındaki tüm hizmet ve ürün bedellerinin toplamıdır.</p>
                </div>
                
                {/* Dairesel İlerleme */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * paidPercentage) / 100} className="text-white transition-all duration-1000" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-sm font-bold">%{paidPercentage.toFixed(0)}</span>
                    </div>
                    <div>
                        <p className="text-xs text-primary-100 uppercase font-bold">Tahsilat</p>
                        <p className="text-lg font-bold">₺{totalPaid.toLocaleString('tr-TR')}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. KPI KARTLARI (Sağ Kolon) */}
        <div className="flex flex-col gap-6">
            {/* Kalan Bakiye */}
            <div className="flex-1 bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 dark:bg-orange-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-2">
                        <PieChart className="w-5 h-5" />
                        <span className="font-bold text-sm">KALAN BAKİYE</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">₺{remaining.toLocaleString('tr-TR')}</h3>
                </div>
            </div>

            {/* Son İşlem */}
            <div className="flex-1 bg-surface-0 dark:bg-surface-50 rounded-3xl p-6 shadow-sm border border-surface-200 dark:border-surface-100 flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="font-bold text-sm">SON İŞLEM</span>
                    </div>
                    {lastPayment ? (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">₺{lastPayment.amount.toLocaleString('tr-TR')}</h3>
                            <p className="text-xs text-gray-500 mt-1">{new Date(lastPayment.payment_date).toLocaleDateString('tr-TR')}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Henüz işlem yok</p>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* --- ÖDEME LİSTESİ VE AKSİYON --- */}
      <div className="bg-surface-0 dark:bg-surface-50 rounded-3xl shadow-sm border border-surface-200 dark:border-surface-100 overflow-hidden">
        <div className="p-6 border-b border-surface-200 dark:border-surface-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-50/50 dark:bg-surface-100/50">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-surface-50 p-2.5 rounded-xl border border-surface-200 dark:border-surface-200 shadow-sm text-primary-600 dark:text-primary-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ödeme Geçmişi</h3>
                <p className="text-xs text-gray-500">Tüm finansal hareketler</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 font-semibold text-sm active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Yeni Ödeme Ekle
          </button>
        </div>

        <div className="p-0">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
                <div className="w-16 h-16 bg-surface-50 dark:bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h4 className="text-gray-900 dark:text-gray-100 font-medium mb-1">Henüz Ödeme Yok</h4>
                <p className="text-gray-500 text-sm">Bu proje için henüz bir tahsilat kaydı girilmemiş.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-200 dark:border-surface-100 bg-surface-50 dark:bg-surface-100/30">
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarih</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tutar</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ödeme Yöntemi</th>
                    <th className="text-left py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Açıklama</th>
                    <th className="text-right py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-100/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="group hover:bg-surface-50 dark:hover:bg-surface-100/50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-200 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-surface-50 transition-colors border border-surface-200 dark:border-surface-100">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {new Date(payment.payment_date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          ₺{payment.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                {payment.payment_type === 'Nakit' ? <Banknote className="w-4 h-4"/> : 
                                 payment.payment_type === 'Kredi Kartı' ? <CreditCard className="w-4 h-4"/> :
                                 <Building2 className="w-4 h-4"/>}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{payment.payment_type}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {payment.notes ? (
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                            <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-1">{payment.notes}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => generateReceipt(payment)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                                title="Makbuz İndir"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            {hasPermission('can_delete_payment') && (
                                <button
                                    onClick={() => deletePayment(payment.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                    title="Sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
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
                className="w-full pl-10 pr-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-semibold text-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ödeme Tarihi <span className="text-red-500">*</span>
                </label>
                <input
                type="date"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                />
            </div>
            <div>
                <CustomSelect
                    label="Ödeme Yöntemi"
                    value={formData.payment_type}
                    onChange={(val) => setFormData({ ...formData, payment_type: val })}
                    options={[
                        { value: 'Nakit', label: 'Nakit' },
                        { value: 'Kredi Kartı', label: 'Kredi Kartı' },
                        { value: 'Havale / EFT', label: 'Havale / EFT' },
                        { value: 'Çek / Senet', label: 'Çek / Senet' }
                    ]}
                    icon={<CreditCard className="w-5 h-5" />}
                />
            </div>
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
              className="w-full px-4 py-3 border border-surface-200 dark:border-surface-100 dark:bg-surface-50 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all outline-none"
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
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20 active:scale-95"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </CustomModal>
    </div>
  );
}