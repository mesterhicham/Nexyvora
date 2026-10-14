import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  BookOpen, 
  Layers, 
  Users, 
  ClipboardCheck, 
  Award, 
  Video, 
  FileCheck2, 
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarCheck
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminAcademy() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const ArrowIcon = isRtl ? ChevronLeft : ChevronRight;

  const sections = [
    {
      title: isRtl ? 'إعدادات وفيديوهات الأكاديمية والباقات' : 'Academy Showcase & Promo Videos',
      subtitle: isRtl ? 'Promo Videos & Banners' : 'Intro & Package Showcases',
      description: isRtl 
        ? 'تغيير وتخصيص الفيديوهات التعريفية، صور الأغلفة، وعناوين باقات الأكاديمية (FLOW, GROW, PRIME).' 
        : 'Customize introductory videos, banner images, and descriptions for academy packages (FLOW, GROW, PRIME).',
      icon: Video,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/admin/platform-settings?tab=academy',
    },
    {
      title: isRtl ? 'إدارة الأساتذة والمشرفين' : 'Teacher & Instructor Management',
      subtitle: isRtl ? 'Teachers / Faculty' : 'Teacher Accounts & Permissions',
      description: isRtl 
        ? 'إنشاء حسابات الأساتذة وتحديد تخصصاتهم، بياناتهم، ومتابعة نشاطهم وصلاحياتهم.' 
        : 'Create teacher accounts, define their specialties, contact info, and academic permissions.',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600',
      href: '/admin/teachers',
    },
    {
      title: isRtl ? 'إدارة الطلاب والمستخدمين' : 'Student & User Management',
      subtitle: isRtl ? 'Student Management' : 'Accounts & Academy Status',
      description: isRtl 
        ? 'سجلات الطلاب، الحسابات، باقات التعلم، الرتب، الأرصدة، والحالة الأكاديمية.' 
        : 'Student records, accounts, packages, ranks, balances, and academic standing.',
      icon: Users,
      color: 'bg-purple-500/10 text-purple-600',
      href: '/admin/users',
    },
    {
      title: isRtl ? 'المسارات التكوينية' : 'Training Formations',
      subtitle: isRtl ? 'Formations' : 'Curriculums & Video Lessons',
      description: isRtl 
        ? 'إدارة وتعديل وإنشاء المسارات التكوينية وإضافة المحتوى ومقاطع الفيديو.' 
        : 'Manage, edit, and create training tracks, curricula, and video content.',
      icon: GraduationCap,
      color: 'bg-primary/10 text-primary',
      href: '/admin/formations',
    },
    {
      title: isRtl ? 'المقررات والدروس' : 'Modules & Lessons',
      subtitle: isRtl ? 'Modules & Lessons' : 'Course Files & Topics',
      description: isRtl 
        ? 'تنظيم الوحدات الدراسية والدروس والملفات التعليمية والواجبات.' 
        : 'Organize study modules, lessons, course materials, and homework.',
      icon: BookOpen,
      color: 'bg-indigo-500/10 text-indigo-600',
      href: '/admin/modules',
    },
    {
      title: isRtl ? 'الأفواج والطلبة' : 'Cohorts & Classes',
      subtitle: isRtl ? 'Cohorts / Classes' : 'Group Distribution & Tutors',
      description: isRtl 
        ? 'توزيع الطلاب على المجموعات وتعيين الأساتذة المشرفين والمواعيد.' 
        : 'Distribute students across groups, assign supervisors and session schedules.',
      icon: Users,
      color: 'bg-sky-500/10 text-sky-600',
      href: '/admin/cohorts',
    },
    {
      title: isRtl ? 'سجل الحضور والغياب' : 'Attendance Records',
      subtitle: isRtl ? 'Attendance' : 'Live Session Tracking',
      description: isRtl 
        ? 'متابعة سجلات حضور الطلاب في الحصص المباشرة والورشات العملية.' 
        : 'Track student attendance across live lessons and practical workshops.',
      icon: CalendarCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      href: '/admin/attendance',
    },
    {
      title: isRtl ? 'الواجبات والتقييمات' : 'Assignments & Grades',
      subtitle: isRtl ? 'Assignments' : 'Submissions & Exam Scores',
      description: isRtl 
        ? 'متابعة تسليم واجبات ومشاريع الطلاب ودرجات الاختبارات.' 
        : 'Track assignment submissions, project deliveries, and grading metrics.',
      icon: ClipboardCheck,
      color: 'bg-amber-500/10 text-amber-600',
      href: '/admin/assignments',
    },
    {
      title: isRtl ? 'حصص زووم المباشرة' : 'Live Zoom Meetings',
      subtitle: isRtl ? 'Zoom Meetings' : 'Interactive Video Calls',
      description: isRtl 
        ? 'جدولة الحصص التفاعلية المباشرة ومشاركة روابط الاجتماعات.' 
        : 'Schedule interactive live sessions and broadcast conference meeting links.',
      icon: Video,
      color: 'bg-rose-500/10 text-rose-600',
      href: '/admin/zoom',
    },
    {
      title: isRtl ? 'اختبارات تحديد المستوى' : 'Placement Tests',
      subtitle: isRtl ? 'Placement Tests' : 'Evaluation Question Banks',
      description: isRtl 
        ? 'إدارة بنك الأسئلة وتحديد المستويات التلقائي للطلاب الجدد.' 
        : 'Manage question banks and automated diagnostic tests for new enrollees.',
      icon: FileCheck2,
      color: 'bg-purple-500/10 text-purple-600',
      href: '/admin/placement-test',
    },
    {
      title: isRtl ? 'الشهادات والديبلومات' : 'Diplomas & Certificates',
      subtitle: isRtl ? 'Diplomas' : 'Accredited Credentials',
      description: isRtl 
        ? 'إصدار واعتماد الشهادات الرسمية للطلاب المتخرجين والتحقق منها.' 
        : 'Issue, accredit, and verify official completion diplomas for graduates.',
      icon: Award,
      color: 'bg-teal-500/10 text-teal-600',
      href: '/admin/diplomas',
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
              <GraduationCap className="h-4 w-4" />
              {isRtl ? 'مركز إدارة الأكاديمية (Manage Academy)' : 'Academy Management Center'}
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {isRtl ? 'إدارة الأكاديمية والعملية التعليمية' : 'Academy & Educational Operations'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl 
                ? 'البوابة المركزية لإدارة المقررات، المسارات، الأفواج، الحضور، الحصص المباشرة والشهادات.' 
                : 'Central portal for managing courses, formations, cohorts, attendance, live sessions, and diplomas.'}
            </p>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Card 
                key={idx}
                onClick={() => navigate(sec.href)}
                className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/40 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3.5 rounded-2xl ${sec.color} transition-transform group-hover:scale-110`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ArrowIcon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {sec.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      {sec.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:underline">
                    {isRtl ? 'الدخول للقسم' : 'Enter Section'}
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
