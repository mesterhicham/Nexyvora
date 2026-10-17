import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap,
  ShieldCheck, 
  Wallet, 
  Users, 
  Gamepad2, 
  Package, 
  Trophy, 
  Video, 
  Award, 
  User, 
  Copy, 
  Check, 
  ExternalLink,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  ChevronRight,
  ArrowUpRight,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MobileStudentDashboardProps {
  activePackage?: any;
  wallet?: { balance: number; totalEarned: number; pending?: number };
  affiliateCode?: string;
  referralLink?: string;
  news?: any[];
  meetings?: any[];
  modules?: any[];
  totalTeam?: number;
  directReferrals?: number;
  student?: any;
}

export function MobileStudentDashboard({
  activePackage,
  wallet = { balance: 0, totalEarned: 0, pending: 0 },
  affiliateCode = 'NV------',
  referralLink = '',
  news = [],
  meetings = [],
  modules = [],
  totalTeam = 0,
  directReferrals = 0,
  student
}: MobileStudentDashboardProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAlgeria, isMorocco, convertToLocal } = useCurrency();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isRtl = i18n.language === 'ar';

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success(tr("تم نسخ رابط الإحالة بنجاح!", "Referral link copied successfully!"));
  };

  const handleCopyCode = () => {
    if (!affiliateCode) return;
    navigator.clipboard.writeText(affiliateCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success(tr("تم نسخ كود الإحالة بنجاح!", "Referral code copied successfully!"));
  };

  return (
    <div className="md:hidden pb-12 space-y-4 pt-1">
      {/* Main 6-Tile Card (الأقسام الأساسية لمشروعنا) */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
          {/* 1. الأكاديمية (Academy) */}
          <button
            onClick={() => navigate('/student/academy')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/25 mb-2 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.academy', tr("الأكاديمية", "Academy"))}
            </span>
          </button>

          {/* 2. باقاتي (My Package) */}
          <button
            onClick={() => navigate('/student/my-package')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-white flex items-center justify-center shadow-md shadow-amber-500/30 mb-2 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.myPackage', tr("باقاتي", "My Packages"))}
            </span>
          </button>

          {/* 3. المحفظة (Wallet) */}
          <button
            onClick={() => navigate('/student/wallet')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 mb-2 group-hover:scale-105 transition-transform">
              <Wallet className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.wallet', tr("المحفظة", "Wallet"))}
            </span>
          </button>

          {/* 4. فريقي (My Team) */}
          <button
            onClick={() => navigate('/student/team')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-purple-500/30 mb-2 group-hover:scale-105 transition-transform">
              <Users className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.team', tr("فريقي", "My Team"))}
            </span>
          </button>

          {/* 5. التحديات (Challenges) */}
          <button
            onClick={() => navigate('/student/challenges')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center shadow-md shadow-purple-500/25 mb-2 group-hover:scale-105 transition-transform">
              <Gamepad2 className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.challenges', tr("التحديات", "Challenges"))}
            </span>
          </button>

          {/* 6. متجر الباقات (Packages) */}
          <button
            onClick={() => navigate('/student/packages')}
            className="flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/25 mb-2 group-hover:scale-105 transition-transform">
              <Package className="h-7 w-7 stroke-[2.2]" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight text-center">
              {t('nav.packages', tr("الباقات", "Packages"))}
            </span>
          </button>
        </div>
      </div>

      {/* 3. بطاقة "المزيد من الأقسام" (More Sections) */}
      <div className="mx-1 bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] shadow-[0_8px_25px_rgba(0,0,0,0.05)] border border-slate-100/90 dark:border-slate-800/80 p-4 sm:p-5">
        <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mb-3.5">
          {t('common.moreSections', tr("المزيد من الأقسام", "More Sections"))}
        </h2>

        <div className="grid grid-cols-4 gap-2 text-center">
          {/* الرتب (Ranks) */}
          <button
            onClick={() => navigate('/student/ranks')}
            className="flex flex-col items-center justify-center active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/25 mb-1.5 group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
              {t('nav.ranks', tr("الرتب", "Ranks"))}
            </span>
          </button>

          {/* اللقاءات المباشرة (Zoom) */}
          <button
            onClick={() => navigate('/student/meetings')}
            className="flex flex-col items-center justify-center active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 mb-1.5 group-hover:scale-105 transition-transform">
              <Video className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
              {t('nav.meetings', tr("اللقاءات", "Meetings"))}
            </span>
          </button>

          {/* الشهادات والدبلومات (Diplomas) */}
          <button
            onClick={() => navigate('/student/diploma')}
            className="flex flex-col items-center justify-center active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/25 mb-1.5 group-hover:scale-105 transition-transform">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
              {t('nav.diplomas', tr("الشهادات", "Diplomas"))}
            </span>
          </button>

          {/* الملف الشخصي (Profile) */}
          <button
            onClick={() => navigate('/student/profile')}
            className="flex flex-col items-center justify-center active:scale-95 transition-all group"
          >
            <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 mb-1.5 group-hover:scale-105 transition-transform">
              <User className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-full">
              {t('nav.profile', tr("حسابي", "Profile"))}
            </span>
          </button>
        </div>
      </div>

      {/* 4. محتوى لوحة التحكم الكامل لمشروعنا (Full Project Content) */}
      <div className="mx-1 space-y-3.5">
        {/* بطاقة الباقة الحالية (Active Package) */}
        <div className="p-4 rounded-[24px] bg-linear-to-br from-primary/10 via-white to-purple-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-primary/20 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('packages.currentActive', tr("الباقة النشطة الحالية", "Current Active Package"))}
              </span>
              {activePackage ? (
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isRtl ? (activePackage.name_ar || activePackage.name) : (activePackage.name || activePackage.name_ar)}
                  </h3>
                  <Badge className="bg-primary/15 text-primary border-primary/20 text-[10px] font-bold px-2 py-0.5">
                    {t('packages.level', tr("مستوى", "Level"))} {activePackage.level}
                  </Badge>
                </div>
              ) : (
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t('packages.noPackageTitle', tr("لا توجد باقة نشطة حالياً", "No active package currently"))}
                </h3>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Layers className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/student/my-package')}
              className="text-xs font-bold rounded-xl h-8 px-3"
            >
              <span>{t('packages.viewDetails', tr("تفاصيل الباقة", "Package Details"))}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/student/packages')}
              className="bg-primary text-white text-xs font-bold rounded-xl h-8 px-3"
            >
              <span>{t('packages.upgrade', tr("ترقية / المتجر", "Upgrade / Store"))}</span>
            </Button>
          </div>
        </div>

        {/* بطاقة المحفظة والأرباح (Wallet & Profits) */}
        <div className="p-4 rounded-[24px] bg-linear-to-br from-emerald-500/10 via-white to-teal-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-emerald-500/20 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('wallet.title', tr("محفظة الأرباح", "Profits Wallet"))}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {isAlgeria
                    ? `${convertToLocal(wallet?.balance || 0).toLocaleString()} DZD`
                    : isMorocco
                      ? `${convertToLocal(wallet?.balance || 0).toLocaleString()} MAD`
                      : `$${Number(wallet?.balance || 0).toFixed(2)}`}
                </span>
                <span className="text-[10px] text-slate-400">
                  {tr("إجمالي المكتسب:", "Total Earned:")}{' '}
                  {isAlgeria
                    ? `${convertToLocal(wallet?.totalEarned || 0).toLocaleString()} DZD`
                    : isMorocco
                      ? `${convertToLocal(wallet?.totalEarned || 0).toLocaleString()} MAD`
                      : `$${Number(wallet?.totalEarned || 0).toFixed(2)}`}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>{tr("الرصيد متاح للإيداع وشراء الباقات والسحب", "Available balance for deposits, packages & withdrawals")}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">● {tr("نشط", "Active")}</span>
          </div>
        </div>

        {/* بطاقة فريقي وكود الإحالة (Affiliate & Team) */}
        {referralLink && (
          <div className="p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('affiliate.title', tr("نظام الشركاء والإحالة", "Affiliate & Referral System"))}
                </span>
                <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">
                  {tr("إجمالي أعضاء الفريق:", "Total Team Members:")} <span className="text-blue-600 font-black">{totalTeam}</span>
                  {directReferrals > 0 && <span className="text-slate-400 text-[10px] font-normal mx-2">({directReferrals} {tr("مباشر", "direct")})</span>}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600">
                <Users className="h-4 w-4" />
              </div>
            </div>

            {/* Referral Code Row */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {tr("كود الإحالة الخاص بك:", "Your referral code:")}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-blue-600 dark:text-blue-400">{affiliateCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-slate-400 hover:text-blue-600 active:scale-90"
                  title={tr("نسخ الكود", "Copy Code")}
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick Share Link */}
            <button
              onClick={handleCopyLink}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? (tr("تم نسخ رابط الإحالة!", "Referral link copied!")) : (tr("نسخ رابط الإحالة ومشاركته", "Copy and share referral link"))}</span>
            </button>
          </div>
        )}

        {/* المقررات الأكاديمية للطالب (Enrolled Courses / Modules) */}
        {modules && modules.length > 0 && (
          <div className="p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {t('student.myCourses', tr("مقرراتي ودوراتي", "My Courses & Modules"))}
                </h3>
              </div>
              <button
                onClick={() => navigate('/student/academy')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
              >
                <span>{t('common.all', tr("الكل", "All"))}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {modules.slice(0, 3).map((mod: any) => (
                <div
                  key={mod.id}
                  onClick={() => navigate(`/student/courses/${mod.id}`)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {mod.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {mod.specialty_name || (tr("أكاديمي", "Academic"))}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الاجتماعات المباشرة القادمة (Upcoming Zoom Sessions) */}
        {meetings && meetings.length > 0 && (
          <div className="p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-rose-500" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {t('zoom.upcomingClasses', tr("اللقاءات المباشرة القادمة", "Upcoming Live Meetings"))}
                </h3>
              </div>
              <button
                onClick={() => navigate('/student/meetings')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
              >
                <span>{t('common.all', tr("عرض الكل", "View All"))}</span>
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>

            <div className="space-y-2">
              {meetings.slice(0, 2).map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(m.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (m.zoom_link) window.open(m.zoom_link, '_blank');
                      else navigate('/student/meetings');
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-xl h-7 px-2.5"
                  >
                    {tr("دخول", "Join")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* أحدث الإعلانات والأخبار (Announcements & News) */}
        {news && news.length > 0 && (
          <div className="p-4 rounded-[24px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-900 dark:text-white">
                  {t('news.title', tr("أحدث الإعلانات والأخبار", "Latest Announcements & News"))}
                </h3>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full">
                {news.length}
              </span>
            </div>

            <div className="space-y-2">
              {news.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {item.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
