import { useState, useEffect, useMemo, useRef } from 'react';
import { tr } from '@/utils/tr';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, FileText, Lock, CheckCircle, Play, ShoppingCart, BookOpen, Clock, Image, Award, Download, Sparkles, ArrowUpRight, Package } from 'lucide-react';
import { 
  usePublishedFormations,
  useStudentEnrollments,
  useFormationContent,
  useStudentProgress,
  useUpdateProgress,
  useSubmitFormationPayment,
  Formation,
  FormationContent,
  FormationEnrollment,
} from '@/hooks/useFormations';
import { RestrictedVideoPlayer } from '@/components/formation/RestrictedVideoPlayer';
import { FormationCertificate } from '@/components/formation/FormationCertificate';
import { generateDiplomaPdf } from '@/utils/generateDiplomaPdf';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { packageService } from '@/services/apiService';

export default function StudentFormations() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { user } = useAuth();
  const { data: allFormations } = usePublishedFormations();
  const { data: enrollments } = useStudentEnrollments();
  
  const submitPayment = useSubmitFormationPayment();
  const updateProgress = useUpdateProgress();
  const certificateRef = useRef<HTMLDivElement>(null);

  const [selectedFormation, setSelectedFormation] = useState<Formation | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<FormationEnrollment | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState<{ formationTitle: string; enrollmentId: string } | null>(null);
  const [selectedContentIndex, setSelectedContentIndex] = useState(0);
  const [paymentData, setPaymentData] = useState({ method: 'bank_transfer', reference: '', notes: '' });
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [userPackage, setUserPackage] = useState<any>(null);

  useEffect(() => {
    packageService.getMyPackage()
      .then(res => setUserPackage(res?.currentPackage || null))
      .catch(() => {});
  }, []);

  const { data: formationContent } = useFormationContent(selectedEnrollment?.formation_id);
  const { data: progress } = useStudentProgress(selectedEnrollment?.id);

  // Get enrolled formation IDs
  const enrolledFormationIds = useMemo(() => 
    new Set(enrollments?.map(e => e.formation_id) || []), 
    [enrollments]
  );

  // Available formations (not enrolled)
  const availableFormations = useMemo(() => 
    allFormations?.filter(f => !enrolledFormationIds.has(f.id)) || [],
    [allFormations, enrolledFormationIds]
  );

  // My enrolled formations with approved payment
  const myFormations = useMemo(() => 
    enrollments?.filter(e => e.payment_status === 'approved') || [],
    [enrollments]
  );

  // Pending enrollments
  const pendingEnrollments = useMemo(() => 
    enrollments?.filter(e => e.payment_status === 'pending') || [],
    [enrollments]
  );

  const handlePurchase = async () => {
    if (!selectedFormation) return;
    
    await submitPayment.mutateAsync({
      formationId: selectedFormation.id,
      amount: selectedFormation.price,
      currency: selectedFormation.currency,
      paymentMethod: paymentData.method,
      referenceNumber: paymentData.reference || undefined,
      notes: paymentData.notes || undefined,
    });

    setShowPaymentModal(false);
    setSelectedFormation(null);
    setPaymentData({ method: 'bank_transfer', reference: '', notes: '' });
  };

  const openWatchModal = (enrollment: FormationEnrollment) => {
    setSelectedEnrollment(enrollment);
    setSelectedContentIndex(0);
    setShowWatchModal(true);
  };

  // Check if content is unlocked
  const isContentUnlocked = (contentIndex: number) => {
    if (contentIndex === 0) return true;
    if (!formationContent || !progress) return false;
    
    const previousContent = formationContent[contentIndex - 1];
    if (!previousContent) return true;
    
    const previousProgress = progress.find(p => p.content_id === previousContent.id);
    return previousProgress?.completed || false;
  };

  const currentContent = formationContent?.[selectedContentIndex];
  const currentProgress = progress?.find(p => p.content_id === currentContent?.id);

  const handleVideoProgress = (seconds: number) => {
    if (!selectedEnrollment || !currentContent) return;
    updateProgress.mutate({
      enrollmentId: selectedEnrollment.id,
      contentId: currentContent.id,
      watchedSeconds: seconds,
    });
  };

  const handleVideoComplete = () => {
    if (!selectedEnrollment || !currentContent) return;
    updateProgress.mutate({
      enrollmentId: selectedEnrollment.id,
      contentId: currentContent.id,
      watchedSeconds: currentContent.duration_seconds || 0,
      completed: true,
    });
  };

  const handleDownloadCertificate = async (enrollment: FormationEnrollment) => {
    const total = enrollment.total_contents ?? 0;
    const completed = enrollment.completed_contents ?? 0;
    const isCompleted = Boolean(enrollment.is_completed || (total > 0 && completed >= total));

    if (!isCompleted) {
      toast.error(
        tr(
          `لا يمكن الحصول على الشهادة إلا بعد الإنتهاء الكامل من الدورة التكوينية ومتابعة كافة دروسها بنسبة 100% (أكملت ${completed} من أصل ${total} درس).`,
          `You cannot obtain the certificate until after completing 100% of the training course (${completed}/${total} completed).`
        )
      );
      return;
    }

    setCertificateData({
      formationTitle: enrollment.formation_title || 'Formation',
      enrollmentId: enrollment.id,
    });
    setShowCertificateModal(true);
  };

  const generateCertificate = async () => {
    if (!certificateRef.current || !certificateData) return;
    
    setIsGeneratingCertificate(true);
    try {
      await generateDiplomaPdf(
        certificateRef.current,
        `certificate-${certificateData.enrollmentId.slice(0, 8)}.pdf`
      );
      toast.success(tr("تم تنزيل الشهادة بنجاح!", "Certificate downloaded successfully!"));
    } catch (error) {
      toast.error(tr("فشل إنشاء الشهادة", "Failed to generate certificate"));
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <PageHeader 
        title={tr("المسارات التكوينية", "Formations")} 
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/student' }, { label: tr("المسارات", "Formations") }]} 
      />

      {/* Package Tier Status & Upgrade Notice Banner */}
      {userPackage?.level === 1 && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-white">
                CORE $50 — {tr("الأساس", "Foundation")}
              </span>
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {tr("اشتراك العضوية وتفعيل الأرباح", "Active Membership")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tr("باقتك الحالية تتيح لك مشاهدة الفيديوهات التعريفية بالمشروع وتفعيل رابط الإحالة. لفتح دورات المستوى 1 (التجارة الإلكترونية والبيزنس الرقمي بالذكاء الاصطناعي)، قم بالترقية إلى باقة FLOW بفارق السعر فقط ($100).", "Your current package grants access to project orientation videos and activates referral earnings. Upgrade to FLOW ($150) to unlock Level 1 (E-Commerce & Digital Business).")}
            </p>
          </div>
          <Link to="/student/packages" className="shrink-0">
            <Button className="rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-xs">
              <Sparkles className="h-4 w-4" />
              <span>{tr("ترقية إلى FLOW (المستوى 1)", "Upgrade to FLOW")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {userPackage?.level === 2 && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
                FLOW $150 — {tr("المستوى 1", "Level 1")}
              </span>
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                {tr("التجارة الإلكترونية والبيزنس الرقمي", "E-Commerce & Digital Business")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tr("دورات المستوى 1 مفعلة في حسابك! للانتقال إلى المرحلة التالية وبناء وكلاء وأتمتة الذكاء الاصطناعي، قم بالترقية إلى باقة GROW (المستوى 2).", "Level 1 courses are unlocked! To build AI Agents and autonomous workflows, upgrade to GROW ($500).")}
            </p>
          </div>
          <Link to="/student/packages" className="shrink-0">
            <Button className="rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs">
              <Sparkles className="h-4 w-4" />
              <span>{tr("ترقية إلى GROW (المستوى 2)", "Upgrade to GROW")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {userPackage?.level === 3 && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-600 text-white">
                GROW $500 — {tr("المستوى 2", "Level 2")}
              </span>
              <span className="text-xs font-bold text-purple-800 dark:text-purple-300">
                {tr("الذكاء الاصطناعي والأتمتة", "AI & Automation")}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {tr("دورات المستويين 1 و 2 مفعلة بالكامل! للحصول على البرمجة المتقدمة وبناء SaaS والجلستين الشهريتين للمرافقة الخاصة، بادر بالترقية إلى PRIME (المستوى 3 VIP).", "Levels 1 & 2 unlocked! Upgrade to PRIME ($1000) for advanced AI building, SaaS, and 2 monthly 1-on-1 mentorship sessions.")}
            </p>
          </div>
          <Link to="/student/packages" className="shrink-0">
            <Button className="rounded-2xl font-bold bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-xs">
              <Sparkles className="h-4 w-4" />
              <span>{tr("ترقية إلى PRIME (المستوى 3 VIP)", "Upgrade to PRIME VIP")}</span>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            {tr("تصفح الدورات", "Browse Courses")}
          </TabsTrigger>
          <TabsTrigger value="my-courses" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {tr("دوراتي", "My Courses")} ({myFormations.length})
          </TabsTrigger>
          {pendingEnrollments.length > 0 && (
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              {tr("قيد المراجعة", "Pending")} ({pendingEnrollments.length})
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="browse">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableFormations.map((formation) => (
              <Card key={formation.id} className="flex flex-col overflow-hidden relative">
                {formation.package_name && (
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-violet-600/95 hover:bg-violet-600 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 backdrop-blur-sm border-none">
                      <Package className="h-3 w-3" />
                      <span>{isRtl ? (formation.package_name_ar || formation.package_name) : (formation.package_name || formation.package_name_ar)}</span>
                    </Badge>
                  </div>
                )}
                {formation.thumbnail_url ? (
                  <img 
                    src={formation.thumbnail_url} 
                    alt={formation.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="line-clamp-2">{formation.title}</CardTitle>
                  <CardDescription className="line-clamp-3">{formation.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <FormationStats formationId={formation.id} isRtl={isRtl} />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-primary">
                    {formation.price} {formation.currency}
                  </div>
                  <Button onClick={() => { setSelectedFormation(formation); setShowPaymentModal(true); }}>
                    <ShoppingCart className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {tr("تسجيل", "Enroll")}
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {availableFormations.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {tr("لا توجد مسارات متاحة حالياً.", "No formations available at the moment.")}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-courses">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {myFormations.map((enrollment) => {
              const total = enrollment.total_contents ?? 0;
              const completed = enrollment.completed_contents ?? 0;
              const isCompleted = Boolean(enrollment.is_completed || (total > 0 && completed >= total));
              const progressPercent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : (enrollment.progress_percent || 0);

              return (
                <Card key={enrollment.id} className="flex flex-col overflow-hidden border-border/80 shadow-xs hover:shadow-md transition-shadow">
                  {enrollment.thumbnail_url ? (
                    <img 
                      src={enrollment.thumbnail_url} 
                      alt={enrollment.formation_title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted flex items-center justify-center">
                      <Image className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      {isCompleted ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[11px] font-bold">
                          <CheckCircle className="h-3 w-3" />
                          {tr("مكتملة بنجاح", "Completed")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-[11px] font-medium text-muted-foreground">
                          <Clock className="h-3 w-3 text-amber-500" />
                          {tr("قيد التدريب", "In Progress")}
                        </Badge>
                      )}
                      <span className="text-xs font-mono font-semibold text-muted-foreground">
                        {completed}/{total} {tr("درس", "lessons")}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-base">{enrollment.formation_title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3 pt-0">
                    <FormationStats formationId={enrollment.formation_id} isRtl={isRtl} />

                    {/* Progress Bar & Certificate Eligibility */}
                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium">
                          {tr("نسبة الإنجاز", "Course Progress")}
                        </span>
                        <span className={`font-bold font-mono ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                          {progressPercent}%
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />

                      {isCompleted ? (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{tr("تهانينا! أتممت الدورة وأصبحت الشهادة متاحة", "Course completed, certificate unlocked")}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1 leading-snug">
                          <Lock className="h-3.5 w-3.5 shrink-0" />
                          <span>{tr("لا تُمنح الشهادة إلا بعد الإنتهاء من كامل دروس الدورة (100%)", "Certificate only available after completing 100% of the course")}</span>
                        </p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-2 border-t border-border/40">
                    <Button className="flex-1 gap-2" onClick={() => openWatchModal(enrollment)}>
                      <Play className="h-4 w-4 rtl:rotate-180" />
                      {isCompleted ? tr("مراجعة الدورة", "Review Course") : tr("متابعة", "Continue")}
                    </Button>
                    <Button 
                      variant={isCompleted ? "default" : "outline"}
                      className={`gap-1.5 shrink-0 px-3 transition-colors ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs' 
                          : 'border-dashed border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10'
                      }`}
                      onClick={() => handleDownloadCertificate(enrollment)}
                      title={isCompleted ? tr("تحميل الشهادة المعتمدة", "Download Certificate") : tr("الشهادة مقفلة — أكمل كافة الدروس أولاً", "Certificate locked — complete all lessons first")}
                    >
                      {isCompleted ? (
                        <>
                          <Award className="h-4 w-4 text-amber-300" />
                          <span className="text-xs font-bold">{tr("الشهادة", "Certificate")}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs">{tr("الشهادة مقفلة", "Locked")}</span>
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            {myFormations.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {tr("لم تسجل في أي مسار تكويني بعد.", "You haven't enrolled in any formations yet.")}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEnrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="line-clamp-2">{enrollment.formation_title}</CardTitle>
                    <Badge variant="secondary">{tr("في انتظار التأكيد", "Pending Payment")}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {tr("يتم مراجعة دفعتك من طرف الإدارة. ستحصل على الوصول فور اعتمادها.", "Your payment is being reviewed. You'll get access once it's approved.")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {`${tr("تسجيل في", "Enroll in")} ${selectedFormation?.title || ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-lg font-bold">
                {tr("المجموع:", "Total:")} {selectedFormation?.price} {selectedFormation?.currency}
              </p>
            </div>
            <div>
              <Label>{tr("طريقة الدفع", "Payment Method")}</Label>
              <Select value={paymentData.method} onValueChange={(value) => setPaymentData({ ...paymentData, method: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">{tr("تحويل بنكي", "Bank Transfer")}</SelectItem>
                  <SelectItem value="mobile_payment">{tr("دفع إلكتروني", "Mobile Payment")}</SelectItem>
                  <SelectItem value="cash">{tr("نقداً", "Cash")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{tr("رقم الإشعار أو المعاملة (اختياري)", "Reference Number (optional)")}</Label>
              <Input 
                value={paymentData.reference} 
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} 
                placeholder={tr("رقم المعاملة", "Transaction reference")}
              />
            </div>
            <div>
              <Label>{tr("ملاحظات (اختياري)", "Notes (optional)")}</Label>
              <Input 
                value={paymentData.notes} 
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} 
                placeholder={tr("أي ملاحظات إضافية", "Any additional notes")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              {tr("إلغاء", "Cancel")}
            </Button>
            <Button onClick={handlePurchase} disabled={submitPayment.isPending}>
              {submitPayment.isPending 
                ? (tr("جاري المعالجة...", "Processing...")) 
                : (tr("تأكيد الدفع", "Submit Payment"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Watch Modal */}
      <Dialog open={showWatchModal} onOpenChange={setShowWatchModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedEnrollment?.formation_title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              {currentContent?.content_type === 'video' ? (
                <RestrictedVideoPlayer
                  src={currentContent.file_url}
                  title={currentContent.title}
                  duration={currentContent.duration_seconds || undefined}
                  isLocked={!isContentUnlocked(selectedContentIndex)}
                  initialProgress={currentProgress?.watched_seconds || 0}
                  onProgress={handleVideoProgress}
                  onComplete={handleVideoComplete}
                />
              ) : currentContent?.content_type === 'pdf' ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  {isContentUnlocked(selectedContentIndex) ? (
                    <a 
                      href={currentContent.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-4 p-6 text-center"
                    >
                      <FileText className="h-16 w-16 text-primary" />
                      <p className="font-medium">{currentContent.title}</p>
                      <Button>{tr("فتح ملف PDF", "Open PDF")}</Button>
                    </a>
                  ) : (
                    <div className="text-center p-6">
                      <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p>{tr("أكمل المحتوى السابق للفتح", "Complete the previous content to unlock")}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">{tr("اختر محتوى من القائمة", "Select content from the list")}</p>
                </div>
              )}
            </div>

            {/* Content List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="font-semibold text-sm">{tr("محتوى وقائمة دروس الدورة", "Course Curriculum")}</h4>
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {progress?.filter(p => p.completed).length || 0} / {formationContent?.length || 0} {tr("مكتمل", "completed")}
                </span>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {formationContent?.map((content, index) => {
                  const isUnlocked = isContentUnlocked(index);
                  const contentProgress = progress?.find(p => p.content_id === content.id);
                  const isCompleted = contentProgress?.completed;

                  return (
                    <button
                      key={content.id}
                      onClick={() => isUnlocked && setSelectedContentIndex(index)}
                      disabled={!isUnlocked}
                      className={`w-full p-3 rounded-lg text-left rtl:text-right ltr:text-left transition-colors ${
                        selectedContentIndex === index 
                          ? 'bg-primary text-primary-foreground' 
                          : isUnlocked 
                            ? 'bg-muted hover:bg-muted/80' 
                            : 'bg-muted/50 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : content.content_type === 'video' ? (
                          isUnlocked ? <Video className="h-5 w-5 shrink-0" /> : <Lock className="h-5 w-5 shrink-0" />
                        ) : (
                          isUnlocked ? <FileText className="h-5 w-5 shrink-0" /> : <Lock className="h-5 w-5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{index + 1}. {content.title}</p>
                          {content.duration_seconds && (
                            <p className="text-xs opacity-70 font-mono">
                              {Math.floor(content.duration_seconds / 60)}:{(content.duration_seconds % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Certificate Requirement & Claim Banner */}
              {formationContent && formationContent.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  {(progress?.filter(p => p.completed).length || 0) >= formationContent.length ? (
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-teal-500/5 border border-emerald-500/30 text-center space-y-2">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                        <Award className="h-4 w-4 text-amber-500" />
                        {tr("تهانينا! لقد أتممت الدورة التكوينية بنجاح", "Congratulations! You completed the course")}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {tr("يمكنك الآن الحصول على شهادة إتمام الدورة المعتمدة من منصة NEXYVORA.", "You can now claim your certified course completion certificate from NEXYVORA.")}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-xs text-xs"
                        onClick={() => {
                          if (selectedEnrollment) {
                            handleDownloadCertificate({
                              ...selectedEnrollment,
                              is_completed: true,
                              total_contents: formationContent.length,
                              completed_contents: formationContent.length
                            });
                          }
                        }}
                      >
                        <Award className="h-4 w-4" />
                        {tr("الحصول على الشهادة المعتمدة الآن", "Claim Your Certificate Now")}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        <span>{tr("شرط الحصول على الشهادة:", "Certificate Requirement:")}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {tr(
                          `لا يمكن الحصول على الشهادة إلا بعد الإنتهاء من جميع دروس ومحتويات الدورة التكوينية (متبقي ${formationContent.length - (progress?.filter(p => p.completed).length || 0)} درس).`,
                          `You can only obtain the certificate after completing all lessons (${formationContent.length - (progress?.filter(p => p.completed).length || 0)} lessons remaining).`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Certificate Modal */}
      <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{tr("شهادة إتمام الدورة", "Course Completion Certificate")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="transform scale-[0.6] origin-top">
              {certificateData && (
                <FormationCertificate
                  ref={certificateRef}
                  studentName={user?.email?.split('@')[0] || 'Student'}
                  formationTitle={certificateData.formationTitle}
                  completionDate={new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  certificateId={certificateData.enrollmentId.slice(0, 12).toUpperCase()}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertificateModal(false)}>
              {tr("إغلاق", "Close")}
            </Button>
            <Button onClick={generateCertificate} disabled={isGeneratingCertificate}>
              <Download className="h-4 w-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isGeneratingCertificate 
                ? (tr("جاري الإنشاء...", "Generating...")) 
                : (tr("تحميل PDF", "Download PDF"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Helper component to show formation stats
function FormationStats({ formationId, isRtl }: { formationId: string; isRtl?: boolean }) {
  const { data: content } = useFormationContent(formationId);
  
  const videoCount = content?.filter(c => c.content_type === 'video').length || 0;
  const pdfCount = content?.filter(c => c.content_type === 'pdf').length || 0;

  return (
    <div className="flex gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <Video className="h-4 w-4" />
        <span>{videoCount} {tr("فيديو", "videos")}</span>
      </div>
      <div className="flex items-center gap-1">
        <FileText className="h-4 w-4" />
        <span>{pdfCount} {tr("ملف PDF", "PDFs")}</span>
      </div>
    </div>
  );
}
