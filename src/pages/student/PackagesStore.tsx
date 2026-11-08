import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { packageService, affiliateService } from '@/services/apiService';
import { 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Building2, 
  Loader2, 
  ArrowUpRight,
  Wallet,
  Coins,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  X,
  Minus,
  Bot,
  ShoppingCart,
  Rocket,
  Layers,
  Info,
  Clock,
  Flame,
  ArrowUpCircle,
  Tag
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCountryPaymentMethods, isBankMethod, isCryptoMethod } from '@/hooks/useCountryPaymentMethods';

export default function PackagesStore() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRtl = i18n.language === 'ar';
  const { isAlgeria, isMorocco, usdtEnabled, currencyCode, currencySymbol, convertToLocal, formatPrice, formatDualPrice } = useCurrency();
  const [packages, setPackages] = useState<any[]>([]);
  const [myPackage, setMyPackage] = useState<any>(null);
  const [purchasedPackages, setPurchasedPackages] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentRef, setPaymentRef] = useState('');
  
  // Real-time clock for promo countdown
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Methods come from the admin "Country Currency" rules of the member's country (no hardcoded list)
  const { methods: countryMethods, loading: methodsLoading } = useCountryPaymentMethods('deposit');
  const selectedCountryMethod = countryMethods.find((m) => m.id === paymentMethod);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pkgsRes, myPkgRes, walletRes] = await Promise.all([
        packageService.getAll(),
        packageService.getMyPackage().catch(() => ({ currentPackage: null, purchasedPackages: [], availablePackages: [] })),
        affiliateService.getWallet().catch(() => ({ wallet: { balance: 0 } }))
      ]);
      const fetchedPkgs = pkgsRes.packages || [];
      setPackages(fetchedPkgs);
      setMyPackage(myPkgRes?.currentPackage || myPkgRes?.highestPackage || null);
      setPurchasedPackages(myPkgRes?.purchasedPackages || []);
      setWalletBalance(Number(walletRes?.wallet?.balance || 0));

      // Check if buy parameter was provided in URL e.g. ?buy=flow-150 or ?buy=ai-plus
      const buyParam = searchParams.get('buy') || searchParams.get('package');
      if (buyParam) {
        const target = fetchedPkgs.find((p: any) => 
          p.slug === buyParam || 
          p.id === buyParam || 
          String(p.level) === buyParam ||
          p.slug.includes(buyParam)
        );
        if (target) {
          handleOpenBuy(target);
        }
      }
    } catch (err: any) {
      toast.error(tr("فشل تحميل الباقات", "Failed to load packages"));
    } finally {
      setLoading(false);
    }
  };

  const isPackagePurchased = (pkgId: string) => {
    return purchasedPackages.some((p: any) => p.package_id === pkgId && p.status === 'active');
  };

  // User holds active FLOW package
  const userHasFlow = Boolean(
    myPackage && (
      myPackage.slug?.includes('flow') ||
      Number(myPackage.level) === 2 ||
      myPackage.package_name?.toUpperCase().includes('FLOW')
    )
  );
  const flowPaidAmount = userHasFlow ? Number(myPackage.amount_paid || myPackage.package_original_price || 150) : 0;

  const handleOpenBuy = (pkg: any) => {
    if (isPackagePurchased(pkg.id)) {
      return toast.info(tr("أنت تمتلك هذه الباقة بالفعل ومفعلة في حسابك.", "You already own this package."));
    }
    setSelectedPackage(pkg);
    setPaymentMethod('wallet');
    setPaymentRef('');
    setIsBuyModalOpen(true);
  };

  // Promo countdown helper
  const getPromoCountdown = (endStr: string | null | undefined) => {
    if (!endStr) return null;
    const diff = new Date(endStr).getTime() - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds, diff };
  };

  // Pricing calculations for selected package
  const isSelectedUpgrade = Boolean(
    userHasFlow && 
    selectedPackage && 
    !isPackagePurchased(selectedPackage.id) &&
    Number(selectedPackage.level) > 2
  );

  const isPromoCurrentlyActive = Boolean(
    selectedPackage && (
      selectedPackage.has_active_promo || 
      (selectedPackage.is_promo_active && selectedPackage.promo_price && (!selectedPackage.promo_end_at || new Date(selectedPackage.promo_end_at).getTime() > now))
    )
  );

  const targetFullPrice = selectedPackage ? Number(selectedPackage.price) : 0;
  const targetEffectivePrice = selectedPackage 
    ? (isPromoCurrentlyActive ? Number(selectedPackage.promo_price || selectedPackage.effective_price) : targetFullPrice)
    : 0;

  const requiredPrice = isSelectedUpgrade
    ? Math.max(0, Number((targetEffectivePrice - flowPaidAmount).toFixed(2)))
    : targetEffectivePrice;

  const canPayWithWallet = walletBalance >= requiredPrice;

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    if (isPackagePurchased(selectedPackage.id)) {
      return toast.error(tr("أنت تمتلك هذه الباقة بالفعل ومفعلة في حسابك.", "You already own this package."));
    }

    if (paymentMethod === 'wallet' && !canPayWithWallet) {
      return toast.error(tr("رصيد المحفظة غير كافٍ لإتمام عملية الشراء", "Insufficient wallet balance for this purchase"));
    }

    try {
      setSubmitting(true);
      if (paymentMethod !== 'wallet' && !selectedCountryMethod) {
        return toast.error(tr("يرجى اختيار وسيلة دفع متاحة في بلدك", "Please choose a payment method available in your country"));
      }

      const res = await packageService.purchaseOrUpgrade({
        packageId: selectedPackage.id,
        isUpgrade: isSelectedUpgrade,
        paymentMethod: paymentMethod === 'wallet'
          ? 'wallet'
          : (isCryptoMethod(selectedCountryMethod) ? 'nowpayments_crypto' : (selectedCountryMethod?.type || 'bank_transfer')),
        paymentMethodId: paymentMethod === 'wallet' ? undefined : selectedCountryMethod?.id,
        paymentReference: paymentMethod === 'wallet' ? `WALLET-${Date.now()}` : paymentRef
      });

      if (res.requiresAdminReview) {
        toast.info(res.message);
      } else {
        toast.success(res.message || (tr("تم تفعيل الباقة بنجاح!", "Package activated successfully!")));
      }

      setIsBuyModalOpen(false);
      loadData();
      if (!res.requiresAdminReview && paymentMethod === 'wallet') {
        setTimeout(() => {
          navigate('/student/academy');
        }, 1200);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشلت معالجة الطلب", "Failed to process request")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Wallet Balance & Current Subscription Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                {t('packages.walletBalance', 'رصيدك المتاح في المحفظة')}
              </span>
              <span className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                {isAlgeria 
                  ? `${convertToLocal(walletBalance).toLocaleString()} DZD` 
                  : isMorocco 
                    ? `${convertToLocal(walletBalance).toLocaleString()} MAD` 
                    : `$${walletBalance.toFixed(2)} USD`}
              </span>
            </div>
          </div>

          {myPackage && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  {tr("باقتك الحالية:", "Your Current Package:")}
                </span>
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  {myPackage.package_name_ar || myPackage.package_name} (Level {myPackage.level})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ==================== PACKAGES CARDS GRID ==================== */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
            {packages.map((pkg) => {
              const isOwned = isPackagePurchased(pkg.id);
              const isAiPackage = pkg.slug?.includes('ai') || pkg.name?.includes('AI');
              const isFlowPackage = pkg.slug?.includes('flow') || pkg.level === 2;
              const isGrowPackage = pkg.slug?.includes('grow') || pkg.level === 4;
              const isPrimePackage = pkg.slug?.includes('prime') || pkg.level === 5;
              const isCorePackage = pkg.slug?.includes('community') || pkg.level === 1;

              const promoCountdown = getPromoCountdown(pkg.promo_end_at);
              const hasActivePromo = Boolean(pkg.is_promo_active && pkg.promo_price && (!pkg.promo_end_at || promoCountdown));

              const regularPrice = Number(pkg.price);
              const effectivePrice = hasActivePromo ? Number(pkg.promo_price) : regularPrice;

              // Upgrade eligibility: STRICTLY for FLOW owners moving up
              const canUpgradeThisPackage = Boolean(userHasFlow && !isOwned && Number(pkg.level) > 2);
              const upgradeDiff = canUpgradeThisPackage ? Math.max(0, Number((effectivePrice - flowPaidAmount).toFixed(2))) : 0;

              return (
                <Card 
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 hover:shadow-2xl ${
                    isAiPackage 
                      ? 'border-2 border-indigo-500 dark:border-indigo-500 shadow-indigo-500/15 shadow-xl ring-2 ring-indigo-500/20 bg-gradient-to-b from-indigo-50/40 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20' 
                      : isPrimePackage
                      ? 'border-2 border-amber-400 dark:border-amber-500 shadow-amber-500/10 bg-white dark:bg-slate-900'
                      : isGrowPackage
                      ? 'border-2 border-purple-400 dark:border-purple-500 shadow-purple-500/10 bg-white dark:bg-slate-900'
                      : isFlowPackage 
                      ? 'border-2 border-emerald-500 shadow-emerald-500/10 bg-white dark:bg-slate-900' 
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {/* Top Badge */}
                  {(pkg.badge_text || hasActivePromo || isAiPackage) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                      <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1 ${
                        isAiPackage
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white animate-pulse'
                          : hasActivePromo
                          ? 'bg-rose-600 text-white'
                          : isPrimePackage 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' 
                          : isGrowPackage
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                          : isFlowPackage 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white' 
                          : 'bg-slate-800 text-white'
                      }`}>
                        {isAiPackage ? <Bot className="h-3 w-3" /> : hasActivePromo ? <Flame className="h-3 w-3 fill-white" /> : <Sparkles className="h-3 w-3" />}
                        {pkg.badge_text || (isAiPackage ? 'AI PLUS 🔥' : tr('عرض محدود', 'Special Offer'))}
                      </span>
                    </div>
                  )}

                  <CardHeader className="pt-8 pb-3 text-center">
                    <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                      {isAiPackage && <Bot className="h-5 w-5 text-indigo-600" />}
                      <span>{isRtl ? (pkg.name_ar || pkg.name) : (pkg.name || pkg.name_ar)}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {isRtl ? (pkg.description_ar || pkg.description) : (pkg.description || pkg.description_ar)}
                    </CardDescription>

                    {/* Price Section */}
                    <div className="mt-4 pt-3 pb-3 border-t border-b border-slate-100 dark:border-slate-800">
                      {hasActivePromo ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm font-mono text-slate-400 line-through font-bold">
                              ${regularPrice}
                            </span>
                            <Badge className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0">
                              {tr("وفر", "SAVE")} ${regularPrice - effectivePrice}
                            </Badge>
                          </div>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400 font-mono">
                              ${effectivePrice}
                            </span>
                            <span className="text-xs text-slate-400 font-bold">USD</span>
                          </div>

                          {/* Countdown Timer */}
                          {promoCountdown && (
                            <div className="mt-2 p-2 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-center">
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block mb-0.5 flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3 text-amber-600 animate-spin" />
                                {tr("ينتهي العرض الترويجي خلال:", "Promo ends in:")}
                              </span>
                              <div className="flex items-center justify-center gap-1 font-mono text-xs font-black text-amber-900 dark:text-amber-100">
                                <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                                  {promoCountdown.days}d
                                </span>
                                <span>:</span>
                                <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                                  {promoCountdown.hours}h
                                </span>
                                <span>:</span>
                                <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                                  {promoCountdown.minutes}m
                                </span>
                                <span>:</span>
                                <span className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-amber-200 shadow-2xs text-rose-600">
                                  {promoCountdown.seconds}s
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono">
                            ${regularPrice}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">USD</span>
                        </div>
                      )}

                      {/* Upgrade Banner for FLOW subscribers */}
                      {canUpgradeThisPackage && (
                        <div className="mt-2.5 p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center">
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">
                            {tr("✨ ترقية خاصة لأصحاب باقة FLOW", "✨ Special Upgrade for FLOW Members")}
                          </span>
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-200">
                            {tr("ادفع فرق السعر فقط:", "Pay Difference Only:")} <strong className="text-sm font-mono text-emerald-600 underline">${upgradeDiff}</strong>
                          </span>
                        </div>
                      )}

                      {isOwned && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{tr("باقتك الحالية مفعلة", "Active Owned Package")}</span>
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {/* Unlocked Generations Badge */}
                    <div className="p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-center">
                      <span className="text-[11px] font-black text-primary flex items-center justify-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {Number(pkg.unlocked_generations) === 0 
                          ? (tr("أرباح الإحالة المباشرة فقط", "Direct referrals only"))
                          : (tr(`أرباح تسويق بالعمولة: ${pkg.unlocked_generations} أجيال`, `Affiliate Commissions: ${pkg.unlocked_generations} Gens`))}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('packages.includedFeatures', 'المميزات والمحتويات:')}
                    </p>
                    <ul className="space-y-2">
                      {Array.isArray(pkg.features) && pkg.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-3 pb-6">
                    {isOwned ? (
                      <Button disabled className="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-4 w-4 mr-1.5 rtl:ml-1.5" />
                        {tr("مملوكة ومفعلة", "Active & Owned")}
                      </Button>
                    ) : canUpgradeThisPackage ? (
                      <Button 
                        onClick={() => handleOpenBuy(pkg)}
                        className="w-full rounded-2xl font-black gap-2 h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 text-xs sm:text-sm"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        <span>{tr(`ترقية إلى ${pkg.name} (${upgradeDiff}$)`, `Upgrade to ${pkg.name} ($${upgradeDiff})`)}</span>
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleOpenBuy(pkg)}
                        className={`w-full rounded-2xl font-black gap-2 h-11 text-xs sm:text-sm ${
                          isAiPackage
                            ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white shadow-lg shadow-indigo-500/25'
                            : isPrimePackage 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20' 
                            : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                        }`}
                      >
                        <span>{tr(`شراء الباقة (${effectivePrice}$)`, `Buy Package ($${effectivePrice})`)}</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* ==================== 3-STAGE TRANSFORMATION JOURNEY ==================== */}
        <div className="space-y-6 pt-4">
          <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{tr("منظومة الأكاديمية المتكاملة", "Academy Integrated Journey")}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {tr("مسار التحول الرقمي والذكاء الاصطناعي بالأكاديمية", "Academy Digital & AI Transformation Journey")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tr("تدرج احترافي ينقلك من التجارة الإلكترونية، إلى بناء وكلاء الذكاء الاصطناعي، وصولاً للبرمجة المتقدمة وإطلاق الـ SaaS.", "Progressive tiers from e-commerce to AI agents and full SaaS construction.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stage 1: FLOW */}
            <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-white to-transparent dark:via-slate-900 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600">
                    🟢 {tr("المستوى 1: FLOW", "Tier 1: FLOW")}
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-bold text-xs">$150</Badge>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <span>{tr("التجارة وصناعة المحتوى", "E-Commerce & Branding")}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tr("إنشاء متجر إلكتروني، هوية بصرية، وفيديوهات UGC بالذكاء الاصطناعي وإدارة الحملات الإعلانية.", "AI e-commerce, UGC content, branding, and ads management.")}
                </p>
              </div>
            </Card>

            {/* Stage 2: AI PLUS */}
            <Card className="rounded-3xl border-2 border-indigo-500 shadow-indigo-500/20 shadow-md bg-gradient-to-br from-indigo-500/10 via-white to-purple-500/10 dark:via-slate-900 p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    ⚡ {tr("المستوى 2: AI PLUS", "Tier 2: AI PLUS")}
                  </span>
                  <Badge className="bg-rose-500 text-white font-bold text-xs">$200 {tr("عرض", "Promo")}</Badge>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-600" />
                  <span>{tr("وكلاء الذكاء الاصطناعي", "AI Agent Ecosystem")}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tr("وكيل ذكاء اصطناعي شخصي، رخصة إنشاء وبيع الوكلاء، ودورة تكوينية شاملة من الصفر حتى البيع.", "Personal AI agent, agent creation and selling license, and complete course.")}
                </p>
              </div>
            </Card>

            {/* Stage 3: GROW */}
            <Card className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-white to-transparent dark:via-slate-900 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-500/15 text-purple-600">
                    🔵 {tr("المستوى 3: GROW", "Tier 3: GROW")}
                  </span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-600 font-bold text-xs">$500</Badge>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-600" />
                  <span>{tr("الأتمتة المتقدمة Workflows", "AI Automation Workflows")}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tr("أنظمة الأتمتة الذكية لربط المنصات ومشاريع الـ SaaS والبرمجة بمساعدة الذكاء الاصطناعي.", "Smart autonomous workflows and automation ecosystems.")}
                </p>
              </div>
            </Card>

            {/* Stage 4: PRIME */}
            <Card className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-white to-transparent dark:via-slate-900 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/15 text-amber-600">
                    🟣 {tr("المستوى 4: PRIME", "Tier 4: PRIME")}
                  </span>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-600 font-bold text-xs">$1,000</Badge>
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-amber-600" />
                  <span>{tr("بناء الـ SaaS والمرافقة", "SaaS Builder & Mentorship")}</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {tr("البرمجة المتقدمة للأنظمة المتكاملة + مرافقة واستشارات شخصية شهرية لتوجيه مشروعك.", "Advanced software development + 1-on-1 monthly personal mentorship.")}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* ==================== CHECKOUT / UPGRADE MODAL ==================== */}
        <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl max-h-[92vh] flex flex-col p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                {isSelectedUpgrade ? (
                  <>
                    <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
                    <span>{tr("ترقية الاشتراك إلى:", "Upgrade Subscription to:")} {isRtl ? (selectedPackage?.name_ar || selectedPackage?.name) : (selectedPackage?.name || selectedPackage?.name_ar)}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 text-indigo-600" />
                    <span>{tr("شراء وتفعيل الباقة:", "Purchase Package:")} {isRtl ? (selectedPackage?.name_ar || selectedPackage?.name) : (selectedPackage?.name || selectedPackage?.name_ar)}</span>
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isSelectedUpgrade 
                  ? tr("نظام ترقية تلقائي: تدفع فقط فرق السعر بين باقتك الحالية (FLOW) والباقة الجديدة.", "Automatic Upgrade: Pay only the price difference between FLOW and the target package.")
                  : tr("اختر وسيلة الدفع لتفعيل باقتك فورياً في الأكاديمية.", "Select your payment method for instant activation.")}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto space-y-4 py-2 flex-1 pr-1 pl-1">
              {/* Itemized Price Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {tr("سعر الباقة المستهدفة:", "Target Package Price:")}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    {isPromoCurrentlyActive && (
                      <span className="line-through text-slate-400 text-[11px]">${targetFullPrice}</span>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white">${targetEffectivePrice} USD</span>
                  </div>
                </div>

                {isSelectedUpgrade && (
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      {tr("مخصوم مدفوعاتك السابقة (باقة FLOW):", "Deducted Previous Payment (FLOW):")}
                    </span>
                    <span className="font-mono font-bold">-${flowPaidAmount} USD</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {tr("المبلغ الصافي المطلوب للدفع:", "Net Total to Pay:")}
                  </span>
                  <div className="text-right">
                    <span className="font-mono text-xl font-black text-indigo-600 dark:text-indigo-400">
                      ${requiredPrice} USD
                    </span>
                    {(isAlgeria || isMorocco) && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        ≈ {convertToLocal(requiredPrice).toLocaleString()} {isAlgeria ? 'DZD' : 'MAD'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Methods Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t('wallet.paymentMethod', 'اختر وسيلة الدفع:')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'wallet', label: t('packages.walletPaymentMethod', 'رصيد المحفظة'), icon: Wallet },
                    ...countryMethods.map((m) => ({
                      id: m.id,
                      label: isRtl ? (m.name_ar || m.name) : (m.name || m.name_ar || ''),
                      icon: isCryptoMethod(m) ? Coins : isBankMethod(m) ? Building2 : CreditCard,
                    })),
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${isRtl ? 'text-right' : 'text-left'} ${
                          paymentMethod === method.id
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-600'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Payment Status Banner */}
              {paymentMethod === 'wallet' && (
                <div className={`p-3.5 rounded-2xl border transition-all ${
                  canPayWithWallet
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {canPayWithWallet ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="font-black flex items-center gap-2">
                        <span>{t('wallet.availableBalance', 'رصيدك المتاح:')}</span>
                        <span className="font-mono text-sm">${walletBalance.toFixed(2)} USD</span>
                      </div>
                      {canPayWithWallet ? (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {tr("رصيدك كافٍ لتأكيد العملية وتفعيل الباقة فورياً!", "Balance is sufficient for instant activation!")}
                        </p>
                      ) : (
                        <div className="space-y-1.5 pt-0.5">
                          <p className="text-[11px] text-rose-700 dark:text-rose-300">
                            {tr("الرصيد غير كافٍ. المبلغ المتبقي للشحن:", "Insufficient balance. Required deposit:")} <strong>${(requiredPrice - walletBalance).toFixed(2)} USD</strong>
                          </p>
                          <Link to="/student/wallet">
                            <Button size="sm" className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1 mt-1">
                              <PlusCircle className="h-3 w-3" />
                              {tr("شحن المحفظة الآن", "Deposit Now")}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Details */}
              {selectedCountryMethod && isBankMethod(selectedCountryMethod) && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs space-y-1">
                  {selectedCountryMethod.bank_name && (
                    <div>{tr("البنك:", "Bank:")} <span className="font-bold">{selectedCountryMethod.bank_name}</span></div>
                  )}
                  {selectedCountryMethod.account_holder && (
                    <div>{tr("اسم المستفيد:", "Account Holder:")} <span className="font-bold">{selectedCountryMethod.account_holder}</span></div>
                  )}
                  {(selectedCountryMethod.account_number || selectedCountryMethod.iban) && (
                    <div>{tr("رقم الحساب / RIP:", "Account / RIB:")} <span className="font-mono font-bold select-all">{selectedCountryMethod.account_number || selectedCountryMethod.iban}</span></div>
                  )}
                  {selectedCountryMethod.swift_code && (
                    <div>SWIFT / BIC: <span className="font-mono font-bold">{selectedCountryMethod.swift_code}</span></div>
                  )}
                </div>
              )}

              {/* External Payment Reference */}
              {paymentMethod !== 'wallet' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {tr("رقم وصل التحويل / مرجع المعاملة *", "Transaction Reference / Receipt ID *")}
                  </Label>
                  <Input
                    placeholder="e.g. REF-123456"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
              <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-2xl text-xs">
                {t('wallet.cancel', 'إلغاء')}
              </Button>
              <Button 
                onClick={handleConfirmPurchase} 
                disabled={submitting || (paymentMethod === 'wallet' && !canPayWithWallet)} 
                className={`rounded-2xl font-black px-6 text-xs ${
                  paymentMethod === 'wallet' && canPayWithWallet 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSelectedUpgrade ? (
                  tr(`تأكيد دفع فرق الترقية ($${requiredPrice})`, `Confirm Upgrade ($${requiredPrice})`)
                ) : (
                  tr(`تأكيد الدفع ($${requiredPrice})`, `Confirm Payment ($${requiredPrice})`)
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
