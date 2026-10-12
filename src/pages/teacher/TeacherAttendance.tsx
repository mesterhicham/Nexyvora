import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { students } from '@/data/mockData';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function TeacherAttendance() {
  const { t } = useTranslation();

  return (
    <DashboardLayout role="teacher">
      <PageHeader title={t('nav.attendance')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: t('nav.attendance') }]} />
      <div className="table-container">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-semibold">{t('teacher.todayAttendance')} - Advanced Programming</h3>
          <span className="text-sm text-muted-foreground">Dec 30, 2024</span>
        </div>
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.name')}</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.status')}</th>
              <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {students.filter(s => s.status === 'active').slice(0, 6).map((s) => (
              <tr key={s.id} className="border-b border-border">
                <td className="p-4"><p className="font-medium">{s.name}</p><p className="text-sm text-muted-foreground">{s.email}</p></td>
                <td className="p-4"><StatusBadge status={t('status.present')} variant="success" /></td>
                <td className="p-4">
                  <div className="flex justify-end gap-2 rtl:justify-start">
                    <Button variant="ghost" size="icon" className="text-success"><CheckCircle className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-warning"><Clock className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive"><XCircle className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
