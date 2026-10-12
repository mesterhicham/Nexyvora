import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Flame,
  Gift,
  Sparkles,
  ArrowRight,
  Plane,
  DollarSign,
  Award,
  Trophy,
  Target,
  Users,
  Percent,
  Calendar,
  Share2,
  CheckCircle2,
  Info,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { challengeService, affiliateService } from '@/services/apiService';
import { toast } from 'sonner';

interface Challenge {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  target_sales: number;
  target_revenue: number;
  reward_type: string;
  reward_amount: number;
  reward_title: string | null;
  reward_title_ar: string | null;
  leg_limit_percent: number;
  required_directs: number;
  directs_type: string;
  start_date: string;
  end_date: string;
  status: string;
  daysLeft: number;
  currentDirectSales: number;
  currentRevenue: number;
  progressPercent: number;
  isCompleted: boolean;
}

export default function StudentChallenges() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const lang = i18n.language;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chalRes, teamRes] = await Promise.all([
        challengeService.getChallenges().catch(() => ({ challenges: [] })),
        affiliateService.getTeam().catch(() => ({ affiliateCode: '' }))
      ]);

      setChallenges(chalRes.challenges || []);
      setAffiliateCode(teamRes.affiliateCode || '');
    } catch (err) {
      toast.error(isRtl ? 'فشل في تحميل التحديات' : 'Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = (challengeId: string) => {
    const link = `${window.location.origin}/auth?ref=${affiliateCode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(challengeId);
    setTimeout(() => setCopiedId(null), 2500);
    toast.success(isRtl ? 'تم نسخ رابط الإحالة بنجاح! شاركه مع فريقك لإنجاز التحدي.' : 'Referral link copied! Share with your team to complete challenge.');
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'TRAVEL': return Plane;
      case 'CASH': return DollarSign;
      case 'BADGE': return Award;
      case 'PHYSICAL_GIFT': return Gift;
      default: return Trophy;
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-16 font-sans">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-linear-to-r from-primary/10 via-purple-500/5 to-transparent p-6 rounded-3xl border border-primary/20 shadow-xs">
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <Flame className="h-6 w-6" />
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('challenges.title', 'التحديات والحملات التنافسية')}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              {t('challenges.subtitle', 'حقق أهداف المبيعات مع فريقك وافتح مكافآت حصرية، رحلات سياحية، وبونص قيادة استثنائي.')}
            </p>
          </div>

          <Link to="/student/team">
            <Button className="rounded-2xl font-black text-sm bg-linear-to-r from-primary to-indigo-600 hover:from-primary/95 text-white shadow-lg shadow-primary/25 gap-2">
              <Sparkles className="h-4 w-4" />
              <span>{isRtl ? 'متابعة مبيعات فريقي' : lang === 'fr' ? 'Suivre les ventes' : 'Track Team Sales'}</span>
            </Button>
          </Link>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="text-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-slate-400 mt-4">{isRtl ? 'جاري تحميل التحديات...' : 'Loading challenges...'}</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {isRtl ? 'لا توجد تحديات نشطة حالياً' : 'No active challenges at the moment'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {isRtl ? 'ترقبوا إطلاق حملات وتحديات جديدة قريباً من إدارة الأكاديمية.' : 'Stay tuned for upcoming performance and leadership campaigns.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((c) => {
              const RewardIcon = getRewardIcon(c.reward_type);
              const title = isRtl ? (c.title_ar || c.title) : c.title;
              const description = isRtl ? (c.description_ar || c.description) : (c.description || c.description_ar);
              const rewardTitle = isRtl ? (c.reward_title_ar || c.reward_title) : (c.reward_title || c.reward_title_ar);

              return (
                <Card
                  key={c.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Campaign Image */}
                    <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-linear-to-tr from-primary/30 to-purple-600/30 flex items-center justify-center">
                          <Trophy className="h-16 w-16 text-primary/40" />
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          {c.daysLeft === 0
                            ? (isRtl ? 'منتهي اليوم' : 'Ends today')
                            : `${c.daysLeft} ${isRtl ? 'يوم متبقي' : t('challenges.daysRemaining', 'days left')}`}
                        </span>

                        <Badge
                          className={`text-xs font-black px-2.5 py-0.5 shadow-xs ${
                            c.isCompleted
                              ? 'bg-emerald-600 text-white'
                              : 'bg-primary text-white'
                          }`}
                        >
                          {c.isCompleted ? (isRtl ? 'تم الإنجاز 🎉' : 'Completed 🎉') : (isRtl ? 'تحدي نشط' : 'Active')}
                        </Badge>
                      </div>

                      {/* Reward Highlight Banner on Image */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/95 text-white text-xs font-black backdrop-blur-md shadow-md max-w-full">
                          <RewardIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {c.reward_type === 'TRAVEL' && (isRtl ? 'رحلة سياحية: ' : 'Travel: ')}
                            {c.reward_type === 'CASH' && (isRtl ? 'مكافأة كاش: ' : 'Cash: ')}
                            {c.reward_type === 'BADGE' && (isRtl ? 'شارة شرفية: ' : 'Badge: ')}
                            {rewardTitle || (c.reward_amount > 0 ? `$${c.reward_amount} USD` : '')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 space-y-4">
                      {/* Title & Description */}
                      <div className={isRtl ? 'text-right' : 'text-left'}>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                          {title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                      </div>

                      {/* Conditions & Rules Panel (الشروط) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">
                            {isRtl ? 'شروط ومتطلبات التأهل:' : 'Qualification Rules:'}
                          </span>
                          <button
                            onClick={() => setSelectedChallenge(c)}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            <Info className="h-3 w-3" />
                            <span>{isRtl ? 'التفاصيل' : 'Rules'}</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          {c.target_sales > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                              <span>
                                {isRtl ? 'المبيعات:' : 'Sales:'} <strong>{c.target_sales}</strong>
                              </span>
                            </div>
                          )}

                          {Number(c.target_revenue) > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {isRtl ? 'حجم المبيعات:' : 'Revenue:'} <strong>${Number(c.target_revenue).toFixed(0)}</strong>
                              </span>
                            </div>
                          )}

                          {c.required_directs > 0 && (
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span>
                                {isRtl ? 'مباشرين:' : 'Directs:'} <strong>{c.required_directs} ({c.directs_type})</strong>
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Percent className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                              {isRtl ? 'سقف الساق:' : 'Leg Limit:'} <strong>{c.leg_limit_percent}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar & Status */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span>
                            {isRtl ? 'إنجاز التحدي' : t('challenges.progress', 'Progress')}:{' '}
                            {c.target_sales > 0 ? `${c.currentDirectSales} / ${c.target_sales}` : `${c.progressPercent}%`}
                          </span>
                          <span className="font-bold text-primary">{c.progressPercent}%</span>
                        </div>
                        <Progress value={c.progressPercent} className="h-2.5 rounded-full" />
                      </div>

                      {c.isCompleted && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 border border-emerald-500/20">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{isRtl ? 'تهانينا! لقد حققت شروط هذا التحدي بنجاح!' : 'Congratulations! You completed this challenge!'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 space-y-2">
                    <Button
                      onClick={() => handleShareLink(c.id)}
                      className="w-full rounded-xl text-xs font-bold gap-1.5 bg-linear-to-r from-primary to-indigo-600 hover:from-primary/95 text-white shadow-xs"
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span>{isRtl ? 'تم نسخ الرابط!' : 'Link Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{isRtl ? 'مشاركة رابط الإحالة لإنجاز التحدي' : 'Share link to complete challenge'}</span>
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Full Rules & Criteria Details */}
        <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <span>
                  {selectedChallenge && (isRtl ? (selectedChallenge.title_ar || selectedChallenge.title) : selectedChallenge.title)}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {isRtl ? 'شروط وقواعد التأهل الرسمية للتحدي' : 'Official qualification rules and terms'}
              </DialogDescription>
            </DialogHeader>

            {selectedChallenge && (
              <div className="space-y-4 mt-2 text-xs">
                {selectedChallenge.image_url && (
                  <div className="h-36 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <img src={selectedChallenge.image_url} alt="Challenge" className="h-full w-full object-cover" />
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300">
                  <span className="font-bold block text-[11px] mb-1">{isRtl ? 'المكافأة المستحقة:' : 'Reward:'}</span>
                  <p className="font-black text-sm">
                    {isRtl
                      ? (selectedChallenge.reward_title_ar || selectedChallenge.reward_title || `$${selectedChallenge.reward_amount} USD`)
                      : (selectedChallenge.reward_title || `$${selectedChallenge.reward_amount} USD`)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">{isRtl ? 'الشروط التفصيلية:' : 'Detailed Criteria:'}</span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedChallenge.target_sales > 0 && (
                      <li>
                        {isRtl ? 'تحقيق عدد مبيعات مباشرة لا يقل عن: ' : 'Achieve direct sales of at least: '}
                        <strong>{selectedChallenge.target_sales}</strong>
                      </li>
                    )}
                    {Number(selectedChallenge.target_revenue) > 0 && (
                      <li>
                        {isRtl ? 'تحقيق حجم مبيعات فريق إجمالي: ' : 'Generate total team volume of: '}
                        <strong>${Number(selectedChallenge.target_revenue).toFixed(2)} USD</strong>
                      </li>
                    )}
                    {selectedChallenge.required_directs > 0 && (
                      <li>
                        {isRtl ? 'تسجيل مباشرين مؤهلين: ' : 'Enrolled direct members: '}
                        <strong>{selectedChallenge.required_directs} ({selectedChallenge.directs_type})</strong>
                      </li>
                    )}
                    <li>
                      {isRtl ? 'تطبيق قاعدة سقف الفريق (Max Leg Limit): ' : 'Max leg volume limit applies: '}
                      <strong>{selectedChallenge.leg_limit_percent}%</strong>{' '}
                      {isRtl ? 'من خط الفريق الواحد كحد أقصى.' : 'maximum from any single team line.'}
                    </li>
                    <li>
                      {isRtl ? 'فترة التحدي سارية من: ' : 'Active challenge period from: '}
                      <strong>{selectedChallenge.start_date.split('T')[0]}</strong>{' '}
                      {isRtl ? 'إلى' : 'to'}{' '}
                      <strong>{selectedChallenge.end_date.split('T')[0]}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                onClick={() => setSelectedChallenge(null)}
                className="w-full rounded-xl text-xs font-bold bg-primary text-white"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
