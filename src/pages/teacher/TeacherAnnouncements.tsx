import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { teacherService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AnnouncementForm {
  title: string;
  content: string;
  type: string;
  priority: string;
  target_audience: string;
  is_published: boolean;
}

const initialForm: AnnouncementForm = {
  title: '',
  content: '',
  type: 'announcement',
  priority: 'medium',
  target_audience: 'all',
  is_published: true,
};

function useTeacherNews() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['teacher-news', user?.id],
    queryFn: () => teacherService.getAnnouncements(),
    enabled: !!user?.id,
  });
}

function useCreateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (news: AnnouncementForm) => teacherService.createAnnouncement(news),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-news'] });
      toast.success('Announcement created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create announcement: ' + error.message);
    },
  });
}

function useUpdateNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<AnnouncementForm>) =>
      teacherService.updateAnnouncement({ id, ...updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-news'] });
      toast.success('Announcement updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update announcement: ' + error.message);
    },
  });
}

function useDeleteNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => teacherService.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-news'] });
      toast.success('Announcement deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete announcement: ' + error.message);
    },
  });
}

export default function TeacherAnnouncements() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: announcements, isLoading } = useTeacherNews();
  const createNews = useCreateNews();
  const updateNews = useUpdateNews();
  const deleteNews = useDeleteNews();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<AnnouncementForm>(initialForm);

  const handleOpenCreate = () => {
    setEditingAnnouncement(null);
    setForm(initialForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (announcement: any) => {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type || 'announcement',
      priority: announcement.priority || 'medium',
      target_audience: announcement.target_audience || 'all',
      is_published: announcement.is_published !== false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    
    if (editingAnnouncement) {
      await updateNews.mutateAsync({ id: editingAnnouncement.id, ...form });
    } else {
      await createNews.mutateAsync(form);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteNews.mutateAsync(deletingId);
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={t('nav.announcements')} 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: t('nav.announcements') }]} 
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            {t('teacher.newAnnouncement')}
          </Button>
        } 
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : announcements && announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((a: any) => (
            <div key={a.id} className="bg-card rounded-xl p-6 shadow-md border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={a.priority} 
                    variant={getPriorityVariant(a.priority)} 
                  />
                  <StatusBadge 
                    status={a.is_published ? 'Published' : 'Draft'} 
                    variant={a.is_published ? 'success' : 'default'} 
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {a.created_at ? format(new Date(a.created_at), 'PPp') : '-'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{a.title}</h3>
              <p className="text-muted-foreground mb-3">{a.content}</p>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Target: {a.target_audience === 'all' ? 'Everyone' : a.target_audience}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(a)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">{t('common.noData')}</p>
          <Button className="mt-4" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('teacher.newAnnouncement')}
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input 
                value={form.title} 
                onChange={(e) => setForm({ ...form, title: e.target.value })} 
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea 
                value={form.content} 
                onChange={(e) => setForm({ ...form, content: e.target.value })} 
                placeholder="Announcement content"
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Target Audience</Label>
              <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="students">Students Only</SelectItem>
                  <SelectItem value="teachers">Teachers Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="is_published" 
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_published">Publish immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createNews.isPending || updateNews.isPending}
            >
              {(createNews.isPending || updateNews.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
