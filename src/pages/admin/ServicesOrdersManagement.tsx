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
  ShoppingBag, Clock, CheckCircle2, Search, Filter, KeyRound, 
  Send, Loader2, MessageCircle, AlertCircle, History, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesOrdersManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Delivery Modal State
  const [deliveringOrder, setDeliveringOrder] = useState<any>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState<boolean>(false);

  // Status Change / Log Modal State
  const [viewingOrder, setViewingOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchQuery]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminServiceService.getOrders(params);
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch (err: any) {
      toast.error(tr('فشل تحميل قائمة الطلبات', 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDeliverModal = (ord: any) => {
    setDeliveringOrder(ord);
    setDeliveryNotes(ord.delivery_notes || '');
    setAdminNotes(ord.admin_notes || '');
    setMarkCompleted(true);
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deliveryNotes.trim()) {
      toast.error(tr('يرجى إدخال بيانات أو تعليمات التسليم للعميل', 'Delivery notes are required'));
      return;
    }

    setIsSubmittingDelivery(true);
    try {
      const res = await adminServiceService.deliverOrder(deliveringOrder.id, {
        deliveryNotes: deliveryNotes.trim(),
        markCompleted,
        adminNotes: adminNotes.trim() || undefined
      });

      if (res?.success) {
        toast.success(tr('تم تسليم الخدمة وإشعار العميل بنجاح!', 'Order delivered successfully!'));
        setDeliveringOrder(null);
        fetchOrders();
      } else {
        toast.error(res?.message || tr('فشل تسليم الطلب', 'Delivery failed'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('حدث خطأ أثناء تسليم الطلب', 'Error delivering order'));
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  const handleOpenViewLogs = async (ord: any) => {
    try {
      const res = await adminServiceService.getOrderById(ord.id);
      if (res?.success) {
        setViewingOrder(res.data);
      }
    } catch (err) {
      toast.error(tr('فشل تحميل تفاصيل الطلب', 'Failed to load order details'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-bold gap-1">
            <Clock className="h-3 w-3" />
            {tr("مدفوع - بانتظار التسليم", "Paid - Awaiting Delivery")}
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs gap-1">
            <Clock className="h-3 w-3" />
            {tr("قيد التجهيز", "Processing")}
          </Badge>
        );
      case 'delivered':
      case 'completed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs font-bold gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {tr("تم التسليم", "Delivered / Completed")}
          </Badge>
        );
      case 'cancelled':
      case 'refunded':
        return <Badge variant="destructive" className="text-xs">{status}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("إدارة طلبات الخدمات والتسليم اليدوي", "Services Orders & Manual Delivery")}
            description={tr(
              "متابعة طلبات العملاء الجديدة، مراجعة بيانات التفعيل، تسليم بيانات الاشتراكات والحسابات يدوياً وتوثيق سجل التسليم.",
              "Track new customer orders, fulfill credentials manually, and manage customer activation instructions."
            )}
            breadcrumbs={[
              { label: tr("لوحة الإدارة", "Admin Dashboard"), href: "/admin" },
              { label: tr("طلبات الخدمات", "Service Orders") }
            ]}
          />
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: tr("جميع الطلبات", "All Orders") },
              { id: 'paid', label: tr("بانتظار التسليم", "Awaiting Delivery") },
              { id: 'delivered', label: tr("المسلّمة", "Delivered") },
              { id: 'completed', label: tr("المكتملة", "Completed") },
              { id: 'cancelled', label: tr("الملغاة", "Cancelled") },
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

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={tr("بحث برقم الطلب، العميل، أو البريد...", "Search orders, emails...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 rtl:pr-9 ltr:pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-muted-foreground font-semibold">
                <tr>
                  <th className="p-4 text-start">{tr("رقم الطلب والخدمة", "Order & Service")}</th>
                  <th className="p-4 text-start">{tr("بيانات العميل", "Customer")}</th>
                  <th className="p-4 text-start">{tr("بريد التفعيل المطلوب", "Activation Email")}</th>
                  <th className="p-4 text-start">{tr("المبلغ والدفع", "Amount & Payment")}</th>
                  <th className="p-4 text-start">{tr("عمولة المُحيل (10%)", "Direct Commission")}</th>
                  <th className="p-4 text-start">{tr("الحالة", "Status")}</th>
                  <th className="p-4 text-end">{tr("إجراءات التسليم", "Fulfillment")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="p-4"><Skeleton className="h-8 w-full" /></td></tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {tr("لا توجد طلبات مطابقة", "No orders found")}
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => {
                    const needsDelivery = ord.status === 'paid' || ord.status === 'processing';
                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        {/* Order & Service */}
                        <td className="p-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-foreground text-sm block" dir="ltr">
                              #{ord.order_number}
                            </span>
                            <span className="font-semibold block text-primary">
                              {ord.product_name_ar || ord.product_name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {ord.offer_label_ar || ord.offer_label}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-bold block text-foreground">{ord.user_name || '—'}</span>
                            <span className="text-[11px] text-muted-foreground block font-mono" dir="ltr">{ord.user_email}</span>
                          </div>
                        </td>

                        {/* Activation Email */}
                        <td className="p-4">
                          {ord.activation_email ? (
                            <span className="font-mono text-foreground font-semibold bg-primary/5 px-2 py-1 rounded border border-primary/20 block w-fit" dir="ltr">
                              {ord.activation_email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-foreground text-sm block">
                              ${Number(ord.price_at_purchase).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase">
                              {ord.payment_method}
                            </span>
                          </div>
                        </td>

                        {/* Commission */}
                        <td className="p-4">
                          {ord.commission_amount ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-amber-600 block">
                                +${Number(ord.commission_amount).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[120px] block">
                                إلى: {ord.referrer_username || ord.referrer_email || 'المُحيل'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-[11px]">{tr("لا يوجد مُحيل", "None")}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {getStatusBadge(ord.status)}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            {needsDelivery ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenDeliverModal(ord)}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs shadow-sm"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                                {tr("تسليم الخدمة", "Deliver")}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenDeliverModal(ord)}
                                className="gap-1 text-xs h-8 border-emerald-500/30 text-emerald-600"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {tr("تحديث التسليم", "Update Delivery")}
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              title="سجل الحركات"
                              onClick={() => handleOpenViewLogs(ord)}
                            >
                              <History className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Deliver Order Modal (Manual Delivery) */}
        {deliveringOrder && (
          <Dialog open={!!deliveringOrder} onOpenChange={() => setDeliveringOrder(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-emerald-600">
                  <KeyRound className="h-5 w-5" />
                  {tr("تسليم الخدمة للعميل يدوياً", "Deliver Service Manually")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {deliveringOrder.product_name_ar || deliveringOrder.product_name} (#{deliveringOrder.order_number}) — العميل: {deliveringOrder.user_email}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSaveDelivery} className="space-y-4 py-2">
                {deliveringOrder.activation_email && (
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                    <span className="text-blue-700 dark:text-blue-400 font-bold block">
                      {tr("البريد الإلكتروني المطلوب للتفعيل من قِبل العميل:", "Client Requested Activation Email:")}
                    </span>
                    <span className="font-mono font-bold text-sm text-foreground" dir="ltr">
                      {deliveringOrder.activation_email}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">
                    {tr("بيانات الاشتراك وحساب الخدمة للتسليم *", "Delivered Credentials & Setup Notes *")}
                  </Label>
                  <Textarea
                    rows={6}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder={tr(
                      "أدخل بيانات الحساب، كلمة المرور المؤقتة، رابط الدعوة أو التعليمات التي ستظهر للعميل في حسابه...",
                      "Enter account email, credentials, invitation link or access instructions..."
                    )}
                    required
                    className="font-mono text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {tr("ستظهر هذه البيانات فوراً للعميل في حسابه بصفحة 'طلباتي' مع زر نسخ مباشر.", "This will appear immediately on the client's 'My Orders' page.")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    {tr("ملاحظات إدارية داخلية (خاصة بالإدارة)", "Internal Admin Notes")}
                  </Label>
                  <Input
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="ملاحظات سرية للإدارة فقط..."
                    className="text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                  <input
                    type="checkbox"
                    id="mark_completed"
                    checked={markCompleted}
                    onChange={(e) => setMarkCompleted(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="mark_completed" className="text-xs font-medium cursor-pointer">
                    {tr("تحديث حالة الطلب إلى مكتمل (Completed) وإرسال إشعار للعميل", "Mark status as Completed and notify client")}
                  </Label>
                </div>

                <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
                  <Button type="button" variant="outline" size="sm" onClick={() => setDeliveringOrder(null)}>
                    {tr("إلغاء", "Cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmittingDelivery}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    {isSubmittingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {tr("تأكيد التسليم وإرسال الإشعار", "Deliver & Notify Client")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Order Logs / Audit Modal */}
        {viewingOrder && (
          <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  {tr("سجل حركات وتدقيق الطلب", "Order Audit Trail")} #{viewingOrder.order_number}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("العميل", "Client")}:</span>
                    <span>{viewingOrder.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("السعر", "Price")}:</span>
                    <span className="font-bold">${Number(viewingOrder.price_at_purchase).toFixed(2)}</span>
                  </div>
                  {viewingOrder.commission_amount && (
                    <div className="flex justify-between text-amber-600">
                      <span>{tr("العمولة المباشرة", "Commission")}:</span>
                      <span>${Number(viewingOrder.commission_amount).toFixed(2)} (10%)</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold">{tr("سجل التغييرات والحالات (Audit Log):", "Status History:")}</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewingOrder.logs && viewingOrder.logs.map((log: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg border text-xs bg-card space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          <span className="font-semibold">{log.changed_by_name || 'System'}</span>
                        </div>
                        <p className="font-medium text-foreground">{log.note || `${log.old_status} -> ${log.new_status}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button size="sm" onClick={() => setViewingOrder(null)}>
                  {tr("إغلاق", "Close")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
