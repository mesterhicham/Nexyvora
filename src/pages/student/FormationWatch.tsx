import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink,
  FileText, HelpCircle, Layers, Loader2, Lock, Paperclip, Type,
} from 'lucide-react';
import { toast } from 'sonner';
import { tr } from '@/utils/tr';
import { cn } from '@/lib/utils';
import { safeUrl } from '@/lib/secureFiles';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SecureLink } from '@/components/common/SecureFile';
import { RestrictedVideoPlayer } from '@/components/formation/RestrictedVideoPlayer';
import { LessonPlaylist } from '@/components/formation/LessonPlaylist';
import { CourseProgressCard } from '@/components/formation/CourseProgressCard';
import { FormationCertificate } from '@/components/formation/FormationCertificate';
import { useStudentEnrollments, useClaimCertificate, FormationContent } from '@/hooks/useFormations';
import { useLessonSequence } from '@/hooks/useLessonSequence';
import { useAuth } from '@/contexts/AuthContext';
import { generateDiplomaPdf } from '@/utils/generateDiplomaPdf';

/**
 * Academy watch page (YouTube-style): player + lesson details on the left, playlist on the right.
 * Access, lesson locks and completion are decided by the server; this page only renders them.
 */
export default function FormationWatch() {
  const { enrollmentId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();

  const { data: enrollments, isLoading: enrollmentsLoading } = useStudentEnrollments();
  const enrollment = useMemo(
    () => enrollments?.find((e) => e.id === enrollmentId && e.payment_status === 'approved'),
    [enrollments, enrollmentId]
  );

  const seq = useLessonSequence(enrollment?.formation_id, enrollment?.id, searchParams.get('lesson'));
  const lesson = seq.current;

  // Pin the opened lesson in the URL so completing it never jumps to another lesson (and refresh keeps it)
  useEffect(() => {
    if (lesson && searchParams.get('lesson') !== lesson.id) {
      setSearchParams({ lesson: lesson.id }, { replace: true });
    }
  }, [lesson, searchParams, setSearchParams]);

  const [tab, setTab] = useState<'description' | 'resources'>('description');
  const [showCertificate, setShowCertificate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const claim = useClaimCertificate();

  const goTo = (target?: FormationContent) => {
    if (!target || target.locked) return;
    setSearchParams({ lesson: target.id });
    setTab('description');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = async (target: FormationContent, watched = 0) => {
    try {
      await seq.completeLesson(target.id, Math.max(watched, target.duration_seconds || 0));
      toast.success(seq.next
        ? tr('أحسنت! تم إكمال الدرس وفتح الدرس التالي.', 'Well done! Lesson completed and the next one is unlocked.')
        : tr('أحسنت! أكملت آخر درس في الدورة.', 'Well done! You completed the last lesson.'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || tr('تعذر حفظ إكمال الدرس', 'Could not save lesson completion'));
    }
  };

  const handleClaim = async () => {
    if (!enrollment) return;
    try {
      await claim.mutateAsync(enrollment.id);
      setShowCertificate(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || tr('الشهادة غير متاحة بعد', 'Certificate not available yet'));
    }
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current || !enrollment) return;
    setGenerating(true);
    try {
      await generateDiplomaPdf(certificateRef.current, `certificate-${enrollment.id.slice(0, 8)}.pdf`);
      toast.success(tr('تم تنزيل الشهادة بنجاح!', 'Certificate downloaded successfully!'));
    } catch {
      toast.error(tr('فشل إنشاء الشهادة', 'Failed to generate certificate'));
    } finally {
      setGenerating(false);
    }
  };

  // Loading and "no access" states
  if (enrollmentsLoading || (enrollment && seq.loading)) {
    return (
      <DashboardLayout role="student">
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-semibold">{tr('جاري تحميل الدورة...', 'Loading course...')}</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!enrollment || !lesson) {
    return (
      <DashboardLayout role="student">
        <div className="mx-auto max-w-md space-y-4 py-24 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="font-bold text-foreground">
            {enrollment
              ? tr('لا توجد دروس في هذه الدورة بعد.', 'This course has no lessons yet.')
              : tr('هذه الدورة غير متاحة في باقتك الحالية.', 'This course is not included in your current package.')}
          </p>
          <Button variant="outline" onClick={() => navigate('/student/formations')}>
            {tr('العودة إلى الدورات', 'Back to courses')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const index = seq.currentIndex;
  const packageLabel = enrollment.package_name
    ? `${isRtl ? enrollment.package_name_ar || enrollment.package_name : enrollment.package_name}${enrollment.package_level ? ` · ${tr('المستوى', 'Level')} ${enrollment.package_level}` : ''}`
    : null;
  const fileHref = safeUrl(lesson.file_url);
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout role="student">
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs sm:text-sm" aria-label="Breadcrumb">
          <Link to="/student/formations" className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground hover:text-foreground">
            {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {tr('الدورات', 'Courses')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground">
            <Layers className="h-4 w-4 shrink-0" />
            <span className="truncate">{enrollment.formation_title}</span>
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="truncate font-bold text-primary">
            {tr(`الدرس ${index + 1}`, `Lesson ${index + 1}`)}: {lesson.title}
          </span>
        </nav>

        {/* Player + details on the left, playlist on the right (in both reading directions) */}
        <div dir="ltr" className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div dir={isRtl ? 'rtl' : 'ltr'} className="-mx-4 min-w-0 flex-1 space-y-4 sm:mx-0">
            {/* Viewer */}
            <div className="overflow-hidden bg-black sm:rounded-2xl">
              {lesson.content_type === 'video' && fileHref ? (
                <RestrictedVideoPlayer
                  key={lesson.id}
                  src={fileHref}
                  title={lesson.title}
                  duration={lesson.duration_seconds || undefined}
                  initialProgress={lesson.watched_seconds || 0}
                  alreadyCompleted={!!lesson.completed}
                  onProgress={(s) => seq.saveProgress(lesson.id, s)}
                  onComplete={(s) => handleComplete(lesson, s)}
                />
              ) : (
                <ReadingViewer lesson={lesson} fileHref={fileHref} saving={seq.isSaving} onMarkRead={() => handleComplete(lesson)} />
              )}
            </div>

            {/* Lesson details */}
            <div className="space-y-3 px-4 sm:px-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-black leading-tight text-foreground sm:text-2xl">{lesson.title}</h2>
                {lesson.completed && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> {tr('مكتمل', 'Completed')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                  {tr(`الدرس ${index + 1} من ${seq.total}`, `Lesson ${index + 1} of ${seq.total}`)}
                </Badge>
                {packageLabel && <Badge className="rounded-full bg-primary text-primary-foreground">{packageLabel}</Badge>}
                <span className="text-muted-foreground">{enrollment.formation_title}</span>
              </div>

              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex gap-6" role="tablist">
                  {([
                    ['description', tr('الوصف', 'Description'), BookOpen],
                    ['resources', `${tr('الموارد', 'Resources')} (${lesson.resources?.length || 0})`, Paperclip],
                  ] as const).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={tab === key}
                      onClick={() => setTab(key)}
                      className={cn(
                        '-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-bold transition-colors',
                        tab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
              {tab === 'description' ? (
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {lesson.description || tr('لا يوجد وصف لهذا الدرس.', 'No description for this lesson.')}
                </p>
              ) : lesson.resources && lesson.resources.length > 0 ? (
                <ul className="space-y-2">
                  {lesson.resources.map((r) => (
                    <li key={r.url}>
                      <SecureLink href={r.url} target="_blank" className="flex items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm font-semibold hover:bg-muted">
                        <span className="flex min-w-0 items-center gap-2"><Paperclip className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{r.title}</span></span>
                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </SecureLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{tr('لا توجد موارد لهذا الدرس.', 'No resources for this lesson.')}</p>
              )}

              {/* Previous / next */}
              <div className="grid grid-cols-2 items-center gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_auto_1fr]">
                <button
                  type="button"
                  disabled={!seq.canGoPrevious}
                  onClick={() => goTo(seq.previous)}
                  className="flex items-center gap-2 rounded-xl border border-border p-3 text-start transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <PrevIcon className="h-5 w-5 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{tr('الدرس السابق', 'Previous Lesson')}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {seq.previous ? seq.previous.title : tr('غير متاح (أول درس)', 'Not available (first lesson)')}
                    </span>
                  </span>
                </button>
                <span className="hidden text-center text-sm font-semibold text-muted-foreground sm:block">
                  {tr(`الدرس ${index + 1} من ${seq.total}`, `Lesson ${index + 1} of ${seq.total}`)}
                </span>
                <button
                  type="button"
                  disabled={!seq.canGoNext}
                  onClick={() => goTo(seq.next)}
                  className="flex items-center justify-end gap-2 rounded-xl border border-border p-3 text-end transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{tr('الدرس التالي', 'Next Lesson')}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {!seq.next
                        ? tr('هذا آخر درس', 'This is the last lesson')
                        : seq.next.locked
                          ? tr('مقفل (أكمل هذا الدرس أولاً)', 'Locked (complete this lesson first)')
                          : seq.next.title}
                    </span>
                  </span>
                  {seq.next?.locked ? <Lock className="h-5 w-5 shrink-0" /> : <NextIcon className="h-5 w-5 shrink-0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Playlist + certificate */}
          <aside dir={isRtl ? 'rtl' : 'ltr'} className="w-full shrink-0 space-y-4 lg:sticky lg:top-4 lg:w-[400px]">
            <LessonPlaylist
              lessons={seq.lessons}
              currentId={lesson.id}
              courseThumbnail={enrollment.thumbnail_url}
              completedCount={seq.completedCount}
              percent={seq.percent}
              onSelect={goTo}
            />
            <CourseProgressCard isCompleted={seq.isCourseCompleted} remaining={seq.remaining} claiming={claim.isPending} onClaim={handleClaim} />
          </aside>
        </div>
      </div>

      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tr('شهادة إتمام الدورة', 'Course Completion Certificate')}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center overflow-hidden py-4">
            <div className="origin-top scale-[0.6] transform">
              <FormationCertificate
                ref={certificateRef}
                studentName={user?.full_name || user?.email?.split('@')[0] || 'Student'}
                formationTitle={enrollment.formation_title || 'Formation'}
                completionDate={new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                certificateId={enrollment.id.slice(0, 12).toUpperCase()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertificate(false)}>{tr('إغلاق', 'Close')}</Button>
            <Button onClick={downloadCertificate} disabled={generating} className="gap-2">
              <Download className="h-4 w-4" />
              {generating ? tr('جاري الإنشاء...', 'Generating...') : tr('تحميل PDF', 'Download PDF')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

/** PDF, text and quiz lessons: open the material, then confirm with "Mark as read". */
function ReadingViewer({ lesson, fileHref, saving, onMarkRead }: {
  lesson: FormationContent;
  fileHref?: string;
  saving: boolean;
  onMarkRead: () => void;
}) {
  const Icon = lesson.content_type === 'pdf' ? FileText : lesson.content_type === 'quiz' ? HelpCircle : Type;
  return (
    <div className="flex aspect-video flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-blue-950 to-violet-950 p-6 text-center text-white">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <Icon className="h-8 w-8" />
      </span>
      <p className="max-w-md text-base font-bold sm:text-lg">{lesson.title}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {fileHref && (
          <Button asChild variant="secondary" className="gap-2">
            <a href={fileHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              {lesson.content_type === 'pdf' ? tr('فتح ملف PDF', 'Open PDF') : tr('فتح المحتوى', 'Open content')}
            </a>
          </Button>
        )}
        {lesson.completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> {tr('تمّت القراءة', 'Marked as read')}
          </span>
        ) : (
          <Button onClick={onMarkRead} disabled={saving} className="gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {tr('تمّت القراءة', 'Mark as read')}
          </Button>
        )}
      </div>
      {!lesson.completed && (
        <p className="max-w-sm text-[11px] text-white/60">
          {tr('اضغط "تمّت القراءة" بعد الانتهاء لفتح الدرس التالي.', 'Press "Mark as read" when you finish to unlock the next lesson.')}
        </p>
      )}
    </div>
  );
}
