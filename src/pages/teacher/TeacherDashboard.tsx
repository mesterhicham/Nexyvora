import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { AIAssistant } from '@/components/dashboard/AIAssistant';
import { useTeacherModules, useTeacherStats } from '@/hooks/useDashboardData';
import { BookOpen, Users, ClipboardList, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const stats = useTeacherStats();
  const { data: modules, isLoading: modulesLoading } = useTeacherModules();

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t('teacher.title')} 
        description={t('teacher.welcome')} 
        breadcrumbs={[{ label: t('nav.dashboard') }]} 
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title={t('teacher.myModules')} 
          value={stats.isLoading ? '...' : stats.totalModules} 
          icon={BookOpen} 
          variant="primary" 
        />
        <StatCard 
          title={t('teacher.totalStudents')} 
          value={stats.isLoading ? '...' : stats.totalStudents} 
          icon={Users} 
        />
        <StatCard 
          title={t('teacher.pendingAssignments')} 
          value={stats.isLoading ? '...' : stats.pendingAssignments} 
          icon={ClipboardList} 
          variant="warning" 
        />
        <StatCard 
          title={t('teacher.upcomingLessons')} 
          value={stats.isLoading ? '...' : stats.upcomingLessons} 
          icon={Calendar} 
          variant="accent" 
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="table-container bg-card border border-border shadow-sm rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{t('teacher.myModules')}</h3>
          </div>
          <div className="p-4 space-y-3">
            {modulesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))
            ) : !modules || modules.length === 0 ? (
              <p className="text-center text-slate-600 dark:text-slate-400 py-4 text-sm font-medium">{t('common.noData')}</p>
            ) : (
              modules.slice(0, 4).map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{m.name}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{m.code}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white bg-secondary px-2 py-1 rounded">{m.hours || 0}h</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="table-container bg-card border border-border shadow-sm rounded-xl">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">{t('teacher.upcomingLessons')}</h3>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-center text-slate-600 dark:text-slate-400 py-6 text-sm font-medium">
              {t('common.noData')}
            </p>
          </div>
        </div>
      </div>

      <AIAssistant role="teacher" />
    </DashboardLayout>
  );
}
