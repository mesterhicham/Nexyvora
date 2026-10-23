import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formationService } from '@/services/apiService';

export interface Formation {
  id: string;
  title: string;
  description: string | null;
  price: number;
  currency: string;
  thumbnail_url: string | null;
  package_id?: string | null;
  package_name?: string | null;
  package_name_ar?: string | null;
  package_level?: number | null;
  package_price?: number | null;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormationContent {
  id: string;
  formation_id: string;
  title: string;
  content_type: 'video' | 'pdf' | 'quiz' | 'text';
  file_url: string;
  duration_seconds: number | null;
  order_index: number;
  quiz_id: string | null;
  created_at: string;
}

export interface FormationEnrollment {
  id: string;
  formation_id: string;
  student_id: string;
  payment_status: 'pending' | 'approved' | 'rejected';
  payment_id: string | null;
  enrolled_at: string;
  formation_title?: string;
  student_name?: string;
  thumbnail_url?: string;
  total_contents?: number;
  completed_contents?: number;
  is_completed?: boolean;
  progress_percent?: number;
}

export interface FormationPayment {
  id: string;
  formation_id: string;
  student_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  receipt_url: string | null;
  notes: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  formation_title?: string;
  student_name?: string;
  student_email?: string;
}

export interface FormationRevenueStats {
  id: string;
  title: string;
  price: number;
  currency: string;
  total_enrollments: number;
  approved_enrollments: number;
  total_revenue: number;
}

// Fetch all formations (for admin/teacher)
export function useFormations() {
  return useQuery({
    queryKey: ['formations'],
    queryFn: () => formationService.getFormations(),
  });
}

// Fetch published formations (for students browsing)
export function usePublishedFormations() {
  return useQuery({
    queryKey: ['formations', 'published'],
    queryFn: () => formationService.getPublishedFormations(),
  });
}

// Fetch formation content
export function useFormationContent(formationId: string | undefined) {
  return useQuery({
    queryKey: ['formation-content', formationId],
    queryFn: () => formationService.getFormationContent(formationId!),
    enabled: !!formationId,
  });
}

// Create formation
export function useCreateFormation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Formation>) => formationService.createFormation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Formation created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update formation
export function useUpdateFormation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Formation> & { id: string }) => formationService.updateFormation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Formation updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete formation
export function useDeleteFormation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => formationService.deleteFormation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Formation deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Add content to formation
export function useAddFormationContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => formationService.addFormationContent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['formation-content', variables.formation_id] });
      toast.success('Content added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateFormationContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<FormationContent> & { id: string }) => 
      formationService.updateFormationContent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['formation-content'] });
      toast.success('Content updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete content
export function useDeleteFormationContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formationId }: { id: string; formationId: string }) => 
      formationService.deleteFormationContent(id).then(() => formationId),
    onSuccess: (formationId) => {
      queryClient.invalidateQueries({ queryKey: ['formation-content', formationId] });
      toast.success('Content deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Reorder content
export function useReorderFormationContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ formationId, items }: { formationId: string; items: { id: string; order_index: number }[] }) => 
      formationService.reorderFormationContent(items).then(() => formationId),
    onSuccess: (formationId) => {
      queryClient.invalidateQueries({ queryKey: ['formation-content', formationId] });
      toast.success('Content reordered successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Student enrollments (mine)
export function useStudentEnrollments() {
  return useQuery({
    queryKey: ['formation-enrollments', 'mine'],
    queryFn: () => formationService.getStudentEnrollments(),
  });
}

// All enrollments (admin)
export function useAllEnrollments() {
  return useQuery({
    queryKey: ['formation-enrollments', 'all'],
    queryFn: () => formationService.getAllEnrollments(),
  });
}

// Update enrollment status (admin)
export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; status: string }) => formationService.updateEnrollmentStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formation-enrollments'] });
      toast.success('Enrollment status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Formation payments
export function useFormationPayments() {
  return useQuery({
    queryKey: ['formation-payments'],
    queryFn: () => formationService.getAllPayments(),
  });
}

// Update payment status (admin)
export function useUpdateFormationPaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; status: string; admin_notes?: string }) => 
      formationService.updatePaymentStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formation-payments'] });
      queryClient.invalidateQueries({ queryKey: ['formation-enrollments'] });
      toast.success('Payment status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Revenue statistics (admin)
export function useFormationRevenueStats() {
  return useQuery({
    queryKey: ['formation-stats', 'revenue'],
    queryFn: () => formationService.getRevenueStats(),
  });
}

// Student Progress
export function useStudentProgress(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['formation-progress', enrollmentId],
    queryFn: () => formationService.getStudentProgress(enrollmentId!),
    enabled: !!enrollmentId,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => formationService.updateStudentProgress(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['formation-progress', variables.enrollmentId] });
      queryClient.invalidateQueries({ queryKey: ['formation-enrollments'] });
    },
  });
}

// Submit payment (enroll)
export function useSubmitFormationPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => formationService.submitPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formation-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['formations'] });
      toast.success('Payment submitted successfully. Waiting for approval.');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
