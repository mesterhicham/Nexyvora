import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { affiliateService, bonusPoolService } from '@/services/apiService';
import { 
  Award, 
  Crown, 
  Shield, 
  Gem, 
  User, 
  CheckCircle2, 
  Lock,
  Sparkles,
  Coins,
  Calendar,
  TrendingUp,
  Clock
} from 'lucide-react';
import { toast } from "sonner";

export default function StudentRanks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language;

  const [data, setData] = useState<any>(null);
  const [poolsData, setPoolsData] = useState<any[]>([]);
  const [pastPayouts, setPastPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const [res, poolRes] = await Promise.all([
        affiliateService.getRanks(),
        bonusPoolService.getStudentBonusPools().catch(() => ({ pools: [], pastPayouts: [] }))
      ]);
      setData(res);
      setPoolsData(poolRes?.pools || []);
      setPastPayouts(poolRes?.pastPayouts || []);
    } catch (err) {
      toast.error('Failed to load ranks');
    } finally {
      setLoading(false);
    }
  };

  const ranks = data?.ranks || [];
  const userStats = data?.userStats || {
    directSales: 0,
    teamTurnover: 0,
    currentRank: { name: 'Member', name_ar: 'عضو', level: 1, color_hex: '#94a3b8' },
    nextRank: null
  };

  const currentRank = userStats.currentRank;
  const nextRank = userStats.nextRank;

  // Calculate progress % towards next rank
  let salesProgress = 100;
  let turnoverProgress = 100;

  if (nextRank) {
    salesProgress = Math.min(100, Math.round((userStats.directSales / (nextRank.min_direct_sales || 1)) * 100));
    turnoverProgress = Math.min(100, Math.round((userStats.teamTurnover / (Number(nextRank.min_team_turnover) || 1)) * 100));
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

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            {t('ranks.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('ranks.subtitle')}
          </p>
        </div>

        {/* Current Rank Banner */}
        <Card className="rounded-2xl border-2 border-primary/30 bg-linear-to-r from-primary/10 via-purple-500/5 to-white dark:from-slate-900 dark:to-slate-800 p-6 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className={`flex items-center gap-4 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div 
                className="h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0"
                style={{ backgroundColor: currentRank.color_hex || '#7c3aed' }}
              >
                {(() => {
                  const Icon = getRankIcon(currentRank.level);
                  return <Icon className="h-8 w-8" />;
                })()}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">
                  {t('ranks.currentRank')}:
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {isRtl ? (currentRank.name_ar || currentRank.name) : (currentRank.name || currentRank.name_ar)}
                </h2>
                <p className="text-xs text-slate-500">
                  {t('packages.level')} {currentRank.level} • {isRtl ? 'مبيعاتك المباشرة' : lang === 'fr' ? 'Ventes directes' : 'Direct sales'}: {userStats.directSales} • {isRtl ? 'حجم فريقك' : lang === 'fr' ? 'Volume d\'équipe' : 'Team volume'}: ${userStats.teamTurnover.toFixed(2)} USD
                </p>
              </div>
            </div>

            {nextRank ? (
              <div className="w-full md:w-80 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{t('ranks.nextRank')}: {isRtl ? (nextRank.name_ar || nextRank.name) : (nextRank.name || nextRank.name_ar)}</span>
                  <span className="text-primary font-mono">+${nextRank.reward_bonus} {t('ranks.rewardBonus')}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{t('ranks.directSalesReq')} ({userStats.directSales} / {nextRank.min_direct_sales})</span>
                    <span>{salesProgress}%</span>
                  </div>
                  <Progress value={salesProgress} className="h-2 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{t('ranks.teamTurnoverReq')} (${userStats.teamTurnover} / ${nextRank.min_team_turnover})</span>
                    <span>{turnoverProgress}%</span>
                  </div>
                  <Progress value={turnoverProgress} className="h-2 rounded-full" />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 text-amber-600 font-bold text-xs flex items-center gap-2">
                <Crown className="h-5 w-5" />
                {isRtl ? 'لقد بلغت أعلى رتبة في المنصة! تهانينا لك!' : lang === 'fr' ? 'Félicitations ! Vous avez atteint le rang suprême !' : 'Congratulations! You have reached the highest rank!'}
              </div>
            )}
          </div>
        </Card>

        {/* Global Leadership Bonus Pools (Diamond Pool, etc.) */}
        {poolsData.length > 0 && (
          <div className="space-y-4">
            <div className={`space-y-1 ${isRtl ? 'text-right' : 'text-left'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{tr("الأحواض القيادية العالمية", "Global Leadership Bonus Pools")}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                {tr("أحواض أرباح القيادة الشهرية", "Monthly Leadership Profit Pools")}
              </h2>
              <p className="text-xs text-slate-500 max-w-xl">
                {tr("تقاسم أرباح المنصة المتبقية شهرياً بالتساوي بين القادة المؤهلين لكل رتبة.", "Share in platform monthly profits equally among qualified leaders for each rank.")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {poolsData.map((pool: any) => {
                const isEligible = pool.is_eligible;
                const progress = pool.progress;

                return (
                  <Card 
                    key={pool.id}
                    className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 shadow-xl"
                  >
                    {/* Top Glow & Details */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-400" />
                          <h3 className="text-lg font-black text-amber-400">
                            {isRtl ? pool.name_ar : pool.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300">
                          {tr("مكافأة ${pool.pool_percentage}% شهرياً من صافي أرباح المنصة", "${pool.pool_percentage}% monthly share from net platform profits")}
                        </p>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          <Gem className="w-3.5 h-3.5" />
                          <span>{pool.rank_name_ar || pool.rank_name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Pot Display */}
                    <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block">{tr("قيمة الحوض التقديرية الحالية", "Current Estimated Pool Pot")}</span>
                        <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1 mt-0.5">
                          <span>${pool.estimated_current_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className="text-xs font-semibold text-slate-400">USD</span>
                        </div>
                        {pool.current_rollover > 0 && (
                          <span className="text-xs text-amber-300 font-medium mt-1 block">
                            {tr("(يتضمن $${pool.current_rollover.toFixed(2)} مرحل من الشهر السابق)", "(Includes $${pool.current_rollover.toFixed(2)} rolled over)")}
                          </span>
                        )}
                      </div>

                      <div className="sm:text-left text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tr("متبقي ${pool.days_left} أيام على نهاية الشهر", "${pool.days_left} days left this month")}</span>
                        </div>
                        <span className="text-slate-400 block text-[11px]">
                          {tr("التوزيع بالتساوي بين المؤهلين", "Split equally among qualifiers")}
                        </span>
                      </div>
                    </div>

                    {/* Eligibility Status */}
                    {isEligible ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>
                          {tr("مبروك! أنت مؤهل رسمياً لاستلام حصتك من أرباح هذا الحوض بنهاية هذا الشهر 🎉", "Congratulations! You are officially eligible to receive your share at the end of this month! 🎉")}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-semibold">{tr("مؤشر أهليتك لدخول هذا الحوض:", "Qualification Progress:")}</span>
                          <span className="text-amber-400 font-bold">
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
                          <Progress value={progress?.direct_percentage} className="h-1.5 bg-slate-800" />
                          {progress?.direct_needed > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {tr("ينقصك ${progress.direct_needed} إحالة مباشرة", "${progress.direct_needed} direct sales needed")}
                            </span>
                          )}
                        </div>

                        {/* Team Turnover Requirement */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400">
                              {tr("مبيعات الفريق:", "Team Turnover:")} ${progress?.user_team_turnover?.toLocaleString()} / ${progress?.min_team_turnover?.toLocaleString()}
                            </span>
                            <span className="font-semibold text-slate-300">{progress?.turnover_percentage}%</span>
                          </div>
                          <Progress value={progress?.turnover_percentage} className="h-1.5 bg-slate-800" />
                          {progress?.turnover_needed > 0 && (
                            <span className="text-[10px] text-slate-400 block">
                              {tr("ينقصك $${progress.turnover_needed.toLocaleString()} USD مبيعات فريق", "$${progress.turnover_needed.toLocaleString()} team turnover needed")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Ranks Ladder */}
        <div className="space-y-4">
          <h2 className={`text-xl font-bold text-slate-900 dark:text-white ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'سلّم الرتب وشروط الوصول والمكافآت' : lang === 'fr' ? 'Échelle des rangs et conditions d\'accès' : 'Career Ranks & Qualification Milestones'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ranks.map((r: any) => {
              const Icon = getRankIcon(r.level);
              const isAchieved = userStats.directSales >= r.min_direct_sales && userStats.teamTurnover >= Number(r.min_team_turnover);
              const isCurrent = currentRank.level === r.level;

              return (
                <Card 
                  key={r.id} 
                  className={`rounded-2xl border transition-all p-5 space-y-4 relative ${
                    isCurrent 
                      ? 'border-2 border-primary shadow-lg shadow-primary/10 bg-white dark:bg-slate-900' 
                      : isAchieved 
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-90'
                  }`}
                >
                  {isCurrent && (
                    <div className={`absolute -top-3 ${isRtl ? 'left-4' : 'right-4'}`}>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white shadow-xs">
                        {t('ranks.currentRank')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: r.color_hex || '#7c3aed' }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {isRtl ? (r.name_ar || r.name) : (r.name || r.name_ar)}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {isRtl ? (r.name || r.name_ar) : (r.name_ar || r.name)} • {t('packages.level')} {r.level}
                        </p>
                      </div>
                    </div>
                    {isAchieved ? (
                      <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('ranks.directSalesReq')}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {r.min_direct_sales}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">{t('ranks.teamTurnoverReq')}:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ${r.min_team_turnover} USD
                      </span>
                    </div>
                    <div className="flex justify-between pt-0.5 text-primary font-bold">
                      <span>{tr("الأجيال المفتوحة", "Unlocked Generations")}:</span>
                      <span className="font-black text-xs">
                        {r.unlocked_generations === 0 
                          ? (tr("المباشر فقط", "Direct only"))
                          : r.unlocked_generations === 10
                          ? (tr("جميع الأجيال (1-10)", "All 10 Generations"))
                          : (tr("الأجيال (1-${r.unlocked_generations})", "Gens 1-${r.unlocked_generations}"))}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 text-emerald-600 font-bold">
                      <span>{t('ranks.rewardBonus')}:</span>
                      <span className="font-black text-sm">
                        {Number(r.reward_bonus) > 0 ? `+$${r.reward_bonus} USD` : '-'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
