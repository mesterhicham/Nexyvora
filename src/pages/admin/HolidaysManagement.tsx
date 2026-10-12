import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FormModal } from '@/components/common/FormModal';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { useHolidays, useCreateHoliday, useUpdateHoliday, useDeleteHoliday } from '@/hooks/useAdminFeatures';
import { Plus, Edit, Trash2, Calendar, CalendarDays, PartyPopper, Coffee } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

interface HolidayForm {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  type: string;
  is_recurring: boolean;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'holiday': return <CalendarDays className="h-5 w-5" />;
    case 'event': return <PartyPopper className="h-5 w-5" />;
    case 'break': return <Coffee className="h-5 w-5" />;
    default: return <Calendar className="h-5 w-5" />;
  }
};

export default function HolidaysManagement() {
  const { t } = useTranslation();
  const { data: holidays, isLoading } = useHolidays();
  const createHoliday = useCreateHoliday();
  const updateHoliday = useUpdateHoliday();
  const deleteHoliday = useDeleteHoliday();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<typeof holidays[0] | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HolidayForm>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    type: 'holiday',
    is_recurring: false,
  });

  const openAddModal = () => {
    setEditingHoliday(null);
    setFormData({ name: '', description: '', start_date: '', end_date: '', type: 'holiday', is_recurring: false });
    setIsModalOpen(true);
  };

  const openEditModal = (holiday: typeof holidays[0]) => {
    setEditingHoliday(holiday);
    setFormData({
      name: holiday.name,
      description: holiday.description || '',
      start_date: holiday.start_date,
      end_date: holiday.end_date,
      type: holiday.type,
      is_recurring: holiday.is_recurring || false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.start_date || !formData.end_date) return;
    
    if (editingHoliday) {
      await updateHoliday.mutateAsync({ id: editingHoliday.id, ...formData });
    } else {
      await createHoliday.mutateAsync(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteHoliday.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString();
    const endDate = new Date(end).toLocaleDateString();
    return start === end ? startDate : `${startDate} - ${endDate}`;
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.holidaysManagement')}
        description={t('admin.holidaysManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('admin.holidays') }]}
        actions={
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('admin.addHoliday')}
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-6 shadow-md border border-border">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : holidays?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('common.noData')}
          </div>
        ) : (
          holidays?.map((holiday) => (
            <div key={holiday.id} className="bg-card rounded-xl p-6 shadow-md border border-border hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${
                    holiday.type === 'holiday' ? 'bg-primary/10 text-primary' :
                    holiday.type === 'event' ? 'bg-accent/10 text-accent' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {getTypeIcon(holiday.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{holiday.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateRange(holiday.start_date, holiday.end_date)}
                    </p>
                  </div>
                </div>
                <StatusBadge 
                  status={t(`admin.${holiday.type}`)} 
                  variant={holiday.type === 'holiday' ? 'success' : holiday.type === 'event' ? 'info' : 'default'} 
                />
              </div>
              
              {holiday.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{holiday.description}</p>
              )}
              
              {holiday.is_recurring && (
                <p className="text-xs text-accent mb-4">🔄 {t('admin.recurring')}</p>
              )}
              
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditModal(holiday)}>
                  <Edit className="h-4 w-4 mr-1" />
                  {t('common.edit')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(holiday.id)}
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
        title={editingHoliday ? t('admin.editHoliday') : t('admin.addHoliday')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createHoliday.isPending || updateHoliday.isPending}
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
            <Label>{t('common.description')}</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('table.startDate')} *</Label>
              <Input 
                type="date" 
                value={formData.start_date} 
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('table.endDate')} *</Label>
              <Input 
                type="date" 
                value={formData.end_date} 
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('admin.type')}</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">{t('admin.holiday')}</SelectItem>
                <SelectItem value="event">{t('admin.event')}</SelectItem>
                <SelectItem value="break">{t('admin.break')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>{t('admin.recurring')}</Label>
            <Switch
              checked={formData.is_recurring}
              onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
            />
          </div>
        </div>
      </FormModal>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('admin.holiday')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.deleteConfirmation')}</AlertDialogDescription>
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
