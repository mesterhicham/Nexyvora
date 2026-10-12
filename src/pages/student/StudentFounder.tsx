import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { founderService } from '@/services/apiService';
import { 
  Crown, 
  Sparkles, 
  Award, 
  Coins, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  Check, 
  ShieldCheck, 
  DollarSign, 
  Loader2,
  Gift,
  Star,
  Zap,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function StudentFounder() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, overviewRes] = await Promise.all([
        founderService.getMyStatus(),
        founderService.getOverview()
      ]);
      setData(statusRes);
      setOverview(overviewRes);
    } catch (err: any) {
      toast.error(t('founders.loadError', 'Failed to load Founders Club data'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          <p className="text-xs font-bold text-slate-400">{t('common.loading', 'Loading Founders Club data...')}</p>
        </div>
      </DashboardLayout>
    );
  }

  const isFounder = data?.isFounder || false;
  const member = data?.member;
  const payouts = data?.payouts || [];
  const totalEarned = data?.totalEarned || 0;

  // Non-founder progress
  const directSales30d = data?.directSalesLast30Days || 0;
  const targetSales = data?.targetSales || 5000;
  const progressPct = data?.progressPct || 0;
  const amountRemaining = data?.amountRemaining || 0;
  const recentSales = data?.recentDirectSales || [];

  // Seats info
  const totalSeats = data?.totalSeats || overview?.settings?.totalSeats || 100;
  const seatsTaken = data?.seatsTaken || overview?.seatsTaken || 0;
  const seatsRemaining = data?.seatsRemaining !== undefined ? data?.seatsRemaining : (totalSeats - seatsTaken);
  const isSoldOut = data?.isSoldOut || seatsRemaining <= 0;
  const poolPercentage = data?.poolPercentage || 2.0;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 pb-12 max-w-5xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-600 via-amber-500 to-amber-700 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-amber-900/20 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black uppercase tracking-wider">
                <Crown className="h-3.5 w-3.5 text-amber-200" />
                <span>{t('founders.clubTitle', 'Exclusive Founders Club')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {t('founders.clubSubtitle', `Monthly Founders Profit Pool (${poolPercentage}%) — Limited Lifetime Seats`)}
              </h1>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                {t('founders.directSalesDesc', `Exclusive milestone for the first ${totalSeats} leaders to achieve $5,000 USD in personal direct sales within 30 days. Secure a permanent lifetime seat and share 2% of platform net profits every month!`)}
              </p>
            </div>

            {/* Live Seat Badge */}
            <div className="shrink-0 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center min-w-[180px]">
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-100 font-bold mb-1">
                <Flame className="h-4 w-4 text-amber-300 animate-pulse" />
                <span>{t('founders.seatsRemaining', 'Seats Remaining')}</span>
              </div>
              <div className="text-3xl font-black text-white">
                {seatsRemaining} <span className="text-sm font-normal text-amber-200">/ {totalSeats}</span>
              </div>
              <div className="text-[11px] text-amber-200 font-medium mt-1">
                {isSoldOut ? t('founders.soldOut', 'Sold Out') : `${seatsTaken} ${t('founders.seatsClaimed', 'seats claimed so far')}`}
              </div>
            </div>
          </div>
        </div>

        {/* ─── CASE 1: QUALIFIED FOUNDER VIEW ─── */}
        {isFounder ? (
          <div className="space-y-6">
            {/* Golden Luxury Founder Pass */}
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-700 via-yellow-600 to-amber-800 p-8 text-white shadow-2xl border-2 border-yellow-300/40">
              <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-yellow-300/30 via-transparent to-transparent blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-yellow-300/60 flex items-center justify-center text-yellow-300 shadow-inner shrink-0">
                    <Crown className="h-10 w-10 drop-shadow-md" />
                  </div>
                  <div className="space-y-1 text-center ltr:md:text-left rtl:md:text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-400/20 text-yellow-200 text-[10px] font-black uppercase tracking-wider border border-yellow-300/30">
                      <Star className="h-3 w-3 fill-yellow-300" />
                      <span>{t('founders.statusActive', 'Official Lifetime Founder Member')}</span>
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      {t('founders.congratulationsFounder', `Congratulations! You hold one of the 100 Founder seats.`)}
                    </h2>
                    <p className="text-xs text-yellow-100">
                      {t('founders.lifetimeShareDesc', `Your seat is permanently secured. You receive a monthly equal share of the 2% profit pool credited directly to your wallet.`)}
                    </p>
                  </div>
                </div>

                <div className="p-4 px-6 rounded-2xl bg-black/20 backdrop-blur-md border border-yellow-300/40 text-center">
                  <span className="text-[11px] font-bold text-yellow-200 uppercase tracking-wider block mb-0.5">
                    {t('founders.seatNumber', 'Your Seat #')}
                  </span>
                  <span className="text-4xl font-black text-yellow-300 drop-shadow-md tracking-tight">
                    #{String(member?.seatNumber).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] text-yellow-100 block mt-1 font-mono">
                    {t('founders.qualifiedDate', 'Qualified At')}: {new Date(member?.qualifiedAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Founder Financial Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.totalEarned', 'Total Founder Earnings')}</span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${totalEarned.toFixed(2)} <span className="text-xs font-normal text-slate-400">USD</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">{t('wallet.readyToUse', 'Deposited & credited to your wallet')}</span>
              </Card>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.salesVolumeCol', 'Direct Sales Volume Achieved')}</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ${Number(member?.directSalesAchieved || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">{t('founders.salesAtQualification', 'Sales volume at seat qualification')}</span>
              </Card>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.poolPercentage', 'Monthly Profit Pool Share')}</span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {poolPercentage}% <span className="text-xs font-normal text-slate-400">{t('founders.equalShare', 'Equally Shared')}</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">{t('founders.distributedMonthly', 'Distributed at the end of each calendar month')}</span>
              </Card>
            </div>

            {/* Payouts History Table */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  {t('founders.payoutHistoryTitle', 'Founder Pool Distribution History')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('founders.payoutHistoryDesc', 'All monthly shares deposited into your wallet from the 2% net profit pool.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {payouts.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 space-y-2">
                    <Clock className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="text-xs font-bold">{t('founders.noPayoutsYet', 'No distributions received yet. The 2% profit pool distributes at the end of each calendar month.')}</p>
                    <p className="text-[11px]">{t('founders.autoDepositNotice', 'Your share will be automatically deposited into your wallet once monthly distribution is executed.')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-4 font-bold">{t('founders.month', 'Month / Year')}</th>
                          <th className="p-4 font-bold">{t('founders.poolAmount', 'Total Pool')}</th>
                          <th className="p-4 font-bold">{t('founders.distBeneficiariesCol', 'Founders Count')}</th>
                          <th className="p-4 font-bold">{t('founders.shareAmount', 'Your Received Share')}</th>
                          <th className="p-4 font-bold">{t('founders.payoutDate', 'Payout Date')}</th>
                          <th className="p-4 font-bold">{t('founders.payoutStatus', 'Status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {payouts.map((p: any) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                              {p.period_month} / {p.period_year}
                            </td>
                            <td className="p-4">${Number(p.total_pool_amount || 0).toFixed(2)}</td>
                            <td className="p-4">{p.founders_count} {t('founders.members', 'founders')}</td>
                            <td className="p-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              +${Number(p.amount).toFixed(2)}
                            </td>
                            <td className="p-4 text-slate-500">
                              {new Date(p.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="p-4">
                              <Badge className="rounded-lg text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                                {t('wallet.statusCompleted', 'Credited to Wallet ✓')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ─── CASE 2: ASPIRING CANDIDATE VIEW (PROGRESS TRACKER) ─── */
          <div className="space-y-6">
            {/* Qualification Progress Card */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{t('founders.progressTowardsSeat', 'Your Progress Towards Founder Seat')}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {t('founders.targetSalesGoal', `Achieve $5,000 in Direct Sales & Claim Your Lifetime Seat`)}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {t('founders.rollingWindowNotice', 'Direct personal sales from your direct referrals in the last 30 days are automatically tracked.')}
                  </p>
                </div>

                <div className="text-left rtl:text-right shrink-0">
                  <span className="text-xs font-bold text-slate-400 block mb-0.5">{t('founders.yourDirectSales', 'Your Direct Sales (30 Days)')}</span>
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    ${directSales30d.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ ${targetSales.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{t('founders.progress', 'Progress')}: {progressPct}%</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">
                    {t('founders.remainingSales', 'Remaining')}: ${amountRemaining.toLocaleString()} USD
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div 
                    className="bg-linear-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-700 shadow-xs"
                    style={{ width: `${Math.min(100, Math.max(progressPct, 3))}%` }}
                  />
                </div>
              </div>

              {/* Urgency & Action Call */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {t('founders.urgencyTitle', `Seats are strictly limited (${seatsRemaining} vacant seats remaining)`)}
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                      {t('founders.urgencyDesc', 'Once seat #100 is claimed, the Founder Club doors will permanently close forever.')}
                    </p>
                  </div>
                </div>

                <Link to="/student/team">
                  <Button className="rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shrink-0 px-4">
                    <span>{t('founders.viewDirectTeam', 'View Direct Team Sales')}</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* 4 Exclusive Founder Privileges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Coins className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('founders.lifetimeShare', '2% Lifetime Monthly Profit Share')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('founders.lifetimeShareDesc', 'Receive an equal share of 2% of the platform net profits every month forever.')}
                </p>
              </Card>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <Crown className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('founders.seatNumber', 'Unique Seat # Number')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('founders.seatNumberDesc', 'Permanent seat allocation from 1 to 100 uniquely registered to your profile.')}
                </p>
              </Card>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('founders.exclusiveRecognition', 'Golden Founder VIP Badge')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('founders.exclusiveRecognitionDesc', 'Official distinguished golden Founder badge displayed on your profile and leaderboards.')}
                </p>
              </Card>

              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{t('founders.directBoardAccess', 'Executive Advisory Council')}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('founders.directBoardAccessDesc', 'Direct priority communication channel with company founders for strategic voting.')}
                </p>
              </Card>
            </div>

            {/* Direct Sales in last 30 days breakdown */}
            <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  {t('founders.recentSalesTitle', `Your Recent Direct Sales Contributing to Qualification`)} ({recentSales.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('founders.recentSalesDesc', 'Packages purchased by your direct referrals that contribute towards your $5,000 milestone.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {recentSales.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 space-y-2">
                    <p className="text-xs">{t('founders.noSalesYet', 'No direct sales recorded in the last 30 days yet.')}</p>
                    <p className="text-[11px] text-slate-400">{t('founders.shareReferralHint', 'Share your referral link and build your direct team to reach the $5,000 goal!')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left rtl:text-right">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-3.5 font-bold">{t('founders.buyer', 'Direct Buyer')}</th>
                          <th className="p-3.5 font-bold">{t('founders.package', 'Package')}</th>
                          <th className="p-3.5 font-bold">{t('founders.amount', 'Amount')}</th>
                          <th className="p-3.5 font-bold">{t('founders.date', 'Date')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentSales.map((s: any) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                              {s.buyer_name}
                            </td>
                            <td className="p-3.5">{isRtl ? (s.package_name_ar || s.package_name) : (s.package_name || s.package_name_ar)}</td>
                            <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                              +${Number(s.amount).toFixed(2)}
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                              {new Date(s.purchased_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
