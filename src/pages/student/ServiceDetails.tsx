import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { serviceService, userService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ChevronLeft, ChevronRight, Star, Clock, ShieldCheck, Wallet, 
  CreditCard, Sparkles, MessageCircle, AlertCircle, Loader2, Check,
  Cloud, Lock, Info, CheckCircle2, ArrowRight, ArrowLeft
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
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activationEmail, setActivationEmail] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'paypal'>('wallet');
  const [isPayPalSdkReady, setIsPayPalSdkReady] = useState<boolean>(false);
  const createdOrderIdRef = useRef<string | null>(null);

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

      if (prodRes?.success && prodRes.data) {
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

  const handleOpenCheckout = () => {
    if (!selectedOffer) {
      toast.error(tr('يرجى اختيار خطة أولاً', 'Please select a plan first'));
      return;
    }
    if (product.requires_email && !activationEmail.trim()) {
      toast.error(tr('يرجى إدخال البريد الإلكتروني للتفعيل', 'Please enter activation email'));
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

      if (!createRes?.success || !createRes?.data) {
        throw new Error(createRes?.message || 'Failed to initialize PayPal');
      }

      const { approveUrl, paypalOrderId } = createRes.data;

      if (approveUrl) {
        toast.info(tr('جاري توجيهك إلى صفحة الدفع الآمنة في PayPal...', 'Redirecting to PayPal secure checkout...'));
        window.location.href = approveUrl;
      } else {
        throw new Error(tr('تعذر الحصول على رابط الدفع من PayPal', 'PayPal approval link not found'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || tr('فشل إتمام دفع PayPal', 'PayPal payment failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Dynamically load PayPal JS SDK
  useEffect(() => {
    if (!settings?.paypal_client_id || !settings.paypal_enabled) return;

    if ((window as any).paypal) {
      setIsPayPalSdkReady(true);
      return;
    }

    const scriptId = 'paypal-js-sdk';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => setIsPayPalSdkReady(true));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://www.paypal.com/sdk/js?client-id=${settings.paypal_client_id}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => setIsPayPalSdkReady(true);
    script.onerror = (err) => console.error('Failed to load PayPal JS SDK:', err);
    document.body.appendChild(script);
  }, [settings?.paypal_client_id, settings?.paypal_enabled]);

  // 2. Render PayPal Smart Buttons when modal opens and method is paypal
  useEffect(() => {
    if (!isPaymentModalOpen || selectedPaymentMethod !== 'paypal' || !isPayPalSdkReady) return;

    const timer = setTimeout(() => {
      const container = document.getElementById('paypal-buttons-container');
      if (!container || !(window as any).paypal?.Buttons) return;

      container.innerHTML = '';

      try {
        const buttons = (window as any).paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: async () => {
            if (product?.requires_email && !activationEmail.trim()) {
              toast.error(tr('يرجى إدخال بريد التفعيل أولاً', 'Activation email is required'));
              throw new Error('Activation email is required');
            }

            const res = await serviceService.createPayPalOrder({
              offerId: selectedOffer.id,
              activationEmail: activationEmail.trim() || undefined
            });

            if (!res?.success || !res?.data) {
              throw new Error(res?.message || 'Failed to initialize PayPal order');
            }

            createdOrderIdRef.current = res.data.orderId;
            return res.data.paypalOrderId;
          },
          onApprove: async (data: any) => {
            setIsSubmitting(true);
            toast.loading(tr('جاري تأكيد عملية الدفع من PayPal...', 'Verifying payment...'), { id: 'paypal-capture' });
            try {
              const captureRes = await serviceService.capturePayPalOrder({
                orderId: createdOrderIdRef.current,
                paypalOrderId: data.orderID
              });

              if (captureRes?.success) {
                toast.success(tr('تم تأكيد الدفع بنجاح! طلبك قيد التجهيز.', 'Payment confirmed successfully!'), { id: 'paypal-capture' });
                setIsPaymentModalOpen(false);
                navigate('/student/services/my-orders');
              } else {
                toast.error(captureRes?.message || tr('فشل تأكيد الدفع', 'Payment capture failed'), { id: 'paypal-capture' });
              }
            } catch (err: any) {
              toast.error(err.response?.data?.message || err.message || tr('خطأ أثناء تأكيد الدفع', 'Payment error'), { id: 'paypal-capture' });
            } finally {
              setIsSubmitting(false);
            }
          },
          onError: (err: any) => {
            console.error('PayPal Button Error:', err);
            toast.error(tr('حدث خطأ في نافذة الدفع، يرجى المحاولة مرة أخرى', 'PayPal payment error, please retry'));
          }
        });

        buttons.render('#paypal-buttons-container');
      } catch (err) {
        console.error('Error rendering PayPal Buttons:', err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isPaymentModalOpen, selectedPaymentMethod, isPayPalSdkReady, selectedOffer, activationEmail]);

  // Auto-scroll modal smoothly when PayPal card form expands
  useEffect(() => {
    if (!isPaymentModalOpen || selectedPaymentMethod !== 'paypal') return;

    const container = document.getElementById('paypal-buttons-container');
    if (!container) return;

    let hasScrolled = false;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 250 && !hasScrolled) {
          hasScrolled = true;
          const dialogEl = container.closest('[role="dialog"]');
          if (dialogEl) {
            dialogEl.scrollTo({
              top: dialogEl.scrollHeight,
              behavior: 'smooth'
            });
          }
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [isPaymentModalOpen, selectedPaymentMethod]);

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="space-y-8 pb-16">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="rounded-3xl bg-[#0e1320] p-8 border border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <Skeleton className="h-80 w-full rounded-2xl bg-slate-800" />
                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl bg-slate-800" />
                  ))}
                </div>
              </div>
              <div className="lg:col-span-6 space-y-5">
                <Skeleton className="h-6 w-28 rounded-full bg-slate-800" />
                <Skeleton className="h-10 w-3/4 rounded-lg bg-slate-800" />
                <Skeleton className="h-4 w-1/2 rounded-lg bg-slate-800" />
                <Skeleton className="h-8 w-1/3 rounded-lg bg-slate-800" />
                <Skeleton className="h-24 w-full rounded-xl bg-slate-800" />
                <Skeleton className="h-14 w-full rounded-2xl bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!product) return null;

  // Prepare gallery images (5 images for the thumbnails row)
  const defaultImages = [
    product.logo_url || '/services/google_one.jpg',
    '/services/hero_laptop.jpg',
    '/services/gemini_advanced.jpg',
    '/services/veo3.jpg',
    '/services/chatgpt_plus.jpg'
  ];

  const galleryImages: string[] = (Array.isArray(product.images) && product.images.length > 0)
    ? [...product.images, ...defaultImages].slice(0, 5)
    : defaultImages;

  // Features checkmarks list
  const featuresList = (Array.isArray(product.features) && product.features.length > 0)
    ? product.features
    : [
        'Gemini - Your AI assistant for writing, coding, research and more.',
        'Google Flow - Create stunning videos with AI.',
        'Veo - Generate high-quality videos from text.',
        'NotebookLM - Research and summarize your documents.',
        'Google Drive - 5TB of cloud storage.',
        'Gmail - Extra storage for your emails and attachments.',
        'Google Photos - Store your photos and videos.'
      ];

  // Category badge label
  const categoryLabel = product.category_slug === 'digital-products' || product.category_type === 'digital_product'
    ? (isRtl ? 'منتج رقمي' : 'Digital Product')
    : product.category_slug === 'saas-tools' || product.category_type === 'saas'
    ? (isRtl ? 'برمجيات SaaS' : 'SaaS Software')
    : product.category_slug === 'ecommerce-projects' || product.category_type === 'ecommerce_project'
    ? (isRtl ? 'تجارة إلكترونية' : 'E-commerce')
    : (isRtl ? 'وكلاء الذكاء الاصطناعي' : 'AI Agents');

  // Plan discounts mapping helper
  const getPlanDiscount = (index: number) => {
    switch (index) {
      case 1: return '-10%';
      case 2: return '-15%';
      case 3: return '-20%';
      case 4: return '-25%';
      default: return null;
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 pb-16">
        {/* Breadcrumb Header matching Screenshot 2: < Services Store > Product Name */}
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-400">
          <Link
            to="/student/services"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span>{tr("Services Store", "Services Store")}</span>
          </Link>
          <span>&gt;</span>
          <span className="text-white font-semibold truncate">
            {isRtl ? product.name_ar : product.name}
          </span>
        </div>

        {/* Top Section: Split Product Hero & Purchase Area (Dark Container) */}
        <div className="rounded-3xl bg-[#0e1320] border border-slate-800/90 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle cosmic glow */}
          <div className="absolute -left-10 -top-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-10 -bottom-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Visual Showcase & Gallery Thumbnails */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Showcase Square */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gradient-to-br from-[#121829] to-[#0a0d18] border border-slate-800 flex items-center justify-center p-6 shadow-inner group">
                <img
                  src={galleryImages[activeImageIndex] || product.logo_url}
                  alt={product.name}
                  className="w-full h-full object-contain rounded-xl transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Gallery Thumbnails Row (5 items) */}
              <div className="grid grid-cols-5 gap-2.5">
                {galleryImages.map((img, idx) => {
                  const isActive = activeImageIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-[#121829] ${
                        isActive
                          ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                          : 'border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Info, Plan Selector & Buy Now CTA */}
            <div className="lg:col-span-6 space-y-5">
              {/* Category Badge */}
              <div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-wide bg-[#7c3aed] text-white shadow-md inline-block">
                  {categoryLabel}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                {isRtl ? product.name_ar : product.name}
              </h1>

              {/* Tagline / Subtitle */}
              <p className="text-slate-300 text-sm md:text-base font-normal leading-relaxed">
                {isRtl ? (product.description_ar || product.description) : product.description}
              </p>

              {/* Rating Row: ★ 4.9 (124 reviews) */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span>4.9</span>
                </div>
                <span className="text-slate-400 text-xs font-medium">
                  ({tr("124 reviews", "124 reviews")})
                </span>
              </div>

              {/* Price Line: From $9.99 / month */}
              <div className="pt-1 flex items-baseline gap-1.5">
                <span className="text-slate-400 text-sm font-medium">
                  {tr("From", "From")}
                </span>
                <span className="text-3xl font-black text-emerald-400">
                  ${selectedOffer ? Number(selectedOffer.price).toFixed(2) : '9.99'}
                </span>
                <span className="text-slate-400 text-sm font-medium">
                  / month
                </span>
              </div>

              {/* Select Plan Section */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-bold text-white block">
                  {tr("Select Plan", "Select Plan")}
                </Label>

                {/* Horizontal Plans Row */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {product.offers && product.offers.map((offer: any, idx: number) => {
                    const isSelected = selectedOffer?.id === offer.id;
                    const discount = getPlanDiscount(idx);

                    return (
                      <div
                        key={offer.id}
                        onClick={() => setSelectedOffer(offer)}
                        className={`relative rounded-xl p-3 text-center cursor-pointer transition-all min-w-[92px] shrink-0 ${
                          isSelected
                            ? 'bg-white text-slate-900 border-2 border-primary shadow-xl scale-105'
                            : 'bg-slate-900/80 border border-slate-700/80 text-white hover:border-slate-600'
                        }`}
                      >
                        {/* Discount Badge */}
                        {discount && (
                          <div className="absolute -top-2.5 right-1.5 rtl:right-auto rtl:left-1.5 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm">
                            {discount}
                          </div>
                        )}

                        {/* Plan Label */}
                        <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-slate-900' : 'text-slate-200'}`}>
                          {isRtl ? offer.label_ar : offer.label}
                        </div>

                        {/* Price */}
                        <div className={`text-sm font-black mt-1 ${isSelected ? 'text-indigo-600' : 'text-white'}`}>
                          ${Number(offer.price).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Email Activation Input (if product requires email) */}
              {product.requires_email && (
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs font-semibold text-slate-300">
                    {tr("البريد الإلكتروني المطلوب للتفعيل (Google / Gmail Email)", "Email Address for Activation")}
                  </Label>
                  <Input
                    type="email"
                    dir="ltr"
                    placeholder="user@example.com"
                    value={activationEmail}
                    onChange={(e) => setActivationEmail(e.target.value)}
                    className="h-10 bg-slate-900/90 border-slate-700 text-white placeholder:text-slate-500 rounded-xl text-xs"
                  />
                </div>
              )}

              {/* Buy Now Button matching screenshot */}
              <div className="pt-2">
                <Button
                  onClick={handleOpenCheckout}
                  className="w-full py-6 text-base font-extrabold rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                >
                  <span>{tr("Buy Now", "Buy Now")}</span>
                </Button>
              </div>

              {/* Trust Badges under Buy Now */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-300 font-semibold">{tr("Instant delivery", "Instant delivery")}</strong>
                    {" "}- {tr("via email & Google account", "via email & Google account")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-300 font-semibold">{tr("Secure payment", "Secure payment")}</strong>
                    {" "}- {tr("100% safe & encrypted", "100% safe & encrypted")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Product Description & What's Included (Clean White Container) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-sm mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Product Description & What's Included */}
            <div className="lg:col-span-8 space-y-8">
              {/* Product Description */}
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {tr("Product Description", "Product Description")}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  {isRtl ? (product.description_ar || product.description) : product.description}
                  {" "}
                  {tr(
                    "Google One AI Premium brings together the best of Google's AI tools and cloud services in one powerful subscription. Get access to Gemini, Flow, Veo, NotebookLM and more, plus 5TB of cloud storage for your files, photos, and emails.",
                    "Google One AI Premium brings together the best of Google's AI tools and cloud services in one powerful subscription. Get access to Gemini, Flow, Veo, NotebookLM and more, plus 5TB of cloud storage for your files, photos, and emails."
                  )}
                </p>
              </div>

              {/* What's included */}
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {tr("What's included:", "What's included:")}
                </h3>
                <div className="space-y-3">
                  {featuresList.map((feat: any, idx: number) => {
                    const text = typeof feat === 'string' ? feat : (isRtl ? feat.ar || feat.en : feat.en);
                    return (
                      <div key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Activation Info, Support & Storage Cards */}
            <div className="lg:col-span-4 space-y-4">
              {/* Activation Information Card */}
              <div className="rounded-2xl p-5 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                  <span>{tr("Activation Information", "Activation Information")}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                  {tr(
                    "You need to provide a valid email address during checkout for activation.",
                    "You need to provide a valid email address during checkout for activation."
                  )}
                </p>
              </div>

              {/* Support Card */}
              <div className="rounded-2xl p-5 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </div>
                  <span>{tr("Support", "Support")}</span>
                </div>
                <a
                  href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن خدمة: ${product.name}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold transition-colors"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3 w-3 fill-current" />
                  </div>
                  <span>{tr("Contact us via WhatsApp if you face any issue.", "Contact us via WhatsApp if you face any issue.")}</span>
                </a>
              </div>

              {/* Feature Highlight / Included Storage Mint Card */}
              <div className="rounded-2xl p-5 border border-emerald-200/70 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 space-y-1 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                  <Cloud className="h-4 w-4" />
                  <span>{tr("Included Storage", "Included Storage")}</span>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 pt-1">
                  5TB
                </div>
                <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-normal">
                  Gmail • Drive • Photos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout & Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-bold">
                {tr("تأكيد شراء الخدمة", "Confirm Service Purchase")}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {product.name} — {selectedOffer ? (isRtl ? selectedOffer.label_ar : selectedOffer.label) : ''}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Order Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{tr("المنتج", "Product")}</span>
                  <span className="font-semibold">{product.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{tr("الخطة المحددة", "Selected Plan")}</span>
                  <span className="font-semibold">{selectedOffer?.label}</span>
                </div>
                {product.requires_email && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{tr("البريد للتفعيل", "Activation Email")}</span>
                    <span className="font-semibold text-primary">{activationEmail}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center">
                  <span className="font-bold text-sm">{tr("المجموع المستحق", "Total Amount")}</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    ${selectedOffer ? Number(selectedOffer.price).toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold">{tr("اختر طريقة الدفع", "Select Payment Method")}</Label>
                
                {/* Method 1: Wallet */}
                <div
                  onClick={() => setSelectedPaymentMethod('wallet')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPaymentMethod === 'wallet'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{tr("رصيد المحفظة الداخلي", "Account Wallet Balance")}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {tr("الرصيد المتاح:", "Available:")} ${walletBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'wallet' && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* Method 2: PayPal */}
                <div
                  onClick={() => setSelectedPaymentMethod('paypal')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPaymentMethod === 'paypal'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{tr("PayPal / بطاقة بنكية", "PayPal / Credit Card")}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {tr("دفع فوري آمن ومباشر", "Instant and secure direct checkout")}
                      </span>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'paypal' && (
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {selectedPaymentMethod === 'wallet' ? (
                  <Button
                    onClick={handleWalletPayment}
                    disabled={isSubmitting || walletBalance < Number(selectedOffer?.price || 0)}
                    className="w-full py-5 text-sm font-bold rounded-xl gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>{tr("تأكيد الدفع من المحفظة", "Confirm Wallet Payment")}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3 pt-1">
                    {/* Official PayPal Buttons Container (renders PayPal + Debit/Credit Card) */}
                    <div id="paypal-buttons-container" className="min-h-[90px] w-full" />
                    
                    {!isPayPalSdkReady && (
                      <Button
                        onClick={handlePayPalDirectCheckout}
                        disabled={isSubmitting}
                        className="w-full py-5 text-sm font-bold rounded-xl gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white shadow-md"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span>{tr("الدفع المباشر بالبطاقة البنكية أو PayPal", "Pay with Debit / Credit Card or PayPal")}</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full text-xs text-muted-foreground"
                >
                  {tr("إلغاء", "Cancel")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
