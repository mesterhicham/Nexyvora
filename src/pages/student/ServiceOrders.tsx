import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { serviceService } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  ShoppingBag, Clock, CheckCircle2, Copy, MessageCircle, 
  ExternalLink, ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, KeyRound, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceOrders() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrdersAndSettings();
    handlePayPalCallback();
  }, []);

  const handlePayPalCallback = async () => {
    const isSuccess = searchParams.get('paypal_success');
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token'); // PayPal passes order ID as token

    if (isSuccess && orderId && token) {
      try {
        toast.loading(tr('جاري تأكيد عملية الدفع من PayPal...', 'Verifying PayPal payment...'), { id: 'paypal-capture' });
        const res = await serviceService.capturePayPalOrder({
          orderId,
          paypalOrderId: token
        });

        if (res?.success) {
          toast.success(tr('تم تأكيد الدفع عبر PayPal بنجاح! طلبك قيد التجهيز.', 'PayPal payment confirmed! Your order is being processed.'), { id: 'paypal-capture' });
          fetchOrdersAndSettings();
        } else {
          toast.error(res?.message || tr('فشل تأكيد الدفع من بايبال', 'Failed to confirm PayPal payment'), { id: 'paypal-capture' });
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || tr('خطأ أثناء تأكيد دفع بايبال', 'Error confirming PayPal payment'), { id: 'paypal-capture' });
      } finally {
        // Clean URL params
        navigate('/student/services/my-orders', { replace: true });
      }
    }
  };

  const fetchOrdersAndSettings = async () => {
    setLoading(true);
    try {
      const [ordRes, setRes] = await Promise.all([
        serviceService.getMyOrders(),
        serviceService.getPublicSettings()
      ]);

      if (ordRes?.success) setOrders(ordRes.data || []);
      if (setRes?.success) setSettings(setRes.data || {});
    } catch (err: any) {
      toast.error(tr('فشل تحميل الطلبات', 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(tr('تم نسخ بيانات التسليم إلى الحافظة', 'Copied to clipboard'));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
      case 'processing':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs gap-1">
            <Clock className="h-3 w-3" />
            {tr("جاري التجهيز والمراجعة", "Processing by Admin")}
          </Badge>
        );
      case 'delivered':
      case 'completed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1 font-bold">
            <CheckCircle2 className="h-3 w-3" />
            {tr("تم التسليم بنجاح", "Delivered & Ready")}
          </Badge>
        );
      case 'cancelled':
      case 'refunded':
        return (
          <Badge variant="destructive" className="text-xs">
            {tr("ملغي / مسترجع", "Cancelled / Refunded")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("طلباتي ومشتريات الخدمات", "My Service Orders")}
            description={tr(
              "متابعة حالة طلباتك، استعراض بيانات التفعيل والاشتراكات المسلّمة من قِبل الإدارة والتواصل المباشر للدعم.",
              "Track your orders, view delivered credentials and activation notes, and contact support directly."
            )}
            breadcrumbs={[
              { label: tr("الرئيسية", "Dashboard"), href: "/student" },
              { label: tr("متجر الخدمات", "Services Store"), href: "/student/services" },
              { label: tr("طلباتي", "My Orders") }
            ]}
          />
          <Link to="/student/services">
            <Button variant="outline" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              {tr("تصفح المزيد من الخدمات", "Browse More Services")}
            </Button>
          </Link>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="text-center p-12 border-dashed border-2">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold">
                {tr("لا توجد طلبات سابقة حتى الآن", "No orders yet")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {tr(
                  "تصفح متجر الخدمات الرقمية لاختيار اشتراكات الذكاء الاصطناعي، برمجيات SaaS، أو مشاريع المتاجر الجاهزة.",
                  "Explore our store to purchase AI accounts, SaaS software, or ready-to-launch stores."
                )}
              </p>
              <Link to="/student/services">
                <Button className="gap-2 mt-2">
                  <ShoppingBag className="h-4 w-4" />
                  {tr("زيارة المتجر الآن", "Go to Store")}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const isDelivered = ord.status === 'delivered' || ord.status === 'completed';
              return (
                <Card 
                  key={ord.id} 
                  className={`border transition-all duration-200 overflow-hidden ${
                    isDelivered 
                      ? 'border-emerald-500/30 dark:border-emerald-500/20 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Product & Offer info */}
                      <div className="flex items-start gap-4">
                        {ord.logo_url ? (
                          <div className="w-14 h-14 rounded-xl border p-2 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0">
                            <img src={ord.logo_url} alt={ord.product_name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base">
                              {isRtl ? ord.product_name_ar : ord.product_name}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {isRtl ? ord.offer_label_ar : ord.offer_label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>{tr("رقم الطلب", "Order")}: <strong className="text-foreground" dir="ltr">#{ord.order_number}</strong></span>
                            <span>•</span>
                            <span>{tr("وسيلة الدفع", "Paid via")}: <strong className="capitalize text-foreground">{ord.payment_method}</strong></span>
                            <span>•</span>
                            <span>{new Date(ord.created_at).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US')}</span>
                          </div>

                          {ord.activation_email && (
                            <p className="text-xs text-muted-foreground">
                              {tr("بريد التفعيل", "Activation Email")}: <span className="font-mono text-foreground" dir="ltr">{ord.activation_email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Actions */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-foreground">
                            ${Number(ord.price_at_purchase).toFixed(2)}
                          </span>
                          {getStatusBadge(ord.status)}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً، أستفسر بخصوص طلبي رقم #${ord.order_number} لخدمة ${ord.product_name_ar || ord.product_name}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            {tr("استفسار عبر واتساب", "WhatsApp Inquiry")}
                          </a>

                          {isDelivered && ord.delivery_notes && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                              onClick={() => setSelectedOrder(ord)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              {tr("عرض بيانات الاستلام", "View Delivery Notes")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Credentials Card (If Delivered) */}
                    {isDelivered && ord.delivery_notes && (
                      <div className="mt-5 pt-4 border-t border-emerald-500/20 bg-emerald-500/5 -mx-6 -mb-6 p-6 rounded-b-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <KeyRound className="h-4 w-4" />
                            {tr("بيانات الاشتراك والاستلام المسلّمة من الإدارة:", "Delivered Credentials & Access Instructions:")}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2.5 text-xs gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => copyToClipboard(ord.delivery_notes)}
                          >
                            <Copy className="h-3 w-3" />
                            {tr("نسخ البيانات", "Copy")}
                          </Button>
                        </div>
                        <div className="p-3.5 rounded-xl bg-background border border-emerald-500/20 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                          {ord.delivery_notes}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delivery Details Modal */}
        {selectedOrder && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  {tr("بيانات تسليم الطلب", "Order Delivery Details")}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedOrder.product_name_ar || selectedOrder.product_name} (#{selectedOrder.order_number})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("المنتج", "Product")}:</span>
                    <span className="font-bold">{selectedOrder.product_name_ar || selectedOrder.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("الخطة / المدة", "Offer")}:</span>
                    <span>{selectedOrder.offer_label_ar || selectedOrder.offer_label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{tr("المبلغ المدفوع", "Price")}:</span>
                    <span className="font-bold text-emerald-600">${Number(selectedOrder.price_at_purchase).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {tr("بيانات الدخول والتفعيل المسلّمة:", "Access Credentials & Notes:")}
                  </Label>
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/30 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {selectedOrder.delivery_notes}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => copyToClipboard(selectedOrder.delivery_notes)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {tr("نسخ البيانات", "Copy All")}
                </Button>
                <Button size="sm" onClick={() => setSelectedOrder(null)}>
                  {tr("إغلاق", "Close")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
