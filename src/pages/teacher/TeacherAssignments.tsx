import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { Progress } from '@/components/ui/progress';
import { useTeacherAssignments, useCreateAssignment, useUpdateAssignment, useDeleteAssignment, useTeacherModulesAndCohorts, useAssignmentSubmissions, useGradeSubmission, useCohortStudents } from '@/hooks/useTeacherData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AssignmentForm {
  title: string;
  description: string;
  module_id: string;
  cohort_id: string;
  due_date: string;
  max_grade: number;
  status: string;
}

const initialForm: AssignmentForm = {
  title: '',
  description: '',
  module_id: '',
  cohort_id: '',
  due_date: '',
  max_grade: 100,
  status: 'active',
};

export default function TeacherAssignments() {
  const { t } = useTranslation();
  const { data: assignments, isLoading } = useTeacherAssignments();
  const { data: modulesAndCohorts } = useTeacherModulesAndCohorts();
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const deleteAssignment = useDeleteAssignment();
  const gradeSubmission = useGradeSubmission();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmissionsOpen, setIsSubmissionsOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssignmentForm>(initialForm);
  const [gradeForm, setGradeForm] = useState<{ id: string; grade: number; feedback: string } | null>(null);

  const { data: submissions } = useAssignmentSubmissions(selectedAssignment?.id);
  const { data: cohortStudents } = useCohortStudents(selectedAssignment?.cohort_id);

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setForm({
      title: assignment.title,
      description: assignment.description || '',
      module_id: assignment.module_id || '',
      cohort_id: assignment.cohort_id || '',
      due_date: assignment.due_date ? format(new Date(assignment.due_date), "yyyy-MM-dd'T'HH:mm") : '',
      max_grade: assignment.max_grade || 100,
      status: assignment.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const handleViewSubmissions = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsSubmissionsOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.due_date) return;
    
    const data = {
      title: form.title,
      description: form.description || undefined,
      module_id: form.module_id || undefined,
      cohort_id: form.cohort_id || undefined,
      due_date: form.due_date,
      max_grade: form.max_grade,
      status: form.status,
    };

    if (editingAssignment) {
      await updateAssignment.mutateAsync({ id: editingAssignment.id, ...data });
    } else {
      await createAssignment.mutateAsync(data);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteAssignment.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleGrade = async () => {
    if (gradeForm) {
      await gradeSubmission.mutateAsync(gradeForm);
      setGradeForm(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const getSubmissionCount = (assignment: any) => {
    return assignment.submissions?.[0]?.count || 0;
  };

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t('nav.assignments')} 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: t('nav.assignments') }]} 
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('teacher.newAssignment')}
          </Button>
        } 
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : assignments && assignments.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {assignments.map((assignment: any) => (
            <div key={assignment.id} className="bg-card rounded-xl p-6 shadow-md border border-border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-foreground">{assignment.title}</h3>
                <StatusBadge status={t(`status.${assignment.status}`)} variant={getStatusVariant(assignment.status)} />
              </div>
              <p className="text-sm text-muted-foreground mb-2">{assignment.module?.name || 'No module'}</p>
              <p className="text-sm mb-2">Cohort: {assignment.cohort?.name || 'All'}</p>
              <p className="text-sm mb-4">
                {t('teacher.due')}: <span className="font-medium">
                  {assignment.due_date ? format(new Date(assignment.due_date), 'PPp') : '-'}
                </span>
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>{t('teacher.submissions')}</span>
                  <span className="font-medium">{getSubmissionCount(assignment)}</span>
                </div>
                <Progress value={getSubmissionCount(assignment) * 10} className="h-2" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewSubmissions(assignment)}>
                  <Eye className="h-4 w-4 mr-1" /> Submissions
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(assignment)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(assignment.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('teacher.newAssignment')}
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAssignment ? 'Edit Assignment' : 'New Assignment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                placeholder="Assignment title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Assignment description and instructions"
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
                <Label>Due Date *</Label>
                <Input 
                  type="datetime-local" 
                  value={form.due_date} 
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })} 
                />
              </div>
              <div>
                <Label>Max Grade</Label>
                <Input 
                  type="number" 
                  value={form.max_grade} 
                  onChange={(e) => setForm({ ...form, max_grade: parseInt(e.target.value) || 100 })} 
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createAssignment.isPending || updateAssignment.isPending}
            >
              {(createAssignment.isPending || updateAssignment.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAssignment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Sheet */}
      <Sheet open={isSubmissionsOpen} onOpenChange={setIsSubmissionsOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Submissions - {selectedAssignment?.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {submissions && submissions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.student?.profile?.full_name || 'Unknown'}</TableCell>
                      <TableCell>{sub.submitted_at ? format(new Date(sub.submitted_at), 'PPp') : '-'}</TableCell>
                      <TableCell>{sub.grade !== null ? `${sub.grade}/${selectedAssignment?.max_grade}` : '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} variant={getStatusVariant(sub.status === 'graded' ? 'completed' : 'active')} />
                      </TableCell>
                      <TableCell>
                        {sub.status !== 'graded' && (
                          <Button size="sm" onClick={() => setGradeForm({ id: sub.id, grade: 0, feedback: '' })}>
                            Grade
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No submissions yet</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Grade Dialog */}
      <Dialog open={!!gradeForm} onOpenChange={() => setGradeForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Grade (out of {selectedAssignment?.max_grade})</Label>
              <Input 
                type="number" 
                value={gradeForm?.grade || 0} 
                onChange={(e) => setGradeForm(prev => prev ? { ...prev, grade: parseInt(e.target.value) || 0 } : null)} 
              />
            </div>
            <div>
              <Label>Feedback</Label>
              <Textarea 
                value={gradeForm?.feedback || ''} 
                onChange={(e) => setGradeForm(prev => prev ? { ...prev, feedback: e.target.value } : null)} 
                placeholder="Provide feedback to the student"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeForm(null)}>Cancel</Button>
            <Button onClick={handleGrade} disabled={gradeSubmission.isPending}>
              {gradeSubmission.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? All submissions will also be deleted.
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
    </DashboardLayout>
  );
}
