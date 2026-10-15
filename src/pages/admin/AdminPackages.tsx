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
  Sparkles
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

  // Edit package modal
  const [editingPack, setEditingPack] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    name_ar: '',
    price: 0,
    unlocked_generations: 1,
    description: '',
    description_ar: '',
    features: [] as string[],
  });
  const [newFeatureText, setNewFeatureText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [packsRes, formsRes] = await Promise.all([
        packageService.getAll(),
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
      unlocked_generations: Number(pack.unlocked_generations) || 1,
      description: pack.description || '',
      description_ar: pack.description_ar || '',
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
        unlocked_generations: Number(editForm.unlocked_generations),
        description: editForm.description.trim(),
        description_ar: editForm.description_ar.trim(),
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

  const getGenerationDescription = (gens: number) => {
    switch (gens) {
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
              {t('adminPackages.subtitle', 'Create, edit, and organize learning tiers, pricing, and associate educational courses with packages.')}
            </p>
          </div>
        </div>

        {/* Packages Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-4 text-center py-20 text-slate-400">
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

              return (
                <Card 
                  key={p.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:border-indigo-300 dark:hover:border-indigo-800"
                >
                  <div className="space-y-4">
                    {/* Top Badges & Price */}
                    <div className="flex items-center justify-between">
                      <Badge className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                        {t('adminPackages.levelPrefix', 'Level')} {p.level}
                      </Badge>
                      <div className={isRtl ? 'text-left' : 'text-right'}>
                        <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                          ${Number(p.price).toFixed(0)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">USD</span>
                      </div>
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {packTitle}
                      </h3>
                      {packSubTitle && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                          {packSubTitle}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {packDesc}
                      </p>
                    </div>

                    {/* Generation Unlock Badge */}
                    <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
                        <span className="font-bold flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-emerald-600" />
                          {t('adminPackages.unlockedGensTitle', 'Unlocked Generations:')}
                        </span>
                        <Badge className="bg-emerald-600 text-white font-mono font-bold text-xs px-2 py-0.5">
                          {p.unlocked_generations || 1} {p.unlocked_generations === 1 ? t('adminPackages.generationUnit', 'Gen') : t('adminPackages.generationsUnit', 'Generations')}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {getGenerationDescription(p.unlocked_generations || 1)}
                      </p>
                    </div>

                    {/* Direct Courses Count */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                          {t('adminPackages.directCoursesTitle', 'Direct Courses:')}
                        </span>
                        <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{p.course_count || 0} {t('adminPackages.courseUnit', 'courses')}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {t('adminPackages.higherLevelsNote', '* Automatically unlocked for higher tiers')} {p.level < 4 ? `(${p.level + 1} - 4)` : ''}
                      </p>
                    </div>

                    {/* Features Preview */}
                    {packFeatures.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('adminPackages.featuresPreview', 'Key Features:')}
                        </p>
                        <div className="space-y-1">
                          {packFeatures.slice(0, 3).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                          {packFeatures.length > 3 && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              {t('adminPackages.moreFeatures', '+ {{count}} additional features...', { count: packFeatures.length - 3 })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <Button
                      onClick={() => handleOpenEditModal(p)}
                      variant="outline"
                      className="w-full rounded-2xl font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 gap-2 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      {t('adminPackages.editPackageBtn', 'Edit Package')}
                    </Button>

                    <Button
                      onClick={() => handleOpenAssignModal(p)}
                      className="w-full rounded-2xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs shadow-xs"
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {t('adminPackages.assignCoursesBtn', 'Assign Courses')}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Edit Package Modal */}
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
                {t('adminPackages.editPackageModalDesc', 'Modify package name, price, unlocked commission generations, description, and features.')}
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
                    placeholder={tr("مثال: الباقة الأساسية", "e.g. Basic Package")}
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
                    placeholder="e.g. Starter Pack"
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Price & Unlocked Generations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <span>{t('adminPackages.unlockedGensLabel', 'Unlocked Generations (Generations)')}</span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">
                      {editForm.unlocked_generations} {t('adminPackages.generationsUnit', 'Generations')}
                    </Badge>
                  </Label>
                  <Select
                    value={String(editForm.unlocked_generations)}
                    onValueChange={(val) => setEditForm(prev => ({ ...prev, unlocked_generations: parseInt(val, 10) }))}
                  >
                    <SelectTrigger className="rounded-xl text-xs font-bold">
                      <SelectValue placeholder={t('adminPackages.unlockedGens', 'Unlocked Generations (1-10)')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="1" className="text-xs">
                        {t('adminPackages.gen1Desc', 'Gen 1 only (10% direct commission)')}
                      </SelectItem>
                      <SelectItem value="2" className="text-xs">
                        {t('adminPackages.gen2Desc', 'Gen 1 & 2 (10% direct + 4% second gen)')}
                      </SelectItem>
                      <SelectItem value="3" className="text-xs">
                        {t('adminPackages.gen3Desc', 'Gen 1 to 3 (10% + 4% + 3%)')}
                      </SelectItem>
                      <SelectItem value="4" className="text-xs">
                        {t('adminPackages.gen4Desc', 'Gen 1 to 4 (10% + 4% + 3% + 2%)')}
                      </SelectItem>
                      <SelectItem value="5" className="text-xs font-bold text-emerald-600">
                        {t('adminPackages.gen5Desc', 'All generations (1 to 5 - full commissions 20%)')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Generation Explanation Notice */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>{t('adminPackages.generationImpactTitle', 'Generation setting impact in affiliate system:')}</span>
                </div>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                  {t('adminPackages.generationImpactDesc', 'Subscribers to this package will automatically benefit from: {{desc}}. If sales occur at higher generation tiers and the user is not qualified, they will be prompted to upgrade.', {
                    desc: getGenerationDescription(editForm.unlocked_generations)
                  })}
                </p>
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
                    placeholder={tr("وصف مختصر لمحتوى وهدف الباقة...", "Brief description of package content and objective...")}
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
                    placeholder="Brief package description in English..."
                    className="rounded-xl text-xs resize-none"
                  />
                </div>
              </div>

              {/* Row 4: Features / Content Bullets */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    {t('adminPackages.featuresCountTitle', 'Included Features & Content ({{count}})', { count: editForm.features.length })}
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    {t('adminPackages.featuresHelper', 'Displayed as selling points on the store checkout page and student account')}
                  </span>
                </div>

                {/* Add new feature bar */}
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

                {/* Existing features list */}
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto pr-1">
                  {editForm.features.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      {t('adminPackages.noFeaturesYet', 'No features added yet. Add your first feature above.')}
                    </div>
                  ) : (
                    editForm.features.map((feat, idx) => (
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
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg shrink-0"
                          title={t('adminPackages.removeFeature', 'Delete feature')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
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

        {/* Assign Courses Modal */}
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
      </div>
    </DashboardLayout>
  );
}
