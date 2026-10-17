import { useState, useEffect, useRef } from 'react';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { adminAffiliateService } from '@/services/apiService';
import { 
  Award, 
  Crown, 
  Shield, 
  Gem, 
  User, 
  Edit, 
  Loader2, 
  Plus, 
  Trash2, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle2, 
  Gift, 
  Zap, 
  Layers, 
  Plane, 
  Trophy, 
  Eye, 
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface RankItem {
  id: string;
  level: number;
  name: string;
  name_ar: string;
  tagline?: string;
  tagline_ar?: string;
  badge_icon?: string;
  logo_url?: string;
  min_direct_sales?: number;
  min_team_turnover: number;
  required_rank_id?: string | null;
  required_rank_count?: number;
  required_rank_name?: string;
  required_rank_name_ar?: string;
  required_rank_level?: number;
  condition_operator?: 'AND' | 'OR';
  reward_bonus: number;
  gift_name?: string;
  gift_name_ar?: string;
  gift_image_url?: string;
  unlocked_generations: number;
  color_hex?: string;
  is_active: number | boolean;
  achievers_count?: number;
}

export default function LeaderRanks() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [ranks, setRanks] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewRank, setIsNewRank] = useState(false);
  const [selectedRank, setSelectedRank] = useState<RankItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id?: string;
    level: number;
    name: string;
    name_ar: string;
    tagline: string;
    tagline_ar: string;
    badge_icon: string;
    logo_url: string;
    min_direct_sales: number;
    min_team_turnover: number;
    required_rank_id: string;
    required_rank_count: number;
    condition_operator: 'AND' | 'OR';
    reward_bonus: number;
    gift_name: string;
    gift_name_ar: string;
    gift_image_url: string;
    unlocked_generations: number;
    color_hex: string;
    is_active: boolean;
  }>({
    level: 1,
    name: '',
    name_ar: '',
    tagline: '',
    tagline_ar: '',
    badge_icon: 'award',
    logo_url: '',
    min_direct_sales: 0,
    min_team_turnover: 1000,
    required_rank_id: '',
    required_rank_count: 0,
    condition_operator: 'AND',
    reward_bonus: 0,
    gift_name: '',
    gift_name_ar: '',
    gift_image_url: '',
    unlocked_generations: 2,
    color_hex: '#0284c7',
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRanks();
  }, []);

  const loadRanks = async () => {
    try {
      setLoading(true);
      const res = await adminAffiliateService.getRanks();
      setRanks(res.ranks || []);
    } catch (err: any) {
      toast.error(tr("فشل تحميل الرتب القيادية", "Failed to load leader ranks"));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsNewRank(true);
    setSelectedRank(null);
    const maxLevel = ranks.length > 0 ? Math.max(...ranks.map(r => r.level)) : 0;
    const nextLevel = maxLevel + 1;

    setFormData({
      level: nextLevel,
      name: '',
      name_ar: '',
      tagline: '',
      tagline_ar: '',
      badge_icon: 'award',
      logo_url: '',
      min_direct_sales: 0,
      min_team_turnover: 1000,
      required_rank_id: ranks.length > 0 ? ranks[ranks.length - 1].id : '',
      required_rank_count: 2,
      condition_operator: 'AND',
      reward_bonus: 0,
      gift_name: '',
      gift_name_ar: '',
      gift_image_url: '',
      unlocked_generations: 2,
      color_hex: '#6366f1',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rank: RankItem) => {
    setIsNewRank(false);
    setSelectedRank(rank);
    setFormData({
      id: rank.id,
      level: rank.level,
      name: rank.name,
      name_ar: rank.name_ar,
      tagline: rank.tagline || '',
      tagline_ar: rank.tagline_ar || '',
      badge_icon: rank.badge_icon || 'award',
      logo_url: rank.logo_url || '',
      min_direct_sales: Number(rank.min_direct_sales || 0),
      min_team_turnover: Number(rank.min_team_turnover || 0),
      required_rank_id: rank.required_rank_id || '',
      required_rank_count: Number(rank.required_rank_count || 0),
      condition_operator: rank.condition_operator || 'AND',
      reward_bonus: Number(rank.reward_bonus || 0),
      gift_name: rank.gift_name || '',
      gift_name_ar: rank.gift_name_ar || '',
      gift_image_url: rank.gift_image_url || '',
      unlocked_generations: Number(rank.unlocked_generations || 0),
      color_hex: rank.color_hex || '#6366f1',
      is_active: Boolean(rank.is_active),
    });
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(tr("حجم الصورة يجب ألا يتجاوز 5 ميغابايت", "Image size must not exceed 5MB"));
      return;
    }

    try {
      setUploadingLogo(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      const token = localStorage.getItem('token');
      const res = await axios.post('/api/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      const uploadedUrl = res.data.fileUrl || res.data.url;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, logo_url: uploadedUrl }));
        toast.success(tr("تم رفع الشعار بنجاح", "Logo uploaded successfully"));
      }
    } catch (err) {
      toast.error(tr("فشل رفع الشعار، يرجى المحاولة مرة أخرى", "Failed to upload logo, please try again"));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.name_ar.trim()) {
      toast.error(tr("يرجى كتابة اسم الرتبة بالعربية والإنجليزية", "Please provide rank name in Arabic and English"));
      return;
    }

    try {
      setSaving(true);
      if (isNewRank) {
        await adminAffiliateService.createRank(formData);
        toast.success(tr("تمت إضافة الرتبة الجديدة بنجاح", "New rank created successfully"));
      } else if (selectedRank) {
        await adminAffiliateService.updateRank(selectedRank.id, formData);
        toast.success(tr("تم تحديث الرتبة وإعداداتها بنجاح", "Rank settings updated successfully"));
      }
      setIsModalOpen(false);
      loadRanks();
    } catch (err: any) {
      const msg = err.response?.data?.error || tr("فشل حفظ الرتبة", "Failed to save rank");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rank: RankItem) => {
    const confirmMsg = tr(
      `هل أنت متأكد من حذف أو تعطيل الرتبة "${rank.name_ar}"؟`,
      `Are you sure you want to delete or deactivate rank "${rank.name}"?`
    );
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminAffiliateService.deleteRank(rank.id);
      toast.success(tr("تم تحديث حالة الرتبة بنجاح", "Rank status updated successfully"));
      loadRanks();
    } catch (err: any) {
      const msg = err.response?.data?.error || tr("فشل حذف الرتبة", "Failed to delete rank");
      toast.error(msg);
    }
  };

  const getRankBadgeElement = (rank: { logo_url?: string; badge_icon?: string; color_hex?: string }) => {
    if (rank.logo_url) {
      return (
        <img 
          src={rank.logo_url} 
          alt="Rank Logo" 
          className="h-12 w-12 object-contain drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    const icon = rank.badge_icon || 'award';
    switch (icon) {
      case 'user': return <User className="h-6 w-6 text-white" />;
      case 'sprout': return <Sparkles className="h-6 w-6 text-white" />;
      case 'zap': return <Zap className="h-6 w-6 text-white" />;
      case 'layers': return <Layers className="h-6 w-6 text-white" />;
      case 'crown': return <Crown className="h-6 w-6 text-white" />;
      case 'plane': return <Plane className="h-6 w-6 text-white" />;
      case 'gem': return <Gem className="h-6 w-6 text-white" />;
      case 'trophy': return <Trophy className="h-6 w-6 text-white" />;
      default: return <Award className="h-6 w-6 text-white" />;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-16">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl text-white">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Nexyvora Leadership & Dynamic Ranks Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              {tr("إدارة الرتب القيادية والشروط والشعارات", "Leader Ranks, Rules & Custom Logos")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              {tr(
                "تحكّم ديناميكي كامل في سلّم الرتب القيادية، متطلبات مبيعات الفريق (Team Sales)، شروط قادة الفريق المؤهلين، المكافآت المالية والهدايا، ورفع شعارات مخصصة لكل رتبة.",
                "Full dynamic control over leader ranks ladder, Team Sales turnover criteria, downline leadership requirements, cash rewards, gifts, and custom uploaded logos."
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenCreate}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl px-5 py-2.5 shadow-lg shadow-amber-500/20 gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{tr("إضافة رتبة جديدة", "Add New Rank")}</span>
            </Button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">{tr("إجمالي الرتب المسجلة", "Total Ranks")}</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {ranks.length}
            </div>
          </Card>
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">{tr("الرتب النشطة للأعضاء", "Active Ranks")}</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {ranks.filter(r => r.is_active).length}
            </div>
          </Card>
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">{tr("إجمالي القادة المترقين", "Total Achievers")}</span>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {ranks.reduce((acc, r) => acc + (r.achievers_count || 0), 0)}
            </div>
          </Card>
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-xs text-slate-500">{tr("أعلى سقف مبيعات", "Max Team Turnover")}</span>
            <div className="text-2xl font-black text-amber-500 mt-1">
              ${Math.max(...ranks.map(r => Number(r.min_team_turnover || 0)), 0).toLocaleString()}
            </div>
          </Card>
        </div>

        {/* Ranks Ladder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-24 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-600" />
              <p>{tr("جاري تحميل الرتب القيادية...", "Loading leader ranks...")}</p>
            </div>
          ) : (
            ranks.map((r) => {
              const reqRank = ranks.find(other => other.id === r.required_rank_id);
              const isActive = Boolean(r.is_active);

              return (
                <Card 
                  key={r.id} 
                  className={`rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                    isActive 
                      ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:border-indigo-400/50' 
                      : 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 opacity-60'
                  }`}
                >
                  {/* Top Color Accent Bar */}
                  <div 
                    className="h-2 w-full" 
                    style={{ backgroundColor: r.color_hex || '#0284c7' }}
                  />

                  <div className="p-5 space-y-4">
                    {/* Header: Badge & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="h-14 w-14 rounded-2xl flex items-center justify-center p-2 shadow-md shrink-0"
                          style={{ backgroundColor: r.color_hex ? `${r.color_hex}22` : '#0284c722', border: `2px solid ${r.color_hex || '#0284c7'}` }}
                        >
                          {getRankBadgeElement(r)}
                        </div>
                        <div>
                          <span 
                            className="inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white mb-0.5"
                            style={{ backgroundColor: r.color_hex || '#0284c7' }}
                          >
                            {tr(`المستوى ${r.level}`, `Level ${r.level}`)}
                          </span>
                          <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                            {isRtl ? r.name_ar : r.name}
                          </h3>
                          <span className="text-[11px] text-slate-400 block">
                            {isRtl ? r.name : r.name_ar}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive 
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          {isActive ? tr("نشط", "Active") : tr("معطل", "Disabled")}
                        </span>
                        {r.achievers_count !== undefined && r.achievers_count > 0 && (
                          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-500" />
                            {r.achievers_count} {tr("قائد", "leaders")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tagline */}
                    {(r.tagline || r.tagline_ar) && (
                      <p className="text-xs italic text-slate-500 dark:text-slate-400 line-clamp-1 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        "{isRtl ? (r.tagline_ar || r.tagline) : (r.tagline || r.tagline_ar)}"
                      </p>
                    )}

                    {/* Criteria Details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{tr("حجم مبيعات الفريق (Team Sales):", "Team Sales Required:")}</span>
                        <strong className="font-mono text-slate-900 dark:text-white text-sm">
                          ${Number(r.min_team_turnover).toLocaleString()} USD
                        </strong>
                      </div>

                      <div className="flex justify-between items-start py-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">{tr("شرط القيادة (Leadership):", "Leadership Condition:")}</span>
                        <div className="text-right">
                          {Number(r.required_rank_count || 0) > 0 && reqRank ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                              <Award className="w-3 h-3" />
                              <span>{r.required_rank_count} × {isRtl ? (reqRank.name_ar || reqRank.name) : reqRank.name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">{tr("لا يوجد شرط إضافي", "None")}</span>
                          )}
                        </div>
                      </div>

                      {/* Condition Operator */}
                      <div className="flex justify-between items-center py-0.5 text-[11px] text-slate-400">
                        <span>{tr("منطق الربط بين الشروط:", "Condition Logic:")}</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {r.condition_operator === 'OR' ? tr("أحد الشروط (OR)", "Any (OR)") : tr("كل الشروط (AND)", "All (AND)")}
                        </span>
                      </div>

                      {/* Cash Reward & Gift */}
                      <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 space-y-1.5 mt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{tr("المكافأة النقدية:", "Cash Reward:")}</span>
                          <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            {Number(r.reward_bonus) > 0 ? `+$${Number(r.reward_bonus).toLocaleString()} USD` : '$0'}
                          </strong>
                        </div>
                        {(r.gift_name || r.gift_name_ar) && (
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-500/10">
                            <span className="text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5" />
                              {tr("الهدية التكريمية:", "Exclusive Gift:")}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {isRtl ? (r.gift_name_ar || r.gift_name) : (r.gift_name || r.gift_name_ar)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400">
                        <span>{tr("الأجيال المفتوحة في الشجرة:", "Unlocked Generations:")}</span>
                        <span className="font-mono font-bold text-indigo-500">
                          {r.unlocked_generations === 0 
                            ? tr("المباشر فقط", "Direct only") 
                            : r.unlocked_generations === 10 
                            ? tr("جميع الأجيال (1-10)", "All 1-10") 
                            : `Gen 1-${r.unlocked_generations}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(r)}
                      className="rounded-xl text-xs gap-1.5 flex-1 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 font-bold"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {tr("تعديل الرتبة والشعار", "Edit Rank & Logo")}
                    </Button>

                    {r.level > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r)}
                        className="rounded-xl text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
                        title={tr("حذف أو تعطيل", "Delete or Deactivate")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Modal: Add / Edit Rank */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <form onSubmit={handleSave} className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span>
                    {isNewRank 
                      ? tr("إضافة رتبة قيادية جديدة", "Add New Leader Rank") 
                      : tr(`تعديل إعدادات الرتبة: ${formData.name_ar} (${formData.name})`, `Edit Rank: ${formData.name}`)}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {tr(
                    "اضبط شروط الترقية، مبيعات الفريق المطلوبة، شرط القيادة، المكافأة النقدية والهدية، وارفع شعار الرتبة المخصص.",
                    "Set promotion criteria, Team Sales requirements, leadership conditions, cash reward, gift, and custom rank logo."
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Columns: Inputs (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Basic Information */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-500" />
                      {tr("المعلومات الأساسية والهوية", "Basic Information & Identity")}
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("الاسم بالعربية", "Arabic Name")} *</Label>
                        <Input
                          value={formData.name_ar}
                          onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                          placeholder="مثال: الرؤية (Visionary)"
                          className="rounded-xl text-xs"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("الاسم بالإنجليزية", "English Name")} *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Visionary"
                          className="rounded-xl text-xs"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("الوصف / الشعار (عربي)", "Tagline (Arabic)")}</Label>
                        <Input
                          value={formData.tagline_ar}
                          onChange={(e) => setFormData({ ...formData, tagline_ar: e.target.value })}
                          placeholder="مثال: قُد التغيير والريادة"
                          className="rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("الوصف / الشعار (إنجليزي)", "Tagline (English)")}</Label>
                        <Input
                          value={formData.tagline}
                          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                          placeholder="e.g. Drive the change"
                          className="rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("المستوى / الترتيب", "Level / Order")} *</Label>
                        <Input
                          type="number"
                          min="0"
                          max="99"
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                          className="rounded-xl text-xs font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("لون الرتبة (Hex)", "Color (Hex)")}</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={formData.color_hex}
                            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                            className="h-8 w-10 rounded-lg cursor-pointer border"
                          />
                          <Input
                            value={formData.color_hex}
                            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                            className="rounded-xl text-xs font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("الأجيال المفتوحة (0-10)", "Generations (0-10)")}</Label>
                        <Input
                          type="number"
                          min="0"
                          max="10"
                          value={formData.unlocked_generations}
                          onChange={(e) => setFormData({ ...formData, unlocked_generations: Number(e.target.value) })}
                          className="rounded-xl text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promotion Requirements */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {tr("شروط الترقية والتأهل", "Promotion & Qualification Criteria")}
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {tr("مبيعات الفريق المطلوبة ($ USD)", "Required Team Sales ($ USD)")} *
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={formData.min_team_turnover}
                          onChange={(e) => setFormData({ ...formData, min_team_turnover: Number(e.target.value) })}
                          className="rounded-xl text-xs font-mono font-bold"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">
                          {tr("المبيعات المباشرة (عدد الطلاب)", "Direct Sales (Students)")}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.min_direct_sales}
                          onChange={(e) => setFormData({ ...formData, min_direct_sales: Number(e.target.value) })}
                          className="rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Dynamic Leadership Requirement */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <Label className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        {tr("شرط القيادة (Leadership Requirement):", "Leadership Condition:")}
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-2 space-y-1">
                          <Label className="text-[11px] text-slate-400">{tr("الرتبة المطلوبة للأعضاء", "Required Member Rank")}</Label>
                          <select
                            value={formData.required_rank_id}
                            onChange={(e) => setFormData({ ...formData, required_rank_id: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">{tr("-- لا يوجد شرط قيادة إضافي --", "-- No leadership condition --")}</option>
                            {ranks
                              .filter(rk => !selectedRank || rk.id !== selectedRank.id)
                              .map(rk => (
                                <option key={rk.id} value={rk.id}>
                                  Level {rk.level}: {isRtl ? rk.name_ar : rk.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-slate-400">{tr("العدد المطلوب", "Required Count")}</Label>
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            value={formData.required_rank_count}
                            onChange={(e) => setFormData({ ...formData, required_rank_count: Number(e.target.value) })}
                            className="rounded-xl text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Operator */}
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {tr("منطق التحقق عند تعدد الشروط:", "Evaluation Logic Operator:")}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="condition_operator"
                            checked={formData.condition_operator === 'AND'}
                            onChange={() => setFormData({ ...formData, condition_operator: 'AND' })}
                            className="text-indigo-600"
                          />
                          <span className="font-bold">AND ({tr("كل الشروط", "All rules")})</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="condition_operator"
                            checked={formData.condition_operator === 'OR'}
                            onChange={() => setFormData({ ...formData, condition_operator: 'OR' })}
                            className="text-indigo-600"
                          />
                          <span className="font-bold">OR ({tr("أحد الشروط", "Any rule")})</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Rewards & Gifts */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-emerald-500" />
                      {tr("المكافآت النقدية والهدايا العينية", "Cash Rewards & Physical Gifts")}
                    </h4>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {tr("المكافأة النقدية الفورية ($ USD)", "Instant Cash Reward ($ USD)")}
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.reward_bonus}
                        onChange={(e) => setFormData({ ...formData, reward_bonus: Number(e.target.value) })}
                        placeholder="0"
                        className="rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("اسم الهدية (عربي)", "Gift Name (Arabic)")}</Label>
                        <Input
                          value={formData.gift_name_ar}
                          onChange={(e) => setFormData({ ...formData, gift_name_ar: e.target.value })}
                          placeholder="مثال: هاتف آيفون (iPhone)"
                          className="rounded-xl text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold">{tr("اسم الهدية (إنجليزي)", "Gift Name (English)")}</Label>
                        <Input
                          value={formData.gift_name}
                          onChange={(e) => setFormData({ ...formData, gift_name: e.target.value })}
                          placeholder="e.g. iPhone"
                          className="rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom Logo Upload */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                      {tr("شعار وأيقونة الرتبة المخصص", "Custom Rank Logo & Icon")}
                    </h4>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div 
                        className="h-20 w-20 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-slate-200 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-900"
                        style={{ borderColor: formData.color_hex }}
                      >
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Rank Logo" className="h-16 w-16 object-contain" />
                        ) : (
                          <Award className="h-10 w-10 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleLogoUpload}
                          accept="image/*,.svg"
                          className="hidden"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingLogo}
                            onClick={() => fileInputRef.current?.click()}
                            className="rounded-xl text-xs gap-1.5 font-bold"
                          >
                            {uploadingLogo ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            {tr("رفع شعار جديد", "Upload Logo")}
                          </Button>

                          {formData.logo_url && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setFormData({ ...formData, logo_url: '' })}
                              className="rounded-xl text-xs text-rose-500 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              {tr("إزالة الشعار", "Remove Logo")}
                            </Button>
                          )}
                        </div>

                        <Input
                          value={formData.logo_url}
                          onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                          placeholder="https://... أو مسار الشعار /ranks/..."
                          className="rounded-xl text-[11px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {tr("تفعيل الرتبة في المنصة", "Activate Rank in Platform")}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {tr("عند التعطيل، لن تظهر في سلم الترقية للأعضاء الجدد دون المساس بالمترقين القدامى.", "When disabled, hidden from new promotions without affecting existing achievers.")}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-5 w-5 rounded text-indigo-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Right Column: LIVE PREVIEW (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="sticky top-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Eye className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{tr("معاينة حية كما ستظهر للأعضاء", "Live Member Preview")}</span>
                    </div>

                    {/* Member Card Preview */}
                    <Card className="rounded-3xl border-2 border-slate-700 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 text-white shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                      {/* Glow Accent */}
                      <div 
                        className="absolute -top-24 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
                        style={{ backgroundColor: formData.color_hex }}
                      />

                      {/* Rank Logo in Preview */}
                      <div 
                        className="h-24 w-24 rounded-3xl flex items-center justify-center p-3 shadow-xl mb-3 relative z-10"
                        style={{ 
                          backgroundColor: `${formData.color_hex}22`,
                          border: `2px solid ${formData.color_hex}`,
                          boxShadow: `0 0 25px ${formData.color_hex}44`
                        }}
                      >
                        {formData.logo_url ? (
                          <img src={formData.logo_url} alt="Preview" className="h-18 w-18 object-contain" />
                        ) : (
                          <Award className="h-12 w-12" style={{ color: formData.color_hex }} />
                        )}
                      </div>

                      {/* Level Badge */}
                      <span 
                        className="px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider mb-1"
                        style={{ backgroundColor: formData.color_hex, color: '#ffffff' }}
                      >
                        LEVEL {formData.level}
                      </span>

                      {/* Title */}
                      <h3 className="text-xl font-black mt-1">
                        {isRtl ? (formData.name_ar || 'اسم الرتبة') : (formData.name || 'Rank Name')}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {isRtl ? formData.name : formData.name_ar}
                      </p>

                      {/* Tagline */}
                      {(formData.tagline || formData.tagline_ar) && (
                        <p className="text-xs italic text-slate-300 mt-2 px-4">
                          "{isRtl ? (formData.tagline_ar || formData.tagline) : (formData.tagline || formData.tagline_ar)}"
                        </p>
                      )}

                      {/* Requirements Box */}
                      <div className="w-full mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-2 text-left rtl:text-right">
                        <div className="flex justify-between items-center text-slate-300">
                          <span>{tr("حجم مبيعات الفريق:", "Team Sales:")}</span>
                          <strong className="text-white font-mono text-sm">${Number(formData.min_team_turnover).toLocaleString()}</strong>
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span>{tr("شرط القيادة:", "Leadership Req:")}</span>
                          <strong className="text-amber-400 font-bold">
                            {formData.required_rank_count > 0 && formData.required_rank_id ? (
                              `${formData.required_rank_count} × ${
                                ranks.find(rk => rk.id === formData.required_rank_id)?.name || 'Leader'
                              }`
                            ) : (
                              tr("لا يوجد", "None")
                            )}
                          </strong>
                        </div>

                        {Number(formData.reward_bonus) > 0 && (
                          <div className="flex justify-between items-center text-emerald-400 font-bold pt-1 border-t border-white/10">
                            <span>{tr("المكافأة النقدية:", "Cash Reward:")}</span>
                            <span className="font-mono text-sm">+${Number(formData.reward_bonus).toLocaleString()} USD</span>
                          </div>
                        )}

                        {(formData.gift_name || formData.gift_name_ar) && (
                          <div className="flex justify-between items-center text-amber-300 font-bold pt-1 border-t border-white/10">
                            <span className="flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5" />
                              {tr("الهدية:", "Gift:")}
                            </span>
                            <span>{isRtl ? (formData.gift_name_ar || formData.gift_name) : (formData.gift_name || formData.gift_name_ar)}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)} 
                  className="rounded-xl"
                >
                  {tr("إلغاء", "Cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving || uploadingLogo} 
                  className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isNewRank ? tr("إضافة الرتبة وحفظها", "Create Rank") : tr("حفظ التعديلات", "Save Changes")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
