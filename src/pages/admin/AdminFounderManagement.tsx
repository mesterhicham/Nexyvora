import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { adminFounderService } from '@/services/apiService';
import { 
  Crown, 
  Sparkles, 
  Award, 
  UserPlus, 
  Settings, 
  Coins, 
  TrendingUp, 
  Users, 
  Calendar, 
  History, 
  Loader2, 
  DollarSign,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash2,
  Lock,
  ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFounderManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'history'>('members');

  // Period Selector for Distribution (Defaults to current month)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  // Preview Data
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Settings Modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    totalSeats: 100,
    targetDirectSales: 5000,
    poolPercentage: 2,
    calculationBasis: 'net_margin',
    isActive: true,
    currentRollover: 0
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Manual Grant Modal
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({
    userId: '',
    customSeatNumber: '',
    notes: ''
  });
  const [granting, setGranting] = useState(false);

  // Distribution Execution Modal
  const [distOpen, setDistOpen] = useState(false);
  const [distNotes, setDistNotes] = useState('');
  const [executingDist, setExecutingDist] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await adminFounderService.getAdminData();
      setData(res);
      if (res.settings) {
        setSettingsForm({
          totalSeats: res.settings.totalSeats,
          targetDirectSales: res.settings.targetDirectSales,
          poolPercentage: res.settings.poolPercentage,
          calculationBasis: res.settings.calculationBasis,
          isActive: res.settings.isActive,
          currentRollover: res.settings.currentRollover
        });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('founders.loadError', 'Failed to load Founders Management data'));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPreview = async () => {
    try {
      setPreviewLoading(true);
      const res = await adminFounderService.previewDistribution({
        year: selectedYear,
        month: selectedMonth
      });
      setPreviewData(res);
    } catch (err: any) {
      toast.error(t('founders.previewError', 'Failed to fetch Founders Pool preview calculations'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleOpenDistribution = () => {
    handleFetchPreview();
    setDistOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      await adminFounderService.updateSettings(settingsForm);
      toast.success(t('founders.saveSettingsSuccess', 'Founder Club settings saved successfully!'));
      setSettingsOpen(false);
      loadAdminData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('founders.saveSettingsError', 'Failed to save settings'));
    } finally {
      setSavingSettings(false);
    }
  };

  const handleGrantSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.userId) {
      toast.error(t('founders.selectUserRequired', 'Please select a member'));
      return;
    }
    try {
      setGranting(true);
      const res = await adminFounderService.grantSeat({
        userId: grantForm.userId,
        customSeatNumber: grantForm.customSeatNumber ? Number(grantForm.customSeatNumber) : undefined,
        notes: grantForm.notes
      });
      toast.success(res.message || t('founders.grantSuccess', 'Founder seat granted successfully!'));
      setGrantOpen(false);
      setGrantForm({ userId: '', customSeatNumber: '', notes: '' });
      loadAdminData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('founders.grantError', 'Failed to grant Founder seat'));
    } finally {
      setGranting(false);
    }
  };

  const handleToggleStatus = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await adminFounderService.toggleStatus(memberId, { status: newStatus });
      toast.success(res.message);
      loadAdminData();
    } catch (err: any) {
      toast.error(t('founders.toggleStatusError', 'Failed to update seat status'));
    }
  };

  const handleDeleteMember = async (memberId: string, seatNumber: number) => {
    if (!confirm(t('founders.revokeConfirm', `Are you sure you want to revoke Founder seat #${seatNumber}? The seat will return to available pool.`))) {
      return;
    }
    try {
      const res = await adminFounderService.toggleStatus(memberId, { deleteMember: true });
      toast.success(res.message);
      loadAdminData();
    } catch (err: any) {
      toast.error(t('founders.deleteError', 'Failed to delete founder member'));
    }
  };

  const handleExecuteDistribution = async () => {
    try {
      setExecutingDist(true);
      const res = await adminFounderService.executeDistribution({
        periodYear: selectedYear,
        periodMonth: selectedMonth,
        notes: distNotes
      });
      toast.success(res.message);
      setDistOpen(false);
      setDistNotes('');
      loadAdminData();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t('founders.executeError', 'Failed to execute profit distribution'));
    } finally {
      setExecutingDist(false);
    }
  };

  const stats = data?.stats || { totalSeats: 100, takenSeats: 0, remainingSeats: 100, totalDistributed: 0 };
  const settings = data?.settings || settingsForm;
  const members = data?.members || [];
  const distributions = data?.distributions || [];
  const candidateStudents = data?.candidateStudents || [];

  const seatsPercentage = Math.round((stats.takenSeats / (stats.totalSeats || 100)) * 100);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
              <Crown className="h-3.5 w-3.5" />
              <span>{t('founders.adminBadge', 'Exclusive for Top 100 Founders')}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('founders.adminTitle', 'Founders Club Management')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('founders.adminSubtitle', 'Configure Founder Club parameters, manage seats, manually grant memberships, and execute the 2% monthly net profit distributions.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setSettingsOpen(true)}
              variant="outline"
              className="rounded-2xl font-bold border-slate-200 dark:border-slate-800 gap-1.5 text-xs shadow-xs"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              {t('founders.editSettingsBtn', 'Edit Settings')}
            </Button>

            <Button
              onClick={() => setGrantOpen(true)}
              variant="outline"
              className="rounded-2xl font-bold border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 gap-1.5 text-xs shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              {t('founders.grantFounderBtn', 'Manually Grant Seat')}
            </Button>

            <Button
              onClick={handleOpenDistribution}
              className="rounded-2xl font-bold bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white gap-2 text-xs shadow-md shadow-amber-500/20 px-5"
            >
              <Coins className="h-4 w-4" />
              {t('founders.distributePoolBtn', 'Distribute 2% Pool')}
            </Button>
          </div>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Seats Taken Card */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.seatsTaken', 'Seats Claimed')}</span>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {stats.takenSeats} <span className="text-sm font-normal text-slate-400">/ {stats.totalSeats}</span>
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Crown className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, seatsPercentage)}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                {seatsPercentage}% {t('common.completed', 'claimed')} ({stats.remainingSeats} {t('founders.seatsRemaining', 'vacant seats remaining')})
              </span>
            </div>
          </Card>

          {/* Qualification Target */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.targetSalesLabel', 'Direct Sales Required')}</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  ${Number(settings.targetDirectSales).toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-3">
              {t('founders.targetWindowDesc', 'Personal direct sales in a rolling 30-day window')}
            </p>
          </Card>

          {/* Pool Percentage */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.poolPctLabel', 'Monthly Pool Percentage')}</span>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {settings.poolPercentage}% <span className="text-xs font-normal text-slate-400">{t('founders.monthly', 'monthly')}</span>
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-3">
              {t('founders.poolSourceDesc', 'Calculated from net platform profit margin')}
            </p>
          </Card>

          {/* Total Paid All-Time */}
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">{t('founders.totalEarned', 'Total Distributed')}</span>
                <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  ${Number(stats.totalDistributed || 0).toFixed(2)}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Coins className="h-6 w-6" />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-3">
              {t('founders.depositedWalletsDesc', 'Lifetime profits credited into founders wallets')}
            </p>
          </Card>
        </div>

        {/* Tabs: Members List & Distributions History */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Button
            variant={activeTab === 'members' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('members')}
            className={`rounded-2xl font-bold text-xs gap-2 ${
              activeTab === 'members' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Crown className="h-4 w-4" />
            {t('founders.membersTab', 'Founders Members')} ({members.length})
          </Button>

          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className={`rounded-2xl font-bold text-xs gap-2 ${
              activeTab === 'history' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <History className="h-4 w-4" />
            {t('founders.distributionsTab', 'Distributions History')} ({distributions.length})
          </Button>
        </div>

        {/* Tab 1: Members Table */}
        {activeTab === 'members' && (
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">{t('founders.membersListTitle', 'Founders Seat Holders Registry')}</CardTitle>
                  <CardDescription className="text-xs">
                    {t('founders.membersListSubtitle', 'Qualified leaders receiving an equal lifetime share of the 2% monthly profit pool.')}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-xl px-3 py-1 font-bold text-xs border-amber-500/30 text-amber-600">
                  {stats.takenSeats} / {stats.totalSeats} {t('founders.seatsTaken', 'seats claimed')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-2" />
                  <p className="text-xs text-slate-400">{t('common.loading', 'Loading...')}</p>
                </div>
              ) : members.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950/30 w-16 h-16 mx-auto flex items-center justify-center text-amber-500">
                    <Crown className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{t('founders.noFoundersFound', 'No qualified founders found.')}</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {t('founders.noFoundersDesc', 'Members will qualify automatically when reaching $5,000 direct sales, or you can manually award a seat.')}
                  </p>
                  <Button
                    onClick={() => setGrantOpen(true)}
                    className="rounded-2xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {t('founders.grantFounderBtn', 'Manually Grant Seat')}
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left rtl:text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4 font-bold text-center">{t('founders.seatCol', 'Seat #')}</th>
                        <th className="p-4 font-bold">{t('founders.memberCol', 'Founder Member')}</th>
                        <th className="p-4 font-bold">{t('founders.joinedCol', 'Qualified At')}</th>
                        <th className="p-4 font-bold">{t('founders.salesVolumeCol', 'Direct Sales')}</th>
                        <th className="p-4 font-bold">{t('founders.totalEarned', 'Total Distributed')}</th>
                        <th className="p-4 font-bold">{t('founders.grantedByCol', 'Granted Method')}</th>
                        <th className="p-4 font-bold">{t('founders.distStatusCol', 'Status')}</th>
                        <th className="p-4 font-bold text-center">{t('founders.actionsCol', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {members.map((m: any) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 text-center">
                            <span className="inline-flex items-center justify-center font-black px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs border border-amber-500/20">
                              #{String(m.seat_number).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                                {m.full_name?.substring(0, 2).toUpperCase() || 'FO'}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                  {m.full_name || 'Member'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  {m.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-400">
                            {new Date(m.qualified_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="p-4 font-black text-slate-800 dark:text-slate-200">
                            ${Number(m.direct_sales_achieved || 0).toLocaleString()}
                          </td>
                          <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(m.total_payouts || 0).toFixed(2)}
                          </td>
                          <td className="p-4">
                            {m.granted_by === 'admin_manual' ? (
                              <Badge variant="outline" className="rounded-lg text-[10px] bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-600">
                                {t('founders.manualGranted', 'Admin Granted')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-lg text-[10px] bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600">
                                {t('founders.autoQualified', 'Auto Qualified')}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4">
                            {m.status === 'active' ? (
                              <Badge className="rounded-lg text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                                {t('founders.activeStatus', 'Active')}
                              </Badge>
                            ) : (
                              <Badge className="rounded-lg text-[10px] bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold">
                                {t('founders.suspendedStatus', 'Suspended')}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleStatus(m.id, m.status)}
                                className="h-7 text-[11px] rounded-xl font-bold"
                              >
                                {m.status === 'active' ? t('common.suspend', 'Suspend') : t('common.activate', 'Activate')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteMember(m.id, m.seat_number)}
                                className="h-7 w-7 p-0 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
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

        {/* Tab 2: Distribution History Table */}
        {activeTab === 'history' && (
          <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold">{t('founders.distributionsTab', 'Distributions History')}</CardTitle>
              <CardDescription className="text-xs">
                {t('founders.distributionsDesc', 'Archive of monthly turnover, platform net margins, and allocated payouts.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {distributions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Coins className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">{t('founders.noDistributionsYet', 'No monthly distributions executed yet.')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left rtl:text-right">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-4 font-bold">{t('founders.distPeriodCol', 'Period')}</th>
                        <th className="p-4 font-bold">{t('founders.grossSales', 'Gross Sales')}</th>
                        <th className="p-4 font-bold">{t('founders.commissions', 'Commissions')}</th>
                        <th className="p-4 font-bold">{t('founders.platformNetProfit', 'Net Margin')}</th>
                        <th className="p-4 font-bold">{t('founders.distPoolCol', 'Total Pool (2%)')}</th>
                        <th className="p-4 font-bold">{t('founders.distBeneficiariesCol', 'Founders Count')}</th>
                        <th className="p-4 font-bold">{t('founders.distPerShareCol', 'Share / Founder')}</th>
                        <th className="p-4 font-bold">{t('founders.rolloverOut', 'Rollover')}</th>
                        <th className="p-4 font-bold">{t('founders.distStatusCol', 'Status')}</th>
                        <th className="p-4 font-bold">{t('founders.distDateCol', 'Executed At')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {distributions.map((d: any) => (
                        <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                            {d.period_month} / {d.period_year}
                          </td>
                          <td className="p-4">${Number(d.gross_sales).toLocaleString()}</td>
                          <td className="p-4 text-rose-500 font-semibold">-${Number(d.total_commissions).toFixed(2)}</td>
                          <td className="p-4 font-black text-slate-800 dark:text-slate-200">${Number(d.net_margin).toFixed(2)}</td>
                          <td className="p-4 font-black text-amber-600 dark:text-amber-400">${Number(d.total_pool_amount).toFixed(2)}</td>
                          <td className="p-4 font-bold">{d.founders_count} {t('founders.members', 'founders')}</td>
                          <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                            ${Number(d.share_per_founder).toFixed(2)}
                          </td>
                          <td className="p-4 text-slate-500">${Number(d.rollover_out).toFixed(2)}</td>
                          <td className="p-4">
                            {d.status === 'distributed' ? (
                              <Badge className="rounded-lg text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold">
                                {t('founders.statusDistributed', 'Distributed')}
                              </Badge>
                            ) : (
                              <Badge className="rounded-lg text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold">
                                {t('founders.statusRollover', 'Rolled Over')}
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-[11px] text-slate-400">
                            {d.executed_at ? new Date(d.executed_at).toLocaleString(isRtl ? 'ar-EG' : 'en-US') : '-'}
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

        {/* MODAL 1: Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 text-left rtl:text-right">
            <DialogHeader className="text-left rtl:text-right">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-600" />
                {t('founders.settingsModalTitle', 'Founder Club Settings')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t('founders.settingsModalDesc', 'Adjust eligibility thresholds, total available seats, and pool percentage calculation basis.')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveSettings} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.totalSeatsLabel', 'Total Available Seats')}</Label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={settingsForm.totalSeats}
                  onChange={(e) => setSettingsForm({ ...settingsForm, totalSeats: Number(e.target.value) })}
                  className="rounded-xl text-sm font-bold"
                />
                <p className="text-[10px] text-slate-400">{t('founders.totalSeatsHint', 'Default is 100 seats. Program permanently ends once all seats are claimed.')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.targetSalesLabel', 'Direct Sales Required ($ USD)')}</Label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  value={settingsForm.targetDirectSales}
                  onChange={(e) => setSettingsForm({ ...settingsForm, targetDirectSales: Number(e.target.value) })}
                  className="rounded-xl text-sm font-bold"
                />
                <p className="text-[10px] text-slate-400">{t('founders.targetSalesHint', 'Direct volume required within a 30-day window (Default $5,000).')}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.poolPctLabel', 'Monthly Pool Percentage (%)')}</Label>
                <Input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={settingsForm.poolPercentage}
                  onChange={(e) => setSettingsForm({ ...settingsForm, poolPercentage: Number(e.target.value) })}
                  className="rounded-xl text-sm font-bold"
                />
                <p className="text-[10px] text-slate-400">{t('founders.poolPctHint', 'Allocated monthly from platform net profit (Default 2%).')}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold block">{t('founders.activateFeatureLabel', 'Enable Founder Club')}</span>
                  <span className="text-[10px] text-slate-400">{t('founders.activateFeatureDesc', 'Allow new members to qualify and claim seats')}</span>
                </div>
                <Switch
                  checked={settingsForm.isActive}
                  onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, isActive: checked })}
                  className="data-[state=checked]:bg-amber-600"
                />
              </div>

              <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                <Button
                  type="submit"
                  disabled={savingSettings}
                  className="rounded-2xl font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 flex-1"
                >
                  {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {t('common.save', 'Save Changes')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-2xl font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL 2: Manual Grant Seat Dialog */}
        <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
          <DialogContent className="sm:max-w-md rounded-3xl p-6 text-left rtl:text-right">
            <DialogHeader className="text-left rtl:text-right">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                {t('founders.manualGrantTitle', 'Manually Grant Founder Seat')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t('founders.manualGrantDesc', 'Select an active user to award a permanent Founder Club seat.')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleGrantSeat} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.selectUser', 'Select Member')}</Label>
                <select
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- {t('founders.selectUserPlaceholder', 'Select member from directory')} ({candidateStudents.length}) --</option>
                  {candidateStudents.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.customSeatNumber', 'Custom Seat Number (Optional)')}</Label>
                <Input
                  type="number"
                  min="1"
                  max={settings.totalSeats}
                  placeholder={t('founders.seatAutoHint', 'Leave empty to automatically assign next vacant seat')}
                  value={grantForm.customSeatNumber}
                  onChange={(e) => setGrantForm({ ...grantForm, customSeatNumber: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{t('founders.grantNotes', 'Grant Reason / Administrative Notes')}</Label>
                <Input
                  placeholder={t('founders.grantNotesPlaceholder', 'e.g., Honorary founder seat awarded to top regional leader')}
                  value={grantForm.notes}
                  onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                  className="rounded-xl text-xs"
                />
              </div>

              <DialogFooter className="flex gap-2 sm:justify-start pt-2">
                <Button
                  type="submit"
                  disabled={granting}
                  className="rounded-2xl font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 flex-1"
                >
                  {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                  {t('founders.confirmGrantBtn', 'Confirm & Award Founder Seat')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setGrantOpen(false)}
                  className="rounded-2xl font-bold"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* MODAL 3: Execute Distribution Modal with Live Preview */}
        <Dialog open={distOpen} onOpenChange={setDistOpen}>
          <DialogContent className="sm:max-w-2xl rounded-3xl p-6 text-left rtl:text-right max-h-[90vh] overflow-y-auto">
            <DialogHeader className="text-left rtl:text-right">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-600" />
                {t('founders.distributeModalTitle', 'Execute Monthly 2% Founder Pool Distribution')}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {t('founders.distributeModalDesc', 'Distribute 2% of the selected month platform net profit equally among all qualified active Founders.')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Period Selectors */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500">{t('founders.distributionYear', 'Distribution Year')}</Label>
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <Label className="text-[11px] font-bold text-slate-500">{t('founders.distributionMonth', 'Distribution Month')}</Label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold focus:outline-hidden"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {new Date(2026, m - 1, 1).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long' })} ({m})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="self-end pb-0.5">
                  <Button
                    type="button"
                    onClick={handleFetchPreview}
                    disabled={previewLoading}
                    variant="outline"
                    className="rounded-xl font-bold text-xs gap-1.5 h-9"
                  >
                    {previewLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                    {t('founders.previewDistribution', 'Preview Calculations')}
                  </Button>
                </div>
              </div>

              {/* Preview Numbers Card */}
              {previewLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500 mb-2" />
                  <p className="text-xs text-slate-400">{t('common.loading', 'Calculating net profit margins and pool balance...')}</p>
                </div>
              ) : previewData ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  {previewData.isAlreadyDistributed ? (
                    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>{t('founders.alreadyDistributedWarning', 'Notice: Profit distribution for this period was already executed!')}</span>
                    </div>
                  ) : null}

                  {/* Financial Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t('founders.grossSales', 'Gross Package Sales')}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ${Number(previewData.grossSales || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{t('founders.commissions', 'Team Commissions Paid')}</span>
                      <span className="text-sm font-black text-rose-500">
                        -${Number(previewData.totalCommissions || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                      <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">{t('founders.platformNetProfit', 'Net Profit Margin')}</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ${Number(previewData.netMargin || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-0.5">{t('founders.distPoolCol', 'Total 2% Pool')}</span>
                      <span className="text-base font-black text-amber-600 dark:text-amber-400">
                        ${Number(previewData.totalPoolAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Share per Founder Highlight */}
                  <div className="p-4 rounded-2xl bg-linear-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        {t('founders.distBeneficiariesCol', 'Qualified Founders Count')}: <strong className="text-slate-900 dark:text-white">{previewData.foundersCount}</strong>
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        {t('founders.rolloverLabel', 'Rollover Balance')}: <strong className="text-slate-700 dark:text-slate-300">${Number(previewData.rolloverOut || 0).toFixed(2)}</strong>
                      </span>
                    </div>

                    <div className="text-left rtl:text-right">
                      <span className="text-[10px] font-bold text-amber-600 block">{t('founders.distPerShareCol', 'Share / Founder')}</span>
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                        ${Number(previewData.sharePerFounder || 0).toFixed(2)} <span className="text-xs font-normal">USD</span>
                      </span>
                    </div>
                  </div>

                  {/* Beneficiaries List */}
                  {previewData.founders && previewData.founders.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        {t('founders.qualifiedBeneficiariesList', 'Eligible Founders for Instant Credit:')}
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                        {previewData.founders.map((f: any) => (
                          <div key={f.member_id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 font-black">
                                #{f.seat_number}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{f.full_name}</span>
                              <span className="text-[10px] text-slate-400">({f.email})</span>
                            </div>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">
                              +${Number(previewData.sharePerFounder || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-center text-xs text-slate-500">
                      {t('founders.noQualifiersRolloverNotice', `No founders are currently qualified. If distribution is confirmed, the full pool ($${Number(previewData.totalPoolAmount).toFixed(2)}) will automatically roll over to next month.`)}
                    </div>
                  )}

                  {/* Notes Input */}
                  <div className="space-y-1">
                    <Label className="text-xs font-bold">{t('founders.distNotes', 'Distribution Notes (Optional)')}</Label>
                    <Input
                      placeholder={t('founders.distNotesPlaceholder', 'e.g., September 2026 Founder Club 2% net profit allocation')}
                      value={distNotes}
                      onChange={(e) => setDistNotes(e.target.value)}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="flex gap-2 sm:justify-start pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                onClick={handleExecuteDistribution}
                disabled={executingDist || !previewData || previewData.isAlreadyDistributed}
                className="rounded-2xl font-bold bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white gap-2 flex-1 shadow-md shadow-amber-500/20"
              >
                {executingDist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                {t('founders.confirmDistributeBtn', 'Confirm & Execute Distribution')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDistOpen(false)}
                className="rounded-2xl font-bold"
              >
                {t('common.close', 'Close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
