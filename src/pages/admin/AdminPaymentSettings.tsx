import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminPaymentService, adminIpnLogService } from '@/services/apiService';
import { toast } from 'sonner';
import {
  CreditCard,
  Building2,
  Coins,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Key,
  Globe,
  Settings2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Percent,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  name_ar: string | null;
  type: string; // 'card_gateway', 'bank_transfer', 'nowpayments_crypto', 'custom'
  provider: string; // 'stripe', 'cmi', 'nowpayments', 'manual'
  currency: string;
  crypto_currency: string;
  crypto_network: string;
  crypto_wallet_address: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  swift_code: string;
  instructions: string;
  instructions_ar: string;
  require_receipt: boolean | number;
  api_key: string;
  secret_key: string;
  public_key: string;
  webhook_secret: string;
  is_sandbox: boolean | number;
  min_deposit: number;
  max_deposit: number;
  min_withdrawal: number;
  max_withdrawal: number;
  fee_percent: number;
  fee_fixed: number;
  enabled_for_deposit: boolean | number;
  enabled_for_withdrawal: boolean | number;
  status: string;
  sort_order: number;
  created_at: string;
}

export default function AdminPaymentSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    name: '',
    name_ar: '',
    type: 'nowpayments_crypto',
    provider: 'nowpayments',
    currency: 'USD',
    crypto_currency: 'USDT_BEP20',
    crypto_network: 'BEP20',
    crypto_wallet_address: '',
    bank_name: '',
    account_holder: '',
    account_number: '',
    swift_code: '',
    instructions: '',
    instructions_ar: '',
    require_receipt: true,
    api_key: '',
    secret_key: '',
    public_key: '',
    webhook_secret: '',
    is_sandbox: false,
    min_deposit: 10,
    max_deposit: 10000,
    min_withdrawal: 20,
    max_withdrawal: 5000,
    fee_percent: 0,
    fee_fixed: 0,
    enabled_for_deposit: true,
    enabled_for_withdrawal: true,
    status: 'active',
    sort_order: 0
  };

  const [formData, setFormData] = useState(initialForm);
  const [testingApi, setTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<any | null>(null);

  const handleTestNowPayments = async () => {
    try {
      setTestingApi(true);
      setApiTestResult(null);
      const res = await adminIpnLogService.testConnection();
      setApiTestResult(res);
      if (res.success && res.api_status?.status === 'OK') {
        toast.success(tr("تم الاتصال ببوابة NOWPayments بنجاح! 🚀", "NOWPayments API connected successfully!"));
      } else {
        toast.warning(tr("فحص الاتصال: تم استقبال رد مع تحذير", "Connection check completed with warnings"));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || (tr("فشل فحص الاتصال", "Connection check failed")));
    } finally {
      setTestingApi(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await adminPaymentService.getPaymentMethods();
      setMethods(res.paymentMethods || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (tr("فشل في تحميل طرق الدفع", "Failed to load payment methods")));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData(initialForm);
    setShowSecretKey(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: PaymentMethod) => {
    setEditingMethod(m);
    setFormData({
      name: m.name || '',
      name_ar: m.name_ar || '',
      type: m.type || 'nowpayments_crypto',
      provider: m.provider || 'manual',
      currency: m.currency || 'USD',
      crypto_currency: m.crypto_currency || 'USDT_BEP20',
      crypto_network: m.crypto_network || 'BEP20',
      crypto_wallet_address: m.crypto_wallet_address || '',
      bank_name: m.bank_name || '',
      account_holder: m.account_holder || '',
      account_number: m.account_number || '',
      swift_code: m.swift_code || '',
      instructions: m.instructions || '',
      instructions_ar: m.instructions_ar || '',
      require_receipt: !!m.require_receipt,
      api_key: m.api_key || '',
      secret_key: m.secret_key || '',
      public_key: m.public_key || '',
      webhook_secret: m.webhook_secret || '',
      is_sandbox: !!m.is_sandbox,
      min_deposit: Number(m.min_deposit) || 0,
      max_deposit: Number(m.max_deposit) || 0,
      min_withdrawal: Number(m.min_withdrawal) || 0,
      max_withdrawal: Number(m.max_withdrawal) || 0,
      fee_percent: Number(m.fee_percent) || 0,
      fee_fixed: Number(m.fee_fixed) || 0,
      enabled_for_deposit: !!m.enabled_for_deposit,
      enabled_for_withdrawal: !!m.enabled_for_withdrawal,
      status: m.status || 'active',
      sort_order: m.sort_order || 0
    });
    setShowSecretKey(false);
    setIsModalOpen(true);
  };

  const handleTypeChange = (newType: string) => {
    let newProvider = 'manual';
    let newCurrency = 'USD';
    let newCryptoCurrency = 'USDT_BEP20';
    let newCryptoNetwork = 'BEP20';

    if (newType === 'card_gateway') {
      newProvider = 'stripe';
      newCurrency = 'USD';
    } else if (newType === 'nowpayments_crypto') {
      newProvider = 'nowpayments';
      newCurrency = 'USDT';
      newCryptoCurrency = 'USDT_BEP20';
      newCryptoNetwork = 'BEP20';
    } else if (newType === 'bank_transfer') {
      newProvider = 'manual';
      newCurrency = 'USD';
    }

    setFormData(prev => ({
      ...prev,
      type: newType,
      provider: newProvider,
      currency: newCurrency,
      crypto_currency: newCryptoCurrency,
      crypto_network: newCryptoNetwork
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(tr("يرجى كتابة اسم طريقة الدفع", "Please enter payment method name"));
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingMethod) {
        await adminPaymentService.updatePaymentMethod(editingMethod.id, formData);
        toast.success(tr("تم تحديث طريقة الدفع بنجاح!", "Payment method updated successfully!"));
      } else {
        await adminPaymentService.createPaymentMethod(formData);
        toast.success(tr("تمت إضافة طريقة الدفع بنجاح!", "Payment method added successfully!"));
      }
      setIsModalOpen(false);
      fetchMethods();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (tr("حدث خطأ أثناء حفظ الإعدادات", "Error saving settings")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminPaymentService.deletePaymentMethod(id);
      toast.success(tr("تم حذف طريقة الدفع بنجاح!", "Payment method deleted successfully!"));
      setDeleteConfirmId(null);
      fetchMethods();
    } catch (err: any) {
      toast.error(tr("فشل في حذف طريقة الدفع", "Failed to delete payment method"));
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await adminPaymentService.toggleStatus(id);
      toast.success(tr("تم تغيير حالة التفعيل بنجاح", "Status updated successfully"));
      fetchMethods();
    } catch (err: any) {
      toast.error(tr("فشل في تغيير الحالة", "Failed to update status"));
    }
  };

  const handleToggleDeposit = async (id: string) => {
    try {
      await adminPaymentService.toggleDeposit(id);
      toast.success(tr("تم تحديث إعداد الإيداع", "Deposit setting updated"));
      fetchMethods();
    } catch (err: any) {
      toast.error(tr("فشل في تغيير الإعداد", "Failed to update setting"));
    }
  };

  const handleToggleWithdrawal = async (id: string) => {
    try {
      await adminPaymentService.toggleWithdrawal(id);
      toast.success(tr("تم تحديث إعداد السحب", "Withdrawal setting updated"));
      fetchMethods();
    } catch (err: any) {
      toast.error(tr("فشل في تغيير الإعداد", "Failed to update setting"));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success(tr("تم النسخ بنجاح!", "Copied to clipboard!"));
  };

  const filteredMethods = methods.filter((m) => {
    if (filterType === 'all') return true;
    return m.type === filterType;
  });

  const activeDepositCount = methods.filter((m) => m.status === 'active' && m.enabled_for_deposit).length;
  const activeWithdrawalCount = methods.filter((m) => m.status === 'active' && m.enabled_for_withdrawal).length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-16 font-sans">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 rounded-3xl border border-emerald-500/20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <CreditCard className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {tr("طرق وإعدادات الدفع والسحب", "Payment & Withdrawal Gateways")}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              {tr("إدارة بوابات الدفع الإلكترونية بالبطاقة البنكية، التحويل البنكي اليدوي، وبوابة العملات الرقمية NOWPayments (USDT BEP20) للإيداع والسحب.", "Configure card payment gateways, manual bank transfers, and NOWPayments.io crypto gateway (USDT BEP20) for deposits and payouts.")}
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            size="lg"
            className="rounded-2xl font-black text-sm bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/25 gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>{tr("إضافة وسيلة دفع جديدة", "Add Payment Method")}</span>
          </Button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("إجمالي الوسائل", "Total Gateways")}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {methods.length}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("مفعلة للإيداع", "Active for Deposit")}
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {activeDepositCount}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                <ArrowDownLeft className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("مفعلة للسحب", "Active for Withdrawal")}
                </p>
                <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {activeWithdrawalCount}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
                <ArrowUpRight className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("بوابة الكريبتو USDT", "Crypto USDT BEP20")}
                </p>
                <h3 className="text-base font-black text-amber-600 dark:text-amber-400 mt-1">
                  NOWPayments.io
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                <Coins className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: tr("جميع الطرق", "All Methods") },
            { id: 'card_gateway', label: tr("البطاقات البنكية", "Card Gateways") },
            { id: 'bank_transfer', label: tr("التحويل البنكي اليدوي", "Bank Transfer") },
            { id: 'nowpayments_crypto', label: isRtl ? 'NOWPayments (USDT BEP20)' : 'Crypto (USDT BEP20)' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filterType === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(tab.id)}
              className={`rounded-xl text-xs font-bold whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Methods Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
            <p className="text-sm text-slate-400 mt-4">{tr("جاري تحميل وسائل الدفع...", "Loading gateways...")}</p>
          </div>
        ) : filteredMethods.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <CreditCard className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {tr("لا توجد وسائل دفع مضافة في هذا القسم", "No payment methods found")}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {tr("أضف بوابة دفع إلكترونية، تحويل بنكي، أو ربط NOWPayments.", "Add a card gateway, bank details, or connect NOWPayments.")}
            </p>
            <Button onClick={handleOpenCreate} className="rounded-xl text-xs font-bold gap-1 bg-emerald-600 text-white">
              <Plus className="h-4 w-4" />
              <span>{tr("إضافة وسيلة دفع", "Add Gateway")}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {filteredMethods.map((m) => {
              const isCard = m.type === 'card_gateway';
              const isBank = m.type === 'bank_transfer';
              const isCrypto = m.type === 'nowpayments_crypto';

              const Icon = isCard ? CreditCard : isBank ? Building2 : Coins;
              const themeColor = isCard ? 'purple' : isBank ? 'blue' : 'amber';

              return (
                <Card
                  key={m.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl ${
                          isCard ? 'bg-purple-500/10 text-purple-600' :
                          isBank ? 'bg-blue-500/10 text-blue-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 dark:text-white text-base">
                              {isRtl ? (m.name_ar || m.name) : m.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold py-0">
                              {m.provider || m.type}
                            </Badge>
                            {m.is_sandbox ? (
                              <Badge className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 text-[10px] border-amber-300 py-0">
                                Test / Sandbox
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] border-emerald-300 py-0">
                                Live
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={m.status === 'active'}
                          onCheckedChange={() => handleToggleStatus(m.id)}
                          className="data-[state=checked]:bg-emerald-600"
                        />
                      </div>
                    </div>

                    {/* Body Details */}
                    <div className="p-5 space-y-4 text-xs">
                      {/* Deposit / Withdrawal Status Toggles */}
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                            {tr("الإيداع", "Deposit")}
                          </span>
                          <Switch
                            checked={!!m.enabled_for_deposit}
                            onCheckedChange={() => handleToggleDeposit(m.id)}
                            className="scale-75 data-[state=checked]:bg-emerald-600"
                          />
                        </div>

                        <div className="flex items-center justify-between border-l rtl:border-r rtl:border-l-0 border-slate-200 dark:border-slate-700 pl-2 rtl:pr-2 rtl:pl-0">
                          <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1">
                            <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                            {tr("السحب", "Withdrawal")}
                          </span>
                          <Switch
                            checked={!!m.enabled_for_withdrawal}
                            onCheckedChange={() => handleToggleWithdrawal(m.id)}
                            className="scale-75 data-[state=checked]:bg-blue-600"
                          />
                        </div>
                      </div>

                      {/* Type-Specific Info Block */}
                      {isCrypto && (
                        <div className="space-y-2 p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/15">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[10px] text-amber-700 dark:text-amber-400 uppercase">
                              USDT Network:
                            </span>
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-0 text-[10px] font-black">
                              {m.crypto_network || 'BEP20'} (BNB Chain)
                            </Badge>
                          </div>

                          {m.crypto_wallet_address ? (
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Receiving Wallet:</span>
                              <div className="flex items-center justify-between font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40 text-[11px]">
                                <span className="text-slate-700 dark:text-slate-300 truncate mr-1 rtl:ml-1 rtl:mr-0">{m.crypto_wallet_address}</span>
                                <button
                                  onClick={() => copyToClipboard(m.crypto_wallet_address, m.id)}
                                  className="text-slate-400 hover:text-amber-600"
                                >
                                  {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-600">{tr("لم يتم إدخال عنوان محفظة USDT BEP20 بعد", "No USDT BEP20 wallet address configured yet")}</p>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>NOWPayments API Key:</span>
                            <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                              {m.api_key ? '••••••••' + m.api_key.slice(-4) : (tr("غير مضبوط", "Not set"))}
                            </span>
                          </div>
                        </div>
                      )}

                      {isBank && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/15">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{tr("البنك:", "Bank:")}</span>
                            <strong className="text-slate-800 dark:text-slate-200">{m.bank_name || '-'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{tr("صاحب الحساب:", "Holder:")}</span>
                            <strong className="text-slate-800 dark:text-slate-200">{m.account_holder || '-'}</strong>
                          </div>
                          {m.account_number && (
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">{tr("رقم الحساب / IBAN:", "IBAN / Account:")}</span>
                              <div className="flex items-center justify-between font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-900/40 text-[11px]">
                                <span className="text-slate-700 dark:text-slate-300 truncate mr-1 rtl:ml-1 rtl:mr-0">{m.account_number}</span>
                                <button
                                  onClick={() => copyToClipboard(m.account_number, m.id)}
                                  className="text-slate-400 hover:text-blue-600"
                                >
                                  {copiedId === m.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {isCard && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/15">
                          <div className="flex justify-between">
                            <span className="text-slate-400">{tr("المزود:", "Provider:")}</span>
                            <strong className="text-purple-600 uppercase font-black">{m.provider || 'Stripe'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Public Key:</span>
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {m.public_key ? m.public_key.slice(0, 8) + '...' : (tr("غير مدخل", "Not set"))}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Secret Key:</span>
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                              {m.secret_key ? '••••••••' + m.secret_key.slice(-4) : (tr("غير مدخل", "Not set"))}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Limits and Fees Grid */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{tr("حد الإيداع:", "Deposit Limits:")}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            ${m.min_deposit} - ${m.max_deposit}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{tr("حد السحب:", "Withdrawal Limits:")}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            ${m.min_withdrawal} - ${m.max_withdrawal}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{tr("رسوم المعاملة:", "Fee:")}</span>
                          <span className="font-bold text-emerald-600">
                            {Number(m.fee_percent) > 0 ? `${m.fee_percent}%` : ''}
                            {Number(m.fee_fixed) > 0 ? ` +$${m.fee_fixed}` : ''}
                            {Number(m.fee_percent) === 0 && Number(m.fee_fixed) === 0 ? (tr("مجاناً 0%", "Free 0%")) : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">{tr("العملة:", "Currency:")}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {m.currency || 'USD'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(m)}
                      className="rounded-xl text-xs font-bold gap-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>{tr("تعديل وضبط", "Configure")}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(m.id)}
                      className="rounded-xl text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{tr("حذف", "Delete")}</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Add / Edit Payment Method */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <span>
                  {editingMethod
                    ? (tr("تعديل إعدادات وسيلة الدفع", "Configure Payment Method"))
                    : (tr("إضافة طريقة دفع وسحب جديدة", "Add Payment Gateway"))}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {tr("قم باختيار نوع البوابة (بطاقة بنكية، تحويل بنكي يدوي، أو NOWPayments USDT BEP20) وضبط بيانات الربط.", "Configure credentials, limits, and fees for this payment/withdrawal channel.")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Method Type Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("نوع البوابة / الطريقة", "Gateway / Method Type")} <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="rounded-xl text-sm font-bold">
                    <SelectValue placeholder={tr("اختر نوع الطريقة", "Select method type")} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="nowpayments_crypto">
                      🪙 NOWPayments.io — USDT (BEP20 Binance Smart Chain)
                    </SelectItem>
                    <SelectItem value="card_gateway">
                      💳 {tr("بوابات الدفع الإلكترونية بالبطاقة البنكية (Stripe / CMI)", "Credit Card Gateway (Stripe / CMI)")}
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      🏦 {tr("التحويل البنكي أو الدفع اليدوي (Bank Transfer / Manuel)", "Bank Transfer / Manual Payment")}
                    </SelectItem>
                    <SelectItem value="custom">
                      ✨ {tr("طريقة مخصصة أخرى (Custom Payment Method)", "Custom Payment Method")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title & Title AR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Method Name (English) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. NOWPayments USDT (BEP20)"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("الاسم بالعربية (Method Name Arabic)", "Arabic Method Name")}
                  </Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder={tr("مثال: الدفع عبر العملات الرقمية USDT (BEP20)", "e.g. USDT (BEP20) Crypto Payment")}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Deposit & Withdrawal Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    {tr("مفعل للإيداع (Deposit)", "Enabled for Deposit")}
                  </Label>
                  <Switch
                    checked={formData.enabled_for_deposit}
                    onCheckedChange={(val) => setFormData({ ...formData, enabled_for_deposit: val })}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    {tr("مفعل للسحب (Withdrawal)", "Enabled for Withdrawal")}
                  </Label>
                  <Switch
                    checked={formData.enabled_for_withdrawal}
                    onCheckedChange={(val) => setFormData({ ...formData, enabled_for_withdrawal: val })}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                    {tr("وضع الاختبار (Sandbox)", "Sandbox Mode")}
                  </Label>
                  <Switch
                    checked={formData.is_sandbox}
                    onCheckedChange={(val) => setFormData({ ...formData, is_sandbox: val })}
                    className="data-[state=checked]:bg-amber-600"
                  />
                </div>
              </div>

              {/* SPECIFIC FIELDS: NOWPayments (USDT BEP20) */}
              {formData.type === 'nowpayments_crypto' && (
                <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                    <Coins className="h-4 w-4" />
                    <span>{tr("إعدادات بوابة NOWPayments.io والعملات الرقمية USDT:", "NOWPayments.io & USDT Gateway Settings:")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("الشبكة المدعومة (Network)", "Supported Network")}
                      </Label>
                      <Input
                        disabled
                        value="BEP20 (Binance Smart Chain)"
                        className="rounded-xl text-xs bg-slate-100 dark:bg-slate-800 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("عنوان محفظة الاستلام (USDT BEP20)", "Receiving Wallet Address (USDT BEP20)")}
                      </Label>
                      <Input
                        value={formData.crypto_wallet_address}
                        onChange={(e) => setFormData({ ...formData, crypto_wallet_address: e.target.value })}
                        placeholder="0x..."
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        NOWPayments API Key
                      </Label>
                      <Input
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                        placeholder="NOWPayments API Key"
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        NOWPayments IPN Secret Key
                      </Label>
                      <Input
                        type="password"
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                        placeholder="IPN Secret Key"
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Test Connection Button & Status */}
                  <div className="pt-2 border-t border-amber-500/20 flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tr("يقوم النظام بإنشاء محفظة فريدة لكل إيداع وتغييرها تلقائياً بعد 20 دقيقة.", "The system creates a unique wallet for each deposit and renews it every 20 minutes.")}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTestNowPayments}
                        disabled={testingApi}
                        className="rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${testingApi ? 'animate-spin' : ''}`} />
                        <span>{isRtl ? (testingApi ? 'جارٍ الفحص...' : 'فحص الاتصال بالبوابة') : (testingApi ? 'Checking...' : 'Test Gateway Connection')}</span>
                      </Button>
                    </div>

                    {apiTestResult && (
                      <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                        apiTestResult.success && apiTestResult.api_status?.status === 'OK'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                      }`}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Activity className="h-4 w-4" />
                            {tr("حالة البوابة:", "Gateway Status:")} {apiTestResult.api_status?.message || apiTestResult.api_status?.status || (apiTestResult.success ? 'متصل' : 'تحذير')}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {apiTestResult.mode === 'live' ? '⚡ مباشر (Live API)' : '🛡️ وضع المحاكاة الآمن'}
                          </Badge>
                        </div>
                        <div className="text-[11px] opacity-90">
                          {tr("مفتاح API:", "API Key:")} {apiTestResult.is_configured?.has_api_key ? '✅ متوفر' : '⚠️ غير مسجل'} | {tr("مفتاح IPN:", "IPN Secret:")} {apiTestResult.is_configured?.has_ipn_secret ? '✅ متوفر' : '⚠️ غير مسجل'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS: Bank Transfer / Manuel Payment */}
              {formData.type === 'bank_transfer' && (
                <div className="space-y-3 p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <Building2 className="h-4 w-4" />
                    <span>{tr("بيانات الحساب البنكي للتحويل اليدوي:", "Bank Account Details for Manual Transfer:")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("اسم البنك (Bank Name)", "Bank Name")}
                      </Label>
                      <Input
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        placeholder="e.g. Attijariwafa / BNP Paribas / Al-Rajhi"
                        className="rounded-xl text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("اسم صاحب الحساب (Account Holder Name)", "Account Holder Name")}
                      </Label>
                      <Input
                        value={formData.account_holder}
                        onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                        placeholder="e.g. Nexyvora Academy LLC"
                        className="rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("رقم الحساب / الآيبان (IBAN / RIB / Account Number)", "Account Number / IBAN / RIB")}
                      </Label>
                      <Input
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        placeholder="e.g. SA00 0000 0000 0000"
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("رمز السويفت (SWIFT / BIC)", "SWIFT / BIC Code")}
                      </Label>
                      <Input
                        value={formData.swift_code}
                        onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                        placeholder="e.g. BCMAMAMC"
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SPECIFIC FIELDS: Card Payment Gateway (Stripe / CMI) */}
              {formData.type === 'card_gateway' && (
                <div className="space-y-3 p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20">
                  <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                    <CreditCard className="h-4 w-4" />
                    <span>{tr("مفاتيح الربط والاتصال بالبطاقة البنكية:", "Credit Card Gateway Credentials:")}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {tr("مزود الخدمة (Provider)", "Provider")}
                      </Label>
                      <Select
                        value={formData.provider}
                        onValueChange={(val) => setFormData({ ...formData, provider: val })}
                      >
                        <SelectTrigger className="rounded-xl text-xs">
                          <SelectValue placeholder={tr("اختر المزود", "Select provider")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="stripe">Stripe Payments (Global)</SelectItem>
                          <SelectItem value="cmi">CMI (Centre Monétique Interbancaire)</SelectItem>
                          <SelectItem value="custom">Other Card Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Public / Publishable Key
                      </Label>
                      <Input
                        value={formData.public_key}
                        onChange={(e) => setFormData({ ...formData, public_key: e.target.value })}
                        placeholder="pk_live_... or Merchant ID"
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Secret API Key
                      </Label>
                      <div className="relative">
                        <Input
                          type={showSecretKey ? 'text' : 'password'}
                          value={formData.secret_key}
                          onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                          placeholder="sk_live_..."
                          className="rounded-xl text-xs font-mono pr-8 rtl:pl-8 rtl:pr-3"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          className="absolute right-2.5 rtl:left-2.5 rtl:right-auto top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showSecretKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        Webhook Secret (Endpoint Secret)
                      </Label>
                      <Input
                        type="password"
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData({ ...formData, webhook_secret: e.target.value })}
                        placeholder="whsec_..."
                        className="rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Limits & Fees Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500">{tr("الحد الأدنى للإيداع ($)", "Min Deposit ($)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_deposit}
                    onChange={(e) => setFormData({ ...formData, min_deposit: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500">{tr("الحد الأقصى للإيداع ($)", "Max Deposit ($)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.max_deposit}
                    onChange={(e) => setFormData({ ...formData, max_deposit: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500">{tr("الحد الأدنى للسحب ($)", "Min Withdrawal ($)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.min_withdrawal}
                    onChange={(e) => setFormData({ ...formData, min_withdrawal: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-slate-500">{tr("رسوم المعاملة (%)", "Transaction Fee (%)")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.fee_percent}
                    onChange={(e) => setFormData({ ...formData, fee_percent: Number(e.target.value) })}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {tr("تعليمات للطالب (بالإنجليزية)", "Student Instructions (English)")}
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder={isRtl ? "Instructions shown to student upon selecting this method..." : "Instructions shown to student upon selecting this method..."}
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    {tr("تعليمات للطالب بالعربية", "Student Instructions (Arabic)")}
                  </Label>
                  <Textarea
                    rows={2}
                    value={formData.instructions_ar}
                    onChange={(e) => setFormData({ ...formData, instructions_ar: e.target.value })}
                    placeholder={tr("التعليمات والإرشادات التي تظهر للطالب عند اختيار هذه الطريقة...", "Instructions in Arabic for students...")}
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {tr("إلغاء", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : editingMethod ? (
                    tr("حفظ التعديلات", "Save Changes")
                  ) : (
                    tr("إضافة الطريقة", "Add Gateway")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{tr("تأكيد الحذف", "Confirm Deletion")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-2">
                {tr("هل أنت متأكد من رغبتك في حذف طريقة الدفع هذه؟ لن يتمكن الطلاب من استخدامها بعد الآن.", "Are you sure you want to permanently delete this payment method?")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl text-xs font-bold"
              >
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {tr("نعم، حذف", "Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
