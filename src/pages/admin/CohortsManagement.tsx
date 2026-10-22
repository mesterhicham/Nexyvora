import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common/FormModal';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useCohorts, useSpecialties, usePrograms } from '@/hooks/useDashboardData';
import { useCreateCohort, useUpdateCohort, useDeleteCohort } from '@/hooks/useEntityMutations';
import { Plus, Search, Edit, Trash2, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CohortForm {
  name: string;
  specialty_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface CohortsManagementProps {
  role?: 'admin' | 'teacher';
}

export default function CohortsManagement({ role = 'admin' }: CohortsManagementProps) {
  const { t } = useTranslation();
  const { data: cohorts, isLoading } = useCohorts();
  const { data: specialties } = useSpecialties();
  const { data: programs } = usePrograms();
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();
  const deleteCohort = useDeleteCohort();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<typeof cohorts[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CohortForm>({ 
    name: '', 
    specialty_id: '', 
    start_date: '', 
    end_date: '', 
    status: 'active' 
  });

  const filteredCohorts = cohorts?.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSpecialtyName = (specialtyId: string | null) => {
    return specialties?.find(s => s.id === specialtyId)?.name || '-';
  };

  const getSpecialtyProgram = (specialtyId: string | null) => {
    const specialty = specialties?.find(s => s.id === specialtyId);
    return programs?.find(p => p.id === specialty?.program_id)?.name || '-';
  };

  const openAddModal = () => {
    setEditingCohort(null);
    setFormData({ name: '', specialty_id: '', start_date: '', end_date: '', status: 'active' });
    setIsModalOpen(true);
  };

  const openEditModal = (cohort: typeof cohorts[0]) => {
    setEditingCohort(cohort);
    setFormData({
      name: cohort.name,
      specialty_id: cohort.specialty_id || '',
      start_date: cohort.start_date || '',
      end_date: cohort.end_date || '',
      status: cohort.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    if (editingCohort) {
      await updateCohort.mutateAsync({
        id: editingCohort.id,
        name: formData.name,
        specialty_id: formData.specialty_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
      });
    } else {
      await createCohort.mutateAsync({
        name: formData.name,
        specialty_id: formData.specialty_id || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        status: formData.status,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCohort.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title={t('admin.cohortsManagement')}
        description={t('admin.cohortsManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: `/${role}` }, { label: t('nav.cohorts') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.addCohort')}
          </Button>
        }
      />

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
        <Input 
          placeholder={`${t('common.search')}...`} 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-10 rtl:pl-3 rtl:pr-10" 
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 shadow-md border border-border">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))
        ) : filteredCohorts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          filteredCohorts.map((cohort) => (
            <div key={cohort.id} className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-foreground">{cohort.name}</h3>
                <StatusBadge 
                  status={t(`status.${cohort.status || 'active'}`)} 
                  variant={getStatusVariant(cohort.status || 'active')} 
                />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('table.program')}</span>
                  <span className="font-medium text-foreground">{getSpecialtyProgram(cohort.specialty_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('table.specialty')}</span>
                  <span className="font-medium text-foreground">{getSpecialtyName(cohort.specialty_id)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {t('table.startDate')}
                  </span>
                  <span className="font-medium text-foreground">{cohort.start_date || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {t('table.endDate')}
                  </span>
                  <span className="font-medium text-foreground">{cohort.end_date || '-'}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(cohort)}>
                  <Edit className="h-4 w-4 mr-1 rtl:mr-0 rtl:ml-1" />
                  {t('common.edit')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(cohort.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <FormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        title={editingCohort ? `${t('common.edit')} ${t('nav.cohorts')}` : t('admin.addCohort')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createCohort.isPending || updateCohort.isPending}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('table.name')} *</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('table.specialty')}</Label>
            <Select 
              value={formData.specialty_id} 
              onValueChange={(value) => setFormData({ ...formData, specialty_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                {specialties?.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('table.startDate')}</Label>
              <Input 
                type="date" 
                value={formData.start_date} 
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('table.endDate')}</Label>
              <Input 
                type="date" 
                value={formData.end_date} 
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('table.status')}</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('status.active')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
                <SelectItem value="upcoming">{t('status.upcoming')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.cohorts')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.deleteConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
