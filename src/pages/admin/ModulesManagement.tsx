import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common/FormModal';
import { useModules, useSpecialties, useTeachers } from '@/hooks/useDashboardData';
import { useCreateModule, useUpdateModule, useDeleteModule } from '@/hooks/useEntityMutations';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
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

interface ModuleForm {
  name: string;
  code: string;
  specialty_id: string;
  teacher_id: string;
  hours: string;
}

export default function ModulesManagement() {
  const { t } = useTranslation();
  const { data: modules, isLoading } = useModules();
  const { data: specialties } = useSpecialties();
  const { data: teachers } = useTeachers();
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<typeof modules[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ModuleForm>({ 
    name: '', 
    code: '', 
    specialty_id: '', 
    teacher_id: '', 
    hours: '' 
  });

  const filteredModules = modules?.filter((m) => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const openAddModal = () => {
    setEditingModule(null);
    setFormData({ name: '', code: '', specialty_id: '', teacher_id: '', hours: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (module: typeof modules[0]) => {
    setEditingModule(module);
    const matchedTeacher = teachers?.find(t => t.id === module.teacher_id || t.user_id === module.teacher_id);
    setFormData({
      name: module.name,
      code: module.code,
      specialty_id: module.specialty_id || '',
      teacher_id: matchedTeacher ? matchedTeacher.id : (module.teacher_id || ''),
      hours: module.hours?.toString() || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) return;
    
    const specialtyId = formData.specialty_id && formData.specialty_id !== 'none' ? formData.specialty_id : null;
    const teacherId = formData.teacher_id && formData.teacher_id !== 'none' ? formData.teacher_id : null;
    const hoursVal = formData.hours ? parseInt(formData.hours) : null;

    if (editingModule) {
      await updateModule.mutateAsync({
        id: editingModule.id,
        name: formData.name.trim(),
        code: formData.code.trim(),
        specialty_id: specialtyId,
        teacher_id: teacherId,
        hours: hoursVal,
      });
    } else {
      await createModule.mutateAsync({
        name: formData.name.trim(),
        code: formData.code.trim(),
        specialty_id: specialtyId,
        teacher_id: teacherId,
        hours: hoursVal,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteModule.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.modulesManagement')}
        description={t('admin.modulesManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('nav.modules') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.addModule')}
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

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.code')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.name')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.specialty')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.hours')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.teacher')}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredModules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredModules.map((module: any) => {
                  const specialtyDisplay = 
                    module.specialty?.name || 
                    module.specialty_name || 
                    specialties?.find((s: any) => s.id === module.specialty_id)?.name || 
                    '-';
                  
                  const teacherDisplay = 
                    module.teacher?.full_name || 
                    module.teacher_name || 
                    teachers?.find((t: any) => t.id === module.teacher_id || t.user_id === module.teacher_id)?.profile?.full_name || 
                    teachers?.find((t: any) => t.id === module.teacher_id || t.user_id === module.teacher_id)?.full_name || 
                    '-';

                  return (
                    <tr key={module.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4 font-mono text-sm text-primary">{module.code}</td>
                      <td className="p-4 font-medium text-foreground">{module.name}</td>
                      <td className="p-4 text-sm text-foreground">{specialtyDisplay}</td>
                      <td className="p-4 text-sm text-foreground">{module.hours ? `${module.hours}h` : '-'}</td>
                      <td className="p-4 text-sm text-foreground">{teacherDisplay}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2 rtl:justify-start">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(module)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(module.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        title={editingModule ? `${t('common.edit')} ${t('nav.modules')}` : t('admin.addModule')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createModule.isPending || updateModule.isPending}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('table.code')} *</Label>
              <Input 
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('table.hours')}</Label>
              <Input 
                type="number" 
                value={formData.hours} 
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                min={0}
                max={500}
              />
            </div>
          </div>
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
              value={formData.specialty_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, specialty_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- {t('common.none') || 'None'} --</SelectItem>
                {specialties?.map((specialty) => (
                  <SelectItem key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('table.teacher')}</Label>
            <Select 
              value={formData.teacher_id || 'none'} 
              onValueChange={(value) => setFormData({ ...formData, teacher_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- {t('common.none') || 'None'} --</SelectItem>
                {teachers?.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.profile?.full_name || teacher.full_name || teacher.profile?.email || 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.modules')}</AlertDialogTitle>
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
