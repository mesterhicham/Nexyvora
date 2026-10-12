import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormModal } from '@/components/common/FormModal';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useZoomMeetings, useCreateZoomMeeting, useUpdateZoomMeeting, useDeleteZoomMeeting, useMeetingAttendance, useUpdateMeetingAttendance } from '@/hooks/useAdminFeatures';
import { useCohorts, useModules, useStudents } from '@/hooks/useDashboardData';
import { Plus, Edit, Trash2, Video, Users, Clock, Link, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MeetingForm {
  title: string;
  description: string;
  module_id: string;
  cohort_id: string;
  meeting_url: string;
  meeting_id: string;
  passcode: string;
  scheduled_at: string;
  duration_minutes: number;
}

export default function ZoomMeetings() {
  const { t } = useTranslation();
  const { data: meetings, isLoading } = useZoomMeetings();
  const { data: cohorts } = useCohorts();
  const { data: modules } = useModules();
  const { data: students } = useStudents();
  const createMeeting = useCreateZoomMeeting();
  const updateMeeting = useUpdateZoomMeeting();
  const deleteMeeting = useDeleteZoomMeeting();
  const updateAttendance = useUpdateMeetingAttendance();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<typeof meetings[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<MeetingForm>({
    title: '',
    description: '',
    module_id: '',
    cohort_id: '',
    meeting_url: '',
    meeting_id: '',
    passcode: '',
    scheduled_at: '',
    duration_minutes: 60,
  });

  const { data: attendance } = useMeetingAttendance(attendanceMeetingId || '');
  
  // Get students for the selected cohort
  const cohortStudents = students?.filter(s => {
    const selectedMeeting = meetings?.find(m => m.id === attendanceMeetingId);
    return s.cohort_id === selectedMeeting?.cohort_id;
  }) || [];

  const openAddModal = () => {
    setEditingMeeting(null);
    setFormData({
      title: '',
      description: '',
      module_id: '',
      cohort_id: '',
      meeting_url: '',
      meeting_id: '',
      passcode: '',
      scheduled_at: '',
      duration_minutes: 60,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (meeting: typeof meetings[0]) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      description: meeting.description || '',
      module_id: meeting.module_id || '',
      cohort_id: meeting.cohort_id || '',
      meeting_url: meeting.meeting_url || '',
      meeting_id: meeting.meeting_id || '',
      passcode: meeting.passcode || '',
      scheduled_at: meeting.scheduled_at ? new Date(meeting.scheduled_at).toISOString().slice(0, 16) : '',
      duration_minutes: meeting.duration_minutes || 60,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.scheduled_at) return;
    
    const data = {
      ...formData,
      module_id: formData.module_id || undefined,
      cohort_id: formData.cohort_id || undefined,
    };
    
    if (editingMeeting) {
      await updateMeeting.mutateAsync({ id: editingMeeting.id, ...data });
    } else {
      await createMeeting.mutateAsync(data);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMeeting.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleAttendanceChange = async (studentId: string, status: string) => {
    if (attendanceMeetingId) {
      await updateAttendance.mutateAsync({
        meeting_id: attendanceMeetingId,
        student_id: studentId,
        status,
      });
    }
  };

  const getStudentAttendanceStatus = (studentId: string) => {
    return attendance?.find(a => a.student_id === studentId)?.status || 'absent';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.zoomMeetings')}
        description={t('admin.zoomMeetingsDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('admin.zoomMeetings') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.scheduleMeeting')}
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))
        ) : meetings?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          meetings?.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                  </div>
                  <StatusBadge
                    status={t(`status.${meeting.status || 'scheduled'}`)}
                    variant={getStatusVariant(meeting.status || 'scheduled')}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {meeting.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{meeting.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(meeting.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{meeting.duration_minutes} {t('admin.minutes')}</span>
                  </div>
                  {meeting.modules?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs bg-secondary px-2 py-1 rounded">{meeting.modules.name}</span>
                    </div>
                  )}
                  {meeting.cohorts?.name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{meeting.cohorts.name}</span>
                    </div>
                  )}
                </div>

                {meeting.meeting_url && (
                  <a
                    href={meeting.meeting_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline text-sm"
                  >
                    <Link className="h-4 w-4" />
                    {t('admin.joinMeeting')}
                  </a>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAttendanceMeetingId(meeting.id)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    {t('admin.attendance')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(meeting)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(meeting.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <FormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title={editingMeeting ? t('admin.editMeeting') : t('admin.scheduleMeeting')}
        onSubmit={handleSubmit}
        submitLabel={t('common.save')}
        isLoading={createMeeting.isPending || updateMeeting.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('table.title')} *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.scheduledAt')} *</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.duration')}</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                min={15}
                max={480}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('table.module')}</Label>
              <Select
                value={formData.module_id}
                onValueChange={(value) => setFormData({ ...formData, module_id: value })}
              >
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {modules?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('table.cohort')}</Label>
              <Select
                value={formData.cohort_id}
                onValueChange={(value) => setFormData({ ...formData, cohort_id: value })}
              >
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {cohorts?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.meetingUrl')}</Label>
            <Input
              value={formData.meeting_url}
              onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
              placeholder="https://zoom.us/j/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('admin.meetingId')}</Label>
              <Input
                value={formData.meeting_id}
                onChange={(e) => setFormData({ ...formData, meeting_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.passcode')}</Label>
              <Input
                value={formData.passcode}
                onChange={(e) => setFormData({ ...formData, passcode: e.target.value })}
              />
            </div>
          </div>
        </div>
      </FormModal>

      <Dialog open={!!attendanceMeetingId} onOpenChange={() => setAttendanceMeetingId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('admin.meetingAttendance')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {cohortStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">{t('admin.noStudentsInCohort')}</p>
            ) : (
              cohortStudents.map((student) => {
                const status = getStudentAttendanceStatus(student.id);
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{student.profile?.full_name || t('common.unknown')}</p>
                      <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'default' : 'outline'}
                        className={status === 'present' ? 'bg-success hover:bg-success/90' : ''}
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'late' ? 'default' : 'outline'}
                        className={status === 'late' ? 'bg-warning hover:bg-warning/90' : ''}
                        onClick={() => handleAttendanceChange(student.id, 'late')}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'default' : 'outline'}
                        className={status === 'absent' ? 'bg-destructive hover:bg-destructive/90' : ''}
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('admin.meeting')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
