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
  Clock,
  Gift,
  ArrowRight,
  TrendingUp,
  Zap,
  Target,
  ChevronRight,
  Users
} from 'lucide-react';
import { toast } from "sonner";

export default function StudentRanks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language;

  const [data, setData] = useState<any>(null);
  const [poolsData, setPoolsData] = useState<any[]>([]);
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
    } catch (err) {
      toast.error(tr("فشل تحميل بيانات الرتب", "Failed to load ranks"));
    } finally {
      setLoading(false);
    }
  };

  const ranks = data?.ranks || [];
  const userStats = data?.userStats || {
    directSales: 0,
    teamTurnover: 0,
    downlineCount: 0,
    currentRank: { name: 'Member', name_ar: 'عضو مسجل', level: 0, color_hex: '#64748b', logo_url: '/ranks/member.svg' },
    nextRank: null,
    progress: null
  };

  const currentRank = userStats.currentRank;
  const nextRank = userStats.nextRank;
  const progress = userStats.progress;

  const salesCurrent = Number(userStats.teamTurnover || 0);
  const salesReq = nextRank ? Number(nextRank.min_team_turnover || 1) : 1;
  const salesPercent = progress?.sales?.percent !== undefined 
    ? progress.sales.percent 
    : (nextRank ? Math.min(100, Math.round((salesCurrent / salesReq) * 100)) : 100);

  const leadership = progress?.leadership;
  const overallPercent = progress?.overallPercent !== undefined ? progress.overallPercent : salesPercent;

  const getRankLogoElement = (r: any, size = "h-14 w-14") => {
    if (r?.logo_url) {
      return (
        <img 
          src={r.logo_url} 
          alt={r.name || 'Rank'} 
          className={`${size} object-contain drop-shadow-lg`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return <Award className={`${size} text-white`} />;
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-10 pb-16">
        {/* Top Hero Banner - Inspiring Style Matching Reference */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 p-8 sm:p-12 text-center text-white shadow-2xl">
          {/* Subtle Ambient Light Gradients */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-purple-500/20 via-violet-500/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -top-10 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-10 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-black tracking-widest text-amber-400 uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>NEXYVORA • DREAM • LEARN • BUILD • GROW</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200">
              {tr("رحلتك القيادية • مكافآتك الحصرية", "YOUR JOURNEY • YOUR REWARDS")}
            </h1>

            <p className="text-sm sm:text-base text-slate-400 font-medium tracking-wide">
              {tr(
                "أكثر من مجرد عمل • أسلوب حياة يفتح لك آفاقاً لا محدودة من النمو والريادة",
                "More than a business • A lifestyle of possibilities"
              )}
            </p>
          </div>
        </div>

        {/* Current Rank & Next Target Progression Card */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              {/* Current Rank Badge & Info */}
              <div className="flex items-center gap-5">
                <div 
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl flex items-center justify-center p-3 shadow-xl shrink-0 relative"
                  style={{ 
                    backgroundColor: `${currentRank.color_hex || '#0284c7'}22`,
                    border: `2.5px solid ${currentRank.color_hex || '#0284c7'}`,
                    boxShadow: `0 0 30px ${currentRank.color_hex || '#0284c7'}44`
                  }}
                >
                  {getRankLogoElement(currentRank, "h-16 w-16 sm:h-18 sm:w-18")}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase text-white shadow-xs"
                      style={{ backgroundColor: currentRank.color_hex || '#0284c7' }}
                    >
                      {tr(`المستوى ${currentRank.level}`, `LEVEL ${currentRank.level}`)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {tr("رتبتك الحالية المعتمدة", "Your Active Rank")}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {isRtl ? (currentRank.name_ar || currentRank.name) : currentRank.name}
                  </h2>

                  {(currentRank.tagline || currentRank.tagline_ar) && (
                    <p className="text-xs italic text-slate-500 dark:text-slate-400">
                      "{isRtl ? (currentRank.tagline_ar || currentRank.tagline) : (currentRank.tagline || currentRank.tagline_ar)}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      {tr("مبيعات الفريق المحققة:", "Team Sales Volume:")} <strong className="text-slate-900 dark:text-white font-mono">${salesCurrent.toLocaleString()} USD</strong>
                    </span>
                    <span>•</span>
                    <span>
                      {tr("أعضاء شبكتك المباشرة:", "Direct Referrals:")} <strong className="text-slate-900 dark:text-white font-mono">{userStats.directSales}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Milestone Box */}
              {nextRank ? (
                <div className="w-full lg:w-96 p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 via-violet-50/30 to-white dark:from-slate-950 dark:to-slate-800/80 border border-purple-100 dark:border-purple-900/50 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <Target className="w-4 h-4" />
                      {tr("الهدف القادم للترقية:", "Next Rank Milestone:")}
                    </span>
                    <span className="text-slate-900 dark:text-white font-black">
                      {isRtl ? (nextRank.name_ar || nextRank.name) : nextRank.name}
                    </span>
                  </div>

                  {/* Cash Reward & Gift Announcement */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{tr("المكافأة النقدية", "Cash Reward")}</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                        +${Number(nextRank.reward_bonus).toLocaleString()} USD
                      </strong>
                    </div>
                    {(nextRank.gift_name || nextRank.gift_name_ar) && (
                      <div className="text-right">
                        <span className="text-slate-400 block text-[10px]">{tr("الهدية التكريمية", "Exclusive Gift")}</span>
                        <strong className="text-amber-500 font-bold text-xs flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" />
                          {isRtl ? (nextRank.gift_name_ar || nextRank.gift_name) : (nextRank.gift_name || nextRank.gift_name_ar)}
                        </strong>
                      </div>
                    )}
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">{tr("إجمالي التقدم نحو الترقية", "Overall Progress")}</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-mono">{overallPercent}%</span>
                    </div>
                    <Progress value={overallPercent} className="h-2.5 rounded-full" />
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center gap-3">
                  <Crown className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <h4 className="font-black text-base">{tr("تهانينا الاستثنائية!", "Highest Rank Achieved!")}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tr("لقد حققت أعلى رتبة قيادية في سلّم Nexyvora! أنت نموذج ملهم لكل المجتمع.", "You have reached the pinnacle rank of Nexyvora Elite! You are an inspiration.")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Detailed Criteria Checklist for Next Rank */}
            {nextRank && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {tr(`شروط الوصول إلى رتبة ${isRtl ? nextRank.name_ar : nextRank.name}:`, `Qualification Requirements for ${nextRank.name}:`)}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Condition 1: Team Sales */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {salesCurrent >= salesReq ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400">1</div>
                        )}
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tr("حجم مبيعات الفريق (Team Sales)", "Team Sales Volume")}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        ${salesCurrent.toLocaleString()} / ${salesReq.toLocaleString()} USD
                      </span>
                    </div>

                    <Progress value={salesPercent} className="h-2 rounded-full" />

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{salesCurrent >= salesReq ? tr("مكتمل ✓", "Completed ✓") : tr(`متبقي $${Math.max(0, salesReq - salesCurrent).toLocaleString()}`, `$${Math.max(0, salesReq - salesCurrent).toLocaleString()} remaining`)}</span>
                      <span>{salesPercent}%</span>
                    </div>
                  </div>

                  {/* Condition 2: Leadership Requirement */}
                  {leadership ? (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {leadership.isMet ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400">2</div>
                          )}
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {tr(`قادة برتبة ${isRtl ? leadership.requiredRankNameAr : leadership.requiredRankName} في فريقك`, `Leaders with rank ${leadership.requiredRankName} in downline`)}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                          {leadership.currentCount} / {leadership.requiredCount} {tr("قائد", "leaders")}
                        </span>
                      </div>

                      <Progress value={leadership.percent} className="h-2 rounded-full" />

                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{leadership.isMet ? tr("مكتمل ✓", "Completed ✓") : tr(`متبقي ${Math.max(0, leadership.requiredCount - leadership.currentCount)} قادة`, `${Math.max(0, leadership.requiredCount - leadership.currentCount)} remaining`)}</span>
                        <span>{leadership.percent}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{tr("لا يشترط وجود قادة إضافيين لهذه الرتبة، مبيعات الفريق وحدها كافية للتأهل!", "No extra downline leader conditions for this rank, Team Sales is sufficient!")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* The 8 Canonical Career Ranks (Matching Reference Visual Pedestal Grid) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {tr("سلّم الرتب القيادية وجوائز التفوق", "Leadership Career Ladder & Rewards")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tr(
                  "في Nexyvora، تمثّل كل رتبة محطة نمو جديدة، وتمكيناً قيادياً حقيقياً، ومكافأة عينية ونقدية استثنائية.",
                  "At Nexyvora, each rank represents a new stage of growth, leadership, and contribution to the community."
                )}
              </p>
            </div>
          </div>

          {/* Ranks Cards Pedestal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {ranks.map((r: any) => {
              const isCurrent = currentRank.level === r.level;
              const isAchieved = currentRank.level >= r.level && r.level > 0;
              const isNext = nextRank && nextRank.level === r.level;
              const colorHex = r.color_hex || '#0284c7';

              return (
                <div 
                  key={r.id}
                  className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 ${
                    isCurrent 
                      ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border-2 shadow-2xl scale-[1.02]' 
                      : isAchieved 
                      ? 'bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white border border-emerald-500/40 shadow-lg' 
                      : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-md opacity-95'
                  }`}
                  style={{
                    borderColor: isCurrent ? colorHex : isAchieved ? '#10b981' : undefined,
                    boxShadow: isCurrent ? `0 0 35px ${colorHex}44` : undefined
                  }}
                >
                  {/* Top Glowing Ambient Aura */}
                  <div 
                    className="absolute -top-16 left-1/2 -translate-x-1/2 w-36 h-36 rounded-full blur-2xl opacity-30 pointer-events-none"
                    style={{ backgroundColor: colorHex }}
                  />

                  {/* Current / Next Status Banner */}
                  {isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-950 shadow-md"
                        style={{ backgroundColor: colorHex }}
                      >
                        {tr("رتبتك الحالية", "CURRENT RANK")}
                      </span>
                    </div>
                  )}

                  {isNext && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                        {tr("هدفك القادم", "NEXT GOAL")}
                      </span>
                    </div>
                  )}

                  {isAchieved && !isCurrent && (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        {tr("محققة ✓", "Achieved ✓")}
                      </span>
                    </div>
                  )}

                  {/* Card Content Top */}
                  <div className="space-y-4 relative z-10 text-center">
                    {/* Rank Logo Pedestal */}
                    <div className="flex justify-center pt-2">
                      <div 
                        className="h-20 w-20 rounded-2xl flex items-center justify-center p-2.5 shadow-lg relative"
                        style={{ 
                          backgroundColor: `${colorHex}22`,
                          border: `2px solid ${colorHex}`,
                          boxShadow: `0 0 20px ${colorHex}33`
                        }}
                      >
                        {getRankLogoElement(r, "h-14 w-14")}
                      </div>
                    </div>

                    {/* Rank Name & Tagline */}
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-wider text-white">
                        {isRtl ? (r.name_ar || r.name) : r.name}
                      </h3>
                      {(r.tagline || r.tagline_ar) && (
                        <p className="text-xs italic text-slate-400 mt-0.5">
                          {isRtl ? (r.tagline_ar || r.tagline) : (r.tagline || r.tagline_ar)}
                        </p>
                      )}
                    </div>

                    {/* Criteria Box */}
                    <div className="space-y-2 py-3 border-y border-white/10 text-xs">
                      <div>
                        <span className="text-[11px] text-slate-400 block">{tr("حجم مبيعات الفريق (Team Sales)", "Team Sales")}</span>
                        <strong className="text-lg font-black font-mono text-white">
                          ${Number(r.min_team_turnover).toLocaleString()}
                        </strong>
                      </div>

                      <div className="pt-1">
                        <span className="text-[11px] text-slate-400 block">{tr("شرط القيادة (Leadership Req)", "Leadership Requirement")}</span>
                        <strong className="text-xs font-bold text-amber-400">
                          {Number(r.required_rank_count || 0) > 0 && (r.required_rank_name || r.required_rank_name_ar) ? (
                            `${r.required_rank_count} × ${isRtl ? (r.required_rank_name_ar || r.required_rank_name) : r.required_rank_name}`
                          ) : (
                            "—"
                          )}
                        </strong>
                      </div>
                    </div>

                    {/* Rewards & Gifts */}
                    <div className="space-y-2 text-xs">
                      {Number(r.reward_bonus) > 0 && (
                        <div>
                          <span className="text-[11px] text-slate-400 block">{tr("المكافأة النقدية (Cash Reward)", "Cash Reward")}</span>
                          <strong className="text-base font-black font-mono text-emerald-400">
                            +${Number(r.reward_bonus).toLocaleString()}
                          </strong>
                        </div>
                      )}

                      {(r.gift_name || r.gift_name_ar) && (
                        <div className="pt-1">
                          <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                            <Gift className="w-3 h-3 text-amber-400" />
                            {tr("الهدية (Gift)", "Gift")}
                          </span>
                          <strong className="text-xs font-bold text-amber-300 block">
                            {isRtl ? (r.gift_name_ar || r.gift_name) : (r.gift_name || r.gift_name_ar)}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Generations Footer */}
                  <div className="mt-5 pt-3 border-t border-white/10 text-center text-[10px] text-slate-400 font-mono">
                    <span>
                      {tr("الأجيال المفتوحة في الشجرة:", "Unlocked Generations:")} {r.unlocked_generations === 0 ? 'Direct' : r.unlocked_generations === 10 ? 'All 1-10' : `Gens 1-${r.unlocked_generations}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Leadership Bonus Pools (Diamond Pool, etc.) - Preserved */}
        {poolsData.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
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

                return (
                  <Card 
                    key={pool.id}
                    className="relative overflow-hidden rounded-3xl border-2 border-amber-500/30 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white p-6 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-400" />
                          <h3 className="text-lg font-black text-amber-400">
                            {isRtl ? pool.name_ar : pool.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300">
                          {tr(`مكافأة ${pool.pool_percentage}% شهرياً من صافي أرباح المنصة`, `${pool.pool_percentage}% monthly share from net platform profits`)}
                        </p>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          <Gem className="w-3.5 h-3.5" />
                          <span>{pool.rank_name_ar || pool.rank_name}</span>
                        </span>
                      </div>
                    </div>

                    <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-400 block">{tr("قيمة الحوض التقديرية الحالية", "Current Estimated Pool Pot")}</span>
                        <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1 mt-0.5">
                          <span>${pool.estimated_current_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                          <span className="text-xs font-semibold text-slate-400">USD</span>
                        </div>
                      </div>

                      <div className="sm:text-left text-xs text-slate-300 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{tr(`متبقي ${pool.days_left} أيام على نهاية الشهر`, `${pool.days_left} days left this month`)}</span>
                        </div>
                        <span className="text-slate-400 block text-[11px]">
                          {tr("التوزيع بالتساوي بين المؤهلين", "Split equally among qualifiers")}
                        </span>
                      </div>
                    </div>

                    {isEligible ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>
                          {tr("مبروك! أنت مؤهل رسمياً لاستلام حصتك من أرباح هذا الحوض بنهاية هذا الشهر 🎉", "Congratulations! You are officially eligible to receive your share at the end of this month! 🎉")}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                        {tr(`تأهل لرتبة ${pool.rank_name_ar || pool.rank_name} للمشاركة التلقائية في هذا الحوض الربحي.`, `Qualify for ${pool.rank_name} to participate in this monthly pool.`)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
