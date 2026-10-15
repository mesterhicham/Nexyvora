import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MobileStudentDashboard } from '@/components/student/MobileStudentDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useStudentModules, useStudentStats, useCurrentStudent } from '@/hooks/useDashboardData';
import { useNews, useZoomMeetings } from '@/hooks/useAdminFeatures';
import { packageService, affiliateService } from '@/services/apiService';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  BookOpen, 
  ClipboardList, 
  Award, 
  TrendingUp, 
  Wallet, 
  Users, 
  Copy, 
  Check, 
  ArrowUpRight, 
  Layers, 
  ChevronLeft,
  Crown,
  Shield,
  ShieldCheck,
  Gem,
  User,
  Gamepad2,
  Video,
  Eye,
  EyeOff,
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Package,
  Coins,
  Trophy,
  MessageCircle,
  LifeBuoy,
  Newspaper,
  Network
} from 'lucide-react';

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';

  const stats = useStudentStats();
  const { data: student } = useCurrentStudent();
  const { data: modules } = useStudentModules();
  const { data: news } = useNews('students');
  const { data: meetings } = useZoomMeetings();

  const { user } = useAuth();
  const { isAlgeria, isMorocco, convertToLocal } = useCurrency();
  const [showBalance, setShowBalance] = useState(true);

  // Nexyvora Packages, Wallet & Affiliate Data
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: myPackData, isLoading: myPackLoading } = useQuery({
    queryKey: ['my-package-dashboard'],
    queryFn: packageService.getMyPackage,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['affiliate-wallet-dashboard'],
    queryFn: affiliateService.getWallet,
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['affiliate-team-dashboard'],
    queryFn: affiliateService.getTeam,
  });

  const { data: ranksData } = useQuery({
    queryKey: ['affiliate-ranks-dashboard'],
    queryFn: affiliateService.getRanks,
  });

  const activePackage = myPackData?.package;
  const wallet = walletData?.wallet || { balance: 0, totalEarned: 0 };
  const affiliateCode = teamData?.affiliateCode || 'NV------';
  const referralLink = `${window.location.origin}/auth?ref=${affiliateCode}`;
  const totalTeam = teamData?.totals?.totalTeamMembers || 0;
  const directReferrals = teamData?.totals?.directReferralsCount || 0;

  // Rank statistics & progress
  const ranksUserStats = ranksData?.userStats || {
    directSales: 0,
    teamTurnover: 0,
    currentRank: { name: 'Member', name_ar: 'عضو', level: 1, color_hex: '#94a3b8' },
    nextRank: null
  };
  const currentRank = ranksUserStats.currentRank || { name: 'Member', name_ar: 'عضو', level: 1, color_hex: '#94a3b8' };
  const nextRank = ranksUserStats.nextRank;

  let salesProgress = 100;
  let turnoverProgress = 100;

  if (nextRank) {
    salesProgress = Math.min(100, Math.round(((ranksUserStats.directSales || 0) / (nextRank.min_direct_sales || 1)) * 100));
    turnoverProgress = Math.min(100, Math.round(((ranksUserStats.teamTurnover || 0) / (Number(nextRank.min_team_turnover) || 1)) * 100));
  }

  const getRankIcon = (level: number) => {
    switch (level) {
      case 1: return User;
      case 2: return Shield;
      case 3: return Award;
      case 4: return Crown;
      case 5: return Gem;
      default: return Award;
    }
  };

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success(tr("تم نسخ رابط الإحالة!", "Referral link copied!"));
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success(tr("تم نسخ كود الإحالة!", "Affiliate code copied!"));
    }
  };

  const quickNavCards = [
    {
      to: '/student/academy',
      icon: GraduationCap,
      label: t('nav.academy', tr("الأكاديمية", "Academy")),
      color: 'from-blue-600 to-cyan-500',
      shadow: 'shadow-blue-500/25',
    },
    {
      to: '/student/community',
      icon: MessageSquare,
      label: t('nav.community', tr("مجتمع نيكسيفورا", "Nexyvora Community")),
      color: 'from-violet-600 to-indigo-500',
      shadow: 'shadow-violet-500/25',
    },
    {
      to: '/student/news',
      icon: Newspaper,
      label: t('nav.newsCenter', tr("مركز الأخبار", "News Center")),
      color: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-500/25',
    },
    {
      to: '/student/packages',
      icon: Package,
      label: t('nav.packages', tr("الباقات", "Packages")),
      color: 'from-amber-500 to-orange-400',
      shadow: 'shadow-amber-500/25',
    },
    {
      to: '/student/my-package',
      icon: Sparkles,
      label: t('nav.myPackage', tr("باقتي", "My Package")),
      color: 'from-yellow-500 to-amber-500',
      shadow: 'shadow-yellow-500/25',
    },
    {
      to: '/student/wallet',
      icon: Wallet,
      label: t('nav.wallet', tr("المحفظة", "Wallet")),
      color: 'from-emerald-500 to-teal-400',
      shadow: 'shadow-emerald-500/25',
    },
    {
      to: '/student/bonus-pool',
      icon: Coins,
      label: t('nav.bonusPool', tr("حوض المكافآت", "Bonus Pool")),
      color: 'from-teal-500 to-emerald-400',
      shadow: 'shadow-teal-500/25',
    },
    {
      to: '/student/founder',
      icon: Crown,
      label: t('nav.founderClub', tr("نادي المؤسسين", "Founder Club")),
      color: 'from-amber-600 to-yellow-400',
      shadow: 'shadow-amber-600/25',
    },
    {
      to: '/student/team',
      icon: Users,
      label: t('nav.team', tr("فريقي", "My Team")),
      color: 'from-purple-600 to-fuchsia-500',
      shadow: 'shadow-purple-500/25',
    },
    {
      to: '/student/team-tree',
      icon: Network,
      label: t('nav.teamTree', tr("شجرة الفريق", "Team Tree")),
      color: 'from-indigo-600 to-purple-600',
      shadow: 'shadow-indigo-500/25',
    },
    {
      to: '/student/challenges',
      icon: Trophy,
      label: t('nav.challenges', tr("التحديات", "Challenges")),
      color: 'from-sky-500 to-cyan-400',
      shadow: 'shadow-sky-500/25',
    },
    {
      to: '/student/ranks',
      icon: Award,
      label: t('nav.ranks', tr("الرتب", "Ranks")),
      color: 'from-rose-500 to-pink-500',
      shadow: 'shadow-rose-500/25',
    },
    {
      to: '/student/chat',
      icon: MessageCircle,
      label: t('nav.chat', tr("المحادثات", "Chat")),
      color: 'from-indigo-600 to-blue-500',
      shadow: 'shadow-indigo-500/25',
    },
    {
      to: '/student/support',
      icon: LifeBuoy,
      label: t('nav.support', tr("مركز الدعم", "Support Center")),
      color: 'from-cyan-600 to-teal-500',
      shadow: 'shadow-cyan-500/25',
    },
    {
      to: '/student/profile',
      icon: User,
      label: t('nav.profile', tr("الملف الشخصي", "Profile")),
      color: 'from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800',
      shadow: 'shadow-slate-500/20',
    },
  ];

  return (
    <DashboardLayout role="student">
      {/* MOBILE EXPERIENCE */}
      <MobileStudentDashboard 
        activePackage={activePackage}
        wallet={wallet}
        affiliateCode={affiliateCode}
        referralLink={referralLink}
        news={news || []}
        meetings={meetings || []}
        modules={modules || []}
        totalTeam={totalTeam}
        directReferrals={directReferrals}
        student={student}
      />

      {/* DESKTOP EXPERIENCE */}
      <div className="hidden md:block space-y-6 pt-1">
        {/* 1. ROYAL BLUE HERO BANNER (مطابق تماماً للصورة المرفقة) */}
        <div className="relative rounded-[32px] bg-gradient-to-r from-[#172554] via-[#1e40af] to-[#2563eb] p-6 lg:p-8 text-white shadow-xl shadow-blue-900/20 overflow-hidden">
          {/* Subtle background abstract shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Left Card: Welcome / Profile */}
            <div className="md:col-span-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-md shrink-0">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-300">
                  <User className="h-8 w-8" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-200">
                  {(() => {
                    const hour = new Date().getHours();
                    if (hour < 12) return tr("صباح الخير", "Good Morning");
                    if (hour < 18) return tr("مساء الخير", "Good Afternoon");
                    return tr("مساء الخير", "Good Evening");
                  })()}
                </p>
                <h2 className="text-lg lg:text-xl font-black text-amber-300 truncate mt-0.5">
                  {user?.user_metadata?.full_name || student?.profile?.full_name || user?.email?.split('@')[0] || 'Member'}
                </h2>
                {activePackage && (
                  <Badge className="mt-1.5 bg-white/20 text-white hover:bg-white/30 border-white/20 text-[10px] font-bold">
                    {isRtl ? (activePackage.name_ar || activePackage.name) : activePackage.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Middle Card: Total Balance */}
            <div className="md:col-span-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-200">
                  {t('wallet.totalBalance', tr("إجمالي الرصيد", "Total Balance"))}
                </span>
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 text-blue-200 hover:text-white transition-colors"
                  title={showBalance ? (tr("إخفاء الرصيد", "Hide Balance")) : (tr("إظهار الرصيد", "Show Balance"))}
                >
                  {showBalance ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>

              <div className="my-2">
                <h3 className="text-2xl lg:text-3xl xl:text-4xl font-black text-white font-mono tracking-tight">
                  {showBalance ? (
                    isAlgeria
                      ? `${convertToLocal(wallet.balance || 0).toLocaleString()} DZD`
                      : isMorocco
                        ? `${convertToLocal(wallet.balance || 0).toLocaleString()} MAD`
                        : `$${Number(wallet.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : '••••••'}
                </h3>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-[11px] text-blue-200">
                <Button
                  size="sm"
                  onClick={() => navigate('/student/wallet')}
                  className="h-7 px-3 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-lg border border-white/20"
                >
                  <Wallet className="h-3.5 w-3.5 mr-1 rtl:ml-1" />
                  {tr("فتح المحفظة", "Open Wallet")}
                </Button>
              </div>
            </div>

            {/* Right Card: Earnings Breakdown */}
            <div className="md:col-span-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-blue-200 block">
                    {tr("العمولات", "Commissions")}
                  </span>
                  <span className="text-base lg:text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                    {showBalance ? (
                      isAlgeria
                        ? `${convertToLocal(wallet.balance || 0).toLocaleString()} DZD`
                        : isMorocco
                          ? `${convertToLocal(wallet.balance || 0).toLocaleString()} MAD`
                          : `$${Number(wallet.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : '••••'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-blue-200 block">
                    {tr("المكافآت", "Bonus")}
                  </span>
                  <span className="text-base lg:text-lg font-black text-fuchsia-300 font-mono mt-0.5 block">
                    {showBalance ? (
                      isAlgeria
                        ? `${convertToLocal(wallet.totalEarned || 0).toLocaleString()} DZD`
                        : isMorocco
                          ? `${convertToLocal(wallet.totalEarned || 0).toLocaleString()} MAD`
                          : `$${Number(wallet.totalEarned || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                    ) : '••••'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-blue-200">{tr("الرصيد الأساسي:", "Main Balance:")}</span>
                <span className="font-bold text-white font-mono">
                  {showBalance ? (
                    isAlgeria
                      ? `${convertToLocal(wallet.balance || 0).toLocaleString()} DZD`
                      : isMorocco
                        ? `${convertToLocal(wallet.balance || 0).toLocaleString()} MAD`
                        : `$${Number(wallet.balance || 0).toFixed(2)}`
                  ) : '••••'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. QUICK ACTIONS TILES GRID (مطابقة تماماً لصفحات القائمة الجانبية) */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-5 sm:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {tr("الإجراءات السريعة وأقسام المنصة", "Quick Actions & Sections")}
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {tr("الوصول المباشر لكافة صفحات المنصة", "Direct access to all platform pages")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4">
            {quickNavCards.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.to}
                  onClick={() => navigate(action.to)}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 active:scale-95 transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${action.color} text-white flex items-center justify-center shadow-md ${action.shadow} mb-2.5 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-6 w-6 stroke-[2.2]" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight text-center line-clamp-1">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. MORE ACTIONS / SECONDARY MODULES (أقسام تفصيلية متناسقة) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT 6 COLS: Affiliate System + Current Package details */}
          <div className="lg:col-span-6 space-y-5">
            {/* Referral & Team Card */}
            {referralLink && (
              <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tr("نظام الشركاء ورابط الإحالة", "Referral & Partner Network")}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {tr("شارك رابطك لبناء فريقك والحصول على عمولات الشجرة", "Share your link to grow your team and earn commissions")}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-950/60 border-blue-200 text-xs font-bold">
                    {totalTeam} {tr("عضو", "Members")}
                  </Badge>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{tr("الأعضاء المباشرين (Gen 1)", "Direct Referrals")}</span>
                      <strong className="text-base font-black text-slate-900 dark:text-white">{directReferrals}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] text-slate-400 block">{tr("إجمالي الفريق", "Total Team Size")}</span>
                      <strong className="text-base font-black text-blue-600">{totalTeam}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl text-xs">
                    <span className="text-slate-500 font-mono font-bold text-xs truncate max-w-xs">{affiliateCode}</span>
                    <button
                      onClick={() => copyToClipboard(affiliateCode, false)}
                      className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:text-blue-600 flex items-center gap-1 font-bold text-[11px]"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? (tr("تم النسخ", "Copied")) : (tr("نسخ الكود", "Copy Code"))}</span>
                    </button>
                  </div>

                  <Button
                    onClick={() => copyToClipboard(referralLink, true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl h-10 text-xs flex items-center justify-center gap-2 shadow-sm shadow-blue-500/20"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLink ? (tr("تم نسخ الرابط بنجاح!", "Referral Link Copied!")) : (tr("نسخ رابط الإحالة ومشاركته", "Copy and Share Referral Link"))}</span>
                  </Button>
                </div>
              </Card>
            )}

            {/* Current Rank Card */}
            <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {tr("رتبتي والترقيات", "Current Rank & Progression")}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isRtl ? (currentRank.name_ar || currentRank.name) : currentRank.name} (Level {currentRank.level || 1})
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/student/ranks')}
                  className="text-xs text-primary font-bold hover:bg-primary/10 rounded-xl"
                >
                  <span>{tr("عرض السلم", "View All")}</span>
                  <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {nextRank ? (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{tr("المبيعات المباشرة المطلوبة", "Direct Sales")}: {ranksUserStats.directSales} / {nextRank.min_direct_sales}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{salesProgress}%</span>
                      </div>
                      <Progress value={salesProgress} className="h-2 rounded-full" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{tr("حجم مبيعات الفريق المطلوب", "Team Turnover")}: ${Number(ranksUserStats.teamTurnover || 0).toFixed(2)} / ${Number(nextRank.min_team_turnover).toFixed(2)}</span>
                        <span className="font-bold text-slate-900 dark:text-white">{turnoverProgress}%</span>
                      </div>
                      <Progress value={turnoverProgress} className="h-2 rounded-full" />
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    <span>{tr("أنت في أعلى رتبة بالمنصة! تهانينا لك!", "You have reached the highest platform rank!")}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT 6 COLS: Courses / Modules & Live Meetings */}
          <div className="lg:col-span-6 space-y-5">
            {/* Courses / Modules */}
            {modules && modules.length > 0 && (
              <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tr("المقررات والدورات الأكاديمية", "Enrolled Courses & Tracks")}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {tr("متابعة المواد الدراسية والمحاضرات", "Access your active modules and lectures")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/student/academy')}
                    className="text-xs text-primary font-bold hover:bg-primary/10 rounded-xl"
                  >
                    <span>{tr("عرض الكل", "View All")}</span>
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {modules.slice(0, 3).map((mod: any) => (
                    <div
                      key={mod.id}
                      onClick={() => navigate(`/student/courses/${mod.id}`)}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                          {mod.name}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {mod.specialty_name || (tr("مسار تعليمي", "Learning Track"))}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Upcoming Zoom Sessions */}
            {meetings && meetings.length > 0 && (
              <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tr("اللقاءات المباشرة القادمة", "Upcoming Live Sessions")}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {tr("انضم إلى جلسات البث المباشر والتدريب", "Join live interactive webinars and workshops")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/student/meetings')}
                    className="text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-xl"
                  >
                    <span>{tr("عرض الكل", "View All")}</span>
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {meetings.slice(0, 2).map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between"
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
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl h-8 px-3"
                      >
                        {tr("دخول", "Join")}
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* News and Announcements */}
            {news && news.length > 0 && (
              <Card className="rounded-[28px] border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {tr("أحدث الأخبار والإعلانات", "Latest Announcements")}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {tr("مستجدات المنصة والفعاليات", "Platform news and community updates")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {news.slice(0, 2).map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                    >
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AIAssistant role="student" />
    </DashboardLayout>
  );
}
