import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useStudentModules, useStudentLessons, useStudentRecord } from '@/hooks/useStudentData';
import { academicService } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, User, PlayCircle, FileText, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentCourseDetail() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const params = useParams();
  const activeModuleId = params.moduleId || params.courseId;
  const navigate = useNavigate();
  
  const { data: student, isLoading: studentLoading } = useStudentRecord();
  const { data: modules, isLoading: modulesLoading } = useStudentModules();
  const { data: lessons, isLoading: lessonsLoading } = useStudentLessons();

  // Fetch module directly as fallback or primary if opened directly
  const { data: directModule, isLoading: directModuleLoading } = useQuery({
    queryKey: ['module-detail', activeModuleId],
    queryFn: () => academicService.getModule(activeModuleId!),
    enabled: !!activeModuleId,
  });
  
  const module = modules?.find((m: any) => m.id === activeModuleId) || directModule;
  const moduleLessons = lessons?.filter((l: any) => l.module_id === activeModuleId) || [];
  
  // Calculate progress based on completed lessons
  const completedLessons = moduleLessons.filter((l: any) => l.status === 'completed').length;
  const progressPercent = moduleLessons.length > 0 
    ? Math.round((completedLessons / moduleLessons.length) * 100) 
    : 0;

  const isInitialLoading = !module && (modulesLoading || directModuleLoading || studentLoading || lessonsLoading);

  if (isInitialLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!module) {
    return (
      <DashboardLayout role="student">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{tr("المادة غير موجودة", "Course / Module not found")}</p>
          <Button className="mt-4" onClick={() => navigate('/student/courses')}>
            {tr("العودة للمواد", "Back to Courses")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const teacherName = (module as any)?.teacher?.full_name || (module as any)?.teacher?.profile?.full_name || (module as any)?.teacher_name || (tr("غير محدد", "Unassigned"));

  return (
    <DashboardLayout role="student">
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/student/courses')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
          {tr("العودة للمواد", "Back to Courses")}
        </Button>

        {/* Module Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-4 bg-primary/10 rounded-xl">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{module.name}</h1>
                  <p className="text-muted-foreground">{module.code}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {teacherName}
                    </span>
                    {module.hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {module.hours} {tr("ساعة", "hours")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full md:w-48">
                <div className="flex justify-between text-sm mb-2">
                  <span>{tr("التقدم", "Progress")}</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lessons */}
        <Tabs defaultValue="lessons">
          <TabsList>
            <TabsTrigger value="lessons">{tr("الدروس", "Lessons")} ({moduleLessons.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lessons" className="space-y-4 mt-4">
            {moduleLessons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{tr("لا توجد دروس متاحة حالياً", "No lessons available currently")}</p>
                </CardContent>
              </Card>
            ) : (
              moduleLessons.map((lesson, index) => (
                <Card 
                  key={lesson.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {lesson.scheduled_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {(() => {
                                  try {
                                    return format(new Date(lesson.scheduled_date), 'PPP', isRtl ? { locale: ar } : undefined);
                                  } catch {
                                    return String(lesson.scheduled_date);
                                  }
                                })()}
                              </span>
                            )}
                            {lesson.duration_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {lesson.duration_minutes} {tr("دقيقة", "min")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {lesson.content && lesson.content.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <PlayCircle className="h-4 w-4" />
                              {lesson.content.filter((c: any) => c.content_type === 'video').length}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {lesson.content.filter((c: any) => c.content_type === 'pdf').length}
                            </span>
                          </div>
                        )}
                        <Badge variant={lesson.status === 'completed' ? 'default' : 'secondary'}>
                          {lesson.status === 'completed' ? (tr("مكتمل", "Completed")) : 
                           lesson.status === 'in_progress' ? (tr("جاري", "In Progress")) : (tr("مجدول", "Scheduled"))}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
