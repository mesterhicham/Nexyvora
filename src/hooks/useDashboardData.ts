import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService, userService, paymentService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface StudentWithProfile {
  id: string;
  status: string | null;
  enrollment_date: string | null;
  user_id: string | null;
  cohort_id: string | null;
  profile?: { full_name: string | null; email: string } | null;
  cohort?: {
    name: string;
    specialty?: {
      name: string;
      program?: { name: string } | null;
    } | null;
  } | null;
}

interface TeacherWithProfile {
  id: string;
  status: string | null;
  specialty: string | null;
  hire_date: string | null;
  user_id: string | null;
  profile?: { full_name: string | null; email: string } | null;
}

interface ModuleWithTeacher {
  id: string;
  name: string;
  code: string;
  hours: number | null;
  specialty_id: string | null;
  teacher_id: string | null;
  specialty?: { name: string } | null;
  teacher?: { full_name: string | null } | null;
}

// Fetch all students with their profile and cohort data
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: academicService.getStudents,
  });
}

// Fetch detailed student profile, level, attendance, progress, and financials
export function useStudentDetails(studentId: string | null) {
  return useQuery({
    queryKey: ['student-details', studentId],
    queryFn: () => (studentId ? academicService.getStudentDetails(studentId) : null),
    enabled: !!studentId,
  });
}

// Fetch all teachers with their profile data
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: academicService.getTeachers,
  });
}

// Fetch detailed teacher profile and statistics
export function useTeacherDetails(teacherId: string | null) {
  return useQuery({
    queryKey: ['teacher-details', teacherId],
    queryFn: () => (teacherId ? academicService.getTeacherDetails(teacherId) : null),
    enabled: !!teacherId,
  });
}

// Fetch all programs
export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: academicService.getPrograms,
  });
}

// Fetch all specialties with program data
export function useSpecialties() {
  return useQuery({
    queryKey: ['specialties'],
    queryFn: academicService.getSpecialties,
  });
}

// Fetch all cohorts with specialty data
export function useCohorts() {
  return useQuery({
    queryKey: ['cohorts'],
    queryFn: academicService.getCohorts,
  });
}

// Fetch all modules with teacher data
export function useModules() {
  return useQuery({
    queryKey: ['modules'],
    queryFn: academicService.getModules,
  });
}

// Fetch modules for the current teacher
export function useTeacherModules() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-modules', user?.id],
    queryFn: async (): Promise<ModuleWithTeacher[]> => {
      if (!user?.id) return [];

      const allModules = await academicService.getModules();
      const modules = allModules.filter(
        (m: any) => m.teacher_user_id === user?.id || m.teacher_id === user?.id
      );

      return modules.map((module: any) => ({
        ...module,
        specialty: module.specialty || null,
        teacher: null
      }));
    },
    enabled: !!user?.id,
  });
}

// Fetch student data for current user
export function useCurrentStudent() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-student', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      try {
        const student = await studentService.getRecord();
        return student;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user?.id,
  });
}

// Fetch modules for current student's specialty
export function useStudentModules() {
  const { data: student } = useCurrentStudent();
  const specialtyId = student?.cohort?.specialty?.id;

  return useQuery({
    queryKey: ['student-modules', specialtyId],
    queryFn: async (): Promise<ModuleWithTeacher[]> => {
      if (!specialtyId) return [];

      const allModules = await academicService.getModules();
      const filtered = allModules.filter((m: any) => m.specialty_id === specialtyId);

      return filtered.map((module: any) => ({
        ...module,
        specialty: module.specialty_name ? { name: module.specialty_name } : null,
        teacher: module.teacher_name ? { full_name: module.teacher_name } : null
      }));
    },
    enabled: !!specialtyId,
  });
}

