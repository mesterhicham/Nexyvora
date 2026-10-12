import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Users, BookOpen, TrendingUp, Award, Search, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teacherService } from '@/services/apiService';
import { useFormations } from '@/hooks/useFormations';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, isAfter } from 'date-fns';

interface StudentProgress {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  formationId: string;
  formationTitle: string;
  enrolledAt: string;
  totalContent: number;
  completedContent: number;
  progressPercent: number;
  lastActivity: string | null;
  isCompleted: boolean;
}

export default function FormationProgressDashboard() {
  const { t } = useTranslation();
  const { role } = useAuth();
  const userRole = (role as 'admin' | 'teacher' | 'student') || 'teacher';
  const { data: formations } = useFormations();
  const [selectedFormation, setSelectedFormation] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all enrollments with progress
  const { data: studentProgress, isLoading } = useQuery({
    queryKey: ['formation-progress-dashboard'],
    queryFn: async () => {
      const data = await teacherService.getFormationProgress();
      const enrollments = data?.enrollments || [];
      const allContent = data?.allContent || [];
      const allProgress = data?.allProgress || [];

      const contentByFormation = new Map<string, number>();
      allContent.forEach((c: any) => {
        contentByFormation.set(c.formation_id, (contentByFormation.get(c.formation_id) || 0) + 1);
      });

      const progressByEnrollment = new Map<string, { completed: number; lastActivity: string | null }>();
      allProgress.forEach((p: any) => {
        const current = progressByEnrollment.get(p.enrollment_id) || { completed: 0, lastActivity: null };
        if (p.completed) current.completed++;
        if (p.updated_at && (!current.lastActivity || p.updated_at > current.lastActivity)) {
          current.lastActivity = p.updated_at;
        }
        progressByEnrollment.set(p.enrollment_id, current);
      });

      return enrollments.map((enrollment: any) => {
        const totalContent = contentByFormation.get(enrollment.formation_id) || 0;
        const progressData = progressByEnrollment.get(enrollment.id) || { completed: 0, lastActivity: null };
        const progressPercent = totalContent > 0 ? Math.round((progressData.completed / totalContent) * 100) : 0;

        return {
          enrollmentId: enrollment.id,
          studentId: enrollment.student_id,
          studentName: enrollment.student?.profile?.full_name || 'Unknown',
          studentEmail: enrollment.student?.profile?.email || '',
          formationId: enrollment.formation_id,
          formationTitle: (enrollment.formation as any)?.title || 'Unknown',
          enrolledAt: enrollment.enrolled_at,
          totalContent,
          completedContent: progressData.completed,
          progressPercent,
          lastActivity: progressData.lastActivity,
          isCompleted: progressPercent === 100 && totalContent > 0,
        } as StudentProgress;
      });
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!studentProgress) return { total: 0, active: 0, completed: 0, avgProgress: 0 };

    const filtered = selectedFormation === 'all' 
      ? studentProgress 
      : studentProgress.filter(p => p.formationId === selectedFormation);

    const sevenDaysAgo = subDays(new Date(), 7);
    const activeStudents = filtered.filter(p => 
      p.lastActivity && isAfter(new Date(p.lastActivity), sevenDaysAgo)
    );
    const completedStudents = filtered.filter(p => p.isCompleted);
    const avgProgress = filtered.length > 0 
      ? Math.round(filtered.reduce((sum, p) => sum + p.progressPercent, 0) / filtered.length)
      : 0;

    return {
      total: filtered.length,
      active: activeStudents.length,
      completed: completedStudents.length,
      avgProgress,
    };
  }, [studentProgress, selectedFormation]);

  // Filtered and searched students
  const filteredStudents = useMemo(() => {
    if (!studentProgress) return [];

    let result = selectedFormation === 'all'
      ? studentProgress
      : studentProgress.filter(p => p.formationId === selectedFormation);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        p => p.studentName.toLowerCase().includes(query) || 
             p.studentEmail.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => 
      new Date(b.lastActivity || b.enrolledAt).getTime() - 
      new Date(a.lastActivity || a.enrolledAt).getTime()
    );
  }, [studentProgress, selectedFormation, searchQuery]);

  const getProgressColor = (percent: number) => {
    if (percent === 100) return 'text-green-600';
    if (percent >= 50) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <DashboardLayout role={userRole}>
      <PageHeader
        title="Formation Progress Dashboard"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: `/${userRole}` },
          { label: 'Progress Dashboard' },
        ]}
      />

      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedFormation} onValueChange={setSelectedFormation}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Select formation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Formations</SelectItem>
              {formations?.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats.total}</div>
              <p className="text-xs text-muted-foreground">Students enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : stats.active}</div>
              <p className="text-xs text-muted-foreground">Active in last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{isLoading ? '...' : stats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished the course</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{isLoading ? '...' : `${stats.avgProgress}%`}</div>
              <Progress value={stats.avgProgress} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Student Progress Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>
              Track individual student progress across your formations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No enrollments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {student.formationTitle}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(student.enrolledAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={student.progressPercent} className="h-2 flex-1" />
                          <span className={`text-sm font-medium ${getProgressColor(student.progressPercent)}`}>
                            {student.progressPercent}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {student.completedContent} / {student.totalContent} items
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.lastActivity 
                          ? format(new Date(student.lastActivity), 'MMM d, HH:mm')
                          : 'Never'
                        }
                      </TableCell>
                      <TableCell>
                        {student.isCompleted ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : student.progressPercent > 0 ? (
                          <Badge variant="secondary">In Progress</Badge>
                        ) : (
                          <Badge variant="outline">Not Started</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
