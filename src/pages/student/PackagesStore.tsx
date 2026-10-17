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
  Info
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

      // Check if buy parameter was provided in URL e.g. ?buy=flow-150 or ?buy=2
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

  const handleOpenBuy = (pkg: any) => {
    if (isPackagePurchased(pkg.id)) {
      return toast.info(tr("أنت تمتلك هذه الباقة بالفعل ومفعلة في حسابك.", "You already own this package."));
    }
    setSelectedPackage(pkg);
    setPaymentMethod('wallet');
    setPaymentRef('');
    setIsBuyModalOpen(true);
  };

  // Each package is always purchased at its FULL price with no deductions
  const getPriceDisplay = (pkg: any) => {
    const isOwned = isPackagePurchased(pkg.id);
    return { 
      price: Number(pkg.price), 
      isCurrent: isOwned,
      isOwned
    };
  };

  const requiredPrice = selectedPackage ? Number(selectedPackage.price) : 0;
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
      const res = await packageService.purchaseOrUpgrade({
        packageId: selectedPackage.id,
        paymentMethod,
        paymentReference: paymentMethod === 'wallet' ? `WALLET-${Date.now()}` : paymentRef
      });
      toast.success(res.message || (tr("تم شراء وتفعيل الباقة بنجاح! جاري تحويلك للأكاديمية...", "Package activated successfully! Redirecting to Academy...")));
      setIsBuyModalOpen(false);
      loadData();
      setTimeout(() => {
        navigate('/student/academy');
      }, 1200);
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشلت معالجة الطلب", "Failed to process request")));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12">
        {/* Wallet Balance Card */}
        <div className="flex items-center justify-between p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                {t('packages.walletBalance')}
              </span>
              <span className="font-mono text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
                {isAlgeria 
                  ? `${convertToLocal(walletBalance).toLocaleString()} DZD` 
                  : isMorocco 
                    ? `${convertToLocal(walletBalance).toLocaleString()} MAD` 
                    : `$${walletBalance.toFixed(2)} USD`}
              </span>
            </div>
          </div>
        </div>

        {/* Packages Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const isOwned = isPackagePurchased(pkg.id);
              const price = Number(pkg.price);
              const isCore = pkg.level === 1 || pkg.slug.includes('core') || pkg.slug.includes('community');
              const isPopular = pkg.level === 2 || pkg.slug.includes('flow');
              const isGrow = pkg.level === 3 || pkg.slug.includes('grow');
              const isVIP = pkg.level === 4 || pkg.slug.includes('prime');

              return (
                <Card 
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-3xl transition-all duration-300 hover:shadow-xl ${
                    isVIP 
                      ? 'border-2 border-amber-400 dark:border-amber-500 shadow-amber-500/10' 
                      : isGrow
                      ? 'border-2 border-indigo-400 dark:border-indigo-500 shadow-indigo-500/10'
                      : isPopular 
                      ? 'border-2 border-primary shadow-primary/10' 
                      : 'border border-slate-200 dark:border-slate-800'
                  } bg-white dark:bg-slate-900`}
                >
                  {/* Badge */}
                  {pkg.badge_text && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                        isVIP 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' 
                          : isGrow
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                          : isPopular 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-800 text-white'
                      }`}>
                        {pkg.badge_text}
                      </span>
                    </div>
                  )}

                  <CardHeader className="pt-8 pb-4 text-center">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      {isRtl ? (pkg.name_ar || pkg.name) : (pkg.name || pkg.name_ar)}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      {isRtl ? (pkg.description_ar || pkg.description) : (pkg.description || pkg.description_ar)}
                    </CardDescription>

                    {isCore && (
                      <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 font-medium leading-relaxed">
                        {tr("📌 باقة اشتراك عضوية تتيح الفيديوهات التعريفية وتفعيل رابط الإحالة", "📌 Membership subscription with project overview videos & referral access")}
                      </div>
                    )}

                    <div className="mt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex flex-col items-center justify-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                            {isAlgeria || isMorocco ? convertToLocal(price).toLocaleString() : `$${price}`}
                          </span>
                          <span className="text-xs text-slate-400 font-bold">
                            {isAlgeria ? 'DZD' : isMorocco ? 'MAD' : 'USD'}
                          </span>
                        </div>
                        {isMorocco && (
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            ≈ {price} USDT
                          </p>
                        )}
                      </div>
                      {isOwned && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center justify-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{tr("مملوكة ومفعلة في حسابك", "Active & Owned")}</span>
                        </p>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 flex-1">
                    {/* Unlocked Generations Badge */}
                    <div className="p-2.5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-center">
                      <span className="text-[11px] font-black text-primary flex items-center justify-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        {Number(pkg.unlocked_generations) === 0 
                          ? (tr("أرباح الإحالة المباشرة فقط", "Direct referrals only"))
                          : Number(pkg.unlocked_generations) === 1 
                          ? (tr("يفتح أرباح الجيل 1", "Unlocks Gen 1 matching"))
                          : Number(pkg.unlocked_generations) === 2 
                          ? (tr("يفتح أرباح الجيل 1 والجيل 2", "Unlocks Gen 1 & 2 matching"))
                          : Number(pkg.unlocked_generations) === 3 
                          ? (tr("يفتح أرباح الأجيال 1 و 2 و 3", "Unlocks Gen 1, 2 & 3 matching"))
                          : Number(pkg.unlocked_generations) === 4 
                          ? (tr("يفتح أرباح الأجيال 1 و 2 و 3 و 4 كاملة", "Unlocks Gen 1, 2, 3 & 4 matching"))
                          : (tr(`يفتح أرباح حتى الجيل ${pkg.unlocked_generations}`, `Unlocks up to Gen ${pkg.unlocked_generations}`))}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold text-slate-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('packages.includedFeatures')}
                    </p>
                    <ul className="space-y-2.5">
                      {Array.isArray(pkg.features) && pkg.features.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                          <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 pb-6">
                    {isOwned ? (
                      <Button disabled className="w-full rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="h-4 w-4 mr-1.5 rtl:ml-1.5" />
                        {tr("مملوكة ومفعلة", "Active & Owned")}
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleOpenBuy(pkg)}
                        className={`w-full rounded-2xl font-black gap-2 h-11 ${
                          isVIP 
                            ? 'bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20' 
                            : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20'
                        }`}
                      >
                        {tr("شراء الباقة الآن", "Buy Package Now")}
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* 3-Stage Academy Transformation Journey */}
        <div className="space-y-6 pt-4">
          <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{tr("الفكرة التسويقية للأكاديمية", "Academy Marketing Journey")}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {tr("رحلة التحول الرقمي بالأكاديمية (3 مراحل متكاملة)", "Academy Digital Transformation Journey")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tr("مسار تدرجي واضح ينقلك من: صاحب مشروع ← خبير أتمتة AI ← رائد أعمال تقني (AI Builder)", "A progressive path taking you from Project Owner → AI Automation Expert → Tech Builder")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stage 1 */}
            <Card className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-white to-transparent dark:via-slate-900 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    🟢 {tr("المرحلة 1 — أنشئ", "Stage 1 — Build")}
                  </span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 font-bold">
                    FLOW $150
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                    <span>{tr("اصنع مشروعك — E-COMMERCE", "Create Your E-Commerce")}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {tr("تعلم كيف تنشئ وتطلق مشروع تجارة إلكترونية متكامل بالاعتماد على الذكاء الاصطناعي (المتجر، الهوية، المحتوى، واختبار الحملات).", "Build and launch a complete e-commerce brand powered by AI.")}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{tr("النتيجة: إطلاق مشروع تجاري وإدارته بالذكاء الاصطناعي", "Outcome: Launch & manage your AI-driven store")}</span>
              </div>
            </Card>

            {/* Stage 2 */}
            <Card className="rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-white to-transparent dark:via-slate-900 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400">
                    🔵 {tr("المرحلة 2 — أتمت", "Stage 2 — Automate")}
                  </span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-600 font-bold">
                    GROW $500
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    <span>{tr("أتمت مشروعك — AI AUTOMATION", "Automate with AI")}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {tr("تعلم كيف تجعل الذكاء الاصطناعي يعمل من أجلك من خلال بناء الوكلاء (AI Agents) وWorkflows الأتمتة لربط الأدوات والتوسع.", "Make AI work for you with AI Agents and automated workflows.")}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-blue-500/20 text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{tr("النتيجة: بناء أنظمة وأتمتة ووكلاء أذكياء للمشروع", "Outcome: Build smart AI agents & autonomous workflows")}</span>
              </div>
            </Card>

            {/* Stage 3 */}
            <Card className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-white to-transparent dark:via-slate-900 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    🟣 {tr("المرحلة 3 — ابنِ", "Stage 3 — Build Tech")}
                  </span>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-600 font-bold">
                    PRIME $1000
                  </Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-600" />
                    <span>{tr("ابنِ مشروعك التقني — AI BUILDER", "AI Builder & SaaS")}</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {tr("تعلم البرمجة المتقدمة وبناء المواقع والتطبيقات والـ SaaS من الفكرة حتى تحقيق الدخل + جلستان شهرياً لمرافقة مشروعك.", "Build web apps, dashboards & SaaS with AI + 1-on-1 monthly mentorship.")}
                  </p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-purple-500/20 text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{tr("النتيجة: رائد أعمال تقني يمتلك SaaS ومنتجات رقمية", "Outcome: Tech entrepreneur with active SaaS & apps")}</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <span>{tr("جدول مقارنة مميزات ومستويات الباقات", "Complete Packages Feature Comparison")}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 mt-1">
                  {tr("جدول تفصيلي يوضح الصلاحيات المتاحة في كل باقة ومستوى تعليمي بالأكاديمية", "Detailed overview of capabilities across each academy tier")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {tr("المميزات والمحاور", "Features & Curriculum")}
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-emerald-600 font-black">🟢 FLOW $150</span>
                      <span className="text-[10px] text-slate-400 font-normal">{tr("المستوى 1", "Level 1")}</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-blue-600 font-black">🔵 GROW $500</span>
                      <span className="text-[10px] text-slate-400 font-normal">{tr("المستوى 2", "Level 2")}</span>
                    </div>
                  </th>
                  <th className="p-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-purple-600 font-black">🟣 PRIME $1000</span>
                      <span className="text-[10px] text-slate-400 font-normal">{tr("المستوى 3 (VIP)", "Level 3 (VIP)")}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { name: tr("التجارة الإلكترونية والبيزنس الرقمي", "E-Commerce & Digital Business"), flow: true, grow: true, prime: true },
                  { name: tr("إنشاء العلامة التجارية والهوية البصرية", "Brand Creation & Visual Identity"), flow: true, grow: true, prime: true },
                  { name: tr("إنشاء المحتوى وUGC بالذكاء الاصطناعي", "Content & AI UGC Creation"), flow: true, grow: true, prime: true },
                  { name: tr("البحث عن المنتجات الرابحة (Product Research)", "Winning Product Research"), flow: true, grow: true, prime: true },
                  { name: tr("إعلانات Meta Ads (Facebook & Instagram)", "Meta Ads (Facebook & Instagram)"), flow: true, grow: true, prime: true },
                  { name: tr("إعلانات TikTok Ads الاحترافية", "Professional TikTok Ads"), flow: true, grow: true, prime: true },
                  { name: tr("إعلانات Snapchat Ads", "Snapchat Ads"), flow: true, grow: true, prime: true },
                  { name: tr("إنشاء وكلاء الذكاء الاصطناعي (AI Agents)", "AI Agents Creation"), flow: false, grow: true, prime: true },
                  { name: tr("إنشاء أنظمة وسير العمل الذكي (AI Workflows)", "Smart AI Workflows"), flow: false, grow: true, prime: true },
                  { name: tr("الأتمتة الشاملة بالذكاء الاصطناعي", "Comprehensive AI Automation"), flow: false, grow: true, prime: true },
                  { name: tr("البرمجة والتطوير بمساعدة الذكاء الاصطناعي", "AI-Assisted Coding & Dev"), flow: false, grow: true, prime: true },
                  { name: tr("إنشاء مشاريع وتطبيقات SaaS باستخدام AI", "Building SaaS Apps with AI"), flow: false, grow: true, prime: true },
                  { name: tr("تدريب ChatGPT المتقدم", "Advanced ChatGPT Training"), flow: 'partial', grow: true, prime: true },
                  { name: tr("أدوات Codex المتقدمة", "Advanced Codex Tools"), flow: false, grow: 'partial', prime: true },
                  { name: 'Google AI Studio', flow: false, grow: 'partial', prime: true },
                  { name: tr("منصة Antigravity لبناء الأنظمة", "Antigravity Platform for Systems"), flow: false, grow: 'partial', prime: true },
                  { name: tr("VS Code + أدوات الذكاء الاصطناعي", "VS Code + AI Tools"), flow: false, grow: 'partial', prime: true },
                  { name: tr("جلسات مرافقة واستشارات شخصية (جلستان شهرياً)", "1-on-1 Mentorship (2 sessions/month)"), flow: false, grow: false, prime: true },
                  { name: tr("جميع التحديثات الدورية وورش العمل", "All Regular Updates & Workshops"), flow: false, grow: false, prime: true },
                  { name: tr("الوصول الكامل وغير المحدود لجميع الدورات (Premium)", "Unlimited Full Access to All Courses (Premium)"), flow: false, grow: false, prime: true },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className={`p-3.5 font-bold text-slate-800 dark:text-slate-200 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {row.name}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.flow === true ? (
                        <div className="h-6 w-6 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">✓</div>
                      ) : row.flow === 'partial' ? (
                        <span className="text-slate-400 font-bold">⚪</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-bold">✕</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.grow === true ? (
                        <div className="h-6 w-6 mx-auto rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">✓</div>
                      ) : row.grow === 'partial' ? (
                        <span className="text-amber-500 font-bold">⚪</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-bold">✕</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {row.prime === true ? (
                        <div className="h-6 w-6 mx-auto rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">✓</div>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 font-bold">✕</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Purchase Confirmation Modal */}
        <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <DialogTitle className="text-xl font-bold">
                {t('packages.confirmModalTitleBuy', tr("تأكيد شراء الباقة", "Confirm Package Purchase"))}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isRtl ? (selectedPackage?.name_ar || selectedPackage?.name) : (selectedPackage?.name || selectedPackage?.name_ar)}{' '}
                - <span className="font-bold text-slate-900 dark:text-white">{formatDualPrice(requiredPrice)}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {t('wallet.paymentMethod')}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'wallet', label: t('packages.walletPaymentMethod'), icon: Wallet, highlight: true },
                    ...(isAlgeria ? [{ id: 'baridimob', label: 'BaridiMob / CCP', icon: Building2 }] : []),
                    ...(!isAlgeria && usdtEnabled ? [{ id: 'usdt', label: 'USDT TRC-20', icon: Coins }] : []),
                    { id: 'bank_transfer', label: isRtl ? (isMorocco ? 'تحويل بنكي محلي (CIH / Attijari)' : 'تحويل بنكي / RIB') : 'Bank Transfer / RIB', icon: Building2 },
                    ...(!isAlgeria ? [{ id: 'paypal', label: 'PayPal', icon: CreditCard }] : []),
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-bold transition-all ${isRtl ? 'text-right' : 'text-left'} ${
                          paymentMethod === method.id
                            ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Payment Status Banner */}
              {paymentMethod === 'wallet' && (
                <div className={`p-4 rounded-2xl border transition-all ${
                  canPayWithWallet
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-start gap-2.5">
                    {canPayWithWallet ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 text-xs">
                      <div className="font-black text-sm flex items-center gap-2">
                        <span>{t('wallet.availableBalance')}:</span>
                        <span className="font-mono text-base">{formatPrice(walletBalance)}</span>
                      </div>
                      {canPayWithWallet ? (
                        <p className="text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300">
                          {t('packages.sufficientBalance')}
                        </p>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                            {t('packages.insufficientBalance')} {t('packages.insufficientDiff')}: <strong>{formatPrice(requiredPrice - walletBalance)}</strong>.
                          </p>
                          <Link to="/student/wallet">
                            <Button size="sm" className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1 mt-1">
                              <PlusCircle className="h-3.5 w-3.5" />
                              {t('packages.depositNowBtn')}
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* External Payment Reference (only if not wallet) */}
              {paymentMethod !== 'wallet' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('wallet.reference')}
                  </Label>
                  <Input
                    placeholder="REF-987412 / TxID"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="rounded-2xl text-xs h-10"
                  />
                </div>
              )}

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {tr("أمان وضمان تفعيل الحساب", "Secure Instant Activation")}
                </div>
                <p className="text-[11px]">
                  {t('packages.instantActivationGuarantee')}
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-2xl">
                {t('wallet.cancel')}
              </Button>
              <Button 
                onClick={handleConfirmPurchase} 
                disabled={submitting || (paymentMethod === 'wallet' && !canPayWithWallet)} 
                className={`rounded-2xl font-black px-6 ${
                  paymentMethod === 'wallet' && canPayWithWallet 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20' 
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : paymentMethod === 'wallet' ? (
                  t('packages.confirmPayWallet', tr("تأكيد الدفع من المحفظة", "Confirm Wallet Payment"))
                ) : (
                  t('packages.confirmPayExternal', tr("تأكيد طلب التفعيل", "Confirm Activation Request"))
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
