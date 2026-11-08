import { useCallback, useMemo } from 'react';
import { useFormationContent, useUpdateProgress, FormationContent } from '@/hooks/useFormations';

/**
 * Lesson sequence for one course, driven by the server.
 * The API already computes `locked` / `completed` for every lesson, so this hook never decides
 * access on its own: it only derives navigation and progress figures from that answer.
 */
export function useLessonSequence(formationId: string | undefined, enrollmentId: string | undefined, currentLessonId?: string | null) {
  const { data, isLoading, isError } = useFormationContent(formationId);
  const updateProgress = useUpdateProgress();

  const lessons: FormationContent[] = useMemo(() => data || [], [data]);
  const total = lessons.length;
  const completedCount = lessons.filter((l) => l.completed).length;
  const percent = total > 0 ? Math.min(100, Math.round((completedCount / total) * 100)) : 0;
  const isCourseCompleted = total > 0 && completedCount >= total;

  // Default lesson: the requested one if open, otherwise the first open lesson that is not completed yet
  const currentIndex = useMemo(() => {
    if (!total) return -1;
    const requested = currentLessonId ? lessons.findIndex((l) => l.id === currentLessonId && !l.locked) : -1;
    if (requested !== -1) return requested;
    const firstPending = lessons.findIndex((l) => !l.locked && !l.completed);
    if (firstPending !== -1) return firstPending;
    return 0;
  }, [lessons, total, currentLessonId]);

  const current = currentIndex >= 0 ? lessons[currentIndex] : undefined;
  const previous = currentIndex > 0 ? lessons[currentIndex - 1] : undefined;
  const next = currentIndex >= 0 && currentIndex < total - 1 ? lessons[currentIndex + 1] : undefined;

  const saveProgress = useCallback((lessonId: string, watchedSeconds: number) => {
    if (!enrollmentId) return;
    updateProgress.mutate({ enrollmentId, contentId: lessonId, watchedSeconds });
  }, [enrollmentId, updateProgress]);

  /** Video watched or PDF / text read: the server validates and unlocks the next lesson */
  const completeLesson = useCallback((lessonId: string, watchedSeconds = 0) => {
    if (!enrollmentId) return Promise.resolve();
    return updateProgress.mutateAsync({ enrollmentId, contentId: lessonId, watchedSeconds, completed: true });
  }, [enrollmentId, updateProgress]);

  return {
    lessons,
    loading: isLoading,
    error: isError,
    total,
    completedCount,
    remaining: Math.max(0, total - completedCount),
    percent,
    isCourseCompleted,
    currentIndex,
    current,
    previous,
    next,
    canGoPrevious: !!previous,
    canGoNext: !!next && !next.locked,
    saveProgress,
    completeLesson,
    isSaving: updateProgress.isPending,
  };
}

export function formatDuration(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
