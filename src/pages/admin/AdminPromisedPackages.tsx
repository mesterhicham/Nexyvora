import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { promisedPackageService, packageService, adminService } from '@/services/apiService';
import {
  Gift,
  Search,
  Package as PackageIcon,
  ShieldAlert,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  User,
  Zap,
  TrendingUp,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface GrantItem {
  id: string;
  user_id: string;
  package_id: string;
  user_package_id: string;
  granted_by: string;
  package_type: 'marketing' | 'investment';
  status: 'active' | 'revoked';
  notes: string | null;
  granted_at: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  user_role: string;
  package_name: string;
  package_name_ar: string;
  package_slug: string;
  package_price: string | number;
  badge_color: string;
  package_level: number;
  granted_by_name?: string;
}

export default function AdminPromisedPackages() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [grants, setGrants] = useState<GrantItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    marketing: 0,
    investment: 0,
    activated: 0,
  });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'marketing' | 'investment'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'revoked'>('all');

  // Available options for granting
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  // Grant Modal state
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [granting, setGranting] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [grantForm, setGrantForm] = useState({
    user_id: '',
    package_id: '',
    package_type: 'marketing',
    notes: '',
  });

  // Action states (revoke / delete)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await promisedPackageService.getPromisedPackages({
        search: searchQuery,
        type: typeFilter,
        status: statusFilter,
      });
      if (res.success) {
        setGrants(res.grants || []);
        setStats(res.stats || { total: 0, marketing: 0, investment: 0, activated: 0 });
      }
    } catch (err: any) {
      console.error('[AdminPromisedPackages] Error fetching data:', err);
      toast.error(t('promisedPackages.loadError', 'فشل في تحميل بيانات الباقات الممنوحة'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGrantModal = async () => {
    setIsGrantOpen(true);
    setLoadingModalData(true);
    try {
      const [packsRes, usersRes] = await Promise.all([
        packageService.getAll().catch(err => {
          console.warn('[packageService.getAll] error:', err);
          return { packages: [] };
        }),
        adminService.getAllUsers().catch(err => {
          console.warn('[adminService.getAllUsers] error:', err);
          return { users: [] };
        }),
      ]);
      const pList = packsRes?.packages || (Array.isArray(packsRes) ? packsRes : []);
      setAvailablePackages(pList);

      const rawUsers = usersRes?.users || (Array.isArray(usersRes) ? usersRes : []);
      const uList = rawUsers.map((u: any) => ({
        id: u.id,
        name: u.full_name || u.username || u.name || u.email,
        email: u.email,
        username: u.username
      }));
      setAvailableUsers(uList);

      // Reset form
      setGrantForm({
        user_id: '',
        package_id: pList[0]?.id || '',
        package_type: 'marketing',
        notes: '',
      });
    } catch (err) {
      console.error('[handleOpenGrantModal] Error:', err);
      toast.error('فشل في جلب قائمة المستخدمين والباقات');
    } finally {
      setLoadingModalData(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearchText.trim()) return availableUsers.slice(0, 50);
    const q = userSearchText.toLowerCase();
    return availableUsers
      .filter((u) => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q))
      )
      .slice(0, 50);
  }, [availableUsers, userSearchText]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantForm.user_id) {
      toast.error(t('promisedPackages.selectUserRequired', 'يرجى اختيار العضو المستفيد أولاً'));
      return;
    }
    if (!grantForm.package_id) {
      toast.error(t('promisedPackages.selectPackageRequired', 'يرجى اختيار الباقة'));
      return;
    }

    try {
      setGranting(true);
      await promisedPackageService.grantPackage(grantForm);
      toast.success(t('promisedPackages.grantSuccess', 'تم منح الباقة بنجاح بدون توزيع أي عمولات'));
      setIsGrantOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('[handleGrantSubmit] Error:', err);
      toast.error(err.response?.data?.error || t('promisedPackages.grantFailed', 'فشل في منح الباقة'));
    } finally {
      setGranting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm(t('promisedPackages.confirmRevoke', 'هل أنت متأكد من سحب هذه الباقة الممنوحة؟'))) return;
    try {
      setActionLoadingId(id);
      await promisedPackageService.revokePackage(id);
      toast.success(t('promisedPackages.revokeSuccess', 'تم سحب الباقة بنجاح'));
      fetchData();
    } catch (err: any) {
      console.error('[handleRevoke] Error:', err);
      toast.error(err.response?.data?.error || t('promisedPackages.revokeFailed', 'فشل في سحب الباقة'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('promisedPackages.confirmDelete', 'هل أنت متأكد من حذف هذا السجل بالكامل؟'))) return;
    try {
      setActionLoadingId(id);
      await promisedPackageService.deletePromisedPackage(id);
      toast.success(t('promisedPackages.deleteSuccess', 'تم حذف السجل بنجاح'));
      fetchData();
    } catch (err: any) {
      console.error('[handleDelete] Error:', err);
      toast.error(err.response?.data?.error || t('promisedPackages.deleteFailed', 'فشل في حذف السجل'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const displayedGrants = useMemo(() => {
    if (!searchQuery.trim()) return grants;
    const q = searchQuery.toLowerCase();
    return grants.filter(
      (g) =>
        g.user_name?.toLowerCase().includes(q) ||
        g.user_email?.toLowerCase().includes(q) ||
        g.package_name?.toLowerCase().includes(q) ||
        g.package_name_ar?.includes(q)
    );
  }, [grants, searchQuery]);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Gift className="h-7 w-7 text-primary" />
              {t('promisedPackages.title', 'Promised Packages')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {t(
                'promisedPackages.subtitle',
                'إدارة ومنح باقات الدعم للقادة مع ميزات كاملة وبدون احتساب عمولات أو إدراجها ضمن المبيعات'
              )}
            </p>
          </div>

          <Button
            onClick={handleOpenGrantModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4" />
            {t('promisedPackages.grantPackageBtn', 'Grant Package')}
          </Button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#121622]/80 border-gray-800 shadow-md backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">{t('promisedPackages.totalGrants', 'Total Grants')}</p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.total}</h3>
              </div>
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <Gift className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121622]/80 border-gray-800 shadow-md backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {t('promisedPackages.marketingGrants', 'Marketing (No Daily Profits)')}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.marketing}</h3>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Zap className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121622]/80 border-gray-800 shadow-md backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {t('promisedPackages.investmentGrants', 'Investment (With Daily Profits)')}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.investment}</h3>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <TrendingUp className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#121622]/80 border-gray-800 shadow-md backdrop-blur">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  {t('promisedPackages.activatedGrants', 'Activated')}
                </p>
                <h3 className="text-2xl font-bold text-white mt-1">{stats.activated}</h3>
              </div>
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar and Table Container */}
        <Card className="bg-[#121622]/80 border-gray-800 shadow-xl backdrop-blur">
          <div className="p-4 border-b border-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('promisedPackages.searchPlaceholder', 'بحث باسم العضو، البريد، أو الباقة...')}
                className="bg-[#181d2d] border-gray-700 text-white pr-9 pl-4 placeholder:text-gray-500 focus-visible:ring-primary"
              />
            </div>

            {/* Filter buttons/dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex rounded-lg bg-[#181d2d] p-1 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    typeFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('common.all', 'الكل')}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('marketing')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    typeFilter === 'marketing'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('promisedPackages.marketing', 'تسويقية')}
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter('investment')}
                  className={`px-3 py-1 text-xs rounded-md font-medium transition ${
                    typeFilter === 'investment'
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t('promisedPackages.investment', 'استثمارية')}
                </button>
              </div>

              <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                <SelectTrigger className="w-[130px] bg-[#181d2d] border-gray-700 text-white text-xs h-9">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent className="bg-[#181d2d] border-gray-700 text-white">
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشطة (Active)</SelectItem>
                  <SelectItem value="revoked">مسحوبة (Revoked)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#0e121c]/60">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">{t('common.user', 'User')}</TableHead>
                  <TableHead className="text-gray-400 font-semibold">{t('common.package', 'Package')}</TableHead>
                  <TableHead className="text-gray-400 font-semibold">{t('common.type', 'Type')}</TableHead>
                  <TableHead className="text-gray-400 font-semibold">{t('common.status', 'Status')}</TableHead>
                  <TableHead className="text-gray-400 font-semibold">{t('promisedPackages.grantDate', 'Grant Date')}</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-center">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span>جاري تحميل الباقات الممنوحة...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : displayedGrants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Gift className="h-8 w-8 text-gray-600 mb-1" />
                        <span className="text-base font-medium">لا توجد باقات ممنوحة حتى الآن</span>
                        <p className="text-xs text-gray-500">
                          يمكنك منح باقة دعم جديدة لأحد القادة من زر "Grant Package" أعلاه
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedGrants.map((item) => (
                    <TableRow key={item.id} className="border-gray-800 hover:bg-[#181d2d]/40 transition">
                      {/* User Cell */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/30 to-purple-500/20 border border-primary/30 flex items-center justify-center text-primary font-bold">
                            {item.user_name ? item.user_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">{item.user_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.user_email}</p>
                            {item.notes && (
                              <p className="text-[11px] text-amber-400/90 mt-1 italic max-w-xs truncate" title={item.notes}>
                                ملاحظة: {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Package Cell */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PackageIcon className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-sm font-bold text-white">
                              {isRtl ? (item.package_name_ar || item.package_name) : item.package_name}
                            </span>
                            <span className="text-xs text-emerald-400 block font-mono">
                              ${Number(item.package_price).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Type Badge */}
                      <TableCell>
                        {item.package_type === 'investment' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium text-xs">
                            {t('promisedPackages.typeInvestment', 'Investment')}
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium text-xs">
                            {t('promisedPackages.typeMarketing', 'Marketing')}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                        {item.status === 'active' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {t('common.active', 'Activated')}
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit text-xs font-semibold">
                            <XCircle className="h-3 w-3" />
                            {t('common.revoked', 'Revoked')}
                          </Badge>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-500" />
                          {new Date(item.granted_at || item.created_at).toLocaleDateString(
                            isRtl ? 'ar-EG' : 'en-US',
                            { year: 'numeric', month: 'short', day: 'numeric' }
                          )}
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleRevoke(item.id)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30 h-8 px-2.5 text-xs font-medium"
                            >
                              {actionLoadingId === item.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                                  {t('promisedPackages.revoke', 'Revoke')}
                                </>
                              )}
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === item.id}
                            onClick={() => handleDelete(item.id)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 h-8 px-2 text-xs"
                            title="حذف السجل"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Modal: Grant Package to User */}
        <Dialog open={isGrantOpen} onOpenChange={setIsGrantOpen}>
          <DialogContent className="bg-[#121622] border-gray-800 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <Gift className="h-6 w-6 text-primary" />
                {t('promisedPackages.modalTitle', 'Grant Package to User')}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                {t(
                  'promisedPackages.modalDesc',
                  'منح باقة دعم للقائد تتيح له فتح الرتب والعمولات والدورات بالكامل، دون احتساب عمولات للأب لاين ودون إضافتها لحجم المبيعات.'
                )}
              </DialogDescription>
            </DialogHeader>

            {loadingModalData ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-sm text-gray-400">جاري تحميل البيانات...</span>
              </div>
            ) : (
              <form onSubmit={handleGrantSubmit} className="space-y-4 py-2">
                {/* User Selector with mini search */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-300">
                    {t('promisedPackages.selectUser', 'Select User (Leader)')} *
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="ابحث بالاسم أو البريد..."
                      value={userSearchText}
                      onChange={(e) => setUserSearchText(e.target.value)}
                      className="bg-[#181d2d] border-gray-700 text-xs h-8 text-white placeholder:text-gray-500"
                    />
                    <Select
                      value={grantForm.user_id}
                      onValueChange={(val) => setGrantForm({ ...grantForm, user_id: val })}
                    >
                      <SelectTrigger className="bg-[#181d2d] border-gray-700 text-white text-xs h-10">
                        <SelectValue placeholder="اختر العضو من القائمة" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181d2d] border-gray-700 text-white max-h-56">
                        {filteredUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-white">{u.name}</span>
                              <span className="text-gray-400 font-mono">({u.email})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Package Selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-300">
                    {t('promisedPackages.selectPackage', 'Package')} *
                  </Label>
                  <Select
                    value={grantForm.package_id}
                    onValueChange={(val) => setGrantForm({ ...grantForm, package_id: val })}
                  >
                    <SelectTrigger className="bg-[#181d2d] border-gray-700 text-white text-xs h-10">
                      <SelectValue placeholder="اختر الباقة المراد منحها" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181d2d] border-gray-700 text-white">
                      {availablePackages.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between w-full gap-4 text-xs">
                            <span className="font-semibold text-white">
                              {isRtl ? (p.name_ar || p.name) : p.name}
                            </span>
                            <span className="text-emerald-400 font-mono font-bold">${p.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Package Type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-300">
                    {t('promisedPackages.packageType', 'Package Type')}
                  </Label>
                  <Select
                    value={grantForm.package_type}
                    onValueChange={(val) => setGrantForm({ ...grantForm, package_type: val })}
                  >
                    <SelectTrigger className="bg-[#181d2d] border-gray-700 text-white text-xs h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#181d2d] border-gray-700 text-white">
                      <SelectItem value="marketing">
                        {t('promisedPackages.marketingDesc', 'Marketing (No Daily Profits)')}
                      </SelectItem>
                      <SelectItem value="investment">
                        {t('promisedPackages.investmentDesc', 'Investment (With Daily Profits)')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-300">
                    {t('promisedPackages.notesOptional', 'Notes (Optional)')}
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="مثال: منحة دعم قيادي لحملة تسويقية خاصة..."
                    value={grantForm.notes}
                    onChange={(e) => setGrantForm({ ...grantForm, notes: e.target.value })}
                    className="bg-[#181d2d] border-gray-700 text-xs text-white placeholder:text-gray-500 focus-visible:ring-primary"
                  />
                </div>

                {/* Warning Alert Note */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    <strong>تنبيه مالي:</strong> هذه الباقة ستسجل بقيمة 0.00$ ولن يتم إطلاق أي عمولات شجرية للمستويات العليا ولن تُضاف للمبيعات الإجمالية للشركة.
                  </span>
                </div>

                <DialogFooter className="pt-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsGrantOpen(false)}
                    className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    {t('common.cancel', 'إلغاء')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={granting}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2"
                  >
                    {granting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('promisedPackages.confirmGrant', 'Grant Package')}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
