import { useState, useRef } from 'react';
import { tr } from '@/utils/tr';
import { useSearchParams } from 'react-router-dom';
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
import { Palette, Image, Type, Save, Loader2, Globe, Share2, Upload, Trash2, Sparkles, RefreshCw, Eye, ExternalLink, GraduationCap, Award, Video, ShoppingBag, Phone, CreditCard, DollarSign } from 'lucide-react';
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

// Helpers for media URL formatting and playback
const isDirectVideoUrl = (url?: string) => {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.endsWith('.mkv') ||
    clean.endsWith('.avi') ||
    clean.includes('/uploads/')
  );
};

const formatVideoEmbedUrl = (url?: string) => {
  if (!url) return '';
  const clean = url.trim();
  const shortsMatch = clean.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }
  const watchMatch = clean.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }
  const youtuMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (youtuMatch) {
    return `https://www.youtube.com/embed/${youtuMatch[1]}`;
  }
  if (clean.includes('youtube.com/embed/')) {
    return clean;
  }
  const vimeoMatch = clean.match(/vimeo\.com\/([0-9]+)/);
  if (vimeoMatch && !clean.includes('player.vimeo.com')) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return clean;
};

export default function PlatformSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'branding';
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();
  
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // Dynamic media uploads state for Academy & Levels
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleMediaUpload = async (key: string, file: File, type: 'video' | 'image') => {
    const isVideo = type === 'video';
    const maxSize = isVideo ? 250 * 1024 * 1024 : 15 * 1024 * 1024; // 250MB for video, 15MB for images

    if (file.size > maxSize) {
      toast.error(
        tr(`حجم الملف كبير جداً! الحد الأقصى هو ${isVideo ? '250 ميجابايت' : '15 ميجابايت'}`, `File too large! Maximum limit is ${isVideo ? '250MB' : '15MB'}`)
      );
      return;
    }

    setUploadingField(key);
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));

    try {
      const res = await uploadService.uploadFile(file, (percent) => {
        setUploadProgress(prev => ({ ...prev, [key]: percent }));
      });

      if (res && res.url) {
        handleChange(key, res.url);
        await updateSetting.mutateAsync({ key, value: res.url });
        setEditedValues(prev => {
          const copy = { ...prev };
          delete copy[key];
          return copy;
        });
        toast.success(
          tr(`تم رفع وحفظ ${isVideo ? 'الفيديو' : 'الصورة'} بنجاح!`, `${isVideo ? 'Video' : 'Image'} uploaded and saved successfully!`)
        );
      }
    } catch (err: any) {
      console.error(`[Upload Error] ${key}:`, err);
      toast.error(err.response?.data?.error || err.message || (tr("فشل في رفع الملف", "Upload failed")));
    } finally {
      setUploadingField(null);
    }
  };

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
      toast.error(t('admin.fileTooLarge', tr("حجم الملف يتجاوز 5 ميجابايت", "File size exceeds 5MB")));
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
        toast.success(t('admin.logoUploadedSuccess', tr("تم رفع صورة الشعار وتحديث الإعدادات بنجاح!", "Logo uploaded successfully!")));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (tr("فشل في رفع صورة الشعار", "Failed to upload logo")));
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
      toast.error(t('admin.fileTooLarge', tr("حجم الملف يتجاوز 8 ميجابايت", "File size exceeds 8MB")));
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
        toast.success(t('admin.heroImageUploadedSuccess', tr("تم رفع صورة الـ HERO وتحديث الإعدادات بنجاح!", "Hero image uploaded successfully!")));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (tr("فشل في رفع صورة الـ HERO", "Failed to upload hero image")));
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
      toast.error(tr("حجم الملف يتجاوز 2 ميجابايت", "File size exceeds 2MB"));
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
        toast.success(tr("تم رفع وتعيين Favicon بنجاح!", "Favicon uploaded successfully!"));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || (tr("فشل في رفع Favicon", "Failed to upload favicon")));
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
    toast.success(t('admin.allLandingSaved', tr("تم حفظ جميع تعديلات الواجهة بنجاح!", "All landing adjustments saved successfully!")));
  };

  const getValue = (key: string) => {
    return editedValues[key] ?? settings?.map[key]?.value ?? '';
  };

  const hasChanges = (key: string) => {
    return key in editedValues && editedValues[key] !== settings?.map[key]?.value;
  };

  const MediaUploadField = ({
    settingKey,
    label,
    type,
    placeholder,
    helpText,
    icon: IconComponent
  }: {
    settingKey: string;
    label: string;
    type: 'video' | 'image';
    placeholder?: string;
    helpText?: string;
    icon?: any;
  }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const currentValue = getValue(settingKey);
    const isVideo = type === 'video';
    const isUploading = uploadingField === settingKey;
    const progress = uploadProgress[settingKey] || 0;

    return (
      <div className="space-y-2.5 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 font-bold text-sm text-slate-800 dark:text-slate-200">
            {IconComponent && <IconComponent className={`h-4 w-4 ${isVideo ? 'text-blue-500' : 'text-purple-500'}`} />}
            {label}
          </Label>
          <span className="text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
            {isVideo ? 'MP4, WebM, MOV, YouTube' : 'PNG, JPG, WebP'}
          </span>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={isVideo ? "video/mp4,video/webm,video/quicktime,video/x-matroska,video/*" : "image/*"}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleMediaUpload(settingKey, file, type);
              e.target.value = '';
            }
          }}
        />

        {/* Action / Input Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Input
              value={currentValue}
              onChange={(e) => handleChange(settingKey, e.target.value)}
              placeholder={placeholder || (isVideo ? "https://www.youtube.com/embed/... أو ارفع ملف فيديو" : "https://... أو ارفع ملف صورة")}
              dir="ltr"
              className="font-mono text-xs md:text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading || updateSetting.isPending}
              className="gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 whitespace-nowrap"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{progress}%</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>{isRtl ? (isVideo ? 'رفع فيديو' : 'رفع صورة') : (isVideo ? 'Upload Video' : 'Upload Image')}</span>
                </>
              )}
            </Button>

            {/* Save Manual Edit Button */}
            <Button
              type="button"
              onClick={() => handleSave(settingKey)}
              disabled={!hasChanges(settingKey) || updateSetting.isPending || isUploading}
              size="icon"
              title={tr("حفظ الرابط", "Save Link")}
            >
              <Save className="h-4 w-4" />
            </Button>

            {/* Clear Button */}
            {currentValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={async () => {
                  handleChange(settingKey, '');
                  await updateSetting.mutateAsync({ key: settingKey, value: '' });
                  setEditedValues(prev => {
                    const copy = { ...prev };
                    delete copy[settingKey];
                    return copy;
                  });
                  toast.info(tr("تم تفريغ الحقل وحفظ التغيير", "Field cleared and saved"));
                }}
                disabled={isUploading || updateSetting.isPending}
                className="text-muted-foreground hover:text-destructive"
                title={tr("تفريغ", "Clear")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="space-y-1.5 p-2.5 rounded-lg border border-primary/30 bg-primary/5 animate-pulse">
            <div className="flex items-center justify-between text-xs font-semibold text-primary">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {tr("جاري رفع الملف إلى السيرفر... يرجى الانتظار", "Uploading file to server... please wait")}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Help text */}
        {helpText && (
          <p className="text-xs text-muted-foreground">
            {helpText}
          </p>
        )}

        {/* Live Media Preview Box */}
        {currentValue && !isUploading && (
          <div className="pt-1">
            {isVideo ? (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 max-w-md shadow-sm">
                <div className="relative aspect-video w-full flex items-center justify-center bg-black">
                  {isDirectVideoUrl(currentValue) ? (
                    <video
                      src={currentValue}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={formatVideoEmbedUrl(currentValue)}
                      title={label}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
                <div className="p-2 bg-slate-900/90 text-slate-300 text-xs flex items-center justify-between">
                  <span className="truncate max-w-[220px]" dir="ltr">{currentValue}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                    {isDirectVideoUrl(currentValue) 
                      ? (tr("✓ ملف فيديو مرفوع", "✓ Uploaded Video File")) 
                      : (tr("✓ رابط فيديو مضمن", "✓ Embedded Video Link"))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900/40 max-w-sm shadow-sm group">
                <img
                  src={currentValue}
                  alt={label}
                  className="w-full h-36 object-cover"
                />
                <div className="p-2 bg-slate-900/90 text-slate-300 text-xs flex items-center justify-between">
                  <span className="truncate max-w-[200px]" dir="ltr">{currentValue}</span>
                  <a
                    href={currentValue}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {tr("معاينة بالحجم الكامل", "Full Preview")}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
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

      <Tabs value={currentTab} onValueChange={(val) => setSearchParams({ tab: val })} className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            {t('admin.branding')}
          </TabsTrigger>
          <TabsTrigger value="landing" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            {t('admin.landingPage', tr("الواجهة الرئيسية (Hero)", "Landing Page (Hero)"))}
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
            {tr("الأكاديمية وعرض المستويات", "Academy & Levels")}
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-emerald-500" />
            {tr("إعدادات الخدمات والدعم", "Services & Support")}
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
                <Label className="text-base font-semibold">{t('admin.platformLogo', tr("شعار المنصة (Logo)", "Platform Logo"))}</Label>
                
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
                          {t('admin.uploadLogoTitle', tr("رفع صورة الشعار", "Upload Logo Image"))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('admin.uploadLogoHint', tr("يدعم ملفات الصور PNG, JPG, JPEG, WEBP, SVG (الحد الأقصى 5 ميجابايت)", "Supports PNG, JPG, JPEG, WEBP, SVG (Max 5MB)"))}
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
                      {uploadingLogo ? t('common.uploading', tr("جاري الرفع...", "Uploading...")) : t('admin.selectLogoFile', tr("اختيار ملف صورة", "Select Image File"))}
                    </Button>
                  </div>
                </div>

                {/* Direct URL input fallback */}
                <div className="space-y-1 pt-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('admin.orEnterUrl', tr("أو ادخل رابط الصورة مباشرة:", "Or enter direct image URL:"))}
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
                        <p className="text-sm font-medium text-foreground">{t('admin.logoPreview', tr("معاينة الشعار المخصص الحالي", "Current Custom Logo"))}</p>
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
                      {t('common.delete', tr("حذف", "Delete"))}
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
                        <p className="text-sm font-medium text-foreground">{tr("الشعار الرسمي النشط (Nexyvora)", "Active Official Logo (Nexyvora)")}</p>
                        <p className="text-xs text-muted-foreground">{tr("شعار Nexyvora الافتراضي عالي الدقة مفعل حالياً", "Official high-definition Nexyvora logo is currently active")}</p>
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
              <CardTitle>{t('admin.theme', tr("مظهر وألوان المنصة", "Theme & Platform Colors"))}</CardTitle>
              <CardDescription>{t('admin.themeDesc', tr("تخصيص الهوية البصرية والألوان الرئيسية للمنصة بضغطة زر.", "Customize visual identity and theme colors."))}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Presets Palette Section */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">{t('admin.colorPresets', tr("أنماط ألوان جاهزة (Presets)", "Theme Presets"))}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { name: tr("الأزرق الأكاديمي", "Academic Blue"), primary: '217 91% 30%', accent: '172 66% 40%', hexP: '#0747a6', hexA: '#22b8cf' },
                    { name: tr("الزمرد الأكاديمي", "Emerald Green"), primary: '160 84% 28%', accent: '38 92% 50%', hexP: '#0c7a52', hexA: '#f59e0b' },
                    { name: tr("البنفسجي الملكي", "Royal Purple"), primary: '262 83% 45%', accent: '330 81% 56%', hexP: '#6d28d9', hexA: '#ec4899' },
                    { name: tr("العنابي الكلاسيكي", "Classic Crimson"), primary: '348 83% 42%', accent: '25 95% 53%', hexP: '#be123c', hexA: '#f97316' },
                    { name: tr("الداكن الفاخر", "Luxury Dark"), primary: '222 47% 18%', accent: '188 86% 43%', hexP: '#1e293b', hexA: '#06b6d4' },
                    { name: tr("الكهرماني الدافئ", "Warm Amber"), primary: '38 92% 38%', accent: '142 71% 45%', hexP: '#b45309', hexA: '#16a34a' }
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
                    <Label className="text-sm font-semibold">{t('admin.primaryColor', tr("اللون الرئيسي (Primary)", "Primary Color"))}</Label>
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
                      placeholder={tr("217 91% 30% أو #0747a6", "217 91% 30% or #0747a6")}
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
                  <p className="text-xs text-muted-foreground">{tr("يتحكم في لون الهيدر، الأزرار الرئيسية، والروابط النشطة.", "Controls header color, primary buttons, and active links.")}</p>
                </div>

                {/* Accent Color Picker */}
                <div className="space-y-3 p-4 bg-secondary/10 rounded-xl border border-border">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">{t('admin.accentColor', tr("اللون الفرعي (Accent)", "Accent Color"))}</Label>
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
                      placeholder={tr("172 66% 40% أو #22b8cf", "172 66% 40% or #22b8cf")}
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
                  <p className="text-xs text-muted-foreground">{tr("يتحكم في العناصر المتميزة، الشارات، والتظليل الإضافي.", "Controls highlights, badges, and accents.")}</p>
                </div>
              </div>

              {/* Batch Save Button */}
              {(hasChanges('primary_color') || hasChanges('accent_color')) && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-foreground">{tr("لديك تغييرات غير محفوظة في ألوان المنصة.", "You have unsaved theme color changes.")}</p>
                  <Button
                    onClick={async () => {
                      if (hasChanges('primary_color')) await handleSave('primary_color');
                      if (hasChanges('accent_color')) await handleSave('accent_color');
                    }}
                    disabled={updateSetting.isPending}
                    className="gap-2"
                  >
                    {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {tr("حفظ جميع الألوان", "Save All Colors")}
                  </Button>
                </div>
              )}

              {/* Live Preview UI Card */}
              <div className="pt-4 border-t space-y-3">
                <Label className="text-base font-semibold">{tr("معاينة مباشرة لمظهر المنصة (Live UI Preview)", "Live UI Preview")}</Label>
                <div className="p-6 border border-border rounded-2xl bg-card shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})` }}
                      >
                        NX
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">NEXYVORA</h4>
                        <p className="text-xs text-muted-foreground">{tr("معاينة عناصر الواجهة بالألوان الجديدة", "UI components preview with selected palette")}</p>
                      </div>
                    </div>
                    <span 
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white shadow-sm"
                      style={{ backgroundColor: getValue('accent_color').startsWith('#') ? getValue('accent_color') : `hsl(${getValue('accent_color')})` }}
                    >
                      {tr("مميز (Accent)", "Accent")}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})` }}
                    >
                      {tr("زر رئيسي (Primary Button)", "Primary Button")}
                    </button>

                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-white font-medium text-sm shadow-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: getValue('accent_color').startsWith('#') ? getValue('accent_color') : `hsl(${getValue('accent_color')})` }}
                    >
                      {tr("زر فرعي (Accent Button)", "Accent Button")}
                    </button>

                    <div 
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                      style={{ 
                        borderColor: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})`,
                        color: getValue('primary_color').startsWith('#') ? getValue('primary_color') : `hsl(${getValue('primary_color')})`
                      }}
                    >
                      {tr("مفعل (Outline)", "Active (Outline)")}
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
                  {t('admin.landingPage', tr("الواجهة الرئيسية وقسم الـ HERO", "Landing Page & Hero Section"))}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('admin.landingPageDesc', tr("تخصيص نصوص وصورة قسم الـ HERO لواجهة منصة NEXYVORA مع معاينة حية.", "Customize hero section headings, image, and CTAs with live preview."))}
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
                {tr("عرض الموقع الحي", "View Live Site")}
              </a>

              {hasAnyLandingChanges && (
                <Button 
                  onClick={handleSaveAllLanding}
                  disabled={updateSetting.isPending}
                  className="gap-2 shadow-md"
                >
                  {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('admin.saveAllLanding', tr("حفظ جميع التعديلات", "Save All Changes"))}
                </Button>
              )}
            </div>
          </div>

          {/* 1. Hero Image Section */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                {t('admin.heroImage', tr("صورة الـ HERO لمنصة NEXYVORA", "NEXYVORA Hero Image"))}
              </CardTitle>
              <CardDescription>
                {t('admin.heroImageDesc', tr("الصورة المميزة المعروضة في واجهة المنصة بجانب النصوص الترحيبية لمنصة NEXYVORA.", "Featured hero image displayed on home page next to welcome copy."))}
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
                        {t('admin.uploadHeroImage', tr("رفع صورة جديدة للـ HERO", "Upload New Hero Image"))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr("يدعم صيغ JPG, PNG, WEBP, SVG (الحد الأقصى 8 ميجابايت) — يُفضل صورة أفقية بدقة عالية 16:9", "Supports JPG, PNG, WEBP, SVG (Max 8MB) — 16:9 horizontal image recommended")}
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
                    {uploadingHero ? t('common.uploading', tr("جاري الرفع...", "Uploading...")) : (tr("اختيار صورة من الجهاز", "Choose Local Image"))}
                  </Button>
                </div>
              </div>

              {/* Direct URL input fallback and reset button */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {tr("أو ادخل مسار أو رابط الصورة مباشرة:", "Or enter image URL directly:")}
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={getValue('hero_image_url')}
                    onChange={(e) => handleChange('hero_image_url', e.target.value)}
                    placeholder={tr("/nexyvora_hero.jpg أو https://...", "/nexyvora_hero.jpg or https://...")}
                    className="font-mono text-xs sm:text-sm"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      onClick={() => handleSave('hero_image_url')} 
                      disabled={!hasChanges('hero_image_url') || updateSetting.isPending}
                      className="gap-1.5"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {tr("حفظ", "Save")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      title={tr("استعادة صورة NEXYVORA الافتراضية", "Restore NEXYVORA default image")}
                      onClick={async () => {
                        handleChange('hero_image_url', '/simply_university_hero.jpg');
                        await updateSetting.mutateAsync({ key: 'hero_image_url', value: '/simply_university_hero.jpg' });
                        toast.success(tr("تمت استعادة صورة منصة NEXYVORA الافتراضية بنجاح!", "Default NEXYVORA image restored successfully!"));
                      }}
                      className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {tr("استعادة الافتراضية", "Restore Default")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Hero Image Live Preview */}
              <div className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-primary" />
                      {t('admin.heroImagePreview', tr("معاينة صورة الـ HERO الحالية", "Current Hero Image Preview"))}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                      {getValue('hero_image_url') || '/simply_university_hero.jpg'}
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-border aspect-video max-h-64 bg-secondary/30">
                    <img 
                      src={getValue('hero_image_url') || '/simply_university_hero.jpg'} 
                      alt="NEXYVORA Hero"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/simply_university_hero.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <span className="px-2.5 py-1 rounded-full bg-primary/90 text-[11px] font-bold shadow">
                          NEXYVORA Campus
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
                {tr("عناوين ونصوص الـ HERO الرئيسية", "Hero Headings & Text")}
              </CardTitle>
              <CardDescription>
                {tr("تخصيص الشارة العلوية، العنوان الرئيسي، العنوان الملون، والوصف الترحيبي.", "Customize tagline badge, main title, accent title, and hero subtitle.")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Badge Tagline */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold flex items-center justify-between">
                  <span>{t('admin.heroBadge', tr("شارة البداية العلوية (Badge Tagline)", "Top Tagline Badge"))}</span>
                  <span className="text-xs text-muted-foreground font-normal">{tr("تظهر كشارة مميزة فوق العنوان", "Appears as badge above main title")}</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={getValue('hero_badge')}
                    onChange={(e) => handleChange('hero_badge', e.target.value)}
                    placeholder={tr("🎓 مرحباً بكم في NEXYVORA — التميز والابتكار الأكاديمي", "🎓 Welcome to NEXYVORA — Academic Excellence & Innovation")}
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
                  <Label className="text-sm font-semibold">{t('admin.heroTitle', tr("العنوان الرئيسي الأول", "Primary Main Title"))}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('hero_title')}
                      onChange={(e) => handleChange('hero_title', e.target.value)}
                      placeholder={tr("اصنع مستقبلك مع / Shape Your Future with", "Shape Your Future with")}
                    />
                    <Button 
                      onClick={() => handleSave('hero_title')} 
                      disabled={!hasChanges('hero_title') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{tr("النص الأساسي للعنوان باللون الأبيض.", "Primary headline text.")}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">{t('admin.heroTitleAccent', tr("العنوان البارز الملون (Accent Title)", "Accent Title Headline"))}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('hero_title_accent')}
                      onChange={(e) => handleChange('hero_title_accent', e.target.value)}
                      placeholder={tr("NEXYVORA / التميز المهني والأكاديمي", "NEXYVORA / Professional & Academic Excellence")}
                    />
                    <Button 
                      onClick={() => handleSave('hero_title_accent')} 
                      disabled={!hasChanges('hero_title_accent') || updateSetting.isPending}
                      size="icon"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{tr("السطر الثاني الملون بلون التمييز (Accent).", "Second headline rendered in accent color.")}</p>
                </div>
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">{t('admin.heroSubtitle', tr("الوصف التعريفي للجامعة (Hero Subtitle)", "Hero Subtitle Description"))}</Label>
                <div className="flex gap-2">
                  <Textarea
                    value={getValue('hero_subtitle')}
                    onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                    rows={3}
                    placeholder={tr("انضم إلى آلاف الخريجين الناجحين الذين غيروا مسار حياتهم المهنية من خلال برامجنا التقنية الشاملة...", "Join thousands of successful graduates who transformed their careers through our comprehensive programs...")}
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
              <CardTitle className="text-base font-bold">{tr("أزرار الإجراء والدعوة (Hero CTA Buttons)", "Hero CTA Buttons")}</CardTitle>
              <CardDescription>{tr("التحكم في نصوص وروابط أزرار الصفحة الرئيسية", "Configure home page action buttons and target links")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Primary Button */}
                <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-3">
                  <span className="text-xs font-bold text-primary block">{tr("الزر الرئيسي (Primary Button)", "Primary Button")}</span>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaPrimaryText', tr("نص الزر", "Button Label"))}</Label>
                      <Input
                        value={getValue('hero_cta_primary_text')}
                        onChange={(e) => handleChange('hero_cta_primary_text', e.target.value)}
                        placeholder={tr("ابدأ الآن / Get Started", "Get Started")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaPrimaryLink', tr("رابط الوجهة", "Target Link"))}</Label>
                      <Input
                        value={getValue('hero_cta_primary_link')}
                        onChange={(e) => handleChange('hero_cta_primary_link', e.target.value)}
                        placeholder={tr("/auth أو /login", "/auth or /login")}
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
                      {tr("حفظ الزر الرئيسي", "Save Primary CTA")}
                    </Button>
                  </div>
                </div>

                {/* Secondary Button */}
                <div className="p-4 bg-secondary/20 rounded-xl border border-border space-y-3">
                  <span className="text-xs font-bold text-muted-foreground block">{tr("الزر الثانوي (Secondary Button)", "Secondary Button")}</span>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaSecondaryText', tr("نص الزر", "Button Label"))}</Label>
                      <Input
                        value={getValue('hero_cta_secondary_text')}
                        onChange={(e) => handleChange('hero_cta_secondary_text', e.target.value)}
                        placeholder={tr("استكشف البرامج / Explore Programs", "Explore Programs")}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t('admin.heroCtaSecondaryLink', tr("رابط الوجهة", "Target Link"))}</Label>
                      <Input
                        value={getValue('hero_cta_secondary_link')}
                        onChange={(e) => handleChange('hero_cta_secondary_link', e.target.value)}
                        placeholder={tr("#programs أو /verify-diploma", "#programs or /verify-diploma")}
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
                      {tr("حفظ الزر الثانوي", "Save Secondary CTA")}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4. Hero Statistics */}
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">{t('admin.heroStats', tr("إحصائيات الواجهة الرئيسية", "Hero Section Statistics"))}</CardTitle>
              <CardDescription>{tr("القيم والتسميات المعروضة في شريط الأرقام والإنجازات", "Numbers and labels shown in home counter bar")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { keyV: 'hero_stat_1_val', keyL: 'hero_stat_1_label', defaultV: '2,500+', defaultL: tr("خريج", "Graduates") },
                  { keyV: 'hero_stat_2_val', keyL: 'hero_stat_2_label', defaultV: '95%', defaultL: tr("نسبة التوظيف", "Employment Rate") },
                  { keyV: 'hero_stat_3_val', keyL: 'hero_stat_3_label', defaultV: '50+', defaultL: tr("شركة شريكة", "Partner Companies") },
                  { keyV: 'hero_stat_4_val', keyL: 'hero_stat_4_label', defaultV: '25+', defaultL: tr("سنة خبرة", "Years Experience") },
                ].map((stat, i) => (
                  <div key={i} className="p-3 bg-card border border-border rounded-xl space-y-2">
                    <Label className="text-xs text-muted-foreground font-semibold">{tr("مؤشر", "Metric")} {i + 1}</Label>
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
                      {tr("حفظ", "Save")}
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
                    {tr("معاينة حية لقسم الـ HERO المحدث", "Live Preview of Updated Hero")}
                  </CardTitle>
                  <CardDescription>
                    {tr("شكل الـ Hero كما سيظهر للزوار على الواجهة الرئيسية", "Hero layout as it appears to visitors on home page")}
                  </CardDescription>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                  {tr("معاينة فورية", "Live Preview")}
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
                        {getValue('hero_title_accent') || 'NEXYVORA'}
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
                        alt="NEXYVORA Hero"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/simply_university_hero.jpg';
                        }}
                      />
                      <div className="absolute top-2 start-2 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-white font-semibold flex items-center gap-1.5">
                        <GraduationCap className="h-3 w-3 text-amber-300" />
                        NEXYVORA
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
                  <Label className="text-base font-semibold">{t('admin.faviconTitle', tr("الأيقونة المفضلة (Favicon & PWA)", "Favicon & App Icon"))}</Label>
                  
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
                            {tr("رفع أيقونة المفضلة (Favicon)", "Upload Favicon Image")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tr("يدعم PNG, ICO, SVG (الحجم المثالي 32x32 أو 512x512)", "Supports PNG, ICO, SVG (Ideal size 32x32 or 512x512)")}
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
                        {uploadingFavicon ? (tr("جاري الرفع...", "Uploading...")) : (tr("اختيار أيقونة", "Select Icon"))}
                      </Button>
                    </div>
                  </div>

                  {/* Direct URL Fallback */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('admin.faviconUrl', tr("رابط الأيقونة المباشر:", "Favicon Direct URL:"))}</Label>
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
                          <p className="text-sm font-medium text-foreground">{tr("الأيقونة المخصصة النشطة", "Active Custom Favicon")}</p>
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
                        {t('common.delete', tr("حذف", "Delete"))}
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-card border border-border rounded-xl flex items-center gap-3 shadow-xs">
                      <div className="p-1.5 bg-secondary/60 rounded-lg border border-border shrink-0">
                        <img src="/icons/favicon-32x32.png" alt="Default Favicon" className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tr("أيقونة Nexyvora الافتراضية نشطة (3D Emblem)", "Default Nexyvora Favicon is Active (3D Emblem)")}</p>
                        <p className="text-xs text-muted-foreground">{tr("تظهر الأيقونة الرسمية في شريط تبويب المتصفح وتطبيق PWA", "Displayed in browser tabs and PWA installed apps")}</p>
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
            {/* Introductory Video Post (Post 1) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  {tr("إعدادات الفيديو التعريفي بالمشروع (البوسط 1 في الأكاديمية)", "Project Intro Video Settings (Academy Post 1)")}
                </CardTitle>
                <CardDescription>
                  {tr("هذا البوسط يظهر في بداية صفحة الأكاديمية للطلاب الجدد والأعضاء لشرح فكرة ورؤية المشروع مع إمكانية رفع الفيديو وصورة الغلاف مباشرة.", "This post appears at top of Academy page for new members explaining project vision with direct file upload.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{tr("عنوان البوسط التعريفي", "Intro Post Title")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_intro_title')}
                      onChange={(e) => handleChange('academy_intro_title', e.target.value)}
                      placeholder={tr("فيديو تعريفي بمشروع ورؤية أكاديمية Nexyvora", "Introductory video of Nexyvora Academy project and vision")}
                    />
                    <Button 
                      onClick={() => handleSave('academy_intro_title')} 
                      disabled={!hasChanges('academy_intro_title') || updateSetting.isPending}
                      size="icon"
                      title={tr("حفظ العنوان", "Save Title")}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Intro Video Field with Upload & Link */}
                <MediaUploadField
                  settingKey="academy_intro_video_url"
                  label={tr("فيديو مقدمة ورؤية المشروع التعريفي", "Introductory Project Video")}
                  type="video"
                  icon={Video}
                  placeholder="https://www.youtube.com/embed/... أو انقر رفع فيديو"
                  helpText={tr("يمكنك رفع فيديو MP4 أو WebM مباشرة من جهازك (حتى 250MB) أو وضع رابط YouTube/Vimeo.", "Upload an MP4/WebM video file directly (up to 250MB) or paste a YouTube/Vimeo embed URL.")}
                />

                {/* Intro Banner Image Field with Upload & Link */}
                <MediaUploadField
                  settingKey="academy_intro_banner"
                  label={tr("صورة غلاف / بانر الفيديو التعريفي", "Intro Video Cover Banner")}
                  type="image"
                  icon={Image}
                  placeholder="https://... أو انقر رفع صورة"
                  helpText={tr("صورة الغلاف التي تظهر كواجهة قبل تشغيل الفيديو التعريفي وفي شريط المعاينة.", "Cover banner displayed as the preview before playing the intro video.")}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tr("اسم الناشر / الإدارة", "Publisher / Admin Name")}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('academy_intro_author')}
                        onChange={(e) => handleChange('academy_intro_author', e.target.value)}
                        placeholder={tr("إدارة Nexyvora", "Nexyvora Management")}
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
                    <Label>{tr("شارة المنشور (Badge)", "Post Badge")}</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getValue('academy_intro_badge')}
                        onChange={(e) => handleChange('academy_intro_badge', e.target.value)}
                        placeholder={tr("دليل البداية للمشروع", "Project Starter Guide")}
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
                  <Label>{tr("نص الشرح والتوجيه للأعضاء الجدد", "Orientation Text & Guidance")}</Label>
                  <div className="space-y-2">
                    <Textarea
                      rows={5}
                      value={getValue('academy_intro_description')}
                      onChange={(e) => handleChange('academy_intro_description', e.target.value)}
                      placeholder={tr("اكتب هنا الرسالة التوجيهية وشرح مشروع وأكاديمية Nexyvora...", "Write orientation message and explanation of Nexyvora project & academy here...")}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('academy_intro_description')} 
                        disabled={!hasChanges('academy_intro_description') || updateSetting.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {tr("حفظ نص الشرح", "Save Orientation Text")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 1: FLOW ($150) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-500" />
                  {tr("المستوى 1: باقة FLOW (150$) — فيديو وصور وتعريف الباقة", "Level 1: FLOW ($150) — Video, Images & Description")}
                </CardTitle>
                <CardDescription>
                  {tr("تخصيص ورفع فيديو المعاينة وصورة الغلاف والشرح المعروض لباقة FLOW في الأكاديمية.", "Customize & upload preview video, banner image, and description for FLOW package in Academy.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{tr("عنوان الباقة الترويجي", "Package Promo Title")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_flow_title')}
                      onChange={(e) => handleChange('academy_flow_title', e.target.value)}
                      placeholder={tr("FLOW 150 $ — التجارة الإلكترونية والبيزنس الرقمي بالذكاء الاصطناعي", "FLOW $150 — AI E-Commerce & Digital Business")}
                    />
                    <Button 
                      onClick={() => handleSave('academy_flow_title')} 
                      disabled={!hasChanges('academy_flow_title') || updateSetting.isPending}
                      size="icon"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* FLOW Video Field */}
                <MediaUploadField
                  settingKey="academy_flow_video_url"
                  label={tr("فيديو معاينة وشرح باقة FLOW", "FLOW Preview Video")}
                  type="video"
                  icon={Video}
                  placeholder="https://www.youtube.com/embed/... أو انقر رفع فيديو"
                  helpText={tr("يمكنك رفع فيديو تعريفي لباقة 150$ أو وضع رابط مباشر/يوتيوب.", "Upload direct video or paste YouTube/Vimeo embed URL.")}
                />

                {/* FLOW Banner Image Field */}
                <MediaUploadField
                  settingKey="academy_flow_banner"
                  label={tr("صورة غلاف / بانر باقة FLOW", "FLOW Banner Image")}
                  type="image"
                  icon={Image}
                  placeholder="https://... أو انقر رفع صورة"
                  helpText={tr("صورة الغلاف المعروضة في بطاقة باقة FLOW وشريط الوسائط.", "Banner image displayed in FLOW package showcase.")}
                />

                <div className="space-y-2">
                  <Label>{tr("نص الوصف الترويجي للباقة", "Package Description")}</Label>
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={getValue('academy_flow_description')}
                      onChange={(e) => handleChange('academy_flow_description', e.target.value)}
                      placeholder={tr("مجتمع لتعلم التجارة الإلكترونية بالذكاء الاصطناعي خطوة بخطوة...", "Community to learn AI-powered e-commerce step by step...")}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('academy_flow_description')} 
                        disabled={!hasChanges('academy_flow_description') || updateSetting.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {tr("حفظ وصف باقة FLOW", "Save FLOW Description")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 2: GROW ($500) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  {tr("المستوى 2: باقة GROW (500$) — فيديو وصور وتعريف الباقة", "Level 2: GROW ($500) — Video, Images & Description")}
                </CardTitle>
                <CardDescription>
                  {tr("تخصيص ورفع فيديو المعاينة وصورة الغلاف والشرح المعروض لباقة GROW في الأكاديمية.", "Customize & upload preview video, banner image, and description for GROW package in Academy.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{tr("عنوان الباقة الترويجي", "Package Promo Title")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_grow_title')}
                      onChange={(e) => handleChange('academy_grow_title', e.target.value)}
                      placeholder={tr("GROW 500 $ — الذكاء الاصطناعي، الأتمتة ووكلاء AI (AI Automation)", "GROW $500 — AI, Automation & AI Agents (AAA)")}
                    />
                    <Button 
                      onClick={() => handleSave('academy_grow_title')} 
                      disabled={!hasChanges('academy_grow_title') || updateSetting.isPending}
                      size="icon"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* GROW Video Field */}
                <MediaUploadField
                  settingKey="academy_grow_video_url"
                  label={tr("فيديو معاينة وشرح باقة GROW", "GROW Preview Video")}
                  type="video"
                  icon={Video}
                  placeholder="https://www.youtube.com/embed/... أو انقر رفع فيديو"
                  helpText={tr("يمكنك رفع فيديو تعريفي لباقة 500$ أو وضع رابط مباشر/يوتيوب.", "Upload direct video or paste YouTube/Vimeo embed URL.")}
                />

                {/* GROW Banner Image Field */}
                <MediaUploadField
                  settingKey="academy_grow_banner"
                  label={tr("صورة غلاف / بانر باقة GROW", "GROW Banner Image")}
                  type="image"
                  icon={Image}
                  placeholder="https://... أو انقر رفع صورة"
                  helpText={tr("صورة الغلاف المعروضة في بطاقة باقة GROW وشريط الوسائط.", "Banner image displayed in GROW package showcase.")}
                />

                <div className="space-y-2">
                  <Label>{tr("نص الوصف الترويجي للباقة", "Package Description")}</Label>
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={getValue('academy_grow_description')}
                      onChange={(e) => handleChange('academy_grow_description', e.target.value)}
                      placeholder={tr("مجتمع لبناء وتدريب وكلاء الذكاء الاصطناعي (Custom AI Agents)...", "Community to build custom AI agents and automate operations...")}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('academy_grow_description')} 
                        disabled={!hasChanges('academy_grow_description') || updateSetting.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {tr("حفظ وصف باقة GROW", "Save GROW Description")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 3: PRIME ($1000) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-amber-500" />
                  {tr("المستوى 3: باقة PRIME (1000$) — فيديو وصور وتعريف الباقة", "Level 3: PRIME ($1000) — Video, Images & Description")}
                </CardTitle>
                <CardDescription>
                  {tr("تخصيص ورفع فيديو المعاينة وصورة الغلاف والشرح المعروض لباقة PRIME في الأكاديمية.", "Customize & upload preview video, banner image, and description for PRIME package in Academy.")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>{tr("عنوان الباقة الترويجي", "Package Promo Title")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={getValue('academy_prime_title')}
                      onChange={(e) => handleChange('academy_prime_title', e.target.value)}
                      placeholder={tr("PRIME 1000 $ — البرمجة المتقدمة، بناء SaaS والمرافقة الشخصية 1-on-1", "PRIME $1000 — Full-Stack SaaS & 1-on-1 Mentorship")}
                    />
                    <Button 
                      onClick={() => handleSave('academy_prime_title')} 
                      disabled={!hasChanges('academy_prime_title') || updateSetting.isPending}
                      size="icon"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* PRIME Video Field */}
                <MediaUploadField
                  settingKey="academy_prime_video_url"
                  label={tr("فيديو معاينة وشرح باقة PRIME", "PRIME Preview Video")}
                  type="video"
                  icon={Video}
                  placeholder="https://www.youtube.com/embed/... أو انقر رفع فيديو"
                  helpText={tr("يمكنك رفع فيديو تعريفي لباقة 1000$ أو وضع رابط مباشر/يوتيوب.", "Upload direct video or paste YouTube/Vimeo embed URL.")}
                />

                {/* PRIME Banner Image Field */}
                <MediaUploadField
                  settingKey="academy_prime_banner"
                  label={tr("صورة غلاف / بانر باقة PRIME", "PRIME Banner Image")}
                  type="image"
                  icon={Image}
                  placeholder="https://... أو انقر رفع صورة"
                  helpText={tr("صورة الغلاف المعروضة في بطاقة باقة PRIME وشريط الوسائط.", "Banner image displayed in PRIME package showcase.")}
                />

                <div className="space-y-2">
                  <Label>{tr("نص الوصف الترويجي للباقة", "Package Description")}</Label>
                  <div className="space-y-2">
                    <Textarea
                      rows={3}
                      value={getValue('academy_prime_description')}
                      onChange={(e) => handleChange('academy_prime_description', e.target.value)}
                      placeholder={tr("مجتمع النخبة لتطوير البرمجيات الكاملة وتطبيقات SaaS المربحة...", "Elite community to build scalable web applications...")}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleSave('academy_prime_description')} 
                        disabled={!hasChanges('academy_prime_description') || updateSetting.isPending}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {tr("حفظ وصف باقة PRIME", "Save PRIME Description")}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SERVICES & SUPPORT TAB */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid gap-6">
            {/* WhatsApp Support Number */}
            <Card className="border-emerald-500/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {tr("رقم WhatsApp للدعم الفني والتواصل", "Support WhatsApp Number")}
                    </CardTitle>
                    <CardDescription>
                      {tr(
                        "يظهر هذا الرقم لجميع العملاء كزر تواصل عائم ومباشر في متجر الخدمات ونموذج طلب المشاريع الخاصة ومتابعة الطلبات.",
                        "This number is displayed across the services storefront, custom project requests, and order tracking as a direct chat button."
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="support_whatsapp_number">
                    {tr("رقم الواتساب مع رمز الدولة (مثال: 212600000000+)", "WhatsApp Number with country code")}
                  </Label>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      id="support_whatsapp_number"
                      dir="ltr"
                      value={getValue('support_whatsapp_number')}
                      onChange={(e) => handleChange('support_whatsapp_number', e.target.value)}
                      placeholder="+212600000000"
                    />
                    <Button
                      onClick={() => handleSave('support_whatsapp_number')}
                      disabled={!hasChanges('support_whatsapp_number') || updateSetting.isPending}
                      className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {updateSetting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {tr("حفظ الرقم", "Save Number")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr("تأكد من كتابة الرقم بالصيغة الدولية مع رمز الدولة ليعمل رابط wa.me بشكل صحيح.", "Ensure the number is in international format for the wa.me link to work properly.")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* PayPal Business Integration */}
            <Card className="border-blue-500/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {tr("بوابة الدفع PayPal Business والبطاقات البنكية", "PayPal Business & Cards Gateway")}
                    </CardTitle>
                    <CardDescription>
                      {tr(
                        "ربط متجر الخدمات مع PayPal Business لتمكين الأعضاء من الدفع مباشرة بالبطاقة البنكية (Visa/Mastercard) أو عبر حساب PayPal.",
                        "Connect services store with PayPal Business to enable direct credit/debit card and PayPal account payments."
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{tr("وضع التشغيل (PayPal Mode)", "PayPal Environment Mode")}</Label>
                    <div className="flex gap-2">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={getValue('paypal_mode')}
                        onChange={(e) => handleChange('paypal_mode', e.target.value)}
                      >
                        <option value="sandbox">Sandbox (تجريبي للاختبار)</option>
                        <option value="live">Live (إنتاجي حقيقي)</option>
                      </select>
                      <Button
                        onClick={() => handleSave('paypal_mode')}
                        disabled={!hasChanges('paypal_mode') || updateSetting.isPending}
                        size="sm"
                        className="shrink-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{tr("حالة التفعيل", "Status")}</Label>
                    <div className="flex gap-2">
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={getValue('paypal_enabled')}
                        onChange={(e) => handleChange('paypal_enabled', e.target.value)}
                      >
                        <option value="1">{tr("مفعّل (Enabled)", "Enabled")}</option>
                        <option value="0">{tr("معطّل (Disabled)", "Disabled")}</option>
                      </select>
                      <Button
                        onClick={() => handleSave('paypal_enabled')}
                        disabled={!hasChanges('paypal_enabled') || updateSetting.isPending}
                        size="sm"
                        className="shrink-0"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tr("PayPal Client ID", "PayPal Client ID")}</Label>
                  <div className="flex gap-2">
                    <Input
                      dir="ltr"
                      value={getValue('paypal_client_id')}
                      onChange={(e) => handleChange('paypal_client_id', e.target.value)}
                      placeholder="e.g. A21AAJ... أو المعرف التجاري"
                    />
                    <Button
                      onClick={() => handleSave('paypal_client_id')}
                      disabled={!hasChanges('paypal_client_id') || updateSetting.isPending}
                      className="gap-2 shrink-0"
                    >
                      <Save className="h-4 w-4" />
                      {tr("حفظ", "Save")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{tr("PayPal Client Secret", "PayPal Client Secret")}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      dir="ltr"
                      value={getValue('paypal_client_secret')}
                      onChange={(e) => handleChange('paypal_client_secret', e.target.value)}
                      placeholder="••••••••••••••••••••••••"
                    />
                    <Button
                      onClick={() => handleSave('paypal_client_secret')}
                      disabled={!hasChanges('paypal_client_secret') || updateSetting.isPending}
                      className="gap-2 shrink-0"
                    >
                      <Save className="h-4 w-4" />
                      {tr("حفظ", "Save")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr("يُحفظ المفتاح السري بأمان ولا يظهر للعملاء في الواجهة الأمامية إطلاقاً.", "Secret key is stored securely and never exposed to the frontend client.")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Service Commission Settings */}
            <Card className="border-amber-500/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {tr("نسبة عمولة مبيعات الخدمات للمُحيل المباشر", "Direct Service Commission Rate")}
                    </CardTitle>
                    <CardDescription>
                      {tr(
                        "النسبة المئوية التي يحصل عليها المُحيل المباشر فقط (الجيل الأول) عند شراء العضو لأي خدمة أو منتج رقمي.",
                        "Percentage earned strictly by the direct referrer (Gen 1) upon service purchases."
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_commission_rate">
                    {tr("نسبة العمولة (%)", "Commission Percentage (%)")}
                  </Label>
                  <div className="flex gap-2 max-w-xs">
                    <Input
                      id="service_commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      dir="ltr"
                      value={getValue('service_commission_rate')}
                      onChange={(e) => handleChange('service_commission_rate', e.target.value)}
                      placeholder="10"
                    />
                    <Button
                      onClick={() => handleSave('service_commission_rate')}
                      disabled={!hasChanges('service_commission_rate') || updateSetting.isPending}
                      className="gap-2 shrink-0"
                    >
                      <Save className="h-4 w-4" />
                      {tr("حفظ", "Save")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {tr("القيمة الافتراضية هي 10%. العمولة خاصة بقسم الخدمات فقط وتُودع مباشرة في رصيد المحفظة.", "Default is 10%. Applies exclusively to the services section and deposits to wallet balance.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
