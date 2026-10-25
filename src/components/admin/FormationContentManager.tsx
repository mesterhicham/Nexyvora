import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  FileText, 
  Upload, 
  Trash2, 
  Edit, 
  Plus, 
  Save,
  X,
  GripVertical,
  FolderOpen,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Check,
  Sparkles
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Formation, 
  FormationContent, 
  useFormationContent,
  useAddFormationContent,
  useUpdateFormationContent,
  useDeleteFormationContent,
  useReorderFormationContent,
} from '@/hooks/useFormations';
import { uploadService } from '@/services/apiService';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FormationContentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation: Formation | null;
}

interface SortableContentItemProps {
  content: FormationContent;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}

function SortableContentItem({ content, index, onDelete, onEdit }: SortableContentItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: content.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3.5 bg-card border rounded-xl group hover:border-primary/50 transition-all ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : 'shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-50 group-hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className={`p-2.5 rounded-xl shrink-0 ${
          content.content_type === 'video' 
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
            : content.content_type === 'pdf' 
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        }`}>
          {content.content_type === 'video' ? (
            <Video className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{index + 1}. {content.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Badge variant="outline" className="text-[10px] font-mono uppercase px-1.5 py-0 rounded-md">
              {content.content_type}
            </Badge>
            {content.duration_seconds ? (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="h-3 w-3" />
                {formatDuration(content.duration_seconds)}
              </span>
            ) : null}
            {content.file_url && (
              <a 
                href={content.file_url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] text-primary hover:underline truncate max-w-[200px]"
              >
                عرض الملف (View)
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0 rounded-lg">
          <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 rounded-lg">
          <Trash2 className="h-4 w-4 text-destructive hover:bg-destructive/10" />
        </Button>
      </div>
    </div>
  );
}

interface UploadQueueItem {
  id: string;
  file: File;
  title: string;
  content_type: 'video' | 'pdf';
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  errorMessage?: string;
}

export function FormationContentManager({ open, onOpenChange, formation }: FormationContentManagerProps) {
  const { data: content, refetch } = useFormationContent(formation?.id);
  const addContent = useAddFormationContent();
  const updateContent = useUpdateFormationContent();
  const deleteContent = useDeleteFormationContent();
  const reorderContent = useReorderFormationContent();

  const [activeTab, setActiveTab] = useState<'content' | 'upload'>('content');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingContent, setEditingContent] = useState<FormationContent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<FormationContent | null>(null);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!formation || !content || !over || active.id === over.id) return;

    const oldIndex = content.findIndex((item) => item.id === active.id);
    const newIndex = content.findIndex((item) => item.id === over.id);
    const newOrder = arrayMove(content, oldIndex, newIndex);
    
    const items = newOrder.map((item, index) => ({ id: item.id, order_index: index + 1 }));
    reorderContent.mutate({ formationId: formation.id, items });
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(0), 3000);
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          clearTimeout(timer);
          try {
            window.URL.revokeObjectURL(video.src);
          } catch (e) {}
          resolve(Math.round(video.duration) || 0);
        };
        video.onerror = () => {
          clearTimeout(timer);
          resolve(0);
        };
        video.src = URL.createObjectURL(file);
      } catch (e) {
        clearTimeout(timer);
        resolve(0);
      }
    });
  };

  const handleFileSelect = (files: FileList | null, type: 'video' | 'pdf') => {
    if (!files || files.length === 0) return;

    const newItems: UploadQueueItem[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, ''),
      content_type: type,
      status: 'pending' as const,
      progress: 0,
    }));

    setUploadQueue((prev) => [...prev, ...newItems]);
    setActiveTab('upload');
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQueueItemTitle = (id: string, title: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item))
    );
  };

  const uploadSingleItem = async (itemId: string) => {
    if (!formation) return;
    const item = uploadQueue.find(q => q.id === itemId);
    if (!item || item.status === 'uploading') return;

    setIsUploading(true);
    setUploadQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'uploading', progress: 5 } : q));

    try {
      const uploadResponse = await uploadService.uploadFile(item.file, (percent) => {
        setUploadQueue(prev => prev.map(q => q.id === itemId ? { ...q, progress: Math.max(5, percent) } : q));
      });
      const fileUrl = uploadResponse.url;

      let duration: number | null = null;
      if (item.content_type === 'video') {
        duration = await getVideoDuration(item.file);
      }

      const currentContentCount = content?.length || 0;
      await addContent.mutateAsync({
        formation_id: formation.id,
        title: item.title,
        content_type: item.content_type,
        file_url: fileUrl,
        duration_seconds: duration,
        quiz_id: null,
        order_index: currentContentCount + 1,
      });

      setUploadQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'completed', progress: 100 } : q));
      toast.success(`تم حفظ "${item.title}" بنجاح في قاعدة البيانات`);
      refetch();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'فشل الرفع';
      setUploadQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'error', errorMessage: msg } : q));
      toast.error(`فشل حفظ "${item.title}": ${msg}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(q => q.status !== 'completed'));
      }, 3000);
    }
  };

  const uploadAllContent = async () => {
    if (!formation || uploadQueue.length === 0) return;
    setIsUploading(true);

    const pendingItems = uploadQueue.filter(q => q.status === 'pending' || q.status === 'error');
    if (pendingItems.length === 0) {
      setIsUploading(false);
      return;
    }

    const currentContentCount = content?.length || 0;
    let successCount = 0;

    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 5 } : q));

      try {
        const uploadResponse = await uploadService.uploadFile(item.file, (percent) => {
          setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, progress: Math.max(5, percent) } : q));
        });
        const fileUrl = uploadResponse.url;

        let duration: number | null = null;
        if (item.content_type === 'video') {
          duration = await getVideoDuration(item.file);
        }

        await addContent.mutateAsync({
          formation_id: formation.id,
          title: item.title,
          content_type: item.content_type,
          file_url: fileUrl,
          duration_seconds: duration,
          quiz_id: null,
          order_index: currentContentCount + i + 1,
        });

        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
        successCount++;
      } catch (error: any) {
        const msg = error.response?.data?.error || error.message || 'فشل الرفع';
        setUploadQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', errorMessage: msg } : q));
        toast.error(`فشل رفع "${item.title}": ${msg}`);
      }
    }

    setIsUploading(false);
    if (successCount > 0) {
      toast.success(`تم حفظ ${successCount} ملفات بنجاح في قاعدة البيانات`);
      refetch();
    }
    setTimeout(() => {
      setUploadQueue(prev => prev.filter(q => q.status !== 'completed'));
    }, 3000);
  };

  const handleDelete = async () => {
    if (!deleteConfirm || !formation) return;
    await deleteContent.mutateAsync({ id: deleteConfirm.id, formationId: formation.id });
    setDeleteConfirm(null);
  };

  const handleUpdateTitle = async () => {
    if (!editingContent || !formation || !editTitle.trim()) return;
    
    try {
        await updateContent.mutateAsync({ 
          id: editingContent.id, 
          title: editTitle.trim(),
          content_type: editingContent.content_type,
          file_url: editingContent.file_url,
          duration_seconds: editingContent.duration_seconds,
          order_index: editingContent.order_index,
          quiz_id: editingContent.quiz_id
        });
        setEditingContent(null);
        refetch();
    } catch (error) {
        // Error toast handled by hook
    }
  };

  const videoCount = content?.filter(c => c.content_type === 'video').length || 0;
  const pdfCount = content?.filter(c => c.content_type === 'pdf').length || 0;
  const totalDuration = content?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0;
  const pendingQueueCount = uploadQueue.filter(q => q.status === 'pending' || q.status === 'error').length;

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl sm:rounded-2xl border-border/80 shadow-2xl bg-background">
          {/* Sticky Dialog Header */}
          <DialogHeader className="px-6 py-4 border-b border-border bg-slate-50/70 dark:bg-slate-900/70 backdrop-blur-md shrink-0 flex flex-col space-y-1 text-left rtl:text-right">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground truncate">
                  إدارة المحتوى والدروس — {formation?.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  رفع وإدارة دروس الفيديو، ملفات PDF، وإعادة ترتيب المحتوى التعليمي
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Top Quick Stats Bar */}
          <div className="px-6 pt-4 pb-2 shrink-0">
            <div className="grid grid-cols-4 gap-3">
              <Card className="rounded-xl border-slate-200/80 dark:border-slate-800 shadow-xs">
                <CardContent className="p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-foreground">{content?.length || 0}</div>
                  <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">إجمالي المحتوى</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-blue-200/80 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs">
                <CardContent className="p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{videoCount}</div>
                  <p className="text-[11px] font-semibold text-blue-700/80 dark:text-blue-300/80 mt-0.5">فيديوهات (Videos)</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs">
                <CardContent className="p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{pdfCount}</div>
                  <p className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-300/80 mt-0.5">ملفات PDF</p>
                </CardContent>
              </Card>
              <Card className="rounded-xl border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-xs">
                <CardContent className="p-3 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatTotalDuration(totalDuration)}</div>
                  <p className="text-[11px] font-semibold text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">مدة الفيديوهات</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Middle Body with Tabs */}
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="flex-1 flex flex-col min-h-0 px-6 pb-2">
            <TabsList className="w-full shrink-0 grid grid-cols-2 rounded-xl p-1 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger value="content" className="rounded-lg text-xs font-bold gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>المحتوى الحالي (Current Content)</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] rounded-md font-mono">
                  {content?.length || 0}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upload" className="rounded-lg text-xs font-bold gap-2">
                <Upload className="h-4 w-4" />
                <span>رفع ملفات جديدة (Upload New)</span>
                {pendingQueueCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground px-1.5 py-0 text-[10px] rounded-md font-mono">
                    {pendingQueueCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Current Content */}
            <TabsContent value="content" className="flex-1 min-h-0 mt-3 pt-1">
              <ScrollArea className="h-[360px] pr-3">
                {!content || content.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/60 mb-3" />
                    <p className="text-sm font-bold text-foreground">لا يوجد محتوى في هذا التكوين بعد</p>
                    <p className="text-xs text-muted-foreground mt-1">اضغط على تبويب "رفع ملفات جديدة" لإضافة فيديوهات وملفات PDF</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 rounded-xl gap-1.5 text-xs font-bold"
                    >
                      <Plus className="h-4 w-4" />
                      <span>إضافة محتوى الآن</span>
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={content.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2.5 pb-2">
                        {content.map((item, index) => (
                          <SortableContentItem
                            key={item.id}
                            content={item}
                            index={index}
                            onDelete={() => setDeleteConfirm(item)}
                            onEdit={() => {
                              setEditingContent(item);
                              setEditTitle(item.title);
                            }}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Tab 2: Upload Queue */}
            <TabsContent value="upload" className="flex-1 min-h-0 mt-3 pt-1 flex flex-col space-y-3">
              {/* Select Buttons Bar */}
              <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, 'video')}
                  />
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files, 'pdf')}
                  />
                  <Button 
                    type="button"
                    variant="outline" 
                    className="rounded-xl h-9 text-xs font-bold gap-2 border-blue-200 dark:border-blue-900/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Video className="h-4 w-4 text-blue-500" />
                    <span>إضافة فيديوهات (Add Videos)</span>
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="rounded-xl h-9 text-xs font-bold gap-2 border-amber-200 dark:border-amber-900/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span>إضافة ملفات PDF (Add PDFs)</span>
                  </Button>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  الحد الأقصى لكل ملف: 300MB
                </span>
              </div>

              {/* Alert banner if items pending */}
              {pendingQueueCount > 0 && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>لديك {pendingQueueCount} ملفات جاهزة للرفع. اضغط على زر "بدء رفع وحفظ الكل" لحفظها في التكوين.</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={uploadAllContent}
                    disabled={isUploading}
                    className="rounded-lg h-7 px-3 text-xs font-bold shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>رفع الآن</span>
                  </Button>
                </div>
              )}

              {/* Queue Items List */}
              <ScrollArea className="h-[270px] pr-3 flex-1">
                {uploadQueue.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-2xl border-slate-200 dark:border-slate-800">
                    <Upload className="h-10 w-10 text-muted-foreground/60 mb-2" />
                    <p className="text-sm font-bold text-foreground">لا توجد ملفات في قائمة الانتظار</p>
                    <p className="text-xs text-muted-foreground mt-1">انقر على الأزرار أعلاه لاختيار فيديوهات أو ملفات PDF من جهازك</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 pb-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3.5 border rounded-xl transition-all shadow-xs ${
                          item.status === 'completed' 
                            ? 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40' :
                          item.status === 'error' 
                            ? 'bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40' :
                          item.status === 'uploading' 
                            ? 'bg-blue-50/60 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/40' : 
                            'bg-card border-border/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl shrink-0 ${
                            item.content_type === 'video' 
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {item.content_type === 'video' ? (
                              <Video className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <Input
                              value={item.title}
                              onChange={(e) => updateQueueItemTitle(item.id, e.target.value)}
                              disabled={item.status === 'uploading' || item.status === 'completed'}
                              className="h-8 text-xs font-semibold rounded-lg bg-background"
                              placeholder="عنوان الدرس أو الملف"
                            />
                            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                              <span className="font-mono font-medium">{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1 py-0">
                                {item.content_type}
                              </Badge>
                              {item.status === 'pending' && <span className="text-slate-500">جاهز للرفع</span>}
                              {item.status === 'uploading' && (
                                <span className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  جاري الرفع ({item.progress}%)
                                </span>
                              )}
                              {item.status === 'completed' && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  تم الحفظ بنجاح
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  فشل الرفع ({item.errorMessage || 'خطأ'})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {(item.status === 'pending' || item.status === 'error') && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="h-8 px-3 text-xs font-bold rounded-lg gap-1"
                                  disabled={isUploading}
                                  onClick={() => uploadSingleItem(item.id)}
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>رفع</span>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-destructive"
                                  onClick={() => removeFromQueue(item.id)}
                                  disabled={isUploading}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar when Uploading */}
                        {item.status === 'uploading' && (
                          <div className="w-full mt-2.5 pt-1">
                            <Progress value={item.progress} className="h-2 rounded-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Sticky Dialog Footer - Always visible on screen */}
          <DialogFooter className="px-6 py-3.5 border-t border-border bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 sm:space-x-0">
            <Button 
              type="button" 
              variant="outline" 
              className="rounded-xl px-5 h-10 font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
            >
              إغلاق (Close)
            </Button>

            {pendingQueueCount > 0 ? (
              <Button 
                type="button"
                className="rounded-xl px-6 h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md gap-2"
                onClick={uploadAllContent} 
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري رفع وحفظ الملفات...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>بدء رفع وحفظ الكل ({pendingQueueCount} ملفات)</span>
                  </>
                )}
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="secondary"
                className="rounded-xl px-6 h-10 font-bold gap-1.5"
                onClick={() => onOpenChange(false)}
              >
                <Check className="h-4 w-4" />
                <span>تم الانتهاء</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">تعديل عنوان المحتوى (Edit Content Title)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">عنوان الدرس أو الملف</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="أدخل عنوان المحتوى"
                className="rounded-xl text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setEditingContent(null)}>
              إلغاء
            </Button>
            <Button className="rounded-xl font-bold" onClick={handleUpdateTitle}>
              <Save className="h-4 w-4 mr-1.5" />
              حفظ التعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">هل أنت متأكد من حذف هذا المحتوى؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              سيتم حذف "{deleteConfirm?.title}" نهائياً من التكوين ولن يتمكن الطلاب من مشاهدته مجدداً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
