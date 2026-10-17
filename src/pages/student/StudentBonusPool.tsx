import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { bonusPoolService } from '@/services/apiService';
import { 
  Coins, 
  Sparkles, 
  Award, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Users, 
  History, 
  Calendar, 
  ShieldCheck, 
  ArrowUpRight, 
  Gem, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentBonusPool() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'pools' | 'my_payouts' | 'global_history'>('pools');

  useEffect(() => {
    loadBonusPools();
  }, []);

  const loadBonusPools = async () => {
    try {
      setLoading(true);
      const res = await bonusPoolService.getStudentBonusPools();
      setData(res);
    } catch (err: any) {
      toast.error(tr("فشل تحميل بيانات الأحواض المالية", "Failed to load bonus pools"));
    } finally {
      setLoading(false);
    }
  };

  const pools = data?.pools || [];
  const myPayouts = data?.myPayouts || [];
  const globalHistory = data?.globalHistory || [];
  const totalEarned = Number(data?.totalEarnedFromPools || 0);
  const financials = data?.financialsSummary || {};
  const unlockedCount = pools.filter((p: any) => p.is_unlocked).length;

  // Compute total estimated monthly share across all unlocked pools
  const totalEstimatedMonthlyShare = pools
    .filter((p: any) => p.is_unlocked)
    .reduce((acc: number, curr: any) => acc + Number(curr.estimated_share || 0), 0);

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#170529] via-[#2e1065] to-[#170529] p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{tr("نظام الأحواض المالية للقيادة", "Global Leadership Bonus Pools")}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                BONUS POOL
              </h1>
              <p className="text-sm text-purple-200/90 max-w-2xl leading-relaxed">
                {tr("شارك في أرباح المنصة الشهرية! يتم فتح الأحواض تلقائياً فور تحقيق شروط الرتبة المؤهلة، وتُقسّم الأرباح بالتساوي بين القادة المؤهلين كل شهر.", "Share in platform monthly profits! Pools are automatically unlocked once you meet the rank requirements, with profits distributed equally among qualifiers every month.")}
              </p>
            </div>

            {/* Quick Stats Badges */}
            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-amber-500/25 min-w-[130px] shadow-lg">
                <span className="text-xs text-slate-300 block">{tr("أرباحك المستلمة", "Total Earned")}</span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 block font-mono">
                  ${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-amber-300/80 font-bold">USD</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/30 backdrop-blur-md border border-amber-500/25 min-w-[130px] shadow-lg">
                <span className="text-xs text-slate-300 block">{tr("الأحواض المفتوحة", "Unlocked Pools")}</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block font-mono">
                  {unlockedCount} / {pools.length}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-bold">{tr("أحواض نشطة", "Active Pools")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{tr("الحصة التقديرية الحالية", "Est. Monthly Share")}</span>
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white">
              ${totalEstimatedMonthlyShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("للشهر الحالي", "For current month")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{tr("موعد التوزيع القادم", "Next Distribution")}</span>
            </span>
            <p className="text-xl font-black text-amber-500 dark:text-amber-400">
              {financials?.daysLeft || 0} {tr("أيام متبقية", "days left")}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("بنهاية الشهر الميلادي", "End of calendar month")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-500" />
              <span>{tr("مبيعاتك المباشرة", "Your Direct Sales")}</span>
            </span>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">
              {data?.userStats?.directSales || 0} {tr("عضو نشط", "members")}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("باقات مفعلة", "Active packages")}
            </span>
          </Card>

          <Card className="p-4 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>{tr("مبيعات فريقك", "Team Turnover")}</span>
            </span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              ${Number(data?.userStats?.teamTurnover || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-slate-400 block">
              {tr("إجمالي حجم الفريق", "Total team volume")}
            </span>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap">
          <Button
            onClick={() => setActiveTab('pools')}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
              activeTab === 'pools'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{tr("الأحواض وحالة الفتح التلقائي", "Bonus Pools")}</span>
          </Button>

          <Button
            onClick={() => setActiveTab('my_payouts')}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
              activeTab === 'my_payouts'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{tr(`سجل أرباحي (${myPayouts.length})`, `My Payouts (${myPayouts.length})`)}</span>
          </Button>

          <Button
            onClick={() => setActiveTab('global_history')}
            className={`flex items-center gap-2 font-bold text-xs sm:text-sm rounded-xl h-10 px-4 transition-all ${
              activeTab === 'global_history'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{tr("أرشيف توزيعات الحوض", "Pool Distribution History")}</span>
          </Button>
        </div>

        {/* TAB 1: POOLS AND AUTO-UNLOCK STATUS */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="mr-3 text-slate-500 text-sm">
                  {tr("جاري تحميل تفاصيل الأحواض المالية...", "Loading bonus pools...")}
                </span>
              </div>
            ) : pools.length === 0 ? (
              <Card className="border-dashed p-12 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold">{tr("لا توجد أحواض مالية مفعلة حالياً", "No active bonus pools")}</h3>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pools.map((pool: any) => {
                  const isUnlocked = pool.is_unlocked;
                  const progress = pool.progress;

                  return (
                    <Card
                      key={pool.id}
                      className={`relative overflow-hidden rounded-3xl border-2 transition-all p-6 shadow-xl ${
                        isUnlocked 
                          ? 'border-amber-400/60 bg-gradient-to-br from-[#1b0633] via-[#2e1065] to-[#4c1d95] text-white shadow-2xl shadow-purple-950/40'
                          : 'border-slate-800 dark:border-slate-800/80 bg-gradient-to-br from-[#120422] via-[#1e0836] to-[#0d0216] text-white shadow-xl shadow-purple-950/30'
                      }`}
                    >
                      {/* Header with Title and Unlock Status Badge */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl font-black text-amber-400">
                              {isRtl ? pool.name_ar : pool.name}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              {pool.pool_percentage}% {tr("شهرياً", "Monthly")}
                            </span>
                          </div>
                          <p className="text-xs text-purple-200/80 font-medium">
                            {tr(`مخصص لرتبة: ${pool.rank_name_ar || pool.rank_name}`, `Target Rank: ${pool.rank_name || pool.rank_name_ar}`)}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {isUnlocked ? (
                            <Badge className="bg-emerald-500 text-white font-black px-3 py-1 text-xs shadow-md shadow-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                              <Unlock className="w-3.5 h-3.5" />
                              <span>{tr("مفتوح تلقائياً ومفعل", "UNLOCKED")}</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-600 bg-slate-800/80 text-slate-300 font-semibold px-3 py-1 text-xs flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                              <span>{tr("مغلق - بحاجة للترقية", "LOCKED")}</span>
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Pot Values Display */}
                      <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-xs text-slate-400 block">{tr("قيمة الحوض التقديرية الحالية", "Current Estimated Pot")}</span>
                          <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1 mt-0.5">
                            <span>${pool.estimated_current_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            <span className="text-xs font-semibold text-slate-400">USD</span>
                          </div>
                          {pool.current_rollover > 0 && (
                            <span className="text-xs text-amber-300 font-medium mt-1 block">
                              {tr(`(يتضمن $${Number(pool.current_rollover || 0).toFixed(2)} مرحل من الشهر السابق)`, `(Includes $${Number(pool.current_rollover || 0).toFixed(2)} rollover)`)}
                            </span>
                          )}
                        </div>

                        <div className="sm:text-left text-xs text-slate-300 space-y-1">
                          <span className="text-slate-400 block">{tr("حصتك التقديرية", "Your Est. Share")}</span>
                          <span className="text-lg sm:text-xl font-bold text-emerald-400 block">
                            ${pool.estimated_share?.toFixed(2)} USD
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            ({pool.total_qualifiers} {tr("قادة مؤهلين حالياً", "qualifiers")})
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Unlock Progress / Celebration */}
                      {isUnlocked ? (
                        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span className="text-sm">
                              {tr("أنت مؤهل رسمياً لهذا الحوض! 🎉", "You are officially qualified for this pool! 🎉")}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-300/80 font-normal leading-relaxed">
                            {tr("لقد حققت جميع متطلبات الرتبة بنجاح. سيتم إيداع حصتك تلقائياً في محفظتك في نهاية الشهر الحالي.", "You have met all rank requirements. Your share will be automatically credited to your wallet at the end of the month.")}
                          </p>
                          {pool.user_earned_total > 0 && (
                            <div className="pt-1 text-[11px] text-emerald-200 font-semibold border-t border-emerald-500/20">
                              {tr(`إجمالي ما استلمته من هذا الحوض سابقاً: $${Number(pool.user_earned_total || 0).toFixed(2)} USD`, `Total previously earned: $${Number(pool.user_earned_total || 0).toFixed(2)} USD`)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="font-semibold">{tr("شروط الفتح التلقائي للحوض:", "Unlock Requirements:")}</span>
                            <span className="text-amber-400 font-bold" style={{ color: pool.rank_color || '#eab308' }}>
                              {isRtl ? `رتبة ${pool.rank_name_ar}` : pool.rank_name}
                            </span>
                          </div>

                          {/* Direct Sales Requirement */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">
                                {tr("المبيعات المباشرة:", "Direct Sales:")} {progress?.user_direct_sales} / {progress?.min_direct_sales}
                              </span>
                              <span className="font-semibold text-slate-300">{progress?.direct_percentage}%</span>
                            </div>
                            <Progress value={progress?.direct_percentage} className="h-2 bg-slate-800" />
                            {progress?.direct_needed > 0 && (
                              <span className="text-[10px] text-amber-300/90 block font-medium">
                                {tr(`ينقصك ${progress.direct_needed} إحالة مباشرة لفتح الحوض`, `${progress.direct_needed} direct sales needed to unlock`)}
                              </span>
                            )}
                          </div>

                          {/* Team Turnover Requirement */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-400">
                                {tr("مبيعات الفريق:", "Team Turnover:")} ${progress?.user_team_turnover?.toLocaleString()} / ${progress?.min_team_turnover?.toLocaleString()} USD
                              </span>
                              <span className="font-semibold text-slate-300">{progress?.turnover_percentage}%</span>
                            </div>
                            <Progress value={progress?.turnover_percentage} className="h-2 bg-slate-800" />
                            {progress?.turnover_needed > 0 && (
                              <span className="text-[10px] text-amber-300/90 block font-medium">
                                {tr(`ينقصك $${Number(progress.turnover_needed || 0).toLocaleString()} USD مبيعات فريق`, `$${Number(progress.turnover_needed || 0).toLocaleString()} team turnover needed`)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY PAYOUTS HISTORY */}
        {activeTab === 'my_payouts' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>{tr("سجل أرباحي ومكافآتي من الأحواض المالية", "My Bonus Pool Earnings History")}</span>
              </CardTitle>
              <CardDescription>
                {tr("جميع الحصص الشهرية التي تم إيداعها مباشرة في محفظتك من أحواض القيادة.", "All monthly pool bonuses credited directly to your wallet.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {myPayouts.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30 text-indigo-500" />
                  <p className="font-semibold">{tr("لم تستلم أي مكافأة من الأحواض حتى الآن", "No bonus payouts received yet")}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {tr("قم بالترقية والوصول إلى الرتبة المؤهلة لفتح الحوض واستلام حصتك الشهرية.", "Reach the qualifying rank to unlock the pool and receive your monthly share.")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">{tr("الدورة الشهرية", "Period")}</th>
                        <th className="p-3.5">{tr("الحوض المالي", "Pool Name")}</th>
                        <th className="p-3.5">{tr("المبلغ المستلم", "Amount")}</th>
                        <th className="p-3.5">{tr("رقم المعاملة", "Reference")}</th>
                        <th className="p-3.5">{tr("الحالة", "Status")}</th>
                        <th className="p-3.5 text-left">{tr("تاريخ الإيداع", "Date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {myPayouts.map((py: any) => (
                        <tr key={py.payout_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3.5 font-bold font-mono text-xs">
                            {py.period_month} / {py.period_year}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                            {isRtl ? py.pool_name_ar : py.pool_name} ({py.pool_percentage}%)
                          </td>
                          <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                            +${Number(py.amount).toFixed(2)} USD
                          </td>
                          <td className="p-3.5 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                            {py.reference_id || `POOL-${py.period_year}-${py.period_month}`}
                          </td>
                          <td className="p-3.5">
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                              {tr("تم الإيداع بالمحفظة", "Credited to Wallet")}
                            </Badge>
                          </td>
                          <td className="p-3.5 text-left text-xs text-slate-500">
                            {new Date(py.created_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: GLOBAL POOL DISTRIBUTION HISTORY */}
        {activeTab === 'global_history' && (
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span>{tr("أرشيف توزيعات أحواض المنصة الشهرية", "Platform Pool Distributions Archive")}</span>
              </CardTitle>
              <CardDescription>
                {tr("سجل شفاف وموثق لجميع مبالغ الأحواض المصروفة والمرحلة شهرياً على مستوى المنصة.", "Transparent history of all monthly platform pool distributions and rollovers.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {globalHistory.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{tr("لا توجد توزيعات سابقة مسجلة في الأرشيف", "No historical pool distributions recorded yet")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">{tr("الدورة", "Period")}</th>
                        <th className="p-3.5">{tr("الحوض", "Pool")}</th>
                        <th className="p-3.5">{tr("صافي أرباح المنصة", "Net Margin")}</th>
                        <th className="p-3.5">{tr("المبلغ المرحل", "Rollover")}</th>
                        <th className="p-3.5">{tr("إجمالي الحوض", "Total Pot")}</th>
                        <th className="p-3.5">{tr("المستفيدون", "Qualifiers")}</th>
                        <th className="p-3.5">{tr("حصة القائد", "Share/Leader")}</th>
                        <th className="p-3.5">{tr("الحالة", "Status")}</th>
                        <th className="p-3.5 text-left">{tr("تاريخ التوزيع", "Date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {globalHistory.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3.5 font-bold font-mono text-xs">
                            {item.period_month} / {item.period_year}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                            {isRtl ? item.pool_name_ar : item.pool_name} ({item.pool_percentage}%)
                          </td>
                          <td className="p-3.5">
                            ${Number(item.net_margin).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-amber-600 font-medium">
                            ${Number(item.rollover_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                            ${Number(item.total_pool_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5">
                            {item.eligible_leaders_count} {tr("قادة", "leaders")}
                          </td>
                          <td className="p-3.5 font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(item.share_per_leader).toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            {item.status === 'distributed' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {tr("موزّع", "Distributed")}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                {tr("مُرحّل", "Rolled Over")}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 text-left text-xs text-slate-500">
                            {item.executed_at ? new Date(item.executed_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </DashboardLayout>
  );
}
