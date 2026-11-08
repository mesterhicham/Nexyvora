import { SecureLink } from '@/components/common/SecureFile';
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
import { usePlatformSettings } from '@/hooks/useAdminFeatures';

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
  const { data: platformSettings } = usePlatformSettings();
  const [logoFailed, setLogoFailed] = useState(false);

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
      const res = await api.post('/upload?private=true', formData, {
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
        return toast.error(tr(`رصيد المحفظة غير كافٍ ($${walletBalance.toFixed(2)} USD). يرجى اختيار وسيلة دفع أخرى.`, `Insufficient wallet balance ($${walletBalance.toFixed(2)} USD)`));
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
        paymentMethodId: paymentMethod === 'bank_transfer' ? allowedBankMethod?.id : undefined,
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
  // Methods enabled for this country in the admin "Country Currency" page (no hardcoded fallbacks)
  const cryptoAllowed = availableMethods.some((m: any) => m.type === 'nowpayments_crypto' || m.type === 'crypto' || m.provider === 'nowpayments');
  const allowedBankMethod = availableMethods.find((m: any) => m.type === 'bank_transfer' || m.provider === 'manual');

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

  // Brand assets & support contact come from admin Platform Settings
  const customLogoUrl = platformSettings?.map?.['logo_url']?.value || '';
  const supportWhatsapp = String(platformSettings?.map?.['support_whatsapp_number']?.value || '').replace(/[^\d]/g, '');
  const brandLogo = !logoFailed && customLogoUrl ? customLogoUrl : '/logo-dark.png';

  // Progress: 1 choose method, 2 pay / attach proof, 3 admin review
  const currentStep = pendingPackage && !showEditForm
    ? 3
    : (activePaymentOrder || paymentReference.trim() || receiptUrl ? 2 : 1);
  const steps = [
    { n: 1, label: tr("اختر وسيلة الدفع", "Choose method") },
    { n: 2, label: tr("ادفع وأرفق الإثبات", "Pay & attach proof") },
    { n: 3, label: tr("المراجعة والتفعيل", "Review & activation") },
  ];

  const benefits = [
    { icon: GraduationCap, color: 'text-cyan-300 bg-cyan-400/10', title: tr("الأكاديمية والتدريبات", "Academy & Training"), desc: tr("ورشات مباشرة أسبوعية ومحتوى تدريبي حصري للأعضاء.", "Live weekly workshops and exclusive educational tracks.") },
    { icon: Users, color: 'text-blue-300 bg-blue-400/10', title: tr("بناء الفريق والعمولات", "Affiliate & Team"), desc: tr("عمولة 50% ($15 USD) فورية لكل عضو مباشر ينضم عبرك.", "Earn 50% ($15 USD) direct bonus for every direct member.") },
    { icon: Trophy, color: 'text-violet-300 bg-violet-400/10', title: tr("الرتب وأحواض البونص", "Ranks & Bonus Pools"), desc: tr("افتح مسار الرتب القيادية وشارك في أرباح الشركة الشهرية.", "Unlock leadership ranks and share monthly company profits.") },
    { icon: Wallet, color: 'text-fuchsia-300 bg-fuchsia-400/10', title: tr("المحفظة وسحب الأرباح", "Wallet & Payouts"), desc: tr("إيداع وسحب عمولاتك بسهولة وأمان عبر وسائل الدفع المتاحة في بلدك.", "Deposit and withdraw safely with the methods available in your country.") },
  ];

  const methodTileClass = (active: boolean) =>
    `group relative p-4 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 ${
      active
        ? 'border-blue-400/60 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-violet-500/10 shadow-lg shadow-blue-500/10 text-white'
        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] text-slate-400 hover:text-slate-200'
    }`;
  const methodIconClass = (active: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
      active ? 'bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 text-white' : 'bg-white/5 text-slate-400'
    }`;

  const Backdrop = () => (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-violet-600/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#05070f] flex flex-col items-center justify-center text-white p-6">
        <Backdrop />
        <img src="/logo-icon.png" alt="Nexyvora" className="relative w-20 h-20 object-contain animate-pulse drop-shadow-[0_0_30px_rgba(59,130,246,0.45)]" />
        <Loader2 className="relative w-6 h-6 text-blue-400 animate-spin mt-6 mb-3" />
        <p className="relative text-sm font-bold text-slate-300">
          {tr("جاري التحقق من حالة حسابك...", "Checking account status...")}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05070f] text-slate-100 flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      <Backdrop />

      {/* Top Navbar with the official Nexyvora logo */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070f]/75 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={brandLogo}
              alt="Nexyvora"
              className="h-9 sm:h-10 w-auto max-w-[170px] sm:max-w-[210px] object-contain"
              onError={() => setLogoFailed(true)}
            />
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-400/20 bg-blue-500/10 text-[10px] font-bold tracking-wider uppercase text-blue-300">
              <ShieldCheck className="w-3 h-3" />
              {tr("بوابة التفعيل", "Activation Gate")}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="text-end leading-tight">
                <span className="block text-xs font-bold text-slate-100">{user?.full_name || user?.email}</span>
                <span className="block text-[10px] text-slate-500 font-mono">{user?.email}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 flex items-center justify-center text-sm font-black text-white">
                {(user?.full_name || user?.email || '?').trim().charAt(0).toUpperCase()}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="rounded-xl border-white/10 bg-white/[0.03] hover:bg-white/10 text-slate-300 text-xs gap-1.5 h-9 px-3"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">{tr("تسجيل الخروج", "Sign Out")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero */}
        <section className="text-center space-y-4 mb-8 sm:mb-10">
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 via-blue-500/30 to-violet-600/30 blur-2xl" />
            <img src="/logo-icon.png" alt="" className="relative w-full h-full object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-slate-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>{tr("الخطوة الأولى الإلزامية لتفعيل العضوية", "Step 1: Mandatory Membership Activation")}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              {tr("فعّل عضويتك في مجتمع Nexyvora", "Activate Your Nexyvora Membership")}
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {tr("للبدء في تصفح المنصة، حضور الدورات، تفعيل رابط الإحالة وجني العمولات بنسبة 50% ($15 USD)، أتمم رسوم عضوية المجتمع السنوية.", "To browse the platform, access academy training and activate referral earnings (50% / $15 USD direct bonus), complete your annual Community Membership.")}
          </p>

          {/* Stepper */}
          <ol className="flex items-center justify-center gap-2 sm:gap-3 pt-2">
            {steps.map((s, idx) => {
              const done = currentStep > s.n;
              const active = currentStep === s.n;
              return (
                <li key={s.n} className="flex items-center gap-2 sm:gap-3">
                  <div className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border text-[11px] sm:text-xs font-bold ${
                    active ? 'border-blue-400/50 bg-blue-500/15 text-white' : done ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-white/10 text-slate-500'
                  }`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      active ? 'bg-gradient-to-br from-cyan-400 to-violet-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-white/10'
                    }`}>
                      {done ? <Check className="w-3 h-3" /> : s.n}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && <span className="w-4 sm:w-8 h-px bg-white/10" />}
                </li>
              );
            })}
          </ol>
        </section>

        {/* PENDING CARD (If user already submitted payment proof) */}
        {pendingPackage && !showEditForm ? (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-amber-400/20 bg-white/[0.03] backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="p-6 sm:p-8 text-center border-b border-white/5 bg-gradient-to-b from-amber-500/10 to-transparent">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center mx-auto mb-4 border border-amber-400/30">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <Badge className="bg-amber-500/15 text-amber-200 border-amber-400/30 text-xs px-3 py-1 font-bold mb-3 mx-auto">
                  {tr("الحالة: قيد المراجعة والتدقيق", "Status: Under Admin Review")}
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                  {tr("طلب تفعيل عضويتك قيد المعالجة", "Your Activation Request Is Under Review")}
                </CardTitle>
                <CardDescription className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm mt-2">
                  {tr("شكراً لك! استلمنا إثبات دفع رسوم باقة المجتمع. يراجع فريق الإدارة الوصل الآن، وسيُفتح لك النظام بالكامل فور التأكيد.", "Thank you! We received your Community package payment proof. Our team is verifying it and your full access will unlock upon approval.")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/30 p-5 rounded-2xl border border-white/5 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">{tr("الباقة المطلوبة:", "Package:")}</span>
                    <span className="font-bold text-white text-sm">
                      {isRtl ? (pendingPackage.package_name_ar || pendingPackage.package_name) : (pendingPackage.package_name || pendingPackage.package_name_ar)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">{tr("المبلغ المدفوع:", "Amount Paid:")}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${Number(pendingPackage.amount_paid || 30).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">{tr("طريقة الدفع:", "Payment Method:")}</span>
                    <span className="font-bold text-slate-200">
                      {pendingPackage.payment_method === 'usdt' ? 'USDT (Crypto)' :
                       pendingPackage.payment_method === 'bank_transfer' ? (tr("تحويل بنكي", "Bank Transfer")) :
                       pendingPackage.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">{tr("رقم العملية / TxID:", "TxID / Reference:")}</span>
                    <span className="font-mono font-bold text-slate-200 break-all">
                      {pendingPackage.payment_reference || 'N/A'}
                    </span>
                  </div>
                  {pendingPackage.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block mb-1">{tr("الملاحظات / اسم المرسل:", "Notes / Sender:")}</span>
                      <span className="text-slate-300 italic">{pendingPackage.notes}</span>
                    </div>
                  )}
                  {pendingPackage.receipt_url && (
                    <div className="sm:col-span-2 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-slate-500">{tr("صورة الوصل المرفقة:", "Attached Receipt:")}</span>
                      <SecureLink
                        href={pendingPackage.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-300 hover:underline font-bold text-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {tr("معاينة الوصل", "View Receipt")}
                        <ExternalLink className="w-3 h-3" />
                      </SecureLink>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center pt-2">
                  <Button
                    onClick={() => loadData(true)}
                    className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:opacity-95 text-white gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{tr("تحديث حالة التفعيل الآن", "Refresh Activation Status")}</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                    className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold border-white/10 bg-white/[0.03] hover:bg-white/10 text-slate-300 text-xs"
                  >
                    {tr("تعديل بيانات أو وصل الدفع", "Update Payment Proof")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ACTIVATION PURCHASE / SUBMISSION FLOW */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start animate-in fade-in duration-500">
            {/* Payment card (first on mobile) */}
            <Card className="lg:col-span-3 lg:order-2 border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="p-6 sm:p-7 border-b border-white/5 bg-gradient-to-br from-blue-600/10 via-transparent to-violet-600/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-black text-white">
                      {tr("اختر وسيلة الدفع", "Select Payment Method")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                      {tr("رسوم عضوية المجتمع، صالحة لمدة سنة كاملة.", "Community membership fee, valid for one full year.")}
                    </CardDescription>
                  </div>
                  <div className="self-start sm:self-auto text-end">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">{tr("المبلغ المطلوب", "Amount due")}</span>
                    <span dir="ltr" className="block whitespace-nowrap font-mono font-black text-lg sm:text-xl bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
                      {formatDualPrice(30)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-7 space-y-6">
                {/* Method tiles */}
                <div className={`grid grid-cols-1 ${!isAlgeria && usdtEnabled && cryptoAllowed && allowedBankMethod ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3`}>
                  {/* USDT Crypto (only where the country rules allow it; never for Algeria) */}
                  {!isAlgeria && usdtEnabled && cryptoAllowed && (
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('usdt');
                        if (!activePaymentOrder) {
                          handleCreateCryptoOrder();
                        }
                      }}
                      className={methodTileClass(paymentMethod === 'usdt')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={methodIconClass(paymentMethod === 'usdt')}>
                          <Coins className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm block text-white">USDT (Crypto)</span>
                          <span className="text-[10px] text-emerald-400 block font-mono font-bold">NOWPayments (BEP20)</span>
                        </div>
                      </div>
                      {paymentMethod === 'usdt' && <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />}
                    </button>
                  )}

                  {/* Bank Transfer (only when enabled for this country) */}
                  {allowedBankMethod && (
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={methodTileClass(paymentMethod === 'bank_transfer')}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={methodIconClass(paymentMethod === 'bank_transfer')}>
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-xs sm:text-sm block text-white">
                            {tr("تحويل بنكي", "Bank Transfer")}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {bankMethod.bank_name || (isAlgeria ? 'BaridiMob / RIP' : (isMorocco ? 'CIH / Attijariwafa' : 'Local Bank'))}
                          </span>
                        </div>
                      </div>
                      {paymentMethod === 'bank_transfer' && <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />}
                    </button>
                  )}

                  {/* Internal Wallet */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={methodTileClass(paymentMethod === 'wallet')}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={methodIconClass(paymentMethod === 'wallet')}>
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs sm:text-sm block text-white">
                          {tr("رصيد المحفظة", "Wallet Balance")}
                        </span>
                        <span className="text-[10px] text-emerald-400 block font-mono font-bold">
                          ${walletBalance.toFixed(2)} USD
                        </span>
                      </div>
                    </div>
                    {paymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-blue-300 shrink-0" />}
                  </button>
                </div>

                {/* USDT flow */}
                {paymentMethod === 'usdt' && (
                  <div className="space-y-4">
                    {activePaymentOrder ? (
                      <div className="space-y-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-black/20 to-emerald-950/20 border border-emerald-500/25 animate-in fade-in duration-300">
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
                          <Badge variant="outline" className="font-mono text-[11px] bg-black/40 border-emerald-500/40 text-emerald-300 font-bold px-2.5 py-0.5">
                            #{activePaymentOrder.paymentId}
                          </Badge>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-black/40 border border-emerald-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Clock className={`h-4 w-4 ${orderTimeLeft < 300 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
                              {tr("الوقت المتبقي لصلاحية هذا العنوان:", "Address Validity Remaining:")}
                            </span>
                            <span className={`font-mono text-sm sm:text-base font-black ${orderTimeLeft < 300 ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {Math.floor(orderTimeLeft / 60)}:{(orderTimeLeft % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${orderTimeLeft < 300 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, Math.max(0, (orderTimeLeft / (20 * 60)) * 100))}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">
                            {tr("العنوان صالح ومخصص لك لمدة 20 دقيقة. بمجرد إرسال المبلغ، يرصد النظام المعاملة عبر البلوكشين ويفعّل حسابك تلقائياً.", "The address is active for 20 minutes. Once sent, the blockchain confirms and your account activates automatically.")}
                          </p>
                        </div>

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

                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
                          <div className="p-2 rounded-2xl bg-white shadow-lg shrink-0">
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
                            <div className="p-2.5 rounded-xl bg-black/50 font-mono text-xs font-bold text-slate-200 break-all select-all border border-white/5">
                              {activePaymentOrder.payAddress}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => copyToClipboard(activePaymentOrder.payAddress, 'nowpay_address')}
                                className="h-8 px-3 text-xs gap-1.5 font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
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
                                className="h-8 px-2.5 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-xl"
                              >
                                <RefreshCw className={`w-3 h-3 me-1 ${isCreatingCryptoOrder ? 'animate-spin' : ''}`} />
                                <span>{tr("تجديد العنوان", "Renew Address")}</span>
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleCheckCryptoPayment}
                          disabled={isCheckingPayment}
                          className="w-full h-11 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                          <RefreshCw className={`w-4 h-4 ${isCheckingPayment ? 'animate-spin' : ''}`} />
                          <span>{tr("فحص حالة الدفع والتفعيل الآن", "Check Payment & Activation Status")}</span>
                        </Button>
                        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 text-center">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                          {tr("يراقب النظام وصول التحويل تلقائياً كل 6 ثوانٍ وسيُفعَّل حسابك فوراً.", "Auto-monitoring every 6s. Your account will unlock automatically upon confirmation.")}
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 rounded-3xl bg-black/30 border border-white/5 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-300 flex items-center justify-center mx-auto">
                          <Coins className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-white">
                            {tr("الدفع الآلي عبر USDT BEP20 (NOWPayments)", "Automated Payment via USDT BEP20 (NOWPayments)")}
                          </h3>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            {tr("أنشئ محفظة دفع مخصصة لك. بمجرد إرسال المبلغ عبر شبكة BEP20 يُفعَّل حسابك تلقائياً دون مراجعة يدوية.", "Generate your dedicated wallet. Once sent, activation happens automatically without manual review.")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={handleCreateCryptoOrder}
                          disabled={isCreatingCryptoOrder}
                          className="h-11 px-6 rounded-2xl font-black bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:opacity-95 text-white gap-2"
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

                {/* Bank details exactly as configured in admin Country Currency settings */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden text-xs">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                      <span className="font-bold text-white text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-300" />
                        {tr("بيانات الحساب البنكي الرسمي", "Official Bank Details")}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                        {tr("حساب موثّق", "Verified")}
                      </Badge>
                    </div>
                    <div className="divide-y divide-white/5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">{tr("اسم البنك / الجهة", "Bank Name")}</span>
                          <span className="font-bold text-white text-sm">{bankMethod.bank_name || (isAlgeria ? 'BaridiMob' : 'Local Bank')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">{tr("اسم صاحب الحساب", "Account Holder")}</span>
                          <span className="font-bold text-white text-sm">{bankMethod.account_holder || '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 p-4">
                        <div className="min-w-0">
                          <span className="text-slate-500 block text-[10px] mb-0.5">{tr("رقم الحساب / RIP", "Account Number / RIP")}</span>
                          <span className="font-mono font-bold text-slate-100 text-sm break-all">{bankMethod.account_number || bankMethod.rib_iban || '—'}</span>
                        </div>
                        {(bankMethod.account_number || bankMethod.rib_iban) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bankMethod.account_number || bankMethod.rib_iban, 'rib')}
                            className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0 gap-1 font-bold text-xs"
                          >
                            {copiedField === 'rib' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'rib' ? (tr("تم!", "Copied!")) : (tr("نسخ", "Copy"))}</span>
                          </Button>
                        )}
                      </div>
                      {bankMethod.iban && bankMethod.iban !== bankMethod.account_number && (
                        <div className="flex items-center justify-between gap-2 p-4">
                          <div className="min-w-0">
                            <span className="text-slate-500 block text-[10px] mb-0.5">IBAN</span>
                            <span className="font-mono font-bold text-slate-100 text-sm break-all">{bankMethod.iban}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bankMethod.iban, 'iban')}
                            className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0 gap-1 font-bold text-xs"
                          >
                            {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'iban' ? (tr("تم!", "Copied!")) : (tr("نسخ", "Copy"))}</span>
                          </Button>
                        </div>
                      )}
                      {bankMethod.swift_code && (
                        <div className="p-4">
                          <span className="text-slate-500 block text-[10px] mb-0.5">SWIFT / BIC</span>
                          <span className="font-mono font-bold text-slate-100 text-sm">{bankMethod.swift_code}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 bg-blue-500/[0.06] px-4 py-3 border-t border-white/5 leading-relaxed whitespace-pre-line">
                      💡 {(bankMethod.instructions_ar || bankMethod.instructions)
                        ? (isRtl ? (bankMethod.instructions_ar || bankMethod.instructions) : (bankMethod.instructions || bankMethod.instructions_ar))
                        : tr(`حوّل ${formatDualPrice(30)}، ثم اكتب رقم الحوالة واسم المرسل وأرفق صورة الوصل أدناه.`, `Transfer ${formatDualPrice(30)}, enter the reference and sender name, and upload the slip below.`)}
                    </p>
                  </div>
                )}

                {/* Wallet flow */}
                {paymentMethod === 'wallet' && (
                  <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {tr("الدفع الفوري من رصيد المحفظة", "Instant Wallet Activation")}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${walletBalance.toFixed(2)} USD
                      </span>
                    </div>
                    {walletBalance >= 30 ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span>{tr("رصيدك كافٍ لتفعيل باقة المجتمع فوراً دون مراجعة أو وصل.", "Your wallet balance is sufficient. Activation happens immediately on confirm.")}</span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>
                          {tr(`رصيد محفظتك هو $${walletBalance.toFixed(2)} USD والمطلوب $30.00 USD. اختر وسيلة دفع أخرى لإتمام التفعيل.`, `Current wallet balance is $${walletBalance.toFixed(2)}. $30.00 is required. Please choose another method.`)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Bank transfer proof form */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">
                          {tr("رقم المعاملة / كود التحويل", "Transaction Reference")} <span className="text-rose-400">*</span>
                        </Label>
                        <Input
                          placeholder="Ref: V-982314"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs font-mono focus-visible:ring-blue-500/50"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-300">
                          {tr("اسم المرسل أو ملاحظات (اختياري)", "Sender Name / Notes (Optional)")}
                        </Label>
                        <Input
                          placeholder={tr("مثال: محمد العمري", "e.g. John Doe")}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-black/40 border-white/10 text-white rounded-xl h-11 text-xs focus-visible:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {tr("صورة وصل التحويل (مستحسن لتسريع المراجعة)", "Receipt Proof (Recommended)")}
                      </Label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      {receiptUrl ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/30 text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-emerald-300 font-bold truncate">
                              {tr("تم إرفاق وصل التحويل بنجاح", "Receipt attached")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <SecureLink
                              href={receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-300 hover:underline font-bold"
                            >
                              {tr("عرض", "View")}
                            </SecureLink>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setReceiptUrl('')}
                              className="h-7 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-white/5"
                            >
                              {tr("حذف", "Remove")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-white/10 hover:border-blue-400/50 bg-black/20 hover:bg-blue-500/[0.04] p-6 rounded-2xl text-center transition-colors"
                        >
                          {uploadingReceipt ? (
                            <span className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                              <span className="text-xs text-slate-400">{tr("جاري رفع الملف...", "Uploading receipt...")}</span>
                            </span>
                          ) : (
                            <span className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <span className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-blue-300" />
                              </span>
                              <span className="text-xs font-bold text-slate-300">
                                {tr("انقر لرفع صورة الوصل (PNG, JPG, PDF)", "Click to upload receipt (PNG, JPG, PDF)")}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {tr("الحد الأقصى: 5 ميغابايت. الملف خاص ولا يراه إلا أنت والإدارة.", "Max 5MB. The file is private: only you and administrators can see it.")}
                              </span>
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit (wallet or bank transfer) */}
                {paymentMethod !== 'usdt' && (
                  <Button
                    onClick={handleSubmitActivation}
                    disabled={submitting || (paymentMethod === 'wallet' && walletBalance < 30)}
                    className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:opacity-95 text-white shadow-xl shadow-blue-600/20 gap-2 disabled:opacity-50"
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
                            ? (tr("تفعيل فوري من رصيد المحفظة", "Activate Instantly with Wallet"))
                            : (tr("تأكيد وإرسال طلب التفعيل", "Confirm & Submit Activation Request"))}
                        </span>
                        <ArrowRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Benefits & trust column */}
            <aside className="lg:col-span-2 lg:order-1 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-base font-black text-white">{tr("ماذا تحصل عليه مع العضوية", "What membership unlocks")}</h2>
                  <p className="text-xs text-slate-500 mt-1">{tr("وصول كامل لكل أقسام المنصة لمدة سنة.", "Full access to every part of the platform for one year.")}</p>
                </div>
                <ul className="space-y-4">
                  {benefits.map((b) => (
                    <li key={b.title} className="flex items-start gap-3">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${b.color}`}>
                        <b.icon className="w-5 h-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-white">{b.title}</span>
                        <span className="block text-[11px] text-slate-400 leading-relaxed">{b.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 space-y-3 text-xs">
                <div className="flex items-start gap-3 text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="leading-relaxed">{tr("جميع المعاملات مؤمّنة، وإيصالات الدفع محفوظة بشكل خاص لا يراها إلا أنت والإدارة.", "All transactions are secured, and payment receipts are stored privately for you and administrators only.")}</span>
                </div>
                {supportWhatsapp && (
                  <a
                    href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent('Hello Nexyvora Support, I need help with Community Membership activation.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/10 font-bold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4" />
                      {tr("تحتاج مساعدة؟ تواصل مع الدعم عبر واتساب", "Need help? Chat with support on WhatsApp")}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <img src={brandLogo} alt="Nexyvora" className="h-7 w-auto object-contain opacity-80" onError={() => setLogoFailed(true)} />
          <span>© {new Date().getFullYear()} Nexyvora. {tr("جميع الحقوق محفوظة.", "All rights reserved.")}</span>
        </div>
      </footer>
    </div>
  );
}
