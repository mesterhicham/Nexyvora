import { useState, useEffect, useMemo } from 'react';
import { tr } from '@/utils/tr';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Video, 
  FileText, 
  ClipboardList, 
  CheckSquare, 
  Award, 
  BarChart3, 
  GraduationCap,
  ArrowRight,
  Sparkles,
  Layers,
  Zap,
  Clock,
  ShieldCheck,
  Loader2,
  Play,
  CheckCircle,
  Package,
  FolderOpen,
  ArrowUpRight
} from 'lucide-react';
import { packageService } from '@/services/apiService';
import { usePublishedFormations, useStudentEnrollments } from '@/hooks/useFormations';
import { AcademyLockedGate } from '@/components/academy/AcademyLockedGate';

export default function StudentAcademy() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [myPackage, setMyPackage] = useState<any>(null);
  const [pendingPackage, setPendingPackage] = useState<any>(null);

  const { data: allFormations, isLoading: formationsLoading } = usePublishedFormations();
  const { data: enrollments } = useStudentEnrollments();

  useEffect(() => {
    loadPackageData();
  }, []);

  const loadPackageData = async () => {
    try {
      setLoading(true);
      const myPkgRes = await packageService.getMyPackage().catch(() => ({ currentPackage: null, pendingPackage: null }));
      setMyPackage(myPkgRes?.currentPackage || null);
      setPendingPackage(myPkgRes?.pendingPackage || null);
    } catch (err) {
      console.error('[StudentAcademy] Error loading package data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if member has an active package of level >= 2 (FLOW, GROW, PRIME)
  const hasActiveLevelPackage = myPackage && myPackage.status === 'active' && Number(myPackage.level) >= 2;

  // Compute expiration date formatting
  const expiresAtFormatted = myPackage?.expires_at 
    ? new Date(myPackage.expires_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // Filter formations relevant to student's package level
  const userLevel = Number(myPackage?.level) || 0;
  const eligibleFormations = useMemo(() => {
    if (!allFormations) return [];
    // Formations with package_id <= userLevel or without package
    return allFormations.filter(f => {
      if (!f.package_level) return true;
      return Number(f.package_level) <= userLevel;
    });
  }, [allFormations, userLevel]);

  // Remaining Academic Sections (excluding Formations since it has its own dedicated spotlight)
  const otherAcademicSections = [
    {
      id: 'courses',
      title: tr("المقررات الأكاديمية", "Academic Courses"),
      titleEn: isRtl ? 'Academic Courses' : 'المقررات الأكاديمية',
      description: tr("المقررات الدراسية التابعة لدفعتك وتخصصك الأكاديمي الحالي.", "Curriculum courses related to your cohort and current academic track."),
      icon: GraduationCap,
      to: '/student/courses',
      badge: tr("المنهج الأكاديمي", "Curriculum"),
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'lessons',
      title: tr("الدروس والمحاضرات", "Lessons & Lectures"),
      titleEn: isRtl ? 'Lessons & Lectures' : 'الدروس والمحاضرات',
      description: tr("جدول المحاضرات اليومية والمحتوى الدراسي وملفات الشرح.", "Daily lecture schedule, educational materials, and study resources."),
      icon: FileText,
      to: '/student/lessons',
      badge: tr("المحاضرات", "Lectures"),
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'assignments',
      title: tr("التكليفات والواجبات", "Assignments & Projects"),
      titleEn: isRtl ? 'Assignments & Projects' : 'التكليفات والواجبات',
      description: tr("تسليم الواجبات والمشاريع المطلوبة ومتابعة تصحيح الأساتذة.", "Submit homework and projects, and track instructor grading."),
      icon: ClipboardList,
      to: '/student/assignments',
      badge: tr("التقييم", "Assessment"),
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'attendance',
      title: tr("الحضور والغياب", "Attendance Record"),
      titleEn: isRtl ? 'Attendance Record' : 'الحضور والغياب',
      description: tr("سجل حضور الحصص المباشرة ونسب الالتزام بالحضور.", "Live session attendance records and commitment percentage."),
      icon: CheckSquare,
      to: '/student/attendance',
      badge: tr("الانضباط", "Discipline"),
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
    },
    {
      id: 'grades',
      title: tr("الدرجات والنتائج", "Grades & Results"),
      titleEn: isRtl ? 'Grades & Results' : 'الدرجات والنتائج',
      description: tr("كشف النقاط لجميع الاختبارات والمحاولات والتقييمات الفصلية.", "Transcripts and scores for all quizzes, exams, and assessments."),
      icon: BarChart3,
      to: '/student/grades',
      badge: tr("النتائج", "Scores"),
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'meetings',
      title: tr("الاجتماعات المباشرة (Zoom)", "Live Zoom Meetings"),
      titleEn: isRtl ? 'Live Classes' : 'اللقاءات المباشرة',
      description: tr("انضم إلى الحصص المباشرة والورش التفاعلية مع الأساتذة.", "Join interactive live sessions, workshops, and coaching calls."),
      icon: Video,
      to: '/student/meetings',
      badge: tr("بث حي", "Live Stream"),
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    },
    {
      id: 'diploma',
      title: tr("الشهادات والدبلومات", "Diplomas & Certificates"),
      titleEn: isRtl ? 'Diplomas & Certifications' : 'الشهادات المعتمدة',
      description: tr("استعراض وتحميل شهادات التخرج الرسمية الموثقة برمز QR.", "View and download official QR-verified completion certificates."),
      icon: Award,
      to: '/student/diploma',
      badge: tr("الاعتماد", "Certification"),
      color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    }
  ];

  return (
    <DashboardLayout role="student">
      <div className="space-y-8 pb-16">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-semibold">{tr("جاري التحقق من تفعيل الباقة وبيانات الأكاديمية...", "Verifying package & loading academy...")}</span>
          </div>
        ) : !hasActiveLevelPackage ? (
          /* LOCKED GATE: When student has not purchased / activated a study package */
          <AcademyLockedGate 
            pendingPackage={pendingPackage} 
            userPackage={myPackage} 
            reason={myPackage ? 'upgrade_required' : 'no_package'}
          />
        ) : (
          /* UNLOCKED ACADEMY VIEW: Active Package Holders */
          <>
            {/* Top Header & Package Active Status Banner */}
            <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-primary/95 to-slate-900 text-white shadow-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md text-amber-300">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                        {tr("أكاديمية Nexyvora التعليمية", "Nexyvora Academy")}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300">
                        {tr("بوابتك الشاملة للتكوينات المتقدمة، المقررات، والشهادات المعتمدة", "Your portal for professional formations, curriculum, and verified certificates")}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-xs font-bold gap-1.5 shadow-sm">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{isRtl ? (myPackage.package_name_ar || myPackage.package_name) : (myPackage.package_name || myPackage.package_name_ar)}</span>
                      <span>({tr("المستوى", "Level")} {Number(myPackage.level) - 1})</span>
                    </Badge>

                    {expiresAtFormatted && (
                      <span className="text-[11px] text-slate-300/90 flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl backdrop-blur-xs font-medium">
                        <Clock className="h-3 w-3 text-emerald-300" />
                        <span>{tr("نشط حتى:", "Active until:")} {expiresAtFormatted}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                  <Link to="/student/formations">
                    <Button className="w-full sm:w-auto rounded-2xl font-bold bg-white text-slate-900 hover:bg-slate-100 gap-2 shadow-lg shadow-black/20 text-xs px-5 py-5">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{tr("الدورات التكوينية (Formations)", "Browse Formations")}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </Button>
                  </Link>

                  <Link to="/student/my-package">
                    <Button variant="outline" className="w-full sm:w-auto rounded-2xl font-bold border-white/20 text-white hover:bg-white/10 gap-2 text-xs px-4 py-5">
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>{tr("تفاصيل باقتي", "My Package")}</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* SECTION 1: الدورات التكوينية (FORMATIONS) — Spotlight & Courses */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/80 dark:border-slate-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {tr("الدورات التكوينية (Formations)", "Training Formations")}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tr("التكوينات المتاحة لك وفق باقتك الحالية مع إمكانية متابعة المشاهدة واستلام الشهادات.", "Courses unlocked by your current package with progress tracking and certificates.")}
                  </p>
                </div>

                <Link to="/student/formations" className="shrink-0">
                  <Button variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5 border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                    <span>{tr("عرض وإدارة كافة التكوينات", "View All Formations")}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Formations Cards Grid */}
              {formationsLoading ? (
                <div className="p-8 text-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-xs">{tr("جاري تحميل التكوينات المتاحة...", "Loading available formations...")}</p>
                </div>
              ) : eligibleFormations.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <BookOpen className="h-10 w-10 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {tr("لا توجد تكوينات منشورة حالياً لهذه الباقة", "No formations currently published for this tier")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {tr("يقوم فريق الأكاديمية برفع وتحديث المحاضرات والتكوينات الجديدة باستمرار.", "New courses and updates are added regularly by the academy team.")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {eligibleFormations.slice(0, 4).map((formation) => {
                    const isEnrolled = enrollments?.some(e => e.formation_id === formation.id && e.payment_status === 'approved');
                    return (
                      <Card key={formation.id} className="overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-primary/40 transition-all duration-200 hover:shadow-md flex flex-col bg-white dark:bg-slate-900 rounded-2xl group">
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          {formation.thumbnail_url ? (
                            <img 
                              src={formation.thumbnail_url} 
                              alt={formation.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <BookOpen className="h-8 w-8 opacity-40" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-emerald-600/90 text-white backdrop-blur-xs text-[10px] font-bold px-2 py-0.5 shadow-xs">
                              {formation.package_name_ar || formation.package_name || tr("مضمّن في الباقة", "Included in Package")}
                            </Badge>
                          </div>
                        </div>

                        {/* Card Content */}
                        <CardHeader className="p-4 pb-2 flex-1">
                          <CardTitle className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {formation.title}
                          </CardTitle>
                          {formation.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                              {formation.description}
                            </p>
                          )}
                        </CardHeader>

                        <CardContent className="p-4 pt-0">
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>{isEnrolled ? tr("أنت مسجل بالدورة", "Enrolled") : tr("متاح للدخول فوراً", "Available Now")}</span>
                            </span>

                            <Link to="/student/formations">
                              <Button size="sm" className="h-8 rounded-xl font-bold text-xs gap-1.5 px-3">
                                <Play className="h-3 w-3 rtl:rotate-180" />
                                <span>{isEnrolled ? tr("متابعة", "Watch") : tr("دخول الدورة", "Start")}</span>
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: باقي أقسام الأكاديمية (REMAINING ACADEMIC SECTIONS) */}
            <div className="space-y-4 pt-4">
              <div className="space-y-0.5 pb-1 border-b border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {tr("باقي صفحات وأقسام الأكاديمية", "Curriculum & Academic Sections")}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {tr("تصفح المقررات الدراسية، جدول المحاضرات، التكليفات، الحضور والغياب، شهادات التخرج، والاجتماعات المباشرة.", "Explore academic curriculum, lecture schedules, assignments, attendance, diplomas, and live meetings.")}
                </p>
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {otherAcademicSections.map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <Link key={sec.id} to={sec.to} className="group focus:outline-hidden">
                      <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-white dark:bg-slate-900 rounded-2xl flex flex-col justify-between">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className={`p-3 rounded-xl border ${sec.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {sec.badge}
                            </span>
                          </div>
                          <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
                            {sec.title}
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-400">
                            {sec.titleEn}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                            {sec.description}
                          </p>
                          <div className="flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                            <span>{tr("دخول القسم", "Enter Section")}</span>
                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
