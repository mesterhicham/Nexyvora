import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useStudentModules, useStudentLessons } from '@/hooks/useStudentData';
import { BookOpen, Clock, User, PlayCircle, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StudentCourses() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const { data: modules, isLoading: modulesLoading } = useStudentModules();
  const { data: lessons } = useStudentLessons();

  // Calculate progress for each module
  const getModuleProgress = (moduleId: string) => {
    const moduleLessons = lessons?.filter(l => l.module_id === moduleId) || [];
    if (moduleLessons.length === 0) return 0;
    const completed = moduleLessons.filter(l => l.status === 'completed').length;
    return Math.round((completed / moduleLessons.length) * 100);
  };

  // Get content counts for module
  const getModuleContentCounts = (moduleId: string) => {
    const moduleLessons = lessons?.filter(l => l.module_id === moduleId) || [];
    let videos = 0, pdfs = 0;
    moduleLessons.forEach(lesson => {
      if (lesson.content) {
        lesson.content.forEach((c: any) => {
          if (c.content_type === 'video') videos++;
          if (c.content_type === 'pdf') pdfs++;
        });
      }
    });
    return { videos, pdfs, lessonsCount: moduleLessons.length };
  };

  if (modulesLoading) {
    return (
      <DashboardLayout role="student">
        <PageHeader title={t('nav.myCourses')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.myCourses') }]} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <PageHeader title={t('nav.myCourses')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.myCourses') }]} />
      
      {!modules || modules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{isRtl ? 'لا توجد مواد متاحة حالياً' : 'No courses available currently'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => {
            const progress = getModuleProgress(m.id);
            const { videos, pdfs, lessonsCount } = getModuleContentCounts(m.id);
            const teacherName = (m as any).teacher?.full_name || (m as any).teacher?.profile?.full_name || (m as any).teacher_name || (isRtl ? 'غير محدد' : 'Unassigned');
            
            return (
              <Card 
                key={m.id} 
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(`/student/courses/${m.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{m.name}</h3>
                      <p className="text-sm text-muted-foreground">{m.code}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{teacherName}</span>
                    </div>
                    {m.hours && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{m.hours} {isRtl ? 'ساعة' : 'hours'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {videos} {isRtl ? 'فيديو' : 'videos'}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {pdfs} {isRtl ? 'ملف' : 'files'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span>{t('student.progress')}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      {lessonsCount} {isRtl ? 'درس' : 'lessons'}
                    </p>
                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    {isRtl ? 'عرض المادة' : 'View Course'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
