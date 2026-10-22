import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormModal } from '@/components/common/FormModal';
import { usePrograms } from '@/hooks/useDashboardData';
import { useCreateProgram, useUpdateProgram, useDeleteProgram } from '@/hooks/useEntityMutations';
import { uploadService } from '@/services/apiService';
import { 
  Plus, 
  Edit, 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2,
  ExternalLink
} from 'lucide-react';
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
import { toast } from 'sonner';

interface ProgramForm {
  name: string;
  duration: string;
  description: string;
  image_url: string;
}

interface ProgramsManagementProps {
  role?: 'admin' | 'teacher';
}

export default function ProgramsManagement({ role = 'admin' }: ProgramsManagementProps) {
  const { t } = useTranslation();
  const { data: programs, isLoading } = usePrograms();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const deleteProgram = useDeleteProgram();
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProgramForm>({ 
    name: '', 
    duration: '', 
    description: '', 
    image_url: '' 
  });

  const openAddModal = () => {
    setEditingProgram(null);
    setFormData({ name: '', duration: '', description: '', image_url: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (program: any) => {
    setEditingProgram(program);
    setFormData({
      name: program.name || '',
      duration: program.duration || '',
      description: program.description || '',
      image_url: program.image_url || '',
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadService.uploadFile(file);
      const uploadedUrl = res.url || res.fileUrl || res.path;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
        toast.success(t('admin.uploadProgramImage', 'Program image uploaded successfully!'));
      } else {
        toast.error('Failed to get uploaded file URL');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      toast.error(`Upload failed: ${err.message || 'Server error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Program name is required');
      return;
    }
    
    const payload = {
      name: formData.name.trim(),
      duration: formData.duration?.trim() || null,
      description: formData.description?.trim() || null,
      image_url: formData.image_url?.trim() || null,
    };

    if (editingProgram) {
      await updateProgram.mutateAsync({
        id: editingProgram.id,
        ...payload,
      });
    } else {
      await createProgram.mutateAsync(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProgram.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title={t('admin.programsManagement')}
        description={t('admin.programsManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: `/${role}` }, { label: t('nav.programs') }]}
        actions={
          <Button onClick={openAddModal} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4 rtl:rotate-180" />
            {t('admin.addProgram')}
          </Button>
        }
      />

      <div className="grid md:grid-cols-2 gap-6 p-1">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 shadow-md border border-border">
              <Skeleton className="h-44 w-full rounded-xl mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ))
        ) : programs?.length === 0 ? (
          <div className="col-span-2 text-center py-16 bg-card rounded-2xl border border-dashed border-border/80">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{t('common.noData')}</h3>
            <p className="text-sm text-muted-foreground mb-4">Add your first academic program with cover image and details</p>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('admin.addProgram')}
            </Button>
          </div>
        ) : (
          programs?.map((program: any) => (
            <div 
              key={program.id} 
              className="group bg-card rounded-2xl overflow-hidden shadow-md border border-border hover:shadow-xl hover:border-primary/40 transition-all duration-300 flex flex-col"
            >
              {/* Program Cover Image */}
              <div className="relative h-48 w-full bg-muted overflow-hidden border-b border-border/60">
                {program.image_url ? (
                  <img
                    src={program.image_url}
                    alt={program.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // fallback if image fails to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-muted text-primary/50">
                    <GraduationCap className="h-16 w-16 mb-2 opacity-60" />
                    <span className="text-xs font-medium text-muted-foreground">No program cover image</span>
                  </div>
                )}

                {/* Duration Badge overlay */}
                {program.duration && (
                  <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3">
                    <Badge variant="secondary" className="backdrop-blur-md bg-background/80 shadow-sm gap-1.5 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {program.duration}
                    </Badge>
                  </div>
                )}

                {/* Action Buttons overlay */}
                <div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 flex items-center gap-1.5">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => openEditModal(program)}
                    className="h-8 backdrop-blur-md bg-background/90 shadow-sm gap-1.5 font-medium hover:bg-background"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 backdrop-blur-md bg-background/90 shadow-sm text-destructive hover:bg-background hover:text-destructive"
                    onClick={() => setDeleteId(program.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2 leading-snug">
                    {program.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                    {program.description || 'No description provided for this program.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
                  <div className="p-3 bg-secondary/40 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">{t('nav.specialties')}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {program.specialties ?? '-'}
                    </p>
                  </div>

                  <div className="p-3 bg-secondary/40 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 text-accent" />
                      <span className="text-xs font-medium">{t('nav.students')}</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {program.students ?? '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Program Modal */}
      <FormModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        title={editingProgram ? `${t('common.edit')} ${t('nav.programs')}` : t('admin.addProgram')} 
        onSubmit={handleSubmit} 
        submitLabel={t('common.save')}
        isLoading={createProgram.isPending || updateProgram.isPending || isUploading}
      >
        <div className="space-y-5 max-h-[72vh] overflow-y-auto px-1">
          {/* Program Image Section */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span>{t('admin.programImage', 'Program Image')}</span>
              {formData.image_url && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  {t('admin.removeProgramImage', 'Remove Image')}
                </button>
              )}
            </Label>

            {/* Image Preview Box */}
            <div className="relative rounded-xl border border-dashed border-border/80 bg-muted/30 p-2 overflow-hidden">
              {formData.image_url ? (
                <div className="relative rounded-lg overflow-hidden h-40 w-full group">
                  <img
                    src={formData.image_url}
                    alt="Program preview"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.opacity = '0.3';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="gap-1.5 text-xs shadow-md"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="gap-1.5 text-xs shadow-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-36 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 rounded-lg transition-colors text-center px-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                    {isUploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">
                    {isUploading ? 'Uploading image...' : t('admin.uploadProgramImage', 'Upload Program Cover Image')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.programImageHint', 'PNG, JPG or WebP (max 5MB)')}
                  </p>
                </div>
              )}
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* Upload Button + Image URL input */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="gap-1.5 shrink-0"
              >
                {isUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {t('admin.uploadProgramImage', 'Browse Image')}
              </Button>
              <Input
                placeholder="Or paste external image URL..."
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="text-xs"
              />
            </div>
          </div>

          {/* Program Name */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('table.name')} *</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Informatique & Ingénierie Logicielle"
              maxLength={100}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{t('table.duration')}</Label>
            <Input 
              value={formData.duration} 
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g. 3 Ans, 2 Years"
              maxLength={50}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Description</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the program and objectives..."
              rows={3}
              maxLength={500}
            />
          </div>
        </div>
      </FormModal>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.programs')}</AlertDialogTitle>
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
