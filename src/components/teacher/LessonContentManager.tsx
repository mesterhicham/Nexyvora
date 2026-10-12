import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Trash2, Upload, Video, FileText, Loader2, GripVertical } from 'lucide-react';
import { useLessonContent, useUploadLessonContent, useDeleteLessonContent, useReorderLessonContent } from '@/hooks/useTeacherData';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LessonContentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: { id: string; title: string } | null;
}

interface ContentForm {
  title: string;
  content_type: 'video' | 'pdf';
  file: File | null;
}

const initialForm: ContentForm = {
  title: '',
  content_type: 'video',
  file: null,
};

function SortableContentRow({ content, onDelete }: { content: any; onDelete: (id: string) => void }) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: content.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {content.content_type === 'video' ? (
            <Video className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">{content.title}</span>
        </div>
      </TableCell>
      <TableCell>
        {content.content_type === 'video' ? (isRtl ? 'فيديو' : 'Video') : 'PDF'}
      </TableCell>
      <TableCell>{formatDuration(content.duration_seconds)}</TableCell>
      <TableCell className="text-right">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onDelete(content.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function LessonContentManager({ open, onOpenChange, lesson }: LessonContentManagerProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContentForm>(initialForm);
  const [isUploading, setIsUploading] = useState(false);

  const { data: contents, isLoading } = useLessonContent(lesson?.id || '');
  const uploadContent = useUploadLessonContent();
  const deleteContent = useDeleteLessonContent();
  const reorderContent = useReorderLessonContent();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const isVideo = file.type.startsWith('video/');
      const isPdf = file.type === 'application/pdf';
      
      if (!isVideo && !isPdf) {
        toast.error(isRtl ? 'يرجى اختيار ملف فيديو أو PDF' : 'Please select a video or PDF file');
        return;
      }
      
      // Max 100MB
      if (file.size > 100 * 1024 * 1024) {
        toast.error(isRtl ? 'حجم الملف يجب أن يكون أقل من 100MB' : 'File size must be under 100MB');
        return;
      }
      
      setForm({
        ...form,
        file,
        content_type: isVideo ? 'video' : 'pdf',
        title: form.title || file.name.replace(/\.[^/.]+$/, ''),
      });
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!form.file || !form.title || !lesson?.id) {
      toast.error(isRtl ? 'يرجى ملء جميع الحقول' : 'Please fill all required fields');
      return;
    }

    setIsUploading(true);
    try {
      let duration = null;
      if (form.content_type === 'video') {
        duration = await getVideoDuration(form.file);
      }

      await uploadContent.mutateAsync({
        lessonId: lesson.id,
        title: form.title,
        contentType: form.content_type,
        file: form.file,
        durationSeconds: duration,
        orderIndex: (contents?.length || 0),
      });

      setForm(initialForm);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteContent.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && contents) {
      const oldIndex = contents.findIndex((c: any) => c.id === active.id);
      const newIndex = contents.findIndex((c: any) => c.id === over.id);
      
      const reorderedItems = arrayMove(contents, oldIndex, newIndex);
      const updates = reorderedItems.map((item: any, index: number) => ({
        id: item.id,
        order_index: index,
      }));
      
      await reorderContent.mutateAsync(updates);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRtl ? 'إدارة محتوى الدرس:' : 'Manage Lesson Content:'} {lesson?.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {isRtl ? 'إضافة محتوى' : 'Add Content'}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : contents && contents.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>{isRtl ? 'العنوان' : 'Title'}</TableHead>
                        <TableHead>{isRtl ? 'النوع' : 'Type'}</TableHead>
                        <TableHead>{isRtl ? 'المدة' : 'Duration'}</TableHead>
                        <TableHead className="text-right">{isRtl ? 'الإجراءات' : 'Actions'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext items={contents.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
                        {contents.map((content: any) => (
                          <SortableContentRow
                            key={content.id}
                            content={content}
                            onDelete={openDeleteDialog}
                          />
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                {isRtl ? 'لا يوجد محتوى بعد. قم بإضافة فيديوهات أو ملفات PDF.' : 'No content yet. Add videos or PDF documents.'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Content Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRtl ? 'إضافة محتوى جديد' : 'Add New Content'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRtl ? 'عنوان المحتوى *' : 'Content Title *'}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isRtl ? 'مثال: المقدمة' : 'e.g. Introduction'}
              />
            </div>
            
            <div>
              <Label>{isRtl ? 'نوع المحتوى' : 'Content Type'}</Label>
              <Select 
                value={form.content_type} 
                onValueChange={(v: 'video' | 'pdf') => setForm({ ...form, content_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      {isRtl ? 'فيديو' : 'Video'}
                    </div>
                  </SelectItem>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {isRtl ? 'ملف PDF' : 'PDF Document'}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{isRtl ? 'الملف *' : 'File *'}</Label>
              <div className="mt-2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    {form.file ? (
                      <p className="text-sm text-foreground font-medium">{form.file.name}</p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {isRtl ? `اضغط لرفع ${form.content_type === 'video' ? 'فيديو' : 'ملف PDF'}` : `Click to upload ${form.content_type === 'video' ? 'Video' : 'PDF'}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isRtl ? 'الحد الأقصى: 100MB' : 'Max size: 100MB'}
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept={form.content_type === 'video' ? 'video/*' : 'application/pdf'}
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleUpload} disabled={isUploading || !form.file || !form.title}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRtl ? 'رفع المحتوى' : 'Upload Content'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRtl ? 'حذف المحتوى' : 'Delete Content'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRtl ? 'هل أنت متأكد من حذف هذا المحتوى؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this content? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRtl ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground"
            >
              {isRtl ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
