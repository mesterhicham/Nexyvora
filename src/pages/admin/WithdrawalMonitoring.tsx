import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { adminAffiliateService } from '@/services/apiService';
import { 
  ArrowDownToLine, 
  Check, 
  X, 
  Clock, 
  Loader2, 
  Building2, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function WithdrawalMonitoring() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [transactionProof, setTransactionProof] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter]);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getWithdrawals(statusFilter);
      setWithdrawals(res.withdrawals || []);
    } catch (err: any) {
      toast.error(t('withdrawalsMonitoring.loadError', 'Failed to load withdrawal requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (req: any, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    setTransactionProof('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!selectedReq || !actionType) return;

    try {
      setSubmitting(true);
      if (actionType === 'approve') {
        const res = await adminAffiliateService.approveWithdrawal(selectedReq.id, {
          transactionProof: transactionProof.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        toast.success(res.message || t('withdrawalsMonitoring.approveSuccess', 'Withdrawal request approved successfully'));
      } else {
        if (!notes.trim()) {
          return toast.error(t('withdrawalsMonitoring.rejectReasonRequired', 'Please specify the rejection reason to notify the member'));
        }
        const res = await adminAffiliateService.rejectWithdrawal(selectedReq.id, {
          reason: notes.trim(),
        });
        toast.success(res.message || t('withdrawalsMonitoring.rejectSuccess', 'Withdrawal request rejected and balance refunded to member\'s wallet'));
      }

      setActionType(null);
      setSelectedReq(null);
      loadWithdrawals();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('withdrawalsMonitoring.processError', 'Failed to process withdrawal request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('withdrawalsMonitoring.title', 'Withdrawal Monitoring')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('withdrawalsMonitoring.subtitle', 'Review, audit and process pending, approved, and rejected payouts requested by platform members')}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full sm:w-auto"
            >
              <option value="all">{t('withdrawalsMonitoring.filterAll', 'All Withdrawals (History)')}</option>
              <option value="pending">{t('withdrawalsMonitoring.filterPending', 'Pending Only')}</option>
              <option value="completed">{t('withdrawalsMonitoring.filterCompleted', 'Approved / Completed Only')}</option>
              <option value="rejected">{t('withdrawalsMonitoring.filterRejected', 'Rejected Only')}</option>
            </select>
          </div>
        </div>

        {/* Withdrawals Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colUser', 'Beneficiary User')}</th>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colAmount', 'Payout Value')}</th>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colType', 'Type')}</th>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colMethod', 'Routing Method')}</th>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colDetails', 'Bank Details / IBAN')}</th>
                  <th className="p-4 text-start">{t('withdrawalsMonitoring.colStatus', 'Status')}</th>
                  <th className="p-4 text-center">{t('withdrawalsMonitoring.colOperations', 'Operations')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      {t('withdrawalsMonitoring.loading', 'Loading withdrawals...')}
                    </td>
                  </tr>
                ) : withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      {t('withdrawalsMonitoring.noWithdrawals', 'No withdrawal requests found.')}
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Beneficiary User */}
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{w.user_name}</p>
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400">@{w.user_name?.toLowerCase().replace(/\s+/g, '')}</p>
                          <p className="text-[10px] text-slate-400">{w.user_email}</p>
                        </div>
                      </td>

                      {/* Payout Value */}
                      <td className="p-4 font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                        ${Number(w.amount).toFixed(2)}
                      </td>

                      {/* Type */}
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          PAYOUT
                        </span>
                      </td>

                      {/* Routing Method */}
                      <td className="p-4 font-bold uppercase text-[11px] text-slate-700 dark:text-slate-300">
                        {w.payment_method?.toUpperCase()}
                      </td>

                      {/* Bank Details / IBAN */}
                      <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 max-w-xs break-all">
                        {w.payment_details}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          w.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300'
                            : w.status === 'rejected'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300'
                        }`}>
                          {w.status === 'completed' ? t('withdrawalsMonitoring.statusApproved', 'APPROVED') : w.status === 'rejected' ? t('withdrawalsMonitoring.statusRejected', 'REJECTED') : t('withdrawalsMonitoring.statusPending', 'PENDING')}
                        </span>
                      </td>

                      {/* Operations */}
                      <td className="p-4 text-center">
                        {w.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenModal(w, 'approve')}
                              title={t('withdrawalsMonitoring.confirmPayout', 'Confirm Payout')}
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(w, 'reject')}
                              title={t('withdrawalsMonitoring.confirmReject', 'Confirm Rejection')}
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {t('withdrawalsMonitoring.processed', 'Processed')}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Approve / Reject Dialog */}
        <Dialog open={Boolean(actionType)} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                {actionType === 'approve' ? (
                  <span className="text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> {t('withdrawalsMonitoring.approveTitle', 'Confirm Withdrawal Payout')}
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-2">
                    <XCircle className="h-5 w-5" /> {t('withdrawalsMonitoring.rejectTitle', 'Reject Withdrawal & Refund Balance')}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {t('withdrawalsMonitoring.amountRequested', 'Requested Amount:')} <strong className="font-mono text-slate-900 dark:text-white">${selectedReq?.amount} USD</strong>
                <br />
                {t('withdrawalsMonitoring.beneficiary', 'Beneficiary:')} <strong>{selectedReq?.user_name}</strong> ({selectedReq?.user_email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {actionType === 'approve' ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{t('withdrawalsMonitoring.txProofLabel', 'Transaction Proof / TXID (Optional)')}</Label>
                    <Input
                      placeholder={t('withdrawalsMonitoring.txProofPlaceholder', 'e.g. TRX-994829482...')}
                      value={transactionProof}
                      onChange={(e) => setTransactionProof(e.target.value)}
                      className="rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">{t('withdrawalsMonitoring.notesLabel', 'Transfer Notes (Optional)')}</Label>
                    <Textarea
                      placeholder={t('withdrawalsMonitoring.notesPlaceholder', 'Transferred via bank account...')}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl text-xs min-h-[60px]"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-rose-600">{t('withdrawalsMonitoring.rejectReasonLabel', 'Rejection Reason (Required)*')}</Label>
                  <Textarea
                    placeholder={t('withdrawalsMonitoring.rejectReasonPlaceholder', 'Enter rejection reason (e.g. incorrect account number or missing routing details)...')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl text-xs min-h-[80px]"
                  />
                  <p className="text-[11px] text-slate-400">
                    {t('withdrawalsMonitoring.refundNotice', '* The amount of ${{amount}} USD will be refunded immediately to the member\'s wallet.', { amount: selectedReq?.amount })}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setActionType(null)} className="rounded-xl">
                {t('withdrawalsMonitoring.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className={`rounded-xl font-bold text-white ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : actionType === 'approve' ? t('withdrawalsMonitoring.confirmPayout', 'Confirm Payout') : t('withdrawalsMonitoring.confirmReject', 'Confirm Rejection')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
