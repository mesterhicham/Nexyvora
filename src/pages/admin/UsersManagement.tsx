import { useState, useEffect, useMemo } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminService, packageService, adminAffiliateService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  MoreVertical,
  Info,
  Sliders,
  Wallet,
  LogIn,
  Mail,
  User,
  Lock,
  Loader2,
  X,
  UserCheck,
  GraduationCap,
  Shield,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

interface EnrichedUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: string;
  account_role: 'ADMIN' | 'BUSINESS PARTNER' | 'STUDENT';
  status: string;
  phone: string;
  city: string;
  country: string;
  affiliate_code: string;
  wallet_pin?: string;
  created_at: string;
  avatar_url?: string | null;
  display_id: string;
  sponsor?: {
    id: string;
    name: string;
    username: string;
  } | null;
  package?: {
    id: string | null;
    name: string;
    level: number;
  };
  wallet?: {
    balance: number;
    profit: number;
    pending: number;
  };
}

export default function UsersManagement() {
  const navigate = useNavigate();
  const { session, impersonateUser } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [stats, setStats] = useState({
    all: 0,
    business_partners: 0,
    students: 0,
    admins: 0,
  });
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'business_partners' | 'students' | 'admins'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [detailsUser, setDetailsUser] = useState<EnrichedUser | null>(null);
  const [editUser, setEditUser] = useState<EnrichedUser | null>(null);
  const [adjustUser, setAdjustUser] = useState<EnrichedUser | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '',
    username: '',
    password: '',
    wallet_pin: '',
    package_id: 'none',
    status: 'active',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Adjust balance form state
  const [adjustForm, setAdjustForm] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: '',
    note: '',
  });
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, pkgsRes] = await Promise.all([
        adminService.getAllUsers(),
        packageService.getAll().catch(() => ({ packages: [] })),
      ]);

      const rawUsers: EnrichedUser[] = usersRes.users || (Array.isArray(usersRes) ? usersRes : []);
      // Filter out teachers to ensure only students and marketers/partners appear
      const loadedUsers = rawUsers.filter(u => u.role !== 'teacher' && (u as any).account_role !== 'TEACHER');
      setUsers(loadedUsers);

      if (usersRes.stats) {
        setStats(usersRes.stats);
      } else {
        setStats({
          all: loadedUsers.length,
          business_partners: loadedUsers.filter(u => u.account_role === 'BUSINESS PARTNER').length,
          students: loadedUsers.filter(u => u.account_role === 'STUDENT').length,
          admins: loadedUsers.filter(u => u.account_role === 'ADMIN').length,
        });
      }

      setPackagesList(pkgsRes.packages || (Array.isArray(pkgsRes) ? pkgsRes : []));
    } catch (err) {
      console.error('[UsersManagement fetchData]', err);
      toast.error(tr("فشل تحميل قائمة المستخدمين", "Failed to load users list"));
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (u: EnrichedUser) => {
    setEditUser(u);
    setEditForm({
      email: u.email || '',
      username: u.username || '',
      password: '',
      wallet_pin: u.wallet_pin || '',
      package_id: u.package?.id || 'none',
      status: u.status || 'active',
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editUser) return;
    try {
      setSavingEdit(true);
      await adminService.updateUser(editUser.id, {
        email: editForm.email,
        username: editForm.username,
        password: editForm.password || undefined,
        wallet_pin: editForm.wallet_pin || undefined,
        package_id: editForm.package_id,
        status: editForm.status,
      });

      toast.success(tr("تم تحديث بيانات المستخدم بنجاح", "User updated successfully"));
      setEditUser(null);
      fetchData();
    } catch (err: any) {
      console.error('[handleSaveEdit]', err);
      toast.error(err?.response?.data?.error || (tr("فشل حفظ التعديلات", "Failed to save changes")));
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Adjust Balance Modal
  const handleOpenAdjust = (u: EnrichedUser) => {
    setAdjustUser(u);
    setAdjustForm({
      type: 'credit',
      amount: '',
      note: '',
    });
  };

  // Save Adjust Balance
  const handleSaveAdjust = async () => {
    if (!adjustUser) return;
    const numAmount = parseFloat(adjustForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(tr("يرجى إدخال مبلغ صحيح أكبر من 0", "Please enter a valid amount greater than 0"));
      return;
    }

    try {
      setAdjusting(true);
      await adminAffiliateService.adjustWalletBalance({
        userId: adjustUser.id,
        type: adjustForm.type,
        amount: numAmount,
        note: adjustForm.note || (adjustForm.type === 'credit' 
          ? (tr("تعديل رصيد يدوي (إيداع)", "Manual balance adjustment (Credit)")) 
          : (tr("تعديل رصيد يدوي (خصم)", "Manual balance adjustment (Debit)"))),
      });

      toast.success(
        tr("تم ${adjustForm.type === 'credit' ? 'إضافة' : 'خصم'} $${numAmount} بنجاح", "$${numAmount} ${adjustForm.type === 'credit' ? 'credited' : 'debited'} successfully")
      );
      setAdjustUser(null);
      fetchData();
    } catch (err: any) {
      console.error('[handleSaveAdjust]', err);
      toast.error(err?.response?.data?.error || (tr("فشل تعديل الرصيد", "Failed to adjust balance")));
    } finally {
      setAdjusting(false);
    }
  };

  // Impersonate / Login as user
  const handleImpersonate = async (u: EnrichedUser) => {
    try {
      const res = await adminService.impersonateUser(u.id);
      if (res.token && res.user) {
        impersonateUser(res.token, res.user);
        toast.success(
          tr("تم تسجيل الدخول بنجاح بحساب ${u.full_name || u.username || res.user.email}", "Logged in successfully as ${u.full_name || u.username || res.user.email}")
        );
        
        // Navigate to appropriate role dashboard
        const targetRoute = res.user.role === 'teacher' ? '/teacher' : res.user.role === 'admin' ? '/admin' : '/student';
        navigate(targetRoute);
      }
    } catch (err: any) {
      console.error('[handleImpersonate]', err);
      toast.error(tr("فشل تسجيل الدخول كعضو", "Failed to login as user"));
    }
  };

  // Filter & Search users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Safety guard: never show teachers on users page
      if (u.role === 'teacher' || (u as any).account_role === 'TEACHER') return false;

      // Tab filter
      if (activeTab === 'business_partners' && u.account_role !== 'BUSINESS PARTNER') return false;
      if (activeTab === 'students' && u.account_role !== 'STUDENT') return false;
      if (activeTab === 'admins' && u.account_role !== 'ADMIN') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.full_name?.toLowerCase().includes(q);
        const matchesUser = u.username?.toLowerCase().includes(q);
        const matchesEmail = u.email?.toLowerCase().includes(q);
        const matchesPhone = u.phone?.toLowerCase().includes(q);
        const matchesSponsor = u.sponsor?.name?.toLowerCase().includes(q) || u.sponsor?.username?.toLowerCase().includes(q);
        const matchesCode = u.affiliate_code?.toLowerCase().includes(q);
        return matchesName || matchesUser || matchesEmail || matchesPhone || matchesSponsor || matchesCode;
      }

      return true;
    });
  }, [users, activeTab, searchQuery]);

  // Format Date (e.g. 20 Sep 2026)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-16 font-sans">
        {/* Top Header & Search Bar (Exact layout from Image 2) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Students & Users
              </h1>
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-[#8b5cf6]/15 text-[#8b5cf6]">
                {stats.all} Students & Members
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr("إدارة شؤون الطلاب وأعضاء المنصة، الرتب، الباقات، والحسابات المالية", "Manage student & platform member records, ranks, packages, and wallet accounts")}
            </p>
          </div>

          {/* Search Box on Top Right */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, sponsor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 rounded-full border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs shadow-xs focus-visible:ring-[#8b5cf6]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs (Exact design from Image 2) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {/* All Members */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>All Members</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.all}
            </span>
          </button>

          {/* Business Partners */}
          <button
            onClick={() => setActiveTab('business_partners')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'business_partners'
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Business Partners</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'business_partners'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.business_partners}
            </span>
          </button>

          {/* Students */}
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'students'
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Students</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'students'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.students}
            </span>
          </button>

          {/* Admins */}
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === 'admins'
                ? 'bg-[#8b5cf6] text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Admins</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'admins'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {stats.admins}
            </span>
          </button>
        </div>

        {/* Main Users Table Card */}
        <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4 pl-6">Username</th>
                  <th className="py-4 px-4">Name</th>
                  <th className="py-4 px-4">Sponsor</th>
                  <th className="py-4 px-4">Phone / WhatsApp</th>
                  <th className="py-4 px-4">Referral Code</th>
                  <th className="py-4 px-4">Package</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4">Profit</th>
                  <th className="py-4 px-4">Registration Date</th>
                  <th className="py-4 px-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-slate-400">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#8b5cf6]" />
                      Loading users data...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-20 text-center text-slate-400">
                      No members found matching your search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Username */}
                      <td className="py-4 px-4 pl-6 font-bold text-slate-900 dark:text-white">
                        {u.username}
                      </td>

                      {/* Name & ID */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {u.display_id}
                        </div>
                      </td>

                      {/* Sponsor */}
                      <td className="py-4 px-4">
                        {u.sponsor ? (
                          <div>
                            <div className="font-bold text-[#8b5cf6]">
                              {u.sponsor.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              @{u.sponsor.username}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Phone / WhatsApp */}
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {u.phone || '-'}
                      </td>

                      {/* Referral Code */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                          {u.affiliate_code || '-'}
                        </span>
                      </td>

                      {/* Package */}
                      <td className="py-4 px-4 font-bold text-slate-700 dark:text-slate-200">
                        {u.package?.id ? (
                          <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 border border-indigo-200 font-bold text-[11px]">
                            {u.package.name}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            No Package
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black inline-block text-center ${
                            u.status === 'active'
                              ? 'bg-[#2563eb] text-white'
                              : u.status === 'inactive'
                              ? 'bg-amber-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {u.status === 'active' ? 'Active' : u.status}
                        </span>
                      </td>

                      {/* Profit */}
                      <td className="py-4 px-4 font-black font-mono text-emerald-500 text-sm">
                        ${(u.wallet?.profit || 0).toFixed(2)}
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-44 rounded-2xl p-1.5 shadow-lg border border-slate-100 dark:border-slate-800"
                          >
                            <DropdownMenuItem
                              onClick={() => setDetailsUser(u)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              <Info className="h-4 w-4 text-slate-500" />
                              <span>User Details</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenEdit(u)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              <Sliders className="h-4 w-4 text-slate-500" />
                              <span>Edit User</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleOpenAdjust(u)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                            >
                              <Wallet className="h-4 w-4 text-slate-500" />
                              <span>Adjust Balance</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleImpersonate(u)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 cursor-pointer"
                            >
                              <LogIn className="h-4 w-4" />
                              <span>Login as User</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal 1: User Details Modal (Image 3) */}
        <Dialog open={Boolean(detailsUser)} onOpenChange={(open) => !open && setDetailsUser(null)}>
          <DialogContent className="w-[95vw] sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                User Details
              </DialogTitle>
            </DialogHeader>

            {detailsUser && (
              <div className="space-y-6 pt-2">
                {/* 2-Column Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-y-5 gap-x-6 text-xs">
                  {/* Name */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Name</span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm">
                      {detailsUser.full_name}
                    </strong>
                  </div>

                  {/* Username */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Username</span>
                    <strong className="text-slate-900 dark:text-white font-bold text-sm">
                      {detailsUser.username}
                    </strong>
                  </div>

                  {/* Email */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Email</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {detailsUser.email}
                    </span>
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Phone / WhatsApp</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {detailsUser.phone || '-'}
                    </span>
                  </div>

                  {/* Country */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Country</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {detailsUser.country || '-'}
                    </span>
                  </div>

                  {/* City */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">City</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {detailsUser.city || '-'}
                    </span>
                  </div>

                  {/* Referral Code */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Referral Code</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono font-bold">
                      {detailsUser.affiliate_code || '-'}
                    </span>
                  </div>

                  {/* Account Role */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Account Role</span>
                    <span
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wider inline-block ${
                        detailsUser.account_role === 'ADMIN'
                          ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                          : detailsUser.account_role === 'BUSINESS PARTNER'
                          ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {detailsUser.account_role}
                    </span>
                  </div>

                  {/* Sponsor */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Sponsor</span>
                    {detailsUser.sponsor ? (
                      <div>
                        <div className="font-bold text-[#8b5cf6]">
                          {detailsUser.sponsor.name}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          @{detailsUser.sponsor.username}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>

                  {/* Registration Date */}
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Registration Date</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {formatDate(detailsUser.created_at)}
                    </span>
                  </div>
                </div>

                {/* 3 Bottom Stat Cards (MAIN, BONUS, COLLECTION %) */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                      MAIN
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      ${(detailsUser.wallet?.balance || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                      BONUS
                    </span>
                    <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                      ${(detailsUser.wallet?.profit || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-center">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block mb-1">
                      COLLECTION %
                    </span>
                    <span className="text-lg font-black text-emerald-500 font-mono">
                      0%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal 2: Edit User Modal (Image 4) */}
        <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Edit User
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-bold">
                {editUser?.full_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Email */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs py-2"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Username
                </Label>
                <Input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs py-2"
                />
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  New Password
                </Label>
                <Input
                  type="password"
                  placeholder="Leave empty to keep current password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs py-2"
                />
              </div>

              {/* New Wallet PIN */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  New Wallet PIN
                </Label>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="Leave empty to keep current PIN (4-6 digits)"
                  value={editForm.wallet_pin}
                  onChange={(e) => setEditForm({ ...editForm, wallet_pin: e.target.value })}
                  className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs py-2 font-mono"
                />
              </div>

              {/* Package Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Package
                </Label>
                <Select
                  value={editForm.package_id}
                  onValueChange={(val) => setEditForm({ ...editForm, package_id: val })}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs">
                    <SelectValue placeholder="Select Package" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="none" className="text-xs">No Package</SelectItem>
                    {packagesList.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id} className="text-xs">
                        {pkg.name_ar} (${Number(pkg.price).toFixed(0)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">
                  {tr("* اختيار باقة يرقي الطالب تلقائياً إلى شريك أعمال (Business Partner)، و No Package يُبقيه طالباً (Student).", "* Selecting a package automatically promotes student to Business Partner; No Package keeps user as a Student.")}
                </p>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("الحالة", "Status")}
                </Label>
                <Select
                  value={editForm.status}
                  onValueChange={(val) => setEditForm({ ...editForm, status: val })}
                >
                  <SelectTrigger className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="active" className="text-xs">{tr("نشط", "Active")}</SelectItem>
                    <SelectItem value="inactive" className="text-xs">{tr("غير نشط", "Inactive")}</SelectItem>
                    <SelectItem value="suspended" className="text-xs">{tr("معلق", "Suspended")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setEditUser(null)}
                className="rounded-2xl text-xs font-bold text-slate-500"
              >
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="rounded-2xl font-black bg-[#2563eb] hover:bg-blue-700 text-white text-xs px-6"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : (tr("حفظ", "Save"))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal 3: Adjust Balance Modal */}
        <Dialog open={Boolean(adjustUser)} onOpenChange={(open) => !open && setAdjustUser(null)}>
          <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="h-5 w-5 text-[#8b5cf6]" />
                {tr("تعديل رصيد المستخدم", "Adjust User Balance")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 font-bold">
                {adjustUser?.full_name} ({adjustUser?.email})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold">{tr("الرصيد الحالي:", "Current Balance:")}</span>
                <span className="font-mono text-base font-black text-emerald-500">
                  ${(adjustUser?.wallet?.balance || 0).toFixed(2)}
                </span>
              </div>

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, type: 'credit' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold border transition-all ${
                    adjustForm.type === 'credit'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  {tr("إيداع (Credit)", "Credit (Deposit)")}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustForm({ ...adjustForm, type: 'debit' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-xs font-bold border transition-all ${
                    adjustForm.type === 'debit'
                      ? 'border-rose-500 bg-rose-50/50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MinusCircle className="h-4 w-4" />
                  {tr("خصم (Debit)", "Debit (Deduct)")}
                </button>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("المبلغ ($)", "Amount ($)")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={adjustForm.amount}
                  onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  className="rounded-2xl font-mono text-sm py-2"
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">{tr("السبب / الملاحظة", "Reason / Note")}</Label>
                <Input
                  type="text"
                  placeholder={tr("مثال: بونص إيداع يدوي / تسوية رصيد", "e.g. Manual deposit bonus / Adjustment")}
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  className="rounded-2xl text-xs py-2"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t">
              <Button
                variant="ghost"
                onClick={() => setAdjustUser(null)}
                className="rounded-2xl text-xs font-bold text-slate-500"
              >
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                onClick={handleSaveAdjust}
                disabled={adjusting}
                className={`rounded-2xl font-black text-white text-xs px-6 ${
                  adjustForm.type === 'credit'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : (tr("تأكيد العملية", "Confirm Adjustment"))}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}