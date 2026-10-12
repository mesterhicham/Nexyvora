import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, Users, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCohortStudents, useLessonAttendance, useMarkAttendance } from '@/hooks/useTeacherData';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { exportAttendanceToExcel, exportAttendanceToPDF } from '@/utils/exportAttendance';
import { format } from 'date-fns';
interface LessonAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    title: string;
    scheduled_date?: string;
    cohort_id?: string;
    cohort?: { id: string; name: string };
  } | null;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceRecord {
  student_id: string;
  status: AttendanceStatus;
  notes: string;
}

export function LessonAttendanceDialog({ open, onOpenChange, lesson }: LessonAttendanceDialogProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const cohortId = lesson?.cohort_id || lesson?.cohort?.id || '';
  
  const { data: students, isLoading: loadingStudents } = useCohortStudents(cohortId);
  const { data: existingAttendance, isLoading: loadingAttendance } = useLessonAttendance(lesson?.id || '');
  const markAttendance = useMarkAttendance();
  
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({});

  // Initialize attendance records when students or existing attendance loads
  useEffect(() => {
    if (!students || !lesson) return;
    
    const records: Record<string, AttendanceRecord> = {};
    
    students.forEach((student: any) => {
      const existing = existingAttendance?.find((a: any) => a.student_id === student.id);
      records[student.id] = {
        student_id: student.id,
        status: (existing?.status as AttendanceStatus) || 'absent',
        notes: existing?.notes || '',
      };
    });
    
    setAttendanceRecords(records);
  }, [students, existingAttendance, lesson]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const handleSave = async () => {
    if (!lesson) return;
    
    const records = Object.values(attendanceRecords).map(r => ({
      lesson_id: lesson.id,
      student_id: r.student_id,
      status: r.status,
      notes: r.notes || undefined,
    }));
    
    await markAttendance.mutateAsync(records);
    onOpenChange(false);
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'absent': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'late': return <Clock className="h-5 w-5 text-warning" />;
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants = {
      present: 'bg-success/10 text-success border-success/20',
      absent: 'bg-destructive/10 text-destructive border-destructive/20',
      late: 'bg-warning/10 text-warning border-warning/20',
    };
    return variants[status];
  };

  const stats = {
    present: Object.values(attendanceRecords).filter(r => r.status === 'present').length,
    absent: Object.values(attendanceRecords).filter(r => r.status === 'absent').length,
    late: Object.values(attendanceRecords).filter(r => r.status === 'late').length,
  };

  const isLoading = loadingStudents || loadingAttendance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isRtl ? 'تتبع الحضور' : 'Track Attendance'} - {lesson?.title}
          </DialogTitle>
        </DialogHeader>

        {!cohortId ? (
          <div className="text-center py-8 text-muted-foreground">
            {isRtl ? 'هذا الدرس غير مرتبط بمجموعة. يرجى تحديد المجموعة أولاً.' : 'This lesson is not linked to a cohort. Please select a cohort first.'}
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : students && students.length > 0 ? (
          <>
            {/* Stats and Export */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4">
                <Badge variant="outline" className={cn("px-3 py-1", getStatusBadge('present'))}>
                  <CheckCircle className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {isRtl ? 'حاضر' : 'Present'}: {stats.present}
                </Badge>
                <Badge variant="outline" className={cn("px-3 py-1", getStatusBadge('late'))}>
                  <Clock className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {isRtl ? 'متأخر' : 'Late'}: {stats.late}
                </Badge>
                <Badge variant="outline" className={cn("px-3 py-1", getStatusBadge('absent'))}>
                  <XCircle className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {isRtl ? 'غائب' : 'Absent'}: {stats.absent}
                </Badge>
              </div>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRtl ? 'تصدير' : 'Export'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const exportData = {
                      lessonTitle: lesson?.title || '',
                      lessonDate: lesson?.scheduled_date ? format(new Date(lesson.scheduled_date), 'PPP') : '',
                      records: students?.map((s: any) => ({
                        student_id: s.id,
                        status: attendanceRecords[s.id]?.status || 'absent',
                        notes: attendanceRecords[s.id]?.notes,
                        student: s,
                      })) || [],
                    };
                    exportAttendanceToExcel(exportData);
                  }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRtl ? 'تصدير Excel' : 'Export Excel'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const exportData = {
                      lessonTitle: lesson?.title || '',
                      lessonDate: lesson?.scheduled_date ? format(new Date(lesson.scheduled_date), 'PPP') : '',
                      records: students?.map((s: any) => ({
                        student_id: s.id,
                        status: attendanceRecords[s.id]?.status || 'absent',
                        notes: attendanceRecords[s.id]?.notes,
                        student: s,
                      })) || [],
                    };
                    exportAttendanceToPDF(exportData);
                  }}>
                    <FileText className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRtl ? 'تصدير PDF' : 'Export PDF'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Attendance Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRtl ? 'الطالب' : 'Student'}</TableHead>
                    <TableHead className="text-center">{isRtl ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{isRtl ? 'ملاحظات' : 'Notes'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student: any) => {
                    const record = attendanceRecords[student.id];
                    const profile = student.profile;
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-1">
                            <Button
                              variant={record?.status === 'present' ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                "h-9 w-9 p-0",
                                record?.status === 'present' && "bg-success hover:bg-success/90"
                              )}
                              onClick={() => handleStatusChange(student.id, 'present')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={record?.status === 'late' ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                "h-9 w-9 p-0",
                                record?.status === 'late' && "bg-warning hover:bg-warning/90"
                              )}
                              onClick={() => handleStatusChange(student.id, 'late')}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={record?.status === 'absent' ? 'default' : 'outline'}
                              size="sm"
                              className={cn(
                                "h-9 w-9 p-0",
                                record?.status === 'absent' && "bg-destructive hover:bg-destructive/90"
                              )}
                              onClick={() => handleStatusChange(student.id, 'absent')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={record?.notes || ''}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder={isRtl ? 'ملاحظات...' : 'Notes...'}
                            className="min-h-[40px] h-10 resize-none"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isRtl ? 'لا يوجد طلاب في هذه المجموعة.' : 'No students found in this cohort.'}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={markAttendance.isPending || !students?.length}
          >
            {markAttendance.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isRtl ? 'حفظ الحضور' : 'Save Attendance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
