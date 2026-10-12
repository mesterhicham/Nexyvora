import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Clock
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
      className={`flex items-center justify-between p-3 bg-card border rounded-lg group hover:border-primary/50 transition-colors ${
        isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-50 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className={`p-2 rounded-md ${content.content_type === 'video' ? 'bg-blue-500/10 text-blue-600' : content.content_type === 'pdf' ? 'bg-orange-500/10 text-orange-600' : 'bg-green-500/10 text-green-600'}`}>
          {content.content_type === 'video' ? (
            <Video className="h-5 w-5" />
          ) : content.content_type === 'pdf' ? (
            <FileText className="h-5 w-5" />
          ) : (
             <FileText className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{index + 1}. {content.title}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Badge variant="outline" className="text-xs">
              {content.content_type.toUpperCase()}
            </Badge>
            {content.duration_seconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(content.duration_seconds)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-destructive" />
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
}

export function FormationContentManager({ open, onOpenChange, formation }: FormationContentManagerProps) {
  const { data: content, refetch } = useFormationContent(formation?.id);
  const addContent = useAddFormationContent();
  const updateContent = useUpdateFormationContent();
  const deleteContent = useDeleteFormationContent();
  const reorderContent = useReorderFormationContent();

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
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(Math.floor(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
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
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQueueItemTitle = (id: string, title: string) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item))
    );
  };

  const uploadAllContent = async () => {
    if (!formation || uploadQueue.length === 0) return;
    setIsUploading(true);

    const currentContentCount = content?.length || 0;

    for (let i = 0; i < uploadQueue.length; i++) {
      const item = uploadQueue[i];
      if (item.status !== 'pending') continue;

      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
      );

      try {
        const uploadResponse = await uploadService.uploadFile(item.file);
        const fileUrl = uploadResponse.url;

        let duration = null;
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

        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
        );
      } catch (error: any) {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'error' } : q))
        );
        toast.error(`Failed to upload ${item.title}: ${error.message}`);
      }
    }

    setIsUploading(false);
    setTimeout(() => {
      setUploadQueue((prev) => prev.filter((item) => item.status !== 'completed'));
    }, 2000);
    
    refetch();
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

  const formatTotalDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Manage Content - {formation?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold">{content?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{videoCount}</div>
                <p className="text-xs text-muted-foreground">Videos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold text-orange-600">{pdfCount}</div>
                <p className="text-xs text-muted-foreground">PDFs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <div className="text-2xl font-bold">{formatTotalDuration(totalDuration)}</div>
                <p className="text-xs text-muted-foreground">Duration</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="content" className="flex-1">
            <TabsList className="w-full">
              <TabsTrigger value="content" className="flex-1">
                Current Content ({content?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">
                Upload New ({uploadQueue.filter(q => q.status === 'pending').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {!content || content.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No content added yet</p>
                    <p className="text-sm text-muted-foreground">Upload videos and PDFs to get started</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={content.map(c => c.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
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

            <TabsContent value="upload" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
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
                  <Button variant="outline" onClick={() => videoInputRef.current?.click()}>
                    <Video className="h-4 w-4 mr-2" />
                    Add Videos
                  </Button>
                  <Button variant="outline" onClick={() => pdfInputRef.current?.click()}>
                    <FileText className="h-4 w-4 mr-2" />
                    Add PDFs
                  </Button>
                </div>

                <ScrollArea className="h-[340px] pr-4">
                  {uploadQueue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                      <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">No files in queue</p>
                      <p className="text-sm text-muted-foreground">Click the buttons above to add files</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {uploadQueue.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 border rounded-lg ${
                            item.status === 'completed' ? 'bg-green-50 border-green-200 dark:bg-green-950/20' :
                            item.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' :
                            item.status === 'uploading' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className={`p-2 rounded-md ${item.content_type === 'video' ? 'bg-blue-500/10 text-blue-600' : 'bg-orange-500/10 text-orange-600'}`}>
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
                              disabled={item.status !== 'pending'}
                              className="h-8"
                              placeholder="Content title"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                              {item.status === 'uploading' && ' • Uploading...'}
                              {item.status === 'completed' && ' • ✓ Uploaded'}
                              {item.status === 'error' && ' • ✗ Failed'}
                            </p>
                          </div>
                          {item.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => removeFromQueue(item.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {uploadQueue.filter(q => q.status === 'pending').length > 0 && (
                  <Button 
                    onClick={uploadAllContent} 
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : `Upload All (${uploadQueue.filter(q => q.status === 'pending').length} files)`}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Title Dialog */}
      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Content Title</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter content title"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContent(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTitle}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Content</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
