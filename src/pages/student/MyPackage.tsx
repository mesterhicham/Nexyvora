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
  ArrowUpRight, 
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
  ShoppingBag
} from 'lucide-react';
import { toast } from "sonner";
import { useCurrency } from '@/contexts/CurrencyContext';

export default function MyPackage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const { formatPrice, convertToLocal, isAlgeria, isMorocco } = useCurrency();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {tr("باقاتي وسجل المشتريات", "My Packages & Purchase History")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {tr("متابعة أعلى باقة نشطة، الأجيال المستحقة، وسجل جميع المشتريات السابقة بشكل مستقل.", "Track your highest active package, unlocked generations, and full independent purchases history.")}
            </p>
          </div>
          <Link to="/student/packages">
            <Button className="rounded-2xl font-bold gap-2 shadow-sm">
              <ShoppingBag className="h-4 w-4" />
              {t('packages.store', tr('متجر الباقات', 'Packages Store'))}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !highestPackage ? (
          <Card className="rounded-3xl border-dashed border-2 border-slate-300 dark:border-slate-700 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('packages.noPackageTitle', tr('لم تشترك في أي باقة بعد!', 'No active package yet!'))}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                {t('packages.noPackageDesc', tr('قم بتفعيل عضوية المجتمع أو شراء إحدى باقات الأكاديمية لفتح الدورات وتفعيل رابط التسويق والأرباح.', 'Activate your Community membership or buy an Academy package to unlock courses and start earning.'))}
              </p>
              <Link to="/student/packages">
                <Button className="rounded-2xl font-bold gap-2 mt-2">
                  <Sparkles className="h-4 w-4" />
                  {t('packages.browsePackages', tr('استعراض وشراء باقة', 'Browse & Buy Packages'))}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* 1. Highest Active Qualifying Package Card */}
            <Card className="rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-white to-purple-50/30 dark:from-slate-900 dark:to-slate-800 shadow-md">
              <CardHeader className="p-6 md:p-8 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-xs">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{tr("أعلى باقة مؤهلة ونشطة لحسابك ✓", "Highest Qualifying Active Package ✓")}</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                      {isRtl ? (highestPackage.package_name_ar || highestPackage.package_name) : (highestPackage.package_name || highestPackage.package_name_ar)}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                      {t('packages.level', tr('المستوى', 'Level'))} {highestPackage.level} • {tr('القيمة الأصلية', 'Original Price')} ${highestPackage.package_original_price || highestPackage.price} USD • {t('team.unlockedGensCount', tr('الأجيال المفتوحة للأرباح', 'Unlocked Generations'))}: {
                        Number(highestPackage.unlocked_generations) === 0 
                          ? tr('أرباح مباشرة فقط', 'Direct only') 
                          : Number(highestPackage.unlocked_generations) === 1
                          ? tr('الجيل 1', 'Gen 1')
                          : Number(highestPackage.unlocked_generations) === 2
                          ? tr('الجيل 1 والجيل 2', 'Gen 1 & 2')
                          : Number(highestPackage.unlocked_generations) === 3
                          ? tr('الأجيال 1 و 2 و 3', 'Gen 1, 2 & 3')
                          : Number(highestPackage.unlocked_generations) === 4
                          ? tr('الأجيال 1 و 2 و 3 و 4 كاملة', 'Gen 1, 2, 3 & 4 full')
                          : `G1 - G${highestPackage.unlocked_generations}`
                      }
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-xs text-slate-400 font-medium">{tr("المبلغ المدفوع للباقة", "Amount Paid")}</p>
                    <p className="text-2xl font-black text-primary">${highestPackage.amount_paid} USD</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                      <Calendar className="h-3 w-3" />
                      {new Date(highestPackage.purchased_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                  <h4 className={`text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('packages.includedFeatures', tr('المميزات المشمولة', 'Included Features'))}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.isArray(highestPackage.features) && highestPackage.features.map((feat: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="h-4 w-4 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Link to="/student/formations">
                    <Button variant="outline" className="rounded-2xl font-bold gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t('packages.coursesIncluded', tr('الدورات المشمولة في الباقة', 'Included Courses'))}
                    </Button>
                  </Link>
                  <Link to="/student/team">
                    <Button className="rounded-2xl font-bold gap-2 bg-primary">
                      <Sparkles className="h-4 w-4" />
                      {t('packages.myAffiliateLink', tr('رابط التسويق وفريقي', 'My Team & Referral Link'))}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 2. Independent Package Purchases History (سجل المشتريات المستقل) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    <span>{tr("سجل مشتريات الباقات المستقل", "Independent Package Purchases History")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr("سجل توثيقي كامل لجميع عمليات شراء الباقات التي قمت بها مع المبالغ وتواريخ التفعيل.", "Complete record of all package purchases made by you with amounts and activation dates.")}
                  </p>
                </div>
                <Badge variant="outline" className="font-bold text-xs py-1 px-3">
                  {purchasedPackages.length} {tr("عملية شراء", "purchases")}
                </Badge>
              </div>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 font-bold">
                        <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("الباقة", "Package")}</th>
                        <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("المبلغ المدفوع", "Amount Paid")}</th>
                        <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("طريقة الدفع", "Payment Method")}</th>
                        <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("الأجيال المفتوحة", "Unlocked Gens")}</th>
                        <th className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>{tr("تاريخ الشراء", "Purchase Date")}</th>
                        <th className="p-4 text-center">{tr("الحالة", "Status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {purchasedPackages.map((item) => {
                        const isCurrentActive = item.is_current === 1;
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                                  <Package className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-900 dark:text-white">
                                    {isRtl ? (item.package_name_ar || item.package_name) : (item.package_name || item.package_name_ar)}
                                  </p>
                                  {isCurrentActive && (
                                    <span className="text-[10px] text-primary font-bold">
                                      ★ {tr("الأعلى تصنيفاً حالياً", "Current Highest")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-extrabold text-primary">
                              ${Number(item.amount_paid).toFixed(2)} USD
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                              {formatMethodName(item.payment_method)}
                            </td>
                            <td className="p-4 text-slate-600 dark:text-slate-300 font-bold">
                              {Number(item.unlocked_generations) === 0 
                                ? tr("أرباح مباشرة", "Direct only") 
                                : Number(item.unlocked_generations) === 2
                                ? tr("جيل 1 + 2", "Gen 1 & 2")
                                : Number(item.unlocked_generations) === 3
                                ? tr("جيل 1 + 2 + 3", "Gen 1, 2 & 3")
                                : Number(item.unlocked_generations) === 4
                                ? tr("جيل 1 + 2 + 3 + 4", "Gen 1, 2, 3 & 4")
                                : `G1-G${item.unlocked_generations}`}
                            </td>
                            <td className="p-4 text-slate-500 font-medium">
                              {new Date(item.purchased_at).toLocaleDateString(dateLocale)}
                            </td>
                            <td className="p-4 text-center">
                              {item.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>{tr("مفعلة ونشطة", "Active")}</span>
                                </span>
                              ) : item.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                  <Clock className="h-3 w-3" />
                                  <span>{tr("قيد المراجعة", "Pending")}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {item.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* 3. Available Packages to Purchase at Full Price (باقات إضافية يمكنك شراؤها) */}
            {unpurchasedPackages.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-500" />
                    <span>{tr("باقات إضافية يمكنك شراؤها بالسعر الكامل", "Available Packages to Purchase")}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr("يمكنك شراء أي من الباقات التالية بالسعر الكامل لفتح أجيال عمولات أعمق ومحتويات دورات إضافية.", "You can purchase any of the following packages at full price to unlock deeper commission generations and more courses.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {unpurchasedPackages.map((pkg: any) => (
                    <Card key={pkg.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs hover:shadow-md transition-all">
                      <div className="flex items-start justify-between">
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {isRtl ? (pkg.name_ar || pkg.name) : (pkg.name || pkg.name_ar)}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t('packages.level', tr('المستوى', 'Level'))} {pkg.level} • {
                              Number(pkg.unlocked_generations) === 2 
                                ? tr('أرباح الجيل 1 و 2', 'Unlocks Gen 1 & 2')
                                : Number(pkg.unlocked_generations) === 3
                                ? tr('أرباح الأجيال 1 و 2 و 3', 'Unlocks Gen 1, 2 & 3')
                                : Number(pkg.unlocked_generations) === 4
                                ? tr('أرباح الأجيال 1 و 2 و 3 و 4', 'Unlocks Gen 1, 2, 3 & 4')
                                : `G1-G${pkg.unlocked_generations}`
                            }
                          </p>
                        </div>
                        <div className={isRtl ? 'text-left' : 'text-right'}>
                          <p className="text-lg font-black text-primary">${pkg.price} USD</p>
                          <p className="text-[10px] text-slate-400 font-bold">{tr("السعر الكامل", "Full Price")}</p>
                        </div>
                      </div>

                      <p className={`text-xs text-slate-500 line-clamp-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? (pkg.description_ar || pkg.description) : (pkg.description || pkg.description_ar)}
                      </p>

                      <Link to={`/student/packages?buy=${pkg.slug || pkg.id}`}>
                        <Button className="w-full rounded-2xl text-xs font-bold gap-1 mt-2">
                          <span>{tr("شراء الباقة الآن", "Buy Package Now")}</span>
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
