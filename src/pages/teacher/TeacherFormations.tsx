import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Eye, 
  Image, 
  Link2, 
  Check, 
  GraduationCap, 
  Package, 
  BookOpen, 
  Video, 
  Sparkles, 
  Users 
} from 'lucide-react';
import { 
  useFormations, 
  Formation,
} from '@/hooks/useFormations';
import { toast } from 'sonner';
import { FormationPreview } from '@/components/formation/FormationPreview';
import { FormationContentManager } from '@/components/admin/FormationContentManager';

export default function TeacherFormations() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { data: formations, isLoading } = useFormations();

  const [showContentModal, setShowContentModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [previewFormation, setPreviewFormation] = useState<Formation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyFormationLink = async (formationId: string) => {
    const url = `${window.location.origin}/formation/${formationId}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(formationId);
    toast.success(tr('تم نسخ رابط التكوين بنجاح!', 'Formation link copied!'));
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

  return (
    <DashboardLayout role="teacher">
      <PageHeader 
        title={tr("التكوينات المسندة إليك", "My Assigned Formations")} 
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/teacher' }, 
          { label: tr("التكوينات التعليمية", "Formations") }
        ]} 
      />

      <div className="space-y-6">
        {/* Header Notice Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-500/10 via-primary/5 to-transparent border border-violet-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary text-white flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" />
                {tr("بوابة الأستاذ المشرف", "Teacher Portal")}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {tr("إدارة المحتوى ورفع الدروس التعليمية", "Course Content & Lessons Management")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {tr(
                "هنا تظهر كافة الدورات التكوينية التي قام المشرف بتكليفك بالإشراف عليها. يمكنك النقر على \"إدارة المحتوى\" لرفع مقاطع الفيديو والملفات وإضافة الاختبارات وإعادة ترتيب الدروس.",
                "Here you can see all courses assigned to you by the administration. Click \"Manage Content\" to upload video lessons, documents, quizzes, and manage course materials."
              )}
            </p>
          </div>
        </div>

        {/* Formations Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold">{tr("جاري تحميل التكوينات المسندة إليك...", "Loading formations...")}</span>
          </div>
        ) : !formations || formations.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="p-4 rounded-3xl bg-primary/10 text-primary">
                <GraduationCap className="h-10 w-10" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
                  {tr("لا توجد تكوينات مسندة إليك حالياً", "No formations assigned to you yet")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tr(
                    "عندما يقوم الأدمن بتعيينك كأستاذ مسؤول على إحدى الدورات التكوينية، ستظهر هنا فوراً لتتمكن من رفع محتواها وتحديث دروسها.",
                    "When an administrator assigns a training course to you, it will appear here immediately so you can upload and organize its learning content."
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formations.map((formation) => (
              <Card key={formation.id} className="flex flex-col overflow-hidden relative border-border/80 shadow-xs hover:shadow-md transition-shadow">
                {/* Package Badge */}
                {formation.package_name && (
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-violet-600/95 hover:bg-violet-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 backdrop-blur-sm border-none">
                      <Package className="h-3 w-3" />
                      <span>{isRtl ? (formation.package_name_ar || formation.package_name) : (formation.package_name || formation.package_name_ar)}</span>
                      {formation.package_level && (
                        <span className="opacity-80 font-mono text-[9px]">({tr("مستوى", "Lvl")} {formation.package_level})</span>
                      )}
                    </Badge>
                  </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge 
                    className={`font-semibold text-[10px] shadow-xs ${
                      formation.is_published 
                        ? 'bg-emerald-600/90 text-white' 
                        : 'bg-slate-800/80 text-slate-200'
                    }`}
                  >
                    {formation.is_published ? tr("منشور للطلاب", "Published") : tr("مسودة", "Draft")}
                  </Badge>
                </div>

                {/* Thumbnail */}
                {formation.thumbnail_url ? (
                  <img 
                    src={formation.thumbnail_url} 
                    alt={formation.title}
                    className="w-full h-44 object-cover"
                  />
                ) : (
                  <div className="w-full h-44 bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <CardTitle className="line-clamp-2 text-base font-bold">{formation.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">{formation.description || tr("لا يوجد وصف إضافي.", "No description provided.")}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pt-0">
                  {/* Stats Row */}
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span>{formation.content_count ?? 0} {tr("درس ومحتوى", "lessons")}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                      <Users className="h-3.5 w-3.5" />
                      <span>{formation.enrollment_count ?? 0} {tr("طالب مسجل", "students")}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pt-3 border-t border-border/40">
                  <Button 
                    className="w-full gap-2 font-bold bg-primary hover:bg-primary/90 text-white shadow-xs" 
                    onClick={() => openContentManager(formation)}
                  >
                    <FolderOpen className="h-4 w-4" />
                    <span>{tr("إدارة المحتوى والدروس", "Manage Content")}</span>
                  </Button>

                  <div className="flex w-full gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1.5 text-xs" 
                      onClick={() => openPreview(formation)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{tr("معاينة", "Preview")}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shrink-0 px-2.5" 
                      onClick={() => copyFormationLink(formation.id)}
                      title={tr("نسخ الرابط", "Copy link")}
                    >
                      {copiedId === formation.id ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Formation Content Manager Modal (Videos, Quizzes, PDFs, Drag & Drop) */}
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
        content={[]}
      />
    </DashboardLayout>
  );
}
