import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { studentService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle, Clock, Calendar, BookOpen } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar, fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function StudentAttendance() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const getDateLocale = () => {
    if (i18n.language?.startsWith('ar')) return ar;
    if (i18n.language?.startsWith('fr')) return fr;
    return undefined;
  };

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance', user?.id],
    queryFn: () => studentService.getAttendance(),
    enabled: !!user?.id,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-5 w-5 text-success" />;
      case 'absent': return <XCircle className="h-5 w-5 text-destructive" />;
      case 'late': return <Clock className="h-5 w-5 text-warning" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      present: { label: t('status.present'), className: 'bg-success/10 text-success border-success/20' },
      absent: { label: t('status.absent'), className: 'bg-destructive/10 text-destructive border-destructive/20' },
      late: { label: t('status.late'), className: 'bg-warning/10 text-warning border-warning/20' },
    };
    const { label, className } = config[status] || { label: status, className: '' };
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  const attendanceRate = attendanceData?.stats.total 
    ? Math.round(((attendanceData.stats.present + attendanceData.stats.late) / attendanceData.stats.total) * 100)
    : 0;

  return (
    <DashboardLayout role="student">
      <PageHeader 
        title={t('student.attendanceRecord')} 
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/student' }, 
          { label: t('student.attendanceRecord') }
        ]} 
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('student.attendanceRate')}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {t('student.outOfTotalLessons', { count: attendanceData?.stats.total })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('status.present')}</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{attendanceData?.stats.present}</div>
                <p className="text-xs text-muted-foreground">{t('student.lessonsCount')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('status.late')}</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{attendanceData?.stats.late}</div>
                <p className="text-xs text-muted-foreground">{t('student.lessonsCount')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('status.absent')}</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{attendanceData?.stats.absent}</div>
                <p className="text-xs text-muted-foreground">{t('student.lessonsCount')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Attendance Records Table */}
          {attendanceData?.records && attendanceData.records.length > 0 ? (
            <div className="bg-card rounded-xl shadow-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('table.lesson')}</TableHead>
                    <TableHead>{t('table.module')}</TableHead>
                    <TableHead>{t('table.date')}</TableHead>
                    <TableHead>{t('table.status')}</TableHead>
                    <TableHead>{t('table.notes')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.records.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {record.lesson?.title || '-'}
                        </div>
                      </TableCell>
                      <TableCell>{record.lesson?.module?.name || '-'}</TableCell>
                      <TableCell>
                        {record.lesson?.scheduled_date 
                          ? format(new Date(record.lesson.scheduled_date), 'PPP', { locale: getDateLocale() })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('student.noAttendanceRecords')}</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
