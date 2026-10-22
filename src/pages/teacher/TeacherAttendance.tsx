import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, Clock, XCircle, Save, Loader2, Users, Calendar, BookOpen } from 'lucide-react';
import { useTeacherLessons, useLessonAttendance, useMarkAttendance, useCohortStudents } from '@/hooks/useTeacherData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TeacherAttendance() {
  const { t } = useTranslation();
  const { data: lessons, isLoading: lessonsLoading } = useTeacherLessons();
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  // Default to first lesson if not selected
  const activeLessonId = selectedLessonId || (lessons && lessons.length > 0 ? lessons[0].id : '');
  const activeLesson = lessons?.find((l: any) => l.id === activeLessonId);

  const { data: attendanceList, isLoading: attendanceLoading } = useLessonAttendance(activeLessonId);
  const { data: cohortStudents, isLoading: studentsLoading } = useCohortStudents(activeLesson?.cohort_id);
  const markAttendance = useMarkAttendance();

  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  // Merge students and attendance
  const studentsWithStatus = (cohortStudents || []).map((student: any) => {
    const existing = attendanceList?.find((a: any) => a.student_id === student.id);
    const status = localStatuses[student.id] || existing?.status || 'present';
    return {
      ...student,
      attendanceStatus: status,
    };
  });

  const handleStatusChange = (studentId: string, status: 'present' | 'late' | 'absent') => {
    setLocalStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!activeLessonId || studentsWithStatus.length === 0) return;

    const payload = studentsWithStatus.map((s: any) => ({
      lesson_id: activeLessonId,
      student_id: s.id,
      status: s.attendanceStatus,
    }));

    try {
      await markAttendance.mutateAsync(payload);
    } catch (err: any) {
      toast.error('فشل حفظ الحضور');
    }
  };

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title="تتبع حضور وغياب الطلاب (Student Attendance)" 
        description="تسجيل ومتابعة حضور الطلاب في الدروس والمحاضرات التدريبية"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/teacher' }, 
          { label: 'سجل الحضور' }
        ]} 
      />

      <div className="p-6 space-y-6">
        {/* Lesson Selector Card */}
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 w-full sm:w-auto">
              <label className="text-xs font-semibold text-muted-foreground">اختر الدرس أو الجلسة التدريبية</label>
              <Select
                value={activeLessonId}
                onValueChange={(val) => {
                  setSelectedLessonId(val);
                  setLocalStatuses({});
                }}
              >
                <SelectTrigger className="w-full sm:w-[320px] rounded-xl text-xs font-medium">
                  <SelectValue placeholder="اختر الدرس" />
                </SelectTrigger>
                <SelectContent>
                  {lessons?.map((l: any) => (
                    <SelectItem key={l.id} value={l.id} className="text-xs">
                      {l.title} ({l.cohort?.name || 'دفعة عامة'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeLesson && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  المقرر: {activeLesson.module?.name || '-'}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {activeLesson.scheduled_date ? format(new Date(activeLesson.scheduled_date), 'dd/MM/yyyy HH:mm') : '-'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Table Card */}
        <Card className="rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border/60 flex items-center justify-between bg-card/60">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                قائمة طلاب الدفعة ({studentsWithStatus.length} طالب)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                اضغط على الأيقونة لتحديد حالة الطالب (حاضر / متأخر / غائب) ثم اضغط حفظ
              </p>
            </div>

            <Button
              onClick={handleSaveAttendance}
              disabled={markAttendance.isPending || studentsWithStatus.length === 0}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md gap-2"
            >
              {markAttendance.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              حفظ سجل الحضور
            </Button>
          </div>

          <div className="p-2 sm:p-4">
            {studentsLoading || attendanceLoading || lessonsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : studentsWithStatus.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-2">
                <Users className="w-12 h-12 mx-auto opacity-40 text-purple-600" />
                <p className="font-medium text-sm">لا يوجد طلاب مسجلون في هذه الدفعة حالياً</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم الطالب</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-center">الحالة الحالية</TableHead>
                    <TableHead className="text-left">تعديل الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithStatus.map((s: any) => (
                    <TableRow key={s.id} className="hover:bg-accent/40 transition-colors">
                      <TableCell className="font-semibold text-sm text-foreground">
                        {s.profile?.full_name || s.name || 'طالب'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {s.profile?.email || s.email || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge
                          status={
                            s.attendanceStatus === 'present' ? 'حاضر' :
                            s.attendanceStatus === 'late' ? 'متأخر' : 'غائب'
                          }
                          variant={
                            s.attendanceStatus === 'present' ? 'success' :
                            s.attendanceStatus === 'late' ? 'warning' : 'destructive'
                          }
                        />
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="حاضر (Present)"
                            onClick={() => handleStatusChange(s.id, 'present')}
                            className={`p-1.5 rounded-lg border transition-all ${
                              s.attendanceStatus === 'present'
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                : 'bg-background hover:bg-emerald-50 text-emerald-600 border-border/60'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="متأخر (Late)"
                            onClick={() => handleStatusChange(s.id, 'late')}
                            className={`p-1.5 rounded-lg border transition-all ${
                              s.attendanceStatus === 'late'
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'bg-background hover:bg-amber-50 text-amber-600 border-border/60'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="غائب (Absent)"
                            onClick={() => handleStatusChange(s.id, 'absent')}
                            className={`p-1.5 rounded-lg border transition-all ${
                              s.attendanceStatus === 'absent'
                                ? 'bg-rose-500 text-white border-rose-600 shadow-sm'
                                : 'bg-background hover:bg-rose-50 text-rose-600 border-border/60'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
