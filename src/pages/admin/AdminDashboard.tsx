import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useAdminStats } from '@/hooks/useDashboardData';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Layers, 
  Award, 
  Video, 
  FileText, 
  Bell, 
  Sparkles,
  DollarSign,
  ArrowDownToLine,
  ArrowUpRight,
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ChevronLeft,
  Package,
  ArrowLeftRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const stats = useAdminStats();

  return (
    <DashboardLayout role="admin">
      <div className="space-y-4 sm:space-y-5 pb-8 font-sans">
        {/* 4 Primary Core Financial & System KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Sales */}
          <StatCard 
            title={t('admin.totalSales')} 
            value={stats.isLoading ? '...' : `$${Number(stats.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={DollarSign} 
            variant="emerald"
            trend={{ 
              value: Number(stats.totalSalesCount) || 0, 
              isPositive: true 
            }}
          />

          {/* Card 2: Total Withdrawals */}
          <StatCard 
            title={t('admin.totalWithdrawals')} 
            value={stats.isLoading ? '...' : `$${Number(stats.totalWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={ArrowDownToLine} 
            variant="rose"
            trend={{
              value: Number(stats.pendingWithdrawalsCount) || 0,
              isPositive: stats.pendingWithdrawalsCount === 0
            }}
          />

          {/* Card 3: Total Students & Members */}
          <StatCard 
            title={t('admin.totalStudents')} 
            value={stats.isLoading ? '...' : (stats.totalStudents || stats.totalMembers || 0)} 
            icon={Users} 
            variant="purple"
            trend={{ 
              value: Number(stats.activeStudents) || 0, 
              isPositive: true 
            }}
          />

          {/* Card 4: Total Wallets Balance */}
          <StatCard 
            title={t('admin.walletBalances')} 
            value={stats.isLoading ? '...' : `$${Number(stats.totalMemberBalances || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={Wallet} 
            variant="sky" 
          />
        </div>

        {/* Secondary Financial & Academy Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <Link to="/admin/deposits" className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between hover:border-teal-200 transition-all group">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('admin.totalDeposits', 'Total Deposits')}
              </span>
              <span className="text-sm sm:text-base font-black text-teal-600 font-mono block truncate mt-0.5">
                ${Number(stats.totalDeposits || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <CreditCard className="h-4 w-4" />
            </div>
          </Link>

          <div className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('admin.netPlatformRevenue')}
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-600 font-mono block truncate mt-0.5">
                ${Number(stats.netPlatformProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <Link to="/admin/packages" className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between hover:border-indigo-200 transition-all group">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('adminExtra.packageSales')}
              </span>
              <span className="text-sm sm:text-base font-black text-indigo-600 font-mono block truncate mt-0.5">
                ${Number(stats.packageSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Package className="h-4 w-4" />
            </div>
          </Link>

          <Link to="/admin/wallets" className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between hover:border-amber-200 transition-all group">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('admin.commissionsPaid')}
              </span>
              <span className="text-sm sm:text-base font-black text-amber-500 font-mono block truncate mt-0.5">
                ${Number(stats.totalCommissionsPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
          </Link>

          <Link to="/admin/withdrawals" className="p-3 sm:p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between hover:border-rose-200 transition-all group">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                {t('admin.pendingWithdrawals')}
              </span>
              <span className="text-sm sm:text-base font-black text-rose-500 font-mono block truncate mt-0.5">
                ${Number(stats.pendingWithdrawals || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Clock className="h-4 w-4" />
            </div>
          </Link>
        </div>

        {/* Analytics Section: Chart + Financial Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Chart (2 Cols) */}
          <Card className="lg:col-span-2 rounded-2xl sm:rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" />
                  <span>{isRtl ? 'نمو تسجيلات الطلاب والأعضاء' : 'Student & Member Growth'}</span>
                </CardTitle>
                <CardDescription className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  {isRtl ? 'حركة التسجيل الشهرية للطلاب خلال الأشهر الأخيرة' : 'Monthly registration activity over recent period'}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[11px] font-bold rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-purple-600 px-2 py-0.5">
                {stats.isLoading ? '...' : `${stats.totalStudents || stats.totalMembers} ${isRtl ? 'عضو مسجل' : 'Registered'}`}
              </Badge>
            </CardHeader>
            <CardContent className="pt-4 pb-3 px-3 sm:px-5">
              <div className="h-52 sm:h-56 w-full">
                {stats.isLoading ? (
                  <Skeleton className="h-full w-full rounded-2xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyEnrollments} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '0.75rem',
                          boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        name={isRtl ? 'الأعضاء الجدد' : 'New Members'} 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        fillOpacity={1} 
                        fill="url(#colorStudents)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Summary Card (1 Col) */}
          <Card className="rounded-2xl sm:rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="py-3 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <ArrowLeftRight className="h-4.5 w-4.5 text-emerald-500" />
                <span>{t('admin.cashFlowSummary')}</span>
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 mt-0.5">
                {isRtl ? 'المبيعات مقارنة بالسحوبات والأرصدة' : 'Sales vs Withdrawals & Balances'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-3 pb-3 px-4 sm:px-5 space-y-2 flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{t('adminExtra.packageSales')}:</span>
                <strong className="font-mono text-slate-900 dark:text-white text-xs sm:text-sm">
                  ${Number(stats.packageSales || 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{isRtl ? 'مبيعات الدورات:' : 'Course Sales:'}</span>
                <strong className="font-mono text-slate-900 dark:text-white text-xs sm:text-sm">
                  ${Number(stats.courseSales || 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{isRtl ? 'إجمالي إيداعات المحافظ:' : 'Total Wallet Deposits:'}</span>
                <strong className="font-mono text-teal-600 dark:text-teal-400 text-xs sm:text-sm">
                  ${Number(stats.totalDeposits || 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{t('admin.totalWithdrawals')}:</span>
                <strong className="font-mono text-rose-500 text-xs sm:text-sm">
                  ${Number(stats.totalWithdrawals || 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{t('admin.pendingWithdrawals')}:</span>
                <strong className="font-mono text-amber-500 text-xs sm:text-sm">
                  ${Number(stats.pendingWithdrawals || 0).toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                <span className="text-slate-500 font-bold">{t('admin.walletBalances')}:</span>
                <strong className="font-mono text-sky-600 dark:text-sky-400 text-xs sm:text-sm">
                  ${Number(stats.totalMemberBalances || 0).toFixed(2)}
                </strong>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">{t('admin.netPlatformRevenue')}:</span>
                <strong className="font-mono text-emerald-600 font-black text-sm sm:text-base">
                  ${Number(stats.netPlatformProfit || 0).toFixed(2)}
                </strong>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Platform Modules Navigation Hub */}
        <Card className="rounded-2xl sm:rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs overflow-hidden bg-white dark:bg-slate-900">
          <CardHeader className="py-3 px-4 sm:px-5 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Layers className="h-4.5 w-4.5 text-primary" />
              <span>{t('admin.quickManagementHub')}</span>
            </CardTitle>
            <CardDescription className="text-[11px] text-slate-400 mt-0.5">
              {isRtl ? 'الوصول السريع والمباشر إلى جميع وحدات التحكم والعمليات' : 'Direct shortcuts to all platform core modules and controls'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 pb-4 px-4 sm:px-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {/* Students / Users */}
              <Link to="/admin/users" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.usersManagement')}</span>
              </Link>

              {/* Manage Academy */}
              <Link to="/admin/academy" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 mb-2 group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.academy')}</span>
              </Link>

              {/* Packages */}
              <Link to="/admin/packages" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 mb-2 group-hover:scale-110 transition-transform">
                  <Package className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.packages')}</span>
              </Link>

              {/* Withdrawals */}
              <Link to="/admin/withdrawals" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 mb-2.5 group-hover:scale-110 transition-transform">
                  <ArrowDownToLine className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.withdrawals')}</span>
              </Link>

              {/* Deposits */}
              <Link to="/admin/deposits" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 mb-2 group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.deposits')}</span>
              </Link>

              {/* Wallets */}
              <Link to="/admin/wallets" className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition-all flex flex-col items-center text-center group">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 mb-2 group-hover:scale-110 transition-transform">
                  <Wallet className="h-4.5 w-4.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">{t('nav.walletManagement')}</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Embedded AI Assistant for Admin */}
        <AIAssistant role="admin" />
      </div>
    </DashboardLayout>
  );
}
