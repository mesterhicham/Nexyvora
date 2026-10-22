import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeacherMeetings } from '@/hooks/useMeetingRoom';
import { useTeacherModulesAndCohorts } from '@/hooks/useTeacherData';
import { adminService } from '@/services/apiService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Video, 
  Calendar,
  Clock,
  Plus,
  Users,
  CheckCircle,
  ExternalLink,
  Loader2,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherMeetings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: meetings, isLoading } = useTeacherMeetings();
  const { data: modulesAndCohorts } = useTeacherModulesAndCohorts();

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module_id: '',
    cohort_id: '',
    meeting_url: '',
    scheduled_at: '',
    duration_minutes: 60,
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data: typeof formData) => adminService.createZoomMeeting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-meetings'] });
      setIsScheduleOpen(false);
      setFormData({
        title: '',
        description: '',
        module_id: '',
        cohort_id: '',
        meeting_url: '',
        scheduled_at: '',
        duration_minutes: 60,
      });
      toast.success('تمت جدولة اللقاء الحي بنجاح!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل جدولة اللقاء');
    }
  });

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.scheduled_at) {
      toast.error('يرجى ملء عنوان اللقاء والتاريخ');
      return;
    }
    await createMeetingMutation.mutateAsync(formData);
  };
  
  const openMeetings = meetings?.filter(m => m.room_open) || [];
  const upcomingMeetings = meetings?.filter(m => !m.room_open && m.status === 'scheduled') || [];
  const pastMeetings = meetings?.filter(m => m.status === 'completed') || [];

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="اللقاءات والمحاضرات الحية (Live Meetings)"
        description="إدارة وبث الجلسات التفاعلية والدروس المباشرة مع الطلاب"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/teacher' },
          { label: 'اللقاءات الحية' },
        ]}
        actions={
          <Button 
            onClick={() => setIsScheduleOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md gap-2"
          >
            <Plus className="h-4 w-4" />
            جدولة لقاء جديد
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Live Now Banner */}
        {openMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              جلسات جارية الآن (Live Now)
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {openMeetings.map(meeting => (
                <Card key={meeting.id} className="border-red-500/40 bg-gradient-to-br from-red-500/5 to-purple-500/5 shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">{meeting.title}</CardTitle>
                      <Badge className="bg-red-600 text-white animate-pulse">مباشر الآن</Badge>
                    </div>
                    <CardDescription>
                      {meeting.module?.name || meeting.cohort?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span>{meeting.cohort?.name || 'الدفعة التعليمية'}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}
                        variant="outline"
                        className="flex-1 rounded-xl"
                      >
                        غرفة التحكم باللقاء
                      </Button>
                      {meeting.meeting_url && (
                        <Button 
                          onClick={() => window.open(meeting.meeting_url!, '_blank')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          دخول البث
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            اللقاءات القادمة (Upcoming Meetings)
          </h2>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <Card className="text-center py-12 rounded-2xl border-dashed">
              <CardContent className="space-y-3">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium">لا توجد لقاءات مجدولة حالياً</p>
                <Button 
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white gap-2 shadow-sm"
                  onClick={() => setIsScheduleOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  جدولة أول لقاء الآن
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="rounded-2xl border hover:border-purple-500/40 transition-all shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold truncate">{meeting.title}</CardTitle>
                    <CardDescription className="truncate">
                      {meeting.module?.name || meeting.cohort?.name || 'جلسة تفاعلية'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span>{format(new Date(meeting.scheduled_at), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <span>{format(new Date(meeting.scheduled_at), 'p')} ({meeting.duration_minutes} دقيقة)</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium">
                        <Users className="h-4 w-4 text-emerald-600" />
                        <span>{meeting.cohort?.name || 'كافة الطلاب'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}
                        variant="outline"
                        className="flex-1 rounded-xl text-xs"
                      >
                        <Video className="h-3.5 w-3.5 mr-1 text-purple-600" />
                        فتح الغرفة
                      </Button>
                      {meeting.meeting_url && (
                        <Button 
                          onClick={() => window.open(meeting.meeting_url!, '_blank')}
                          className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          الرابط
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-bold text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              الجلسات السابقة (Past Sessions)
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMeetings.slice(0, 6).map(meeting => (
                <Card 
                  key={meeting.id} 
                  className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer rounded-2xl"
                  onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold truncate">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      <span>{format(new Date(meeting.scheduled_at), 'PP')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              جدولة لقاء حي جديد / Schedule Live Meeting
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-4">
            <div>
              <Label>عنوان اللقاء / Meeting Title *</Label>
              <Input
                placeholder="مثال: محاضرة مراجعة البرمجة المتقدمة"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="rounded-xl mt-1"
              />
            </div>

            <div>
              <Label>وصف اللقاء / Description</Label>
              <Textarea
                placeholder="تفاصيل ومحاور المحاضرة..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-xl mt-1 text-xs"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>المقرر / Module</Label>
                <Select
                  value={formData.module_id}
                  onValueChange={(val) => setFormData({ ...formData, module_id: val })}
                >
                  <SelectTrigger className="rounded-xl mt-1 text-xs">
                    <SelectValue placeholder="اختر المقرر" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesAndCohorts?.modules.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>الدفعة / Cohort</Label>
                <Select
                  value={formData.cohort_id}
                  onValueChange={(val) => setFormData({ ...formData, cohort_id: val })}
                >
                  <SelectTrigger className="rounded-xl mt-1 text-xs">
                    <SelectValue placeholder="اختر الدفعة" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesAndCohorts?.cohorts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>رابط البث (Zoom أو Google Meet Link)</Label>
              <Input
                placeholder="https://meet.google.com/xxx أو Zoom link"
                value={formData.meeting_url}
                onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                className="rounded-xl mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>التاريخ والوقت *</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                  required
                  className="rounded-xl mt-1 text-xs"
                />
              </div>

              <div>
                <Label>المدة (بالدقائق)</Label>
                <Input
                  type="number"
                  min="15"
                  max="300"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) || 60 })}
                  className="rounded-xl mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsScheduleOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={createMeetingMutation.isPending}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md gap-2"
              >
                {createMeetingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                تأكيد الجدولة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
