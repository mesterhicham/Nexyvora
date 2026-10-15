import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminChallengeService } from '@/services/apiService';
import { toast } from 'sonner';
import {
  Flame,
  Plus,
  Edit,
  Trash2,
  Trophy,
  Plane,
  DollarSign,
  Gift,
  Award,
  Sparkles,
  Calendar,
  Users,
  Target,
  Search,
  Upload,
  Eye,
  CheckCircle2,
  AlertCircle,
  Percent,
  Clock,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import api from '@/lib/api';

interface Challenge {
  id: string;
  title: string;
  title_ar: string | null;
  description: string | null;
  description_ar: string | null;
  image_url: string | null;
  target_sales: number;
  target_revenue: number;
  reward_type: string;
  reward_amount: number;
  reward_title: string | null;
  reward_title_ar: string | null;
  leg_limit_percent: number;
  required_directs: number;
  directs_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

export default function AdminChallenges() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, totalRewardPool: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Preview Modal
  const [previewChallenge, setPreviewChallenge] = useState<Challenge | null>(null);

  // Delete Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const initialForm = {
    title: '',
    title_ar: '',
    description: '',
    description_ar: '',
    target_sales: 10,
    target_revenue: 0,
    reward_type: 'TRAVEL',
    reward_amount: 0,
    reward_title: '',
    reward_title_ar: '',
    leg_limit_percent: 40,
    required_directs: 0,
    directs_type: 'ANY',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    image_url: '',
    status: 'active'
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const res = await adminChallengeService.getChallenges();
      setChallenges(res.challenges || []);
      setStats(res.stats || { total: 0, active: 0, completed: 0, totalRewardPool: 0 });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (tr("فشل في تحميل التحديات", "Failed to load challenges")));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingChallenge(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Challenge) => {
    setEditingChallenge(c);
    setFormData({
      title: c.title || '',
      title_ar: c.title_ar || '',
      description: c.description || '',
      description_ar: c.description_ar || '',
      target_sales: c.target_sales || 0,
      target_revenue: Number(c.target_revenue) || 0,
      reward_type: c.reward_type || 'CASH',
      reward_amount: Number(c.reward_amount) || 0,
      reward_title: c.reward_title || '',
      reward_title_ar: c.reward_title_ar || '',
      leg_limit_percent: c.leg_limit_percent || 40,
      required_directs: c.required_directs || 0,
      directs_type: c.directs_type || 'ANY',
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      image_url: c.image_url || '',
      status: c.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error(tr("يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)", "Please select a valid image file (JPG, PNG, WebP)"));
      return;
    }

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append('file', file);

      const res = await api.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedUrl = res.data.fileUrl || res.data.url;
      setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
      toast.success(tr("تم رفع صورة التحدي بنجاح!", "Challenge image uploaded successfully!"));
    } catch (err: any) {
      toast.error(tr("فشل في رفع الصورة", "Failed to upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(tr("يرجى إدخال عنوان التحدي", "Please enter challenge title"));
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingChallenge) {
        await adminChallengeService.updateChallenge(editingChallenge.id, formData);
        toast.success(tr("تم تعديل التحدي بنجاح!", "Challenge updated successfully!"));
      } else {
        await adminChallengeService.createChallenge(formData);
        toast.success(tr("تم إنشاء التحدي بنجاح!", "Challenge created successfully!"));
      }
      setIsModalOpen(false);
      fetchChallenges();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || (tr("حدث خطأ أثناء حفظ التحدي", "Error saving challenge")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminChallengeService.deleteChallenge(id);
      toast.success(tr("تم حذف التحدي بنجاح!", "Challenge deleted successfully!"));
      setDeleteConfirmId(null);
      fetchChallenges();
    } catch (err: any) {
      toast.error(tr("فشل في حذف التحدي", "Failed to delete challenge"));
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await adminChallengeService.toggleStatus(id);
      toast.success(tr("تم تغيير حالة التحدي بنجاح", "Challenge status updated successfully"));
      fetchChallenges();
    } catch (err: any) {
      toast.error(tr("فشل في تغيير الحالة", "Failed to update status"));
    }
  };

  const filteredChallenges = challenges.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.title_ar && c.title_ar.includes(searchTerm)) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'active') return matchesSearch && c.status === 'active';
    if (statusFilter === 'inactive') return matchesSearch && c.status === 'inactive';
    if (statusFilter === 'completed') return matchesSearch && (c.status === 'completed' || new Date(c.end_date) < new Date());
    return matchesSearch;
  });

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'TRAVEL': return Plane;
      case 'CASH': return DollarSign;
      case 'BADGE': return Award;
      case 'PHYSICAL_GIFT': return Gift;
      default: return Trophy;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-16 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-linear-to-r from-primary/10 via-purple-500/5 to-transparent p-6 rounded-3xl border border-primary/20 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <Flame className="h-6 w-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {tr("إدارة التحديات والحملات التنافسية", "Challenge Campaigns")}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
              {tr("إنشاء ومتابعة وتعديل كافة التحديات التنافسية للأعضاء مع ضبط الشروط، الأهداف، والجوائز القيمة.", "Create, edit, and track affiliate and student performance challenge campaigns with customizable rules and rewards.")}
            </p>
          </div>

          <Button
            onClick={handleOpenCreate}
            size="lg"
            className="rounded-2xl font-black text-sm bg-linear-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-700 text-white shadow-lg shadow-primary/25 gap-2"
          >
            <Plus className="h-5 w-5" />
            <span>{tr("إضافة تحدي جديد", "Create Campaign")}</span>
          </Button>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("إجمالي التحديات", "Total Campaigns")}
                </p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                  {stats.total}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Layers className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("التحديات النشطة", "Active Challenges")}
                </p>
                <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.active}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                <Flame className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("التحديات المنتهية", "Completed / Expired")}
                </p>
                <h3 className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">
                  {stats.completed}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {tr("إجمالي الجوائز المرصودة", "Total Rewards Pool")}
                </p>
                <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  ${Number(stats.totalRewardPool).toLocaleString('en-US')}
                </h3>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 rtl:right-3 rtl:left-auto left-3 rtl:left-auto top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={tr("بحث في التحديات...", "Search challenges...")}
              className="pl-9 rtl:pr-9 rtl:pl-4 rounded-xl border-slate-200 dark:border-slate-800 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {['all', 'active', 'inactive', 'completed'].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl text-xs font-bold capitalize whitespace-nowrap ${
                  statusFilter === st ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {st === 'all' && (tr("الكل", "All"))}
                {st === 'active' && (tr("النشطة", "Active"))}
                {st === 'inactive' && (tr("غير المفعلة", "Inactive"))}
                {st === 'completed' && (tr("المنتهية", "Completed"))}
              </Button>
            ))}
          </div>
        </div>

        {/* Challenges Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-slate-400 mt-4">{tr("جاري تحميل التحديات...", "Loading challenges...")}</p>
          </div>
        ) : filteredChallenges.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8">
            <Flame className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">
              {tr("لا توجد تحديات مطابقة", "No challenge campaigns found")}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
              {tr("ابدأ بإضافة تحدي تنافسي جديد لتحفيز الأعضاء وزيادة المبيعات.", "Start by creating your first challenge campaign to engage affiliates and boost sales.")}
            </p>
            <Button onClick={handleOpenCreate} className="rounded-xl text-xs font-bold gap-1 bg-primary text-white">
              <Plus className="h-4 w-4" />
              <span>{tr("إنشاء تحدي جديد", "Add Challenge")}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((c) => {
              const RewardIcon = getRewardIcon(c.reward_type);
              const endDate = new Date(c.end_date);
              const now = new Date();
              const diffTime = endDate.getTime() - now.getTime();
              const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              const isExpired = daysLeft === 0;

              return (
                <Card
                  key={c.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Campaign Image */}
                    <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {c.image_url ? (
                        <img
                          src={c.image_url}
                          alt={c.title}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-linear-to-tr from-primary/30 to-purple-600/30 flex items-center justify-center">
                          <Trophy className="h-16 w-16 text-primary/40" />
                        </div>
                      )}

                      {/* Badges on Image */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          {isExpired
                            ? (tr("منتهي", "Expired"))
                            : `${daysLeft} ${tr("يوم متبقي", "days left")}`}
                        </span>

                        <Badge
                          variant={c.status === 'active' && !isExpired ? 'default' : 'secondary'}
                          className={`text-xs font-black capitalize px-2.5 py-0.5 shadow-xs ${
                            c.status === 'active' && !isExpired
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {c.status}
                        </Badge>
                      </div>

                      {/* Reward Pill */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/90 text-white text-xs font-black backdrop-blur-md shadow-md">
                          <RewardIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">
                            {c.reward_type}: {c.reward_title || (c.reward_amount > 0 ? `$${c.reward_amount} USD` : '')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-4">
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">
                          {isRtl ? (c.title_ar || c.title) : c.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {isRtl ? (c.description_ar || c.description) : (c.description || c.description_ar)}
                        </p>
                      </div>

                      {/* Conditions & Criteria (الشروط) */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                        <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">
                          {tr("الشروط والمتطلبات:", "Campaign Criteria:")}
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Target className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>
                              {tr("مبيعات:", "Sales:")} <strong>{c.target_sales}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {tr("حجم:", "Rev:")} <strong>${Number(c.target_revenue).toFixed(0)}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Users className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                            <span>
                              {tr("مباشرين:", "Directs:")} <strong>{c.required_directs} ({c.directs_type})</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                            <Percent className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                              {tr("سقف الفريق:", "Leg Limit:")} <strong>{c.leg_limit_percent}%</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Date Range */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {c.start_date.split('T')[0]} → {c.end_date.split('T')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewChallenge(c)}
                      className="rounded-xl text-xs font-bold gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{tr("معاينة", "Preview")}</span>
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(c.id)}
                        className={`rounded-xl text-xs font-bold ${
                          c.status === 'active'
                            ? 'text-amber-600 border-amber-200 hover:bg-amber-50 dark:border-amber-800'
                            : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800'
                        }`}
                      >
                        {c.status === 'active' ? (tr("إيقاف", "Deactivate")) : (tr("تفعيل", "Activate"))}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(c)}
                        className="rounded-xl text-xs font-bold p-2 text-primary border-primary/30 hover:bg-primary/10"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirmId(c.id)}
                        className="rounded-xl text-xs font-bold p-2 text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Create / Edit Challenge Campaign (Matching user's Image 2) */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" />
                <span>
                  {editingChallenge
                    ? (tr("تعديل حملة التحدي", "Edit Challenge Campaign"))
                    : (tr("إنشاء حملة تحدي جديدة", "Create Challenge Campaign"))}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {tr("قم بتحديد الشروط والأهداف والمكافأة الخاصة بالتحدي بدقة.", "Define the challenge criteria, targets, dates, and reward.")}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {/* Title & Title AR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Title (English) <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Dubai Luxury Leadership Retreat"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("العنوان بالعربية (Title Arabic)", "Arabic Title")}
                  </Label>
                  <Input
                    value={formData.title_ar}
                    onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                    placeholder={tr("مثال: تحدي رحلة دبي ومؤتمر القادة VIP", "e.g. Dubai Leadership Retreat VIP")}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Description & Description AR */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description (English)
                  </Label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the campaign requirements and perks..."
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("الوصف بالعربية (Description Arabic)", "Arabic Description")}
                  </Label>
                  <Textarea
                    rows={3}
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder={tr("اشرح شروط المسابقة ومميزاتها بالتفصيل...", "Explain campaign requirements and perks in detail...")}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Target Sales & Target Revenue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Sales (Enrolled)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.target_sales}
                    onChange={(e) => setFormData({ ...formData, target_sales: Number(e.target.value) })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Revenue ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.target_revenue}
                    onChange={(e) => setFormData({ ...formData, target_revenue: Number(e.target.value) })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Reward Type, Reward Amount & Leg Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reward Type
                  </Label>
                  <Select
                    value={formData.reward_type}
                    onValueChange={(val) => setFormData({ ...formData, reward_type: val })}
                  >
                    <SelectTrigger className="rounded-xl text-sm">
                      <SelectValue placeholder="Select Reward Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="TRAVEL">✈️ {tr("TRAVEL (سياحة وسفر)", "TRAVEL (Trip / Tourism)")}</SelectItem>
                      <SelectItem value="CASH">💵 {tr("CASH (مكافأة نقدية)", "CASH (Cash Reward)")}</SelectItem>
                      <SelectItem value="BADGE">🏅 {tr("BADGE (شارة تميز)", "BADGE (Excellence Badge)")}</SelectItem>
                      <SelectItem value="PHYSICAL_GIFT">🎁 {tr("PHYSICAL GIFT (هدية عينية)", "PHYSICAL GIFT (Physical Gift)")}</SelectItem>
                      <SelectItem value="COACHING">🎓 {tr("COACHING (تدريب VIP)", "COACHING (VIP Coaching)")}</SelectItem>
                      <SelectItem value="OTHER">✨ {tr("OTHER (أخرى)", "OTHER (Other)")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reward Amount ($)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.reward_amount}
                    onChange={(e) => setFormData({ ...formData, reward_amount: Number(e.target.value) })}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Leg Limit (%)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.leg_limit_percent}
                    onChange={(e) => setFormData({ ...formData, leg_limit_percent: Number(e.target.value) })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Required Directs & Directs Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Required Directs
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.required_directs}
                    onChange={(e) => setFormData({ ...formData, required_directs: Number(e.target.value) })}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Directs Package Type
                  </Label>
                  <Select
                    value={formData.directs_type}
                    onValueChange={(val) => setFormData({ ...formData, directs_type: val })}
                  >
                    <SelectTrigger className="rounded-xl text-sm">
                      <SelectValue placeholder="Select Directs Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ANY">{tr("ANY (أي باقة)", "ANY (Any Package)")}</SelectItem>
                      <SelectItem value="CORE">CORE ($50)</SelectItem>
                      <SelectItem value="FLOW">FLOW ($150+)</SelectItem>
                      <SelectItem value="GROW">GROW ($500+)</SelectItem>
                      <SelectItem value="PRIME">PRIME ($1,000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Start Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    End Date <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    required
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Reward Custom Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reward Label (English)
                  </Label>
                  <Input
                    value={formData.reward_title}
                    onChange={(e) => setFormData({ ...formData, reward_title: e.target.value })}
                    placeholder="e.g. 5-Star Dubai Trip + VIP Gala"
                    className="rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("تفاصيل الجائزة (Arabic)", "Arabic Reward Details")}
                  </Label>
                  <Input
                    value={formData.reward_title_ar}
                    onChange={(e) => setFormData({ ...formData, reward_title_ar: e.target.value })}
                    placeholder={tr("مثال: رحلة فاخرة 5 نجوم إلى دبي شاملة التكاليف", "e.g. 5-Star all-inclusive luxury retreat in Dubai")}
                    className="rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Campaign Image (File upload or URL) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("صورة التحدي (Campaign Image)", "Campaign Image")}
                </Label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="rounded-xl text-xs cursor-pointer file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-bold"
                  />
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder={tr("أو رابط الصورة المباشر https://...", "Or direct image URL https://...")}
                    className="rounded-xl text-xs"
                  />
                </div>
                {uploadingImage && (
                  <p className="text-xs text-primary animate-pulse">{tr("جاري رفع الصورة...", "Uploading image...")}</p>
                )}
                {formData.image_url && (
                  <div className="mt-2 h-24 w-40 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs font-bold"
                >
                  {tr("إلغاء", "Cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold bg-primary hover:bg-primary/95 text-white"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : editingChallenge ? (
                    tr("حفظ التعديلات", "Save Changes")
                  ) : (
                    tr("إنشاء التحدي", "Create Campaign")
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Member Preview Modal */}
        <Dialog open={!!previewChallenge} onOpenChange={() => setPreviewChallenge(null)}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>{tr("معاينة كيف يظهر التحدي للعضو", "Member View Preview")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {tr("هذا هو التصميم الكامل للشروط والصورة الذي يظهر في صفحة العضو.", "This is how the challenge card appears on the student dashboard.")}
              </DialogDescription>
            </DialogHeader>

            {previewChallenge && (
              <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-md mt-2">
                <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {previewChallenge.image_url ? (
                    <img src={previewChallenge.image_url} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-linear-to-tr from-primary/30 to-purple-600/30 flex items-center justify-center">
                      <Trophy className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      14 days remaining
                    </span>
                    <Badge className="bg-emerald-600 text-white text-xs font-bold">Active</Badge>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {isRtl ? (previewChallenge.title_ar || previewChallenge.title) : previewChallenge.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {isRtl ? (previewChallenge.description_ar || previewChallenge.description) : previewChallenge.description}
                    </p>
                  </div>

                  {/* Reward Banner */}
                  <div className="p-3 rounded-xl bg-linear-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/50 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Gift className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <span className="font-bold">{tr("المكافأة: ", "Reward: ")}</span>
                      <span>{previewChallenge.reward_title || `$${previewChallenge.reward_amount} USD`}</span>
                    </div>
                  </div>

                  {/* Conditions Details */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">
                      {tr("شروط التأهل:", "Qualification Rules:")}
                    </span>
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{tr("المبيعات المطلوبة:", "Target Sales:")}</span>
                      <strong className="text-primary">{previewChallenge.target_sales}</strong>
                    </div>
                    {Number(previewChallenge.target_revenue) > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>{tr("حجم المبيعات المطلوبة:", "Target Revenue:")}</span>
                        <strong className="text-emerald-600">${Number(previewChallenge.target_revenue).toFixed(2)} USD</strong>
                      </div>
                    )}
                    {previewChallenge.required_directs > 0 && (
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>{tr("المباشرين المطلوبين:", "Required Directs:")}</span>
                        <strong className="text-indigo-600">{previewChallenge.required_directs} ({previewChallenge.directs_type})</strong>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>{tr("أقصى نسبة من الفريق الواحد:", "Max from single leg:")}</span>
                      <strong>{previewChallenge.leg_limit_percent}%</strong>
                    </div>
                  </div>

                  {/* Progress Example */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <span>{tr("التقدم", "Progress")} (1 / {previewChallenge.target_sales})</span>
                      <span>33%</span>
                    </div>
                    <Progress value={33} className="h-2 rounded-full" />
                  </div>

                  <Button className="w-full rounded-xl text-xs font-bold gap-1 mt-2 bg-primary text-white">
                    <span>{tr("مشاركة الرابط لإنجاز التحدي", "Share link to complete challenge")}</span>
                    <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </Card>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent className="max-w-sm rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-rose-600 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{tr("تأكيد حذف التحدي", "Confirm Deletion")}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-2">
                {tr("هل أنت متأكد من رغبتك في حذف هذا التحدي نهائياً؟ لن يتمكن الأعضاء من رؤيته بعد الآن.", "Are you sure you want to permanently delete this challenge campaign? Members will no longer see it.")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl text-xs font-bold"
              >
                {tr("إلغاء", "Cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {tr("نعم، حذف التحدي", "Delete Campaign")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
