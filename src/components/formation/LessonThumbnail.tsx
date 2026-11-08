import { useState } from 'react';
import { CheckCircle2, FileText, HelpCircle, Lock, PlayCircle, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeUrl } from '@/lib/secureFiles';
import { formatDuration } from '@/hooks/useLessonSequence';
import type { FormationContent } from '@/hooks/useFormations';

const TYPE_ICON = { video: PlayCircle, pdf: FileText, text: Type, quiz: HelpCircle } as const;

interface LessonThumbnailProps {
  lesson: FormationContent;
  index: number;
  courseThumbnail?: string | null;
  isCurrent?: boolean;
  className?: string;
}

/**
 * Lesson thumbnail: the lesson image, else the course image, else a generated Nexyvora Academy cover.
 * Overlays the duration, a lock for unavailable lessons and a check for completed ones.
 */
export function LessonThumbnail({ lesson, index, courseThumbnail, isCurrent, className }: LessonThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const src = !failed ? safeUrl(lesson.thumbnail_url) || safeUrl(courseThumbnail) : undefined;
  const Icon = TYPE_ICON[lesson.content_type] || PlayCircle;
  const duration = formatDuration(lesson.duration_seconds);

  return (
    <div className={cn('relative aspect-video overflow-hidden rounded-xl bg-slate-900 shrink-0', isCurrent && 'ring-2 ring-primary', className)}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <img src="/logo-icon.png" alt="" className="absolute left-2 top-2 h-6 w-6 object-contain opacity-90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <Icon className="h-7 w-7 opacity-90" />
            <span className="mt-1 text-[10px] font-black tracking-widest uppercase opacity-90">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      )}

      {lesson.locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 backdrop-blur-[1px]">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white">
            <Lock className="h-4 w-4" />
          </span>
        </div>
      )}
      {!lesson.locked && lesson.completed && (
        <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      )}
      {duration && (
        <span dir="ltr" className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
          {duration}
        </span>
      )}
    </div>
  );
}
