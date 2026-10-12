import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { affiliateService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, 
  UserPlus,
  Copy, 
  Check, 
  Share2, 
  QrCode, 
  TrendingUp, 
  Layers, 
  Wallet,
  Sparkles, 
  Loader2,
  Lock,
  ArrowUpRight,
  Network,
  ChevronDown,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from "sonner";

export default function StudentTeam() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [expandedGen, setExpandedGen] = useState<Record<number, boolean>>({
    1: true, 2: false, 3: false, 4: false, 5: false,
    6: false, 7: false, 8: false, 9: false, 10: false
  });

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await affiliateService.getTeam();
      setData(res);
    } catch (err) {
      toast.error(t('common.error', isRtl ? 'فشل تحميل بيانات الفريق' : 'Failed to load team data'));
    } finally {
      setLoading(false);
    }
  };

  const affiliateCode = data?.affiliateCode || 'NV------';
  const referralLink = `${window.location.origin}/auth?ref=${affiliateCode}`;

  const copyToClipboard = (text: string, isLink: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLink) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success(t('team.copyLinkSuccess', isRtl ? 'تم نسخ رابط الإحالة بنجاح!' : 'Referral link copied successfully!'));
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast.success(t('team.copyCodeSuccess', isRtl ? 'تم نسخ كود الإحالة!' : 'Referral code copied!'));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nextvora Academy',
          text: `${t('team.shareInviteText', isRtl ? 'انضم إلى فريقي في منصة Nextvora Academy واستفد من البرامج التعليمية والفرص الرائعة!' : 'Join my team on Nextvora Academy and take advantage of great educational programs!')}\n`,
          url: referralLink,
        });
      } catch (err) {
        // User closed or cancelled share dialog
      }
    } else {
      copyToClipboard(referralLink, true);
      toast.info(t('team.linkCopiedShare', isRtl ? 'تم نسخ رابط الإحالة! يمكنك مشاركته الآن.' : 'Referral link copied! You can share it now.'));
    }
  };

  const totals = data?.totals || { totalTeamMembers: 0, totalTeamSales: 0, totalTeamCommissions: 0, directReferralsCount: 0 };
  const generations = data?.generations || {
    1: { count: 0, sales: 0, commissions: 0, members: [] },
    2: { count: 0, sales: 0, commissions: 0, members: [] },
    3: { count: 0, sales: 0, commissions: 0, members: [] },
    4: { count: 0, sales: 0, commissions: 0, members: [] },
    5: { count: 0, sales: 0, commissions: 0, members: [] },
    6: { count: 0, sales: 0, commissions: 0, members: [] },
    7: { count: 0, sales: 0, commissions: 0, members: [] },
    8: { count: 0, sales: 0, commissions: 0, members: [] },
    9: { count: 0, sales: 0, commissions: 0, members: [] },
    10: { count: 0, sales: 0, commissions: 0, members: [] },
  };

  const genRates: Record<number, string> = {
    1: '5%',
    2: '4%',
    3: '3%',
    4: '2%',
    5: '1%',
    6: '1%',
    7: '1%',
    8: '0.5%',
    9: '0.5%',
    10: '0.5%',
  };

  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'fr' ? 'fr-FR' : 'en-US';
  const unlockedGenerations = data?.unlockedGenerations !== undefined ? Number(data.unlockedGenerations) : 5;

  const toggleGenExpanded = (lvl: number) => {
    setExpandedGen(prev => ({ ...prev, [lvl]: !prev[lvl] }));
  };

  return (
    <DashboardLayout role="student">
      <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top Header Row (Matching Screenshot) */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('team.myTeam', 'My Team')}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQr(!showQr)}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xs"
              title={t('team.qrCode', isRtl ? 'رمز QR' : 'QR Code')}
            >
              <QrCode className="h-5 w-5" />
            </button>

            <Link
              to="/student/wallet"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xs"
              title={t('wallet.myWallet', 'My Wallet')}
            >
              <Wallet className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* QR Code Popup Card if toggled */}
        {showQr && (
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs font-bold text-slate-500 mb-3">
              {t('team.scanToJoin', isRtl ? 'امسح الرمز للانضمام لفريقك مباشرة' : 'Scan the code to join your team directly')}
            </p>
            <div className="p-3 bg-white rounded-2xl border shadow-xs">
              <QRCodeSVG value={referralLink} size={150} />
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-2">{affiliateCode}</p>
          </div>
        )}

        {/* View Team Tree Full-Width Card / Button (Navigates to interactive canvas page) */}
        <Link
          to="/student/team-tree"
          className="w-full py-3.5 px-4 rounded-2xl bg-[#eff6ff] dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/80 text-[#1d4ed8] dark:text-blue-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-xs"
        >
          <Network className="h-4 w-4 stroke-[2.2]" />
          <span>{t('team.viewTeamTree', isRtl ? 'عرض واستكشاف شجرة الفريق التفاعلية' : 'View Team Tree Canvas')}</span>
        </Link>

        {/* Invite Link Royal Blue Hero Card (Exact Match to Screenshot) */}
        <div className="bg-gradient-to-tr from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] rounded-[26px] sm:rounded-[32px] p-5 sm:p-7 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Row: Title & Referral Code Pill */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              {t('team.inviteLink', 'Invite Link')}
            </h2>

            <button
              onClick={() => copyToClipboard(affiliateCode, false)}
              className="px-3.5 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-extrabold text-white tracking-wider font-mono transition-all active:scale-95"
              title={t('team.copyCode', isRtl ? 'نسخ الكود' : 'Copy Code')}
            >
              {copiedCode ? t('common.copied', isRtl ? 'تم النسخ!' : 'Copied!') : affiliateCode}
            </button>
          </div>

          {/* Middle Box: Glassmorphism Link Display */}
          <div className="mt-3.5 mb-4 p-3.5 sm:p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/15">
            <span className="text-[11px] text-blue-100/85 font-medium block mb-1">
              {t('team.inviteLink', 'Invite Link')}
            </span>
            <p className="font-mono text-xs sm:text-sm font-semibold text-white break-all select-all">
              {referralLink}
            </p>
          </div>

          {/* Bottom Row: Copy Link & Submit / Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => copyToClipboard(referralLink, true)}
              className="py-3 px-4 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              {copiedLink ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
              <span>{copiedLink ? t('common.copied', 'Copied') : t('team.copyLink', 'Copy Link')}</span>
            </button>

            <button
              onClick={handleShare}
              className="py-3 px-4 rounded-2xl bg-white hover:bg-blue-50 text-blue-600 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <Share2 className="h-4 w-4 stroke-[2.5]" />
              <span>{t('team.submitOrShare', 'Submit')}</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Cards (2x2 Grid exactly as in Screenshot) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Total Team */}
          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
              <Users className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totals.totalTeamMembers}
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {t('team.totalTeam', 'Total Team')}
            </p>
          </Card>

          {/* 2. Direct Referrals */}
          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mb-3">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totals.directReferralsCount}
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {t('team.directReferrals', 'Direct Referrals')}
            </p>
          </Card>

          {/* 3. Team Sales */}
          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              ${Number(totals.totalTeamSales || 0).toFixed(0)}
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {t('team.teamSales', 'Team Sales')}
            </p>
          </Card>

          {/* 4. Team Earnings / Generations */}
          <Card className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3">
              <Layers className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ${Number(totals.totalTeamCommissions || 0).toFixed(0)}
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              {t('team.teamEarnings', 'Team Earnings')}
            </p>
          </Card>
        </div>

        {/* 5-Generation Detailed Tabs & Members List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('team.breakdownTitle', isRtl ? 'تفاصيل شبكة الأجيال (10 Generations)' : 'Generations Network Breakdown (10 Generations)')}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              {totals.totalTeamMembers} {t('team.membersCount', isRtl ? 'عضو' : 'Members')}
            </span>
          </div>

          <Tabs defaultValue="gen-1" className="space-y-4">
            <TabsList className="w-full grid grid-cols-5 sm:grid-cols-10 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 h-auto gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                const isUnlocked = unlockedGenerations >= lvl;
                return (
                  <TabsTrigger 
                    key={lvl} 
                    value={`gen-${lvl}`} 
                    className="rounded-xl text-[10px] sm:text-xs font-bold py-2 sm:py-2.5 px-0.5 flex items-center justify-center gap-0.5 truncate"
                  >
                    {!isUnlocked && <Lock className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
                    <span className="truncate">{t('team.gen', 'G')}{lvl}</span>
                    <span className="text-[9px] text-slate-400 font-normal hidden lg:inline">({genRates[lvl]})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
              const gen = generations[lvl] || { count: 0, sales: 0, commissions: 0, members: [] };
              const rate = genRates[lvl];
              const isUnlocked = unlockedGenerations >= lvl;

              return (
                <TabsContent key={lvl} value={`gen-${lvl}`}>
                  <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 space-y-5 shadow-xs">
                    {/* Locked Generation Warning Banner */}
                    {!isUnlocked && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                            <Lock className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              {t('team.lockedGenNotice', isRtl ? 'هذا الجيل مقفل في خطتك الحالية' : 'This generation is locked in your current plan')} ({t('team.gen', isRtl ? 'الجيل' : 'Gen')} {lvl})
                            </h4>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                              {t('team.requireUpgradeToUnlock', isRtl ? 'قم بترقية باقتك للاستفادة من عمولات هذا الجيل.' : 'Upgrade your package to unlock commissions from this generation.')}
                            </p>
                          </div>
                        </div>
                        <Link to="/student/packages" className="shrink-0">
                          <Button size="sm" className="rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1 shadow-xs">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {t('packages.upgradeNow', isRtl ? 'ترقية الباقة' : 'Upgrade Package')}
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Gen Stats Bar */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center sm:text-right rtl:sm:text-right">
                      <div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">{t('team.genMembers', isRtl ? 'أعضاء الجيل' : 'Gen Members')}</span>
                        <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                          {gen.count}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">{t('team.commissionRate', isRtl ? 'نسبة الربح' : 'Commission Rate')}</span>
                        <p className="text-lg sm:text-xl font-black text-primary mt-0.5">
                          {rate}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">{t('team.earnedFromGen', isRtl ? 'أرباح الجيل' : 'Gen Earnings')}</span>
                        <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ${Number(gen.commissions || 0).toFixed(1)}
                        </p>
                      </div>
                    </div>

                    {/* Members in this generation */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                        {t('team.membersList', isRtl ? 'قائمة أعضاء الجيل' : 'Members of Gen')} ({gen.members.length}):
                      </h4>
                      {gen.members.length === 0 ? (
                        <div className="py-7 text-center text-slate-400 text-xs border border-dashed rounded-2xl">
                          {t('team.noMembers', isRtl ? 'لا يوجد أي أعضاء مسجلين في هذا الجيل حتى الآن.' : 'No members registered in this generation yet.')}
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                          {gen.members.map((m: any) => (
                            <div key={m.id} className="p-3 sm:p-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {m.full_name ? m.full_name[0].toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {m.full_name || t('roles.student', isRtl ? 'عضو مسجل' : 'Registered Member')}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px] sm:max-w-none">{m.email}</p>
                                </div>
                              </div>
                              <div className="text-right rtl:text-left shrink-0">
                                {m.active_package_name ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] font-bold">
                                    {i18n.language === 'ar' ? (m.active_package_name_ar || m.active_package_name) : (m.active_package_name || m.active_package_name_ar)}
                                  </Badge>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-medium">{t('team.noPackage', isRtl ? 'بدون باقة' : 'No Package')}</span>
                                )}
                                <p className="text-[9px] text-slate-400 mt-0.5">
                                  {new Date(m.created_at).toLocaleDateString(dateLocale)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* --- TEAM TREE INTERACTIVE MODAL DIALOG --- */}
        <Dialog open={isTreeOpen} onOpenChange={setIsTreeOpen}>
          <DialogContent className="w-[94vw] max-w-lg max-h-[88dvh] p-0 rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="p-3.5 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Network className="h-4 w-4 stroke-[2.2]" />
                </div>
                <div>
                  <DialogTitle className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight">
                    {t('team.teamTreeTitle', isRtl ? 'شجرة الفريق (Team Tree)' : 'Team Tree')}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                    {t('team.teamTreeDesc', isRtl ? 'استعراض هيكل شبكتك عبر الأجيال (10 أجيال)' : 'View your network structure across 10 generations')}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Scrollable Tree View */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 space-y-3">
              {/* Root User Node (You) */}
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'ME'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      {t('team.rootNode', isRtl ? 'قائد الشبكة (أنت)' : 'Network Leader (You)')}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {user?.name || user?.email}
                    </h4>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                  {totals.totalTeamMembers} {t('team.membersCount', isRtl ? 'عضو' : 'Members')}
                </Badge>
              </div>

              {/* Generations Tree Levels */}
              <div className="space-y-2 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => {
                  const gen = generations[lvl] || { count: 0, sales: 0, commissions: 0, members: [] };
                  const isExpanded = expandedGen[lvl];
                  const hasMembers = gen.members && gen.members.length > 0;
                  const isUnlocked = unlockedGenerations >= lvl;

                  return (
                    <div key={lvl} className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                      {/* Generation Level Trigger */}
                      <button
                        type="button"
                        onClick={() => toggleGenExpanded(lvl)}
                        className="w-full p-2.5 sm:p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left rtl:text-right"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-lg ${isUnlocked ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                            {isUnlocked ? (
                              isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {t('team.gen', isRtl ? 'الجيل' : 'Gen')} {lvl}
                              </span>
                              <span className="text-[10px] font-bold text-primary">({genRates[lvl]})</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500">
                            {gen.count} {t('team.membersCount', isRtl ? 'عضو' : 'Members')}
                          </span>
                        </div>
                      </button>

                      {/* Expanded Members list in tree */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 space-y-1.5">
                          {!hasMembers ? (
                            <p className="text-[10px] text-slate-400 text-center py-2">
                              {t('team.noMembersInLevel', isRtl ? 'لا يوجد أعضاء في هذا المستوى حالياً' : 'No members in this tier yet')}
                            </p>
                          ) : (
                            gen.members.map((m: any) => (
                              <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                                    {m.full_name ? m.full_name[0].toUpperCase() : 'U'}
                                  </div>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[140px] sm:max-w-xs">
                                    {m.full_name || m.email}
                                  </span>
                                </div>
                                {m.active_package_name ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                    {m.active_package_name}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-400">{isRtl ? 'بدون باقة' : 'No Package'}</span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 flex items-center justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsTreeOpen(false)} 
                className="rounded-xl text-xs h-8 px-4"
              >
                {t('common.close', isRtl ? 'إغلاق' : 'Close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
