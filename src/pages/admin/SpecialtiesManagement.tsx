import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common/FormModal';
import { useSpecialties, usePrograms } from '@/hooks/useDashboardData';
import { useCreateSpecialty, useUpdateSpecialty, useDeleteSpecialty, useCreateProgram } from '@/hooks/useEntityMutations';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { tr } from '@/utils/tr';
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

import { Textarea } from '@/components/ui/textarea';

interface SpecialtyForm {
  name: string;
  program_id: string;
  description: string;
}

interface SpecialtiesManagementProps {
  role?: 'admin' | 'teacher';
}

export default function SpecialtiesManagement({ role = 'admin' }: SpecialtiesManagementProps) {
  const { t } = useTranslation();
  const { data: specialties, isLoading } = useSpecialties();
  const { data: programs } = usePrograms();
  const createSpecialty = useCreateSpecialty();
  const updateSpecialty = useUpdateSpecialty();
  const deleteSpecialty = useDeleteSpecialty();
  const createProgram = useCreateProgram();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<typeof specialties[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SpecialtyForm>({ name: '', program_id: '', description: '' });

  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [newProgramName, setNewProgramName] = useState('');

  const filteredSpecialties = specialties?.filter((s) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getProgramName = (programId: string | null) => {
    return programs?.find(p => p.id === programId)?.name || '-';
  };

  const openAddModal = () => {
    setEditingSpecialty(null);
    setFormData({ name: '', program_id: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (specialty: typeof specialties[0]) => {
    setEditingSpecialty(specialty);
    setFormData({
      name: specialty.name || '',
      program_id: specialty.program_id || '',
      description: specialty.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    
    const payload = {
      name: formData.name.trim(),
      program_id: (formData.program_id && formData.program_id !== 'none') ? formData.program_id : null,
      description: formData.description?.trim() || null,
    };

    if (editingSpecialty) {
      await updateSpecialty.mutateAsync({
        id: editingSpecialty.id,
        ...payload,
      });
    } else {
      await createSpecialty.mutateAsync(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSpecialty.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title={t('admin.specialtiesManagement')}
        description={t('admin.specialtiesManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: `/${role}` }, { label: t('nav.specialties') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.addSpecialty')}
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
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.name')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.program')}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredSpecialties.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredSpecialties.map((specialty) => (
                  <tr key={specialty.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="p-4 font-medium text-foreground">{specialty.name}</td>
                    <td className="p-4 text-sm text-foreground">{getProgramName(specialty.program_id)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 rtl:justify-start">
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(specialty)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(specialty.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        title={editingSpecialty ? `${t('common.edit')} ${t('nav.specialties')}` : t('admin.addSpecialty')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createSpecialty.isPending || updateSpecialty.isPending}
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
            <div className="flex items-center justify-between">
              <Label>{t('table.program')} <span className="text-xs text-muted-foreground font-normal">({tr("اختياري", "Optional")})</span></Label>
              <button
                type="button"
                onClick={() => setIsAddProgramOpen(!isAddProgramOpen)}
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                {tr("إضافة برنامج جديد", "+ Add Program")}
              </button>
            </div>

            {isAddProgramOpen && (
              <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                <Label className="text-xs font-medium">{tr("اسم البرنامج الأكاديمي الجديد", "New Program Name")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={newProgramName}
                    onChange={(e) => setNewProgramName(e.target.value)}
                    placeholder={tr("مثال: دبلوم الذكاء الاصطناعي، بكالوريوس...", "e.g. AI Diploma, Bachelor...")}
                    className="h-8 text-xs bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    disabled={!newProgramName.trim() || createProgram.isPending}
                    onClick={async () => {
                      if (!newProgramName.trim()) return;
                      try {
                        const res = await createProgram.mutateAsync({ name: newProgramName.trim() } as any);
                        if (res?.id) {
                          setFormData(prev => ({ ...prev, program_id: res.id }));
                        }
                        setNewProgramName('');
                        setIsAddProgramOpen(false);
                      } catch (e) {
                        // handled by mutation toast
                      }
                    }}
                  >
                    {createProgram.isPending ? tr("جاري الحفظ...", "Saving...") : tr("حفظ", "Save")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs shrink-0"
                    onClick={() => setIsAddProgramOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            )}

            <Select 
              value={formData.program_id} 
              onValueChange={(value) => setFormData({ ...formData, program_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.select')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- {tr("بدون برنامج (تخصص مستقل / عام)", "None (Standalone Specialty)")} --</SelectItem>
                {programs?.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of this specialty..."
              rows={2}
              maxLength={300}
            />
          </div>
        </div>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.specialties')}</AlertDialogTitle>
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
