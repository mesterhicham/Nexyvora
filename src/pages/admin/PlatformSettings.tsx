import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminFeatures';
import { Palette, Image, Type, Save, Loader2, Globe, Share2, Upload, Trash2, Sparkles, RefreshCw, Eye, ExternalLink, GraduationCap, Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { uploadService } from '@/services/apiService';
import { toast } from 'sonner';

function hexToHsl(hex: string): string {
  if (!hex) return '217 91% 30%';
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  if (isNaN(num)) return '217 91% 30%';

  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0x00ff) / 255;
  const b = (num & 0x0000ff) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hslStr: string): string {
  if (!hslStr) return '#0747a6';
  if (hslStr.startsWith('#')) return hslStr;
  const parts = hslStr.match(/\d+/g);
  if (!parts || parts.length < 3) return '#0747a6';

  const h = parseInt(parts[0]) / 360;
  const s = parseInt(parts[1]) / 100;
  const l = parseInt(parts[2]) / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function PlatformSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const handleChange = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    await updateSetting.mutateAsync({ key, value: editedValues[key] ?? settings?.map[key]?.value ?? '' });
    setEditedValues(prev => {
      const newValues = { ...prev };
      delete newValues[key];
      return newValues;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('admin.fileTooLarge', isRtl ? 'حجم الملف يتجاوز 5 ميجابايت' : 'File size exceeds 5MB'));
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res && res.url) {
        handleChange('logo_url', res.url);
        await updateSetting.mutateAsync({ key: 'logo_url', value: res.url });
        setEditedValues(prev => {
          const copy = { ...prev };
          delete copy['logo_url'];
          return copy;
        });
        toast.success(t('admin.logoUploadedSuccess', isRtl ? 'تم رفع صورة الشعار وتحديث الإعدادات بنجاح!' : 'Logo uploaded successfully!'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isRtl ? 'فشل في رفع صورة الشعار' : 'Failed to upload logo'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error(t('admin.fileTooLarge', isRtl ? 'حجم الملف يتجاوز 8 ميجابايت' : 'File size exceeds 8MB'));
      return;
    }

    setUploadingHero(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res && res.url) {
        handleChange('hero_image_url', res.url);
        await updateSetting.mutateAsync({ key: 'hero_image_url', value: res.url });
        setEditedValues(prev => {
          const copy = { ...prev };
          delete copy['hero_image_url'];
          return copy;
        });
        toast.success(t('admin.heroImageUploadedSuccess', isRtl ? 'تم رفع صورة الـ HERO وتحديث الإعدادات بنجاح!' : 'Hero image uploaded successfully!'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isRtl ? 'فشل في رفع صورة الـ HERO' : 'Failed to upload hero image'));
    } finally {
      setUploadingHero(false);
      if (heroFileInputRef.current) {
        heroFileInputRef.current.value = '';
      }
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(isRtl ? 'حجم الملف يتجاوز 2 ميجابايت' : 'File size exceeds 2MB');
      return;
    }

    setUploadingFavicon(true);
    try {
      const res = await uploadService.uploadFile(file);
      if (res && res.url) {
        handleChange('favicon_url', res.url);
        await updateSetting.mutateAsync({ key: 'favicon_url', value: res.url });
        setEditedValues(prev => {
          const copy = { ...prev };
          delete copy['favicon_url'];
          return copy;
        });
        toast.success(isRtl ? 'تم رفع وتعيين Favicon بنجاح!' : 'Favicon uploaded successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (isRtl ? 'فشل في رفع Favicon' : 'Failed to upload favicon'));
    } finally {
      setUploadingFavicon(false);
      if (faviconFileInputRef.current) {
        faviconFileInputRef.current.value = '';
      }
    }
  };

  const landingKeys = [
    'hero_image_url',
    'hero_badge',
    'hero_title',
    'hero_title_accent',
    'hero_subtitle',
    'hero_cta_primary_text',
    'hero_cta_primary_link',
    'hero_cta_secondary_text',
    'hero_cta_secondary_link',
    'hero_stat_1_val',
    'hero_stat_1_label',
    'hero_stat_2_val',
    'hero_stat_2_label',
    'hero_stat_3_val',
    'hero_stat_3_label',
    'hero_stat_4_val',
    'hero_stat_4_label',
    'cta_title',
    'cta_subtitle',
    'cta_button_text',
  ];

  const hasAnyLandingChanges = landingKeys.some(k => k in editedValues && editedValues[k] !== settings?.map[k]?.value);

  const handleSaveAllLanding = async () => {
    const changed = landingKeys.filter(k => k in editedValues && editedValues[k] !== settings?.map[k]?.value);
    for (const key of changed) {
      await updateSetting.mutateAsync({ key, value: editedValues[key] });
    }
    setEditedValues(prev => {
      const copy = { ...prev };
      landingKeys.forEach(k => delete copy[k]);
      return copy;
    });
    toast.success(t('admin.allLandingSaved', isRtl ? 'تم حفظ جميع تعديلات الواجهة بنجاح!' : 'All landing adjustments saved successfully!'));
  };

  const getValue = (key: string) => {
    return editedValues[key] ?? settings?.map[key]?.value ?? '';
  };

  const hasChanges = (key: string) => {
    return key in editedValues && editedValues[key] !== settings?.map[key]?.value;
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <PageHeader
          title={t('admin.platformSettings')}
          description={t('admin.platformSettingsDesc')}
          breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('admin.platformSettings') }]}
        />
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title={t('admin.platformSettings')}
        description={t('admin.platformSettingsDesc')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: t('admin.platformSettings') }]}
      />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            {t('admin.branding')}
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            {t('admin.landingPage', isRtl ? 'الواجهة الرئيسية (Hero)' : 'Landing Page (Hero)')}
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('admin.theme')}
          </TabsTrigger>
          <TabsTrigger value="texts" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            {t('admin.uiTexts')}
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('admin.seo', 'SEO & Social')}
          </TabsTrigger>
          <TabsTrigger value="academy" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            {isRtl ? 'الأكاديمية وعرض المستويات' : 'Academy & Levels'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.branding')}</CardTitle>
              <CardDescription>{t('admin.brandingDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('admin.platformName')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={getValue('platform_name')}
                    onChange={(e) => handleChange('platform_name', e.target.value)}
                    maxLength={100}
                  />
                  <Button 
                    onClick={() => handleSave('platform_name')} 
                    disabled={!hasChanges('platform_name') || updateSetting.isPending}
                    size="icon"
                  >
                    {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Logo Section with File Upload */}
              <div className="space-y-4 pt-2">
                <Label className="text-base font-semibold">{t('admin.platformLogo', isRtl ? 'شعار المنصة (Logo)' : 'Platform Logo')}</Label>
                
                {/* Upload File Drag/Click Box */}
                <div className="p-4 border-2 border-dashed border-border rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-center sm:text-left rtl:sm:text-right">
                      <div className="p-3 bg-primary/10 text-primary rounded-lg shrink-0">
                        <Image className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t('admin.uploadLogoTitle', isRtl ? 'رفع صورة الشعار' : 'Upload Logo Image')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.uploadLogoHint', isRtl ? 'يدعم ملفات الصور PNG, JPG, JPEG, WEBP, SVG (الحد الأقصى 5 ميجابايت)' : 'Supports PNG, JPG, JPEG, WEBP, SVG (Max 5MB)')}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="gap-2 shrink-0 w-full sm:w-auto"
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingLogo ? t('common.uploading', isRtl ? 'جاري الرفع...' : 'Uploading...') : t('admin.selectLogoFile', isRtl ? 'اختيار ملف صورة' : 'Select Image File')}
                    </Button>
                  </div>
                </div>

                {/* Direct URL input fallback */}
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('admin.orEnterUrl', isRtl ? 'أو ادخل رابط الصورة مباشرة:' : 'Or enter direct image URL:')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('logo_url')}
                      onChange={(e) => handleChange('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <Button 
                      onClick={() => handleSave('logo_url')} 
                      disabled={!hasChanges('logo_url') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Live Logo Preview Box */}
                {getValue('logo_url') ? (
                  <div className="mt-3 p-4 bg-card border border-border rounded-xl flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-secondary/50 rounded-lg border border-border shrink-0">
                        <img 
                          src={getValue('logo_url')} 
                          alt="Logo preview" 
                          className="h-14 max-w-[180px] object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground">{t('admin.logoPreview', isRtl ? 'معاينة الشعار المخصص الحالي' : 'Current Custom Logo')}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-xs">{getValue('logo_url')}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0"
                      onClick={async () => {
                        handleChange('logo_url', '');
                        await updateSetting.mutateAsync({ key: 'logo_url', value: '' });
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('common.delete', isRtl ? 'حذف' : 'Delete')}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 p-4 bg-card border border-border rounded-xl flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-secondary/50 rounded-lg border border-border shrink-0">
                        <img 
                          src="/logo-light.png" 
                          alt="Default Logo" 
                          className="h-10 max-w-[180px] object-contain dark:hidden"
                        />
                        <img 
                          src="/logo-dark.png" 
                          alt="Default Logo" 
                          className="h-10 max-w-[180px] object-contain hidden dark:block"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground">{isRtl ? 'الشعار الرسمي النشط (Nexyvora)' : 'Active Official Logo (Nexyvora)'}</p>
                        <p className="text-xs text-muted-foreground">{isRtl ? 'شعار Nexyvora الافتراضي عالي الدقة مفعل حالياً' : 'Official high-definition Nexyvora logo is currently active'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.theme', isRtl ? 'مظهر وألوان المنصة' : 'Theme & Platform Colors')}</CardTitle>
              <CardDescription>{t('admin.themeDesc', isRtl ? 'تخصيص الهوية البصرية والألوان الرئيسية للمنصة بضغطة زر.' : 'Customize visual identity and theme colors.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Presets Palette Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">{t('admin.colorPresets', isRtl ? 'أنماط ألوان جاهزة (Presets)' : 'Theme Presets')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { name: isRtl ? 'الأزرق الأكاديمي' : 'Academic Blue', primary: '217 91% 30%', accent: '172 66% 40%', hexP: '#0747a6', hexA: '#22b8cf' },
                    { name: isRtl ? 'الزمرد الأكاديمي' : 'Emerald Green', primary: '160 84% 28%', accent: '38 92% 50%', hexP: '#0c7a52', hexA: '#f59e0b' },
                    { name: isRtl ? 'البنفسجي الملكي' : 'Royal Purple', primary: '262 83% 45%', accent: '330 81% 56%', hexP: '#6d28d9', hexA: '#ec4899' },
                    { name: isRtl ? 'العنابي الكلاسيكي' : 'Classic Crimson', primary: '348 83% 42%', accent: '25 95% 53%', hexP: '#be123c', hexA: '#f97316' },
                    { name: isRtl ? 'الداكن الفاخر' : 'Luxury Dark', primary: '222 47% 18%', accent: '188 86% 43%', hexP: '#1e293b', hexA: '#06b6d4' },
                    { name: isRtl ? 'الكهرماني الدافئ' : 'Warm Amber', primary: '38 92% 38%', accent: '142 71% 45%', hexP: '#b45309', hexA: '#16a34a' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        handleChange('primary_color', preset.primary);
                        handleChange('accent_color', preset.accent);
                        document.documentElement.style.setProperty('--primary', `hsl(${preset.primary})`);
                        document.documentElement.style.setProperty('--accent', `hsl(${preset.accent})`);
                      }}
                      className="p-3 border border-border rounded-xl bg-card hover:bg-secondary/40 transition-all text-right flex flex-col items-stretch gap-2 group cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-center gap-1.5 h-7 rounded-lg overflow-hidden border border-border/50">
                        <div className="flex-1 h-full" style={{ backgroundColor: preset.hexP }} />
                        <div className="w-1/3 h-full" style={{ backgroundColor: preset.hexA }} />
                      </div>
                      <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
                {/* Primary Color Picker */}
                <div className="space-y-3 p-4 bg-secondary/10 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t('admin.primaryColor', isRtl ? 'اللون الرئيسي (Primary)' : 'Primary Color')}</Label>
                    <span className="text-xs font-mono text-muted-foreground">{getValue('primary_color')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Visual Color Picker */}
                    <input
                      type="color"
                      value={hslToHex(getValue('primary_color'))}
                      onChange={(e) => {
                        const hsl = hexToHsl(e.target.value);
                        handleChange('primary_color', hsl);
                        document.documentElement.style.setProperty('--primary', `hsl(${hsl})`);
                      }}
                      className="h-11 w-14 rounded-lg cursor-pointer border border-border p-1 bg-card shrink-0"
                    />
                    <Input
                      value={getValue('primary_color')}
                      onChange={(e) => {
                        handleChange('primary_color', e.target.value);
                        document.documentElement.style.setProperty('--primary', e.target.value.includes('%') ? `hsl(${e.target.value})` : e.target.value);
                      }}
                      placeholder={isRtl ? "217 91% 30% أو #0747a6" : "217 91% 30% or #0747a6"}
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={() => handleSave('primary_color')} 
                      disabled={!hasChanges('primary_color') || updateSetting.isPending}
                      size="icon"
                      className="shrink-0"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{isRtl ? "يتحكم في لون الهيدر، الأزرار الرئيسية، والروابط النشطة." : "Controls header color, primary buttons, and active links."}</p>
                </div>

                {/* Accent Color Picker */}
                <div className="space-y-3 p-4 bg-secondary/10 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t('admin.accentColor', isRtl ? 'اللون الفرعي (Accent)' : 'Accent Color')}</Label>
                    <span className="text-xs font-mono text-muted-foreground">{getValue('accent_color')}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Visual Color Picker */}
                    <input
                      type="color"
                      value={hslToHex(getValue('accent_color'))}
                      onChange={(e) => {
                        const hsl = hexToHsl(e.target.value);
                        handleChange('accent_color', hsl);
                        document.documentElement.style.setProperty('--accent', `hsl(${hsl})`);
                      }}
                      className="h-11 w-14 rounded-lg cursor-pointer border border-border p-1 bg-card shrink-0"
                    />
                    <Input
                      value={getValue('accent_color')}
                      onChange={(e) => {
                        handleChange('accent_color', e.target.value);
                        document.documentElement.style.setProperty('--accent', e.target.value.includes('%') ? `hsl(${e.target.value})` : e.target.value);
                      }}
                      placeholder={isRtl ? "172 66% 40% أو #22b8cf" : "172 66% 40% or #22b8cf"}
                      className="font-mono text-sm"
                    />
                    <Button 
                      onClick={() => handleSave('accent_color')} 
                      disabled={!hasChanges('accent_color') || updateSetting.isPending}
                      size="icon"
                      className="shrink-0"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{isRtl ? "يتحكم في العناصر المتميزة، الشارات، والتظليل الإضافي." : "Controls highlights, badges, and accents."}</p>
                </div>
              </div>

              {/* Batch Save Button */}
              {(hasChanges('primary_color') || hasChanges('accent_color')) && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">{isRtl ? "لديك تغييرات غير محفوظة في ألوان المنصة." : "You have unsaved theme color changes."}</p>
                  <Button
                    onClick={async () => {
                      if (hasChanges('primary_color')) await handleSave('primary_color');
                      if (hasChanges('accent_color')) await handleSave('accent_color');
                    }}
                    disabled={updateSetting.isPending}
                    className="gap-2"
                  >
                    {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isRtl ? 'حفظ جميع الألوان' : 'Save All Colors'}
                  </Button>
                </div>
              )}

              {/* Live Preview UI Card */}
              <div className="pt-4 border-t space-y-3">
                <Label className="text-base font-semibold">{isRtl ? "معاينة مباشرة لمظهر المنصة (Live UI Preview)" : "Live UI Preview"}</Label>
                <div className="p-6 border border-border rounded-2xl bg-card shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})` }}
                      >
                        SU
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">Simply University</h4>
                        <p className="text-xs text-muted-foreground">{isRtl ? "معاينة عناصر الواجهة بالألوان الجديدة" : "UI components preview with selected palette"}</p>
                      </div>
                    </div>
                    <span 
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm"
                      style={{ backgroundColor: getValue('accent_color').startsWith('#') ? getValue('accent_color') : `hsl(${getValue('accent_color')})` }}
                    >
                      {isRtl ? "مميز (Accent)" : "Accent"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})` }}
                    >
                      {isRtl ? "زر رئيسي (Primary Button)" : "Primary Button"}
                    </button>

                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: getValue('accent_color').startsWith('#') ? getValue('accent_color') : `hsl(${getValue('accent_color')})` }}
                    >
                      {isRtl ? "زر فرعي (Accent Button)" : "Accent Button"}
                    </button>

                    <div 
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                      style={{ 
                        borderColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})`,
                        color: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})`
                      }}
                    >
                      {isRtl ? "مفعل (Outline)" : "Active (Outline)"}
                    </div>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="space-y-6">
          {/* Header Action Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary text-primary-foreground rounded-xl shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  {t('admin.landingPage', isRtl ? 'الواجهة الرئيسية وقسم الـ HERO' : 'Landing Page & Hero Section')}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('admin.landingPageDesc', isRtl ? 'تخصيص نصوص وصورة قسم الـ HERO لواجهة جامعة Simply مع معاينة حية.' : 'Customize hero section headings, image, and CTAs with live preview.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a 
                href="/" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {isRtl ? 'عرض الموقع الحي' : 'View Live Site'}
              </a>

              {hasAnyLandingChanges && (
                <Button 
                  onClick={handleSaveAllLanding}
                  disabled={updateSetting.isPending}
                  className="gap-2 shadow-md"
                >
                  {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('admin.saveAllLanding', isRtl ? 'حفظ جميع التعديلات' : 'Save All Changes')}
                </Button>
              )}
            </div>
          </div>

          {/* 1. Hero Image Section */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                {t('admin.heroImage', isRtl ? 'صورة الـ HERO لجامعة SIMPLY' : 'Simply University Hero Image')}
              </CardTitle>
              <CardDescription>
                {t('admin.heroImageDesc', isRtl ? 'الصورة المميزة المعروضة في واجهة المنصة بجانب النصوص الترحيبية لجامعة Simply University.' : 'Featured hero image displayed on home page next to welcome copy.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Box */}
              <div className="p-5 border-2 border-dashed border-border rounded-2xl bg-secondary/15 hover:bg-secondary/25 transition-all">
                <input
                  type="file"
                  ref={heroFileInputRef}
                  onChange={handleHeroImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-center sm:text-left rtl:sm:text-right">
                    <div className="p-3.5 bg-primary/10 text-primary rounded-xl shrink-0 shadow-sm">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {t('admin.uploadHeroImage', isRtl ? 'رفع صورة جديدة للـ HERO' : 'Upload New Hero Image')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRtl ? 'يدعم صيغ JPG, PNG, WEBP, SVG (الحد الأقصى 8 ميجابايت) — يُفضل صورة أفقية بدقة عالية 16:9' : 'Supports JPG, PNG, WEBP, SVG (Max 8MB) — 16:9 horizontal image recommended'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => heroFileInputRef.current?.click()}
                    disabled={uploadingHero}
                    className="gap-2 shrink-0 w-full sm:w-auto shadow-sm"
                  >
                    {uploadingHero ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingHero ? t('common.uploading', isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'اختيار صورة من الجهاز' : 'Choose Local Image')}
                  </Button>
                </div>
              </div>

              {/* Direct URL input fallback and reset button */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {isRtl ? 'أو ادخل مسار أو رابط الصورة مباشرة:' : 'Or enter image URL directly:'}
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={getValue('hero_image_url')}
                    onChange={(e) => handleChange('hero_image_url', e.target.value)}
                    placeholder={isRtl ? "/simply_university_hero.jpg أو https://..." : "/simply_university_hero.jpg or https://..."}
                    className="font-mono text-xs sm:text-sm"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => handleSave('hero_image_url')} 
                      disabled={!hasChanges('hero_image_url') || updateSetting.isPending}
                      className="gap-1.5"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isRtl ? 'حفظ' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      title={isRtl ? "استعادة صورة Simply University الافتراضية" : "Restore Simply University default image"}
                      onClick={async () => {
                        handleChange('hero_image_url', '/simply_university_hero.jpg');
                        await updateSetting.mutateAsync({ key: 'hero_image_url', value: '/simply_university_hero.jpg' });
                        toast.success(isRtl ? 'تمت استعادة صورة جامعة Simply الافتراضية بنجاح!' : 'Default image restored successfully!');
                      }}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {isRtl ? 'استعادة الافتراضية' : 'Restore Default'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hero Image Live Preview */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-primary" />
                      {t('admin.heroImagePreview', isRtl ? 'معاينة صورة الـ HERO الحالية' : 'Current Hero Image Preview')}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                      {getValue('hero_image_url') || '/simply_university_hero.jpg'}
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-border aspect-video max-h-64 bg-secondary/30">
                    <img 
                      src={getValue('hero_image_url') || '/simply_university_hero.jpg'} 
                      alt="Simply University Hero"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/simply_university_hero.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <span className="px-2.5 py-1 rounded-full bg-primary/90 text-[11px] font-bold shadow">
                          Simply University Campus
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

          {/* 2. Hero Typography & Headings */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                {isRtl ? 'عناوين ونصوص الـ HERO الرئيسية' : 'Hero Headings & Text'}
              </CardTitle>
              <CardDescription>
                {isRtl ? 'تخصيص الشارة العلوية، العنوان الرئيسي، العنوان الملون، والوصف الترحيبي.' : 'Customize tagline badge, main title, accent title, and hero subtitle.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Badge Tagline */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  <span>{t('admin.heroBadge', isRtl ? 'شارة البداية العلوية (Badge Tagline)' : 'Top Tagline Badge')}</span>
                  <span className="text-xs text-muted-foreground font-normal">{isRtl ? "تظهر كشارة مميزة فوق العنوان" : "Appears as badge above main title"}</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={getValue('hero_badge')}
                    onChange={(e) => handleChange('hero_badge', e.target.value)}
                    placeholder={isRtl ? "🎓 مرحباً بكم في جامعة Simply University — التميز والابتكار الأكاديمي" : "🎓 Welcome to Simply University — Academic Excellence & Innovation"}
                  />
                  <Button 
                    onClick={() => handleSave('hero_badge')} 
                    disabled={!hasChanges('hero_badge') || updateSetting.isPending}
                    size="icon"
                  >
                    {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Main Title & Accent Title */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t('admin.heroTitle', isRtl ? 'العنوان الرئيسي الأول' : 'Primary Main Title')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('hero_title')}
                      onChange={(e) => handleChange('hero_title', e.target.value)}
                      placeholder={isRtl ? "اصنع مستقبلك مع / Shape Your Future with" : "Shape Your Future with"}
                    />
                    <Button 
                      onClick={() => handleSave('hero_title')} 
                      disabled={!hasChanges('hero_title') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{isRtl ? "النص الأساسي للعنوان باللون الأبيض." : "Primary headline text."}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t('admin.heroTitleAccent', isRtl ? 'العنوان البارز الملون (Accent Title)' : 'Accent Title Headline')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('hero_title_accent')}
                      onChange={(e) => handleChange('hero_title_accent', e.target.value)}
                      placeholder={isRtl ? "SIMPLY UNIVERSITY / التعليم المهني المتخصص" : "SIMPLY UNIVERSITY / Specialized Professional Education"}
                    />
                    <Button 
                      onClick={() => handleSave('hero_title_accent')} 
                      disabled={!hasChanges('hero_title_accent') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{isRtl ? "السطر الثاني الملون بلون التمييز (Accent)." : "Second headline rendered in accent color."}</p>
                </div>
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">{t('admin.heroSubtitle', isRtl ? 'الوصف التعريفي للجامعة (Hero Subtitle)' : 'Hero Subtitle Description')}</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={getValue('hero_subtitle')}
                    onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                    rows={3}
                    placeholder={isRtl ? "انضم إلى آلاف الخريجين الناجحين الذين غيروا مسار حياتهم المهنية من خلال برامجنا التقنية الشاملة..." : "Join thousands of successful graduates who transformed their careers through our comprehensive programs..."}
                  />
                  <Button 
                    onClick={() => handleSave('hero_subtitle')} 
                    disabled={!hasChanges('hero_subtitle') || updateSetting.isPending}
                    size="icon"
                    className="self-end"
                  >
                    {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Hero CTA Buttons */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">{isRtl ? "أزرار الإجراء والدعوة (Hero CTA Buttons)" : "Hero CTA Buttons"}</CardTitle>
              <CardDescription>{isRtl ? "التحكم في نصوص وروابط أزرار الصفحة الرئيسية" : "Configure home page action buttons and target links"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Primary Button */}
                <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-3">
                  <span className="text-xs font-bold text-primary block">{isRtl ? "الزر الرئيسي (Primary Button)" : "Primary Button"}</span>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaPrimaryText', isRtl ? 'نص الزر' : 'Button Label')}</Label>
                      <Input
                        value={getValue('hero_cta_primary_text')}
                        onChange={(e) => handleChange('hero_cta_primary_text', e.target.value)}
                        placeholder={isRtl ? "ابدأ الآن / Get Started" : "Get Started"}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaPrimaryLink', isRtl ? 'رابط الوجهة' : 'Target Link')}</Label>
                      <Input
                        value={getValue('hero_cta_primary_link')}
                        onChange={(e) => handleChange('hero_cta_primary_link', e.target.value)}
                        placeholder={isRtl ? "/auth أو /login" : "/auth or /login"}
                      />
                    </div>
                    <Button 
                      onClick={async () => {
                        if (hasChanges('hero_cta_primary_text')) await handleSave('hero_cta_primary_text');
                        if (hasChanges('hero_cta_primary_link')) await handleSave('hero_cta_primary_link');
                      }}
                      disabled={(!hasChanges('hero_cta_primary_text') && !hasChanges('hero_cta_primary_link')) || updateSetting.isPending}
                      size="sm"
                      className="w-full mt-2"
                    >
                      {isRtl ? 'حفظ الزر الرئيسي' : 'Save Primary CTA'}
                    </Button>
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-3">
                  <span className="text-xs font-bold text-muted-foreground block">{isRtl ? "الزر الثانوي (Secondary Button)" : "Secondary Button"}</span>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaSecondaryText', isRtl ? 'نص الزر' : 'Button Label')}</Label>
                      <Input
                        value={getValue('hero_cta_secondary_text')}
                        onChange={(e) => handleChange('hero_cta_secondary_text', e.target.value)}
                        placeholder={isRtl ? "استكشف البرامج / Explore Programs" : "Explore Programs"}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaSecondaryLink', isRtl ? 'رابط الوجهة' : 'Target Link')}</Label>
                      <Input
                        value={getValue('hero_cta_secondary_link')}
                        onChange={(e) => handleChange('hero_cta_secondary_link', e.target.value)}
                        placeholder={isRtl ? "#programs أو /verify-diploma" : "#programs or /verify-diploma"}
                      />
                    </div>
                    <Button 
                      onClick={async () => {
                        if (hasChanges('hero_cta_secondary_text')) await handleSave('hero_cta_secondary_text');
                        if (hasChanges('hero_cta_secondary_link')) await handleSave('hero_cta_secondary_link');
                      }}
                      disabled={(!hasChanges('hero_cta_secondary_text') && !hasChanges('hero_cta_secondary_link')) || updateSetting.isPending}
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                    >
                      {isRtl ? 'حفظ الزر الثانوي' : 'Save Secondary CTA'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Hero Statistics */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">{t('admin.heroStats', isRtl ? 'إحصائيات الواجهة الرئيسية' : 'Hero Section Statistics')}</CardTitle>
              <CardDescription>{isRtl ? "القيم والتسميات المعروضة في شريط الأرقام والإنجازات" : "Numbers and labels shown in home counter bar"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { keyV: 'hero_stat_1_val', keyL: 'hero_stat_1_label', defaultV: '2,500+', defaultL: isRtl ? 'خريج' : 'Graduates' },
                  { keyV: 'hero_stat_2_val', keyL: 'hero_stat_2_label', defaultV: '95%', defaultL: isRtl ? 'نسبة التوظيف' : 'Employment Rate' },
                  { keyV: 'hero_stat_3_val', keyL: 'hero_stat_3_label', defaultV: '50+', defaultL: isRtl ? 'شركة شريكة' : 'Partner Companies' },
                  { keyV: 'hero_stat_4_val', keyL: 'hero_stat_4_label', defaultV: '25+', defaultL: isRtl ? 'سنة خبرة' : 'Years Experience' },
                ].map((stat, i) => (
                  <div key={i} className="p-3 bg-card border border-border rounded-xl space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold">{isRtl ? "مؤشر" : "Metric"} {i + 1}</Label>
                    <Input
                      value={getValue(stat.keyV)}
                      onChange={(e) => handleChange(stat.keyV, e.target.value)}
                      placeholder={stat.defaultV}
                      className="text-center font-bold text-accent"
                    />
                    <Input
                      value={getValue(stat.keyL)}
                      onChange={(e) => handleChange(stat.keyL, e.target.value)}
                      placeholder={stat.defaultL}
                      className="text-center text-xs"
                    />
                    <Button
                      onClick={async () => {
                        if (hasChanges(stat.keyV)) await handleSave(stat.keyV);
                        if (hasChanges(stat.keyL)) await handleSave(stat.keyL);
                      }}
                      disabled={(!hasChanges(stat.keyV) && !hasChanges(stat.keyL)) || updateSetting.isPending}
                      size="sm"
                      variant="ghost"
                      className="w-full text-xs h-7"
                    >
                      {isRtl ? 'حفظ' : 'Save'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 5. Live UI Interactive Preview */}
          <Card className="border-border shadow-md overflow-hidden">
            <CardHeader className="bg-secondary/20 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    {isRtl ? 'معاينة حية لقسم الـ HERO المحدث' : 'Live Preview of Updated Hero'}
                  </CardTitle>
                  <CardDescription>
                    {isRtl ? 'شكل الـ Hero كما سيظهر للزوار على الواجهة الرئيسية' : 'Hero layout as it appears to visitors on home page'}
                  </CardDescription>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                  {isRtl ? 'معاينة فورية' : 'Live Preview'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div 
                className="rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl"
                style={{
                  background: `linear-gradient(135deg, ${getValue('primary_color').startsWith('#') || getValue('primary_color').startsWith('rgb') ? getValue('primary_color') : `hsl(${getValue('primary_color') || '262 83% 45%'})`} 0%, ${getValue('accent_color').startsWith('#') || getValue('accent_color').startsWith('rgb') ? getValue('accent_color') : `hsl(${getValue('accent_color') || '330 81% 56%'})`} 100%)`
                }}
              >
                <div className="grid lg:grid-cols-12 gap-6 items-center relative z-10">
                  {/* Left Column */}
                  <div className="lg:col-span-7 space-y-4">
                    {getValue('hero_badge') && (
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs text-white backdrop-blur-sm">
                        <span className="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
                        {getValue('hero_badge')}
                      </span>
                    )}

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                      {getValue('hero_title') || 'Shape Your Future with'}{' '}
                      <span className="block text-amber-200 mt-1">
                        {getValue('hero_title_accent') || 'SIMPLY UNIVERSITY'}
                      </span>
                    </h2>

                    <p className="text-xs sm:text-sm text-white/85 line-clamp-3 leading-relaxed">
                      {getValue('hero_subtitle') || 'Join thousands of successful graduates who transformed their careers...'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg">
                        {getValue('hero_cta_primary_text') || 'Get Started'}
                      </span>
                      <span className="px-5 py-2.5 rounded-xl border border-white/40 text-white font-medium text-xs backdrop-blur-sm">
                        {getValue('hero_cta_secondary_text') || 'Explore Programs'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column (Hero Image) */}
                  <div className="lg:col-span-5">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl aspect-video bg-black/20">
                      <img 
                        src={getValue('hero_image_url') || '/simply_university_hero.jpg'} 
                        alt="Simply University Hero"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/simply_university_hero.jpg';
                        }}
                      />
                      <div className="absolute top-2 start-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-semibold flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 text-amber-300" />
                        Simply University
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="texts">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.uiTexts')}</CardTitle>
              <CardDescription>{t('admin.uiTextsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>{t('admin.welcomeMessage')}</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={getValue('welcome_message')}
                    onChange={(e) => handleChange('welcome_message', e.target.value)}
                    rows={2}
                    maxLength={500}
                  />
                  <Button 
                    onClick={() => handleSave('welcome_message')} 
                    disabled={!hasChanges('welcome_message') || updateSetting.isPending}
                    size="icon"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('admin.footerText')}</Label>
                <div className="flex gap-2">
                  <Input
                    value={getValue('footer_text')}
                    onChange={(e) => handleChange('footer_text', e.target.value)}
                    maxLength={200}
                  />
                  <Button 
                    onClick={() => handleSave('footer_text')} 
                    disabled={!hasChanges('footer_text') || updateSetting.isPending}
                    size="icon"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('admin.seoSettings', 'SEO Settings')}
                </CardTitle>
                <CardDescription>
                  {t('admin.seoSettingsDesc', 'Configure how your site appears in search results and browser tabs')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('admin.siteTitle', 'Site Title')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('site_title')}
                      onChange={(e) => handleChange('site_title', e.target.value)}
                      placeholder="My Platform"
                      maxLength={60}
                    />
                    <Button 
                      onClick={() => handleSave('site_title')} 
                      disabled={!hasChanges('site_title') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.siteTitleHint', 'Appears in browser tabs (max 60 characters)')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.siteDescription', 'Site Description')}</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={getValue('site_description')}
                      onChange={(e) => handleChange('site_description', e.target.value)}
                      placeholder="Welcome to our platform"
                      rows={2}
                      maxLength={160}
                    />
                    <Button 
                      onClick={() => handleSave('site_description')} 
                      disabled={!hasChanges('site_description') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.siteDescriptionHint', 'Meta description for SEO (max 160 characters)')}</p>
                </div>
                <div className="space-y-4 pt-2">
                  <Label className="text-base font-semibold">{t('admin.faviconTitle', isRtl ? 'الأيقونة المفضلة (Favicon & PWA)' : 'Favicon & App Icon')}</Label>
                  
                  {/* File Upload Box */}
                  <div className="p-3 border-2 border-dashed border-border rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-colors">
                    <input
                      type="file"
                      ref={faviconFileInputRef}
                      onChange={handleFaviconUpload}
                      accept="image/png,image/x-icon,image/svg+xml,image/jpeg"
                      className="hidden"
                    />
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                          <Image className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {isRtl ? 'رفع أيقونة المفضلة (Favicon)' : 'Upload Favicon Image'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isRtl ? 'يدعم PNG, ICO, SVG (الحجم المثالي 32x32 أو 512x512)' : 'Supports PNG, ICO, SVG (Ideal size 32x32 or 512x512)'}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => faviconFileInputRef.current?.click()}
                        disabled={uploadingFavicon}
                        className="gap-2 shrink-0 w-full sm:w-auto"
                      >
                        {uploadingFavicon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {uploadingFavicon ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'اختيار أيقونة' : 'Select Icon')}
                      </Button>
                    </div>
                  </div>

                  {/* Direct URL Fallback */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.faviconUrl', isRtl ? 'رابط الأيقونة المباشر:' : 'Favicon Direct URL:')}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('favicon_url')}
                        onChange={(e) => handleChange('favicon_url', e.target.value)}
                        placeholder="https://example.com/favicon.ico"
                      />
                      <Button 
                        onClick={() => handleSave('favicon_url')} 
                        disabled={!hasChanges('favicon_url') || updateSetting.isPending}
                        size="icon"
                      >
                        {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Favicon Preview */}
                  {getValue('favicon_url') ? (
                    <div className="mt-2 p-3 bg-card border border-border rounded-xl flex items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-secondary/60 rounded-lg border border-border shrink-0">
                          <img src={getValue('favicon_url')} alt="Favicon preview" className="h-7 w-7 object-contain" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-foreground">{isRtl ? 'الأيقونة المخصصة النشطة' : 'Active Custom Favicon'}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{getValue('favicon_url')}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/10 shrink-0"
                        onClick={async () => {
                          handleChange('favicon_url', '');
                          await updateSetting.mutateAsync({ key: 'favicon_url', value: '' });
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete', isRtl ? 'حذف' : 'Delete')}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-card border border-border rounded-xl flex items-center gap-3 shadow-xs">
                      <div className="p-1.5 bg-secondary/60 rounded-lg border border-border shrink-0">
                        <img src="/icons/favicon-32x32.png" alt="Default Favicon" className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{isRtl ? 'أيقونة Nexyvora الافتراضية نشطة (3D Emblem)' : 'Default Nexyvora Favicon is Active (3D Emblem)'}</p>
                        <p className="text-xs text-muted-foreground">{isRtl ? 'تظهر الأيقونة الرسمية في شريط تبويب المتصفح وتطبيق PWA' : 'Displayed in browser tabs and PWA installed apps'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  {t('admin.socialSharing', 'Social Sharing (Open Graph)')}
                </CardTitle>
                <CardDescription>
                  {t('admin.socialSharingDesc', 'Configure how your site appears when shared on WhatsApp, Facebook, Twitter, etc.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('admin.ogTitle', 'OG Title')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('og_title')}
                      onChange={(e) => handleChange('og_title', e.target.value)}
                      placeholder="Leave empty to use Site Title"
                      maxLength={60}
                    />
                    <Button 
                      onClick={() => handleSave('og_title')} 
                      disabled={!hasChanges('og_title') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.ogTitleHint', 'Title shown when sharing on social media')}</p>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.ogDescription', 'OG Description')}</Label>
                  <div className="flex gap-2">
                    <Textarea
                      value={getValue('og_description')}
                      onChange={(e) => handleChange('og_description', e.target.value)}
                      placeholder="Leave empty to use Site Description"
                      rows={2}
                      maxLength={160}
                    />
                    <Button 
                      onClick={() => handleSave('og_description')} 
                      disabled={!hasChanges('og_description') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('admin.ogImage', 'OG Image URL')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('og_image')}
                      onChange={(e) => handleChange('og_image', e.target.value)}
                      placeholder="https://example.com/og-image.png"
                    />
                    <Button 
                      onClick={() => handleSave('og_image')} 
                      disabled={!hasChanges('og_image') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.ogImageHint', 'Recommended: 1200x630 pixels for best display on social platforms')}</p>
                  {getValue('og_image') && (
                    <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">{t('admin.ogImagePreview', 'Image Preview')}:</p>
                      <img src={getValue('og_image')} alt="OG Image preview" className="max-w-full h-auto max-h-48 rounded-lg object-contain" />
                    </div>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t('admin.twitterCard', 'Twitter Card Type')}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('twitter_card')}
                        onChange={(e) => handleChange('twitter_card', e.target.value)}
                        placeholder="summary_large_image"
                      />
                      <Button 
                        onClick={() => handleSave('twitter_card')} 
                        disabled={!hasChanges('twitter_card') || updateSetting.isPending}
                        size="icon"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">summary, summary_large_image</p>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.twitterSite', 'Twitter Handle')}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('twitter_site')}
                        onChange={(e) => handleChange('twitter_site', e.target.value)}
                        placeholder="@youraccount"
                      />
                      <Button 
                        onClick={() => handleSave('twitter_site')} 
                        disabled={!hasChanges('twitter_site') || updateSetting.isPending}
                        size="icon"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground text-sm">
                  <p className="font-medium mb-2">{t('admin.seoNote', '📝 Note')}</p>
                  <p>{t('admin.seoNoteDesc', 'Changes will apply immediately to your site. For social media previews to update, platforms may take some time to refresh their cache. You can use debugging tools like Facebook Sharing Debugger or Twitter Card Validator to force a refresh.')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="academy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {isRtl ? 'إعدادات الفيديو التعريفي بالمشروع (البوسط 1 في الأكاديمية)' : 'Project Intro Video Settings (Academy Post 1)'}
                </CardTitle>
                <CardDescription>
                  {isRtl ? 'هذا البوسط يظهر في بداية صفحة الأكاديمية للطلاب الجدد والأعضاء قبل شراء الباقات لشرح فكرة ورؤية المشروع.' : 'This post appears at top of Academy page for new members explaining project vision.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{isRtl ? "عنوان البوسط التعريفي" : "Intro Post Title"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_intro_title')}
                      onChange={(e) => handleChange('academy_intro_title', e.target.value)}
                      placeholder={isRtl ? "فيديو تعريفي بمشروع ورؤية أكاديمية Nexyvora" : "Introductory video of Nexyvora Academy project and vision"}
                    />
                    <Button 
                      onClick={() => handleSave('academy_intro_title')} 
                      disabled={!hasChanges('academy_intro_title') || updateSetting.isPending}
                      size="icon"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRtl ? "رابط الفيديو التعريفي (YouTube Embed URL أو رابط فيديو مباشر)" : "Intro Video Embed URL (YouTube or direct link)"}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_intro_video_url')}
                      onChange={(e) => handleChange('academy_intro_video_url', e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                      dir="ltr"
                    />
                    <Button 
                      onClick={() => handleSave('academy_intro_video_url')} 
                      disabled={!hasChanges('academy_intro_video_url') || updateSetting.isPending}
                      size="icon"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isRtl ? 'مثال لرابط التضمين من يوتيوب: https://www.youtube.com/embed/YOUR_VIDEO_ID' : 'Example YouTube embed URL: https://www.youtube.com/embed/YOUR_VIDEO_ID'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{isRtl ? "اسم الناشر / الإدارة" : "Publisher / Admin Name"}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('academy_intro_author')}
                        onChange={(e) => handleChange('academy_intro_author', e.target.value)}
                        placeholder={isRtl ? "إدارة Nexyvora" : "Nexyvora Management"}
                      />
                      <Button 
                        onClick={() => handleSave('academy_intro_author')} 
                        disabled={!hasChanges('academy_intro_author') || updateSetting.isPending}
                        size="icon"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{isRtl ? "شارة المنشور (Badge)" : "Post Badge"}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('academy_intro_badge')}
                        onChange={(e) => handleChange('academy_intro_badge', e.target.value)}
                        placeholder={isRtl ? "دليل البداية للمشروع" : "Project Starter Guide"}
                      />
                      <Button 
                        onClick={() => handleSave('academy_intro_badge')} 
                        disabled={!hasChanges('academy_intro_badge') || updateSetting.isPending}
                        size="icon"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRtl ? "نص الشرح والتوجيه للأعضاء الجدد" : "Orientation Text & Guidance"}</Label>
                  <div className="space-y-2">
                    <Textarea
                      rows={5}
                      value={getValue('academy_intro_description')}
                      onChange={(e) => handleChange('academy_intro_description', e.target.value)}
                      placeholder={isRtl ? "اكتب هنا الرسالة التوجيهية وشرح مشروع وأكاديمية Nexyvora..." : "Write orientation message and explanation of Nexyvora project & academy here..."}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('academy_intro_description')} 
                        disabled={!hasChanges('academy_intro_description') || updateSetting.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isRtl ? 'حفظ نص الشرح' : 'Save Orientation Text'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
