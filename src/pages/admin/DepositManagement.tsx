import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminAffiliateService, adminIpnLogService } from '@/services/apiService';
import { 
  ArrowUpRight, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Building2,
  Wallet,
  Coins,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
  Clock,
  Copy,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface DepositManagementProps {
  defaultTab?: string;
}

export default function DepositManagement({ defaultTab }: DepositManagementProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'wallet' | 'package' | 'ipn_log'>(
    (defaultTab as any) || 'all'
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Dialogs for manual deposits
  const [approveItem, setApproveItem] = useState<any>(null);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<{ url: string; title: string } | null>(null);

  // IPN Log states
  const [ipnLogs, setIpnLogs] = useState<any[]>([]);
  const [ipnLoading, setIpnLoading] = useState(false);
  const [ipnPage, setIpnPage] = useState(1);
  const [ipnTotalPages, setIpnTotalPages] = useState(1);
  const [ipnMetrics, setIpnMetrics] = useState<any>({
    total_attempts: 0,
    credited_count: 0,
    pending_count: 0,
    failed_count: 0,
    total_credited_volume: 0
  });
  const [ipnSearch, setIpnSearch] = useState('');
  const [ipnProvider, setIpnProvider] = useState('all');
  const [ipnStatus, setIpnStatus] = useState('all');
  const [ipnCredited, setIpnCredited] = useState('all');

  // Detail Modal for an IPN deposit session
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    loadDeposits();
  }, []);

  useEffect(() => {
    if (filterCategory === 'ipn_log') {
      loadIpnLogs();
    }
  }, [filterCategory, ipnPage, ipnProvider, ipnStatus, ipnCredited]);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getDeposits();
      setDeposits(res.deposits || []);
    } catch (err: any) {
      toast.error('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const loadIpnLogs = async () => {
    try {
      setIpnLoading(true);
      const res = await adminIpnLogService.getLogs({
        page: ipnPage,
        limit: 15,
        search: ipnSearch || undefined,
        provider: ipnProvider !== 'all' ? ipnProvider : undefined,
        status: ipnStatus !== 'all' ? ipnStatus : undefined,
        credited: ipnCredited !== 'all' ? ipnCredited : undefined
      });
      setIpnLogs(res.attempts || []);
      setIpnTotalPages(res.pagination?.totalPages || 1);
      if (res.metrics) setIpnMetrics(res.metrics);
    } catch (err: any) {
      toast.error('Failed to load IPN log records');
    } finally {
      setIpnLoading(false);
    }
  };

  const handleIpnSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIpnPage(1);
    loadIpnLogs();
  };

  const handleOpenDetail = async (trxOrAttemptId: string) => {
    try {
      setSelectedSessionId(trxOrAttemptId);
      setDetailLoading(true);
      const res = await adminIpnLogService.getLogDetail(trxOrAttemptId);
      setDetailData(res);
    } catch (err: any) {
      toast.error('Failed to load session attempt details');
      setSelectedSessionId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTriggerRenewal = async (transactionId: string) => {
    try {
      setRenewingId(transactionId);
      const res = await adminIpnLogService.triggerRenewal(transactionId);
      toast.success(res.message || 'Renewal initiated successfully');
      loadIpnLogs();
      if (selectedSessionId) {
        handleOpenDetail(selectedSessionId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to renew payment attempt');
    } finally {
      setRenewingId(null);
    }
  };

  const handleApproveDeposit = async () => {
    if (!approveItem) return;
    try {
      setProcessingAction(true);
      const res = await adminAffiliateService.approveDeposit(approveItem.id);
      toast.success(res.message || 'Deposit approved successfully');
      setApproveItem(null);
      loadDeposits();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve deposit');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectDeposit = async () => {
    if (!rejectItem) return;
    try {
      setProcessingAction(true);
      const res = await adminAffiliateService.rejectDeposit(rejectItem.id, {
        reason: rejectReason.trim() || 'Payment details mismatch'
      });
      toast.success(res.message || 'Deposit rejected');
      setRejectItem(null);
      setRejectReason('');
      loadDeposits();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject deposit');
    } finally {
      setProcessingAction(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(isRtl ? 'تم النسخ إلى الحافظة' : 'Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Compute Metrics for manual deposits
  const packageSales = deposits
    .filter(d => d.category === 'package' && (d.status === 'active' || d.status === 'upgraded'))
    .reduce((sum, d) => sum + Number(d.price_paid || 0), 0);

  const walletDepositsTotal = deposits
    .filter(d => d.category === 'wallet' && d.status === 'completed')
    .reduce((sum, d) => sum + Number(d.price_paid || 0), 0);

  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  // Filtered List for standard deposits
  const filteredDeposits = deposits.filter((d) => {
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (d.user_name || '').toLowerCase().includes(q);
      const matchEmail = (d.user_email || '').toLowerCase().includes(q);
      const matchRef = (d.payment_reference || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRef) return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'waiting':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300">في انتظار الدفع / Waiting</Badge>;
      case 'confirming':
      case 'sending':
        return <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-300">جارٍ التأكيد / Confirming</Badge>;
      case 'confirmed':
      case 'finished':
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300">مكتمل / Confirmed</Badge>;
      case 'partially_paid':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300">مدفوع جزئياً / Partially Paid</Badge>;
      case 'expired':
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300">منتهي الصلاحية / Expired</Badge>;
      case 'failed':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300">فاشل / Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
              FINANCIAL MANAGEMENT
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {filterCategory === 'ipn_log' ? (isRtl ? 'سجل محاولات الدفع وإشعارات IPN Log' : 'IPN Log & Payment Attempts') : t('adminExtra.depositsTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {filterCategory === 'ipn_log'
                ? (isRtl ? 'متابعة وتدقيق جميع محاولات الدفع عبر NOWPayments وتجديداتها كل 20 دقيقة والتحقق من عدم ازدواج الرصيد.' 
                         : 'Audit all NOWPayments deposit attempts, 20-min renewals, webhook events, and wallet settlements.')
                : t('adminExtra.depositsSubtitle')}
            </p>
          </div>

          {filterCategory === 'ipn_log' ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {isRtl ? 'إجمالي المحاولات المسجلة' : 'Total Attempts'}
                </span>
                <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {ipnMetrics.total_attempts}
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {isRtl ? 'حجم الرصيد المضاف' : 'Credited Volume'}
                </span>
                <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ${Number(ipnMetrics.total_credited_volume || 0).toFixed(2)} USD
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-bold text-amber-600 block">
                  {isRtl ? 'محاولات قيد الانتظار' : 'Waiting / Pending'}
                </span>
                <span className="font-mono text-lg font-black text-amber-600">
                  {ipnMetrics.pending_count}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {t('adminExtra.packageSales')}
                </span>
                <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                  ${packageSales.toFixed(2)} USD
                </span>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-slate-500 block">
                  {t('adminExtra.confirmedDeposits')}
                </span>
                <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                  ${walletDepositsTotal.toFixed(2)} USD
                </span>
              </div>

              {pendingCount > 0 && (
                <div className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 animate-pulse">
                  <span className="text-[10px] font-bold text-amber-600 block">
                    {t('adminExtra.pendingRequests')}
                  </span>
                  <span className="font-mono text-lg font-black text-amber-600">
                    {pendingCount}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Categories */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: t('adminExtra.filterAll', 'الكل') },
              { id: 'wallet', label: t('adminExtra.filterWallet', 'شحن المحفظة') },
              { id: 'package', label: t('adminExtra.filterPackages', 'الباقات') },
              { id: 'ipn_log', label: isRtl ? '🪙 سجل IPN Log والتجديدات' : '🪙 IPN Log & Renewals' },
            ].map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={filterCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setFilterCategory(cat.id as any)}
                className={`rounded-xl text-xs font-bold ${
                  filterCategory === cat.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : ''
                }`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {filterCategory === 'ipn_log' && (
            <Button
              size="sm"
              variant="outline"
              onClick={loadIpnLogs}
              disabled={ipnLoading}
              className="rounded-xl text-xs font-bold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${ipnLoading ? 'animate-spin' : ''}`} />
              {isRtl ? 'تحديث السجل' : 'Refresh Logs'}
            </Button>
          )}
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: IPN LOG & RENEWAL ATTEMPTS AUDIT                                   */}
        {/* ========================================================================= */}
        {filterCategory === 'ipn_log' && (
          <div className="space-y-4">
            {/* Filters & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <form onSubmit={handleIpnSearchSubmit} className="relative sm:col-span-2">
                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-slate-400`} />
                <Input
                  placeholder={isRtl ? 'ابحث بالمعرف، العنوان، البريد أو Payment ID...' : 'Search by ID, Address, Email, Payment ID...'}
                  value={ipnSearch}
                  onChange={(e) => setIpnSearch(e.target.value)}
                  className={`${isRtl ? 'pr-9' : 'pl-9'} rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60`}
                />
              </form>

              <select
                value={ipnProvider}
                onChange={(e) => { setIpnProvider(e.target.value); setIpnPage(1); }}
                className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <option value="all">{isRtl ? 'جميع المزودين (All)' : 'All Providers'}</option>
                <option value="nowpayments">NOWPayments</option>
                <option value="stripe">Stripe</option>
              </select>

              <select
                value={ipnStatus}
                onChange={(e) => { setIpnStatus(e.target.value); setIpnPage(1); }}
                className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <option value="all">{isRtl ? 'جميع الحالات (All)' : 'All Statuses'}</option>
                <option value="waiting">{isRtl ? 'في انتظار الدفع (Waiting)' : 'Waiting'}</option>
                <option value="confirming">{isRtl ? 'جارٍ التأكيد (Confirming)' : 'Confirming'}</option>
                <option value="finished">{isRtl ? 'مكتمل (Finished/Confirmed)' : 'Finished'}</option>
                <option value="partially_paid">{isRtl ? 'مدفوع جزئياً (Partial)' : 'Partially Paid'}</option>
                <option value="expired">{isRtl ? 'منتهي الصلاحية (Expired)' : 'Expired'}</option>
                <option value="failed">{isRtl ? 'فاشل (Failed)' : 'Failed'}</option>
              </select>

              <select
                value={ipnCredited}
                onChange={(e) => { setIpnCredited(e.target.value); setIpnPage(1); }}
                className="text-xs font-bold rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <option value="all">{isRtl ? 'حالة الرصيد (الكل)' : 'Wallet Credit (All)'}</option>
                <option value="1">{isRtl ? 'تم شحن المحفظة (Credited)' : 'Credited'}</option>
                <option value="0">{isRtl ? 'لم يضاف رصيد (Pending/None)' : 'Not Credited'}</option>
              </select>
            </div>

            {/* Table */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left rtl:text-right border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">{isRtl ? 'العضو' : 'Member'}</th>
                      <th className="p-3.5">{isRtl ? 'المزود والمحاولة' : 'Provider & Attempt'}</th>
                      <th className="p-3.5">{isRtl ? 'المبلغ المطلوب' : 'Price / Expected'}</th>
                      <th className="p-3.5">{isRtl ? 'المستلم فعلياً' : 'Actually Paid'}</th>
                      <th className="p-3.5">{isRtl ? 'عنوان الدفع والمراجع' : 'Address & Payment ID'}</th>
                      <th className="p-3.5">{isRtl ? 'حالة البوابة' : 'Gateway Status'}</th>
                      <th className="p-3.5">{isRtl ? 'شحن المحفظة' : 'Wallet Credited'}</th>
                      <th className="p-3.5">{isRtl ? 'التاريخ والتجديد' : 'Timestamps'}</th>
                      <th className="p-3.5 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {ipnLoading ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                          <span className="text-xs text-slate-400">{isRtl ? 'جارٍ تحميل السجلات...' : 'Loading IPN logs...'}</span>
                        </td>
                      </tr>
                    ) : ipnLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400">
                          {isRtl ? 'لا توجد محاولات دفع مسجلة مطابقة للفلاتر' : 'No payment attempts found matching filters'}
                        </td>
                      </tr>
                    ) : (
                      ipnLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{log.user_name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{log.user_email}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Coins className="h-3.5 w-3.5 text-emerald-500" />
                              <span>{log.provider}</span>
                              <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-slate-100 dark:bg-slate-800">
                                #{log.attempt_number}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {log.network ? `Network: ${log.network.toUpperCase()}` : ''}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono font-bold">
                            <span className="text-slate-800 dark:text-slate-200">
                              ${Number(log.price_amount).toFixed(2)} {log.price_currency}
                            </span>
                            {log.pay_amount && (
                              <span className="block text-[10px] text-slate-400">
                                ~{Number(log.pay_amount)} {log.pay_currency}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono">
                            {log.actually_paid_fiat ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                ${Number(log.actually_paid_fiat).toFixed(2)} USD
                              </span>
                            ) : log.actually_paid ? (
                              <span className="text-emerald-600 font-bold">
                                {Number(log.actually_paid)} {log.pay_currency}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3.5 max-w-[180px]">
                            {log.pay_address ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 truncate" title={log.pay_address}>
                                  {log.pay_address.substring(0, 10)}...{log.pay_address.slice(-6)}
                                </span>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 shrink-0"
                                  onClick={() => copyToClipboard(log.pay_address, log.id)}
                                >
                                  {copiedText === log.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-slate-400" />}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                            <span className="text-[9px] text-slate-400 font-mono block">
                              ID: {log.provider_payment_id || log.transaction_id.substring(0, 8)}
                            </span>
                          </td>

                          <td className="p-3.5">
                            {getStatusBadge(log.status)}
                          </td>

                          <td className="p-3.5">
                            {log.is_wallet_credited === 1 ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {isRtl ? 'تم الشحن' : 'Credited'}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 border-slate-300 gap-1">
                                <Clock className="h-3 w-3" />
                                {isRtl ? 'قيد المعالجة' : 'Pending'}
                              </Badge>
                            )}
                          </td>

                          <td className="p-3.5 text-[10px] text-slate-500 font-mono">
                            <div>{new Date(log.created_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-[9px] text-slate-400">{new Date(log.created_at).toLocaleDateString(dateLocale)}</div>
                            {log.next_renewal_at && log.status === 'waiting' && log.is_wallet_credited === 0 && (
                              <span className="text-amber-600 dark:text-amber-400 text-[9px] block">
                                ↻ {new Date(log.next_renewal_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] rounded-lg font-bold"
                                onClick={() => handleOpenDetail(log.transaction_id)}
                              >
                                {isRtl ? 'التفاصيل' : 'Details'}
                              </Button>

                              {log.status === 'waiting' && log.is_wallet_credited === 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[10px] text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg font-bold"
                                  disabled={renewingId === log.transaction_id}
                                  onClick={() => handleTriggerRenewal(log.transaction_id)}
                                  title={isRtl ? 'تجديد فوري الآن' : 'Trigger Renewal Now'}
                                >
                                  {renewingId === log.transaction_id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {ipnTotalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="text-slate-500 font-semibold">
                    {isRtl ? `صفحة ${ipnPage} من ${ipnTotalPages}` : `Page ${ipnPage} of ${ipnTotalPages}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ipnPage <= 1 || ipnLoading}
                      onClick={() => setIpnPage(p => p - 1)}
                      className="rounded-xl h-8 px-2.5"
                    >
                      <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={ipnPage >= ipnTotalPages || ipnLoading}
                      onClick={() => setIpnPage(p => p + 1)}
                      className="rounded-xl h-8 px-2.5"
                    >
                      <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: STANDARD MANUAL DEPOSITS & PACKAGES LIST (Original Functionality)  */}
        {/* ========================================================================= */}
        {filterCategory !== 'ipn_log' && (
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-4">{t('adminExtra.studentCol', 'Member')}</th>
                    <th className="p-4">{t('adminExtra.typeCol', 'Type')}</th>
                    <th className="p-4">{t('adminExtra.amountCol', 'Amount')}</th>
                    <th className="p-4">{t('adminExtra.methodCol', 'Method')}</th>
                    <th className="p-4">{t('adminExtra.referenceCol', 'Reference')}</th>
                    <th className="p-4">{isRtl ? 'وصل التحويل' : 'Receipt Proof'}</th>
                    <th className="p-4">{t('adminExtra.statusCol', 'Status')}</th>
                    <th className="p-4">{t('adminExtra.dateCol', 'Date')}</th>
                    <th className="p-4 text-center">{t('adminExtra.actionsCol', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                        <span className="text-xs text-slate-400">{t('common.loading', 'Loading...')}</span>
                      </td>
                    </tr>
                  ) : filteredDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        {t('adminExtra.noDepositsFound', 'No deposits found')}
                      </td>
                    </tr>
                  ) : (
                    filteredDeposits.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 dark:text-slate-100">{item.user_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.user_email}</div>
                        </td>
                        <td className="p-4">
                          {item.category === 'package' ? (
                            <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">
                              {isRtl ? item.package_name_ar : item.package_name}
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200">
                              {isRtl ? item.package_name_ar : item.package_name}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${Number(item.price_paid || 0).toFixed(2)} USD
                        </td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                          {item.payment_method}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-slate-500">
                          {item.payment_reference}
                        </td>
                        <td className="p-4">
                          {item.receipt_url ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingReceipt({ url: item.receipt_url, title: `${item.user_name} — ${item.payment_reference || 'Receipt'}` })}
                              className="h-7 px-2.5 text-[10px] gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold"
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span>{isRtl ? 'عرض الوصل' : 'View'}</span>
                            </Button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              {isRtl ? 'بدون وصل' : 'No Receipt'}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="p-4 text-[10px] text-slate-500 font-mono">
                          {new Date(item.created_at).toLocaleDateString(dateLocale)}
                        </td>
                        <td className="p-4 text-center">
                          {item.status === 'pending' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                className="h-7 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                                onClick={() => setApproveItem(item)}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                {t('adminExtra.approveBtn', 'Approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-[10px] text-rose-600 border-rose-300 hover:bg-rose-50 rounded-lg font-bold"
                                onClick={() => setRejectItem(item)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* MODAL: DETAIL & ALL ATTEMPTS TIMELINE FOR AN IPN DEPOSIT SESSION          */}
        {/* ========================================================================= */}
        <Dialog open={!!selectedSessionId} onOpenChange={(open) => !open && setSelectedSessionId(null)}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="h-5 w-5 text-emerald-500" />
                {isRtl ? 'تفاصيل جلسة الإيداع وسجل المحاولات' : 'Deposit Session & Attempts Timeline'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isRtl 
                  ? 'عرض جميع محاولات الدفع المنشأة عبر NOWPayments، العناوين المستخدمة، والتسوية التلقائية.' 
                  : 'View all NOWPayments payment attempts, generated addresses, and settlement audit.'}
              </DialogDescription>
            </DialogHeader>

            {detailLoading || !detailData ? (
              <div className="py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-500 mb-2" />
                <span className="text-xs text-slate-400">{isRtl ? 'جارٍ تحميل التفاصيل...' : 'Loading attempt details...'}</span>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Session Header Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isRtl ? 'معرف الإيداع الداخلي' : 'Transaction ID'}</span>
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{detailData.transaction?.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isRtl ? 'العضو' : 'Member'}</span>
                      <span className="text-xs font-bold">{detailData.transaction?.user_name} ({detailData.transaction?.user_email})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{isRtl ? 'المبلغ المطلوب' : 'Price Amount'}</span>
                      <span className="font-mono text-sm font-black text-emerald-600">${Number(detailData.transaction?.amount).toFixed(2)} USD</span>
                    </div>
                  </div>
                </div>

                {/* Attempts Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>{isRtl ? `محاولات الدفع المنشأة (${detailData.attempts?.length || 0}):` : `Payment Attempts (${detailData.attempts?.length || 0}):`}</span>
                    {detailData.transaction?.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] font-bold text-indigo-600 border-indigo-200"
                        disabled={renewingId === detailData.transaction?.id}
                        onClick={() => handleTriggerRenewal(detailData.transaction?.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {isRtl ? 'إنشاء محاولة بديلة الآن' : 'Renew / Next Attempt Now'}
                      </Button>
                    )}
                  </h4>

                  <div className="space-y-2.5">
                    {detailData.attempts?.map((att: any) => (
                      <div 
                        key={att.id} 
                        className={`p-3.5 rounded-2xl border ${
                          att.is_wallet_credited === 1
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800">
                              {isRtl ? `المحاولة #${att.attempt_number}` : `Attempt #${att.attempt_number}`}
                            </Badge>
                            {getStatusBadge(att.status)}
                            {att.is_wallet_credited === 1 && (
                              <Badge className="bg-emerald-600 text-white text-[10px]">
                                {isRtl ? 'تم شحن المحفظة بهذه المحاولة' : 'Settled to Wallet'}
                              </Badge>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(att.created_at).toLocaleString(dateLocale)}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 text-[10px] block">{isRtl ? 'عنوان الدفع المحجوز:' : 'Payment Address:'}</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 break-all select-all">
                              {att.pay_address || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">{isRtl ? 'المبلغ والشبكة:' : 'Pay Amount & Network:'}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {Number(att.pay_amount || 0)} {att.pay_currency} ({att.network?.toUpperCase() || 'BSC'})
                            </span>
                          </div>
                        </div>

                        {att.renewal_error && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[10px] text-rose-600 border border-rose-200 dark:border-rose-800">
                            <strong>{isRtl ? 'خطأ الاتصال أثناء التجديد:' : 'Renewal Error:'}</strong> {att.renewal_error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => setSelectedSessionId(null)} className="rounded-2xl text-xs font-bold">
                {isRtl ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve Deposit Dialog (Manual) */}
        <Dialog open={!!approveItem} onOpenChange={(open) => !open && setApproveItem(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {t('adminExtra.approveModalTitle', 'Confirm Deposit Approval')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                {t('adminExtra.approveModalDesc', 'Review and approve this deposit')}
              </DialogDescription>
            </DialogHeader>

            {approveItem && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('adminExtra.studentCol')}:</span>
                  <span className="font-bold">{approveItem.user_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('adminExtra.amountCol')}:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">${Number(approveItem.price_paid).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('adminExtra.methodCol')}:</span>
                  <span className="font-semibold">{approveItem.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('adminExtra.referenceCol', 'Reference')}:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{approveItem.payment_reference || '—'}</span>
                </div>

                {/* Receipt Preview in Approval Dialog */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1.5 font-bold">{isRtl ? 'صورة وصل التحويل:' : 'Transfer Receipt Proof:'}</span>
                  {approveItem.receipt_url ? (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 dark:bg-black/30 p-2 text-center">
                      <img 
                        src={approveItem.receipt_url} 
                        alt="Transfer Receipt" 
                        className="max-h-44 mx-auto rounded-lg object-contain cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(approveItem.receipt_url, '_blank')}
                      />
                      <div className="mt-1.5 flex items-center justify-center gap-2">
                        <a 
                          href={approveItem.receipt_url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {isRtl ? 'عرض بالحجم الكامل ↗' : 'View Full Image ↗'}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-rose-500 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 text-[10px]">
                      {isRtl ? 'لم يقم العضو برفع وصل' : 'No Receipt Attached'}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => setApproveItem(null)} className="rounded-2xl">
                {t('wallet.cancel')}
              </Button>
              <Button 
                onClick={handleApproveDeposit} 
                disabled={processingAction} 
                className="rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 text-white px-5"
              >
                {processingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminExtra.confirmApproveBtn')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Deposit Dialog (Manual) */}
        <Dialog open={!!rejectItem} onOpenChange={(open) => !open && setRejectItem(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-lg font-bold text-rose-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                {t('adminExtra.rejectModalTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                {t('adminExtra.rejectModalDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {t('adminExtra.rejectModalTitle')}
              </Label>
              <Textarea
                placeholder={t('adminExtra.rejectReasonPlaceholder')}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-2xl text-xs min-h-[80px]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => setRejectItem(null)} className="rounded-2xl">
                {t('wallet.cancel')}
              </Button>
              <Button 
                onClick={handleRejectDeposit} 
                disabled={processingAction} 
                className="rounded-2xl font-black bg-rose-600 hover:bg-rose-700 text-white px-5"
              >
                {processingAction ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminExtra.confirmRejectBtn')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Image Lightbox Preview Dialog */}
        <Dialog open={!!viewingReceipt} onOpenChange={(open) => !open && setViewingReceipt(null)}>
          <DialogContent className="sm:max-w-xl rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span>{isRtl ? 'وصل التحويل البنكي' : 'Bank Transfer Receipt'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-mono truncate">
                {viewingReceipt?.title}
              </DialogDescription>
            </DialogHeader>

            {viewingReceipt && (
              <div className="space-y-3 py-2">
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950/5 dark:bg-slate-950/50 flex items-center justify-center p-2 min-h-[250px]">
                  {viewingReceipt.url.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                        <ExternalLink className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isRtl ? 'المستند بصيغة PDF' : 'Document is in PDF format'}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => window.open(viewingReceipt.url, '_blank')}
                        className="rounded-xl font-bold text-xs"
                      >
                        {isRtl ? 'فتح ملف PDF في نافذة جديدة' : 'Open PDF in New Tab'}
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={viewingReceipt.url}
                      alt="Transfer Receipt"
                      className="max-h-[60vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
                    />
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <a
                    href={viewingReceipt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{isRtl ? 'فتح في نافذة جديدة' : 'Open in New Tab'}</span>
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingReceipt(null)}
                    className="rounded-xl text-xs font-bold"
                  >
                    {isRtl ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
