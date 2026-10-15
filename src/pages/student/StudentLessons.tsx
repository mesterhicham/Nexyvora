import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useStudentLessons, useLessonProgress } from '@/hooks/useStudentData';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, FileText, Calendar, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function StudentLessons() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  
  const { data: lessons, isLoading } = useStudentLessons();

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <PageHeader title={t('nav.lessons')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.lessons') }]} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <PageHeader title={t('nav.lessons')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.lessons') }]} />
      
      {!lessons || lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{tr("لا توجد دروس متاحة حالياً", "No lessons available currently")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const videoCount = lesson.content?.filter((c: any) => c.content_type === 'video').length || 0;
            const pdfCount = lesson.content?.filter((c: any) => c.content_type === 'pdf').length || 0;
            const hasContent = videoCount > 0 || pdfCount > 0;
            
            return (
              <Card 
                key={lesson.id} 
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <PlayCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{lesson.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                          {lesson.module && (
                            <span>{lesson.module.name}</span>
                          )}
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
                          {lesson.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {lesson.duration_minutes} {tr("دقيقة", "min")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {hasContent && (
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {videoCount > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <PlayCircle className="h-3 w-3" />
                              {videoCount} {tr("فيديو", "videos")}
                            </Badge>
                          )}
                          {pdfCount > 0 && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {pdfCount} {tr("ملف", "files")}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <StatusBadge 
                        status={
                          lesson.status === 'completed' ? (tr("مكتمل", "Completed")) : 
                          lesson.status === 'in_progress' ? (tr("جاري", "In Progress")) : (tr("مجدول", "Scheduled"))
                        } 
                        variant={getStatusVariant(lesson.status || 'scheduled')} 
                      />
                      
                      {hasContent && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {tr("مشاهدة", "View")}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mt-3 pr-16">
                      {lesson.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
