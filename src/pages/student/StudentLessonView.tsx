import { useState, useMemo } from 'react';
import { tr } from '@/utils/tr';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useStudentLessons, useLessonProgress, useUpdateLessonProgress } from '@/hooks/useStudentData';
import { RestrictedVideoPlayer } from '@/components/formation/RestrictedVideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, PlayCircle, FileText, Check, Lock, 
  ChevronRight, ChevronLeft, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LessonContent {
  id: string;
  title: string;
  content_type: 'video' | 'pdf';
  file_url: string;
  duration_seconds?: number;
  order_index: number;
}

export default function StudentLessonView() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const { data: lessons, isLoading } = useStudentLessons();
  const { data: progressData } = useLessonProgress(lessonId || '');
  const updateProgress = useUpdateLessonProgress();
  
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  
  const lesson = lessons?.find(l => l.id === lessonId);
  const content = useMemo(() => {
    if (!lesson?.content) return [] as LessonContent[];
    return [...lesson.content].sort((a, b) => a.order_index - b.order_index) as LessonContent[];
  }, [lesson?.content]);
  
  const currentContent = content[selectedContentIndex];
  
  // Get progress for each content item
  const getContentProgress = (contentId: string) => {
    return progressData?.find(p => p.content_id === contentId);
  };
  
  // Check if content is unlocked (previous content completed)
  const isContentUnlocked = (index: number) => {
    if (index === 0) return true;
    
    for (let i = 0; i < index; i++) {
      const progress = getContentProgress(content[i].id);
      if (!progress?.completed) return false;
    }
    return true;
  };
  
  // Handle video progress update
  const handleVideoProgress = (watchedSeconds: number) => {
    if (!lessonId || !currentContent) return;
    
    updateProgress.mutate({
      lessonId,
      contentId: currentContent.id,
      watchedSeconds,
      completed: false,
    });
  };
  
  // Handle video completion
  const handleVideoComplete = () => {
    if (!lessonId || !currentContent) return;
    
    const progress = getContentProgress(currentContent.id);
    if (progress?.completed) return;
    
    updateProgress.mutate({
      lessonId,
      contentId: currentContent.id,
      watchedSeconds: currentContent.duration_seconds || 0,
      completed: true,
    });
  };
  
  // Handle PDF view (mark as completed when opened)
  const handlePdfOpen = () => {
    if (!lessonId || !currentContent) return;
    
    // Open PDF in new tab
    window.open(currentContent.file_url, '_blank');
    
    // Mark as completed
    const progress = getContentProgress(currentContent.id);
    if (!progress?.completed) {
      updateProgress.mutate({
        lessonId,
        contentId: currentContent.id,
        watchedSeconds: 0,
        completed: true,
      });
    }
  };
  
  // Navigate between content
  const goToNext = () => {
    if (selectedContentIndex < content.length - 1 && isContentUnlocked(selectedContentIndex + 1)) {
      setSelectedContentIndex(selectedContentIndex + 1);
    }
  };
  
  const goToPrevious = () => {
    if (selectedContentIndex > 0) {
      setSelectedContentIndex(selectedContentIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout role="student">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{tr("الدرس غير موجود", "Lesson not found")}</p>
          <Button className="mt-4" onClick={() => navigate('/student/lessons')}>
            {tr("العودة للدروس", "Back to Lessons")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentProgress = currentContent ? getContentProgress(currentContent.id) : null;

  return (
    <DashboardLayout role="student">
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/student/lessons')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" />
          {tr("العودة للدروس", "Back to Lessons")}
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-0">
                {currentContent ? (
                  currentContent.content_type === 'video' ? (
                    <RestrictedVideoPlayer
                      src={currentContent.file_url}
                      title={currentContent.title}
                      duration={currentContent.duration_seconds}
                      isLocked={!isContentUnlocked(selectedContentIndex)}
                      initialProgress={currentProgress?.watched_seconds || 0}
                      onProgress={handleVideoProgress}
                      onComplete={handleVideoComplete}
                    />
                  ) : (
                    <div className="aspect-video flex flex-col items-center justify-center bg-muted rounded-t-lg">
                      <FileText className="h-16 w-16 text-primary mb-4" />
                      <h3 className="text-xl font-semibold mb-2">{currentContent.title}</h3>
                      <p className="text-muted-foreground mb-4">{tr("ملف PDF", "PDF Document")}</p>
                      {isContentUnlocked(selectedContentIndex) ? (
                        <Button onClick={handlePdfOpen}>
                          <ExternalLink className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                          {tr("فتح الملف", "Open File")}
                        </Button>
                      ) : (
                        <div className="text-center">
                          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">{tr("أكمل المحتوى السابق للفتح", "Complete previous content to unlock")}</p>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted rounded-t-lg">
                    <p className="text-muted-foreground">{tr("لا يوجد محتوى متاح", "No content available")}</p>
                  </div>
                )}
                
                {/* Content Info */}
                <div className="p-4 border-t">
                  <h2 className="text-xl font-bold">{currentContent?.title || lesson.title}</h2>
                  {lesson.description && (
                    <p className="text-muted-foreground mt-2">{lesson.description}</p>
                  )}
                  
                  {/* Navigation */}
                  {content.length > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={goToPrevious}
                        disabled={selectedContentIndex === 0}
                      >
                        <ChevronRight className="h-4 w-4 ml-2 rtl:ml-0 rtl:mr-2" />
                        {tr("السابق", "Previous")}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedContentIndex + 1} {tr("من", "of")} {content.length}
                      </span>
                      <Button
                        variant="outline"
                        onClick={goToNext}
                        disabled={selectedContentIndex === content.length - 1 || !isContentUnlocked(selectedContentIndex + 1)}
                      >
                        {tr("التالي", "Next")}
                        <ChevronLeft className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Content Sidebar */}
          {content.length > 0 && (
            <div className="lg:w-80">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">{tr("محتويات الدرس", "Lesson Contents")}</h3>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {content.map((item, index) => {
                        const itemProgress = getContentProgress(item.id);
                        const isUnlocked = isContentUnlocked(index);
                        const isActive = index === selectedContentIndex;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => isUnlocked && setSelectedContentIndex(index)}
                            disabled={!isUnlocked}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-lg text-right rtl:text-right ltr:text-left transition-colors",
                              isActive ? "bg-primary text-primary-foreground" : 
                              isUnlocked ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className={cn(
                              "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                              itemProgress?.completed ? "bg-green-500 text-white" :
                              isActive ? "bg-primary-foreground text-primary" : "bg-muted"
                            )}>
                              {itemProgress?.completed ? (
                                <Check className="h-4 w-4" />
                              ) : !isUnlocked ? (
                                <Lock className="h-4 w-4" />
                              ) : item.content_type === 'video' ? (
                                <PlayCircle className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-medium truncate text-sm",
                                isActive ? "text-primary-foreground" : "text-foreground"
                              )}>
                                {item.title}
                              </p>
                              <p className={cn(
                                "text-xs",
                                isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {item.content_type === 'video' ? (tr("فيديو", "Video")) : 'PDF'}
                                {item.duration_seconds && (tr(` • ${Math.floor(item.duration_seconds / 60)} دقيقة`, ` • ${Math.floor(item.duration_seconds / 60)} min`))}
                              </p>
                            </div>
                            {itemProgress?.completed && (
                              <Badge variant="secondary" className="text-xs">
                                {tr("مكتمل", "Completed")}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
