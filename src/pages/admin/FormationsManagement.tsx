import { useState, useMemo, useEffect } from 'react';
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
import { Plus, Edit, Trash2, Eye, Users, DollarSign, BookOpen, Image, Link2, Check, FolderOpen, TrendingUp, Package, CheckCircle, Sparkles } from 'lucide-react';
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
import { uploadService, packageService } from '@/services/apiService';
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
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    price: 0, 
    currency: 'USD', 
    is_published: false, 
    thumbnail_url: '',
    package_id: 'none'
  });
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [selectedPackageFilter, setSelectedPackageFilter] = useState<string>('all');
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

  // --- Load Packages ---
  useEffect(() => {
    packageService.getAll()
      .then((res: any) => {
        const pkgs = res?.packages || (Array.isArray(res) ? res : []);
        setPackagesList(pkgs);
      })
      .catch((err) => console.error('[fetchPackages]', err));
  }, []);

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
      const isAssignedToPackage = formData.package_id && formData.package_id !== 'none';
      await createFormation.mutateAsync({ 
        ...formData, 
        price: isAssignedToPackage ? 0 : (Number(formData.price) || 0),
        thumbnail_url: thumbnailUrl,
        package_id: isAssignedToPackage ? formData.package_id : null
      });
      setShowFormationModal(false);
      resetFormData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateFormation = async () => {
    if (!selectedFormation) return;
    setUploading(true);
    try {
      const thumbnailUrl = await uploadThumbnail();
      const isAssignedToPackage = formData.package_id && formData.package_id !== 'none';
      await updateFormation.mutateAsync({ 
        id: selectedFormation.id, 
        ...formData, 
        price: isAssignedToPackage ? 0 : (Number(formData.price) || 0),
        thumbnail_url: thumbnailUrl,
        package_id: isAssignedToPackage ? formData.package_id : null
      });
      setShowFormationModal(false);
      setSelectedFormation(null);
      resetFormData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message);
    } finally {
      setUploading(false);
    }
  };

  const resetFormData = () => {
    setFormData({ 
      title: '', 
      description: '', 
      price: 0, 
      currency: 'USD', 
      is_published: false, 
      thumbnail_url: '',
      package_id: 'none'
    });
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
      package_id: formation.package_id || 'none',
    });
    setThumbnailPreview(formation.thumbnail_url || null);
    setShowFormationModal(true);
  };

  // --- Derived Data ---
  const totalRevenue = useMemo(() => revenueStats?.reduce((sum, item) => sum + Number(item.total_revenue), 0) || 0, [revenueStats]);
  const totalEnrollments = useMemo(() => revenueStats?.reduce((sum, item) => sum + Number(item.total_enrollments), 0) || 0, [revenueStats]);

  const filteredFormations = useMemo(() => {
    if (!formations) return [];
    if (selectedPackageFilter === 'all') return formations;
    if (selectedPackageFilter === 'standalone') return formations.filter(f => !f.package_id);
    return formations.filter(f => f.package_id === selectedPackageFilter);
  }, [formations, selectedPackageFilter]);

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
            <div className="flex items-center gap-3">
              <Select value={selectedPackageFilter} onValueChange={setSelectedPackageFilter}>
                <SelectTrigger className="w-56 rounded-xl text-xs">
                  <SelectValue placeholder="تصفية حسب الباقة" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-semibold">
                    🌐 كل التكوينات ({formations?.length || 0})
                  </SelectItem>
                  <SelectItem value="standalone" className="text-xs">
                    🔓 عام / بدون باقة ({formations?.filter(f => !f.package_id).length || 0})
                  </SelectItem>
                  {packagesList.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id} className="text-xs">
                      ⭐ {pkg.name_ar || pkg.name} ({formations?.filter(f => f.package_id === pkg.id).length || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableHead>Package / الباقة</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                  ) : filteredFormations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">No formations found</TableCell>
                    </TableRow>
                  ) : (
                    filteredFormations?.map((formation) => (
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
                        <TableCell>
                          {formation.package_name || formation.package_name_ar ? (
                            <Badge variant="outline" className="gap-1.5 py-1 px-2.5 rounded-xl border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold text-xs whitespace-nowrap">
                              <Package className="h-3 w-3 text-violet-500" />
                              <span>{formation.package_name_ar || formation.package_name}</span>
                              {formation.package_price !== undefined && formation.package_price !== null && (
                                <span className="opacity-75 font-mono text-[10px]">(${Number(formation.package_price).toFixed(0)})</span>
                              )}
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 whitespace-nowrap">
                              عام / مستقل
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {formation.package_id ? (
                            <Badge variant="outline" className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 py-0.5 px-2.5 rounded-lg whitespace-nowrap">
                              مضمّن في الباقة
                            </Badge>
                          ) : (
                            <span className="font-semibold text-xs font-mono">
                              {Number(formation.price) > 0 ? `${formation.price} ${formation.currency}` : 'مجاني'}
                            </span>
                          )}
                        </TableCell>
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
            {/* Package Selector */}
            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
              <Label className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-200">
                <Package className="h-4 w-4 text-violet-500" />
                الباقة التابعة / المؤهلة لهذا التكوين (Assigned Package)
              </Label>
              <Select 
                value={formData.package_id} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  package_id: value,
                  price: value !== 'none' ? 0 : (formData.price || 0)
                })}
              >
                <SelectTrigger className="rounded-xl text-xs bg-white dark:bg-slate-950">
                  <SelectValue placeholder="اختر الباقة التابعة للتكوين" />
                </SelectTrigger>
                <SelectContent className="rounded-xl max-h-60">
                  <SelectItem value="none" className="text-xs font-semibold text-slate-500">
                    🌐 بدون باقة محددة (تدريب عام / مستقل خارج الباقات)
                  </SelectItem>
                  {packagesList.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id} className="text-xs font-medium">
                      ⭐ {pkg.name_ar || pkg.name} — (${Number(pkg.price).toFixed(0)}) [المستوى {pkg.level}]
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {formData.package_id && formData.package_id !== 'none' 
                  ? '* عند تحديد باقة، يستفيد طلاب ومشتركو هذه الباقة (وكافة الباقات الأعلى منها) من هذا التكوين تلقائياً مجاناً، ويختفي السعر.'
                  : '* تكوين عام أو مستقل خارج الباقات، متاح للشراء الفردي ويمكن تحديد السعر والعملة له.'}
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>

            {/* Conditionally Show / Hide Price based on Package Selection */}
            {formData.package_id && formData.package_id !== 'none' ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/25 flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                      مشمول تلقائياً ضمن اشتراك الباقة (السعر: مجاني مع الباقة)
                    </h5>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                      يختفي الثمن لأن هذا التكوين مخصص حصرياً لمشتركي الباقة المختارة والباقات الأعلى مجاناً بدون رسوم إضافية.
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold text-xs shrink-0 px-2.5 py-1 rounded-xl">
                  $0 Free
                </Badge>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="space-y-1">
                  <Label htmlFor="price" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    السعر للتدريب المستقل / خارج الباقة (Price)
                  </Label>
                  <Input 
                    id="price" 
                    type="number" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="rounded-xl text-xs bg-white dark:bg-slate-950"
                  />
                  <p className="text-[10px] text-muted-foreground">* يظهر السعر فقط للتدريبات العامة الخارجة عن الباقة.</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currency" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    العملة (Currency)
                  </Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger id="currency" className="rounded-xl text-xs bg-white dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="USD" className="text-xs">USD ($)</SelectItem>
                      <SelectItem value="EUR" className="text-xs">EUR (€)</SelectItem>
                      <SelectItem value="MAD" className="text-xs">MAD (درهم)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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
