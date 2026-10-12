import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { academicService, teacherService, uploadService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Lesson Content hooks
export function useLessonContent(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-content', lessonId],
    queryFn: () => teacherService.getLessonContent(lessonId),
    enabled: !!lessonId,
  });
}

export function useUploadLessonContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      lessonId: string;
      title: string;
      contentType: 'video' | 'pdf';
      file: File;
      durationSeconds: number | null;
      orderIndex: number;
    }) => {
      // 1. Upload file
      const uploadRes = await uploadService.uploadFile(data.file);

      // 2. Save metadata
      return teacherService.uploadLessonContent({
        lessonId: data.lessonId,
        title: data.title,
        contentType: data.contentType,
        fileUrl: uploadRes.url,
        durationSeconds: data.durationSeconds,
        orderIndex: data.orderIndex,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-content', variables.lessonId] });
      toast.success('تم رفع المحتوى بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في رفع المحتوى: ' + error.message);
    },
  });
}

export function useDeleteLessonContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.deleteLessonContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-content'] });
      toast.success('تم حذف المحتوى بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في حذف المحتوى: ' + error.message);
    },
  });
}

export function useReorderLessonContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.reorderLessonContent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-content'] });
      toast.success('تم إعادة ترتيب المحتوى');
    },
    onError: (error: Error) => {
      toast.error('فشل في إعادة الترتيب: ' + error.message);
    },
  });
}

// Lessons hooks
export function useTeacherLessons() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-lessons', user?.id],
    queryFn: teacherService.getLessons,
    enabled: !!user?.id,
  });
}

export function useCreateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.createLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons'] });
      toast.success('Lesson created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create lesson: ' + error.message);
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.updateLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons'] });
      toast.success('Lesson updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update lesson: ' + error.message);
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.deleteLesson,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-lessons'] });
      toast.success('Lesson deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete lesson: ' + error.message);
    },
  });
}

// Lesson attendance
export function useLessonAttendance(lessonId: string) {
  return useQuery({
    queryKey: ['lesson-attendance', lessonId],
    queryFn: () => teacherService.getAttendance(lessonId),
    enabled: !!lessonId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.markAttendance,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lesson-attendance', variables[0]?.lesson_id] });
      toast.success('تم حفظ الحضور بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في حفظ الحضور: ' + error.message);
    },
  });
}

// Assignments hooks
export function useTeacherAssignments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-assignments', user?.id],
    queryFn: teacherService.getAssignments,
    enabled: !!user?.id,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Assignment created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create assignment: ' + error.message);
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.updateAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Assignment updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update assignment: ' + error.message);
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Assignment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete assignment: ' + error.message);
    },
  });
}

// Get cohort students for a teacher
export function useCohortStudents(cohortId: string) {
  return useQuery({
    queryKey: ['cohort-students', cohortId],
    queryFn: async () => {
      // We'll use a generic student fetch filter by cohort if we add it
      const students = await academicService.getStudents();
      return students.filter((s: any) => s.cohort_id === cohortId);
    },
    enabled: !!cohortId,
  });
}

// Teacher's modules and cohorts
export function useTeacherModulesAndCohorts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teacher-modules-cohorts', user?.id],
    queryFn: async () => {
      const allModules = await academicService.getModules();
      const modules = allModules.filter(
        (m: any) => m.teacher_user_id === user?.id || m.teacher_id === user?.id
      );

      const specialtyIds = [...new Set(modules?.map((m: any) => m.specialty_id).filter(Boolean))];
      const allCohorts = await academicService.getCohorts();
      const cohorts = allCohorts.filter((c: any) => specialtyIds.includes(c.specialty_id));

      return { modules, cohorts };
    },
    enabled: !!user?.id,
  });
}

export function useAssignmentSubmissions(assignmentId: string | undefined) {
  return useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => teacherService.getAssignmentSubmissions(assignmentId!),
    enabled: !!assignmentId,
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: teacherService.gradeSubmission,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
      toast.success('تم تقييم المهمة بنجاح');
    },
    onError: (error: Error) => {
      toast.error('فشل في التقييم: ' + error.message);
    },
  });
}
