import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { packageService } from '@/services/apiService';
import { 
  Package, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  Loader2,
  BookOpen,
  History,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Layers,
  ShoppingBag,
  Coins,
  Users,
  TrendingUp,
  Gem,
  Lock,
  Unlock,
  ArrowUpRight,
  Zap,
  Share2
} from 'lucide-react';
import { toast } from "sonner";
import { useCurrency } from '@/contexts/CurrencyContext';

export default function MyPackage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const { formatPrice } = useCurrency();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'upgrades'>('overview');

  useEffect(() => {
    loadPackage();
  }, []);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const res = await packageService.getMyPackage();
      setData(res);
    } catch (err) {
      toast.error(tr('فشل تحميل بيانات الباقة', 'Failed to load package'));
    } finally {
      setLoading(false);
    }
  };

  const highestPackage = data?.highestPackage || data?.currentPackage;
  const purchasedPackages: any[] = data?.purchasedPackages || [];
  const availablePackages: any[] = data?.availablePackages || [];
  const unpurchasedPackages = availablePackages.filter(p => !p.isPurchased && Number(p.price) > 30);

  const formatMethodName = (method: string) => {
    if (!method) return tr('غير محدد', 'Not specified');
    const m = method.toLowerCase();
    if (m.includes('wallet')) return tr('المحفظة الإلكترونية', 'Wallet');
    if (m.includes('nowpayments') || m.includes('usdt') || m.includes('crypto')) return 'USDT (BEP20)';
    if (m.includes('bank') || m.includes('transfer')) return tr('تحويل بنكي', 'Bank Transfer');
    if (m.includes('baridimob') || m.includes('ccp')) return 'BaridiMob / CCP';
    return method;
  };

  const getUnlockedGensText = (gens: any) => {
    const num = Number(gens);
    if (num === 0) return tr('أرباح مباشرة فقط', 'Direct only');
    if (num === 1) return tr('الجيل 1', 'Gen 1');
    if (num === 2) return tr('الجيل 1 والجيل 2', 'Gen 1 & 2');
    if (num === 3) return tr('الأجيال 1 و 2 و 3', 'Gen 1, 2 & 3');
    if (num === 4) return tr('الأجيال 1 و 2 و 3 و 4 كاملة', 'Gen 1, 2, 3 & 4 full');
    return `G1 - G${num}`;
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* ========================================================================= */}
        {/* HERO BANNER - Rich Luxury Purple & Gold Palette (Matching BONUS POOL)    */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170529] via-[#2e1065] to-[#170529] p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{tr("حزمة العضوية النشطة والأجيال", "Active Membership & Growth Package")}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
                {tr("باقاتي وسجل المشتريات", "MY PACKAGES & MEMBERSHIP")}
              </h1>
              <p className="text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                {tr("متابعة أعلى باقة نشطة، الأجيال المستحقة للأرباح، وسجل جميع المشتريات السابقة بشكل مستقل.", "Track your highest active package, unlocked commission generations, and complete purchases history.")}
              </p>
            </div>

            {/* Quick Stats Badges & CTA inside Hero */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              {highestPackage && (
                <>
                  <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-amber-500/25 min-w-[130px] shadow-lg">
                    <span className="text-xs text-slate-300 block">{tr("الباقة النشطة", "Active Tier")}</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block font-mono uppercase truncate max-w-[140px]">
                      {isRtl ? (highestPackage.package_name_ar || highestPackage.package_name) : (highestPackage.package_name || highestPackage.package_name_ar)}
                    </span>
                    <span className="text-[10px] text-amber-300/80 font-bold">
                      {tr("المستوى", "Level")} {highestPackage.level || 1}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-amber-500/25 min-w-[130px] shadow-lg">
                    <span className="text-xs text-slate-300 block">{tr("عمق الأجيال", "Unlocked Gens")}</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block font-mono">
                      {Number(highestPackage.unlocked_generations) === 0 ? 'Direct' : `G1-G${highestPackage.unlocked_generations}`}
                    </span>
                    <span className="text-[10px] text-emerald-300/80 font-bold">{tr("أرباح مفعلة", "Active Pool")}</span>
                  </div>
                </>
              )}

              <Link to="/student/packages" className="self-stretch sm:self-auto flex">
                <Button className="w-full sm:w-auto h-auto py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs gap-2 shadow-lg shadow-amber-500/20">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{tr("متجر الباقات", "Packages Store")}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4 OVERVIEW METRIC CARDS ROW (Exact match to Bonus Pool layout)            */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>{tr("أعلى تصنيف نشط", "Highest Active Tier")}</span>
            </span>
            <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase truncate">
              {highestPackage ? (isRtl ? (highestPackage.package_name_ar || highestPackage.package_name) : (highestPackage.package_name || highestPackage.package_name_ar)) : tr("غير مفعل", "None")}
            </p>
            <span className="text-[11px] text-amber-500 dark:text-amber-400 font-bold block">
              {highestPackage ? `${tr("مؤهل للأرباح", "Qualified for Earnings")} ✓` : tr("بحاجة لتفعيل", "Needs Activation")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>{tr("المبلغ المسدد للباقة", "Amount Paid")}</span>
            </span>
            <p className="text-lg sm:text-xl font-black text-amber-500 dark:text-amber-400 font-mono">
              ${highestPackage ? Number(highestPackage.amount_paid).toFixed(2) : '0.00'} <span className="text-xs font-semibold text-slate-400">USD</span>
            </p>
            <span className="text-[11px] text-slate-400 block font-medium">
              {highestPackage?.purchased_at ? new Date(highestPackage.purchased_at).toLocaleDateString(dateLocale) : tr("لا توجد مدفوعات", "No payment date")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>{tr("عمق أرباح الأجيال", "Commission Generations")}</span>
            </span>
            <p className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {highestPackage ? getUnlockedGensText(highestPackage.unlocked_generations) : tr("غير محدد", "None")}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("حسب خطة الأرباح المعتمدة", "As per affiliate model")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-500" />
              <span>{tr("إجمالي العمليات", "Total Purchases")}</span>
            </span>
            <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {purchasedPackages.length} {tr("عمليات", "records")}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("سجل المشتريات الموثق", "Verified purchase log")}
            </span>
          </Card>
        </div>

        {/* ========================================================================= */}
        {/* NAVIGATION TABS (Exact match to Bonus Pool tab styling)                  */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <Button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{tr("الباقة الحالية والمميزات", "Current Package & Features")}</span>
          </Button>

          <Button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{tr(`سجل المشتريات المستقل (${purchasedPackages.length})`, `Purchase History (${purchasedPackages.length})`)}</span>
          </Button>

          {unpurchasedPackages.length > 0 && (
            <Button
              onClick={() => setActiveTab('upgrades')}
              className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
                activeTab === 'upgrades'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{tr(`باقات الترقية المتاحة (${unpurchasedPackages.length})`, `Available Upgrades (${unpurchasedPackages.length})`)}</span>
            </Button>
          )}
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-slate-400 text-xs font-semibold">
              {tr("جاري تحميل بيانات الباقة والمميزات...", "Loading package details...")}
            </span>
          </div>
        ) : !highestPackage ? (
          /* NO PACKAGE EMPTY STATE */
          <Card className="rounded-3xl border-2 border-dashed border-amber-500/40 p-10 text-center bg-gradient-to-br from-[#120422] to-[#1e0836] text-white shadow-xl">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-amber-400">
                {t('packages.noPackageTitle', tr('لم تقم بتفعيل أي باقة بعد!', 'No active package yet!'))}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                {t('packages.noPackageDesc', tr('قم بتفعيل عضوية المجتمع أو شراء إحدى باقات الأكاديمية لفتح الدورات وتفعيل رابط التسويق والأرباح.', 'Activate your Community membership or buy an Academy package to unlock courses and start earning.'))}
              </p>
              <Link to="/student/packages">
                <Button className="rounded-2xl font-black gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-6 h-11 shadow-lg shadow-amber-500/20">
                  <Sparkles className="h-4 w-4" />
                  {t('packages.browsePackages', tr('استعراض وشراء باقة الآن', 'Browse & Buy Packages Now'))}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: HIGHEST ACTIVE QUALIFYING PACKAGE SHOWCASE                        */}
            {/* ========================================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-[#1b0633] via-[#2e1065] to-[#4c1d95] text-white p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Card Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-500 text-white font-black px-3.5 py-1 text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{tr("أعلى باقة نشطة ومؤهلة لحسابك", "ACTIVE QUALIFYING PACKAGE")}</span>
                        </Badge>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                          {tr("المستوى", "Level")} {highestPackage.level || 1}
                        </span>
                      </div>

                      <h2 className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight uppercase">
                        {isRtl ? (highestPackage.package_name_ar || highestPackage.package_name) : (highestPackage.package_name || highestPackage.package_name_ar)}
                      </h2>

                      <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-2xl">
                        {tr("الباقة المعتمدة في حسابك لاحتساب عمولات الأجيال واستحقاقات المنصة.", "The designated package for calculating your generation commissions and platform benefits.")}
                      </p>
                    </div>

                    {/* Price and Date Tag */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-amber-500/30 backdrop-blur-md shrink-0 sm:min-w-[180px]">
                      <span className="text-xs text-slate-300 block font-medium">{tr("المبلغ المدفوع للباقة", "Amount Paid")}</span>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-0.5">
                        ${Number(highestPackage.amount_paid).toFixed(2)} <span className="text-xs font-semibold text-slate-300">USD</span>
                      </div>
                      <span className="text-[11px] text-purple-200/80 mt-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        {new Date(highestPackage.purchased_at).toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                  </div>

                  {/* Highlights Bar */}
                  <div className="my-6 p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 block font-medium">{tr("السعر الأصلي للباقة", "Original Price")}</span>
                      <span className="text-base font-bold text-white font-mono">
                        ${highestPackage.package_original_price || highestPackage.price || '30.00'} USD
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block font-medium">{tr("الأجيال المفتوحة للعمولات", "Unlocked Generations")}</span>
                      <span className="text-base font-bold text-emerald-400">
                        {getUnlockedGensText(highestPackage.unlocked_generations)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 block font-medium">{tr("حالة العضوية", "Membership Status")}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {tr("مفعلة وتتجدد سنوياً", "Active & Renewable")}
                      </span>
                    </div>
                  </div>

                  {/* Included Features List */}
                  <div className="border-t border-purple-500/30 pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <Gem className="w-4 h-4 text-amber-400" />
                        <span>{t('packages.includedFeatures', tr('المميزات والدورات المشمولة في الباقة', 'Included Features & Privileges'))}</span>
                      </h4>
                      <span className="text-[11px] text-purple-200/70 font-semibold">
                        {Array.isArray(highestPackage.features) ? `${highestPackage.features.length} ${tr("مميزات", "features")}` : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.isArray(highestPackage.features) && highestPackage.features.length > 0 ? (
                        highestPackage.features.map((feat: string, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-xs text-slate-100"
                          >
                            <div className="h-6 w-6 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            </div>
                            <span className="font-semibold leading-relaxed">{feat}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-purple-200/70">{tr("تشمل كافة أدوات التكوين والتسويق المقررة للباقة.", "Includes all standard academy features.")}</p>
                      )}
                    </div>
                  </div>

                  {/* Action CTA Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-purple-500/30 mt-6">
                    <Link to="/student/formations">
                      <Button className="rounded-2xl font-bold text-xs h-11 px-5 bg-white/10 hover:bg-white/20 text-white border border-white/20 gap-2 transition-all">
                        <BookOpen className="h-4 w-4" />
                        <span>{t('packages.coursesIncluded', tr('استعراض الدورات المشمولة', 'Included Courses'))}</span>
                      </Button>
                    </Link>

                    <Link to="/student/team">
                      <Button className="rounded-2xl font-black text-xs h-11 px-5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 gap-2 transition-all">
                        <Share2 className="h-4 w-4" />
                        <span>{t('packages.myAffiliateLink', tr('رابط الإحالة وفريقي', 'My Team & Referral Link'))}</span>
                      </Button>
                    </Link>

                    <Link to="/student/packages">
                      <Button className="rounded-2xl font-bold text-xs h-11 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-purple-500/25 gap-2 transition-all">
                        <ArrowUpRight className="h-4 w-4" />
                        <span>{tr("ترقية وتوسيع الباقة", "Upgrade Package")}</span>
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PURCHASES HISTORY TABLE                                           */}
            {/* ========================================================================= */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
                  <CardHeader className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-purple-600" />
                        <span>{tr("سجل مشتريات الباقات المستقل", "Independent Package Purchases History")}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {tr("سجل توثيقي كامل لجميع عمليات شراء الباقات السابقة مع المبالغ وتواريخ التفعيل.", "Complete verified audit record of all past package purchases.")}
                      </CardDescription>
                    </div>

                    <Badge variant="outline" className="font-bold text-xs py-1 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      {purchasedPackages.length} {tr("عملية شراء", "purchases")}
                    </Badge>
                  </CardHeader>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                          <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("الباقة", "Package")}</th>
                          <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("المبلغ المدفوع", "Amount Paid")}</th>
                          <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("طريقة الدفع", "Payment Method")}</th>
                          <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("الأجيال المفتوحة", "Unlocked Gens")}</th>
                          <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("تاريخ الشراء", "Purchase Date")}</th>
                          <th className="p-4 text-center">{tr("الحالة", "Status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {purchasedPackages.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              {tr("لا توجد مشتريات مسجلة بعد", "No purchase history available")}
                            </td>
                          </tr>
                        ) : (
                          purchasedPackages.map((item) => {
                            const isCurrentActive = item.is_current === 1;
                            return (
                              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-4 font-bold text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center shrink-0 font-bold shadow-xs">
                                      <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                                        {isRtl ? (item.package_name_ar || item.package_name) : (item.package_name || item.package_name_ar)}
                                      </p>
                                      {isCurrentActive && (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                          ★ {tr("الأعلى تصنيفاً حالياً", "Current Highest Active")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4 font-black text-slate-900 dark:text-white font-mono text-sm">
                                  ${Number(item.amount_paid).toFixed(2)} <span className="text-[10px] text-slate-400 font-semibold">USD</span>
                                </td>

                                <td className="p-4 text-slate-600 dark:text-slate-300 font-semibold">
                                  {formatMethodName(item.payment_method)}
                                </td>

                                <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold">
                                  {getUnlockedGensText(item.unlocked_generations)}
                                </td>

                                <td className="p-4 text-slate-500 font-medium">
                                  {new Date(item.purchased_at).toLocaleDateString(dateLocale, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </td>

                                <td className="p-4 text-center">
                                  {item.status === 'active' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>{tr("مفعلة ونشطة", "Active")}</span>
                                    </span>
                                  ) : item.status === 'pending' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                      <Clock className="h-3.5 w-3.5" />
                                      <span>{tr("قيد المراجعة", "Pending")}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      {item.status}
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
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: UPGRADE AND AVAILABLE PACKAGES STORE                               */}
            {/* ========================================================================= */}
            {activeTab === 'upgrades' && unpurchasedPackages.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <span>{tr("باقات إضافية يمكنك ترقيتها بالسعر الكامل", "Available Packages to Upgrade")}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tr("يمكنك ترقية حسابك لأي من الباقات التالية لفتح أجيال عمولات أعمق ومحتويات دورات إضافية.", "Upgrade your account to unlock deeper commission generations and exclusive academy courses.")}
                    </p>
                  </div>

                  <Link to="/student/packages">
                    <Button variant="outline" className="rounded-2xl text-xs font-bold gap-1.5">
                      <span>{tr("زيارة المتجر كاملاً", "Full Store")}</span>
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {unpurchasedPackages.map((pkg: any) => (
                    <Card 
                      key={pkg.id} 
                      className="relative overflow-hidden rounded-3xl border-2 border-slate-800 bg-gradient-to-br from-[#120422] via-[#1e0836] to-[#0d0216] text-white p-6 space-y-4 shadow-xl hover:border-amber-500/40 transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                            {t('packages.level', tr('المستوى', 'Level'))} {pkg.level}
                          </span>
                          <h4 className="font-black text-lg text-white group-hover:text-amber-400 transition-colors uppercase">
                            {isRtl ? (pkg.name_ar || pkg.name) : (pkg.name || pkg.name_ar)}
                          </h4>
                          <p className="text-xs text-purple-200/80 font-medium">
                            {getUnlockedGensText(pkg.unlocked_generations)}
                          </p>
                        </div>

                        <div className="text-right rtl:text-left">
                          <p className="text-2xl font-black text-amber-400 font-mono">${pkg.price}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{tr("السعر الكامل", "Full Price")}</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {isRtl ? (pkg.description_ar || pkg.description) : (pkg.description || pkg.description_ar)}
                      </p>

                      <Link to={`/student/packages?buy=${pkg.slug || pkg.id}`} className="block pt-2">
                        <Button className="w-full rounded-2xl h-11 text-xs font-black bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-md shadow-purple-500/25 gap-2">
                          <span>{tr("شراء الباقة والترقية الآن", "Upgrade to this Package")}</span>
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
