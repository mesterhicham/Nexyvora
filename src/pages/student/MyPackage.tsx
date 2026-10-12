import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BookOpen
} from 'lucide-react';
import { toast } from "sonner";

export default function MyPackage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';

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
      toast.error('Failed to load package');
    } finally {
      setLoading(false);
    }
  };

  const current = data?.currentPackage;
  const upgrades = data?.availableUpgrades || [];

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {t('packages.myPackageTitle')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('packages.myPackageSubtitle')}
            </p>
          </div>
          <Link to="/student/packages">
            <Button className="rounded-xl font-bold gap-2">
              <Package className="h-4 w-4" />
              {t('packages.store')}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !current ? (
          <Card className="rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-700 p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="max-w-md mx-auto space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('packages.noPackageTitle')}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                {t('packages.noPackageDesc')}
              </p>
              <Link to="/student/packages">
                <Button className="rounded-xl font-bold gap-2 mt-2">
                  <Sparkles className="h-4 w-4" />
                  {t('packages.browsePackages')}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Package Card */}
            <Card className="rounded-2xl border-2 border-primary/40 bg-linear-to-br from-primary/5 via-white to-purple-50/30 dark:from-slate-900 dark:to-slate-800 shadow-md">
              <CardHeader className="p-6 md:p-8 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary text-white">
                      {t('packages.activePackageBadge')}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                      {isRtl ? (current.package_name_ar || current.package_name) : (current.package_name || current.package_name_ar)}
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                      {t('packages.level')} {current.level} • {t('packages.originalPrice')} ${current.package_original_price} USD • {t('team.unlockedGensCount')} {current.unlocked_generations || 2} (G1 - G{current.unlocked_generations || 2})
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-xs bg-white dark:bg-slate-800 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-xs text-slate-400">{t('packages.amountPaid')}</p>
                    <p className="text-2xl font-black text-primary">${current.amount_paid} USD</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(current.purchased_at).toLocaleDateString(dateLocale)}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 md:p-8 pt-0 space-y-6">
                <div className="border-t border-slate-200/60 dark:border-slate-700/60 pt-6">
                  <h4 className={`text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('packages.includedFeatures')}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Array.isArray(current.features) && current.features.map((feat: string, idx: number) => (
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
                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t('packages.coursesIncluded')}
                    </Button>
                  </Link>
                  <Link to="/student/team">
                    <Button className="rounded-xl font-bold gap-2 bg-primary">
                      <Sparkles className="h-4 w-4" />
                      {t('packages.myAffiliateLink')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Upgrades Available */}
            {upgrades.length > 0 && (
              <div className="space-y-4">
                <h3 className={`text-xl font-bold text-slate-900 dark:text-white ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t('packages.availableUpgrades')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {upgrades.map((pkg: any) => (
                    <Card key={pkg.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">
                            {isRtl ? (pkg.name_ar || pkg.name) : (pkg.name || pkg.name_ar)}
                          </h4>
                          <p className="text-xs text-slate-400">
                            {t('packages.level')} {pkg.level} • {t('team.unlockedGensCount')} {pkg.unlocked_generations || 2} (G1 - G{pkg.unlocked_generations || 2})
                          </p>
                        </div>
                        <div className={isRtl ? 'text-left' : 'text-right'}>
                          <p className="text-lg font-extrabold text-primary">${pkg.upgrade_price} USD</p>
                          <p className="text-[10px] text-emerald-600 font-semibold">{t('packages.upgradePrice')}</p>
                        </div>
                      </div>

                      <p className={`text-xs text-slate-500 line-clamp-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {isRtl ? (pkg.description_ar || pkg.description) : (pkg.description || pkg.description_ar)}
                      </p>

                      <Link to="/student/packages">
                        <Button className="w-full rounded-xl text-xs font-bold gap-1 mt-2">
                          <span>{t('packages.upgradeToThis')}</span>
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
