import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { BookOpen, Clock, Users, Loader2, Plus, Trash2, Sparkles, Layers } from 'lucide-react';
import { useTeacherModulesAndCohorts } from '@/hooks/useTeacherData';
import { useCreateModule, useDeleteModule } from '@/hooks/useEntityMutations';
import { useSpecialties } from '@/hooks/useDashboardData';

export default function TeacherModules() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data, isLoading } = useTeacherModulesAndCohorts();
  const { data: specialties } = useSpecialties();
  const createModule = useCreateModule();
  const deleteModule = useDeleteModule();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [hours, setHours] = useState('30');
  const [specialtyId, setSpecialtyId] = useState<string>('none');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    await createModule.mutateAsync({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      hours: Number(hours) || 0,
      specialty_id: specialtyId === 'none' ? null : specialtyId,
    });

    // Reset and close
    setName('');
    setCode('');
    setHours('30');
    setSpecialtyId('none');
    setIsAddModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا المقرر؟' : 'Are you sure you want to delete this module?')) {
      setDeletingId(id);
      try {
        await deleteModule.mutateAsync(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <DashboardLayout role="teacher">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <PageHeader 
          title={t('teacher.myModules', 'مقرراتي')} 
          breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: t('nav.modules', 'المقررات') }]} 
        />

        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>{isRtl ? 'إضافة مقرر جديد' : 'Add New Module'}</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data?.modules && data.modules.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.modules.map((m: any) => (
            <div 
              key={m.id} 
              className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{m.name}</h3>
                      <Badge variant="outline" className="mt-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {m.code}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                  >
                    {deletingId === m.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {t('table.hours', 'الحجم الساعي')}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{m.hours || 0} {isRtl ? 'ساعة' : 'hours'}</span>
                  </div>

                  {m.specialty_name && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        {isRtl ? 'التخصص' : 'Specialty'}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">{m.specialty_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-card rounded-2xl border border-border shadow-xs max-w-md mx-auto">
          <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto text-primary mb-4">
            <BookOpen className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {isRtl ? 'لا توجد مقررات دراسية مضافة حتى الآن' : 'No modules added yet'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            {isRtl ? 'يمكنك الآن إضافة مقرراتك الدراسية وتحديد عدد الساعات والتخصص بسهولة.' : 'You can now create and manage your course modules with ease.'}
          </p>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>{isRtl ? 'إضافة مقررك الأول' : 'Create First Module'}</span>
          </Button>
        </div>
      )}

      {/* Cohorts assigned if any */}
      {data?.cohorts && data.cohorts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="h-5 w-5 text-primary" />
            <span>{isRtl ? 'الدفعات المرتبطة' : 'My Cohorts'}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.cohorts.map((c: any) => (
              <div key={c.id} className="bg-card rounded-xl p-4 shadow-xs border border-border hover:border-primary/40 transition-colors">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{c.specialty_name || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{isRtl ? 'إضافة مقرر دراسي جديد' : 'Add New Module'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {isRtl ? 'أدخل معلومات المقرر ليتم ربطه بحسابك الأكاديمي مباشرة.' : 'Enter the module details to link it with your teaching profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateModule} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="module-name" className="text-xs font-semibold text-slate-900 dark:text-white">
                {isRtl ? 'اسم المقرر *' : 'Module Name *'}
              </Label>
              <Input
                id="module-name"
                placeholder={isRtl ? 'مثال: محاسبة الشركات' : 'e.g. Corporate Accounting'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="module-code" className="text-xs font-semibold text-slate-900 dark:text-white">
                  {isRtl ? 'كود المقرر *' : 'Module Code *'}
                </Label>
                <Input
                  id="module-code"
                  placeholder="Ex: COMP-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="font-mono text-sm uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="module-hours" className="text-xs font-semibold text-slate-900 dark:text-white">
                  {isRtl ? 'عدد الساعات' : 'Total Hours'}
                </Label>
                <Input
                  id="module-hours"
                  type="number"
                  min="1"
                  placeholder="30"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="module-specialty" className="text-xs font-semibold text-slate-900 dark:text-white">
                {isRtl ? 'التخصص (اختياري)' : 'Specialty (Optional)'}
              </Label>
              <Select value={specialtyId} onValueChange={setSpecialtyId}>
                <SelectTrigger id="module-specialty" className="w-full text-sm">
                  <SelectValue placeholder={isRtl ? 'اختر التخصص...' : 'Select specialty...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{isRtl ? 'بدون تخصص / عام' : 'General / None'}</SelectItem>
                  {specialties?.map((sp: any) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                disabled={createModule.isPending}
              >
                {t('common.cancel', 'إلغاء')}
              </Button>
              <Button
                type="submit"
                disabled={createModule.isPending || !name.trim() || !code.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {createModule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRtl ? 'حفظ المقرر' : 'Save Module'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
