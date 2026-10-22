import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminAffiliateService } from '@/services/apiService';
import { 
  Wallet, 
  Search, 
  RotateCcw, 
  Plus, 
  Minus, 
  TrendingUp, 
  User, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpDown,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function WalletManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalMembers: 0, membersWithBalance: 0, totalBalances: 0, totalCommissionsPaid: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_balance'>('all');
  const [sortOption, setSortOption] = useState<'normal' | 'max_balance' | 'max_commissions'>('normal');

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadWallets();
  }, [filterType, sortOption]);

  const loadWallets = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getWallets({
        search: searchTerm,
        filter: filterType === 'with_balance' ? 'with_balance' : undefined,
        sort: sortOption !== 'normal' ? sortOption : undefined,
      });
      setMembers(res.members || []);
      setStats(res.stats || { totalMembers: 0, membersWithBalance: 0, totalBalances: 0, totalCommissionsPaid: 0 });
    } catch (err: any) {
      toast.error(tr("فشل تحميل بيانات المحافظ", "Failed to load wallet data"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadWallets();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setSortOption('normal');
    setTimeout(() => {
      adminAffiliateService.getWallets().then(res => {
        setMembers(res.members || []);
        setStats(res.stats || { totalMembers: 0, membersWithBalance: 0, totalBalances: 0, totalCommissionsPaid: 0 });
      });
    }, 50);
  };

  const handleToggleWithdrawal = async (user: any, currentVal: boolean) => {
    try {
      const newVal = !currentVal;
      await adminAffiliateService.toggleUserWithdrawal({
        userId: user.id,
        canWithdraw: newVal,
      });
      toast.success(
        tr(`تم ${newVal ? 'تفعيل' : 'تعطيل'} إمكانية السحب لـ ${user.name}`, `Withdrawal access ${newVal ? 'enabled' : 'disabled'} for ${user.name}`)
      );
      setMembers(prev => prev.map(m => m.id === user.id ? { ...m, can_withdraw: newVal ? 1 : 0 } : m));
    } catch (err: any) {
      toast.error(tr("فشل تعديل حالة السحب", "Failed to update withdrawal status"));
    }
  };

  const handleOpenActionModal = (user: any, type: 'credit' | 'debit') => {
    setSelectedUser(user);
    setActionType(type);
    setAmount('');
    setNote('');
  };

  const handleActionSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      return toast.error(tr("يرجى تحديد مبلغ صالح", "Please specify a valid amount"));
    }
    if (!selectedUser || !actionType) return;

    try {
      setActionLoading(true);
      const res = await adminAffiliateService.adjustWalletBalance({
        userId: selectedUser.id,
        action: actionType,
        amount: Number(amount),
        note: note.trim() || undefined,
      });

      toast.success(res.message || (tr("تم تحديث رصيد العضو بنجاح", "Member balance updated successfully")));
      setActionType(null);
      setSelectedUser(null);
      loadWallets();
    } catch (err: any) {
      toast.error(err.response?.data?.error || (tr("فشل تعديل رصيد المحفظة", "Failed to adjust wallet balance")));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
              <Wallet className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-1">
                Wallet
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add or deduct funds from user wallets and sort members by wallet balances and profits
              </p>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-auto sm:min-w-[240px]">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email, name or referral..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full"
              />
            </form>

            <select
              value={sortOption}
              onChange={(e: any) => setSortOption(e.target.value)}
              className="text-xs font-semibold rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full sm:w-auto"
            >
              <option value="normal">Highest Wallet Balance (Max → Min)</option>
              <option value="max_balance">Max Balance First</option>
              <option value="max_commissions">Max Profits / Commissions First</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-2xl text-xs font-bold gap-1 text-slate-600 dark:text-slate-300 w-full sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Normal
            </Button>
          </div>
        </div>

        {/* Filter Chips & Total Stats Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold">
            <span className="text-slate-400 text-xs">Filter:</span>
            
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-1.5 rounded-full transition-all ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All Members ({stats.totalMembers})
            </button>

            <button
              onClick={() => setFilterType('with_balance')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all ${
                filterType === 'with_balance'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              With Balance Only (&gt; $0) ({stats.membersWithBalance})
            </button>

            <button
              onClick={() => setSortOption('max_balance')}
              className={`px-3 py-1.5 rounded-full transition-all ${
                sortOption === 'max_balance'
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              ↓ Max Balance First
            </button>

            <button
              onClick={() => setSortOption('max_commissions')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                sortOption === 'max_commissions'
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
              }`}
            >
              <TrendingUp className="h-3 w-3" />
              Max Profits First
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-slate-500">
              Shown: <strong className="text-slate-800 dark:text-white">{members.length} / {stats.totalMembers}</strong>
            </span>
            <div className="px-3.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
              Total Balances: <span className="font-mono text-sm font-black">${stats.totalBalances.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Members Wallets Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Referral Code</th>
                  <th className="p-4 text-emerald-600 dark:text-emerald-400">Main ↓</th>
                  <th className="p-4 text-purple-600 dark:text-purple-400">Commissions</th>
                  <th className="p-4">Bonus</th>
                  <th className="p-4 text-center">Enable Investment / Withdrawal</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Loading member wallets...
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  members.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                          {idx + 1}
                        </span>
                      </td>

                      {/* User Cell */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-700">
                            <AvatarImage src={u.avatar_url ? `${import.meta.env.VITE_API_URL}${u.avatar_url}` : undefined} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{u.name}</p>
                            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">@{u.name?.toLowerCase().replace(/\s+/g, '')}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Referral Code */}
                      <td className="p-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border text-slate-600 dark:text-slate-300">
                          {u.affiliate_code || 'NV------'}
                        </span>
                      </td>

                      {/* Main Balance */}
                      <td className="p-4 font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        ${Number(u.main_balance).toFixed(2)}
                      </td>

                      {/* Commissions */}
                      <td className="p-4 font-mono font-black text-sm text-purple-600 dark:text-purple-400">
                        ${Number(u.commissions).toFixed(2)}
                      </td>

                      {/* Bonus */}
                      <td className="p-4 font-mono font-semibold text-xs text-slate-500">
                        ${Number(u.bonus).toFixed(2)}
                      </td>

                      {/* Enable Withdrawal Switch */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Switch
                            checked={Boolean(u.can_withdraw)}
                            onCheckedChange={() => handleToggleWithdrawal(u, Boolean(u.can_withdraw))}
                            className="data-[state=checked]:bg-indigo-600"
                          />
                        </div>
                      </td>

                      {/* Actions (+ / -) */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenActionModal(u, 'credit')}
                            title="Add Funds (+)"
                            className="h-8 w-8 rounded-full flex items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(u, 'debit')}
                            title="Deduct Funds (-)"
                            className="h-8 w-8 rounded-full flex items-center justify-center border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Adjust Funds Modal (+ / -) */}
        <Dialog open={Boolean(actionType)} onOpenChange={(open) => !open && setActionType(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                {actionType === 'credit' ? (
                  <span className="text-emerald-600 flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    {tr("إضافة رصيد للمحفظة", "Credit Wallet Balance")}
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-2">
                    <Minus className="h-5 w-5" />
                    {tr("خصم رصيد من المحفظة", "Debit Wallet Balance")}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {`${tr("تعديل الرصيد الأساسي لـ", "Adjusting main balance for")} ${selectedUser?.name || ''} (${selectedUser?.email || ''})`}
                <br />
                {tr("الرصيد الحالي:", "Current Balance:")} <span className="font-mono font-bold text-emerald-600">${Number(selectedUser?.main_balance || 0).toFixed(2)} USD</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">{tr("المبلغ ($ USD)", "Amount ($ USD)")}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-xl pl-8 text-sm"
                  />
                  <span className="absolute left-3 top-2.5 font-bold text-xs text-slate-400">$</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">{tr("ملاحظة / سبب العملية (اختياري)", "Note / Reason (Optional)")}</Label>
                <Textarea
                  placeholder={tr("اكتب سبب الإضافة أو الخصم لتسجيله في كشف الحساب المالي...", "Enter reason for audit and statement records...")}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="rounded-xl text-xs min-h-[70px]"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setActionType(null)} className="rounded-xl">
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                onClick={handleActionSubmit}
                disabled={actionLoading}
                className={`rounded-xl font-bold text-white ${
                  actionType === 'credit'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (tr("تأكيد العملية", "Confirm Action"))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
