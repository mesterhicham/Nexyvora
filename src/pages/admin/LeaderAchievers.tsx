import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { adminAffiliateService } from '@/services/apiService';
import { Award, Crown, Trophy, Sparkles, Loader2, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function LeaderAchievers() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [achievers, setAchievers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievers();
  }, []);

  const loadAchievers = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getRankAchievers();
      setAchievers(res.achievers || []);
    } catch (err: any) {
      toast.error(tr("فشل تحميل قائمة منجزي الرتب", "Failed to load rank achievers list"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
              Hall of Fame
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 shrink-0" />
              <span>{tr("قائمة منجزي الرتب القيادية", "Leader Achievers")}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr("سجل الشرف لكبار القادة والمسوقين الذين استوفوا الشروط وحققوا الرتب القيادية في المنصة.", "Honor roll of top leaders and affiliates who qualified and achieved leadership ranks on the platform.")}
            </p>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs font-bold">
            {tr("إجمالي الإنجازات:", "Total Achievements:")} <strong className="font-mono text-base">{achievers.length}</strong>
          </div>
        </div>

        {/* Achievers Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">{tr("القائد / العضو", "Leader / Member")}</th>
                  <th className="p-4">{tr("الرتبة المحققة", "Achieved Rank")}</th>
                  <th className="p-4">{tr("حجم المبيعات المباشرة", "Direct Sales Volume")}</th>
                  <th className="p-4">{tr("حجم مبيعات الفريق", "Team Turnover Volume")}</th>
                  <th className="p-4">{tr("قيمة المكافأة", "Reward Amount")}</th>
                  <th className="p-4">{tr("تاريخ الإنجاز", "Achievement Date")}</th>
                  <th className="p-4 text-center">{tr("حالة المكافأة", "Reward Status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      {tr("جاري تحميل المنجزين...", "Loading achievers...")}
                    </td>
                  </tr>
                ) : achievers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      {tr("لا يوجد أعضاء حققوا رتباً قيادية حتى الآن.", "No members have achieved leadership ranks yet.")}
                    </td>
                  </tr>
                ) : (
                  achievers.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* User */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-amber-300">
                            <AvatarImage src={a.avatar_url ? `${import.meta.env.VITE_API_URL}${a.avatar_url}` : undefined} />
                            <AvatarFallback className="bg-amber-100 text-amber-800 font-bold text-xs">
                              {a.user_name?.charAt(0) || 'L'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{a.user_name}</p>
                            <p className="text-[10px] text-slate-400">{a.user_email}</p>
                            <span className="font-mono text-[10px] text-indigo-600 font-bold">{a.affiliate_code}</span>
                          </div>
                        </div>
                      </td>

                      {/* Rank */}
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-white font-bold text-xs shadow-xs" style={{ backgroundColor: a.rank_color || '#6366f1' }}>
                          <Award className="h-3.5 w-3.5" />
                          <span>{a.rank_name} ({tr("مستوى ${a.rank_level}", "Lvl ${a.rank_level}")})</span>
                        </div>
                      </td>

                      {/* Direct Sales */}
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${Number(a.direct_sales_at_time).toLocaleString()} USD
                      </td>

                      {/* Team Turnover */}
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        ${Number(a.team_turnover_at_time).toLocaleString()} USD
                      </td>

                      {/* Reward */}
                      <td className="p-4 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        ${Number(a.reward_amount).toLocaleString()} USD
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-400 text-[11px]">
                        {new Date(a.achieved_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                      </td>

                      {/* Reward Status */}
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700">
                          {a.reward_paid ? (tr("مدفوعة ✓", "PAID ✓")) : (tr("ممنوحة", "GRANTED"))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
