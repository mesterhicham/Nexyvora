import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { adminAffiliateService } from '@/services/apiService';
import { 
  ShieldCheck, 
  Check, 
  X, 
  FileText, 
  Eye, 
  Loader2, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminKYC() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview Dialog & Actions
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [actionType, setActionType] = useState<'verified' | 'rejected' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadKyc();
  }, [statusFilter]);

  const loadKyc = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getKyc(statusFilter);
      setRequests(res.requests || []);
    } catch (err: any) {
      toast.error(t('adminKyc.loadError', 'Failed to load KYC requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (kyc: any, status: 'verified' | 'rejected') => {
    setSelectedKyc(kyc);
    setActionType(status);
    setAdminNotes('');
  };

  const handleSubmitAction = async () => {
    if (!selectedKyc || !actionType) return;

    try {
      setSubmitting(true);
      const res = await adminAffiliateService.updateKycStatus(selectedKyc.id, {
        status: actionType,
        adminNotes: adminNotes.trim() || undefined,
      });
      toast.success(res.message || t('adminKyc.updateSuccess', 'KYC status updated successfully'));
      setActionType(null);
      setSelectedKyc(null);
      loadKyc();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('adminKyc.processError', 'Failed to process request'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider mb-1">
              {t('adminKyc.badge', 'Identity Verification')}
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('adminKyc.title', 'KYC Approval & Verification')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('adminKyc.subtitle', 'Review and audit identity documents submitted by students to verify accounts and enable withdrawal eligibility.')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            >
              <option value="all">{t('adminKyc.filterAll', 'All KYC Requests')}</option>
              <option value="pending">{t('adminKyc.filterPending', 'Pending Review')}</option>
              <option value="verified">{t('adminKyc.filterVerified', 'Verified Only')}</option>
              <option value="rejected">{t('adminKyc.filterRejected', 'Rejected Only')}</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 text-start">{t('adminKyc.colUser', 'User')}</th>
                  <th className="p-4 text-start">{t('adminKyc.colFullName', 'Full Name')}</th>
                  <th className="p-4 text-start">{t('adminKyc.colDocType', 'Doc Type & Number')}</th>
                  <th className="p-4 text-center">{t('adminKyc.colIdDocs', 'ID Documents')}</th>
                  <th className="p-4 text-start">{t('adminKyc.colSubmittedDate', 'Submitted Date')}</th>
                  <th className="p-4 text-start">{t('adminKyc.colStatus', 'Status')}</th>
                  <th className="p-4 text-center">{t('adminKyc.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      {t('adminKyc.loading', 'Loading KYC requests...')}
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      {t('adminKyc.noRequests', 'No KYC verification requests found.')}
                    </td>
                  </tr>
                ) : (
                  requests.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* User */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{k.user_name}</p>
                        <p className="text-[10px] text-slate-400">{k.user_email}</p>
                      </td>

                      {/* Full Name */}
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                        {k.full_name}
                      </td>

                      {/* Doc Type & Number */}
                      <td className="p-4">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize text-xs">
                          {k.document_type?.replace('_', ' ')}
                        </p>
                        <p className="font-mono text-[11px] text-slate-400">{k.document_number}</p>
                      </td>

                      {/* ID Documents */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {k.front_image_url && (
                            <button
                              onClick={() => setPreviewImage(k.front_image_url)}
                              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> {t('adminKyc.frontSide', 'Front Side')}
                            </button>
                          )}
                          {k.back_image_url && (
                            <button
                              onClick={() => setPreviewImage(k.back_image_url)}
                              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 hover:bg-slate-200 flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" /> {t('adminKyc.backSide', 'Back Side')}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(k.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          k.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-700'
                            : k.status === 'rejected'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {k.status === 'verified' ? 'VERIFIED ✓' : k.status === 'rejected' ? 'REJECTED' : 'PENDING'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        {k.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenAction(k, 'verified')}
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                              title={t('adminKyc.approveAction', 'Approve & Verify KYC')}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAction(k, 'rejected')}
                              className="h-8 w-8 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20"
                              title={t('adminKyc.rejectAction', 'Reject Document')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400">{t('adminKyc.processed', 'Completed')}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Confirmation Modal */}
        <Dialog open={Boolean(actionType)} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent className="sm:max-w-md rounded-3xl" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {actionType === 'verified' ? t('adminKyc.confirmTitleApprove', 'Confirm KYC Identity Verification') : t('adminKyc.confirmTitleReject', 'Reject KYC Verification Request')}
              </DialogTitle>
              <DialogDescription>
                {t('adminKyc.memberLabel', 'Member:')} <strong>{selectedKyc?.user_name}</strong> - {t('adminKyc.docNumberLabel', 'Doc Number:')} {selectedKyc?.document_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Label className="text-xs font-semibold">{t('adminKyc.adminNotesLabel', 'Admin Notes (Optional for approval, required for rejection)')}</Label>
              <Textarea
                placeholder={t('adminKyc.adminNotesPlaceholder', 'Enter verification notes or rejection reason...')}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="rounded-xl text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setActionType(null)} className="rounded-xl">
                {t('adminKyc.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSubmitAction}
                disabled={submitting}
                className={`rounded-xl font-bold text-white ${
                  actionType === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminKyc.confirmDecision', 'Confirm Decision')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview Modal */}
        <Dialog open={Boolean(previewImage)} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="sm:max-w-xl rounded-3xl p-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{t('adminKyc.previewTitle', 'KYC Document Preview')}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden max-h-[70vh]">
              {previewImage && (
                <img
                  src={previewImage.startsWith('http') ? previewImage : `${import.meta.env.VITE_API_URL}${previewImage}`}
                  alt="KYC Document Preview"
                  className="max-h-[65vh] w-auto object-contain rounded-xl"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
