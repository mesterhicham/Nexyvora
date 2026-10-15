import { useState } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common/FormModal';
import { StatusBadge, getStatusVariant } from '@/components/common/StatusBadge';
import { StudentDetailModal } from '@/components/admin/StudentDetailModal';
import { useStudents, useCohorts } from '@/hooks/useDashboardData';
import { useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useEntityMutations';
import { Search, Edit, Trash2, Filter, Download, X, Users, UserPlus, Mail, Lock, Globe, MapPin, MessageCircle, Loader2, GraduationCap, User } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { COUNTRIES } from '@/data/countries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface StudentForm {
  cohort_id: string;
  status: string;
}

export default function StudentsManagement() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: students, isLoading } = useStudents();
  const { data: cohorts } = useCohorts();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Add Student Dialog State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    country: '',
    city: '',
    whatsappNumber: '',
    cohort_id: '',
    status: 'active',
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>({});

  const validateAddForm = () => {
    const errs: Record<string, string> = {};
    if (!addFormData.fullName.trim()) errs.fullName = (t('auth.fullName') || 'Full name') + ' is required';
    if (!addFormData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email)) {
      errs.email = 'Invalid email address';
    }
    if (!addFormData.password) {
      errs.password = 'Password is required';
    } else if (addFormData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (!addFormData.country) errs.country = 'Country is required';
    if (!addFormData.city.trim()) errs.city = 'City is required';
    if (!addFormData.whatsappNumber.trim()) errs.whatsappNumber = 'WhatsApp number is required';

    setAddFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddSubmit = async () => {
    if (!validateAddForm()) return;
    try {
      await createStudent.mutateAsync({
        fullName: addFormData.fullName.trim(),
        email: addFormData.email.trim(),
        password: addFormData.password,
        country: addFormData.country,
        city: addFormData.city.trim(),
        whatsappNumber: addFormData.whatsappNumber.trim(),
        cohort_id: addFormData.cohort_id || null,
        status: addFormData.status || 'active',
      });
      setIsAddModalOpen(false);
      setAddFormData({
        fullName: '',
        email: '',
        password: '',
        country: '',
        city: '',
        whatsappNumber: '',
        cohort_id: '',
        status: 'active',
      });
      setAddFormErrors({});
    } catch {
      // Handled in mutation hook
    }
  };

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'status' | 'cohort' | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const filteredStudents = students?.filter((student) => {
    const name = student.profile?.full_name?.toLowerCase() || '';
    const email = student.profile?.email?.toLowerCase() || '';
    const matchesSearch = name.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const allSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const openBulkModal = (action: 'status' | 'cohort') => {
    setBulkAction(action);
    setBulkValue('');
    setIsBulkModalOpen(true);
  };

  const handleBulkSubmit = async () => {
    if (!bulkAction || !bulkValue || selectedIds.size === 0) return;

    setIsBulkProcessing(true);
    try {
      const updates = Array.from(selectedIds).map(id => {
        if (bulkAction === 'status') {
          return updateStudent.mutateAsync({ id, status: bulkValue });
        } else {
          return updateStudent.mutateAsync({ id, cohort_id: bulkValue });
        }
      });

      await Promise.all(updates);
      toast.success(`${selectedIds.size} ${t('nav.students').toLowerCase()} ${t('common.updated') || 'updated'}`);
      setSelectedIds(new Set());
      setIsBulkModalOpen(false);
    } catch (error) {
      toast.error(t('common.error') || 'An error occurred');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const exportToCSV = () => {
    if (filteredStudents.length === 0) {
      toast.error(t('common.noData'));
      return;
    }

    const headers = [
      t('table.name'),
      t('auth.email'),
      t('table.program'),
      t('table.specialty'),
      t('table.cohort'),
      t('table.enrolled'),
      t('table.status')
    ];

    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(student => [
        `"${student.profile?.full_name || ''}"`,
        `"${student.profile?.email || ''}"`,
        `"${student.cohort?.specialty?.program?.name || ''}"`,
        `"${student.cohort?.specialty?.name || ''}"`,
        `"${student.cohort?.name || ''}"`,
        `"${student.enrollment_date || ''}"`,
        `"${student.status || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.exportSuccess') || 'Export successful');
  };

  const openEditModal = (student: typeof students[0]) => {
    setSelectedStudentId(student.id);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteStudent.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.studentsManagement')}
        description={t('admin.studentsManagementDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('nav.students') }]}
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-2">
            <UserPlus className="h-4 w-4" />
            {t('admin.addStudent')}
          </Button>
        }
      />

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">
              {selectedIds.size} {t('nav.students').toLowerCase()} {t('common.selected') || 'selected'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => openBulkModal('status')}>
              {t('admin.updateStatus') || 'Update Status'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => openBulkModal('cohort')}>
              {t('admin.assignCohort') || 'Assign Cohort'}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
          <Input 
            placeholder={`${t('common.search')}...`} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 rtl:pl-3 rtl:pr-10" 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
            <SelectValue placeholder={t('table.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')} {t('table.status')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="graduated">{t('status.graduated')}</SelectItem>
            <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          {t('common.export') || 'Export CSV'}
        </Button>
      </div>

      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/50">
              <tr>
                <th className="p-4 w-12">
                  <Checkbox 
                    checked={allSelected} 
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.name')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.program')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.specialty')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.cohort')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.enrolled')}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground rtl:text-right">{t('table.status')}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground rtl:text-left">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="p-4"><Skeleton className="h-4 w-4" /></td>
                    <td className="p-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-4"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-4"><Skeleton className="h-8 w-20" /></td>
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className={`border-b border-border hover:bg-secondary/30 transition-colors ${selectedIds.has(student.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="p-4">
                      <Checkbox 
                        checked={selectedIds.has(student.id)} 
                        onCheckedChange={() => toggleSelect(student.id)}
                        aria-label={`Select ${student.profile?.full_name}`}
                      />
                    </td>
                    <td className="p-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => openEditModal(student)}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:ring-2 group-hover:ring-primary/40 transition-all shrink-0">
                          <span className="text-sm font-medium text-primary">
                            {((student.full_name || student.profile?.full_name) || '?').split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {student.full_name || student.profile?.full_name || t('common.unknown')}
                          </p>
                          <p className="text-xs text-muted-foreground">{student.email || student.profile?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground">{student.cohort?.specialty?.program?.name || '-'}</td>
                    <td className="p-4 text-sm text-foreground">{student.cohort?.specialty?.name || '-'}</td>
                    <td className="p-4 text-sm text-foreground">{student.cohort?.name || '-'}</td>
                    <td className="p-4 text-sm text-muted-foreground">{student.enrollment_date || '-'}</td>
                    <td className="p-4">
                      <StatusBadge 
                        status={t(`status.${student.status || 'active'}`)} 
                        variant={getStatusVariant(student.status || 'active')} 
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2 rtl:justify-start">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-purple-50/60 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/50 font-semibold gap-1.5 h-8 px-2.5 text-xs shadow-none" 
                          onClick={() => openEditModal(student)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>{tr("تعديل والملف الشامل", "Edit & Full Profile")}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => setDeleteId(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('table.showing')} {filteredStudents.length} {t('table.of')} {students?.length || 0}
          </p>
        </div>
      </div>

      {/* Student Detail & Comprehensive Profile Modal */}
      <StudentDetailModal
        studentId={selectedStudentId}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />

      {/* Bulk Action Modal */}
      <FormModal 
        open={isBulkModalOpen} 
        onOpenChange={setIsBulkModalOpen} 
        title={bulkAction === 'status' 
          ? (t('admin.bulkUpdateStatus') || `Update Status for ${selectedIds.size} Students`)
          : (t('admin.bulkAssignCohort') || `Assign Cohort to ${selectedIds.size} Students`)
        }
        onSubmit={handleBulkSubmit} 
        submitLabel={t('common.apply') || 'Apply'}
        isLoading={isBulkProcessing}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('admin.bulkActionDesc') || `This action will update ${selectedIds.size} selected students.`}
          </p>
          {bulkAction === 'status' ? (
            <div className="space-y-2">
              <Label>{t('table.status')}</Label>
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('status.active')}</SelectItem>
                  <SelectItem value="graduated">{t('status.graduated')}</SelectItem>
                  <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t('table.cohort')}</Label>
              <Select value={bulkValue} onValueChange={setBulkValue}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  {cohorts?.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </FormModal>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')} {t('nav.students')}</AlertDialogTitle>
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

      {/* Add Student Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              {t('admin.addStudent')}
            </DialogTitle>
            <DialogDescription>
              {t('auth.signUpDesc') || 'Enter the student details to register them in the academy.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="add-fullName" className="text-sm font-medium flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                {t('auth.fullName')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-fullName"
                value={addFormData.fullName}
                onChange={(e) => setAddFormData({ ...addFormData, fullName: e.target.value })}
                placeholder={tr("e.g. أحمد محمد", "e.g. John Doe")}
              />
              {addFormErrors.fullName && <p className="text-xs text-destructive">{addFormErrors.fullName}</p>}
            </div>

            {/* Email & Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {t('login.emailAddress')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  placeholder="student@example.com"
                />
                {addFormErrors.email && <p className="text-xs text-destructive">{addFormErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-password" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  {t('login.password')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-password"
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                  placeholder="•••••••• (min 8 chars)"
                />
                {addFormErrors.password && <p className="text-xs text-destructive">{addFormErrors.password}</p>}
              </div>
            </div>

            {/* Country & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="add-country" className="text-sm font-medium flex items-center gap-1.5">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {t('table.country') || 'Country'} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={addFormData.country}
                  onValueChange={(val) => setAddFormData({ ...addFormData, country: val })}
                >
                  <SelectTrigger id="add-country">
                    <SelectValue placeholder="Select Country..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        {c.nameAr} - {c.name} ({c.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addFormErrors.country && <p className="text-xs text-destructive">{addFormErrors.country}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-city" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {t('table.city') || 'City'} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="add-city"
                  value={addFormData.city}
                  onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                  placeholder="e.g. Casablanca / Cairo"
                />
                {addFormErrors.city && <p className="text-xs text-destructive">{addFormErrors.city}</p>}
              </div>
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <Label htmlFor="add-whatsapp" className="text-sm font-medium flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                WhatsApp Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="add-whatsapp"
                type="tel"
                value={addFormData.whatsappNumber}
                onChange={(e) => setAddFormData({ ...addFormData, whatsappNumber: e.target.value })}
                placeholder="+1234567890"
              />
              {addFormErrors.whatsappNumber && <p className="text-xs text-destructive">{addFormErrors.whatsappNumber}</p>}
            </div>

            {/* Cohort & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <Label htmlFor="add-cohort" className="text-sm font-medium flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  {t('table.cohort')} ({t('common.optional') || 'Optional'})
                </Label>
                <Select
                  value={addFormData.cohort_id || 'none'}
                  onValueChange={(val) => setAddFormData({ ...addFormData, cohort_id: val === 'none' ? '' : val })}
                >
                  <SelectTrigger id="add-cohort">
                    <SelectValue placeholder={t('admin.selectCohort') || 'Select Cohort'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('common.none') || 'None'}</SelectItem>
                    {cohorts?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="add-status" className="text-sm font-medium">
                  {t('table.status')}
                </Label>
                <Select
                  value={addFormData.status}
                  onValueChange={(val) => setAddFormData({ ...addFormData, status: val })}
                >
                  <SelectTrigger id="add-status">
                    <SelectValue placeholder={t('table.status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="graduated">{t('status.graduated')}</SelectItem>
                    <SelectItem value="suspended">{t('status.suspended')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddSubmit} disabled={createStudent.isPending} className="bg-primary text-primary-foreground">
              {createStudent.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}