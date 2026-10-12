import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const enrollmentData = [
  { month: 'Jan', students: 45 },
  { month: 'Feb', students: 52 },
  { month: 'Mar', students: 48 },
  { month: 'Apr', students: 61 },
  { month: 'May', students: 55 },
  { month: 'Jun', students: 67 },
];

const programDistribution = [
  { name: 'Technician', value: 120, color: 'hsl(217, 91%, 30%)' },
  { name: 'Specialized Technician', value: 180, color: 'hsl(172, 66%, 40%)' },
];

const specialtyData = [
  { name: 'Software Dev', students: 45 },
  { name: 'Network Admin', students: 30 },
  { name: 'Database', students: 35 },
  { name: 'Web Dev', students: 40 },
  { name: 'Cybersecurity', students: 25 },
  { name: 'Cloud', students: 30 },
];

const graduationTrend = [
  { year: '2020', graduates: 45 },
  { year: '2021', graduates: 62 },
  { year: '2022', graduates: 78 },
  { year: '2023', graduates: 85 },
  { year: '2024', graduates: 55 },
];

export default function ReportsPage() {
  const { t } = useTranslation();

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.reportsStats')}
        description={t('admin.reportsStatsDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('nav.reports') }]}
      />

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.monthlyEnrollments')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.programDistribution')}</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={programDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {programDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.studentsBySpecialty')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialtyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="students" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('admin.graduationTrend')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graduationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="graduates" stroke="hsl(var(--success))" strokeWidth={3} dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
