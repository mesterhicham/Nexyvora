import { useState, useEffect } from 'react';
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
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { packageService, adminService } from '@/services/apiService';
import { SkoolLevelShowcase } from '@/components/academy/SkoolLevelShowcase';

export default function StudentAcademy() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [myPackage, setMyPackage] = useState<any>(null);
  const [activeView, setActiveView] = useState<'showcase' | 'sections'>('showcase');
  const [adminIntroSettings, setAdminIntroSettings] = useState<{
    title?: string;
    description?: string;
    videoUrl?: string;
    author?: string;
    badge?: string;
  }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [myPkgRes, settingsRes] = await Promise.all([
        packageService.getMyPackage().catch(() => ({ currentPackage: null })),
        adminService.getSettings().catch(() => [])
      ]);

      const pkg = myPkgRes?.currentPackage || null;
      setMyPackage(pkg);

      // If user has an active level package (level >= 2: FLOW, GROW, PRIME), default to sections
      if (pkg && Number(pkg.level) >= 2) {
        setActiveView('sections');
      } else {
        // New user or only CORE membership: default to Skool Showcase
        setActiveView('showcase');
      }

      // Parse admin intro settings from platform_settings
      if (Array.isArray(settingsRes)) {
        const settingsMap: Record<string, string> = {};
        settingsRes.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });

        setAdminIntroSettings({
          title: settingsMap['academy_intro_title'],
          description: settingsMap['academy_intro_description'],
          videoUrl: settingsMap['academy_intro_video_url'],
          author: settingsMap['academy_intro_author'],
          badge: settingsMap['academy_intro_badge']
        });
      }
    } catch (err) {
      console.error('[StudentAcademy] Error loading academy data:', err);
    } finally {
      setLoading(false);
    }
  };

  const academicSections = [
    {
      id: 'formations',
      title: isRtl ? 'الدورات التكوينية (Formations)' : 'Training Courses',
      titleEn: isRtl ? 'Training Courses' : 'الدورات التكوينية',
      description: isRtl 
        ? 'استكشف واشترك في الدورات التدريبية المتاحة وتتبع تقدمك في كل دورة.' 
        : 'Explore and enroll in available training courses and track your progress.',
      icon: BookOpen,
      to: '/student/formations',
      badge: isRtl ? 'التعليم الذاتي' : 'Self-Paced',
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    },
    {
      id: 'courses',
      title: isRtl ? 'المقررات الأكاديمية' : 'Academic Courses',
      titleEn: isRtl ? 'Academic Courses' : 'المقررات الأكاديمية',
      description: isRtl 
        ? 'المقررات الدراسية التابعة لدفعتك وتخصصك الأكاديمي الحالي.' 
        : 'Curriculum courses related to your cohort and current academic track.',
      icon: GraduationCap,
      to: '/student/courses',
      badge: isRtl ? 'المنهج' : 'Curriculum',
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    },
    {
      id: 'lessons',
      title: isRtl ? 'الدروس والمحاضرات' : 'Lessons & Lectures',
      titleEn: isRtl ? 'Lessons & Lectures' : 'الدروس والمحاضرات',
      description: isRtl 
        ? 'جدول المحاضرات اليومية والمحتوى الدراسي وملفات الشرح.' 
        : 'Daily lecture schedule, educational materials, and study resources.',
      icon: FileText,
      to: '/student/lessons',
      badge: isRtl ? 'المحاضرات' : 'Lectures',
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
    },
    {
      id: 'assignments',
      title: isRtl ? 'التكليفات والواجبات' : 'Assignments & Projects',
      titleEn: isRtl ? 'Assignments & Projects' : 'التكليفات والواجبات',
      description: isRtl 
        ? 'تسليم الواجبات والمشاريع المطلوبة ومتابعة تصحيح الأساتذة.' 
        : 'Submit homework and projects, and track instructor grading.',
      icon: ClipboardList,
      to: '/student/assignments',
      badge: isRtl ? 'التقييم' : 'Assessment',
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    },
    {
      id: 'attendance',
      title: isRtl ? 'الحضور والغياب' : 'Attendance Record',
      titleEn: isRtl ? 'Attendance Record' : 'الحضور والغياب',
      description: isRtl 
        ? 'سجل حضور الحصص المباشرة ونسب الالتزام بالحضور.' 
        : 'Live session attendance records and commitment percentage.',
      icon: CheckSquare,
      to: '/student/attendance',
      badge: isRtl ? 'الانضباط' : 'Discipline',
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800'
    },
    {
      id: 'grades',
      title: isRtl ? 'الدرجات والنتائج' : 'Grades & Results',
      titleEn: isRtl ? 'Grades & Results' : 'الدرجات والنتائج',
      description: isRtl 
        ? 'كشف النقاط لجميع الاختبارات والمحاولات والتقييمات الفصلية.' 
        : 'Transcripts and scores for all quizzes, exams, and assessments.',
      icon: BarChart3,
      to: '/student/grades',
      badge: isRtl ? 'النتائج' : 'Scores',
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    },
    {
      id: 'meetings',
      title: isRtl ? 'الاجتماعات المباشرة (Zoom)' : 'Live Zoom Meetings',
      titleEn: isRtl ? 'Live Classes' : 'اللقاءات المباشرة',
      description: isRtl 
        ? 'انضم إلى الحصص المباشرة والورش التفاعلية مع الأساتذة.' 
        : 'Join interactive live sessions, workshops, and coaching calls.',
      icon: Video,
      to: '/student/meetings',
      badge: isRtl ? 'بث حي' : 'Live Stream',
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
    },
    {
      id: 'diploma',
      title: isRtl ? 'الشهادات والدبلومات' : 'Diplomas & Certificates',
      titleEn: isRtl ? 'Diplomas & Certifications' : 'الشهادات المعتمدة',
      description: isRtl 
        ? 'استعراض وتحميل شهادات التخرج الرسمية الموثقة برمز QR.' 
        : 'View and download official QR-verified completion certificates.',
      icon: Award,
      to: '/student/diploma',
      badge: isRtl ? 'الاعتماد' : 'Certification',
      color: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    }
  ];

  const hasActiveLevelPackage = myPackage && Number(myPackage.level) >= 2;

  // Compute expiration date formatting
  const expiresAtFormatted = myPackage?.expires_at 
    ? new Date(myPackage.expires_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <DashboardLayout role="student">
      <div className="space-y-6 pb-12">
        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-semibold">{isRtl ? 'جاري تحميل بيانات الأكاديمية والمستويات...' : 'Loading academy data & levels...'}</span>
          </div>
        ) : (
          <>
            {/* View Switcher Bar (Always Available) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {isRtl ? 'أكاديمية Nexyvora التعليمية' : 'Nexyvora Academy'}
                    </span>
                    {hasActiveLevelPackage ? (
                      <Badge className="bg-emerald-500 text-white text-[11px] font-bold">
                        {(isRtl ? (myPackage.package_name_ar || myPackage.package_name) : (myPackage.package_name || myPackage.package_name_ar))} ({isRtl ? 'المستوى' : 'Level'} {Number(myPackage.level) - 1})
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                        {myPackage ? (isRtl ? 'عضوية CORE — اختر باقتك' : 'CORE Membership — Choose package') : (isRtl ? 'عضو مسجل — بانتظار تفعيل الباقة' : 'Registered Member — Pending activation')}
                      </Badge>
                    )}
                  </div>
                  {expiresAtFormatted && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-emerald-500" />
                      {isRtl ? 'الاشتراك السنوي نشط حتى:' : 'Annual subscription active until:'} <strong className="text-slate-600 dark:text-slate-300">{expiresAtFormatted}</strong> ({isRtl ? 'تجديد تلقائي' : 'auto-renew'})
                    </span>
                  )}
                </div>
              </div>

              {/* View Toggle Tabs */}
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setActiveView('showcase')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeView === 'showcase'
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{isRtl ? 'معرض المستويات (Skool Showcase)' : 'Levels Showcase (Skool)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveView('sections')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeView === 'sections'
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Layers className="h-4 w-4 text-primary" />
                  <span>{isRtl ? 'الأقسام والمقررات الدراسية' : 'Curriculum & Sections'}</span>
                  {hasActiveLevelPackage && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              </div>
            </div>

            {/* View 1: Skool Style 4-Post Showcase */}
            {activeView === 'showcase' && (
              <SkoolLevelShowcase
                currentPackage={myPackage}
                onPackagePurchased={loadData}
                adminIntroSettings={adminIntroSettings}
              />
            )}

            {/* View 2: Traditional Academic Sections Grid */}
            {activeView === 'sections' && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                {/* Notice Banner if user doesn't have an active paid level */}
                {!hasActiveLevelPackage && (
                  <div className="p-4 md:p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-amber-500 text-white shrink-0 shadow-md shadow-amber-500/30">
                        <Zap className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm md:text-base text-amber-900 dark:text-amber-200">
                          {isRtl ? 'لم يتم تفعيل باقة دراسية بعد في حسابك' : 'No study package activated on your account yet'}
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          {isRtl 
                            ? 'اختر أحد مستويات الأكاديمية (FLOW أو GROW أو PRIME) للاشتراك السنوي وفتح كافة المقررات والدروس والشهادات فوراً.' 
                            : 'Choose one of the Academy tiers (FLOW, GROW, PRIME) for annual subscription and instant access.'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setActiveView('showcase')}
                      className="w-full md:w-auto text-xs font-bold rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/25 shrink-0"
                    >
                      <Sparkles className="h-4 w-4 ml-1.5" />
                      {isRtl ? 'استعراض معرض المستويات بنمط Skool' : 'Explore Skool Levels Showcase'}
                    </Button>
                  </div>
                )}

                {/* Academic Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {academicSections.map((sec) => {
                    const Icon = sec.icon;
                    return (
                      <Link key={sec.id} to={sec.to} className="group focus:outline-hidden">
                        <Card className="h-full border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-200 hover:shadow-md hover:-translate-y-1 bg-white dark:bg-slate-900 rounded-2xl">
                          <CardHeader className="p-5 pb-3">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className={`p-3 rounded-xl border ${sec.color}`}>
                                <Icon className="h-6 w-6" />
                              </div>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {sec.badge}
                              </span>
                            </div>
                            <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
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
                              <span>{isRtl ? 'دخول القسم' : 'Enter Section'}</span>
                              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
