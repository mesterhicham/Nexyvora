import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, testService, uploadService, academicService } from '@/services/apiService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ============= PLACEMENT TEST QUESTIONS =============
export function usePlacementTestQuestions() {
  return useQuery({
    queryKey: ['placement-test-questions'],
    queryFn: testService.getQuestions,
  });
}

export function useAllPlacementTestQuestions() {
  return useQuery({
    queryKey: ['all-placement-test-questions'],
    queryFn: testService.getAllQuestions,
  });
}

export function useCreatePlacementQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-placement-test-questions'] });
      toast.success('Question created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create question: ${error.message}`);
    },
  });
}

export function useUpdatePlacementQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.updateQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-placement-test-questions'] });
      toast.success('Question updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update question: ${error.message}`);
    },
  });
}

export function useDeletePlacementQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.deleteQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-placement-test-questions'] });
      toast.success('Question deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete question: ${error.message}`);
    },
  });
}

export function useAllTestResults() {
  return useQuery({
    queryKey: ['all-test-results'],
    queryFn: testService.getAllResults,
  });
}

export function useSeedSampleQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.seedSampleQuestions,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['all-placement-test-questions'] });
      queryClient.invalidateQueries({ queryKey: ['placement-test-questions'] });
      toast.success(data?.message || 'Sample placement questions added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to seed questions: ${error.message}`);
    },
  });
}

// ============= STUDENT TEST RESULTS =============
export function useStudentTestResult() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-test-result', user?.id],
    queryFn: async () => {
      try {
        return await testService.getStudentTestResult();
      } catch (e) {
        return null;
      }
    },
    enabled: !!user,
  });
}

export function useSubmitPlacementTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.submitTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-test-result'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollment-status'] });
      toast.success('Test submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit test: ${error.message}`);
    },
  });
}

// ============= PROGRAM PRICING =============
export function useProgramPricing() {
  return useQuery({
    queryKey: ['program-pricing'],
    queryFn: paymentService.getPricing,
  });
}

export function useUpsertProgramPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentService.upsertPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-pricing'] });
      toast.success('Pricing updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update pricing: ${error.message}`);
    },
  });
}

// ============= PAYMENTS =============
export function useStudentPayments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-payments', user?.id],
    queryFn: paymentService.getStudentPayments,
    enabled: !!user,
  });
}

export function useAllPayments() {
  return useQuery({
    queryKey: ['all-payments'],
    queryFn: paymentService.getAllPayments,
  });
}

export function useSubmitManualPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      programId: string;
      amount: number;
      referenceNumber?: string;
      notes?: string;
      file?: File;
      receiptUrl?: string;
    }) => {
      let receiptUrl = data.receiptUrl || '';
      if (data.file) {
        const uploadRes = await uploadService.uploadFile(data.file);
        receiptUrl = uploadRes.url;
      }

      return paymentService.submitPayment({
        programId: data.programId,
        amount: data.amount,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        receiptUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-payments'] });
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      queryClient.invalidateQueries({ queryKey: ['student-details'] });
      toast.success('Payment submitted! Awaiting admin approval.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit payment: ${error.message}`);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: paymentService.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-payments'] });
      toast.success('Payment status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });
}

// ============= STUDENT ENROLLMENT STATUS =============
export function useStudentEnrollmentStatus() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['student-enrollment-status', user?.id],
    queryFn: async () => {
      if (!user || role !== 'student') return null;

      const [payments, testResult] = await Promise.all([
        paymentService.getStudentPayments().catch(() => []),
        testService.getStudentTestResult().catch(() => null),
      ]);
      const hasApprovedPayment = (payments || []).some((p: any) => p.status === 'approved');
      const hasCompletedTest = !!testResult;

      return {
        hasStudent: true,
        hasCompletedTest,
        hasApprovedPayment,
      };
    },
    enabled: !!user && role === 'student',
  });
}

// ============= PROGRAMS =============
export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: academicService.getPrograms,
  });
}
