import { useState, useEffect, useRef } from 'react';
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
        toast.success(isRtl ? 'حسابك مفعل بالفعل! جاري نقلك للوحة التحكم...' : 'Account is active! Redirecting...');
        setTimeout(() => navigate('/student'), 1200);
        return;
      }

      setPendingPackage(pkgRes.pendingPackage || null);

      // Find Community package
      const packs = allPkgsRes.packages || [];
      const commPack = packs.find((p: any) => p.level === 1 || Number(p.price) === 30 || (p.slug && p.slug.includes('community'))) || packs[0] || null;
      setCommunityPackage(commPack);

      setWalletBalance(Number(walletRes?.wallet?.balance || 0));
      setAvailableMethods(methodsRes?.paymentMethods || []);

      if (showToast) {
        if (pkgRes.hasActivePackage) {
          toast.success(isRtl ? 'تهانينا! تم تفعيل عضويتك بنجاح.' : 'Membership activated successfully!');
        } else if (pkgRes.pendingPackage) {
          toast.info(isRtl ? 'الطلب لا يزال قيد المراجعة والتدقيق من طرف الإدارة.' : 'Request is still under review.');
        } else {
          toast.info(isRtl ? 'لم يتم العثور على طلبات معلقة.' : 'No pending requests found.');
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

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(isRtl ? 'تم النسخ إلى الحافظة!' : 'Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error(isRtl ? 'حجم الملف يجب ألا يتجاوز 5 ميغابايت' : 'File size must be under 5MB');
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
      toast.success(isRtl ? 'تم رفع صورة الوصل بنجاح!' : 'Receipt uploaded successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || (isRtl ? 'فشل رفع صورة الوصل' : 'Failed to upload receipt'));
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmitActivation = async () => {
    if (!communityPackage) {
      return toast.error(isRtl ? 'تعذر تحديد باقة المجتمع' : 'Community package not found');
    }

    if (paymentMethod === 'wallet') {
      if (walletBalance < 30) {
        return toast.error(isRtl ? `رصيد المحفظة غير كافٍ ($${walletBalance.toFixed(2)} USD). يرجى اختيار وسيلة دفع أخرى.` : 'Insufficient wallet balance');
      }
    } else {
      if (!paymentReference.trim()) {
        return toast.error(isRtl ? 'يرجى إدخال رقم العملية / الحوالة أو TxID' : 'Transaction reference / TxID is required');
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
        toast.success(res.message || (isRtl ? 'تم تفعيل باقة المجتمع بنجاح!' : 'Community package activated!'));
        setTimeout(() => navigate('/student'), 1000);
      } else {
        toast.success(res.message || (isRtl ? 'تم إرسال طلب التفعيل بنجاح وهو قيد المراجعة!' : 'Activation request submitted for review!'));
        setShowEditForm(false);
        loadData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (isRtl ? 'فشل إرسال طلب التفعيل' : 'Failed to submit activation request'));
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
    name: rule.bank_name || (isRtl ? 'تحويل بنكي محلي' : 'Local Bank Transfer'),
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
      name: isRtl ? 'تحويل بنكي محلي' : 'Bank Transfer',
      bank_name: isAlgeria ? 'BaridiMob' : (isMorocco ? 'Attijariwafa Bank' : 'Local Bank'),
      account_number: '',
      rib_iban: '',
      account_holder: '',
      instructions_ar: isRtl ? 'يرجى التحويل بالعملة المحلية إلى الحساب أعلاه وإرفاق صورة الوصل.' : 'Please transfer the amount in local currency and attach the receipt.'
    };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">
          {isRtl ? 'جاري التحقق من حالة حسابك...' : 'Checking account status...'}
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
              {isRtl ? 'بوابة التفعيل الإلزامية' : 'Activation Gate'}
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
            <span>{isRtl ? 'تسجيل الخروج' : 'Sign Out'}</span>
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
                  {isRtl ? 'الحالة: قيد المراجعة والتدقيق' : 'Status: Under Admin Review'}
                </Badge>
                <CardTitle className="text-2xl sm:text-3xl font-black text-white">
                  {isRtl ? 'طلب تفعيل عضويتك قيد المعالجة' : 'Your Activation Request Is Under Review'}
                </CardTitle>
                <CardDescription className="text-slate-300 max-w-xl mx-auto text-xs sm:text-sm mt-2">
                  {isRtl 
                    ? 'شكراً لك! لقد استلمنا إشعار تحويل رسوم باقة المجتمع ($30 USD). يقوم فريق الإدارة حالياً بمراجعة وصل الدفع، وسيتم فتح النظام بالكامل فور التأكيد.'
                    : 'Thank you! We received your Community package ($30 USD) payment proof. Our team is verifying your payment and your full access will unlock upon approval.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* Details Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">{isRtl ? 'الباقة المطلوبة:' : 'Package:'}</span>
                    <span className="font-bold text-white text-sm">
                      {isRtl ? (pendingPackage.package_name_ar || pendingPackage.package_name) : (pendingPackage.package_name || pendingPackage.package_name_ar)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{isRtl ? 'المبلغ المدفوع:' : 'Amount Paid:'}</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ${Number(pendingPackage.amount_paid || 30).toFixed(2)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{isRtl ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                    <span className="font-bold text-slate-200">
                      {pendingPackage.payment_method === 'usdt' ? 'USDT (Crypto)' :
                       pendingPackage.payment_method === 'bank_transfer' ? (isRtl ? 'تحويل بنكي' : 'Bank Transfer') :
                       pendingPackage.payment_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">{isRtl ? 'رقم العملية / TxID:' : 'TxID / Reference:'}</span>
                    <span className="font-mono font-bold text-slate-200 break-all">
                      {pendingPackage.payment_reference || 'N/A'}
                    </span>
                  </div>
                  {pendingPackage.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block mb-1">{isRtl ? 'الملاحظات / اسم المرسل:' : 'Notes / Sender:'}</span>
                      <span className="text-slate-300 italic">{pendingPackage.notes}</span>
                    </div>
                  )}
                  {pendingPackage.receipt_url && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">{isRtl ? 'صورة الوصل المرفقة:' : 'Attached Receipt:'}</span>
                      <a
                        href={pendingPackage.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold text-xs"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        {isRtl ? 'معاينة الوصل' : 'View Receipt'}
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
                    <span>{isRtl ? 'تحديث حالة التفعيل الآن' : 'Refresh Activation Status'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowEditForm(true)}
                    className="w-full sm:w-auto h-11 px-6 rounded-2xl font-bold border-slate-800 hover:bg-slate-800 text-slate-300 text-xs"
                  >
                    {isRtl ? 'تعديل بيانات أو وصل الدفع' : 'Update Payment Proof'}
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
                <span>{isRtl ? 'الخطوة الأولى الإلزامية لتفعيل العضوية' : 'Step 1: Mandatory Membership Activation'}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {isRtl ? 'تفعيل عضوية المجتمع الرسمية' : 'Activate Official Community Membership'}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {isRtl
                  ? 'للبدء في تصفح النظام، حضور الدورات، تفعيل رابط الإحالة وجني العمولات بنسبة 50% ($15 USD)، يرجى إتمام سداد رسوم عضوية المجتمع ($30 USD).'
                  : 'To browse the platform, access academy training, activate referral earnings (50% / $15 USD direct bonus), please complete your $30 Community Membership.'}
              </p>
            </div>

            {/* 4 Core Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-primary/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {isRtl ? 'الأكاديمية والتدريبات' : 'Academy & Training'}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isRtl ? 'ورشات مباشرة أسبوعية ومحتوى تدريبي استثماري مخصص للأعضاء.' : 'Live weekly workshops and exclusive educational tracks.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {isRtl ? 'بناء الفريق والعمولات' : 'Affiliate & Team'}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isRtl ? 'احصل على عمولة 50% ($15 USD) فورية لكل عضو مباشر ينضم عبرك.' : 'Earn 50% ($15 USD) direct bonus for every direct member registered.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {isRtl ? 'الرتب وأحواض البونص' : 'Ranks & Bonus Pools'}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isRtl ? 'فتح مسار الرتب القيادية وتقاسم أرباح الشركة الشهرية.' : 'Unlock leadership ranks and share 2% monthly company profits.'}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white mb-1">
                  {isRtl ? 'المحفظة وسحب الأرباح' : 'Wallet & Payouts'}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isRtl ? 'إيداع وسحب أرباحك وعمولاتك بكل سهولة وأمان عبر USDT أو البنك.' : 'Fast, reliable withdrawals of your commissions via USDT or Bank.'}
                </p>
              </div>
            </div>

            {/* Payment & Submission Form Card */}
            <Card className="border-slate-800 bg-slate-900/90 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-md">
              <CardHeader className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl sm:text-2xl font-black text-white">
                      {isRtl ? 'اختر وسيلة الدفع لتفعيل الباقة' : 'Select Payment Method for Activation'}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-400 mt-1">
                      {isRtl ? `المبلغ المطلوب سداده: ${formatDualPrice(30)} فقط (لمرة واحدة سنوياً).` : `Required amount: ${formatDualPrice(30)} (Annual validity).`}
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
                      onClick={() => setPaymentMethod('usdt')}
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
                          <span className="text-[10px] text-slate-400 block font-mono">
                            TRC20 / BEP20
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
                          {isRtl ? 'تحويل بنكي / يدوي' : 'Bank Transfer'}
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
                          {isRtl ? 'رصيد المنصة' : 'Wallet Balance'}
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
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {isRtl ? 'عنوان محفظة USDT الرسمي للمنصة:' : 'Official USDT Deposit Address:'}
                      </span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-mono">
                        TRC20 / BEP20
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-slate-200 text-xs">
                      <span className="flex-1 break-all select-all">
                        {cryptoMethod.crypto_wallet_address || '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B'}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(cryptoMethod.crypto_wallet_address || '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', 'crypto_addr')}
                        className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 gap-1 font-bold text-xs"
                      >
                        {copiedField === 'crypto_addr' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'crypto_addr' ? (isRtl ? 'تم!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
                      </Button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      💡 {isRtl 
                        ? 'يرجى إرسال مبلغ $30 USDT بدقة. بعد اكتمال التحويل، قم بنسخ معرف المعاملة (TxID) وإرفاق لقطة شاشة للوصل بالأسفل لتأكيد التفعيل.'
                        : 'Send exactly $30 USDT. Once sent, copy your Transaction Hash (TxID) and upload a screenshot proof below.'}
                    </p>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {isRtl ? 'بيانات الحساب البنكي الرسمي:' : 'Official Bank Details:'}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                        {isRtl ? 'حساب تجاري موثق' : 'Verified Merchant'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isRtl ? 'اسم البنك / الجهة:' : 'Bank Name:'}</span>
                        <span className="font-bold text-white text-xs">{bankMethod.bank_name || (isAlgeria ? 'BaridiMob' : 'Local Bank')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">{isRtl ? 'اسم صاحب الحساب:' : 'Account Holder:'}</span>
                        <span className="font-bold text-white text-xs">{bankMethod.account_holder || '—'}</span>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block text-[10px]">{isRtl ? 'رقم الحساب / RIP / الحساب البنكي:' : 'Account Number / RIP:'}</span>
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
                            <span>{copiedField === 'rib' ? (isRtl ? 'تم!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
                          </Button>
                        )}
                      </div>

                      {bankMethod.iban && bankMethod.iban !== bankMethod.account_number && (
                        <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-slate-400 block text-[10px]">{isRtl ? 'رقم الآيبان الدولي (IBAN):' : 'IBAN Number:'}</span>
                            <span className="font-mono font-bold text-slate-200 text-xs">{bankMethod.iban}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(bankMethod.iban, 'iban')}
                            className="h-8 px-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 gap-1 font-bold text-xs"
                          >
                            {copiedField === 'iban' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'iban' ? (isRtl ? 'تم!' : 'Copied!') : (isRtl ? 'نسخ' : 'Copy')}</span>
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
                        💡 {isRtl 
                          ? `قم بتحويل ${formatDualPrice(30)}، ثم اكتب رقم الحوالة واسم صاحب الحساب وأرفق صورة الوصل أدناه.`
                          : 'Transfer the equivalent of $30 USD, enter the reference number and sender name, and upload the bank slip.'}
                      </p>
                    )}
                  </div>
                )}

                {paymentMethod === 'wallet' && (
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        {isRtl ? 'الدفع الفوري من رصيد المحفظة:' : 'Instant Wallet Activation:'}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${walletBalance.toFixed(2)} USD
                      </span>
                    </div>

                    {walletBalance >= 30 ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                        <span>
                          {isRtl 
                            ? 'رصيدك متاح وكافٍ لتفعيل باقة المجتمع فوراً دون الحاجة لمراجعة أو إرفاق وصل!'
                            : 'Your wallet balance is sufficient. Activation will take place immediately upon clicking confirm!'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2.5">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                        <span>
                          {isRtl 
                            ? `رصيد محفظتك المتاح هو $${walletBalance.toFixed(2)} USD والمبلغ المطلوب هو $30.00 USD. يرجى اختيار USDT أو تحويل بنكي لإتمام التفعيل.`
                            : `Current wallet balance is $${walletBalance.toFixed(2)}. $30.00 is required. Please choose USDT or Bank Transfer.`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* FORM INPUTS (Only needed for crypto or bank transfer) */}
                {paymentMethod !== 'wallet' && (
                  <div className="space-y-4 pt-2">
                    {/* Reference / TxID */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {isRtl ? 'رقم المعاملة / كود التحويل (TxID أو رقم الوصل)' : 'Transaction ID / Reference (TxID)'} <span className="text-rose-400">*</span>
                      </Label>
                      <Input
                        placeholder="TxID / Ref: e.g. 0x8a9f... or V-982314"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white rounded-xl h-10 text-xs font-mono"
                      />
                    </div>

                    {/* Sender Name / Notes */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {isRtl ? 'اسم المرسل أو ملاحظات إضافية (اختياري)' : 'Sender Name / Extra Notes (Optional)'}
                      </Label>
                      <Input
                        placeholder={isRtl ? 'مثال: محمد العمري - حوالة BaridiMob' : 'e.g. John Doe - Transfer note'}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-white rounded-xl h-10 text-xs"
                      />
                    </div>

                    {/* Receipt Upload */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-300">
                        {isRtl ? 'صورة وصل التحويل (مستحسن لتسريع المراجعة)' : 'Receipt Proof Screenshot (Recommended)'}
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
                              {isRtl ? 'تم إرفاق وصل التحويل بنجاح' : 'Receipt attached'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline font-bold"
                            >
                              {isRtl ? 'عرض' : 'View'}
                            </a>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setReceiptUrl('')}
                              className="h-7 text-[10px] text-rose-400 hover:text-rose-300 hover:bg-slate-900"
                            >
                              {isRtl ? 'حذف' : 'Remove'}
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
                                {isRtl ? 'جاري رفع الملف...' : 'Uploading receipt...'}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                              <Upload className="w-6 h-6 text-primary" />
                              <span className="text-xs font-bold text-slate-300">
                                {isRtl ? 'انقر هنا لرفع صورة الوصل (PNG, JPG, PDF)' : 'Click to upload receipt image (PNG, JPG, PDF)'}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {isRtl ? 'الحد الأقصى للملف: 5 ميغابايت' : 'Maximum file size: 5MB'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Big Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmitActivation}
                    disabled={submitting || (paymentMethod === 'wallet' && walletBalance < 30)}
                    className="w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 text-white shadow-xl shadow-primary/20 gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isRtl ? 'جاري إرسال الطلب...' : 'Submitting activation request...'}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {paymentMethod === 'wallet'
                            ? (isRtl ? 'تفعيل فوري من رصيد المحفظة ($30 USD)' : 'Activate Instantly with Wallet ($30 USD)')
                            : (isRtl ? 'تأكيد وإرسال طلب التفعيل ($30 USD)' : 'Confirm and Submit Activation Request ($30 USD)')}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Support Contact Footer */}
            <div className="text-center text-xs text-slate-500 space-y-2 pb-6">
              <p>
                {isRtl 
                  ? '🔒 جميع المعاملات مشفرة وتخضع للرقابة المالية الآمنة عبر منصة Nexyvora.' 
                  : '🔒 All transactions are secured and monitored on Nexyvora.'}
              </p>
              <p>
                {isRtl ? 'هل تحتاج إلى مساعدة؟' : 'Need assistance?'}{' '}
                <a 
                  href="https://wa.me/212600000000?text=Hello%20Nexyvora%20Support%2C%20I%20need%20help%20with%20Community%20Membership%20activation." 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:underline font-bold inline-flex items-center gap-1"
                >
                  {isRtl ? 'تواصل مع الدعم الفني عبر واتساب' : 'Chat with Support on WhatsApp'}
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
