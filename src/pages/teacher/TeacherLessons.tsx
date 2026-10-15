import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Users, Loader2, FolderOpen } from 'lucide-react';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useTeacherLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, useTeacherModulesAndCohorts } from '@/hooks/useTeacherData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LessonAttendanceDialog } from '@/components/teacher/LessonAttendanceDialog';
import { LessonContentManager } from '@/components/teacher/LessonContentManager';

interface LessonForm {
  title: string;
  description: string;
  module_id: string;
  cohort_id: string;
  scheduled_date: string;
  duration_minutes: number;
  status: string;
}

const initialForm: LessonForm = {
  title: '',
  description: '',
  module_id: '',
  cohort_id: '',
  scheduled_date: '',
  duration_minutes: 60,
  status: 'scheduled',
};

export default function TeacherLessons() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: lessons, isLoading } = useTeacherLessons();
  const { data: modulesAndCohorts } = useTeacherModulesAndCohorts();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isContentDialogOpen, setIsContentDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [attendanceLesson, setAttendanceLesson] = useState<any>(null);
  const [contentLesson, setContentLesson] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonForm>(initialForm);

  const handleOpenCreate = () => {
    setEditingLesson(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title,
      description: lesson.description || '',
      module_id: lesson.module_id || '',
      cohort_id: lesson.cohort_id || '',
      scheduled_date: lesson.scheduled_date ? format(new Date(lesson.scheduled_date), "yyyy-MM-dd'T'HH:mm") : '',
      duration_minutes: lesson.duration_minutes || 60,
      status: lesson.status || 'scheduled',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.scheduled_date) return;
    
    const data = {
      title: form.title,
      description: form.description || undefined,
      module_id: form.module_id || undefined,
      cohort_id: form.cohort_id || undefined,
      scheduled_date: form.scheduled_date,
      duration_minutes: form.duration_minutes,
      status: form.status,
    };

    if (editingLesson) {
      await updateLesson.mutateAsync({ id: editingLesson.id, ...data });
    } else {
      await createLesson.mutateAsync(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteLesson.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const openAttendanceDialog = (lesson: any) => {
    setAttendanceLesson(lesson);
    setIsAttendanceDialogOpen(true);
  };

  const openContentDialog = (lesson: any) => {
    setContentLesson(lesson);
    setIsContentDialogOpen(true);
  };

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t('nav.lessons')} 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: t('nav.lessons') }]} 
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('teacher.newLesson')}
          </Button>
        } 
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : lessons && lessons.length > 0 ? (
        <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('nav.lessons')}</TableHead>
                <TableHead>{t('table.module')}</TableHead>
                <TableHead>Cohort</TableHead>
                <TableHead>{t('table.date')}</TableHead>
                <TableHead>{t('table.duration')}</TableHead>
                <TableHead>{t('table.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson: any) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-medium">{lesson.title}</TableCell>
                  <TableCell>{lesson.module?.name || '-'}</TableCell>
                  <TableCell>{lesson.cohort?.name || '-'}</TableCell>
                  <TableCell>
                    {lesson.scheduled_date ? format(new Date(lesson.scheduled_date), 'PPp') : '-'}
                  </TableCell>
                  <TableCell>{lesson.duration_minutes} min</TableCell>
                  <TableCell>
                    <StatusBadge 
                      status={t(`status.${lesson.status}`)} 
                      variant={getStatusVariant(lesson.status)} 
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openContentDialog(lesson)}
                        title={tr("إدارة المحتوى", "Manage Content")}
                      >
                        <FolderOpen className="h-4 w-4 text-orange-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => openAttendanceDialog(lesson)}
                        title={tr("تتبع الحضور", "Track Attendance")}
                      >
                        <Users className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(lesson)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(lesson.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('teacher.newLesson')}
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingLesson ? 'Edit Lesson' : 'New Lesson'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                placeholder="Lesson title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Lesson description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Module</Label>
                <Select value={form.module_id} onValueChange={(v) => setForm({ ...form, module_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesAndCohorts?.modules.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cohort</Label>
                <Select value={form.cohort_id} onValueChange={(v) => setForm({ ...form, cohort_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesAndCohorts?.cohorts.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & Time *</Label>
                <Input 
                  type="datetime-local" 
                  value={form.scheduled_date} 
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} 
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input 
                  type="number" 
                  value={form.duration_minutes} 
                  onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })} 
                />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createLesson.isPending || updateLesson.isPending}
            >
              {(createLesson.isPending || updateLesson.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLesson ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Dialog */}
      <LessonAttendanceDialog
        open={isAttendanceDialogOpen}
        onOpenChange={setIsAttendanceDialogOpen}
        lesson={attendanceLesson}
      />

      {/* Content Manager Dialog */}
      <LessonContentManager
        open={isContentDialogOpen}
        onOpenChange={setIsContentDialogOpen}
        lesson={contentLesson}
      />
    </DashboardLayout>
  );
}
