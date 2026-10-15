import { useState, useEffect, useRef } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { packageService, affiliateService } from '@/services/apiService';
import api from '@/lib/api';
import { 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Copy, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  Wallet, 
  Coins, 
  Building2, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  GraduationCap, 
  Users, 
  Trophy, 
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StudentActivation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { rule, isAlgeria, isMorocco, usdtEnabled, currencyCode, convertToLocal, formatPrice, formatDualPrice } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const [communityPackage, setCommunityPackage] = useState<any>(null);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);

  // Form states
  const [paymentMethod, setPaymentMethod] = useState<'usdt' | 'bank_transfer' | 'wallet'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // NOWPayments Crypto States
  const [activePaymentOrder, setActivePaymentOrder] = useState<any>(null);
  const [orderTimeLeft, setOrderTimeLeft] = useState<number>(20 * 60);
  const [isCreatingCryptoOrder, setIsCreatingCryptoOrder] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async (showToast = false) => {
    try {
      if (!showToast) setLoading(true);
      const [pkgRes, allPkgsRes, walletRes, methodsRes] = await Promise.all([
        packageService.getMyPackage().catch(() => ({ currentPackage: null, hasActivePackage: false, pendingPackage: null })),
        packageService.getAll().catch(() => ({ packages: [] })),
        affiliateService.getWallet().catch(() => ({ wallet: { balance: 0 } })),
        affiliateService.getPaymentMethods('deposit').catch(() => ({ paymentMethods: [] }))
      ]);

      if (pkgRes.hasActivePackage) {
        setHasActivePackage(true);
        toast.success(tr("حسابك مفعل بالفعل! جاري نقلك للوحة التحكم...", "Account is active! Redirecting..."));
        setTimeout(() => navigate('/student'), 1200);
        return;
      }

      setPendingPackage(pkgRes.pendingPackage || null);

      if (pkgRes.activeNowPaymentsOrder) {
        setActivePaymentOrder(pkgRes.activeNowPaymentsOrder);
        setPaymentMethod('usdt');
      }

      // Find Community package
      const packs = allPkgsRes.packages || [];
      const commPack = packs.find((p: any) => p.level === 1 || Number(p.price) === 30 || (p.slug && p.slug.includes('community'))) || packs[0] || null;
      setCommunityPackage(commPack);

      setWalletBalance(Number(walletRes?.wallet?.balance || 0));
      setAvailableMethods(methodsRes?.paymentMethods || []);

      if (showToast) {
        if (pkgRes.hasActivePackage) {
          toast.success(tr("تهانينا! تم تفعيل عضويتك بنجاح.", "Membership activated successfully!"));
        } else if (pkgRes.pendingPackage) {
          toast.info(tr("الطلب لا يزال قيد المراجعة والتدقيق من طرف الإدارة.", "Request is still under review."));
        } else {
          toast.info(tr("لم يتم العثور على طلبات معلقة.", "No pending requests found."));
        }
      }
    } catch (err) {
      console.error('[StudentActivation loadData]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 20-minute countdown timer & auto-polling for payment confirmation
  useEffect(() => {
    if (!activePaymentOrder) return;

    const expiryTime = activePaymentOrder.expiresAt 
      ? new Date(activePaymentOrder.expiresAt).getTime() 
      : Date.now() + 20 * 60 * 1000;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setOrderTimeLeft(remaining);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    // Auto-poll payment status every 6 seconds to detect blockchain confirmation immediately
    const pollInterval = setInterval(async () => {
      if (!activePaymentOrder.orderId) return;
      try {
        const res = await packageService.checkNowPaymentsPayment(activePaymentOrder.orderId);
        if (res.status === 'active') {
          toast.success(tr("🎉 تم استلام الدفع بنجاح وتفعيل عضويتك الرسمية في الأكاديمية!", "Payment confirmed! Your membership is active!"));
          clearInterval(pollInterval);
          clearInterval(timerInterval);
          setTimeout(() => navigate('/student'), 1200);
        }
      } catch (err) {
        // Silent catch during periodic polling
      }
    }, 6000);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [activePaymentOrder, isRtl, navigate]);

  const handleCreateCryptoOrder = async () => {
    if (!communityPackage) {
      return toast.error(tr("تعذر تحديد باقة المجتمع", "Community package not found"));
    }

    try {
      setIsCreatingCryptoOrder(true);
      const res = await packageService.purchaseOrUpgrade({
        packageId: communityPackage.id,
        paymentMethod: 'nowpayments_crypto'
      });

      if (res.payment) {
        setActivePaymentOrder(res.payment);
        toast.success(tr("تم إنشاء محفظة دفع مخصصة لك (USDT BEP20) بنجاح!", "Dedicated USDT (BEP20) wallet created!"));
      } else if (res.status === 'active') {
        toast.success(tr("حسابك مفعل بالفعل!", "Account is active!"));
        navigate('/student');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشل إنشاء محفظة الدفع عبر NOWPayments", "Failed to create payment order")));
    } finally {
      setIsCreatingCryptoOrder(false);
    }
  };

  const handleCheckCryptoPayment = async () => {
    if (!activePaymentOrder?.orderId) return;
    try {
      setIsCheckingPayment(true);
      const res = await packageService.checkNowPaymentsPayment(activePaymentOrder.orderId);
      if (res.status === 'active') {
        toast.success(tr("🎉 تم تأكيد الدفع وتفعيل حسابك بنجاح! جاري تحويلك...", "Payment confirmed and account activated! Redirecting..."));
        setTimeout(() => navigate('/student'), 1000);
      } else {
        toast.info(res.message || (tr("المعاملة قيد التدقيق على شبكة البلوكشين. سيتم تفعيل حسابك فور وصول التحويل.", "Transaction is being monitored on the blockchain.")));
      }
    } catch (err: any) {
      toast.error(tr("فشل فحص حالة الدفع", "Failed to check payment status"));
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(tr("تم النسخ إلى الحافظة!", "Copied to clipboard!"));
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error(tr("حجم الملف يجب ألا يتجاوز 5 ميغابايت", "File size must be under 5MB"));
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingReceipt(true);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data.url || res.data.fileUrl || res.data.path;
      setReceiptUrl(url);
      toast.success(tr("تم رفع صورة الوصل بنجاح!", "Receipt uploaded successfully!"));
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشل رفع صورة الوصل", "Failed to upload receipt")));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitActivation = async () => {
    if (!communityPackage) {
      return toast.error(tr("تعذر تحديد باقة المجتمع", "Community package not found"));
    }

    if (paymentMethod === 'wallet') {
      if (walletBalance < 30) {
        return toast.error(tr("رصيد المحفظة غير كافٍ ($${walletBalance.toFixed(2)} USD). يرجى اختيار وسيلة دفع أخرى.", "Insufficient wallet balance"));
      }
    } else {
      if (!paymentReference.trim()) {
        return toast.error(tr("يرجى إدخال رقم العملية / الحوالة أو TxID", "Transaction reference / TxID is required"));
      }
    }

    try {
      setSubmitting(true);
      const res = await packageService.purchaseOrUpgrade({
        packageId: communityPackage.id,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        receiptUrl: receiptUrl.trim() || undefined,
        notes: notes.trim() || undefined
      });

      if (res.status === 'active') {
        toast.success(res.message || (tr("تم تفعيل باقة المجتمع بنجاح!", "Community package activated!")));
        setTimeout(() => navigate('/student'), 1000);
      } else {
        toast.success(res.message || (tr("تم إرسال طلب التفعيل بنجاح وهو قيد المراجعة!", "Activation request submitted for review!")));
        setShowEditForm(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشل إرسال طلب التفعيل", "Failed to submit activation request")));
    } finally {
      setSubmitting(false);
    }
  };

  // Find crypto and bank details from available methods or active country rule
  const cryptoMethod = availableMethods.find((m: any) => m.type === 'nowpayments_crypto' || m.type === 'crypto' || m.crypto_wallet_address) || {
    name: 'USDT (Crypto)',
    crypto_currency: 'USDT (TRC20 / BEP20)',
    crypto_network: 'TRC20 / BEP20',
    crypto_wallet_address: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
    instructions_ar: 'يرجى تحويل مبلغ 30 USDT عبر شبكة (TRC20 أو BEP20) إلى العنوان أعلاه، ثم نسخ رقم المعاملة TxID وإرفاق الوصل أدناه.'
  };

  const localBankFromRule = (rule && (rule.bank_name || rule.account_number)) ? {
    name: rule.bank_name || (tr("تحويل بنكي محلي", "Local Bank Transfer")),
    bank_name: rule.bank_name,
    account_number: rule.account_number || '',
    rib_iban: rule.account_number || rule.iban || '',
    iban: rule.iban || rule.account_number || '',
    account_holder: rule.account_holder || '',
    swift_code: rule.swift_code || '',
    instructions: rule.bank_instructions || '',
    instructions_ar: rule.bank_instructions_ar || rule.bank_instructions || ''
  } : null;

  const bankMethod = localBankFromRule 
    || availableMethods.find((m: any) => m.type === 'bank_transfer' || m.bank_name) 
    || {
      name: tr("تحويل بنكي محلي", "Bank Transfer"),
      bank_name: isAlgeria ? 'BaridiMob' : (isMorocco ? 'Attijariwafa Bank' : 'Local Bank'),
      account_number: '',
      rib_iban: '',
      account_holder: '',
      instructions_ar: tr("يرجى التحويل بالعملة المحلية إلى الحساب أعلاه وإرفاق صورة الوصل.", "Please transfer the amount in local currency and attach the receipt.")
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">
          {tr("جاري التحقق من حالة حسابك...", "Checking account status...")}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-primary/20">
            N
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white block leading-none">
              NEXYVORA
            </span>
            <span className="text-[10px] text-primary font-bold tracking-widest uppercase">
              {tr("بوابة التفعيل الإلزامية", "Activation Gate")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-start sm:text-end">
            <span className="text-xs font-bold text-slate-200">{user?.full_name || user?.email}</span>
            <span className="text-[10px] text-slate-400 font-mono">{user?.email}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut()}
            className="rounded-xl border-slate-800 hover:bg-slate-800 text-slate-300 text-xs gap-1.5 h-8.5 px-3"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>{tr("تسجيل الخروج", "Sign Out")}</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* PENDING CARD (If user already submitted payment proof) */}
        {pendingPackage && !showEditForm ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="p-6 sm:p-8 text-center border-b border-amber-500/20">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/30 shadow-inner">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 font-bold mb-3 mx-auto">
                  {tr("الحالة: قيد المراجعة والتدقيق", "Status: Under Admin Review")}
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                  {tr("طلب تفعيل عضويتك قيد المعالجة", "Your Activation Request Is Under Review")}
                </CardTitle>
                <CardDescription className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm mt-2">
                  {tr("شكراً لك! لقد استلمنا إشعار تحويل رسوم باقة المجتمع ($30 USD). يقوم فريق الإدارة حالياً بمراجعة وصل الدفع، وسيتم فتح النظام بالكامل فور التأكيد.", "Thank you! We received your Community package ($30 USD) payment proof. Our team is verifying your payment and your full access will unlock upon approval.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">{tr("الباقة المطلوبة:", "Package:")}</span>
                    <span className="font-bold text-white text-sm">
                      {isRtl ? (pendingPackage.package_name_ar || pendingPackage.package_name) : (pendingPackage.package_name || pendingPackage.package_name_ar)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{tr("المبلغ المدفوع:", "Amount Paid:")}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${Number(pendingPackage.amount_paid || 30).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{tr("طريقة الدفع:", "Payment Method:")}</span>
                    <span className="font-bold text-slate-200">
                      {pendingPackage.payment_method === 'usdt' ? 'USDT (Crypto)' :
                       pendingPackage.payment_method === 'bank_transfer' ? (tr("تحويل بنكي", "Bank Transfer")) :
                       pendingPackage.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{tr("رقم العملية / TxID:", "TxID / Reference:")}</span>
                    <span className="font-mono font-bold text-slate-200 break-all">
                      {pendingPackage.payment_reference || 'N/A'}
                    </span>
                  </div>
                  {pendingPackage.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block mb-1">{tr("الملاحظات / اسم المرسل:", "Notes / Sender:")}</span>
                      <span className="text-slate-300 italic">{pendingPackage.notes}</span>
                    </div>
                  )}
                  {pendingPackage.receipt_url && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">{tr("صورة الوصل المرفقة:", "Attached Receipt:")}</span>
                      <a
                        href={pendingPackage.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {tr("معاينة الوصل", "View Receipt")}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
                  <Button
                    onClick={() => loadData(true)}
                    className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{tr("تحديث حالة التفعيل الآن", "Refresh Activation Status")}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                    className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold border-slate-800 hover:bg-slate-800 text-slate-300 text-xs"
                  >
                    {tr("تعديل بيانات أو وصل الدفع", "Update Payment Proof")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ACTIVATION PURCHASE / SUBMISSION FLOW */
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Hero */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tr("الخطوة الأولى الإلزامية لتفعيل العضوية", "Step 1: Mandatory Membership Activation")}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {tr("تفعيل عضوية المجتمع الرسمية", "Activate Official Community Membership")}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {tr("للبدء في تصفح النظام، حضور الدورات، تفعيل رابط الإحالة وجني العمولات بنسبة 50% ($15 USD)، يرجى إتمام سداد رسوم عضوية المجتمع ($30 USD).", "To browse the platform, access academy training, activate referral earnings (50% / $15 USD direct bonus), please complete your $30 Community Membership.")}
              </p>
            </div>

            {/* 4 Core Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {tr("الأكاديمية والتدريبات", "Academy & Training")}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tr("ورشات مباشرة أسبوعية ومحتوى تدريبي استثماري مخصص للأعضاء.", "Live weekly workshops and exclusive educational tracks.")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {tr("بناء الفريق والعمولات", "Affiliate & Team")}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tr("احصل على عمولة 50% ($15 USD) فورية لكل عضو مباشر ينضم عبرك.", "Earn 50% ($15 USD) direct bonus for every direct member registered.")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {tr("الرتب وأحواض البونص", "Ranks & Bonus Pools")}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tr("فتح مسار الرتب القيادية وتقاسم أرباح الشركة الشهرية.", "Unlock leadership ranks and share 2% monthly company profits.")}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {tr("المحفظة وسحب الأرباح", "Wallet & Payouts")}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tr("إيداع وسحب أرباحك وعمولاتك بكل سهولة وأمان عبر USDT أو البنك.", "Fast, reliable withdrawals of your commissions via USDT or Bank.")}
                </p>
              </div>
            </div>

            {/* Payment & Submission Form Card */}
            <Card className="border-slate-800 bg-slate-900/90 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md">
              <CardHeader className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-black text-white">
                      {tr("اختر وسيلة الدفع لتفعيل الباقة", "Select Payment Method for Activation")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                      {tr("المبلغ المطلوب سداده: ${formatDualPrice(30)} فقط (لمرة واحدة سنوياً).", "Required amount: ${formatDualPrice(30)} (Annual validity).")}
                    </CardDescription>
                  </div>
                  <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-black text-lg self-start sm:self-auto">
                    {formatDualPrice(30)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Method Selector Tabs */}
                <div className={`grid grid-cols-1 ${!isAlgeria && usdtEnabled ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                  {/* USDT Crypto (Hidden for Algeria) */}
                  {!isAlgeria && usdtEnabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('usdt');
                        if (!activePaymentOrder) {
                          handleCreateCryptoOrder();
                        }
                      }}
                      className={`p-4 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 ${
                        paymentMethod === 'usdt'
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 text-white'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          paymentMethod === 'usdt' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          <Coins className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs sm:text-sm block text-white">
                            USDT (Crypto)
                          </span>
                          <span className="text-[10px] text-emerald-400 block font-mono font-bold">
                            NOWPayments (BEP20)
                          </span>
                        </div>
                      </div>
                      {paymentMethod === 'usdt' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </button>
                  )}

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'bank_transfer' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block text-white">
                          {tr("تحويل بنكي / يدوي", "Bank Transfer")}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[130px]">
                          {bankMethod.bank_name || (isAlgeria ? 'BaridiMob / RIP' : (isMorocco ? 'CIH / Attijariwafa' : 'Local Bank'))}
                        </span>
                      </div>
                    </div>
                    {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>

                  {/* Internal Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-4 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 ${
                      paymentMethod === 'wallet'
                        ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 text-white'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        paymentMethod === 'wallet' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-xs sm:text-sm block text-white">
                          {tr("رصيد المنصة", "Wallet Balance")}
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-mono font-bold">
                          ${walletBalance.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </button>
                </div>

                {/* Method Specific Instructions Box */}
                {paymentMethod === 'usdt' && (
                  <div className="space-y-4">
                    {activePaymentOrder ? (
                      <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-emerald-950/20 border border-emerald-500/30 shadow-2xl animate-in fade-in duration-300">
                        {/* Header & Status */}
                        <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs sm:text-sm font-black text-emerald-300">
                              {tr("محفظة الدفع المخصصة جاهزة (NOWPayments)", "Dedicated NOWPayments Wallet Ready")}
                            </span>
                          </div>
                          <Badge variant="outline" className="font-mono text-[11px] bg-slate-950 border-emerald-500/40 text-emerald-300 font-bold px-2.5 py-0.5">
                            #{activePaymentOrder.paymentId}
                          </Badge>
                        </div>

                        {/* 20-Minute Live Countdown Timer */}
                        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Clock className={`h-4 w-4 ${orderTimeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
                              {tr("الوقت المتبقي لصلاحية هذا العنوان:", "Address Validity Remaining:")}
                            </span>
                            <span className={`font-mono text-sm sm:text-base font-black ${
                              orderTimeLeft < 300 ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {Math.floor(orderTimeLeft / 60)}:{(orderTimeLeft % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                orderTimeLeft < 300 ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, (orderTimeLeft / (20 * 60)) * 100))}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {tr("العنوان صالح ومخصص لك لمدة 20 دقيقة. بمجرد إرسال المبلغ، يقوم النظام برصد المعاملة عبر البلوكشين وتفعيل حسابك تلقائياً دون أي انتظار.", "The address is active for 20 minutes. Once sent, the blockchain confirms and your account activates automatically.")}
                          </p>
                        </div>

                        {/* Amount to Send */}
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                          <span className="text-xs text-emerald-400 font-bold block mb-1">
                            {tr("المبلغ المطلوب إرساله بالضبط:", "Exact Amount to Send:")}
                          </span>
                          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
                            {activePaymentOrder.payAmount || 30} <span className="text-sm font-sans uppercase">USDT</span>
                          </div>
                          <span className="inline-block mt-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-300 font-mono">
                            BNB Smart Chain (BEP20)
                          </span>
                        </div>

                        {/* Dynamic QR Code & Wallet Address */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                          <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-lg shrink-0">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(activePaymentOrder.payAddress)}`}
                              alt="USDT BEP20 QR Code"
                              className="w-28 h-28 sm:w-24 sm:h-24 object-contain rounded-xl"
                            />
                          </div>

                          <div className="flex-1 w-full space-y-2 text-center sm:text-start">
                            <span className="text-xs text-slate-400 block font-medium">
                              {tr("عنوان محفظة الإيداع المخصصة لك (BEP20):", "Your Dedicated Deposit Address (BEP20):")}
                            </span>
                            <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-xs font-bold text-slate-200 break-all select-all border border-slate-800">
                              {activePaymentOrder.payAddress}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => copyToClipboard(activePaymentOrder.payAddress, 'nowpay_address')}
                                className="h-8 px-3 text-xs gap-1.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/30"
                              >
                                {copiedField === 'nowpay_address' ? <Check className="h-3.5 w-3.5 text-white" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedField === 'nowpay_address' ? (tr("تم نسخ العنوان!", "Copied!")) : (tr("نسخ العنوان", "Copy Address"))}</span>
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCreateCryptoOrder}
                                disabled={isCreatingCryptoOrder}
                                className="h-8 px-2.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl"
                              >
                                <RefreshCw className={`w-3 h-3 mr-1 ${isCreatingCryptoOrder ? 'animate-spin' : ''}`} />
                                <span>{tr("تجديد العنوان", "Renew Address")}</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Checking Status Button & Notice */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                          <Button
                            type="button"
                            onClick={handleCheckCryptoPayment}
                            disabled={isCheckingPayment}
                            className="w-full sm:flex-1 h-11 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-900/40"
                          >
                            <RefreshCw className={`w-4 h-4 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                            <span>{tr("فحص حالة الدفع والتفعيل الآن", "Check Payment & Activation Status")}</span>
                          </Button>
                        </div>

                        <div className="text-center">
                          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                            {tr("يقوم النظام بمراقبة وصول التحويل تلقائياً كل 6 ثوانٍ وسيتم تفعيل حسابك فوراً.", "Auto-monitoring every 6s. Your account will unlock automatically upon confirmation.")}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Coins className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">
                            {tr("الدفع الآلي عبر USDT BEP20 (NOWPayments)", "Automated Payment via USDT BEP20 (NOWPayments)")}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {tr("انقر على الزر أدناه لإنشاء محفظة دفع مخصصة لك بالكامل. بمجرد إرسال $30 USDT عبر شبكة BEP20، سيتم تفعيل حسابك فوراً وبشكل تلقائي دون انتظار المراجعة اليدوية!", "Click below to generate your dedicated wallet. Once sent, activation happens automatically without manual review!")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateCryptoOrder}
                          disabled={isCreatingCryptoOrder}
                          className="h-11 px-6 rounded-2xl font-black bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/20"
                        >
                          {isCreatingCryptoOrder ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>{tr("جاري إنشاء محفظة الدفع...", "Creating dedicated wallet...")}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>{tr("إنشاء محفظة الدفع المخصصة (USDT BEP20)", "Generate Dedicated BEP20 Wallet")}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {tr("بيانات الحساب البنكي الرسمي:", "Official Bank Details:")}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                        {tr("حساب تجاري موثق", "Verified Merchant")}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{tr("اسم البنك / الجهة:", "Bank Name:")}</span>
                        <span className="font-bold text-white text-xs">{bankMethod.bank_name || (isAlgeria ? 'BaridiMob' : 'Local Bank')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{tr("اسم صاحب الحساب:", "Account Holder:")}</span>
                        <span className="font-bold text-white text-xs">{bankMethod.account_holder || '—'}</span>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{tr("رقم الحساب / RIP / الحساب البنكي:", "Account Number / RIP:")}</span>
                          <span className="font-mono font-bold text-slate-200 text-xs">{bankMethod.account_number || bankMethod.rib_iban || '—'}</span>
                        </div>
                        {(bankMethod.account_number || bankMethod.rib_iban) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bankMethod.account_number || bankMethod.rib_iban, 'rib')}
                            className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 gap-1 font-bold text-xs"
                          >
                            {copiedField === 'rib' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'rib' ? (tr("تم!", "Copied!")) : (tr("نسخ", "Copy"))}</span>
                          </Button>
                        )}
                      </div>

                      {bankMethod.iban && bankMethod.iban !== bankMethod.account_number && (
                        <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-400 block text-[10px]">{tr("رقم الآيبان الدولي (IBAN):", "IBAN Number:")}</span>
                            <span className="font-mono font-bold text-slate-200 text-xs">{bankMethod.iban}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bankMethod.iban, 'iban')}
                            className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 gap-1 font-bold text-xs"
                          >
                            {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'iban' ? (tr("تم!", "Copied!")) : (tr("نسخ", "Copy"))}</span>
                          </Button>
                        </div>
                      )}

                      {bankMethod.swift_code && (
                        <div className="sm:col-span-2 pt-1">
                          <span className="text-slate-400 block text-[10px]">SWIFT / BIC:</span>
                          <span className="font-mono font-bold text-slate-200 text-xs">{bankMethod.swift_code}</span>
                        </div>
                      )}
                    </div>

                    {(bankMethod.instructions_ar || bankMethod.instructions) ? (
                      <p className="text-[11px] text-slate-300 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed whitespace-pre-line">
                        💡 {isRtl ? (bankMethod.instructions_ar || bankMethod.instructions) : (bankMethod.instructions || bankMethod.instructions_ar)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        💡 {tr("قم بتحويل ${formatDualPrice(30)}، ثم اكتب رقم الحوالة واسم صاحب الحساب وأرفق صورة الوصل أدناه.", "Transfer the equivalent of $30 USD, enter the reference number and sender name, and upload the bank slip.")}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {tr("الدفع الفوري من رصيد المحفظة:", "Instant Wallet Activation:")}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${walletBalance.toFixed(2)} USD
                      </span>
                    </div>

                    {walletBalance >= 30 ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span>
                          {tr("رصيدك متاح وكافٍ لتفعيل باقة المجتمع فوراً دون الحاجة لمراجعة أو إرفاق وصل!", "Your wallet balance is sufficient. Activation will take place immediately upon clicking confirm!")}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>
                          {tr("رصيد محفظتك المتاح هو $${walletBalance.toFixed(2)} USD والمبلغ المطلوب هو $30.00 USD. يرجى اختيار USDT أو تحويل بنكي لإتمام التفعيل.", "Current wallet balance is $${walletBalance.toFixed(2)}. $30.00 is required. Please choose USDT or Bank Transfer.")}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* FORM INPUTS (Only needed for manual bank transfer) */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4 pt-2">
                    {/* Reference / TxID */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {tr("رقم المعاملة / كود التحويل البنكي", "Transaction Reference / Transfer Code")} <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        placeholder="Ref: e.g. V-982314 or 20261015-889"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white rounded-xl h-10 text-xs font-mono"
                      />
                    </div>

                    {/* Sender Name / Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {tr("اسم المرسل أو ملاحظات إضافية (اختياري)", "Sender Name / Extra Notes (Optional)")}
                      </Label>
                      <Input
                        placeholder={tr("مثال: محمد العمري - حوالة بنكية", "e.g. John Doe - Bank transfer note")}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white rounded-xl h-10 text-xs"
                      />
                    </div>

                    {/* Receipt Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {tr("صورة وصل التحويل (مستحسن لتسريع المراجعة)", "Receipt Proof Screenshot (Recommended)")}
                      </Label>

                      <input
                        type="file"
                        accept="image/*,.pdf"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />

                      {receiptUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300 font-bold truncate">
                              {tr("تم إرفاق وصل التحويل بنجاح", "Receipt attached")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline font-bold"
                            >
                              {tr("عرض", "View")}
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setReceiptUrl('')}
                              className="h-7 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-slate-900"
                            >
                              {tr("حذف", "Remove")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-800 hover:border-primary/50 bg-slate-950/60 p-6 rounded-2xl text-center cursor-pointer transition-colors"
                        >
                          {uploadingReceipt ? (
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-6 h-6 text-primary animate-spin" />
                              <span className="text-xs text-slate-400">
                                {tr("جاري رفع الملف...", "Uploading receipt...")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <Upload className="w-6 h-6 text-primary" />
                              <span className="text-xs font-bold text-slate-300">
                                {tr("انقر هنا لرفع صورة الوصل (PNG, JPG, PDF)", "Click to upload receipt image (PNG, JPG, PDF)")}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {tr("الحد الأقصى للملف: 5 ميغابايت", "Maximum file size: 5MB")}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Big Submit Button (Only for wallet or manual bank transfer) */}
                {paymentMethod !== 'usdt' && (
                  <div className="pt-4">
                    <Button
                      onClick={handleSubmitActivation}
                      disabled={submitting || (paymentMethod === 'wallet' && walletBalance < 30)}
                      className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-xl shadow-primary/20 gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{tr("جاري إرسال الطلب...", "Submitting activation request...")}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {paymentMethod === 'wallet'
                              ? (tr("تفعيل فوري من رصيد المحفظة ($30 USD)", "Activate Instantly with Wallet ($30 USD)"))
                              : (tr("تأكيد وإرسال طلب التفعيل البنكي ($30 USD)", "Confirm and Submit Bank Activation Request ($30 USD)"))}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Support Contact Footer */}
            <div className="text-center text-xs text-slate-500 space-y-2 pb-6">
              <p>
                {tr("🔒 جميع المعاملات مشفرة وتخضع للرقابة المالية الآمنة عبر منصة Nexyvora.", "🔒 All transactions are secured and monitored on Nexyvora.")}
              </p>
              <p>
                {tr("هل تحتاج إلى مساعدة؟", "Need assistance?")}{' '}
                <a 
                  href="https://wa.me/212600000000?text=Hello%20Nexyvora%20Support%2C%20I%20need%20help%20with%20Community%20Membership%20activation." 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  {tr("تواصل مع الدعم الفني عبر واتساب", "Chat with Support on WhatsApp")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
