import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { adminBonusPoolService } from '@/services/apiService';
import { 
  Coins, 
  Sparkles, 
  Award, 
  Plus, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Calendar, 
  ArrowRightLeft, 
  History, 
  Loader2, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminBonusPools() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [pools, setPools] = useState<any[]>([]);
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');

  // Period Selector (Defaults to current month)
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);

  // Preview Data
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // History Data
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pools' | 'history'>('pools');

  // Create Pool Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    name_ar: '',
    target_rank_id: '',
    pool_percentage: 2.0,
    calculation_basis: 'net_margin'
  });
  const [creating, setCreating] = useState(false);

  // Edit Pool Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editingPool, setEditingPool] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    name_ar: '',
    target_rank_id: '',
    pool_percentage: 2.0,
    calculation_basis: 'net_margin',
    is_active: true,
    current_rollover: 0
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Distribution Execution Modal
  const [execOpen, setExecOpen] = useState(false);
  const [execNotes, setExecNotes] = useState('');
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadPools();
    loadHistory();
  }, []);

  const loadPools = async () => {
    try {
      setLoading(true);
      const res = await adminBonusPoolService.getPools();
      setPools(res.pools || []);
      setRanks(res.ranks || []);

      if (res.pools && res.pools.length > 0) {
        if (!selectedPoolId || !res.pools.some((p: any) => p.id === selectedPoolId)) {
          setSelectedPoolId(res.pools[0].id);
        }
      }
    } catch (err: any) {
      toast.error(t('bonusPools.loadPoolsFailed', 'Failed to load bonus pools'));
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await adminBonusPoolService.getHistory();
      setHistoryList(res.history || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Whenever selected pool, year, or month changes, reload live calculation preview
  useEffect(() => {
    if (selectedPoolId) {
      loadPreview(selectedPoolId, selectedYear, selectedMonth);
    }
  }, [selectedPoolId, selectedYear, selectedMonth]);

  const loadPreview = async (poolId: string, year: number, month: number) => {
    try {
      setPreviewLoading(true);
      const res = await adminBonusPoolService.previewDistribution(poolId, { year, month });
      setPreviewData(res);
    } catch (err: any) {
      toast.error(t('bonusPools.loadPreviewFailed', 'Failed to calculate live estimates'));
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name || !createForm.name_ar) {
      toast.error(t('bonusPools.fillAllRequired', 'Please fill in all required fields'));
      return;
    }

    try {
      setCreating(true);
      await adminBonusPoolService.createPool(createForm);
      toast.success(t('bonusPools.createSuccess', 'Bonus pool created successfully'));
      setCreateOpen(false);
      setCreateForm({
        name: '',
        name_ar: '',
        target_rank_id: '',
        pool_percentage: 2.0,
        calculation_basis: 'net_margin'
      });
      loadPools();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('bonusPools.saveFailed', 'Failed to create bonus pool'));
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (pool: any) => {
    setEditingPool(pool);
    setEditForm({
      name: pool.name,
      name_ar: pool.name_ar,
      target_rank_id: pool.target_rank_id || '',
      pool_percentage: Number(pool.pool_percentage || 2.0),
      calculation_basis: pool.calculation_basis || 'net_margin',
      is_active: pool.is_active === 1,
      current_rollover: Number(pool.current_rollover || 0)
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPool) return;

    try {
      setSavingEdit(true);
      await adminBonusPoolService.updatePool(editingPool.id, editForm);
      toast.success(t('bonusPools.updateSuccess', 'Changes saved successfully'));
      setEditOpen(false);
      loadPools();
      if (selectedPoolId === editingPool.id) {
        loadPreview(editingPool.id, selectedYear, selectedMonth);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('bonusPools.saveFailed', 'Failed to save changes'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExecuteDistribution = async () => {
    if (!selectedPoolId) return;

    try {
      setExecuting(true);
      const res = await adminBonusPoolService.executeDistribution(selectedPoolId, {
        year: selectedYear,
        month: selectedMonth,
        notes: execNotes
      });
      toast.success(res.message || t('bonusPools.distributeSuccess', 'Operation completed successfully'));
      setExecOpen(false);
      setExecNotes('');
      loadPools();
      loadHistory();
      loadPreview(selectedPoolId, selectedYear, selectedMonth);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('bonusPools.distributeFailed', 'Failed to execute distribution'));
    } finally {
      setExecuting(false);
    }
  };

  const selectedPool = pools.find(p => p.id === selectedPoolId);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl border border-indigo-500/20">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('bonusPools.globalBonusPoolsBadge', 'Global Leadership Bonus Pools System')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {t('bonusPools.adminTitle', 'Leadership Bonus Pools Management')}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              {t('bonusPools.adminDesc', 'Comprehensive management of company bonus pools (e.g. Diamond Rank 2% Pool), automated rollover when qualifiers are zero, and single-click wallet payouts for qualified leaders.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => {
                setCreateForm({
                  name: '',
                  name_ar: '',
                  target_rank_id: ranks[ranks.length - 1]?.id || '',
                  pool_percentage: 2.0,
                  calculation_basis: 'net_margin'
                });
                setCreateOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('bonusPools.createNewPool', 'Create New Bonus Pool')}</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <Button
            variant={activeTab === 'pools' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('pools')}
            className="flex items-center gap-2"
          >
            <Coins className="w-4 h-4" />
            <span>{t('bonusPools.poolsAndDistributionTab', 'Pools & Distribution Calculations')}</span>
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('history')}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            <span>{t('bonusPools.historyTab', 'Monthly Distribution Archive')} ({historyList.length})</span>
          </Button>
        </div>

        {activeTab === 'pools' ? (
          <>
            {/* Pools Selector Cards */}
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : pools.length === 0 ? (
              <Card className="border-dashed p-8 text-center">
                <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold">{t('bonusPools.noPools', 'No bonus pools configured yet.')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('bonusPools.noPoolsDesc', 'Click the button above to create your first leadership bonus pool.')}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pools.map((p) => {
                  const isSelected = p.id === selectedPoolId;
                  const poolTitle = isRtl ? (p.name_ar || p.name) : (p.name || p.name_ar);
                  const poolSubTitle = isRtl ? p.name : p.name_ar;
                  const rankTitle = isRtl 
                    ? (p.rank_name_ar || `${t('bonusPools.level', 'Level')} ${p.target_rank_level}`)
                    : (p.rank_name || `${t('bonusPools.level', 'Level')} ${p.target_rank_level}`);

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPoolId(p.id)}
                      className={`relative p-5 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white">
                              {poolTitle}
                            </h3>
                            {p.is_active === 1 ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-medium">
                                {t('bonusPools.activeStatus', 'Active')}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-500 text-xs">
                                {t('common.none', 'Inactive')}
                              </Badge>
                            )}
                          </div>
                          {poolSubTitle && <p className="text-xs text-slate-500">{poolSubTitle}</p>}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(p);
                          }}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                          <span>{t('bonusPools.targetRankLabel', 'Target Rank')}:</span>
                          <span className="font-bold" style={{ color: p.rank_color || '#8b5cf6' }}>
                            {rankTitle}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                          <span>{t('bonusPools.poolPercentageLabel', 'Pool Percentage')}:</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {Number(p.pool_percentage)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                          <span>{t('bonusPools.calculationBasisLabel', 'Calculation Basis')}:</span>
                          <span className="font-medium">
                            {p.calculation_basis === 'gross_sales' 
                              ? t('bonusPools.grossSales', 'Gross Sales') 
                              : t('bonusPools.netMargin', 'Platform Net Margin')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 bg-amber-50 dark:bg-amber-950/20 px-2 rounded-md">
                          <span className="text-amber-800 dark:text-amber-300">{t('bonusPools.currentRolloverLabel', 'Current Rollover Balance')}:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            ${Number(p.current_rollover || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected Pool Distribution Preview & Execution */}
            {selectedPool && (
              <Card className="border border-slate-200 dark:border-slate-800 shadow-sm mt-6">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <CardTitle className="text-xl">
                          {t('bonusPools.poolCalculationsFor', 'Calculations & Payout:')} {isRtl ? (selectedPool.name_ar || selectedPool.name) : (selectedPool.name || selectedPool.name_ar)} ({selectedPool.pool_percentage}%)
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-1">
                        {t('bonusPools.poolCalculationsDesc', 'Live preview of month sales, net profit margin, and qualified leaders.')}
                      </CardDescription>
                    </div>

                    {/* Period Controls (Year & Month) */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                      <Label className="text-xs text-slate-500 font-medium px-2">{t('bonusPools.distributionCycle', 'Distribution Cycle:')}</Label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-transparent text-sm font-semibold border-none focus:outline-hidden cursor-pointer"
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {t('bonusPools.month', 'Month')} {i + 1}
                          </option>
                        ))}
                      </select>
                      <span className="text-slate-300">/</span>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-transparent text-sm font-semibold border-none focus:outline-hidden cursor-pointer"
                      >
                        {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {previewLoading ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                      <span className="mx-3 text-slate-500 text-sm">{t('bonusPools.calculatingLiveData', 'Calculating live financial data...')}</span>
                    </div>
                  ) : previewData ? (
                    <>
                      {/* Financial KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                            <span>{t('bonusPools.monthGrossSales', 'Monthly Gross Sales')}</span>
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            ${previewData.financials?.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-400">({previewData.financials?.salesCount} {t('bonusPools.transactions', 'transactions')})</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-rose-500" />
                            <span>{t('bonusPools.paidCommissions', 'Commissions Paid')}</span>
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-rose-600 dark:text-rose-400">
                            ${previewData.financials?.totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-400">({previewData.financials?.commCount} {t('bonusPools.commissionsCount', 'commissions')})</p>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{t('bonusPools.platformNetMargin', 'Platform Net Margin')}</span>
                          </p>
                          <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            ${previewData.financials?.netMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-slate-400">
                            ({t('bonusPools.basis', 'Basis')}: {previewData.financials?.basis === 'gross_sales' ? t('bonusPools.grossSales', 'Gross Sales') : t('bonusPools.netMargin', 'Platform Net Margin')})
                          </p>
                        </div>

                        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                          <p className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{t('bonusPools.totalPoolValue', 'Total Pool Value')} ({selectedPool.pool_percentage}%)</span>
                          </p>
                          <p className="text-xl sm:text-2xl font-black text-indigo-700 dark:text-indigo-300">
                            ${previewData.financials?.totalPoolAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80">
                            {t('bonusPools.rollover', 'Rollover')}: ${previewData.financials?.rolloverIn.toFixed(2)} + {t('bonusPools.month', 'Month')}: ${previewData.financials?.poolBaseAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Distribution Status Banner */}
                      {previewData.existingDistribution ? (
                        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                          previewData.existingDistribution.status === 'distributed'
                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50'
                            : 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <CheckCircle className={`w-6 h-6 ${
                              previewData.existingDistribution.status === 'distributed' ? 'text-emerald-600' : 'text-amber-600'
                            }`} />
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {previewData.existingDistribution.status === 'distributed'
                                  ? t('bonusPools.distributedSuccessNotice', 'Monthly profits successfully distributed (${{amount}} USD)', { amount: Number(previewData.existingDistribution.total_pool_amount).toFixed(2) })
                                  : t('bonusPools.rolledOverNotice', 'Cycle registered as rolled over (${{amount}} USD)', { amount: Number(previewData.existingDistribution.rollover_out).toFixed(2) })}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t('bonusPools.executedAt', 'Executed at:')} {new Date(previewData.existingDistribution.executed_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-bold">
                            {previewData.existingDistribution.status === 'distributed' 
                              ? t('bonusPools.statusCompleted', 'Distributed & Completed') 
                              : t('bonusPools.statusRolledOver', 'Rolled over to next month')}
                          </Badge>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                              <Coins className="w-4 h-4 text-blue-600" />
                              <span>{t('bonusPools.statusPending', 'Cycle Status: Not distributed yet')} ({selectedMonth} / {selectedYear})</span>
                            </p>
                            <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                              {previewData.financials?.eligibleCount > 0
                                ? t('bonusPools.hasEligibleNotice', 'There are {{count}} eligible leaders to receive ${{share}} USD each.', { count: previewData.financials?.eligibleCount, share: previewData.financials?.sharePerLeader.toFixed(2) })
                                : t('bonusPools.noEligibleNotice', 'No eligible leaders for this rank currently. Executing will rollover the full pool amount to next month.')}
                            </p>
                          </div>

                          <Button
                            onClick={() => setExecOpen(true)}
                            className={`font-bold shadow-md flex items-center gap-2 ${
                              previewData.financials?.eligibleCount > 0
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                            }`}
                          >
                            <Coins className="w-4 h-4" />
                            <span>
                              {previewData.financials?.eligibleCount > 0
                                ? t('bonusPools.distributeBtnWithCount', 'Distribute Pool ({{count}} Leaders)', { count: previewData.financials?.eligibleCount })
                                : t('bonusPools.rolloverBtnWithAmount', 'Rollover Balance to Next Month (${{amount}} USD)', { amount: previewData.financials?.totalPoolAmount.toFixed(2) })}
                            </span>
                          </Button>
                        </div>
                      )}

                      {/* Qualified Leaders List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span>
                              {t('bonusPools.eligibleLeadersHeader', 'Eligible Leaders for {{rank}} ({{count}})', {
                                rank: isRtl ? (selectedPool.rank_name_ar || `${t('bonusPools.level', 'Level')} ${selectedPool.target_rank_level}`) : (selectedPool.rank_name || `${t('bonusPools.level', 'Level')} ${selectedPool.target_rank_level}`),
                                count: previewData.eligibleLeaders?.length || 0
                              })}
                            </span>
                          </h4>
                          <span className="text-xs text-slate-500">
                            {t('bonusPools.conditionsLabel', 'Conditions: {{direct}} direct sales + ${{turnover}} team turnover', {
                              direct: selectedPool.min_direct_sales || selectedPool.rank_min_direct_sales || 50,
                              turnover: Number(selectedPool.min_team_turnover || selectedPool.rank_min_team_turnover || 50000).toLocaleString()
                            })}
                          </span>
                        </div>

                        {previewData.eligibleLeaders?.length === 0 ? (
                          <div className="p-8 text-center border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900/50">
                            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                              {t('bonusPools.noEligibleLeadersTitle', 'No leaders have met the qualifications for this rank yet')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {t('bonusPools.noEligibleLeadersSubtitle', 'When there are no qualifiers, the full pool amount (${{amount}} USD) automatically rolls over to next month.', {
                                amount: previewData.financials?.totalPoolAmount.toFixed(2)
                              })}
                            </p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                            <table className="w-full text-start text-sm">
                              <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="p-3 text-start">{t('bonusPools.leaderCol', 'Leader')}</th>
                                  <th className="p-3 text-start">{t('bonusPools.affiliateCodeCol', 'Affiliate Code')}</th>
                                  <th className="p-3 text-start">{t('bonusPools.directSalesCol', 'Direct Sales')}</th>
                                  <th className="p-3 text-start">{t('bonusPools.teamSalesCol', 'Team Turnover')}</th>
                                  <th className="p-3 text-end">{t('bonusPools.estimatedShareCol', 'Estimated Share')}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {previewData.eligibleLeaders?.map((leader: any) => (
                                  <tr key={leader.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                                    <td className="p-3">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300">
                                          {leader.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                            {leader.full_name}
                                          </p>
                                          <p className="text-xs text-slate-400">{leader.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                                      {leader.affiliate_code || '-'}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                      {leader.direct_sales} {t('bonusPools.membersSuffix', 'members')}
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                                      ${leader.team_turnover.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-3 text-end font-black text-indigo-600 dark:text-indigo-400">
                                      ${previewData.financials?.sharePerLeader.toFixed(2)} USD
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* History Tab */
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-lg">{t('bonusPools.historyTitle', 'Distribution History Log')}</CardTitle>
              <CardDescription>
                {t('bonusPools.historyArchiveDesc', 'Audited archive of all payout and rollover operations executed across leadership bonus pools.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {historyLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>{t('bonusPools.noHistoryArchive', 'No previous distribution records found in archive')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-start text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5 text-start">{t('bonusPools.period', 'Period')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.pool', 'Bonus Pool')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.netMargin', 'Platform Net Margin')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.rollover', 'Rollover')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.totalAmount', 'Total Distributed')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.qualifiers', 'Qualifiers')}</th>
                        <th className="p-3.5 text-start">{t('bonusPools.sharePerLeader', 'Share per Qualifier')}</th>
                        <th className="p-3.5 text-start">{t('common.status', 'Status')}</th>
                        <th className="p-3.5 text-end">{t('bonusPools.distributedAt', 'Distributed At')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {historyList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <td className="p-3.5 font-bold font-mono text-xs">
                            {item.period_month}/{item.period_year}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                            {isRtl ? (item.pool_name_ar || item.pool_name) : (item.pool_name || item.pool_name_ar)} ({item.pool_percentage}%)
                          </td>
                          <td className="p-3.5">
                            ${Number(item.net_margin).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 text-amber-600 font-medium">
                            ${Number(item.rollover_in).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5 font-bold text-indigo-600">
                            ${Number(item.total_pool_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3.5">
                            {item.eligible_leaders_count}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-600">
                            ${Number(item.share_per_leader).toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            {item.status === 'distributed' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                {t('bonusPools.statusCompleted', 'Distributed & Completed')}
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                {t('bonusPools.statusRolledOver', 'Rolled over to next month')}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3.5 text-end text-xs text-slate-500">
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

      {/* CREATE POOL MODAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[480px]" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>{t('bonusPools.createModalTitle', 'Create New Bonus Pool')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('bonusPools.createModalDesc', 'Add a new bonus pool, set the qualifying rank, and define the profit share percentage.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePool} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.poolNameAr', 'Pool Name (Arabic) *')}</Label>
              <Input
                placeholder={tr("مثال: حوض قيادة الماس الشهري", "e.g. Monthly Diamond Leadership Pool")}
                value={createForm.name_ar}
                onChange={(e) => setCreateForm({ ...createForm, name_ar: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.poolNameEn', 'Pool Name (English) *')}</Label>
              <Input
                placeholder="e.g. Diamond Leadership Pool"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.targetRankRequired', 'Target Qualifying Rank *')}</Label>
              <select
                value={createForm.target_rank_id}
                onChange={(e) => setCreateForm({ ...createForm, target_rank_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">{t('bonusPools.selectRankPlaceholder', 'Select rank...')}</option>
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isRtl ? (r.name_ar || r.name) : (r.name || r.name_ar)} ({t('bonusPools.level', 'Level')} {r.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t('bonusPools.percentageRequired', 'Percentage (%) *')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={createForm.pool_percentage}
                  onChange={(e) => setCreateForm({ ...createForm, pool_percentage: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t('bonusPools.calculationBasisTitle', 'Calculation Basis')}</Label>
                <select
                  value={createForm.calculation_basis}
                  onChange={(e) => setCreateForm({ ...createForm, calculation_basis: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-hidden"
                >
                  <option value="net_margin">{t('bonusPools.netMargin', 'Platform Net Margin')}</option>
                  <option value="gross_sales">{t('bonusPools.grossSales', 'Gross Sales')}</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {creating ? <Loader2 className="w-4 h-4 animate-spin mx-2" /> : null}
                <span>{t('bonusPools.createPoolSubmit', 'Create Pool')}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT POOL MODAL */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-indigo-600" />
              <span>{t('bonusPools.editModalTitle', 'Edit Bonus Pool Terms')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('bonusPools.editModalDesc', 'Modify percentage, target rank, or activate/deactivate the pool.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.poolNameAr', 'Pool Name (Arabic)')}</Label>
              <Input
                value={editForm.name_ar}
                onChange={(e) => setEditForm({ ...editForm, name_ar: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.poolNameEn', 'Pool Name (English)')}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('bonusPools.targetRankRequired', 'Target Qualifying Rank')}</Label>
              <select
                value={editForm.target_rank_id}
                onChange={(e) => setEditForm({ ...editForm, target_rank_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-hidden"
              >
                {ranks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {isRtl ? (r.name_ar || r.name) : (r.name || r.name_ar)} ({t('bonusPools.level', 'Level')} {r.level})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t('bonusPools.percentageRequired', 'Percentage (%)')}</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  value={editForm.pool_percentage}
                  onChange={(e) => setEditForm({ ...editForm, pool_percentage: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t('bonusPools.currentRolloverLabel', 'Current Rollover Balance ($)')}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.current_rollover}
                  onChange={(e) => setEditForm({ ...editForm, current_rollover: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={editForm.is_active}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
              />
              <Label htmlFor="is_active_toggle" className="text-sm cursor-pointer">
                {t('bonusPools.activePoolCheckbox', 'Pool is active and visible to members')}
              </Label>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={savingEdit} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mx-2" /> : null}
                <span>{t('bonusPools.saveChanges', 'Save Changes')}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM EXECUTE DISTRIBUTION MODAL */}
      <Dialog open={execOpen} onOpenChange={setExecOpen}>
        <DialogContent className="sm:max-w-[480px]" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-600">
              <Coins className="w-5 h-5" />
              <span>{t('bonusPools.confirmExecutionTitle', 'Confirm Bonus Pool Distribution')}</span>
            </DialogTitle>
            <DialogDescription>
              {t('bonusPools.confirmExecutionDesc', 'Please review the summary carefully before final execution.')}
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1.5 border">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bonusPools.poolLabel', 'Pool:')}</span>
                  <span className="font-bold">{isRtl ? (selectedPool?.name_ar || selectedPool?.name) : (selectedPool?.name || selectedPool?.name_ar)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bonusPools.cycleLabel', 'Cycle:')}</span>
                  <span className="font-bold font-mono">{selectedMonth} / {selectedYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bonusPools.availablePoolAmount', 'Total Pool Amount:')}</span>
                  <span className="font-bold text-indigo-600">${previewData.financials?.totalPoolAmount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t('bonusPools.qualifiersCountLabel', 'Eligible Leaders:')}</span>
                  <span className="font-bold">{previewData.financials?.eligibleCount}</span>
                </div>
                {previewData.financials?.eligibleCount > 0 ? (
                  <div className="flex justify-between border-t pt-1.5 text-emerald-600">
                    <span className="font-semibold">{t('bonusPools.qualifierShareLabel', 'Share per Qualifier:')}</span>
                    <span className="font-black">${previewData.financials?.sharePerLeader.toFixed(2)} USD</span>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-100/60 dark:bg-amber-950/40 rounded text-xs text-amber-800 dark:text-amber-300 font-medium">
                    {t('bonusPools.rolloverWarning', '⚠️ No qualifiers found; the full amount (${{amount}} USD) will roll over to next month\'s pool.', { amount: previewData.financials?.totalPoolAmount.toFixed(2) })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{t('bonusPools.adminNotesLabel', 'Administrative Notes (Optional)')}</Label>
                <Input
                  placeholder={t('bonusPools.adminNotesPlaceholder', 'Documentation notes for this cycle...')}
                  value={execNotes}
                  onChange={(e) => setExecNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t gap-2">
            <Button type="button" variant="outline" onClick={() => setExecOpen(false)}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={handleExecuteDistribution}
              disabled={executing}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              {executing ? <Loader2 className="w-4 h-4 animate-spin mx-2" /> : <Check className="w-4 h-4 mx-2" />}
              <span>{t('bonusPools.confirmAndExecuteBtn', 'Confirm & Execute Distribution')}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
