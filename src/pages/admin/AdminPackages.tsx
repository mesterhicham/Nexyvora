import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { packageService, formationService } from '@/services/apiService';
import { 
  BookOpen, 
  Layers, 
  Check, 
  Loader2, 
  Edit, 
  Plus, 
  DollarSign, 
  Users, 
  Trash2, 
  Sliders, 
  Sparkles,
  Flame,
  Clock,
  UserCheck,
  Search,
  ArrowUpCircle,
  ShieldCheck,
  Power
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPackages() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [packages, setPackages] = useState<any[]>([]);
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign courses modal
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [selectedFormations, setSelectedFormations] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // Create package modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    name_ar: '',
    slug: '',
    price: 150,
    promo_price: '',
    promo_start_at: '',
    promo_end_at: '',
    is_promo_active: false,
    level: 1,
    unlocked_generations: 2,
    description: '',
    description_ar: '',
    badge_text: '',
    is_active: true,
    features: [] as string[],
  });
  const [newCreateFeature, setNewCreateFeature] = useState('');

  // Edit package modal
  const [editingPack, setEditingPack] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    name_ar: '',
    price: 0,
    promo_price: '' as string | number,
    promo_start_at: '',
    promo_end_at: '',
    is_promo_active: false,
    level: 1,
    unlocked_generations: 1,
    description: '',
    description_ar: '',
    badge_text: '',
    is_active: true,
    features: [] as string[],
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  // Manual Member Upgrade modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersList, setMembersList] = useState<any[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [upgradeTargetPackageId, setUpgradeTargetPackageId] = useState('');
  const [upgradeAmountPaid, setUpgradeAmountPaid] = useState<number>(0);
  const [upgradeNotes, setUpgradeNotes] = useState('');
  const [savingUpgrade, setSavingUpgrade] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packsRes, formsRes] = await Promise.all([
        packageService.getAll({ all: true }),
        formationService.getFormations().catch((err) => {
          console.warn('[AdminPackages] getFormations error:', err);
          return [];
        }),
      ]);
      setPackages(packsRes?.packages || (Array.isArray(packsRes) ? packsRes : []));
      setFormations(Array.isArray(formsRes) ? formsRes : (formsRes?.formations || []));
    } catch (err: any) {
      console.error('[AdminPackages loadData error]', err);
      toast.error(t('adminPackages.loadError', 'Failed to load packages and courses'));
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (d: string | null | undefined) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // --- Create package logic ---
  const handleOpenCreateModal = () => {
    const nextLevel = packages.length > 0 ? Math.max(...packages.map(p => Number(p.level) || 0)) + 1 : 1;
    setCreateForm({
      name: '',
      name_ar: '',
      slug: '',
      price: 150,
      promo_price: '',
      promo_start_at: '',
      promo_end_at: '',
      is_promo_active: false,
      level: nextLevel,
      unlocked_generations: 2,
      description: '',
      description_ar: '',
      badge_text: '',
      is_active: true,
      features: [],
    });
    setNewCreateFeature('');
    setIsCreateOpen(true);
  };

  const handleAddCreateFeature = () => {
    const trimmed = newCreateFeature.trim();
    if (!trimmed) return;
    setCreateForm(prev => ({
      ...prev,
      features: [...prev.features, trimmed],
    }));
    setNewCreateFeature('');
  };

  const handleSaveCreate = async () => {
    if (!createForm.name.trim() || !createForm.name_ar.trim()) {
      return toast.error(tr("يرجى إدخال اسم الباقة باللغتين العربية والإنجليزية", "Please enter package name in both English and Arabic"));
    }
    if (createForm.price < 0) {
      return toast.error(tr("سعر الباقة لا يمكن أن يكون سالباً", "Price cannot be negative"));
    }

    try {
      setSavingCreate(true);
      await packageService.createPackage({
        name: createForm.name.trim(),
        name_ar: createForm.name_ar.trim(),
        slug: createForm.slug.trim() || undefined,
        price: Number(createForm.price),
        promo_price: createForm.promo_price !== '' ? Number(createForm.promo_price) : null,
        promo_start_at: createForm.promo_start_at || null,
        promo_end_at: createForm.promo_end_at || null,
        is_promo_active: createForm.is_promo_active ? 1 : 0,
        level: Number(createForm.level),
        unlocked_generations: Number(createForm.unlocked_generations),
        description: createForm.description.trim(),
        description_ar: createForm.description_ar.trim(),
        badge_text: createForm.badge_text.trim() || undefined,
        is_active: createForm.is_active ? 1 : 0,
        features: createForm.features.filter(f => f.trim().length > 0),
      });

      toast.success(tr("تم إنشاء الباقة بنجاح!", "Package created successfully!"));
      setIsCreateOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || tr("فشل إنشاء الباقة", "Failed to create package"));
    } finally {
      setSavingCreate(false);
    }
  };

  // --- Assign courses logic ---
  const handleOpenAssignModal = async (pack: any) => {
    setSelectedPack(pack);
    try {
      const details = await packageService.getDetails(pack.id);
      const existingIds = (details.courses || []).map((c: any) => c.formation_id || c.id);
      setSelectedFormations(existingIds);
    } catch (err) {
      setSelectedFormations([]);
    }
  };

  const toggleFormation = (id: string) => {
    setSelectedFormations(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleSaveCourses = async () => {
    if (!selectedPack) return;

    try {
      setAssigning(true);
      await packageService.assignCourses(selectedPack.id, selectedFormations);
      const packName = isRtl ? (selectedPack.name_ar || selectedPack.name) : (selectedPack.name || selectedPack.name_ar);
      toast.success(t('adminPackages.assignSuccess', 'Successfully linked {{count}} courses to {{name}}', {
        count: selectedFormations.length,
        name: packName
      }));
      setSelectedPack(null);
      loadData();
    } catch (err: any) {
      toast.error(t('adminPackages.assignFailed', 'Failed to link courses to package'));
    } finally {
      setAssigning(false);
    }
  };

  // --- Edit package logic ---
  const handleOpenEditModal = (pack: any) => {
    setEditingPack(pack);
    let parsedFeatures: string[] = [];
    if (Array.isArray(pack.features)) {
      parsedFeatures = pack.features;
    } else if (typeof pack.features === 'string') {
      try {
        parsedFeatures = JSON.parse(pack.features);
      } catch (e) {
        parsedFeatures = [];
      }
    }

    setEditForm({
      name: pack.name || '',
      name_ar: pack.name_ar || '',
      price: Number(pack.price) || 0,
      promo_price: pack.promo_price !== null && pack.promo_price !== undefined ? Number(pack.promo_price) : '',
      promo_start_at: formatDateForInput(pack.promo_start_at),
      promo_end_at: formatDateForInput(pack.promo_end_at),
      is_promo_active: Boolean(pack.is_promo_active),
      level: Number(pack.level) || 1,
      unlocked_generations: Number(pack.unlocked_generations) || 1,
      description: pack.description || '',
      description_ar: pack.description_ar || '',
      badge_text: pack.badge_text || '',
      is_active: pack.is_active !== 0,
      features: parsedFeatures,
    });
    setNewFeatureText('');
  };

  const handleAddFeature = () => {
    const trimmed = newFeatureText.trim();
    if (!trimmed) return;
    setEditForm(prev => ({
      ...prev,
      features: [...prev.features, trimmed],
    }));
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateFeatureText = (index: number, val: string) => {
    setEditForm(prev => {
      const updated = [...prev.features];
      updated[index] = val;
      return { ...prev, features: updated };
    });
  };

  const handleSaveEdit = async () => {
    if (!editingPack) return;
    if (!editForm.name_ar.trim() || !editForm.name.trim()) {
      toast.error(t('adminPackages.nameValidation', 'Please enter package name in both Arabic and English'));
      return;
    }
    if (editForm.price < 0) {
      toast.error(t('adminPackages.priceValidation', 'Package price cannot be negative'));
      return;
    }

    try {
      setSavingEdit(true);
      await packageService.updatePackage(editingPack.id, {
        name: editForm.name.trim(),
        name_ar: editForm.name_ar.trim(),
        price: Number(editForm.price),
        promo_price: editForm.promo_price !== '' ? Number(editForm.promo_price) : null,
        promo_start_at: editForm.promo_start_at || null,
        promo_end_at: editForm.promo_end_at || null,
        is_promo_active: editForm.is_promo_active ? 1 : 0,
        level: Number(editForm.level),
        unlocked_generations: Number(editForm.unlocked_generations),
        description: editForm.description.trim(),
        description_ar: editForm.description_ar.trim(),
        badge_text: editForm.badge_text.trim() || null,
        is_active: editForm.is_active ? 1 : 0,
        features: editForm.features.filter(f => f.trim().length > 0),
      });

      const updatedName = isRtl ? editForm.name_ar : editForm.name;
      toast.success(t('adminPackages.updateSuccess', 'Package \'{{name}}\' updated successfully!', { name: updatedName }));
      setEditingPack(null);
      await loadData();
    } catch (err: any) {
      console.error('[AdminPackages handleSaveEdit error]', err);
      toast.error(err.response?.data?.error || t('adminPackages.updateFailed', 'Failed to save package changes'));
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTogglePackageActive = async (pack: any) => {
    const newStatus = pack.is_active === 1 ? 0 : 1;
    try {
      await packageService.updatePackage(pack.id, { is_active: newStatus });
      toast.success(newStatus === 1 ? tr("تم تفعيل الباقة بنجاح", "Package activated") : tr("تم تعطيل الباقة بنجاح", "Package deactivated"));
      loadData();
    } catch (err: any) {
      toast.error(tr("فشل تغيير حالة الباقة", "Failed to toggle package status"));
    }
  };

  // --- Manual Member Upgrade Modal logic ---
  const handleOpenUpgradeModal = async () => {
    setIsUpgradeModalOpen(true);
    setSelectedMember(null);
    setUpgradeTargetPackageId('');
    setUpgradeAmountPaid(0);
    setUpgradeNotes('');
    loadMembersForUpgrade();
  };

  const loadMembersForUpgrade = async (query = '') => {
    try {
      setMembersLoading(true);
      const res = await packageService.getMembersWithPackages({ search: query, limit: 30 });
      setMembersList(res?.members || []);
    } catch (err) {
      console.error(err);
      toast.error(tr("فشل تحميل قائمة الأعضاء", "Failed to load members list"));
    } finally {
      setMembersLoading(false);
    }
  };

  const handleSelectMemberForUpgrade = (m: any) => {
    setSelectedMember(m);
    // Find next eligible packages
    const currentLvl = m.package_level || 0;
    const eligibleTarget = packages.find(p => p.level > currentLvl && p.is_active === 1);
    if (eligibleTarget) {
      setUpgradeTargetPackageId(eligibleTarget.id);
      const currentPaid = Number(m.amount_paid || m.package_price || 0);
      const targetEffective = Number(eligibleTarget.effective_price || eligibleTarget.price || 0);
      setUpgradeAmountPaid(Math.max(0, Number((targetEffective - currentPaid).toFixed(2))));
    } else {
      setUpgradeTargetPackageId('');
      setUpgradeAmountPaid(0);
    }
  };

  const handleTargetPackageChange = (pkgId: string) => {
    setUpgradeTargetPackageId(pkgId);
    const target = packages.find(p => p.id === pkgId);
    if (target && selectedMember) {
      const currentPaid = Number(selectedMember.amount_paid || selectedMember.package_price || 0);
      const targetEffective = Number(target.effective_price || target.price || 0);
      setUpgradeAmountPaid(Math.max(0, Number((targetEffective - currentPaid).toFixed(2))));
    }
  };

  const handleExecuteManualUpgrade = async () => {
    if (!selectedMember || !upgradeTargetPackageId) {
      return toast.error(tr("يرجى اختيار العضو والباقة المستهدفة للترقية", "Please select a member and a target package"));
    }

    try {
      setSavingUpgrade(true);
      const res = await packageService.manualUpgrade({
        userId: selectedMember.id,
        packageId: upgradeTargetPackageId,
        amountPaid: upgradeAmountPaid,
        notes: upgradeNotes.trim() || undefined,
      });

      toast.success(res.message || tr("تمت ترقية العضو بنجاح!", "Member upgraded successfully!"));
      setIsUpgradeModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || tr("فشل تنفيذ الترقية", "Failed to execute upgrade"));
    } finally {
      setSavingUpgrade(false);
    }
  };

  const getGenerationDescription = (gens: number) => {
    switch (gens) {
      case 0:
        return tr("لا تفتح أجيال عمولات (عضوية تسجيل فقط)", "No commission generations unlocked");
      case 1:
        return t('adminPackages.gen1Desc', 'Gen 1 only (10% direct commission)');
      case 2:
        return t('adminPackages.gen2Desc', 'Gen 1 & 2 (10% direct + 4% second gen)');
      case 3:
        return t('adminPackages.gen3Desc', 'Gen 1 to 3 (10% + 4% + 3%)');
      case 4:
        return t('adminPackages.gen4Desc', 'Gen 1 to 4 (10% + 4% + 3% + 2%)');
      case 5:
        return t('adminPackages.gen5Desc', 'All generations (1 to 5 - full commissions 20%)');
      default:
        return t('adminPackages.genNDesc', 'Unlocked up to generation {{gens}}', { gens });
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black uppercase tracking-wider mb-1">
              {t('adminPackages.storeBadge', 'Store & Tiers Management')}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('adminPackages.title', 'Packages & Subscriptions Management')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {tr("إنشاء باقات جديدة، تخصيص الأسعار والعروض الترويجية المؤقتة، وإدارة اشتراكات وترقيات الأعضاء.", "Create packages, configure pricing and temporary promo discounts, and manage member upgrades.")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={handleOpenUpgradeModal}
              variant="outline"
              className="rounded-2xl font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs gap-2 py-5"
            >
              <ArrowUpCircle className="h-4 w-4" />
              {tr("إدارة اشتراكات وترقيات الأعضاء", "Manage Subscriptions & Upgrades")}
            </Button>

            <Button
              onClick={handleOpenCreateModal}
              className="rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-2 py-5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              {tr("+ Add New Package", "+ Add New Package")}
            </Button>
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {loading ? (
            <div className="col-span-full text-center py-20 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
              {t('adminPackages.loadingPackages', 'Loading packages...')}
            </div>
          ) : (
            packages.map((p) => {
              const packFeatures: string[] = Array.isArray(p.features)
                ? p.features
                : (typeof p.features === 'string' ? JSON.parse(p.features || '[]') : []);

              const packTitle = isRtl ? (p.name_ar || p.name) : (p.name || p.name_ar);
              const packSubTitle = isRtl ? p.name : p.name_ar;
              const packDesc = isRtl ? (p.description_ar || p.description) : (p.description || p.description_ar);
              const isAiPackage = p.slug?.includes('ai') || p.name?.includes('AI');
              const hasActivePromo = p.has_active_promo || (p.is_promo_active && p.promo_price);

              return (
                <Card 
                  key={p.id}
                  className={`rounded-3xl border ${
                    isAiPackage 
                      ? 'border-indigo-400 dark:border-indigo-600 shadow-indigo-100 dark:shadow-indigo-950/50 shadow-md ring-1 ring-indigo-400/30' 
                      : 'border-slate-200 dark:border-slate-800 shadow-xs'
                  } bg-white dark:bg-slate-900 p-5 flex flex-col justify-between hover:shadow-md transition-all ${
                    p.is_active === 0 ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : ''
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top Level & Status */}
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                          {t('adminPackages.levelPrefix', 'Level')} {p.level}
                        </Badge>
                        {isAiPackage && (
                          <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black border-0 gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI TIER
                          </Badge>
                        )}
                      </div>

                      <Badge variant={p.is_active === 1 ? "default" : "secondary"} className={`text-[10px] font-bold ${
                        p.is_active === 1 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {p.is_active === 1 ? tr("مفعلة", "Active") : tr("معطلة", "Inactive")}
                      </Badge>
                    </div>

                    {/* Price Section with Promo Tag */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      {hasActivePromo ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 line-through font-mono">
                              ${Number(p.price).toFixed(0)}
                            </span>
                            <Badge className="bg-rose-500 text-white text-[10px] font-black gap-1 px-1.5 py-0.5">
                              <Flame className="h-3 w-3 fill-white" />
                              {tr("تخفيض مؤقت", "Promo")}
                            </Badge>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="font-mono text-2xl font-black text-rose-600 dark:text-rose-400">
                              ${Number(p.promo_price || p.effective_price).toFixed(0)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">USD</span>
                          </div>
                          {p.promo_end_at && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 pt-0.5">
                              <Clock className="h-3 w-3" />
                              <span>{tr("حتى:", "Until:")} {new Date(p.promo_end_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-between">
                          <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                            ${Number(p.price).toFixed(0)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">USD</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {packTitle}
                      </h3>
                      {packSubTitle && (
                        <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {packSubTitle}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {packDesc}
                      </p>
                    </div>

                    {/* Generations Badge */}
                    <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold flex items-center gap-1 text-[11px]">
                          <Users className="h-3.5 w-3.5 text-emerald-600" />
                          {tr("أجيال التسويق:", "Generations:")}
                        </span>
                        <Badge className="bg-emerald-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5">
                          {p.unlocked_generations || 0} {tr("أجيال", "Gens")}
                        </Badge>
                      </div>
                    </div>

                    {/* Direct Courses Count */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-[11px]">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          {tr("الدورات المباشرة:", "Courses:")}
                        </span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{p.course_count || 0}</strong>
                      </div>
                    </div>

                    {/* Features Preview */}
                    {packFeatures.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="space-y-1">
                          {packFeatures.slice(0, 3).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                          {packFeatures.length > 3 && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              +{packFeatures.length - 3} {tr("مميزات إضافية...", "more features...")}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <Button
                      onClick={() => handleOpenEditModal(p)}
                      variant="outline"
                      className="w-full rounded-2xl font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 gap-1.5 text-xs py-2"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {tr("تعديل الباقة والأسعار", "Edit Package")}
                    </Button>

                    <Button
                      onClick={() => handleOpenAssignModal(p)}
                      className="w-full rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 text-xs py-2 shadow-xs"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {tr("ربط الدورات ({{count}})", "Courses ({{count}})", { count: p.course_count || 0 })}
                    </Button>

                    <Button
                      onClick={() => handleTogglePackageActive(p)}
                      variant="ghost"
                      size="sm"
                      className={`w-full text-[11px] font-bold gap-1 rounded-xl ${
                        p.is_active === 1 ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="h-3 w-3" />
                      {p.is_active === 1 ? tr("تعطيل مؤقت للباقة", "Deactivate") : tr("تفعيل الباقة في المتجر", "Activate")}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* ==================== CREATE PACKAGE MODAL ==================== */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl rounded-3xl max-h-[92vh] flex flex-col p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Plus className="h-5 w-5 text-indigo-600" />
                {tr("+ إنشاء باقة جديدة في الأكاديمية", "+ Add New Academy Package")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {tr("قم بتحديد اسم الباقة، المستوى الهرمي، الأسعار، العروض الترويجية، ومميزات الباقة.", "Configure package details, tier level, regular/promo pricing, and feature bullets.")}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1 pl-1">
              {/* Row 1: Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("اسم الباقة (بالعربية) *", "Package Name (Arabic) *")}
                  </Label>
                  <Input
                    value={createForm.name_ar}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    placeholder="مثال: AI PLUS — باقة الذكاء الاصطناعي"
                    className="rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("اسم الباقة (بالإنجليزية) *", "Package Name (English) *")}
                  </Label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. AI PLUS"
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Level, Generations & Original Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("المستوى الهرمي (Level) *", "Tier Level *")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={createForm.level}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, level: parseInt(e.target.value, 10) || 1 }))}
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400">{tr("يحدد ترتيب الباقة واستحقاق الدورات", "Determines course inheritance hierarchy")}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("السعر الأصلي ($ USD) *", "Regular Price ($) *")}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      min={0}
                      value={createForm.price}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl text-xs font-mono font-bold pr-8"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("أجيال التسويق المفتوحة", "Unlocked Generations")}
                  </Label>
                  <Select
                    value={String(createForm.unlocked_generations)}
                    onValueChange={(val) => setCreateForm(prev => ({ ...prev, unlocked_generations: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="0" className="text-xs">{tr("0 أجيال (تسجيل مجتمع فقط)", "0 Generations")}</SelectItem>
                      <SelectItem value="1" className="text-xs">{tr("الجيل 1 فقط (10%)", "Gen 1 only")}</SelectItem>
                      <SelectItem value="2" className="text-xs">{tr("الجيل 1 و 2 (10% + 4%)", "Gen 1 & 2")}</SelectItem>
                      <SelectItem value="3" className="text-xs">{tr("الجيل 1 حتى 3", "Gen 1 to 3")}</SelectItem>
                      <SelectItem value="4" className="text-xs">{tr("الجيل 1 حتى 4", "Gen 1 to 4")}</SelectItem>
                      <SelectItem value="5" className="text-xs">{tr("الجيل 1 حتى 5 (كاملة)", "Gen 1 to 5")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Promotional Discount Section */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {tr("إعدادات العرض الترويجي والتخفيض المؤقت", "Promotional Discount Settings")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="promo-toggle-create" className="text-xs text-amber-800 font-medium">
                      {createForm.is_promo_active ? tr("العرض مفعل", "Promo Active") : tr("العرض معطل", "Promo Disabled")}
                    </Label>
                    <Switch
                      id="promo-toggle-create"
                      checked={createForm.is_promo_active}
                      onCheckedChange={(c) => setCreateForm(prev => ({ ...prev, is_promo_active: c }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("السعر الترويجي ($ USD)", "Promo Price ($)")}
                    </Label>
                    <Input
                      type="number"
                      placeholder="مثال: 200"
                      value={createForm.promo_price}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, promo_price: e.target.value }))}
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("تاريخ ووقت بدء العرض", "Promo Start Date & Time")}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={createForm.promo_start_at}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, promo_start_at: e.target.value }))}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("تاريخ ووقت انتهاء العرض", "Promo End Date & Time")}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={createForm.promo_end_at}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, promo_end_at: e.target.value }))}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Descriptions & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("الوصف (بالعربية)", "Description (Arabic)")}
                  </Label>
                  <Textarea
                    rows={2}
                    value={createForm.description_ar}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description_ar: e.target.value }))}
                    placeholder="وصف مختصر لمحتويات الباقة..."
                    className="rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("نص الشارة الترويجية (Badge Text)", "Badge Text")}
                  </Label>
                  <Input
                    value={createForm.badge_text}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, badge_text: e.target.value }))}
                    placeholder="مثال: عرض محدود 7 أيام 🔥"
                    className="rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {tr("مميزات ومحتويات الباقة ({{count}})", "Package Features ({{count}})", { count: createForm.features.length })}
                </Label>

                <div className="flex items-center gap-2">
                  <Input
                    value={newCreateFeature}
                    onChange={(e) => setNewCreateFeature(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCreateFeature();
                      }
                    }}
                    placeholder={tr("أدخل ميزة جديدة واضغط إضافة...", "Type a feature and press add...")}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddCreateFeature}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 font-bold shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {tr("إضافة ميزة", "Add")}
                  </Button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {createForm.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="line-clamp-1">{feat}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setCreateForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== idx) }))}
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl text-xs">
                {t('adminPackages.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveCreate}
                disabled={savingCreate}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
              >
                {savingCreate ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("حفظ وتفعيل الباقة الجديدة", "Create Package")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== EDIT PACKAGE MODAL ==================== */}
        <Dialog open={Boolean(editingPack)} onOpenChange={(open) => !open && setEditingPack(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl rounded-3xl max-h-[92vh] flex flex-col p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <Sliders className="h-5 w-5 text-indigo-600" />
                {t('adminPackages.editPackageModalTitle', 'Edit Package: {{nameAr}} ({{nameEn}})', {
                  nameAr: editingPack?.name_ar,
                  nameEn: editingPack?.name
                })}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                {tr("تعديل تفاصيل الباقة، الأسعار، العروض الترويجية وتواريخها، وأجيال التسويق.", "Modify pricing, promotional duration, unlocked generations, and feature bullets.")}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1 pl-1">
              {/* Row 1: Name Arabic & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('adminPackages.nameArRequired', 'Package Name (Arabic) *')}
                  </Label>
                  <Input
                    value={editForm.name_ar}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="rounded-xl text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('adminPackages.nameEnRequired', 'Package Name (English) *')}
                  </Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Level, Price & Generations */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("المستوى (Level)", "Level")}
                  </Label>
                  <Input
                    type="number"
                    value={editForm.level}
                    onChange={(e) => setEditForm(prev => ({ ...prev, level: parseInt(e.target.value, 10) || 1 }))}
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('adminPackages.priceRequired', 'Package Price ($ USD) *')}
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={editForm.price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="rounded-xl text-xs font-mono font-bold pr-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{t('adminPackages.unlockedGensLabel', 'Unlocked Generations')}</span>
                  </Label>
                  <Select
                    value={String(editForm.unlocked_generations)}
                    onValueChange={(val) => setEditForm(prev => ({ ...prev, unlocked_generations: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="0" className="text-xs">{tr("0 أجيال", "0 Generations")}</SelectItem>
                      <SelectItem value="1" className="text-xs">{t('adminPackages.gen1Desc', 'Gen 1 only (10%)')}</SelectItem>
                      <SelectItem value="2" className="text-xs">{t('adminPackages.gen2Desc', 'Gen 1 & 2 (10% + 4%)')}</SelectItem>
                      <SelectItem value="3" className="text-xs">{t('adminPackages.gen3Desc', 'Gen 1 to 3 (10% + 4% + 3%)')}</SelectItem>
                      <SelectItem value="4" className="text-xs">{t('adminPackages.gen4Desc', 'Gen 1 to 4')}</SelectItem>
                      <SelectItem value="5" className="text-xs">{t('adminPackages.gen5Desc', 'All generations (1 to 5)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Promotional Discount Edit Section */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-600 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {tr("إعدادات التخفيض المؤقت (العرض الترويجي)", "Promotional Discount Settings")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="promo-toggle-edit" className="text-xs text-amber-800 font-medium">
                      {editForm.is_promo_active ? tr("العرض نشط حالياً 🔥", "Promo Active") : tr("العرض غير مفعّل", "Promo Inactive")}
                    </Label>
                    <Switch
                      id="promo-toggle-edit"
                      checked={editForm.is_promo_active}
                      onCheckedChange={(c) => setEditForm(prev => ({ ...prev, is_promo_active: c }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("السعر الترويجي ($ USD)", "Promo Price ($)")}
                    </Label>
                    <Input
                      type="number"
                      placeholder="مثال: 200"
                      value={editForm.promo_price}
                      onChange={(e) => setEditForm(prev => ({ ...prev, promo_price: e.target.value }))}
                      className="rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("تاريخ ووقت بدء العرض", "Promo Start Date & Time")}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={editForm.promo_start_at}
                      onChange={(e) => setEditForm(prev => ({ ...prev, promo_start_at: e.target.value }))}
                      className="rounded-xl text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("تاريخ ووقت انتهاء العرض", "Promo End Date & Time")}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={editForm.promo_end_at}
                      onChange={(e) => setEditForm(prev => ({ ...prev, promo_end_at: e.target.value }))}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Active Toggle & Badge Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {tr("نص الشارة الترويجية (Badge Text)", "Badge Text")}
                  </Label>
                  <Input
                    value={editForm.badge_text}
                    onChange={(e) => setEditForm(prev => ({ ...prev, badge_text: e.target.value }))}
                    placeholder="مثال: عرض محدود 7 أيام 🔥"
                    className="rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mt-4 sm:mt-0">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{tr("حالة الباقة في المتجر", "Store Visibility")}</p>
                    <p className="text-[10px] text-slate-400">{editForm.is_active ? tr("متاحة للشراء والترقية", "Active for purchase") : tr("مخفية من المتجر", "Hidden from store")}</p>
                  </div>
                  <Switch
                    checked={editForm.is_active}
                    onCheckedChange={(c) => setEditForm(prev => ({ ...prev, is_active: c }))}
                  />
                </div>
              </div>

              {/* Row 3: Descriptions */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('adminPackages.descAr', 'Description (Arabic)')}
                  </Label>
                  <Textarea
                    rows={2}
                    value={editForm.description_ar}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description_ar: e.target.value }))}
                    className="rounded-xl text-xs resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t('adminPackages.descEn', 'Description (English)')}
                  </Label>
                  <Textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="rounded-xl text-xs resize-none"
                  />
                </div>
              </div>

              {/* Row 4: Features */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  {t('adminPackages.featuresCountTitle', 'Included Features & Content ({{count}})', { count: editForm.features.length })}
                </Label>

                <div className="flex items-center gap-2">
                  <Input
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder={t('adminPackages.newFeaturePlaceholder', 'Type a new feature or benefit and press add...')}
                    className="rounded-xl text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddFeature}
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1 font-bold shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('adminPackages.addFeatureBtn', 'Add Feature')}
                  </Button>
                </div>

                <div className="space-y-2 mt-2 max-h-44 overflow-y-auto pr-1">
                  {editForm.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-mono text-slate-400 font-bold px-1">
                        #{idx + 1}
                      </span>
                      <Input
                        value={feat}
                        onChange={(e) => handleUpdateFeatureText(idx, e.target.value)}
                        className="h-8 rounded-lg text-xs bg-white dark:bg-slate-900"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFeature(idx)}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button 
                variant="outline" 
                onClick={() => setEditingPack(null)} 
                className="rounded-xl text-xs"
                disabled={savingEdit}
              >
                {t('adminPackages.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminPackages.saveChanges', 'Save Changes')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== ASSIGN COURSES MODAL ==================== */}
        <Dialog open={Boolean(selectedPack)} onOpenChange={(open) => !open && setSelectedPack(null)}>
          <DialogContent className="w-[95vw] sm:max-w-xl rounded-3xl max-h-[90vh] flex flex-col p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                {t('adminPackages.assignModalTitle', 'Assign Training Courses to {{name}}', {
                  name: isRtl ? (selectedPack?.name_ar || selectedPack?.name) : (selectedPack?.name || selectedPack?.name_ar)
                })}
              </DialogTitle>
              <DialogDescription>
                {t('adminPackages.assignModalDesc', 'Select the courses unlocked when a student activates this package (Level {{level}}).', {
                  level: selectedPack?.level
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto space-y-2 py-3 flex-1 pr-1">
              {formations.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {t('adminPackages.noCoursesAvailable', 'No training courses available in the academy currently.')}
                </div>
              ) : (
                formations.map((f) => {
                  const isSelected = selectedFormations.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => toggleFormation(f.id)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-lg flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs">{f.title || f.name}</p>
                          <p className="text-[10px] text-slate-400 line-clamp-1">{f.description || t('adminPackages.trainingCourse', 'Training Course')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {f.duration_hours ? `${f.duration_hours} ${t('adminPackages.hours', 'hours')}` : t('adminPackages.trainingCourse', 'Training Course')}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button variant="outline" onClick={() => setSelectedPack(null)} className="rounded-xl">
                {t('adminPackages.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSaveCourses}
                disabled={assigning}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
              >
                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : t('adminPackages.saveAssignedCourses', 'Save Assigned Courses')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ==================== MANAGE MEMBER UPGRADES MODAL ==================== */}
        <Dialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
          <DialogContent className="w-[95vw] sm:max-w-2xl rounded-3xl max-h-[92vh] flex flex-col p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                {tr("إدارة اشتراكات وترقيات الأعضاء اليدوية", "Manage Member Subscriptions & Manual Upgrades")}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {tr("ترقية حساب أي عضو يدوياً إلى باقة أعلى، تحديد المبلغ المدفوع، وتسجيل العملية في سجل الرقابة.", "Manually upgrade member subscription, adjust paid difference, and record the action.")}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-y-auto space-y-4 py-3 flex-1 pr-1 pl-1">
              {/* Member Search Bar */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("ابحث عن عضو (البريد الإلكتروني، الاسم، أو الهاتف)", "Search Member")}
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={tr("أدخل البريد الإلكتروني للبحث...", "Search by email or name...")}
                      value={searchMemberQuery}
                      onChange={(e) => setSearchMemberQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          loadMembersForUpgrade(searchMemberQuery);
                        }
                      }}
                      className="rounded-xl text-xs pr-9"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => loadMembersForUpgrade(searchMemberQuery)}
                    className="rounded-xl text-xs bg-slate-800 text-white px-4"
                  >
                    {tr("بحث", "Search")}
                  </Button>
                </div>
              </div>

              {/* Member Selection List */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {tr("اختر العضو المراد ترقيته:", "Select Member:")}
                </Label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {membersLoading ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-indigo-600" />
                      {tr("جاري جلب الأعضاء...", "Loading members...")}
                    </div>
                  ) : membersList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      {tr("لم يتم العثور على أعضاء مطابقين للبحث", "No members found")}
                    </div>
                  ) : (
                    membersList.map((m) => {
                      const isSelected = selectedMember?.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleSelectMemberForUpgrade(m)}
                          className={`p-3 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                            isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{m.email}</p>
                            <p className="text-[10px] text-slate-400">{m.full_name || m.username || tr("طالب", "Student")}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px]">
                              {m.package_name_ar || m.package_name || tr("بدون باقة", "No Package")}
                            </Badge>
                            {m.amount_paid && (
                              <p className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5">
                                {tr("مدفوع:", "Paid:")} ${Number(m.amount_paid).toFixed(0)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Upgrade Configuration (if member selected) */}
              {selectedMember && (
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <span>{tr("العضو المحدد:", "Selected Member:")} {selectedMember.email}</span>
                    <Badge className="bg-indigo-600 text-white text-[10px]">
                      {selectedMember.package_name_ar || selectedMember.package_name || tr("بدون باقة", "No Package")}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {tr("الباقة المستهدفة للترقية *", "Target Package *")}
                      </Label>
                      <Select
                        value={upgradeTargetPackageId}
                        onValueChange={handleTargetPackageChange}
                      >
                        <SelectTrigger className="rounded-xl text-xs font-bold bg-white dark:bg-slate-900">
                          <SelectValue placeholder={tr("اختر الباقة...", "Select package...")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {packages.filter(p => p.is_active === 1).map((p) => (
                            <SelectItem key={p.id} value={p.id} className="text-xs">
                              {p.name_ar || p.name} (Level {p.level}) - ${Number(p.effective_price || p.price).toFixed(0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {tr("المبلغ المسجل للمدفوعات ($ USD)", "Amount Recorded as Paid ($)")}
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        value={upgradeAmountPaid}
                        onChange={(e) => setUpgradeAmountPaid(parseFloat(e.target.value) || 0)}
                        className="rounded-xl text-xs font-mono font-bold bg-white dark:bg-slate-900"
                      />
                      <p className="text-[10px] text-slate-400">
                        {tr("فرق السعر التلقائي (أو 0 لمنحة مجانية)", "Auto calculated price difference (or 0 for grant)")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {tr("ملاحظات إدارية (اختياري)", "Admin Notes")}
                    </Label>
                    <Input
                      placeholder={tr("سبب الترقية، رقم الإيصال، إلخ...", "Reason, transaction reference, etc...")}
                      value={upgradeNotes}
                      onChange={(e) => setUpgradeNotes(e.target.value)}
                      className="rounded-xl text-xs bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
              <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)} className="rounded-xl text-xs">
                {t('adminPackages.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleExecuteManualUpgrade}
                disabled={savingUpgrade || !selectedMember || !upgradeTargetPackageId}
                className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-1 text-xs"
              >
                {savingUpgrade ? <Loader2 className="h-4 w-4 animate-spin" /> : tr("تأكيد الترقية وتفعيل الحساب", "Confirm Upgrade")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
