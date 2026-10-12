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
import { adminAffiliateService } from '@/services/apiService';
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
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export default function DepositManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'wallet' | 'package'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action Dialogs
  const [approveItem, setApproveItem] = useState<any>(null);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    loadDeposits();
  }, []);

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

  // Compute Metrics
  const packageSales = deposits
    .filter(d => d.category === 'package' && (d.status === 'active' || d.status === 'upgraded'))
    .reduce((sum, d) => sum + Number(d.price_paid || 0), 0);

  const walletDepositsTotal = deposits
    .filter(d => d.category === 'wallet' && d.status === 'completed')
    .reduce((sum, d) => sum + Number(d.price_paid || 0), 0);

  const pendingCount = deposits.filter(d => d.status === 'pending').length;

  // Filtered List
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

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1">
              FINANCIAL MANAGEMENT
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('adminExtra.depositsTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('adminExtra.depositsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Package Sales Card */}
            <div className="px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="text-[10px] font-bold text-slate-500 block">
                {t('adminExtra.packageSales')}
              </span>
              <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400">
                ${packageSales.toFixed(2)} USD
              </span>
            </div>

            {/* Wallet Deposits Card */}
            <div className="px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-bold text-slate-500 block">
                {t('adminExtra.confirmedDeposits')}
              </span>
              <span className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                ${walletDepositsTotal.toFixed(2)} USD
              </span>
            </div>

            {/* Pending Actions Count */}
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
        </div>

        {/* Filters & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: t('adminExtra.filterAll') },
              { id: 'wallet', label: t('adminExtra.filterWallet') },
              { id: 'package', label: t('adminExtra.filterPackages') },
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

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className={`h-4 w-4 absolute top-3 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('adminExtra.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`rounded-xl text-xs h-10 ${isRtl ? 'pr-9' : 'pl-9'}`}
            />
          </div>
        </div>

        {/* Deposits Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className={`w-full text-xs ${isRtl ? 'text-right' : 'text-left'}`}>
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">{t('adminExtra.userCol')}</th>
                  <th className="p-4">{t('adminExtra.typeCol')}</th>
                  <th className="p-4 text-emerald-600">{t('adminExtra.amountCol')}</th>
                  <th className="p-4">{t('adminExtra.methodCol')}</th>
                  <th className="p-4">{t('adminExtra.referenceCol')}</th>
                  <th className="p-4">{t('adminExtra.dateCol')}</th>
                  <th className="p-4 text-center">{t('adminExtra.statusCol')}</th>
                  <th className="p-4 text-center">{t('adminExtra.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading...
                    </td>
                  </tr>
                ) : filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      {isRtl ? 'لا توجد أي إيداعات مطابقة للشروط الحالية.' : 'No deposits match the current criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((d) => {
                    const isWallet = d.category === 'wallet';
                    const isPending = d.status === 'pending';

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* User */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{d.user_name}</p>
                          <p className="text-[10px] text-slate-400">{d.user_email}</p>
                        </td>

                        {/* Category / Package */}
                        <td className="p-4">
                          {isWallet ? (
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
                                <Wallet className="h-3.5 w-3.5" />
                              </span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                                {t('adminExtra.filterWallet')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {isRtl ? (d.package_name_ar || d.package_name) : (d.package_name || d.package_name_ar)}
                              </span>
                              <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-200 text-[10px] font-bold">
                                Lvl {d.package_level}
                              </Badge>
                            </div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="p-4 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          ${Number(d.price_paid).toFixed(2)} USD
                        </td>

                        {/* Method */}
                        <td className="p-4 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {d.payment_method === 'baridimob' ? 'BaridiMob / CCP' :
                           d.payment_method === 'usdt' ? 'USDT TRC-20' :
                           d.payment_method === 'bank_transfer' ? (isRtl ? 'تحويل بنكي' : 'Bank Transfer') :
                           d.payment_method === 'wallet' ? (isRtl ? 'رصيد المحفظة' : 'Wallet Balance') :
                           d.payment_method || 'Transfer'}
                        </td>

                        {/* Reference / Details */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 block">
                              {d.payment_reference || 'N/A'}
                            </span>
                            {d.notes && (
                              <p className="text-[10px] text-slate-500 italic max-w-xs truncate" title={d.notes}>
                                {d.notes}
                              </p>
                            )}
                            {d.receipt_url && (
                              <a 
                                href={d.receipt_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold"
                              >
                                {t('adminExtra.viewReceipt')}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-slate-400 text-[11px]">
                          {new Date(d.created_at || d.purchased_at).toLocaleString(dateLocale)}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            d.status === 'active' || d.status === 'completed'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : d.status === 'upgraded'
                              ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                              : d.status === 'rejected' || d.status === 'cancelled'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          }`}>
                            {d.status === 'active' ? t('adminExtra.activeStatus') : 
                             d.status === 'completed' ? t('adminExtra.completedStatus') :
                             d.status === 'upgraded' ? t('adminExtra.upgradedStatus') : 
                             d.status === 'rejected' || d.status === 'cancelled' ? (isRtl ? 'مرفوض' : 'Rejected') : t('adminExtra.pendingStatus')}
                          </span>
                        </td>

                        {/* Action Buttons for Pending Requests (Wallet or Package) */}
                        <td className="p-4 text-center">
                          {isPending ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                onClick={() => setApproveItem(d)}
                                className="h-8 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-3 shadow-xs"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {t('adminExtra.approveBtn')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setRejectItem(d); setRejectReason(''); }}
                                className="h-8 rounded-xl font-bold text-xs border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1 px-3"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t('adminExtra.rejectBtn')}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px]">
                              {d.status === 'completed' || d.status === 'active' ? '✓' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Approve Deposit Confirmation Dialog */}
        <Dialog open={!!approveItem} onOpenChange={(open) => !open && setApproveItem(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {t('adminExtra.approveModalTitle')}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                {t('adminExtra.approveModalDesc')}
              </DialogDescription>
            </DialogHeader>

            {approveItem && (
              <div className="space-y-3 py-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('adminExtra.userCol')}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{approveItem.user_name}</span>
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
                  <span className="text-slate-400">{t('adminExtra.referenceCol')}:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{approveItem.payment_reference || '—'}</span>
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

        {/* Reject Deposit Dialog */}
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
      </div>
    </DashboardLayout>
  );
}
