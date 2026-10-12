import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, Users, DollarSign, BookOpen, Image, Link2, Check, FolderOpen, TrendingUp } from 'lucide-react';
import { 
  useFormations, 
  useCreateFormation, 
  useUpdateFormation, 
  useDeleteFormation,
  useFormationContent,
  useAllEnrollments,
  useUpdateEnrollmentStatus,
  useFormationPayments,
  useUpdateFormationPaymentStatus,
  useFormationRevenueStats,
  Formation,
} from '@/hooks/useFormations';
import { uploadService } from '@/services/apiService';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FormationPreview } from '@/components/formation/FormationPreview';
import { FormationContentManager } from '@/components/admin/FormationContentManager';

export default function FormationsManagement() {
  const { t } = useTranslation();

  // --- State Hooks ---
  const [showFormationModal, setShowFormationModal] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [previewFormation, setPreviewFormation] = useState<Formation | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', price: 0, currency: 'USD', is_published: false, thumbnail_url: '' });
  const [uploading, setUploading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- Query Hooks ---
  const { data: formations, isLoading: formationsLoading } = useFormations();
  const { data: enrollments } = useAllEnrollments();
  const { data: payments } = useFormationPayments();
  const { data: revenueStats } = useFormationRevenueStats();
  const { data: previewContent } = useFormationContent(previewFormation?.id);
  
  // --- Mutation Hooks ---
  const createFormation = useCreateFormation();
  const updateFormation = useUpdateFormation();
  const deleteFormation = useDeleteFormation();
  const updateEnrollment = useUpdateEnrollmentStatus();
  const updatePayment = useUpdateFormationPaymentStatus();

  // --- Actions ---
  const copyFormationLink = async (formationId: string) => {
    const url = `${window.location.origin}/formation/${formationId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(formationId);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openContentManager = (formation: Formation) => {
    setSelectedFormation(formation);
    setShowContentModal(true);
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
    try {
      const response = await uploadService.uploadFile(thumbnailFile);
      return response.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload thumbnail');
    }
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

  const resetFormData = () => {
    setFormData({ title: '', description: '', price: 0, currency: 'USD', is_published: false, thumbnail_url: '' });
    setThumbnailFile(null);
    setThumbnailPreview(null);
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

  // --- Derived Data ---
  const totalRevenue = useMemo(() => revenueStats?.reduce((sum, item) => sum + Number(item.total_revenue), 0) || 0, [revenueStats]);
  const totalEnrollments = useMemo(() => revenueStats?.reduce((sum, item) => sum + Number(item.total_enrollments), 0) || 0, [revenueStats]);

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Formations Management" 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: 'Formations' }]} 
      />

      <Tabs defaultValue="formations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="formations" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Formations
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="enrollments" className="gap-2">
            <Users className="h-4 w-4" />
            Enrollments
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="formations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-premium-blue">{formations?.length || 0}</div>
                  <p className="text-muted-foreground text-sm">Total Formations</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-success">{formations?.filter(f => f.is_published).length || 0}</div>
                  <p className="text-muted-foreground text-sm">Published</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalEnrollments}</div>
                  <p className="text-muted-foreground text-sm">Total Enrollments</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setSelectedFormation(null); resetFormData(); setShowFormationModal(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Formation
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thumbnail</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : formations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">No formations found</TableCell>
                    </TableRow>
                  ) : (
                    formations?.map((formation) => (
                      <TableRow key={formation.id}>
                        <TableCell>
                          {formation.thumbnail_url ? (
                            <img 
                              src={formation.thumbnail_url} 
                              alt={formation.title}
                              className="w-16 h-12 object-cover rounded-md"
                            />
                          ) : (
                            <div className="w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{formation.title}</TableCell>
                        <TableCell>{formation.price} {formation.currency}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openContentManager(formation)}
                            className="gap-2"
                          >
                            <FolderOpen className="h-4 w-4" />
                            Manage Content
                          </Button>
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
                              onClick={() => openPreview(formation)}
                              title="Preview formation"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
                            <Button variant="outline" size="sm" onClick={() => openEditFormation(formation)} title="Edit formation">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => deleteFormation.mutate(formation.id)} title="Delete formation">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} USD</div>
                <p className="text-xs text-muted-foreground">+0% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">New students this month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Formation</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Formation</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total Enrollments</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueStats?.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.title}</TableCell>
                      <TableCell>{stat.price} {stat.currency}</TableCell>
                      <TableCell>{stat.total_enrollments}</TableCell>
                      <TableCell>{stat.approved_enrollments}</TableCell>
                      <TableCell className="font-bold text-green-600">
                        {stat.total_revenue.toLocaleString()} {stat.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrolled At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments?.map((enrollment: any) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>{enrollment.student_name || enrollment.student_id.slice(0, 8)}</TableCell>
                      <TableCell>{enrollment.formation_title}</TableCell>
                      <TableCell>
                        <StatusBadge status={enrollment.payment_status} />
                      </TableCell>
                      <TableCell>{new Date(enrollment.enrolled_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Select
                          value={enrollment.payment_status}
                          onValueChange={(value) => 
                            updateEnrollment.mutate({ id: enrollment.id, status: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Formation Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{payment.student_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{payment.student_email}</span>
                        </div>
                      </TableCell>
                      <TableCell>{payment.formation_title}</TableCell>
                      <TableCell>{payment.amount} {payment.currency}</TableCell>
                      <TableCell>{payment.payment_method}</TableCell>
                      <TableCell>
                        <StatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Select
                            value={payment.status}
                            onValueChange={(value) => 
                              updatePayment.mutate({ id: payment.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Content Manager Modal */}
      <FormationContentManager
        open={showContentModal}
        onOpenChange={setShowContentModal}
        formation={selectedFormation}
      />

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
