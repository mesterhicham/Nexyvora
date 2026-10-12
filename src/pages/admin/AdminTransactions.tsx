import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminAffiliateService } from '@/services/apiService';
import { 
  Search, 
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTransactions() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [typeFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getTransactions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        search: searchTerm || undefined,
      });
      setTransactions(res.transactions || []);
    } catch (err: any) {
      toast.error(t('adminTransactions.loadError', 'Failed to load financial transactions ledger'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadTransactions();
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'package_purchase':
        return <Badge className="bg-sky-100 dark:bg-sky-950/60 text-sky-700 border-sky-300">{t('adminTransactions.badgeDeposit', 'Package Deposit')}</Badge>;
      case 'withdrawal':
        return <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 border-rose-300">{t('adminTransactions.badgeWithdrawal', 'Withdrawal')}</Badge>;
      case 'commission':
        return <Badge className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 border-purple-300">{t('adminTransactions.badgeCommission', 'Affiliate Commission')}</Badge>;
      case 'bonus':
        return <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 border-amber-300">{t('adminTransactions.badgeBonus', 'Bonus / Reward')}</Badge>;
      case 'admin_credit':
        return <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 border-emerald-300">{t('adminTransactions.badgeAdminCredit', 'Manual Credit')}</Badge>;
      case 'admin_debit':
        return <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-700 border-rose-300">{t('adminTransactions.badgeAdminDebit', 'Manual Debit')}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-1">
              {t('adminTransactions.badge', 'Audit Ledger')}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('adminTransactions.title', 'Transactions Ledger')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('adminTransactions.subtitle', 'Comprehensive, auditable ledger of all platform financial movements.')}
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative w-full sm:w-auto sm:min-w-[240px]">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-2.5 h-4 w-4 text-slate-400`} />
              <Input
                placeholder={t('adminTransactions.searchPlaceholder', 'Search by name, email, or reference...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isRtl ? 'pr-9' : 'pl-9'} rounded-2xl text-xs bg-slate-50 dark:bg-slate-800/60 w-full`}
              />
            </form>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs font-bold rounded-2xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 w-full sm:w-auto"
            >
              <option value="all">{t('adminTransactions.filterAll', 'All Transaction Types')}</option>
              <option value="commission">{t('adminTransactions.filterCommission', 'Marketing Commissions')}</option>
              <option value="withdrawal">{t('adminTransactions.filterWithdrawal', 'Withdrawals')}</option>
              <option value="deposit">{t('adminTransactions.filterDeposit', 'Deposits')}</option>
              <option value="admin_credit">{t('adminTransactions.filterAdminCredit', 'Manual Credit (Admin)')}</option>
              <option value="admin_debit">{t('adminTransactions.filterAdminDebit', 'Manual Debit (Admin)')}</option>
              <option value="bonus">{t('adminTransactions.filterBonus', 'Bonus / Refunds')}</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4 text-start">{t('adminTransactions.colUser', 'User')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colType', 'Type')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colAmount', 'Amount')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colBalanceMovement', 'Balance Movement')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colReference', 'Reference')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colDescription', 'Description')}</th>
                  <th className="p-4 text-start">{t('adminTransactions.colTimestamp', 'Timestamp')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      {t('adminTransactions.loading', 'Loading transactions...')}
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-slate-400">
                      {t('adminTransactions.noTransactions', 'No transactions found matching your criteria.')}
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isCredit = ['deposit', 'commission', 'bonus', 'admin_credit'].includes(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* User */}
                        <td className="p-4">
                          <p className="font-bold text-slate-900 dark:text-white text-xs">{tx.user_name}</p>
                          <p className="text-[10px] text-slate-400">{tx.user_email}</p>
                        </td>

                        {/* Type */}
                        <td className="p-4">
                          {getTypeBadge(tx.type)}
                        </td>

                        {/* Amount */}
                        <td className="p-4 font-mono font-black text-sm">
                          <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {isCredit ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                          </span>
                        </td>

                        {/* Balance Movement */}
                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          ${Number(tx.balance_before || 0).toFixed(2)} → <strong className="text-slate-800 dark:text-slate-200">${Number(tx.balance_after || 0).toFixed(2)}</strong>
                        </td>

                        {/* Reference */}
                        <td className="p-4 font-mono text-[11px] text-slate-500">
                          {tx.reference_id || 'N/A'}
                        </td>

                        {/* Description */}
                        <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate text-[11px]">
                          {tx.description || '-'}
                        </td>

                        {/* Timestamp */}
                        <td className="p-4 text-slate-400 whitespace-nowrap text-[11px]">
                          {new Date(tx.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
