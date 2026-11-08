import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tr } from '@/utils/tr';
import { Progress } from '@/components/ui/progress';
import { LessonThumbnail } from '@/components/formation/LessonThumbnail';
import type { FormationContent } from '@/hooks/useFormations';

interface LessonPlaylistProps {
  lessons: FormationContent[];
  currentId?: string;
  courseThumbnail?: string | null;
  completedCount: number;
  percent: number;
  onSelect: (lesson: FormationContent) => void;
  className?: string;
}

const TYPE_LABEL: Record<string, [string, string]> = {
  video: ['فيديو', 'Video'],
  pdf: ['ملف PDF', 'PDF'],
  text: ['نص', 'Reading'],
  quiz: ['اختبار', 'Quiz'],
};

/** YouTube-style course playlist: thumbnail, title, duration and state of every lesson. */
export function LessonPlaylist({ lessons, currentId, courseThumbnail, completedCount, percent, onSelect, className }: LessonPlaylistProps) {
  return (
    <section className={cn('rounded-2xl border border-border bg-card shadow-xs', className)} aria-label={tr('قائمة دروس الدورة', 'Course playlist')}>
      <header className="space-y-2.5 border-b border-border p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black text-foreground">{tr('قائمة الدروس', 'Course Playlist')}</h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {tr(`${completedCount} من ${lessons.length} مكتمل`, `${completedCount} of ${lessons.length} completed`)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={percent} className="h-2 flex-1" />
          <span className="w-10 text-end text-xs font-black text-foreground">{percent}%</span>
        </div>
      </header>

      <ol className="max-h-none space-y-1.5 p-2 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isCurrent = lesson.id === currentId;
          const [typeAr, typeEn] = TYPE_LABEL[lesson.content_type] || TYPE_LABEL.video;
          return (
            <li key={lesson.id}>
              <button
                type="button"
                disabled={lesson.locked}
                onClick={() => onSelect(lesson)}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors',
                  isCurrent ? 'bg-primary/10 ring-1 ring-primary/40' : 'hover:bg-muted',
                  lesson.locked && 'cursor-not-allowed opacity-70 hover:bg-transparent'
                )}
              >
                <LessonThumbnail lesson={lesson} index={index} courseThumbnail={courseThumbnail} isCurrent={isCurrent} className="w-32 sm:w-36" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className={cn('line-clamp-2 text-sm font-bold leading-snug', isCurrent ? 'text-primary' : 'text-foreground')}>
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{tr(typeAr, typeEn)}</p>
                  {isCurrent ? (
                    <span className="inline-flex rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      {tr('قيد المشاهدة', 'Now Playing')}
                    </span>
                  ) : lesson.locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      <Lock className="h-3 w-3" /> {tr('مقفل', 'Locked')}
                    </span>
                  ) : lesson.completed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" /> {tr('مكتمل', 'Completed')}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
