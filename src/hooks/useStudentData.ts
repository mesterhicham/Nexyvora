import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentService, academicService, uploadService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Get student record for current user
export function useStudentRecord() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-record', user?.id],
    queryFn: studentService.getRecord,
    enabled: !!user?.id,
  });
}

// Get modules for student's cohort
export function useStudentModules() {
  const { data: student } = useStudentRecord();

  return useQuery({
    queryKey: ['student-modules', student?.cohort_id],
    queryFn: async () => {
      if (!student?.cohort_id) return [];

      const allModules = await academicService.getModules();
      let specialtyId = (student as any)?.cohort?.specialty?.id || (student as any)?.specialty_id;

      if (!specialtyId) {
        const allCohorts = await academicService.getCohorts();
        const cohort = allCohorts.find((c: any) => c.id === student.cohort_id);
        specialtyId = cohort?.specialty_id;
      }

      if (!specialtyId) return [];

      return allModules.filter((m: any) => m.specialty_id === specialtyId);
    },
    enabled: !!student?.cohort_id,
  });
}

// Get lessons for student's cohort
export function useStudentLessons() {
  const { data: student } = useStudentRecord();

  return useQuery({
    queryKey: ['student-lessons', student?.cohort_id],
    queryFn: studentService.getLessons,
    enabled: !!student?.cohort_id,
  });
}

// Get assignments for student's cohort
export function useStudentAssignments() {
  const { data: student } = useStudentRecord();

  return useQuery({
    queryKey: ['student-assignments', student?.cohort_id, student?.id],
    queryFn: studentService.getAssignments,
    enabled: !!student?.cohort_id,
  });
}

// Submit assignment
export function useSubmitAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      assignmentId: string;
      file: File;
      submissionText?: string;
    }) => {
      // 1. Upload file
      const uploadRes = await uploadService.uploadFile(data.file);

      // 2. Submit to backend
      return studentService.submitAssignment({
        assignment_id: data.assignmentId,
        submission_url: uploadRes.url,
        submission_text: data.submissionText,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      toast.success('تم تسليم الواجب بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في تسليم الواجب: ' + error.message);
    },
  });
}

export function useMySubmissions() {
  return useQuery({
    queryKey: ['my-submissions'],
    queryFn: studentService.getMySubmissions,
  });
}

export function useLessonProgress(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-progress', lessonId],
    queryFn: () => studentService.getLessonProgress(lessonId),
    enabled: !!lessonId,
  });
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: studentService.updateLessonProgress,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-progress', variables.lessonId] });
    },
  });
}