// Dashboard stats for admin
export function useAdminStats() {
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: userService.getAdminStats,
  });

  return {
    totalMembers: stats?.totalMembers || 0,
    totalStudents: stats?.students || 0,
    totalTeachers: stats?.teachers || 0,
    businessPartners: stats?.businessPartners || 0,
    totalPrograms: stats?.programs || 0,
    totalCohorts: stats?.cohorts || 0,
    totalModules: stats?.modules || 0,
    totalFormations: stats?.formations || 0,
    activeStudents: stats?.activeStudents ?? stats?.students ?? 0,
    graduatedStudents: stats?.graduatedStudents || 0,
    pendingTeachers: stats?.pendingTeachers || 0,
    pendingPayments: stats?.pendingPayments || 0,
    
    // Core Requested Financials
    totalSales: stats?.totalSales || 0,
    totalSalesCount: stats?.totalSalesCount || 0,
    packageSales: stats?.packageSales || 0,
    courseSales: stats?.courseSales || 0,

    // Wallet Deposits
    totalDeposits: stats?.totalDeposits || 0,
    totalDepositsCount: stats?.totalDepositsCount || 0,
    pendingDeposits: stats?.pendingDeposits || 0,
    pendingDepositsCount: stats?.pendingDepositsCount || 0,

    totalWithdrawals: stats?.totalWithdrawals || 0,
    totalWithdrawalsCount: stats?.totalWithdrawalsCount || 0,
    pendingWithdrawals: stats?.pendingWithdrawals || 0,
    pendingWithdrawalsCount: stats?.pendingWithdrawalsCount || 0,
    rejectedWithdrawals: stats?.rejectedWithdrawals || 0,

    netPlatformProfit: stats?.netPlatformProfit || 0,
    totalMemberBalances: stats?.totalMemberBalances || 0,
    totalCommissionsPaid: stats?.totalCommissionsPaid || 0,

    revenue: stats?.totalSales || stats?.revenue || 0,
    programDistribution: stats?.programDistribution || [],
    monthlyEnrollments: stats?.monthlyEnrollments || [],
    recentTransactions: stats?.recentTransactions || [],
    recentPendingWithdrawals: stats?.recentPendingWithdrawals || [],
    isLoading,
    refetch,
  };
}

// Dashboard stats for teacher
export function useTeacherStats() {
  const { data: modules, isLoading: modulesLoading } = useTeacherModules();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['teacher-stats'],
    queryFn: () => userService.getStats('teacher').catch(() => ({ assignedModules: 0, upcomingMeetings: 0 })),
  });

  return {
    totalModules: stats?.assignedModules ?? (modules?.length || 0),
    totalStudents: 0,
    pendingAssignments: 0,
    upcomingLessons: stats?.upcomingMeetings || 0,
    isLoading: modulesLoading && statsLoading,
  };
}

// Dashboard stats for student
export function useStudentStats() {
  const { data: modules, isLoading } = useStudentModules();

  return {
    enrolledCourses: modules?.length || 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageGrade: 0,
    attendanceRate: 0,
    isLoading,
  };
}

// Pending payments for dashboard widget
export interface PendingPaymentWithDetails {
  id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  created_at: string;
  student_name: string;
  student_email: string;
  program_name: string | null;
  receipt_url: string | null;
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ['pending-payments-widget'],
    queryFn: async (): Promise<PendingPaymentWithDetails[]> => {
      const allPayments = await paymentService.getAllPayments();
      return (allPayments || [])
        .filter((p: any) => p.status === 'pending')
        .map((payment: any) => ({
          id: payment.id,
          amount: Number(payment.amount) || 0,
          currency: payment.currency || 'MAD',
          payment_method: payment.payment_method || 'manual',
          reference_number: payment.reference_number || null,
          created_at: payment.created_at || '',
          receipt_url: payment.receipt_url || null,
          student_name: payment.full_name || 'Unknown',
          student_email: payment.email || '',
          program_name: payment.program_name || null,
        }));
    },
  });
}

export function useQuickPaymentAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: 'approved' | 'rejected'; adminNotes?: string }) => {
      await paymentService.updateStatus({ id, status, adminNotes });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments-widget'] });
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(`Payment ${variables.status}!`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

export function useQuickTeacherAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active' | 'pending' | 'rejected' }) => {
      await academicService.updateTeacher({ id, status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(variables.status === 'active' ? 'تمت الموافقة على المدرس بنجاح' : 'تم تحديث حالة المدرس');
    },
    onError: (error: Error) => {
      toast.error(`فشل في تحديث حالة المدرس: ${error.message}`);
    },
  });
}
