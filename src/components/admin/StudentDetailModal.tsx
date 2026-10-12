import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useStudentDetails, useCohorts } from '@/hooks/useDashboardData';
import { useUpdateStudent, useAddStudentPayment, useImpersonateStudent } from '@/hooks/useEntityMutations';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { COUNTRIES } from '@/data/countries';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  Edit3,
  Plus,
  FileText,
  AlertCircle,
  Layers,
  Award,
  Loader2,
  Check,
  Percent,
  Receipt,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface StudentDetailModalProps {
  studentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailModal({ studentId, open, onOpenChange }: StudentDetailModalProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const { impersonateUser } = useAuth();
  const { data, isLoading, refetch } = useStudentDetails(studentId);
  const { data: cohorts } = useCohorts();
  const updateStudent = useUpdateStudent();
  const addPayment = useAddStudentPayment();
  const impersonate = useImpersonateStudent();

  const [activeTab, setActiveTab] = useState('overview');

  // Edit form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    city: '',
    country: '',
    address: '',
    bio: '',
    dateOfBirth: '',
    cohort_id: '',
    status: 'active',
    enrollment_date: '',
  });

  // New payment modal/form state
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    currency: 'USD',
    payment_method: 'bank_transfer',
    reference_number: '',
    notes: '',
  });

  // Sync data into local form state
  useEffect(() => {
    if (data?.student) {
      const s = data.student;
      const prof = s.profile || s;
      setFormData({
        fullName: prof.full_name || s.full_name || '',
        phone: prof.phone || s.phone || '',
        whatsappNumber: prof.whatsapp_number || s.whatsapp_number || '',
        city: prof.city || s.city || '',
        country: prof.country || s.country || '',
        address: prof.address || s.address || '',
        bio: prof.bio || s.bio || '',
        dateOfBirth: (prof.date_of_birth || s.date_of_birth) ? (prof.date_of_birth || s.date_of_birth).substring(0, 10) : '',
        cohort_id: s.cohort_id || '',
        status: s.status || 'active',
        enrollment_date: s.enrollment_date ? s.enrollment_date.substring(0, 10) : '',
      });
    }
  }, [data]);

  if (!open) return null;

  const rawStudent = data?.student;
  const profile = rawStudent?.profile || rawStudent || {};
  const student = {
    ...rawStudent,
    full_name: profile.full_name || rawStudent?.full_name || '',
    email: profile.email || rawStudent?.email || '',
    phone: profile.phone || rawStudent?.phone || '',
    whatsapp_number: profile.whatsapp_number || rawStudent?.whatsapp_number || '',
    city: profile.city || rawStudent?.city || '',
    country: profile.country || rawStudent?.country || '',
    address: profile.address || rawStudent?.address || '',
    bio: profile.bio || rawStudent?.bio || '',
    date_of_birth: profile.date_of_birth || rawStudent?.date_of_birth || '',
    cohort_name: rawStudent?.cohort?.name || rawStudent?.cohort_name || '',
    specialty_name: rawStudent?.cohort?.specialty?.name || rawStudent?.specialty_name || '',
    program_name: rawStudent?.cohort?.specialty?.program?.name || rawStudent?.program_name || '',
  };

  const rawPlacementTest = data?.placementTest || data?.placement_test;
  const placementTest = rawPlacementTest ? {
    score: rawPlacementTest.score,
    total_points: rawPlacementTest.total_points ?? rawPlacementTest.totalPoints ?? 100,
    percentage: rawPlacementTest.percentage ?? (rawPlacementTest.total_points ? Math.round((rawPlacementTest.score / rawPlacementTest.total_points) * 100) : 0),
    level: data?.level || rawPlacementTest.level || ((rawPlacementTest.score && rawPlacementTest.score >= 80) ? (isRtl ? 'متقدم (Advanced)' : 'Advanced') : (rawPlacementTest.score && rawPlacementTest.score >= 50) ? (isRtl ? 'متوسط (Intermediate)' : 'Intermediate') : (isRtl ? 'مبتدئ (Beginner)' : 'Beginner')),
    assigned_program_name: rawPlacementTest.assigned_program_name || rawPlacementTest.program_name
  } : (data?.level ? { level: data.level, score: null, total_points: null, percentage: 0 } : null);

  const rawFinancials = data?.financials;
  const financials = {
    program_price: rawFinancials?.totalPrice ?? rawFinancials?.program_price ?? 1000,
    total_paid: rawFinancials?.totalPaid ?? rawFinancials?.total_paid ?? 0,
    remaining_balance: rawFinancials?.remainingBalance ?? rawFinancials?.remaining_balance ?? Math.max(0, (rawFinancials?.totalPrice ?? 1000) - (rawFinancials?.totalPaid ?? 0)),
    currency: rawFinancials?.currency || 'USD',
    payments_count: rawFinancials?.payments?.length ?? 0,
    payments: rawFinancials?.payments || []
  };

  const rawAttendance = data?.attendance;
  const attendance = {
    attendance_rate: rawAttendance?.rate ?? rawAttendance?.attendance_rate ?? 100,
    present_count: rawAttendance?.presentCount ?? rawAttendance?.present_count ?? 0,
    absent_count: rawAttendance?.absentCount ?? rawAttendance?.absent_count ?? 0,
    late_count: rawAttendance?.lateCount ?? rawAttendance?.late_count ?? 0,
    history: rawAttendance?.records ?? rawAttendance?.history ?? []
  };

  const rawProgress = data?.progress;
  const assignments = {
    submissions: rawProgress?.submissions ?? data?.assignments?.submissions ?? [],
    average_grade: rawProgress?.averageGrade ?? data?.assignments?.average_grade ?? null
  };
  const cohortModules = rawProgress?.modules ?? data?.cohort_modules ?? [];
  const formations = rawProgress?.formations ?? data?.formations ?? [];

  // Handle Edit Profile submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    try {
      await updateStudent.mutateAsync({
        id: studentId,
        cohort_id: formData.cohort_id || null,
        status: formData.status,
        enrollment_date: formData.enrollment_date || null,
        fullName: formData.fullName,
        phone: formData.phone,
        whatsappNumber: formData.whatsappNumber,
        city: formData.city,
        country: formData.country,
        address: formData.address,
        bio: formData.bio,
        dateOfBirth: formData.dateOfBirth || null,
      });
      refetch();
    } catch {
      // Handled by mutation hook
    }
  };

  // Handle Add Payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;

    const numAmount = parseFloat(paymentForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error(isRtl ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    try {
      await addPayment.mutateAsync({
        id: studentId,
        amount: numAmount,
        currency: paymentForm.currency,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || undefined,
        notes: paymentForm.notes || undefined,
      });
      setIsAddingPayment(false);
      setPaymentForm({
        amount: '',
        currency: 'USD',
        payment_method: 'bank_transfer',
        reference_number: '',
        notes: '',
      });
      refetch();
    } catch {
      // Handled by mutation hook
    }
  };

  // Handle Impersonation
  const handleImpersonate = async () => {
    if (!studentId) return;
    try {
      const result = await impersonate.mutateAsync(studentId);
      if (result?.token && result?.user) {
        impersonateUser(result.token, result.user);
        toast.success(`${isRtl ? 'تم تسجيل الدخول بنجاح كطالب' : 'Logged in as student'}: ${result.user.full_name || result.user.email}`);
        onOpenChange(false);
        navigate('/student');
      }
    } catch {
      // Handled by mutation hook
    }
  };

  // Level badge helper
  const getLevelBadge = (level: string | null) => {
    if (!level) return <Badge variant="outline" className="text-muted-foreground">{isRtl ? 'لم يُحدَّد' : 'Not specified'}</Badge>;
    if (level.includes('متقدم') || level.toLowerCase().includes('advanced')) {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">{level}</Badge>;
    }
    if (level.includes('متوسط') || level.toLowerCase().includes('intermediate')) {
      return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium">{level}</Badge>;
    }
    return <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-medium">{level}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/70 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-primary/20 shrink-0">
              {student?.full_name ? student.full_name.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                  {student?.full_name || (isRtl ? 'ملف الطالب' : 'Student Profile')}
                </DialogTitle>
                {student && (
                  <StatusBadge 
                    status={t(`status.${student.status || 'active'}`)} 
                    variant={getStatusVariant(student.status || 'active')} 
                  />
                )}
                {placementTest?.level && getLevelBadge(placementTest.level)}
              </div>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">{student?.email}</span>
                {student?.cohort_name && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">{student.cohort_name}</span>
                  </>
                )}
                {student?.specialty_name && (
                  <>
                    <span>•</span>
                    <span>{student.specialty_name}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Impersonate Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={handleImpersonate}
              disabled={impersonate.isPending || !student}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md gap-2"
            >
              {impersonate.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 rtl:rotate-180" />
              )}
              <span>{isRtl ? 'تسجيل الدخول كطالب' : 'Login as Student'}</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">{isRtl ? 'جاري تحميل بيانات الطالب الشاملة...' : 'Loading comprehensive student profile...'}</p>
          </div>
        ) : (
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-secondary/50 p-1 rounded-xl h-auto gap-1">
                <TabsTrigger value="overview" className="rounded-lg py-2.5 gap-2 text-xs md:text-sm font-semibold">
                  <Award className="w-4 h-4 text-primary" />
                  <span>{isRtl ? 'نظرة عامة والمستوى' : 'Overview & Level'}</span>
                </TabsTrigger>
                <TabsTrigger value="edit-profile" className="rounded-lg py-2.5 gap-2 text-xs md:text-sm font-semibold">
                  <Edit3 className="w-4 h-4 text-blue-500" />
                  <span>{isRtl ? 'تعديل بيانات الطالب' : 'Edit Profile'}</span>
                </TabsTrigger>
                <TabsTrigger value="financials" className="rounded-lg py-2.5 gap-2 text-xs md:text-sm font-semibold">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>{isRtl ? 'الوضع المالي والدفعات' : 'Financials & Payments'}</span>
                  {financials && financials.remaining_balance > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="academic" className="rounded-lg py-2.5 gap-2 text-xs md:text-sm font-semibold">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>{isRtl ? 'التقدم والحضور' : 'Progress & Attendance'}</span>
                </TabsTrigger>
              </TabsList>

              {/* ===================== TAB 1: OVERVIEW & LEVEL ===================== */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {/* Highlight Level & Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Level Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/60 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200/60 dark:border-indigo-800/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                        {isRtl ? 'المستوى الأكاديمي الحالي' : 'Current Academic Level'}
                      </span>
                      <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-xl font-black text-foreground flex items-center gap-2">
                        {placementTest?.level ? getLevelBadge(placementTest.level) : (isRtl ? 'لم يخضع للاختبار' : 'Not tested yet')}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {placementTest?.score !== null && placementTest?.score !== undefined ? (
                          <>
                            {isRtl ? 'الدرجة:' : 'Score:'} <span className="font-bold text-foreground">{placementTest.score} / {placementTest.total_points}</span> ({placementTest.percentage}%)
                          </>
                        ) : (
                          isRtl ? 'يمكن للطالب إجراء اختبار تحديد المستوى لتحديد مستواه' : 'Student can take placement test to determine level'
                        )}
                      </p>
                      {placementTest?.percentage !== undefined && (
                        <Progress value={placementTest.percentage} className="h-2 mt-3 bg-indigo-200/50 dark:bg-indigo-900/50" />
                      )}
                    </div>
                  </div>

                  {/* Financial Balance Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-800/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        {isRtl ? 'المتبقي من الرسوم' : 'Remaining Balance'}
                      </span>
                      <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-foreground">
                        {financials?.remaining_balance !== undefined ? (
                          <span className={financials.remaining_balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'}>
                            ${financials.remaining_balance.toLocaleString()} {financials.currency}
                          </span>
                        ) : '$0.00'}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>{isRtl ? 'المدفوع:' : 'Paid:'} ${financials?.total_paid?.toLocaleString() || 0}</span>
                        <span>{isRtl ? 'الإجمالي:' : 'Total:'} ${financials?.program_price?.toLocaleString() || 0}</span>
                      </div>
                      <Progress 
                        value={financials && financials.program_price > 0 ? (financials.total_paid / financials.program_price) * 100 : 0} 
                        className="h-2 mt-3 bg-emerald-200/50 dark:bg-emerald-900/50" 
                      />
                    </div>
                  </div>

                  {/* Attendance & Engagement Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-cyan-50/60 dark:from-blue-950/30 dark:to-cyan-950/20 border border-blue-200/60 dark:border-blue-800/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        {isRtl ? 'نسبة الحضور والتفاعل' : 'Attendance & Engagement'}
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-black text-foreground flex items-center gap-2">
                        <span>{attendance?.attendance_rate ?? 0}%</span>
                        <span className="text-xs font-normal text-muted-foreground">{isRtl ? 'معدل الحضور' : 'Rate'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <span>{isRtl ? 'حاضر:' : 'Present:'} {attendance?.present_count ?? 0}</span>
                        <span>{isRtl ? 'غائب:' : 'Absent:'} {attendance?.absent_count ?? 0}</span>
                        <span>{isRtl ? 'متأخر:' : 'Late:'} {attendance?.late_count ?? 0}</span>
                      </div>
                      <Progress value={attendance?.attendance_rate ?? 0} className="h-2 mt-3 bg-blue-200/50 dark:bg-blue-900/50" />
                    </div>
                  </div>
                </div>

                {/* Personal Information & Program Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Contact Details */}
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                      <User className="w-4 h-4 text-primary" />
                      <span>{isRtl ? 'المعلومات الشخصية والتواصل' : 'Personal & Contact Information'}</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'البريد الإلكتروني' : 'Email'}</span>
                        <span className="font-semibold text-foreground break-all">{student?.email || '-'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'رقم الهاتف' : 'Phone'}</span>
                        <span className="font-semibold text-foreground">{student?.phone || '-'}</span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'رقم الواتساب' : 'WhatsApp'}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{student?.whatsapp_number || '-'}</span>
                          {student?.whatsapp_number && (
                            <a 
                              href={`https://wa.me/${student.whatsapp_number.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-600 hover:text-emerald-700"
                              title={isRtl ? 'مراسلة عبر واتساب' : 'Chat via WhatsApp'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'الدولة والمدينة' : 'Country & City'}</span>
                        <span className="font-semibold text-foreground">
                          {student?.country || ''}{student?.city ? ` - ${student.city}` : '-'}
                        </span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'تاريخ الميلاد' : 'Date of Birth'}</span>
                        <span className="font-semibold text-foreground">
                          {student?.date_of_birth ? student.date_of_birth.substring(0, 10) : '-'}
                        </span>
                      </div>
                      <div className="p-3 bg-secondary/30 rounded-xl">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'تاريخ التسجيل' : 'Enrollment Date'}</span>
                        <span className="font-semibold text-foreground">
                          {student?.enrollment_date ? student.enrollment_date.substring(0, 10) : '-'}
                        </span>
                      </div>
                    </div>

                    {student?.address && (
                      <div className="p-3 bg-secondary/30 rounded-xl text-sm">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'العنوان الكامل' : 'Full Address'}</span>
                        <span className="text-foreground">{student.address}</span>
                      </div>
                    )}

                    {student?.bio && (
                      <div className="p-3 bg-secondary/30 rounded-xl text-sm">
                        <span className="text-xs text-muted-foreground block">{isRtl ? 'نبذة عن الطالب' : 'Bio / Notes'}</span>
                        <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{student.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Academic Pathway Card */}
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-base flex items-center gap-2 text-foreground">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>{isRtl ? 'المسار التعليمي والبرنامج' : 'Academic Program & Cohort'}</span>
                    </h3>

                    <div className="space-y-3">
                      <div className="p-3.5 bg-secondary/30 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">{isRtl ? 'البرنامج الرئيسي' : 'Main Program'}</span>
                          <span className="font-bold text-foreground">{student?.program_name || (isRtl ? 'غير محدد' : 'Not specified')}</span>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          {student?.program_name ? (isRtl ? 'مسجل' : 'Enrolled') : (isRtl ? 'غير مسجل' : 'Not Enrolled')}
                        </Badge>
                      </div>

                      <div className="p-3.5 bg-secondary/30 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">{isRtl ? 'التخصص الأكاديمي' : 'Specialty'}</span>
                          <span className="font-semibold text-foreground">{student?.specialty_name || (isRtl ? 'غير محدد' : 'Not specified')}</span>
                        </div>
                        <Layers className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <div className="p-3.5 bg-secondary/30 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">{isRtl ? 'الفوج الدراسي (Cohort)' : 'Study Cohort'}</span>
                          <span className="font-semibold text-foreground">{student?.cohort_name || (isRtl ? 'غير ملحق بفوج' : 'No cohort assigned')}</span>
                        </div>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* Enrolled Formations */}
                      {formations.length > 0 && (
                        <div className="pt-2">
                          <span className="text-xs font-semibold text-muted-foreground block mb-2">{isRtl ? 'الدورات التكوينية الإضافية:' : 'Additional Formations:'}</span>
                          <div className="flex flex-wrap gap-2">
                            {formations.map((f: any) => (
                              <Badge key={f.id} variant="secondary" className="px-3 py-1 bg-secondary text-xs">
                                {f.title}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ===================== TAB 2: EDIT STUDENT PROFILE ===================== */}
              <TabsContent value="edit-profile" className="space-y-6 mt-0">
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{isRtl ? 'تعديل بيانات الطالب الشخصية والأكاديمية' : 'Edit Student Personal & Academic Details'}</h3>
                      <p className="text-xs text-muted-foreground">{isRtl ? 'يمكن للمدير تعديل كافة بيانات الطالب وتحديث الفوج والحالة وتاريخ التسجيل' : 'Admin can update student profile, assign cohort, status, and enrollment date'}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName">{isRtl ? 'الاسم الكامل *' : 'Full Name *'}</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                          placeholder={isRtl ? 'الاسم الكامل للطالب' : 'Student Full Name'}
                        />
                      </div>

                      {/* Email (Readonly for safety) */}
                      <div className="space-y-2">
                        <Label>{isRtl ? 'البريد الإلكتروني (حساب الدخول)' : 'Email (Login Account)'}</Label>
                        <Input
                          value={student?.email || ''}
                          disabled
                          className="bg-secondary/50 text-muted-foreground cursor-not-allowed"
                        />
                      </div>

                      {/* Phone Number */}
                      <div className="space-y-2">
                        <Label htmlFor="phone">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+212 600-000000"
                        />
                      </div>

                      {/* WhatsApp Number */}
                      <div className="space-y-2">
                        <Label htmlFor="whatsappNumber">{isRtl ? 'رقم الواتساب *' : 'WhatsApp Number *'}</Label>
                        <Input
                          id="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                          placeholder="+212 600-000000"
                        />
                      </div>

                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="country">{isRtl ? 'الدولة' : 'Country'}</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(val) => setFormData({ ...formData, country: val })}
                        >
                          <SelectTrigger id="country">
                            <SelectValue placeholder={isRtl ? 'اختر الدولة' : 'Select Country'} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.name}>
                                {isRtl ? `${c.nameAr} - ${c.name}` : c.name} ({c.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <Label htmlFor="city">{isRtl ? 'المدينة' : 'City'}</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder={isRtl ? 'المدينة' : 'City'}
                        />
                      </div>

                      {/* Cohort Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="cohort">{isRtl ? 'الفوج الدراسي (Cohort)' : 'Study Cohort'}</Label>
                        <Select
                          value={formData.cohort_id || 'none'}
                          onValueChange={(val) => setFormData({ ...formData, cohort_id: val === 'none' ? '' : val })}
                        >
                          <SelectTrigger id="cohort">
                            <SelectValue placeholder={isRtl ? 'اختر الفوج' : 'Select Cohort'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{isRtl ? 'بدون فوج' : 'No Cohort'}</SelectItem>
                            {cohorts?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name} {c.specialty?.name ? `(${c.specialty.name})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Academic Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">{isRtl ? 'الحالة الأكاديمية' : 'Academic Status'}</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder={isRtl ? 'اختر الحالة' : 'Select Status'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">{isRtl ? 'نشط (Active)' : 'Active'}</SelectItem>
                            <SelectItem value="inactive">{isRtl ? 'غير نشط (Inactive)' : 'Inactive'}</SelectItem>
                            <SelectItem value="suspended">{isRtl ? 'معلّق (Suspended)' : 'Suspended'}</SelectItem>
                            <SelectItem value="graduated">{isRtl ? 'متخرّج (Graduated)' : 'Graduated'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Enrollment Date */}
                      <div className="space-y-2">
                        <Label htmlFor="enrollmentDate">{isRtl ? 'تاريخ التسجيل' : 'Enrollment Date'}</Label>
                        <Input
                          id="enrollmentDate"
                          type="date"
                          value={formData.enrollment_date}
                          onChange={(e) => setFormData({ ...formData, enrollment_date: e.target.value })}
                        />
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">{isRtl ? 'تاريخ الميلاد' : 'Date of Birth'}</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">{isRtl ? 'العنوان الكامل' : 'Full Address'}</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder={isRtl ? 'العنوان البريدي أو السكني' : 'Residential or postal address'}
                      />
                    </div>

                    {/* Bio / Admin Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">{isRtl ? 'نبذة وملاحظات عن الطالب' : 'Bio and Admin Notes'}</Label>
                      <Textarea
                        id="bio"
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder={isRtl ? 'أي تفاصيل أو ملاحظات خاصة بالطالب...' : 'Any notes or special instructions regarding this student...'}
                      />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border">
                      <Button
                        type="submit"
                        disabled={updateStudent.isPending}
                        className="bg-primary hover:bg-primary/90 text-white font-bold gap-2 px-6"
                      >
                        {updateStudent.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              {/* ===================== TAB 3: FINANCIALS & PAYMENTS ===================== */}
              <TabsContent value="financials" className="space-y-6 mt-0">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border p-5 rounded-2xl">
                    <span className="text-xs text-muted-foreground block font-medium">{isRtl ? 'إجمالي تكلفة البرنامج المقررة' : 'Total Assigned Tuition Fee'}</span>
                    <div className="text-2xl font-black text-foreground mt-2">
                      ${financials?.program_price?.toLocaleString() ?? '1,000'} {financials?.currency || 'USD'}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">{isRtl ? 'سعر البرنامج المخصص للطالب' : 'Assigned program fee for student'}</span>
                  </div>

                  <div className="bg-card border border-border p-5 rounded-2xl">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">{isRtl ? 'إجمالي الدفعات المسددة' : 'Total Paid Amount'}</span>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                      ${financials?.total_paid?.toLocaleString() ?? '0'} {financials?.currency || 'USD'}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {isRtl ? `عدد الدفعات: ${financials?.payments_count ?? 0} دفعة` : `Payments: ${financials?.payments_count ?? 0}`}
                    </span>
                  </div>

                  <div className={`p-5 rounded-2xl border ${
                    (financials?.remaining_balance ?? 0) > 0 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  }`}>
                    <span className="text-xs font-bold block uppercase tracking-wider">
                      {isRtl ? 'المبلغ المتبقي الواجب أداؤه' : 'Remaining Balance Due'}
                    </span>
                    <div className="text-2xl font-black mt-2">
                      ${financials?.remaining_balance?.toLocaleString() ?? '0'} {financials?.currency || 'USD'}
                    </div>
                    <span className="text-xs mt-1 block opacity-80">
                      {(financials?.remaining_balance ?? 0) === 0 ? (isRtl ? 'تم سداد كامل المستحقات بنجاح ✓' : 'Fully paid ✓') : (isRtl ? 'متبقي على ذمة الطالب' : 'Outstanding balance')}
                    </span>
                  </div>
                </div>

                {/* Payments History & Add Payment Button */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span>{isRtl ? 'سجل الدفعات المالية للطالب' : 'Student Payment History'}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">{isRtl ? 'تفاصيل كافة المبالغ المحولة وسندات الدفع الخاصة بالطالب' : 'All transferred amounts and receipts recorded for student'}</p>
                    </div>

                    <Button
                      onClick={() => setIsAddingPayment(true)}
                      className="bg-primary hover:bg-primary/90 text-white gap-2 font-semibold text-xs h-9 rounded-xl shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isRtl ? 'تسجيل دفعة جديدة' : 'Record New Payment'}</span>
                    </Button>
                  </div>

                  {/* Add Payment Form (Conditional Drawer) */}
                  {isAddingPayment && (
                    <form onSubmit={handlePaymentSubmit} className="bg-secondary/40 border border-primary/20 rounded-xl p-4 space-y-4 my-3">
                      <div className="flex items-center justify-between border-b border-border/50 pb-2">
                        <span className="font-bold text-sm text-foreground flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span>{isRtl ? 'تسجيل دفعة مالية جديدة باسم الطالب' : 'Record New Payment for Student'}</span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAddingPayment(false)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="payAmount" className="text-xs">{isRtl ? 'المبلغ *' : 'Amount *'}</Label>
                          <Input
                            id="payAmount"
                            type="number"
                            step="0.01"
                            min="1"
                            placeholder="e.g. 250"
                            value={paymentForm.amount}
                            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                            required
                            className="h-9 text-sm"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="payCurrency" className="text-xs">{isRtl ? 'العملة' : 'Currency'}</Label>
                          <Select
                            value={paymentForm.currency}
                            onValueChange={(val) => setPaymentForm({ ...paymentForm, currency: val })}
                          >
                            <SelectTrigger id="payCurrency" className="h-9 text-sm">
                              <SelectValue placeholder={isRtl ? 'العملة' : 'Currency'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="EUR">EUR (€)</SelectItem>
                              <SelectItem value="MAD">{isRtl ? 'MAD (درهم)' : 'MAD (Dirham)'}</SelectItem>
                              <SelectItem value="SAR">{isRtl ? 'SAR (ريال)' : 'SAR (Riyal)'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="payMethod" className="text-xs">{isRtl ? 'طريقة الدفع' : 'Payment Method'}</Label>
                          <Select
                            value={paymentForm.payment_method}
                            onValueChange={(val) => setPaymentForm({ ...paymentForm, payment_method: val })}
                          >
                            <SelectTrigger id="payMethod" className="h-9 text-sm">
                              <SelectValue placeholder={isRtl ? 'طريقة الدفع' : 'Payment Method'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">{isRtl ? 'تحويل بنكي (Bank Transfer)' : 'Bank Transfer'}</SelectItem>
                              <SelectItem value="cash">{isRtl ? 'نقداً (Cash)' : 'Cash'}</SelectItem>
                              <SelectItem value="stripe">{isRtl ? 'بطاقة بنكية (Stripe)' : 'Credit Card (Stripe)'}</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="other">{isRtl ? 'أخرى' : 'Other'}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="payRef" className="text-xs">{isRtl ? 'رقم المرجع / الإيصال' : 'Reference Number'}</Label>
                          <Input
                            id="payRef"
                            placeholder="e.g. TXN-99824"
                            value={paymentForm.reference_number}
                            onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="payNotes" className="text-xs">{isRtl ? 'ملاحظات على الدفعة (اختياري)' : 'Notes (Optional)'}</Label>
                        <Input
                          id="payNotes"
                          placeholder={isRtl ? 'ملاحظات توثيقية إضافية للدفعة...' : 'Additional payment notes...'}
                          value={paymentForm.notes}
                          onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                          className="h-9 text-sm"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddingPayment(false)}
                          className="text-xs h-8"
                        >
                          {isRtl ? 'إلغاء' : 'Cancel'}
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addPayment.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5"
                        >
                          {addPayment.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{isRtl ? 'تأكيد تسجيل الدفعة' : 'Confirm Payment Entry'}</span>
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Payments Table */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                      <thead className="bg-secondary/40 text-xs text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="p-3">{isRtl ? 'المبلغ' : 'Amount'}</th>
                          <th className="p-3">{isRtl ? 'طريقة الدفع' : 'Method'}</th>
                          <th className="p-3">{isRtl ? 'رقم المرجع' : 'Reference'}</th>
                          <th className="p-3">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="p-3">{isRtl ? 'الوصل المرفوع' : 'Receipt'}</th>
                          <th className="p-3">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {!financials?.payments || financials.payments.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              {isRtl ? 'لا توجد دفعات مسجلة لهذا الطالب حتى الآن' : 'No payment records found for this student'}
                            </td>
                          </tr>
                        ) : (
                          financials.payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                                {p.created_at ? new Date(p.created_at).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US') : '-'}
                              </td>
                              <td className="p-3 font-bold text-foreground whitespace-nowrap">
                                ${Number(p.amount).toLocaleString()} {p.currency || 'USD'}
                              </td>
                              <td className="p-3 text-muted-foreground text-xs">
                                <Badge variant="outline" className="text-xs font-normal">
                                  {p.payment_method || (isRtl ? 'تحويل' : 'Transfer')}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs text-muted-foreground font-mono">
                                {p.reference_number || '-'}
                              </td>
                              <td className="p-3">
                                <Badge className={
                                  p.status === 'approved' 
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }>
                                  {p.status === 'approved' ? (isRtl ? 'مقبولة' : 'Approved') : p.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-xs">
                                {p.receipt_url ? (
                                  <a
                                    href={p.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 font-medium bg-primary/10 px-2 py-1 rounded w-fit"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{isRtl ? 'عرض الوصل' : 'View Receipt'}</span>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                                {p.notes || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              {/* ===================== TAB 4: ACADEMIC & ATTENDANCE ===================== */}
              <TabsContent value="academic" className="space-y-6 mt-0">
                {/* Cohort Modules Section */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <span>{isRtl ? `المواد والوحدات الدراسية المقررة للفوج (${cohortModules.length})` : `Cohort Modules & Curriculum (${cohortModules.length})`}</span>
                  </h3>

                  {cohortModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-4 text-center bg-secondary/20 rounded-xl">
                      {isRtl ? 'لا توجد وحدات دراسية مضافة لهذا الفوج حالياً' : 'No modules currently added for this cohort'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {cohortModules.map((mod: any) => (
                        <div key={mod.id} className="p-3 bg-secondary/30 rounded-xl border border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-primary">{mod.code || 'MOD'}</span>
                            {mod.credits && (
                              <Badge variant="outline" className="text-[10px]">
                                {mod.credits} {isRtl ? 'وحدات' : 'credits'}
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-foreground mt-1">{mod.name}</h4>
                          {mod.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{mod.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Lesson Attendance Log */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{isRtl ? `سجل الحضور والغياب في الدروس (${attendance?.history?.length ?? 0})` : `Lesson Attendance Log (${attendance?.history?.length ?? 0})`}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">{isRtl ? 'تفاصيل حضور الطالب للحصص المباشرة والدروس' : 'Attendance record for live sessions and lessons'}</p>
                    </div>
                    <Badge variant="outline" className="font-bold text-blue-600 border-blue-200">
                      {isRtl ? `نسبة الحضور: ${attendance?.attendance_rate ?? 0}%` : `Attendance Rate: ${attendance?.attendance_rate ?? 0}%`}
                    </Badge>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                      <thead className="bg-secondary/40 text-xs text-muted-foreground sticky top-0 border-b border-border">
                        <tr>
                          <th className="p-3">{isRtl ? 'الدرس' : 'Lesson'}</th>
                          <th className="p-3">{isRtl ? 'التاريخ' : 'Date'}</th>
                          <th className="p-3">{isRtl ? 'الحالة' : 'Status'}</th>
                          <th className="p-3">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {!attendance?.history || attendance.history.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                              {isRtl ? 'لا توجد سجلات حضور مسجلة لهذا الطالب حتى الآن' : 'No attendance records registered yet'}
                            </td>
                          </tr>
                        ) : (
                          attendance.history.map((att: any) => (
                            <tr key={att.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-semibold text-foreground">
                                {att.lesson_title || (isRtl ? 'درس بدون عنوان' : 'Untitled Lesson')}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                {att.lesson_date ? att.lesson_date.substring(0, 10) : '-'}
                              </td>
                              <td className="p-3">
                                {att.status === 'present' && (
                                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{isRtl ? 'حاضر' : 'Present'}</span>
                                  </Badge>
                                )}
                                {att.status === 'absent' && (
                                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 gap-1">
                                    <XCircle className="w-3 h-3" />
                                    <span>{isRtl ? 'غائب' : 'Absent'}</span>
                                  </Badge>
                                )}
                                {att.status === 'late' && (
                                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{isRtl ? 'متأخر' : 'Late'}</span>
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">
                                {att.notes || '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Assignment Submissions */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span>{isRtl ? `تسليم المهام والواجبات (${assignments?.submissions?.length ?? 0})` : `Assignment Submissions (${assignments?.submissions?.length ?? 0})`}</span>
                      </h3>
                      <p className="text-xs text-muted-foreground">{isRtl ? 'الواجبات المسلمة من الطالب مع النقط وملاحظات الأستاذ' : 'Assignments submitted by student with grades and feedback'}</p>
                    </div>
                    {assignments?.average_grade !== null && assignments?.average_grade !== undefined && (
                      <Badge variant="outline" className="font-bold text-purple-600 border-purple-200">
                        {isRtl ? `معدل الدرجات: ${assignments.average_grade}%` : `Average Grade: ${assignments.average_grade}%`}
                      </Badge>
                    )}
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className={`w-full text-sm ${isRtl ? 'text-right' : 'text-left'}`}>
                      <thead className="bg-secondary/40 text-xs text-muted-foreground sticky top-0 border-b border-border">
                        <tr>
                          <th className="p-3">{isRtl ? 'المهمة / الواجب' : 'Assignment'}</th>
                          <th className="p-3">{isRtl ? 'تاريخ التسليم' : 'Submitted At'}</th>
                          <th className="p-3">{isRtl ? 'الدرجة' : 'Grade'}</th>
                          <th className="p-3">{isRtl ? 'ملاحظات الأستاذ' : 'Feedback'}</th>
                          <th className="p-3">{isRtl ? 'الملف' : 'File'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {!assignments?.submissions || assignments.submissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-muted-foreground">
                              {isRtl ? 'لم يقم الطالب بتسليم أي مهام حتى الآن' : 'No assignments submitted yet'}
                            </td>
                          </tr>
                        ) : (
                          assignments.submissions.map((sub: any) => (
                            <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                              <td className="p-3 font-semibold text-foreground">
                                {sub.assignment_title || (isRtl ? 'واجب' : 'Assignment')}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US') : '-'}
                              </td>
                              <td className="p-3">
                                {sub.grade !== null && sub.grade !== undefined ? (
                                  <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                                    {sub.grade} / {sub.max_score || 100}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    {isRtl ? 'قيد التصحيح' : 'Grading in progress'}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground max-w-xs truncate">
                                {sub.feedback || '-'}
                              </td>
                              <td className="p-3 text-xs">
                                {sub.file_url ? (
                                  <a
                                    href={sub.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{isRtl ? 'تحميل' : 'Download'}</span>
                                  </a>
                                ) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
