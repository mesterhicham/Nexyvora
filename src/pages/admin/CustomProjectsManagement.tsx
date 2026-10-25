import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { adminServiceService } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Zap, Clock, CheckCircle2, Search, Filter, MessageCircle, 
  ExternalLink, Edit2, Loader2, Calendar, FileText, Check 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomProjectsManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Edit / Details Modal State
  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [editStatus, setEditStatus] = useState<string>('new_request');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<string>('');
  const [meetingNotes, setMeetingNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, searchQuery]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminServiceService.getCustomProjects(params);
      if (res?.success) {
        setRequests(res.data || []);
      }
    } catch (err: any) {
      toast.error(tr('فشل تحميل طلبات المشاريع الخاصة', 'Failed to load custom requests'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (req: any) => {
    setEditingRequest(req);
    setEditStatus(req.status || 'new_request');
    setAdminNotes(req.admin_notes || '');
    setMeetingDate(req.meeting_date ? new Date(req.meeting_date).toISOString().slice(0, 16) : '');
    setMeetingNotes(req.meeting_notes || '');
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await adminServiceService.updateCustomProject(editingRequest.id, {
        status: editStatus,
        admin_notes: adminNotes.trim() || undefined,
        meeting_date: meetingDate || undefined,
        meeting_notes: meetingNotes.trim() || undefined
      });

      if (res?.success) {
        toast.success(tr('تم تحديث حالة الطلب بنجاح', 'Project request updated successfully'));
        setEditingRequest(null);
        fetchRequests();
      } else {
        toast.error(res?.message || tr('فشل التحديث', 'Update failed'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('حدث خطأ أثناء التحديث', 'Error updating request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new_request':
        return <Badge variant="outline" className="bg-slate-500/10 text-slate-600">{tr('طلب جديد', 'New Request')}</Badge>;
      case 'reviewing':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{tr('قيد المراجعة', 'Reviewing')}</Badge>;
      case 'contacted':
      case 'meeting_scheduled':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">{tr('تم التواصل', 'Contacted')}</Badge>;
      case 'proposal_sent':
        return <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">{tr('أُرسل العرض', 'Proposal Sent')}</Badge>;
      case 'in_progress':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">{tr('قيد التنفيذ', 'In Progress')}</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">{tr('مكتمل', 'Completed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("إدارة طلبات المشاريع البرمجية الخاصة", "Custom Projects Pipeline")}
            description={tr(
              "متابعة طلبات التطوير الخاصة المقدمة من العملاء، دراسة المواصفات والتواصل المباشر مع العملاء عبر واتساب أو البريد.",
              "Manage custom development requests, review specifications, and communicate with clients."
            )}
            breadcrumbs={[
              { label: tr("لوحة الإدارة", "Admin Dashboard"), href: "/admin" },
              { label: tr("طلبات المشاريع الخاصة", "Custom Projects") }
            ]}
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: tr("جميع الطلبات", "All Requests") },
              { id: 'new_request', label: tr("طلبات جديدة", "New") },
              { id: 'reviewing', label: tr("قيد المراجعة", "Reviewing") },
              { id: 'in_progress', label: tr("قيد التنفيذ", "In Progress") },
              { id: 'completed', label: tr("المكتملة", "Completed") },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
                className="rounded-full px-4 text-xs font-medium shrink-0"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tr("بحث باسم المشروع أو العميل...", "Search requests...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 rtl:pr-9 ltr:pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Requests Table */}
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4 text-start">{tr("المشروع والمرجع", "Project & Ref")}</th>
                  <th className="p-4 text-start">{tr("نوع المشروع", "Type")}</th>
                  <th className="p-4 text-start">{tr("بيانات العميل والتواصل", "Client Contact")}</th>
                  <th className="p-4 text-start">{tr("الميزانية والمدة", "Budget & Timeline")}</th>
                  <th className="p-4 text-start">{tr("الحالة", "Status")}</th>
                  <th className="p-4 text-start">{tr("تاريخ الطلب", "Date")}</th>
                  <th className="p-4 text-end">{tr("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                  ))
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {tr("لا توجد طلبات مشاريع خاصة مطابقة", "No project requests found")}
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => {
                    const cleanPhone = (req.contact_whatsapp || '').replace(/[^0-9]/g, '');
                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold block text-foreground text-sm">{req.project_name}</span>
                            <span className="font-mono text-muted-foreground text-[11px]" dir="ltr">#{req.request_number}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <Badge variant="outline" className="capitalize">{req.project_type}</Badge>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold block text-foreground">{req.user_name}</span>
                            <span className="text-[11px] text-muted-foreground block font-mono" dir="ltr">{req.contact_email}</span>
                            {req.contact_whatsapp && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً ${req.user_name}، نتواصل معك من منصة Nextvora بخصوص طلب مشروعك (${req.project_name})`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline pt-0.5"
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span dir="ltr">{req.contact_whatsapp}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground block">{req.estimated_budget || '—'}</span>
                            <span className="text-[11px] text-muted-foreground block">{req.estimated_duration || '—'}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          {getStatusBadge(req.status)}
                        </td>

                        <td className="p-4 text-muted-foreground text-[11px]">
                          {new Date(req.created_at).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US')}
                        </td>

                        <td className="p-4 text-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(req)}
                            className="gap-1.5 text-xs h-8"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            {tr("تفاصيل وتحديث", "Review & Update")}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Review & Update Modal */}
        {editingRequest && (
          <Dialog open={!!editingRequest} onOpenChange={() => setEditingRequest(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {tr("مراجعة وتحديث طلب المشروع الخاص", "Review Custom Project Request")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingRequest.project_name} (#{editingRequest.request_number}) — العميل: {editingRequest.contact_email}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveUpdate} className="space-y-5 py-2">
                {/* Description Scope Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs space-y-2">
                  <strong className="block text-foreground">{tr("وصف ومتطلبات المشروع من العميل:", "Client Requirements & Scope:")}</strong>
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {editingRequest.description}
                  </p>
                  {editingRequest.attachment_url && (
                    <div className="pt-2 border-t flex items-center gap-2">
                      <span className="text-muted-foreground">{tr("رابط المرفقات:", "Attachment Link:")}</span>
                      <a
                        href={editingRequest.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {editingRequest.attachment_url}
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("حالة الطلب الحالية", "Status")}</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      <option value="new_request">طلب جديد (New Request)</option>
                      <option value="reviewing">قيد المراجعة الفنية (Reviewing)</option>
                      <option value="contacted">تم التواصل (Contacted)</option>
                      <option value="meeting_scheduled">تم جدولة موعد مناقشة (Meeting Scheduled)</option>
                      <option value="proposal_sent">أُرسل العرض المالي والفني (Proposal Sent)</option>
                      <option value="in_progress">قيد التطوير والتنفيذ (In Progress)</option>
                      <option value="completed">مكتمل ومسلّم للعميل (Completed)</option>
                      <option value="rejected">مرفوض / غير متاح (Rejected)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">{tr("موعد المناقشة أو المقابلة (إن وجد)", "Meeting Date")}</Label>
                    <Input
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">
                    {tr("ملاحظات وتحديثات الإدارة (تظهر للعميل في حسابه)", "Public Admin Feedback (Visible to Client)")}
                  </Label>
                  <Textarea
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="تم مراجعة الطلب وجاري إعداد العرض الفني، سيتم التواصل معك عبر واتساب غداً..."
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {tr("محضر أو ملاحظات الاجتماع الداخلية (خاصة بالإدارة)", "Internal Meeting Notes")}
                  </Label>
                  <Textarea
                    rows={2}
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="نقاط الاتفاق التقني، تفاصيل الاستضافة، الدفعات المالية..."
                    className="text-xs"
                  />
                </div>

                <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingRequest(null)}>
                    {tr("إلغاء", "Cancel")}
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2 bg-primary font-bold">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {tr("حفظ التحديثات", "Save Changes")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
