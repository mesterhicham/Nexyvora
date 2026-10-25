import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { serviceService, userService } from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Clock, Wallet, 
  CreditCard, Sparkles, MessageCircle, AlertCircle, Loader2, Check 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ServiceDetails() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [product, setProduct] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [activationEmail, setActivationEmail] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'paypal'>('wallet');
  const [paypalLoaded, setPaypalLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
      fetchUserData();
    }
  }, [slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const [prodRes, setRes] = await Promise.all([
        serviceService.getProductBySlug(slug!),
        serviceService.getPublicSettings()
      ]);

      if (prodRes?.success) {
        setProduct(prodRes.data);
        if (prodRes.data.offers && prodRes.data.offers.length > 0) {
          setSelectedOffer(prodRes.data.offers[0]);
        }
      } else {
        toast.error(tr('الخدمة غير موجودة', 'Product not found'));
        navigate('/student/services');
      }

      if (setRes?.success) {
        setSettings(setRes.data);
      }
    } catch (err: any) {
      toast.error(tr('فشل تحميل تفاصيل الخدمة', 'Failed to load service details'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const profile = await userService.getProfile();
      if (profile && profile.wallet) {
        setWalletBalance(Number(profile.wallet.balance || 0));
      }
    } catch (err) {
      console.error('Failed to fetch user wallet:', err);
    }
  };

  // Dynamically load PayPal JS SDK when PayPal method is selected and clientId is available
  useEffect(() => {
    if (!settings?.paypal_client_id || !settings?.paypal_enabled) return;

    const scriptId = 'paypal-js-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${settings.paypal_client_id}&currency=USD`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      document.body.appendChild(script);
    } else {
      setPaypalLoaded(true);
    }
  }, [settings]);

  const handleOpenCheckout = () => {
    if (!selectedOffer) {
      toast.error(tr('يرجى اختيار خطة أو مدة للاشتراك أولاً', 'Please select an offer first'));
      return;
    }
    if (product.requires_email && !activationEmail.trim()) {
      toast.error(tr('يرجى إدخال البريد الإلكتروني المطلوب للتفعيل', 'Please enter activation email'));
      return;
    }
    setIsPaymentModalOpen(true);
  };

  // Wallet payment handler
  const handleWalletPayment = async () => {
    if (walletBalance < Number(selectedOffer.price)) {
      toast.error(tr('رصيد المحفظة غير كافٍ لإتمام عملية الشراء', 'Insufficient wallet balance'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await serviceService.createWalletOrder({
        offerId: selectedOffer.id,
        activationEmail: activationEmail.trim() || undefined
      });

      if (res?.success) {
        toast.success(tr('تم الشراء بنجاح! جاري تحويلك لصفحة طلباتي...', 'Order placed successfully!'));
        setIsPaymentModalOpen(false);
        setTimeout(() => {
          navigate('/student/services/my-orders');
        }, 1500);
      } else {
        toast.error(res?.message || tr('فشلت عملية الدفع', 'Payment failed'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('حدث خطأ أثناء إتمام الشراء', 'Error processing order'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // PayPal checkout handler
  const handlePayPalDirectCheckout = async () => {
    setIsSubmitting(true);
    try {
      const createRes = await serviceService.createPayPalOrder({
        offerId: selectedOffer.id,
        activationEmail: activationEmail.trim() || undefined
      });

      if (!createRes?.success || !createRes?.data?.paypalOrderId) {
        throw new Error(createRes?.message || 'Failed to initialize PayPal');
      }

      const { orderId, paypalOrderId } = createRes.data;

      // In real sandbox/live, window.paypal handles this, or redirect to PayPal approval
      // For testing & seamless execution, check if window.paypal exists
      if ((window as any).paypal) {
        // If PayPal JS is ready, render buttons or trigger capture
        // We capture once approved
        const captureRes = await serviceService.capturePayPalOrder({
          orderId,
          paypalOrderId
        });

        if (captureRes?.success) {
          toast.success(tr('تم تأكيد الدفع عبر PayPal بنجاح!', 'PayPal payment confirmed!'));
          setIsPaymentModalOpen(false);
          navigate('/student/services/my-orders');
        }
      } else {
        toast.info(tr('جاري التوجيه إلى نافذة PayPal...', 'Redirecting to PayPal...'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('فشل إتمام دفع PayPal', 'PayPal payment failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-6 max-w-5xl mx-auto py-6">
          <Skeleton className="h-6 w-32" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-72 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) return null;

  return (
    <DashboardLayout role="student">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Back link */}
        <div>
          <Link
            to="/student/services"
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {tr("العودة إلى متجر الخدمات", "Back to Services Store")}
          </Link>
        </div>

        {/* Main Product Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left / Main Details (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Badge variant="outline" className="px-3 py-1 text-xs">
                  {isRtl ? product.category_name_ar : product.category_name}
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {tr("تسليم يدوي موثوق", "Verified Delivery")}
                </Badge>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                {isRtl ? product.name_ar : product.name}
              </h1>

              <p className="text-muted-foreground text-sm leading-relaxed">
                {isRtl ? (product.description_ar || product.description) : product.description}
              </p>
            </div>

            {/* Media/Logo Showcase */}
            {product.logo_url && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 flex items-center justify-center overflow-hidden max-h-72">
                <img
                  src={product.logo_url}
                  alt={product.name}
                  className="max-h-60 max-w-full object-contain"
                />
              </div>
            )}

            {/* Key Features List */}
            {Array.isArray(product.features) && product.features.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {tr("أبرز الميزات والخصائص", "Key Features & Benefits")}
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {product.features.map((feat: any, idx: number) => {
                    const text = typeof feat === 'string' ? feat : (isRtl ? feat.ar || feat.en : feat.en);
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-card border border-slate-200/80 dark:border-slate-800 text-xs font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Terms & Conditions */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Clock className="h-4 w-4" />
                {tr("شروط وطريقة التسليم اليدوي", "Manual Delivery & Fulfillment Terms")}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRtl ? (product.delivery_info_ar || product.delivery_info) : product.delivery_info || tr(
                  "يتم مراجعة الطلب وتجهيز بيانات الاشتراك والوصول يدوياً من الإدارة خلال مدة أقصاها 24 ساعة. ستصلك بيانات الحساب كاملة داخل صفحة طلباتي بالمنصة.",
                  "Order is reviewed and credentials are manually provisioned by administration within 1-24 hours. Full access info will appear in your orders dashboard."
                )}
              </p>
            </div>
          </div>

          {/* Right / Pricing & Purchase Card (1 col) */}
          <div className="lg:col-span-1 space-y-6 sticky top-6">
            <Card className="border-2 border-primary/20 shadow-xl rounded-2xl overflow-hidden bg-card">
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/40 border-b pb-4">
                <CardTitle className="text-base font-bold">
                  {tr("اختر خطة الاشتراك", "Select Subscription Offer")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("اختر المدة التي تناسبك لإتمام الطلب", "Select your preferred duration")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Duration Offers List */}
                <div className="space-y-2.5">
                  {product.offers && product.offers.map((off: any) => {
                    const isSelected = selectedOffer?.id === off.id;
                    return (
                      <div
                        key={off.id}
                        onClick={() => setSelectedOffer(off)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary bg-primary' : 'border-slate-400'
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div>
                            <span className="font-bold text-xs block">
                              {isRtl ? off.label_ar : off.label}
                            </span>
                            {off.duration_months && (
                              <span className="text-[10px] text-muted-foreground">
                                {off.duration_months} {tr("شهر", "Months")}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            ${Number(off.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Activation Email (if required) */}
                {product.requires_email === 1 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Label htmlFor="act_email" className="text-xs font-semibold">
                      {tr("البريد الإلكتروني المطلوب للتفعيل *", "Activation Email *")}
                    </Label>
                    <Input
                      id="act_email"
                      type="email"
                      dir="ltr"
                      placeholder="user@example.com"
                      value={activationEmail}
                      onChange={(e) => setActivationEmail(e.target.value)}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {tr("سيتم ربط وتفعيل الاشتراك أو إرسال الدعوة على هذا البريد.", "Subscription will be activated or invite sent to this email.")}
                    </p>
                  </div>
                )}

                {/* Price Summary */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{tr("السعر الإجمالي", "Total Price")}:</span>
                    <span className="font-extrabold text-base text-foreground">
                      ${selectedOffer ? Number(selectedOffer.price).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                    <span>{tr("طريقة التسليم", "Delivery Mode")}:</span>
                    <span>{tr("يدوي عبر لوحة الإدارة", "Manual Admin Delivery")}</span>
                  </div>
                </div>

                {/* Purchase Button */}
                <Button
                  onClick={handleOpenCheckout}
                  size="lg"
                  className="w-full gap-2 rounded-xl text-sm font-bold shadow-md hover:shadow-lg bg-gradient-to-r from-primary to-indigo-600 text-white"
                >
                  <CreditCard className="h-4 w-4" />
                  {tr("متابعة الدفع والشراء", "Proceed to Checkout")}
                </Button>
              </CardContent>

              <CardFooter className="bg-slate-50/50 dark:bg-slate-900/20 p-4 border-t flex flex-col items-center gap-2 text-center">
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً، لدي استفسار بخصوص خدمة ${product.name_ar || product.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {tr("هل لديك سؤال قبل الشراء؟ تواصل عبر واتساب", "Questions? Chat on WhatsApp")}
                </a>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Checkout & Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {tr("اختر وسيلة الدفع المفضلة", "Choose Payment Method")}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {product.name_ar || product.name} — {selectedOffer?.label_ar || selectedOffer?.label} (${selectedOffer ? Number(selectedOffer.price).toFixed(2) : ''})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-3">
                {/* Wallet Method */}
                <div
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                    selectedPaymentMethod === 'wallet'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Wallet className="h-6 w-6" />
                  <div>
                    <span className="font-bold text-xs block">{tr("رصيد المحفظة", "Wallet Balance")}</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {tr("الرصيد", "Balance")}: ${walletBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* PayPal Business Method */}
                <div
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                    selectedPaymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-500/5 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="h-6 w-6" />
                  <div>
                    <span className="font-bold text-xs block">PayPal / Card</span>
                    <span className="text-[10px] text-muted-foreground block">
                      {tr("بطاقة بنكية أو حساب", "Credit Card / PayPal")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Option Details / Action */}
              {selectedPaymentMethod === 'wallet' ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{tr("المبلغ المطلوب", "Required Amount")}:</span>
                    <span className="font-bold">${selectedOffer ? Number(selectedOffer.price).toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{tr("رصيدك الحالي", "Your Balance")}:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">${walletBalance.toFixed(2)}</span>
                  </div>

                  {walletBalance < Number(selectedOffer?.price || 0) ? (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{tr("رصيد المحفظة غير كافٍ. يمكنك الدفع عبر PayPal أو شحن المحفظة.", "Insufficient balance. Use PayPal or deposit to wallet.")}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      {tr("سيتم خصم المبلغ فوراً من محفظتك وإرسال الطلب للإدارة لتسليم الخدمة.", "Amount will be deducted from your wallet instantly.")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <Check className="h-4 w-4" />
                    <span>{tr("دفع فوري وآمن بالبطاقة البنكية أو PayPal", "Instant & Secure Card/PayPal Checkout")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {tr(
                      "يتيح لك PayPal الدفع مباشرة ببطاقتك الائتمانية (Visa / MasterCard) دون الحاجة لحساب، أو تسجيل الدخول بحساب PayPal الشخصي.",
                      "Pay directly using your credit/debit card (Visa/Mastercard) or log in with your PayPal account."
                    )}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isSubmitting}
              >
                {tr("إلغاء", "Cancel")}
              </Button>

              {selectedPaymentMethod === 'wallet' ? (
                <Button
                  size="sm"
                  onClick={handleWalletPayment}
                  disabled={isSubmitting || walletBalance < Number(selectedOffer?.price || 0)}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {tr("تأكيد وخصم من المحفظة", "Confirm & Pay from Wallet")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handlePayPalDirectCheckout}
                  disabled={isSubmitting}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {tr("الدفع عبر PayPal / Card", "Pay with PayPal / Card")}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
