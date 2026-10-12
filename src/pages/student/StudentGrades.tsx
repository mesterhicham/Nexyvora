import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { grades, attendanceRecords } from '@/data/mockData';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';

export default function StudentGrades() {
  const { t } = useTranslation();

  return (
    <DashboardLayout role="student">
      <PageHeader title={t('nav.grades')} breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: t('nav.grades') }]} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="table-container">
          <div className="p-4 border-b border-border"><h3 className="font-semibold">{t('student.myGrades')}</h3></div>
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.assignment')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.module')}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('table.grade')}</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => (
                <tr key={g.id} className="border-b border-border">
                  <td className="p-4 font-medium">{g.assignment}</td>
                  <td className="p-4 text-sm text-muted-foreground">{g.module}</td>
                  <td className="p-4 text-right font-bold text-success">{g.grade}/{g.maxGrade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-container">
          <div className="p-4 border-b border-border"><h3 className="font-semibold">{t('student.attendanceRecord')}</h3></div>
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.date')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.module')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((a) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="p-4">{a.date}</td>
                  <td className="p-4 text-sm">{a.module}</td>
                  <td className="p-4"><StatusBadge status={t(`status.${a.status}`)} variant={getStatusVariant(a.status)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
