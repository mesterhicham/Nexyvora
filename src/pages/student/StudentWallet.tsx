import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { affiliateService } from '@/services/apiService';
import { 
  Wallet, 
  ArrowDownToLine, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  CreditCard, 
  Loader2,
  DollarSign,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  EyeOff,
  Copy,
  Check,
  Coins,
  Receipt
} from 'lucide-react';
import { toast } from "sonner";
import { useCurrency } from '@/contexts/CurrencyContext';

export default function StudentWallet() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { isAlgeria, isMorocco, usdtEnabled, currencyCode, currencySymbol, convertToLocal, formatPrice, formatDualPrice, formatBalance } = useCurrency();
  const [walletData, setWalletData] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

  // Withdraw Modal State
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('nowpayments_crypto');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payoutSettings, setPayoutSettings] = useState<any>(null);

  // Deposit Modal State
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('50');
  const [depositMethod, setDepositMethod] = useState('nowpayments_crypto');
  const [depositReference, setDepositReference] = useState('');
  const [depositNotes, setDepositNotes] = useState('');
  const [depositReceiptUrl, setDepositReceiptUrl] = useState('');
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activePaymentOrder, setActivePaymentOrder] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const fillDetailsFromSettings = (method: string, settings: any) => {
    if (!settings) return '';
    if (method === 'bank_transfer') {
      const parts = [];
      if (settings.bank_name) parts.push(`Bank: ${settings.bank_name}`);
      if (settings.account_holder) parts.push(`Name: ${settings.account_holder}`);
      if (settings.iban) parts.push(`IBAN: ${settings.iban}`);
      if (settings.swift_code) parts.push(`SWIFT: ${settings.swift_code}`);
      return parts.join(' | ');
    } else if (method === 'paypal') {
      return settings.paypal_email || '';
    } else if (method === 'payoneer') {
      return settings.payoneer_email || '';
    } else if (method === 'stripe') {
      return settings.stripe_account || '';
    }
    return '';
  };

  const handleSelectPaymentMethod = (methodId: string) => {
    setPaymentMethod(methodId);
    const m = availableMethods.find(item => item.id === methodId || item.type === methodId);
    const mType = m?.type || methodId;
    const prefill = fillDetailsFromSettings(mType, payoutSettings);
    if (prefill) {
      setPaymentDetails(prefill);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(t('wallet.copied', isRtl ? 'تم النسخ بنجاح!' : 'Copied to clipboard!'));
    setTimeout(() => setCopiedField(null), 2000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletRes, commsRes, withRes, payoutRes, depositsRes, methodsRes] = await Promise.all([
        affiliateService.getWallet(),
        affiliateService.getCommissions(),
        affiliateService.getWithdrawals(),
        affiliateService.getPayoutSettings().catch(() => ({ payoutSettings: null })),
        affiliateService.getDeposits().catch(() => ({ deposits: [] })),
        affiliateService.getPaymentMethods().catch(() => ({ paymentMethods: [] }))
      ]);
      setWalletData(walletRes);
      setCommissions(commsRes?.commissions || []);
      setWithdrawals(withRes?.withdrawals || []);
      setDeposits(depositsRes?.deposits || []);
      
      const settings = payoutRes?.payoutSettings || null;
      setPayoutSettings(settings);

      const methodsList = methodsRes?.paymentMethods || [];
      setAvailableMethods(methodsList);

      const depMethods = methodsList.filter((m: any) => m.enabled_for_deposit);
      if (depMethods.length > 0) {
        setDepositMethod(depMethods[0].id);
      }

      const withMethods = methodsList.filter((m: any) => m.enabled_for_withdrawal);
      if (withMethods.length > 0) {
        setPaymentMethod(withMethods[0].id);
      }

      if (settings) {
        setPaymentDetails(fillDetailsFromSettings('bank_transfer', settings));
      }
    } catch (err) {
      toast.error(t('common.error', isRtl ? 'فشل تحميل بيانات المحفظة' : 'Failed to load wallet data'));
    } finally {
      setLoading(false);
    }
  };

  const defaultFallbackMethods = [
    {
      id: 'nowpayments_crypto',
      name: 'NOWPayments.io — USDT (BEP20)',
      name_ar: 'NOWPayments.io — USDT (BEP20)',
      type: 'nowpayments_crypto',
      provider: 'nowpayments',
      crypto_currency: 'USDT_BEP20',
      crypto_network: 'BEP20',
      crypto_wallet_address: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B',
      instructions_ar: 'يرجى إرسال مبلغ USDT المطلوب عبر شبكة BNB Smart Chain (BEP20) إلى العنوان أعلاه، ثم نسخ رمز المعاملة TxID لتأكيد الشحن فوراً.',
      instructions: 'Send the exact USDT amount via BNB Smart Chain (BEP20) to the address above, then submit your TxID.',
      require_receipt: true,
      enabled_for_deposit: true,
      enabled_for_withdrawal: true,
      min_deposit: 10,
      min_withdrawal: 20
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer / Manuel Payment',
      name_ar: 'تحويل بنكي / دفع يدوي',
      type: 'bank_transfer',
      provider: 'manual',
      bank_name: 'Nexyvora International Bank',
      account_holder: 'NEXYVORA ACADEMY',
      account_number: 'DZ5200001000123456789012',
      swift_code: 'NXTVUS33',
      instructions_ar: 'يرجى تحويل المبلغ المطلوب إلى الحساب البنكي أعلاه وإرفاق صورة أو وصل التحويل مع رقم العملية لتسريع التفعيل.',
      instructions: 'Please transfer to the bank account above and upload the receipt with the transaction reference.',
      require_receipt: true,
      enabled_for_deposit: true,
      enabled_for_withdrawal: true,
      min_deposit: 20,
      min_withdrawal: 50
    },
    {
      id: 'card_gateway',
      name: 'Credit / Debit Card (Online Gateway)',
      name_ar: 'بطاقة بنكية إلكترونية (Visa / Mastercard)',
      type: 'card_gateway',
      provider: 'stripe',
      instructions_ar: 'دفع إلكتروني فوري وآمن بالبطاقة البنكية الدولية (Visa / Mastercard).',
      instructions: 'Instant and secure online card payment via Visa or Mastercard.',
      require_receipt: false,
      enabled_for_deposit: true,
      enabled_for_withdrawal: true,
      min_deposit: 10,
      min_withdrawal: 50
    }
  ];

  const getMethodIcon = (type: string, provider?: string) => {
    if (type === 'nowpayments_crypto' || provider === 'nowpayments') return Coins;
    if (type === 'bank_transfer' || provider === 'manual') return Building2;
    if (type === 'card_gateway' || provider === 'stripe' || provider === 'cmi') return CreditCard;
    return DollarSign;
  };

  const effectiveMethods = availableMethods.length > 0 ? availableMethods : defaultFallbackMethods;
  const depositMethodsList = effectiveMethods.filter((m: any) => m.enabled_for_deposit);
  const withdrawMethodsList = effectiveMethods.filter((m: any) => m.enabled_for_withdrawal);

  const selectedDepositMethod = depositMethodsList.find((m: any) => m.id === depositMethod || m.type === depositMethod) || depositMethodsList[0] || effectiveMethods[0];
  const selectedWithdrawMethod = withdrawMethodsList.find((m: any) => m.id === paymentMethod || m.type === paymentMethod) || withdrawMethodsList[0] || effectiveMethods[0];

  const handleWithdrawSubmit = async () => {
    const amt = Number(withdrawAmount);
    const minWithdrawal = selectedWithdrawMethod?.min_withdrawal || walletData?.minWithdrawal || 50;

    const minWithdrawalText = isAlgeria 
      ? `${convertToLocal(minWithdrawal).toLocaleString()} DZD` 
      : isMorocco 
        ? `${convertToLocal(minWithdrawal).toLocaleString()} MAD (${minWithdrawal} USDT)`
        : `$${minWithdrawal} USD`;

    if (!amt || amt < minWithdrawal) {
      return toast.error(`${t('wallet.minWithdrawalNotice', isRtl ? 'الحد الأدنى للسحب هو' : 'Minimum withdrawal is')} ${minWithdrawalText}`);
    }

    if (amt > (walletData?.wallet?.balance || 0)) {
      return toast.error(t('packages.insufficientBalance', isRtl ? 'الرصيد المتاح غير كافٍ' : 'Insufficient available balance'));
    }

    if (!paymentDetails.trim()) {
      return toast.error(isAlgeria 
        ? (isRtl ? 'يرجى كتابة تفاصيل الحساب البنكي أو البريدي' : 'Please provide bank account details')
        : t('wallet.accountDetails', isRtl ? 'يرجى كتابة تفاصيل الحساب أو عنوان محفظة USDT' : 'Please provide account details or USDT wallet address'));
    }

    try {
      setSubmitting(true);
      const methodLabel = selectedWithdrawMethod ? (isRtl ? (selectedWithdrawMethod.name_ar || selectedWithdrawMethod.name) : (selectedWithdrawMethod.name || selectedWithdrawMethod.name_ar)) : paymentMethod;
      const res = await affiliateService.requestWithdrawal({
        amount: amt,
        paymentMethod: methodLabel,
        paymentDetails
      });
      toast.success(res.message || t('common.success', isRtl ? 'تم تقديم طلب السحب بنجاح' : 'Withdrawal request submitted successfully'));
      setIsWithdrawOpen(false);
      setWithdrawAmount('');
      setPaymentDetails('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.error', isRtl ? 'فشل تقديم طلب السحب' : 'Failed to submit withdrawal request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDepositSubmit = async () => {
    const amt = Number(depositAmount);
    if (!amt || amt <= 0) {
      return toast.error(t('wallet.amount', isRtl ? 'يرجى كتابة مبلغ إيداع صحيح أكبر من 0' : 'Please enter a valid deposit amount greater than 0'));
    }

    if (selectedDepositMethod?.min_deposit && amt < selectedDepositMethod.min_deposit) {
      return toast.error(`${t('wallet.minDepositNotice', isRtl ? 'الحد الأدنى للإيداع لهذه الطريقة هو' : 'Minimum deposit for this method is')} $${selectedDepositMethod.min_deposit} USD`);
    }

    const isCrypto = selectedDepositMethod?.type === 'nowpayments_crypto' || selectedDepositMethod?.provider === 'nowpayments';

    if (!isCrypto && !depositReference.trim()) {
      return toast.error(t('wallet.reference', isRtl ? 'يرجى كتابة رقم العملية أو المعاملة (Reference / TxID) لتسريع التدقيق' : 'Please enter reference / TxID for faster verification'));
    }

    try {
      setSubmittingDeposit(true);
      const methodLabel = selectedDepositMethod ? (isRtl ? (selectedDepositMethod.name_ar || selectedDepositMethod.name) : (selectedDepositMethod.name || selectedDepositMethod.name_ar)) : depositMethod;
      const res = await affiliateService.requestDeposit({
        amount: amt,
        paymentMethod: isCrypto ? 'nowpayments_crypto' : methodLabel,
        paymentReference: depositReference.trim() || undefined,
        receiptUrl: depositReceiptUrl.trim() || undefined,
        notes: depositNotes.trim() || undefined
      });

      if (res.payment) {
        setActivePaymentOrder(res.payment);
        toast.success(isRtl ? 'تم إنشاء عنوان الدفع المخصص لك بنجاح!' : 'Payment order created successfully!');
      } else {
        toast.success(res.message || t('common.success', isRtl ? 'تم إرسال طلب الإيداع بنجاح' : 'Deposit request submitted successfully'));
        setIsDepositOpen(false);
      }

      setDepositAmount('50');
      setDepositReference('');
      setDepositNotes('');
      setDepositReceiptUrl('');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('common.error', isRtl ? 'فشل إرسال طلب الإيداع' : 'Failed to submit deposit request'));
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const wallet = walletData?.wallet || { balance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 };
  const minWithdraw = walletData?.minWithdrawal || 50;

  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12">
        {/* Header matching screenshot */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('wallet.myWallet', 'My Wallet')}
          </h1>

          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs">
            <CheckCircle2 className="h-5 w-5 stroke-[2.2]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
        </div>

        {/* Blue Hero Wallet Card (Exact match to screenshot) */}
        <div className="bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Total Balance + Eye Toggle */}
          <div className="flex items-center justify-center gap-2 text-white/90 text-xs sm:text-sm font-medium">
            <span>{t('wallet.totalBalance', isRtl ? 'إجمالي الرصيد' : 'Total Balance')}</span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1 hover:text-white transition-colors"
              title={showBalance ? (isRtl ? 'إخفاء الرصيد' : 'Hide Balance') : (isRtl ? 'إظهار الرصيد' : 'Show Balance')}
            >
              {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>

          {/* Big Amount */}
          <div className="text-center mt-2 mb-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {formatBalance(wallet.balance || 0, showBalance).primary}
            </h2>
            {formatBalance(wallet.balance || 0, showBalance).secondary && (
              <p className="text-[11px] sm:text-xs text-blue-100/75 mt-1 font-medium">
                {formatBalance(wallet.balance || 0, showBalance).secondary}
              </p>
            )}
          </div>

          {/* Action Buttons: Deposit & Withdraw */}
          <div className="flex items-center justify-center gap-10 sm:gap-14 pt-4 border-t border-white/15">
            {/* 1. Deposit */}
            <button
              onClick={() => setIsDepositOpen(true)}
              className="flex flex-col items-center group active:scale-95 transition-all"
            >
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ArrowDownLeft className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white mt-2 tracking-tight">
                {t('wallet.depositBtn', isRtl ? 'إيداع' : 'Deposit')}
              </span>
            </button>

            {/* 2. Withdraw */}
            <button
              onClick={() => setIsWithdrawOpen(true)}
              className="flex flex-col items-center group active:scale-95 transition-all"
            >
              <div className="w-14 h-14 sm:w-15 sm:h-15 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white mt-2 tracking-tight">
                {t('wallet.withdrawBtn', isRtl ? 'سحب' : 'Withdraw')}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Overview Stat Cards (Pending, Total Earned, Total Withdrawn) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('wallet.pendingBalance', isRtl ? 'الرصيد المعلق' : 'Pending Balance')}</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-500">
                {isAlgeria 
                  ? convertToLocal(wallet.pendingBalance || 0).toLocaleString() 
                  : isMorocco
                    ? convertToLocal(wallet.pendingBalance || 0).toLocaleString()
                    : `$${Number(wallet.pendingBalance || 0).toFixed(2)}`}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {isAlgeria ? 'DZD' : isMorocco ? 'MAD' : 'USD'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t('wallet.pendingDesc', isRtl ? 'يتحول لمتاح بعد انتهاء فترة الأمان' : 'Unlocks after clearance period')}
            </p>
          </Card>

          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('wallet.totalEarned', isRtl ? 'إجمالي الأرباح' : 'Total Earned')}</span>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {isAlgeria 
                  ? convertToLocal(wallet.totalEarned || 0).toLocaleString() 
                  : isMorocco
                    ? convertToLocal(wallet.totalEarned || 0).toLocaleString()
                    : `$${Number(wallet.totalEarned || 0).toFixed(2)}`}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {isAlgeria ? 'DZD' : isMorocco ? 'MAD' : 'USD'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t('wallet.totalEarnedDesc', isRtl ? 'مجموع عمولات أجيال الفريق' : 'Team generations commission total')}
            </p>
          </Card>

          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">{t('wallet.totalWithdrawn', isRtl ? 'إجمالي المسحوبات' : 'Total Withdrawn')}</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {isAlgeria 
                  ? convertToLocal(wallet.totalWithdrawn || 0).toLocaleString() 
                  : isMorocco
                    ? convertToLocal(wallet.totalWithdrawn || 0).toLocaleString()
                    : `$${Number(wallet.totalWithdrawn || 0).toFixed(2)}`}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {isAlgeria ? 'DZD' : isMorocco ? 'MAD' : 'USD'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {t('wallet.totalWithdrawnDesc', isRtl ? 'تم سحبها وتحويلها بنجاح' : 'Successfully withdrawn & processed')}
            </p>
          </Card>
        </div>

        {/* My Assets & Transactions Section (Matching Screenshot) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('wallet.myAssets', 'My Assets')}
            </h2>
          </div>

          {/* Quick Coin View Row */}
          {isAlgeria ? (
            <div className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  DA
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">DZD</h4>
                  <p className="text-[10px] text-slate-400">{isRtl ? 'الدينار الجزائري' : 'Algerian Dinar'}</p>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {convertToLocal(wallet.balance || 0).toLocaleString()} DZD
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isRtl ? 'الرصيد المتاح' : 'Available Balance'}
                </p>
              </div>
            </div>
          ) : isMorocco ? (
            <div className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  DH
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">MAD</h4>
                  <p className="text-[10px] text-slate-400">{isRtl ? 'الدرهم المغربي' : 'Moroccan Dirham'}</p>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {convertToLocal(wallet.balance || 0).toLocaleString()} MAD
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                  ≈ {Number(wallet.balance || 0).toFixed(2)} USDT
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-[22px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  $
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">USD</h4>
                  <p className="text-[10px] text-slate-400">{isRtl ? 'الدولار الأمريكي' : 'US Dollar'}</p>
                </div>
              </div>
              <div className="text-right rtl:text-left">
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  ${Number(wallet.balance || 0).toFixed(2)}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isRtl ? 'الرصيد المتاح' : 'Available Balance'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs: Commissions, Deposits, Withdrawals */}
        <Tabs defaultValue="commissions" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-3 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 h-auto gap-1">
            <TabsTrigger value="commissions" className="rounded-xl text-[11px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2 truncate">
              {t('wallet.commissionsTab', isRtl ? 'العمولات' : 'Commissions')} ({commissions.length})
            </TabsTrigger>
            <TabsTrigger value="deposits" className="rounded-xl text-[11px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2 truncate">
              {t('wallet.depositsTab', isRtl ? 'الإيداع' : 'Deposits')} ({deposits.length})
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-xl text-[11px] sm:text-xs font-bold px-2 sm:px-4 py-1.5 sm:py-2 truncate">
              {t('wallet.withdrawalsTab', isRtl ? 'السحب' : 'Withdrawals')} ({withdrawals.length})
            </TabsTrigger>
          </TabsList>

          {/* Commissions Table */}
          <TabsContent value="commissions">
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-4">{t('wallet.depositDate', isRtl ? 'التاريخ' : 'Date')}</th>
                      <th className="p-4">{t('wallet.buyer', isRtl ? 'المشتري' : 'Buyer')}</th>
                      <th className="p-4">{t('wallet.package', isRtl ? 'الباقة' : 'Package')}</th>
                      <th className="p-4">{t('wallet.generationLevel', isRtl ? 'مستوى الجيل' : 'Generation Level')}</th>
                      <th className="p-4">{t('wallet.saleAmount', isRtl ? 'قيمة المبيعة' : 'Sale Amount')}</th>
                      <th className="p-4">{t('wallet.rate', isRtl ? 'نسبة الربح' : 'Rate')}</th>
                      <th className="p-4">{t('wallet.receivedCommission', isRtl ? 'العمولة المستلمة' : 'Commission Earned')}</th>
                      <th className="p-4">{t('wallet.statusCol', isRtl ? 'الحالة' : 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {commissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          {t('wallet.noCommissions', isRtl ? 'لا توجد عمولات مسجلة بعد. شارك رابط إحالتك وابدأ في بناء فريقك!' : 'No commissions recorded yet. Share your referral link and build your team!')}
                        </td>
                      </tr>
                    ) : (
                      commissions.map((comm) => (
                        <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 text-slate-400">
                            {new Date(comm.created_at).toLocaleDateString(dateLocale)}
                          </td>
                          <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">
                            {comm.source_user_name || comm.source_user_email}
                          </td>
                          <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                            {i18n.language === 'ar' ? (comm.package_name_ar || comm.package_name) : (comm.package_name || comm.package_name_ar)}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
                              {t('team.gen', isRtl ? 'الجيل' : 'Gen')} {comm.generation_level}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600 dark:text-slate-300 font-mono">
                            ${comm.sale_amount}
                          </td>
                          <td className="p-4 font-bold text-primary font-mono">
                            {comm.rate_percentage}%
                          </td>
                          <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                            +${comm.commission_amount} USD
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                              {t('common.status', isRtl ? 'متاح' : 'Available')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Deposits Table */}
          <TabsContent value="deposits">
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-4">{t('wallet.depositDate', isRtl ? 'تاريخ الطلب' : 'Request Date')}</th>
                      <th className="p-4">{t('wallet.depositAmountCol', isRtl ? 'المبلغ المودع' : 'Amount Deposited')}</th>
                      <th className="p-4">{t('wallet.depositMethodCol', isRtl ? 'وسيلة الإيداع' : 'Deposit Method')}</th>
                      <th className="p-4">{t('wallet.depositRefCol', isRtl ? 'رقم المعاملة / المرجع' : 'Transaction Ref / TxID')}</th>
                      <th className="p-4">{t('wallet.notesCol', isRtl ? 'الملاحظات' : 'Notes')}</th>
                      <th className="p-4">{t('wallet.statusCol', isRtl ? 'الحالة' : 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400">
                          <Wallet className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          {t('wallet.noDeposits', isRtl ? 'لم تقم بتقديم أي طلب شحن رصيد حتى الآن.' : 'No deposit requests submitted yet.')}
                        </td>
                      </tr>
                    ) : (
                      deposits.map((dep) => {
                        const meta = dep.metadata || {};
                        return (
                          <tr key={dep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-4 text-slate-400">
                              {new Date(dep.created_at).toLocaleDateString(dateLocale)}
                            </td>
                            <td className="p-4 font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                              ${Number(dep.amount).toFixed(2)} USD
                            </td>
                            <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                              {meta.paymentMethod === 'baridimob' ? 'BaridiMob / CCP' :
                               meta.paymentMethod === 'usdt' ? 'USDT TRC-20' :
                               meta.paymentMethod === 'bank_transfer' ? 'Bank Transfer' :
                               meta.paymentMethod === 'paypal' ? 'PayPal' :
                               meta.paymentMethod || 'Deposit'}
                            </td>
                            <td className="p-4 font-mono text-[11px] text-slate-500">
                              {dep.reference_id || meta.paymentReference || '—'}
                            </td>
                            <td className="p-4 text-slate-500 text-[11px] max-w-xs truncate">
                              {dep.description || meta.notes || '—'}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                dep.status === 'completed'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                                  : dep.status === 'rejected'
                                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                              }`}>
                                {dep.status === 'completed' ? t('wallet.statusCompleted', isRtl ? 'تم الشحن والإضافة ✓' : 'Completed ✓') : 
                                 dep.status === 'rejected' ? t('wallet.statusRejected', isRtl ? 'مرفوض' : 'Rejected') : 
                                 t('wallet.statusPending', isRtl ? 'قيد التدقيق' : 'Pending Review')}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Withdrawals Table */}
          <TabsContent value="withdrawals">
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="p-4">{t('wallet.depositDate', isRtl ? 'تاريخ الطلب' : 'Request Date')}</th>
                      <th className="p-4">{t('wallet.depositAmountCol', isRtl ? 'المبلغ' : 'Amount')}</th>
                      <th className="p-4">{t('wallet.payoutMethod', isRtl ? 'وسيلة السحب' : 'Payout Method')}</th>
                      <th className="p-4">{t('wallet.accountDetails', isRtl ? 'تفاصيل الحساب' : 'Account Details')}</th>
                      <th className="p-4">{t('wallet.statusCol', isRtl ? 'الحالة' : 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {withdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          {t('wallet.noWithdrawals', isRtl ? 'لم تقم بتقديم أي طلب سحب حتى الآن.' : 'No withdrawal requests submitted yet.')}
                        </td>
                      </tr>
                    ) : (
                      withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 text-slate-400">
                            {new Date(w.created_at).toLocaleDateString(dateLocale)}
                          </td>
                          <td className="p-4 font-bold text-sm text-slate-900 dark:text-white font-mono">
                            ${w.amount} USD
                          </td>
                          <td className="p-4 uppercase font-semibold text-slate-600 dark:text-slate-300">
                            {w.payment_method.replace('_', ' ')}
                          </td>
                          <td className="p-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                            {w.payment_details}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              w.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-600'
                                : w.status === 'rejected'
                                ? 'bg-rose-100 text-rose-600'
                                : 'bg-amber-100 text-amber-600'
                            }`}>
                              {w.status === 'completed' ? t('wallet.statusCompleted', isRtl ? 'تم الدفع ✓' : 'Paid ✓') : 
                               w.status === 'rejected' ? t('wallet.statusRejected', isRtl ? 'مرفوض' : 'Rejected') : 
                               t('wallet.statusPending', isRtl ? 'قيد المراجعة' : 'Pending Review')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* --- DEPOSIT DIALOG MODAL (COMPACT & OPTIMIZED FOR MOBILE) --- */}
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogContent className="w-[94vw] max-w-md max-h-[90dvh] p-0 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Sticky Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {t('wallet.depositModalTitle', isRtl ? 'إيداع وشحن رصيد المحفظة' : 'Deposit & Top Up Balance')}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-snug">
                    {t('wallet.depositModalDesc', isRtl ? 'قم بشحن رصيدك لاستخدامه في تفعيل الباقات فوراً.' : 'Top up your wallet to activate courses and packages instantly.')}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3">
              {/* Amount input & Quick Selection */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {t('wallet.amount', isRtl ? 'المبلغ ($ USD)' : 'Amount ($ USD)')}
                  </Label>
                  <span className="text-[10px] text-slate-400 font-medium">{isRtl ? 'الحد الأدنى $10' : 'Minimum $10'}</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={10}
                    placeholder="50"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="rounded-xl text-sm font-bold pl-7 pr-3 h-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                </div>
                {/* Quick select chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['25', '50', '100', '250', '500'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDepositAmount(val)}
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                        depositAmount === val 
                          ? 'bg-primary text-white shadow-xs scale-105' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      +${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Payment Method Picker */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {t('wallet.paymentMethod', isRtl ? 'وسيلة الدفع والشحن' : 'Payment & Deposit Method')}
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {depositMethodsList.map((m: any) => {
                    const Icon = getMethodIcon(m.type, m.provider);
                    const isSelected = selectedDepositMethod?.id === m.id;
                    const label = isRtl ? (m.name_ar || m.name) : (m.name || m.name_ar);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setDepositMethod(m.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all text-left rtl:text-right ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="truncate leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Instructions Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    {t('wallet.platformAccountDetails', isRtl ? 'بيانات الاستلام والتفعيل:' : 'Payment Details & Instructions:')}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary bg-primary/5">
                    {selectedDepositMethod?.type === 'nowpayments_crypto' ? 'NOWPayments (USDT BEP20)' :
                     selectedDepositMethod?.type === 'bank_transfer' ? (selectedDepositMethod?.bank_name || 'Bank Transfer') :
                     selectedDepositMethod?.type === 'card_gateway' ? 'Online Card Payment' :
                     (isRtl ? selectedDepositMethod?.name_ar : selectedDepositMethod?.name)}
                  </Badge>
                </div>

                {selectedDepositMethod?.type === 'nowpayments_crypto' && (
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span>{t('wallet.cryptoAddress', isRtl ? 'عنوان المحفظة (USDT BEP20):' : 'Wallet Address (USDT BEP20):')}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">BNB Smart Chain (BEP20)</span>
                      </div>
                      <div className="flex items-center justify-between font-mono font-bold bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-emerald-600 dark:text-emerald-400 break-all text-[11px] leading-tight mr-1 rtl:ml-1 rtl:mr-0 select-all">
                          {selectedDepositMethod.crypto_wallet_address || '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B'}
                        </span>
                        <Button 
                          type="button" 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-1.5 text-[10px] gap-1 shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          onClick={() => copyToClipboard(selectedDepositMethod.crypto_wallet_address || '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B', 'crypto_address')}
                        >
                          {copiedField === 'crypto_address' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          {t('wallet.copy', isRtl ? 'نسخ' : 'Copy')}
                        </Button>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {isRtl 
                          ? 'تنبيه: أرسل عملة USDT عبر شبكة BEP20 (BNB Smart Chain) فقط. إرسال عملات أخرى أو عبر شبكات مختلفة قد يؤدي لفقدان الأموال نهائياً.'
                          : 'Notice: Send USDT on BEP20 (BNB Smart Chain) network only. Sending via other networks will cause permanent fund loss.'}
                      </span>
                    </div>
                    {(selectedDepositMethod.instructions_ar || selectedDepositMethod.instructions) && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isRtl ? (selectedDepositMethod.instructions_ar || selectedDepositMethod.instructions) : (selectedDepositMethod.instructions || selectedDepositMethod.instructions_ar)}
                      </p>
                    )}
                  </div>
                )}

                {selectedDepositMethod?.type === 'bank_transfer' && (
                  <div className="space-y-1.5">
                    {selectedDepositMethod.bank_name && (
                      <div className="text-[10px] text-slate-500">
                        {t('wallet.bankName', isRtl ? 'البنك' : 'Bank')}: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDepositMethod.bank_name}</span>
                      </div>
                    )}
                    {selectedDepositMethod.account_holder && (
                      <div className="text-[10px] text-slate-500">
                        {t('wallet.accountHolder', isRtl ? 'اسم المستفيد' : 'Beneficiary Name')}: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDepositMethod.account_holder}</span>
                      </div>
                    )}
                    {selectedDepositMethod.account_number && (
                      <div>
                        <span className="text-slate-400 block text-[10px]">{t('wallet.iban', isRtl ? 'رقم الحساب / IBAN / RIP:' : 'Account Number / IBAN:')}</span>
                        <div className="flex items-center justify-between font-mono font-bold bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 mt-0.5">
                          <span className="text-slate-800 dark:text-slate-200 text-xs truncate mr-2 rtl:ml-2 rtl:mr-0 select-all">{selectedDepositMethod.account_number}</span>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-1.5 text-[10px] gap-1 shrink-0"
                            onClick={() => copyToClipboard(selectedDepositMethod.account_number, 'bank_acc')}
                          >
                            {copiedField === 'bank_acc' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                            {t('wallet.copy', isRtl ? 'نسخ' : 'Copy')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {selectedDepositMethod.swift_code && (
                      <div className="text-[10px] text-slate-500">
                        SWIFT / BIC: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedDepositMethod.swift_code}</span>
                      </div>
                    )}
                    {(selectedDepositMethod.instructions_ar || selectedDepositMethod.instructions) && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {isRtl ? (selectedDepositMethod.instructions_ar || selectedDepositMethod.instructions) : (selectedDepositMethod.instructions || selectedDepositMethod.instructions_ar)}
                      </p>
                    )}
                  </div>
                )}

                {selectedDepositMethod?.type === 'card_gateway' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span>{t('wallet.instantCard', isRtl ? 'الدفع الآمن بالبطاقة البنكية' : 'Instant Secure Card Payment')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isRtl ? (selectedDepositMethod.instructions_ar || selectedDepositMethod.instructions || 'ادفع فوراً باستخدام بطاقتك البنكية (Visa / MasterCard). الدفع آمن ومحمي بأعلى معايير التشفير.')
                             : (selectedDepositMethod.instructions || selectedDepositMethod.instructions_ar || 'Pay instantly and securely using your Credit or Debit Card (Visa / Mastercard).')}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600 font-semibold mt-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{t('wallet.instantActivation', isRtl ? 'يتم التحقق والشحن الفوري للرصيد' : 'Instant verification & balance credit')}</span>
                    </div>
                  </div>
                )}

                {selectedDepositMethod?.type !== 'nowpayments_crypto' && selectedDepositMethod?.type !== 'bank_transfer' && selectedDepositMethod?.type !== 'card_gateway' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isRtl ? (selectedDepositMethod?.instructions_ar || selectedDepositMethod?.instructions) : (selectedDepositMethod?.instructions || selectedDepositMethod?.instructions_ar)}
                    </p>
                  </div>
                )}
              </div>

              {/* Active Payment Order View (When NOWPayments order is created) */}
              {activePaymentOrder ? (
                <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {isRtl ? 'تم تجهيز عنوان الدفع بنجاح' : 'Payment Order Ready'}
                    </span>
                    <Badge variant="outline" className="font-mono text-[10px] bg-white dark:bg-slate-900 border-emerald-300">
                      ID: {activePaymentOrder.paymentId}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">
                      {isRtl ? 'أرسل المبلغ التالي بالضبط:' : 'Exact Amount to Send:'}
                    </span>
                    <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                      {activePaymentOrder.payAmount} {activePaymentOrder.payCurrency} <span className="text-xs font-normal text-slate-500">({activePaymentOrder.network?.toUpperCase() || 'BSC'})</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">
                      {isRtl ? 'عنوان الإيداع المخصص لك:' : 'Your Dedicated Deposit Address:'}
                    </span>
                    <div className="flex items-center justify-between font-mono font-bold bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 break-all select-all mr-1 rtl:ml-1 rtl:mr-0">
                        {activePaymentOrder.payAddress}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[10px] gap-1 shrink-0"
                        onClick={() => copyToClipboard(activePaymentOrder.payAddress, 'nowpay_address')}
                      >
                        {copiedField === 'nowpay_address' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {t('wallet.copy', isRtl ? 'نسخ' : 'Copy')}
                      </Button>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-start gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      {isRtl 
                        ? 'ملاحظة: يتم تجديد عنوان وطلب الدفع تلقائياً كل 20 دقيقة إذا لم يتم التحويل. العناوين السابقة تظل صالحة ومعتمدة للتسوية التلقائية فور تأكيد الشبكة.'
                        : 'Notice: Payment request renews automatically every 20 minutes if unpaid. Previous addresses remain valid and linked for settlement upon blockchain confirmation.'}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {/* Manual Fields (only for manual bank transfers) */}
                  {selectedDepositMethod?.type !== 'nowpayments_crypto' && (
                    <>
                      {/* Reference ID / Transaction Hash */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {t('wallet.reference', isRtl ? 'رقم العملية / الحوالة أو TxID' : 'Transaction Ref / TxID')} <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="REF-123456 or TxID"
                          value={depositReference}
                          onChange={(e) => setDepositReference(e.target.value)}
                          className="rounded-xl text-xs h-8 sm:h-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                        />
                      </div>

                      {/* Notes or Image URL */}
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                          {t('wallet.receiptUrl', isRtl ? 'رابط الوصل أو ملاحظات (اختياري)' : 'Receipt URL or Notes (Optional)')}
                        </Label>
                        <Input
                          placeholder="https://... or notes"
                          value={depositReceiptUrl}
                          onChange={(e) => setDepositReceiptUrl(e.target.value)}
                          className="rounded-xl text-xs h-8 sm:h-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setIsDepositOpen(false); setActivePaymentOrder(null); }} 
                className="rounded-xl text-xs h-8 sm:h-9 px-3"
              >
                {activePaymentOrder ? (isRtl ? 'إغلاق ومتابعة' : 'Close') : (isRtl ? 'إلغاء' : 'Cancel')}
              </Button>
              {!activePaymentOrder && (
                <Button 
                  onClick={handleDepositSubmit} 
                  disabled={submittingDeposit} 
                  size="sm"
                  className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white text-xs h-8 sm:h-9 px-4 shadow-sm"
                >
                  {submittingDeposit ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                  {selectedDepositMethod?.type === 'nowpayments_crypto'
                    ? (isRtl ? 'إنشاء طلب دفع عبر NOWPayments' : 'Create NOWPayments Order')
                    : (isRtl ? 'تأكيد إرسال طلب الشحن' : 'Confirm Deposit Request')}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* --- WITHDRAWAL DIALOG MODAL (COMPACT & OPTIMIZED FOR MOBILE) --- */}
        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogContent className="w-[94vw] max-w-md max-h-[90dvh] p-0 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Sticky Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {t('wallet.withdrawModalTitle', isRtl ? 'طلب سحب أرباح' : 'Request Profit Payout')}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span>{t('wallet.availableBalance', isRtl ? 'الرصيد المتاح' : 'Available Balance')}:</span>
                    <span className="font-extrabold text-emerald-600 font-mono">${Number(wallet.balance || 0).toFixed(2)} USD</span>
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {t('wallet.withdrawAmount', isRtl ? 'المبلغ المراد سحبه ($ USD)' : 'Withdraw Amount ($ USD)')}
                  </Label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t('wallet.minWithdrawalNotice', isRtl ? 'الحد الأدنى' : 'Minimum')} ${selectedWithdrawMethod?.min_withdrawal || minWithdraw}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    min={selectedWithdrawMethod?.min_withdrawal || minWithdraw}
                    max={wallet.balance}
                    placeholder={`${selectedWithdrawMethod?.min_withdrawal || minWithdraw}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="rounded-xl text-sm font-bold pl-7 pr-3 h-9 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                </div>
              </div>

              {/* Dynamic Withdrawal Method Picker */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {t('wallet.payoutMethod', isRtl ? 'وسيلة استلام الأرباح' : 'Payout Method')}
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {withdrawMethodsList.map((m: any) => {
                    const Icon = getMethodIcon(m.type, m.provider);
                    const isSelected = selectedWithdrawMethod?.id === m.id;
                    const label = isRtl ? (m.name_ar || m.name) : (m.name || m.name_ar);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectPaymentMethod(m.id)}
                        className={`flex items-center gap-1.5 p-2 rounded-xl border text-[11px] font-bold transition-all text-left rtl:text-right ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <span className="truncate leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {selectedWithdrawMethod?.type === 'nowpayments_crypto'
                      ? t('wallet.cryptoWithdrawAddress', isRtl ? 'عنوان محفظتك USDT (شبكة BEP20)' : 'Your USDT Wallet Address (BEP20 Network)')
                      : selectedWithdrawMethod?.type === 'bank_transfer'
                      ? t('wallet.bankDetailsWithdraw', isRtl ? 'بيانات الحساب البنكي (Bank Details)' : 'Bank Account Details')
                      : t('wallet.accountDetails', isRtl ? 'بيانات وتفاصيل الحساب' : 'Account Details')}
                  </Label>
                  <Link 
                    to="/student/profile" 
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                  >
                    {t('nav.settings', isRtl ? 'الإعدادات' : 'Settings')}
                  </Link>
                </div>
                <Textarea
                  placeholder={
                    selectedWithdrawMethod?.type === 'nowpayments_crypto'
                      ? "0x... (USDT BEP20 Wallet Address on BNB Smart Chain)"
                      : selectedWithdrawMethod?.type === 'bank_transfer'
                      ? (isRtl ? "اسم البنك، اسم المستفيد، رقم الحساب أو IBAN، كود السويفت إن وجد..." : "Bank name, beneficiary name, account number or IBAN, SWIFT...")
                      : "IBAN, CCP, USDT Address, or Account details..."
                  }
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="rounded-xl text-xs min-h-[64px] p-2.5 bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-mono"
                />
                {selectedWithdrawMethod?.type === 'nowpayments_crypto' && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    {isRtl ? '⚠️ يرجى التأكد أن العنوان على شبكة BNB Smart Chain (BEP20) لاستلام أرباحك مباشرة وبأمان.' : '⚠️ Please make sure the address is on BNB Smart Chain (BEP20) to receive your funds safely.'}
                  </p>
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsWithdrawOpen(false)} 
                className="rounded-xl text-xs h-8 sm:h-9 px-3"
              >
                {t('common.cancel', isRtl ? 'إلغاء' : 'Cancel')}
              </Button>
              <Button 
                onClick={handleWithdrawSubmit} 
                disabled={submitting} 
                size="sm"
                className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 sm:h-9 px-4 shadow-sm"
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                {t('wallet.submitWithdraw', isRtl ? 'إرسال طلب السحب' : 'Submit Withdrawal Request')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
