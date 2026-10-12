import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Upload, Eye, Image, Link2, Check } from 'lucide-react';
import { 
  useFormations, 
  useCreateFormation, 
  useUpdateFormation, 
  useDeleteFormation,
  useFormationContent,
  useAddFormationContent,
  useDeleteFormationContent,
  useReorderFormationContent,
  Formation,
  FormationContent,
} from '@/hooks/useFormations';
import { uploadService } from '@/services/apiService';
import { toast } from 'sonner';
import { DraggableContentList } from '@/components/formation/DraggableContentList';
import { FormationPreview } from '@/components/formation/FormationPreview';

export default function TeacherFormations() {
  const { t } = useTranslation();
  const { data: formations, isLoading } = useFormations();
  const createFormation = useCreateFormation();
  const updateFormation = useUpdateFormation();
  const deleteFormation = useDeleteFormation();
  const addContent = useAddFormationContent();
  const deleteContent = useDeleteFormationContent();
  const reorderContent = useReorderFormationContent();

  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [previewFormation, setPreviewFormation] = useState<Formation | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, currency: 'USD', is_published: false, thumbnail_url: '' });
  const [contentData, setContentData] = useState({ title: '', content_type: 'video' as 'video' | 'pdf', file: null as File | null });
  const [uploading, setUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyFormationLink = async (formationId: string) => {
    const url = `${window.location.origin}/formation/${formationId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(formationId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const { data: selectedFormationContent } = useFormationContent(selectedFormation?.id);
  const { data: previewContent } = useFormationContent(previewFormation?.id);

  const handleContentReorder = (newOrder: FormationContent[]) => {
    if (!selectedFormation) return;
    const items = newOrder.map((item, index) => ({ id: item.id, order_index: index + 1 }));
    reorderContent.mutate({ formationId: selectedFormation.id, items });
  };

  const openPreview = (formation: Formation) => {
    setPreviewFormation(formation);
    setShowPreviewModal(true);
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return formData.thumbnail_url || null;
    const res = await uploadService.uploadFile(thumbnailFile);
    return res.url;
  };

  const resetFormData = () => {
    setFormData({ title: '', description: '', price: 0, currency: 'USD', is_published: false, thumbnail_url: '' });
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  const handleCreateFormation = async () => {
    setUploading(true);
    try {
      const thumbnailUrl = await uploadThumbnail();
      await createFormation.mutateAsync({ ...formData, thumbnail_url: thumbnailUrl });
      setShowFormationModal(false);
      resetFormData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateFormation = async () => {
    if (!selectedFormation) return;
    setUploading(true);
    try {
      const thumbnailUrl = await uploadThumbnail();
      await updateFormation.mutateAsync({ id: selectedFormation.id, ...formData, thumbnail_url: thumbnailUrl });
      setShowFormationModal(false);
      setSelectedFormation(null);
      resetFormData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadContent = async () => {
    if (!selectedFormation || !contentData.file) return;
    setUploading(true);

    try {
      const res = await uploadService.uploadFile(contentData.file);
      const fileUrl = res.url;

      let duration = null;
      if (contentData.content_type === 'video') {
        duration = await getVideoDuration(contentData.file);
      }

      await addContent.mutateAsync({
        formation_id: selectedFormation.id,
        title: contentData.title,
        content_type: contentData.content_type,
        file_url: fileUrl,
        duration_seconds: duration,
        quiz_id: null,
        order_index: (selectedFormationContent?.length || 0) + 1,
      });

      setShowContentModal(false);
      setContentData({ title: '', content_type: 'video', file: null });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(Math.floor(video.duration));
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const openEditFormation = (formation: Formation) => {
    setSelectedFormation(formation);
    setFormData({
      title: formation.title,
      description: formation.description || '',
      price: formation.price,
      currency: formation.currency,
      is_published: formation.is_published,
      thumbnail_url: formation.thumbnail_url || '',
    });
    setThumbnailPreview(formation.thumbnail_url || null);
    setShowFormationModal(true);
  };

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title="My Formations" 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/teacher' }, { label: 'Formations' }]} 
      />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Create and manage your training courses</p>
          <Button onClick={() => { setSelectedFormation(null); resetFormData(); setShowFormationModal(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Formation
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formations?.map((formation) => (
                  <TableRow key={formation.id}>
                    <TableCell className="font-medium">{formation.title}</TableCell>
                    <TableCell>{formation.price} {formation.currency}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedFormation(formation); setShowContentModal(true); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Content
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openPreview(formation)}>
                          Preview
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={formation.is_published ? 'default' : 'secondary'}>
                        {formation.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => copyFormationLink(formation.id)}
                          title="Copy shareable link"
                        >
                          {copiedId === formation.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Link2 className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditFormation(formation)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteFormation.mutate(formation.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!formations || formations.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No formations created yet. Click "Create Formation" to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Formation Modal */}
      <Dialog open={showFormationModal} onOpenChange={setShowFormationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFormation ? 'Edit Formation' : 'Create Formation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Thumbnail Image</Label>
              <div className="mt-2 flex items-center gap-4">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumbnail preview" className="w-24 h-16 object-cover rounded-md border" />
                ) : (
                  <div className="w-24 h-16 bg-muted rounded-md flex items-center justify-center border">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    className="w-auto"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recommended: 800x450 pixels</p>
                </div>
              </div>
            </div>
            <div>
              <Label>Title</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="MAD">MAD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowFormationModal(false); resetFormData(); }}>Cancel</Button>
            <Button onClick={selectedFormation ? handleUpdateFormation : handleCreateFormation} disabled={uploading}>
              {uploading ? 'Uploading...' : selectedFormation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Modal */}
      <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Content - {selectedFormation?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Existing Content with Drag & Drop */}
            <div className="space-y-2">
              <h4 className="font-medium">Current Content (drag to reorder)</h4>
              <DraggableContentList
                content={selectedFormationContent || []}
                onReorder={handleContentReorder}
                onDelete={(id) => deleteContent.mutate({ id, formationId: selectedFormation!.id })}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium">Add New Content</h4>
              <div>
                <Label>Title</Label>
                <Input value={contentData.title} onChange={(e) => setContentData({ ...contentData, title: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={contentData.content_type} onValueChange={(value: 'video' | 'pdf') => setContentData({ ...contentData, content_type: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>File</Label>
                <Input 
                  type="file" 
                  accept={contentData.content_type === 'video' ? 'video/*' : 'application/pdf'}
                  onChange={(e) => setContentData({ ...contentData, file: e.target.files?.[0] || null })}
                />
              </div>
              <Button onClick={handleUploadContent} disabled={!contentData.title || !contentData.file || uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Content'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <FormationPreview
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        formation={previewFormation}
        content={previewContent || []}
      />
    </DashboardLayout>
  );
}
