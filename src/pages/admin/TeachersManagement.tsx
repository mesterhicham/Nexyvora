import { useState, useMemo } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useTeachers } from '@/hooks/useDashboardData';
import { useCreateTeacher, useDeleteTeacher } from '@/hooks/useEntityMutations';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/services/apiService';
import { toast } from 'sonner';
import { 
  Search, 
  Edit, 
  Trash2, 
  UserPlus, 
  Mail, 
  Globe, 
  MapPin, 
  MessageCircle, 
  Loader2, 
  BookOpen, 
  Briefcase, 
  User, 
  LogIn,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  Table as TableIcon,
  Phone
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { COUNTRIES } from '@/data/countries';
import { TeacherDetailModal } from '@/components/admin/TeacherDetailModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function TeachersManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const { impersonateUser } = useAuth();
  
  const { data: teachers, isLoading, refetch } = useTeachers();
  const createTeacher = useCreateTeacher();
  const deleteTeacher = useDeleteTeacher();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  // Add Teacher Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    city: '',
    whatsappNumber: '',
    specialty: '',
    experience: '',
    status: 'active',
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  // Impersonate / Login as Teacher
  const handleImpersonate = async (teacher: any) => {
    const targetUserId = teacher.user_id || teacher.id;
    if (!targetUserId) {
      toast.error(tr("تعذر تحديد معرّف حساب الأستاذ", "Could not identify teacher user account"));
      return;
    }

    setImpersonatingId(teacher.id);
    try {
      const res = await adminService.impersonateUser(targetUserId);
      if (res.token && res.user) {
        impersonateUser(res.token, res.user);
        toast.success(
          tr("تم تسجيل الدخول بنجاح بحساب الأستاذ ${teacher.full_name || teacher.profile?.full_name || teacher.email || res.user.email}", "Logged in successfully as Teacher ${teacher.full_name || teacher.profile?.full_name || teacher.email || res.user.email}")
        );
        navigate('/teacher');
      }
    } catch (err: any) {
      console.error('[handleImpersonate]', err);
      toast.error(
        err.response?.data?.error || 
        err.message || 
        (tr("فشل تسجيل الدخول بحساب الأستاذ", "Failed to login as teacher"))
      );
    } finally {
      setImpersonatingId(null);
    }
  };

  const validateAddForm = () => {
    const errs: Record<string, string> = {};
    if (!addFormData.fullName.trim()) errs.fullName = (t('auth.fullName') || 'Full name') + ' is required';
    if (!addFormData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      errs.email = 'Invalid email address';
    }
    if (!addFormData.password) {
      errs.password = 'Password is required';
    } else if (addFormData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (!addFormData.country) errs.country = 'Country is required';
    if (!addFormData.city.trim()) errs.city = 'City is required';
    if (!addFormData.whatsappNumber.trim()) errs.whatsappNumber = 'WhatsApp number is required';
    if (!addFormData.specialty.trim()) errs.specialty = 'Specialty is required';
    if (!addFormData.experience.trim()) errs.experience = 'Experience description is required';

    setAddFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async () => {
    if (!validateAddForm()) return;
    try {
      await createTeacher.mutateAsync({
        fullName: addFormData.fullName.trim(),
        email: addFormData.email.trim(),
        password: addFormData.password,
        country: addFormData.country,
        city: addFormData.city.trim(),
        whatsappNumber: addFormData.whatsappNumber.trim(),
        specialty: addFormData.specialty.trim(),
        experience: addFormData.experience.trim(),
        status: addFormData.status || 'active',
      });
      setIsAddModalOpen(false);
      setAddFormData({
        fullName: '',
        email: '',
        password: '',
        country: '',
        city: '',
        whatsappNumber: '',
        specialty: '',
        experience: '',
        status: 'active',
      });
      setAddFormErrors({});
      refetch();
    } catch {
      // Error is handled with localized toast in useCreateTeacher mutation
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const list = teachers || [];
    const total = list.length;
    const active = list.filter((t: any) => (t.status || 'active').toLowerCase() === 'active').length;
    const pending = list.filter((t: any) => (t.status || '').toLowerCase() === 'pending').length;
    const specialties = new Set(list.map((t: any) => t.specialty).filter(Boolean)).size;
    return { total, active, pending, specialties };
  }, [teachers]);

  // Filter & Search
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    return teachers.filter((teacher: any) => {
      const name = (teacher.full_name || teacher.profile?.full_name || '').toLowerCase();
      const email = (teacher.email || teacher.profile?.email || '').toLowerCase();
      const specialty = (teacher.specialty || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                            email.includes(searchTerm.toLowerCase()) ||
                            specialty.includes(searchTerm.toLowerCase());
      
      const teacherStatus = (teacher.status || 'active').toLowerCase();
      const matchesStatus = statusFilter === 'all' || teacherStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchTerm, statusFilter]);

  const openEditModal = (teacher: any) => {
    setSelectedTeacherId(teacher.id);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTeacher.mutateAsync(deleteId);
      setDeleteId(null);
      refetch();
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={tr("إدارة الأساتذة (Teacher Management)", "Teacher Management")}
        description={tr("إدارة طاقم التدريس، ومتابعة الأداء، مع إمكانية الدخول المباشر لحساب أي أستاذ", "Manage instructors, view performance, and log in directly to teacher accounts")}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: tr("الأساتذة", "Teachers") }]}
        actions={
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-md shadow-purple-500/20 gap-2 rounded-xl"
          >
            <UserPlus className="h-4 w-4" />
            <span>{tr("إضافة أستاذ جديد", "Add Teacher")}</span>
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{tr("إجمالي الأساتذة", "Total Teachers")}</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{tr("الأساتذة النشطون", "Active Teachers")}</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{tr("قيد المراجعة", "Pending Review")}</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">{tr("التخصصات", "Specialties")}</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.specialties}</p>
          </div>
        </div>
      </div>

      {/* Search, Filter & View Controls */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={tr("بحث بالاسم، البريد، أو التخصص...", "Search by name, email, specialty...")} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="ltr:pl-9 rtl:pr-9 rounded-xl text-sm" 
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-36 rounded-xl text-xs font-medium">
              <SelectValue placeholder={tr("الحالة", "Status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tr("جميع الحالات", "All Status")}</SelectItem>
              <SelectItem value="active">{tr("نشط (Active)", "Active")}</SelectItem>
              <SelectItem value="pending">{tr("قيد الانتظار", "Pending")}</SelectItem>
              <SelectItem value="inactive">{tr("غير نشط", "Inactive")}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title={tr("عرض بطاقات", "Grid View")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              title={tr("عرض جدول", "Table View")}
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Teachers Display: GRID VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 shadow-xs border border-border animate-pulse">
                <div className="flex items-start gap-4 mb-4">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2 rounded-lg" />
                    <Skeleton className="h-4 w-40 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2 rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg mb-4" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
              <GraduationCap className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">{tr("لا يوجد أساتذة مسجلين", "No Teachers Found")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? (tr("لا توجد نتائج تطابق شروط البحث الحالية", "No results match your filters"))
                  : (tr("ابدأ بإضافة أول أستاذ للمنصة عبر الزر أعلاه", "Get started by adding your first teacher"))}
              </p>
            </div>
          ) : (
            filteredTeachers.map((teacher: any) => {
              const fullName = teacher.full_name || teacher.profile?.full_name || t('common.unknown');
              const email = teacher.email || teacher.profile?.email || '';
              const specialty = teacher.specialty || 'General';
              const status = teacher.status || 'active';
              const isLoggingIn = impersonatingId === teacher.id;

              return (
                <div 
                  key={teacher.id} 
                  className="bg-card rounded-2xl p-5 sm:p-6 shadow-xs border border-border hover:shadow-lg hover:border-purple-300/40 dark:hover:border-purple-800/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                          {fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base text-foreground truncate">{fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{email}</span>
                          </p>
                        </div>
                      </div>
                      <StatusBadge 
                        status={t(`status.${status}`)} 
                        variant={getStatusVariant(status)} 
                      />
                    </div>

                    {/* Teacher Details */}
                    <div className="bg-secondary/30 rounded-xl p-3 space-y-2 mb-4 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          {t('table.specialty', 'Specialty')}
                        </span>
                        <Badge variant="secondary" className="font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/50">
                          {specialty}
                        </Badge>
                      </div>

                      {teacher.profile?.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-blue-600" />
                            {tr("الهاتف / واتساب", "Phone / WA")}
                          </span>
                          <span className="font-mono text-foreground font-medium ltr:direction-ltr">{teacher.profile.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {tr("تاريخ الانضمام", "Join Date")}
                        </span>
                        <span className="font-medium text-foreground">
                          {teacher.hire_date ? teacher.hire_date.substring(0, 10) : (teacher.created_at ? teacher.created_at.substring(0, 10) : '-')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-2 pt-3 border-t border-border">
                    {/* PRIMARY ACTION: LOGIN AS TEACHER */}
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isLoggingIn}
                      onClick={() => handleImpersonate(teacher)}
                      className="w-full h-10 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold gap-2 shadow-sm shadow-purple-500/20 active:scale-[0.98] transition-all"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="h-4 w-4 rtl:rotate-180" />
                      )}
                      <span>{tr("تسجيل الدخول لحساب الأستاذ", "Login as Teacher")}</span>
                    </Button>

                    {/* Secondary Actions: Edit Profile & Delete */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 h-9 rounded-xl bg-card hover:bg-secondary/50 text-slate-700 dark:text-slate-200 border-border font-semibold text-xs gap-1.5" 
                        onClick={() => openEditModal(teacher)}
                      >
                        <Edit className="h-3.5 w-3.5 text-purple-600" />
                        <span>{tr("تعديل والملف الشامل", "Edit & Profile")}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 w-9 p-0 rounded-xl text-destructive hover:bg-destructive/10 border-destructive/20 shrink-0"
                        onClick={() => setDeleteId(teacher.id)}
                        title={tr("حذف الأستاذ", "Delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-secondary/50 text-slate-600 dark:text-slate-300 font-bold border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">{tr("الأستاذ", "Teacher")}</th>
                  <th className="py-3.5 px-4">{tr("التخصص", "Specialty")}</th>
                  <th className="py-3.5 px-4">{tr("بيانات التواصل", "Contact")}</th>
                  <th className="py-3.5 px-4">{tr("الحالة", "Status")}</th>
                  <th className="py-3.5 px-4 text-center">{tr("الدخول كأستاذ", "Impersonate")}</th>
                  <th className="py-3.5 px-4 text-center">{tr("إجراءات", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      {tr("لا يوجد أساتذة مسجلين", "No teachers found")}
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher: any) => {
                    const fullName = teacher.full_name || teacher.profile?.full_name || t('common.unknown');
                    const email = teacher.email || teacher.profile?.email || '';
                    const specialty = teacher.specialty || 'General';
                    const status = teacher.status || 'active';
                    const isLoggingIn = impersonatingId === teacher.id;

                    return (
                      <tr key={teacher.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{fullName}</p>
                              <p className="text-[11px] text-muted-foreground">{email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="secondary" className="font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50">
                            {specialty}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {teacher.profile?.phone || teacher.profile?.whatsapp_number || '-'}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge 
                            status={t(`status.${status}`)} 
                            variant={getStatusVariant(status)} 
                          />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Button
                            variant="default"
                            size="sm"
                            disabled={isLoggingIn}
                            onClick={() => handleImpersonate(teacher)}
                            className="h-8 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                          >
                            {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5 rtl:rotate-180" />}
                            <span>{tr("دخول الحساب", "Login")}</span>
                          </Button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-600 dark:text-slate-300 hover:text-purple-600"
                              onClick={() => openEditModal(teacher)}
                              title={tr("تعديل", "Edit")}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(teacher.id)}
                              title={tr("حذف", "Delete")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Teacher Detail & Full Profile Modal */}
      <TeacherDetailModal
        teacherId={selectedTeacherId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {tr("الأستاذ", "Teacher")}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr("هل أنت متأكد من رغبتك في حذف هذا الأستاذ؟ سيتم إزالة حسابه وصلاحياته من المنصة.", "Are you sure you want to delete this teacher? Their account and access will be removed.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Teacher Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <span>{tr("إضافة أستاذ جديد إلى المنصة", "Add New Teacher")}</span>
            </DialogTitle>
            <DialogDescription>
              {tr("أدخل البيانات الكاملة للأستاذ الجديد لإنشاء حسابه وإتاحة دخوله لمنصة التدريس", "Fill in teacher credentials to create their instructor account")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">{t('auth.fullName', tr("الاسم الكامل", "Full Name"))} *</Label>
              <Input
                value={addFormData.fullName}
                onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                placeholder={tr("د. أحمد المنصوري", "Dr. Jane Doe")}
                className="rounded-xl"
              />
              {addFormErrors.fullName && <p className="text-xs text-destructive">{addFormErrors.fullName}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('auth.email', tr("البريد الإلكتروني", "Email"))} *</Label>
              <Input
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                placeholder="teacher@nexyvora.com"
                className="rounded-xl"
              />
              {addFormErrors.email && <p className="text-xs text-destructive">{addFormErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('auth.password', tr("كلمة المرور", "Password"))} *</Label>
              <Input
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                placeholder="••••••••"
                className="rounded-xl"
              />
              {addFormErrors.password && <p className="text-xs text-destructive">{addFormErrors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{t('table.specialty', tr("التخصص التدريسي", "Specialty"))} *</Label>
              <Input
                value={addFormData.specialty}
                onChange={(e) => setAddFormData({ ...addFormData, specialty: e.target.value })}
                placeholder={tr("التجارة الإلكترونية / الذكاء الاصطناعي", "E-Commerce / AI Automation")}
                className="rounded-xl"
              />
              {addFormErrors.specialty && <p className="text-xs text-destructive">{addFormErrors.specialty}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{tr("رقم الواتساب", "WhatsApp Number")} *</Label>
              <Input
                value={addFormData.whatsappNumber}
                onChange={(e) => setAddFormData({ ...addFormData, whatsappNumber: e.target.value })}
                placeholder="+212600000000"
                className="rounded-xl"
              />
              {addFormErrors.whatsappNumber && <p className="text-xs text-destructive">{addFormErrors.whatsappNumber}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{tr("الدولة", "Country")} *</Label>
              <Select value={addFormData.country} onValueChange={(val) => setAddFormData({ ...addFormData, country: val })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder={tr("اختر الدولة", "Select Country")} />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addFormErrors.country && <p className="text-xs text-destructive">{addFormErrors.country}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{tr("المدينة", "City")} *</Label>
              <Input
                value={addFormData.city}
                onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                placeholder={tr("الدار البيضاء / الرياض", "Casablanca / Riyadh")}
                className="rounded-xl"
              />
              {addFormErrors.city && <p className="text-xs text-destructive">{addFormErrors.city}</p>}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">{tr("الخبرة والنبذة المهنية", "Experience & Bio")} *</Label>
              <Input
                value={addFormData.experience}
                onChange={(e) => setAddFormData({ ...addFormData, experience: e.target.value })}
                placeholder={tr("أكثر من 5 سنوات في التجارة الإلكترونية والأتمتة", "5+ years experience in E-Commerce and Automation")}
                className="rounded-xl"
              />
              {addFormErrors.experience && <p className="text-xs text-destructive">{addFormErrors.experience}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-xl">
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleAddSubmit} 
              disabled={createTeacher.isPending} 
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl"
            >
              {createTeacher.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <UserPlus className="h-4 w-4 ml-2" />}
              <span>{tr("إنشاء حساب الأستاذ", "Create Teacher")}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
