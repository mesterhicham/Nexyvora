import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { serviceService, userService } from '@/services/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Code2, Bot, Store, Smartphone, Globe, 
  MessageCircle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Loader2, Send 
} from 'lucide-react';
import { toast } from 'sonner';

export default function CustomProjectRequest() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();

  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('ecommerce');
  const [description, setDescription] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('$500 - $1,500');
  const [estimatedDuration, setEstimatedDuration] = useState('2 - 4 أسابيع');
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchProfileAndData();
    fetchMyRequests();
  }, []);

  const fetchProfileAndData = async () => {
    try {
      const [profile, setRes] = await Promise.all([
        userService.getProfile(),
        serviceService.getPublicSettings()
      ]);
      if (profile) {
        setContactEmail(profile.email || '');
      }
      if (setRes?.success) {
        setSettings(setRes.data);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await serviceService.getMyCustomProjects();
      if (res?.success) {
        setMyRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch custom project requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !description.trim() || !contactEmail.trim()) {
      toast.error(tr('يرجى ملء جميع الحقول الإلزامية المطلوبة', 'Please fill all required fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await serviceService.createCustomProject({
        project_name: projectName.trim(),
        project_type: projectType,
        description: description.trim(),
        estimated_budget: estimatedBudget,
        estimated_duration: estimatedDuration,
        contact_email: contactEmail.trim(),
        contact_whatsapp: contactWhatsapp.trim() || undefined,
        attachment_url: attachmentUrl.trim() || undefined
      });

      if (res?.success) {
        toast.success(tr('تم إرسال طلب مشروعك الخاص بنجاح! سنتواصل معك قريباً', 'Project request submitted successfully!'));
        setProjectName('');
        setDescription('');
        setAttachmentUrl('');
        fetchMyRequests();
      } else {
        toast.error(res?.message || tr('فشل إرسال الطلب', 'Submission failed'));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr('حدث خطأ أثناء إرسال الطلب', 'Error submitting request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectTypes = [
    { id: 'ecommerce', label: tr('متجر إلكتروني متكامل', 'E-Commerce Store'), icon: Store },
    { id: 'saas', label: tr('نظام ويب / SaaS سحابي', 'SaaS Web Application'), icon: Code2 },
    { id: 'ai_agent', label: tr('بوت / وكيل ذكاء اصطناعي', 'AI Agent / Automation Bot'), icon: Bot },
    { id: 'website', label: tr('موقع تعريفي للشركات', 'Corporate Website'), icon: Globe },
    { id: 'mobile_app', label: tr('تطبيق هاتف محمول', 'Mobile App'), icon: Smartphone },
    { id: 'other', label: tr('نظام مخصص آخر', 'Other Custom Software'), icon: Zap },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new_request':
        return <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600">{tr('طلب جديد', 'New Request')}</Badge>;
      case 'reviewing':
        return <Badge className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">{tr('قيد المراجعة الفنية', 'Under Review')}</Badge>;
      case 'contacted':
      case 'meeting_scheduled':
        return <Badge className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">{tr('تم التواصل / مقابلة', 'Contacted / Meeting')}</Badge>;
      case 'in_progress':
        return <Badge className="text-xs bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">{tr('قيد التطوير والتنفيذ', 'In Progress')}</Badge>;
      case 'completed':
        return <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">{tr('مكتمل ومسلّم', 'Completed')}</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const whatsappNumber = settings?.support_whatsapp_number || '+212600000000';
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');

  return (
    <DashboardLayout role="student">
      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <PageHeader
            title={tr("طلب تطوير مشروع برمجي خاص", "Custom Project Development")}
            description={tr(
              "اطرح فكرة مشروعك، نظامك السحابي، أو متجرك الخاص وسيقوم فريق Nextvora البرمجي بدراسة المتطلبات وتقديم عرض فني وزمني متكامل.",
              "Submit your bespoke project requirements and our engineering team will provide a tailored technical proposal."
            )}
            breadcrumbs={[
              { label: tr("الرئيسية", "Dashboard"), href: "/student" },
              { label: tr("متجر الخدمات", "Services Store"), href: "/student/services" },
              { label: tr("طلب مشروع خاص", "Custom Project") }
            ]}
          />
          <Link to="/student/services">
            <Button variant="outline" size="sm" className="gap-2">
              {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {tr("العودة للمتجر", "Back to Store")}
            </Button>
          </Link>
        </div>

        {/* Main Content Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Form (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 dark:border-slate-800 shadow-md rounded-2xl">
              <CardHeader className="bg-slate-50/50 dark:bg-slate-900/30 border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  {tr("نموذج تفاصيل المشروع المطلوب", "Project Specification Form")}
                </CardTitle>
                <CardDescription className="text-xs">
                  {tr("يرجى تزويدنا بأكبر قدر ممكن من التفاصيل لتقديم عرض سعر دقيق", "Provide as much detail as possible for accurate estimation")}
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                  {/* Project Name */}
                  <div className="space-y-2">
                    <Label htmlFor="project_name" className="text-xs font-bold">
                      {tr("اسم المشروع أو الفكرة المقترحة *", "Project / Idea Name *")}
                    </Label>
                    <Input
                      id="project_name"
                      placeholder={tr("مثال: متجر عطور احترافي مع تطبيق أو نظام SaaS لإدارة الشحن", "e.g. Modern E-commerce or Logistics SaaS")}
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      required
                      className="text-xs"
                    />
                  </div>

                  {/* Project Type */}
                  <div className="space-y-2.5">
                    <Label className="text-xs font-bold">
                      {tr("نوع المشروع الأساسي *", "Primary Project Category *")}
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {projectTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = projectType === type.id;
                        return (
                          <div
                            key={type.id}
                            onClick={() => setProjectType(type.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${
                              isSelected
                                ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-[11px] leading-tight">{type.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description / Scope */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs font-bold">
                      {tr("وصف المشروع والوظائف المطلوبة بالتفصيل *", "Detailed Scope & Key Features *")}
                    </Label>
                    <Textarea
                      id="description"
                      rows={5}
                      placeholder={tr(
                        "اذكر أهم المميزات، الفئة المستهدفة، هل لديك تصميم جاهز أو تفضيلات تقنية معينة، وأي أمثلة لمواقع مشابهة تعجبك...",
                        "Describe target audience, required features, any design wireframes or reference links..."
                      )}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      className="text-xs leading-relaxed"
                    />
                  </div>

                  {/* Budget & Timeline */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-xs font-bold">
                        {tr("الميزانية التقديرية المتوقعة", "Estimated Budget")}
                      </Label>
                      <select
                        id="budget"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={estimatedBudget}
                        onChange={(e) => setEstimatedBudget(e.target.value)}
                      >
                        <option value="$300 - $600">$300 - $600 (مشروع صغير / متجر قياسي)</option>
                        <option value="$600 - $1,500">$600 - $1,500 (متجر متقدم أو نظام ويب)</option>
                        <option value="$1,500 - $3,500">$1,500 - $3,500 (منصة SaaS أو تطبيق)</option>
                        <option value="$3,500+">$3,500+ (نظام مؤسسي ضخم)</option>
                        <option value="Flexible">قابل للتفاوض / حسب المقترح</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-xs font-bold">
                        {tr("المدة الزمنية المرغوبة للتسليم", "Desired Delivery Timeframe")}
                      </Label>
                      <select
                        id="duration"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(e.target.value)}
                      >
                        <option value="1 - 2 أسابيع">1 - 2 أسابيع (عاجل)</option>
                        <option value="2 - 4 أسابيع">2 - 4 أسابيع (متوسط)</option>
                        <option value="1 - 2 أشهر">1 - 2 أشهر (مشروع كامل)</option>
                        <option value="Flexible">مرن / حسب الاتفاق</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-xs font-bold">
                        {tr("البريد الإلكتروني للتواصل *", "Contact Email *")}
                      </Label>
                      <Input
                        id="contact_email"
                        type="email"
                        dir="ltr"
                        placeholder="you@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_whatsapp" className="text-xs font-bold">
                        {tr("رقم WhatsApp للتواصل المباشر", "WhatsApp Number for Quick Chat")}
                      </Label>
                      <Input
                        id="contact_whatsapp"
                        type="tel"
                        dir="ltr"
                        placeholder="+212600000000"
                        value={contactWhatsapp}
                        onChange={(e) => setContactWhatsapp(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Attachment URL / Google Drive link */}
                  <div className="space-y-2">
                    <Label htmlFor="attachment" className="text-xs font-semibold">
                      {tr("رابط مرفقات أو ملفات توضيحية (Google Drive / Figma)", "Reference Links / Attachments")}
                    </Label>
                    <Input
                      id="attachment"
                      dir="ltr"
                      placeholder="https://drive.google.com/... أو رابط التصميم"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </CardContent>

                <CardFooter className="bg-slate-50/50 dark:bg-slate-900/20 p-6 border-t flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold px-6 shadow-md"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {tr("إرسال طلب المشروع الآن", "Submit Project Request")}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>

          {/* Right Sidebar Info & WhatsApp Callout (1 col) */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-background rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-base">
                  {tr("تفضل مناقشة الفكرة فوراً؟", "Want Instant Discussion?")}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tr(
                    "يمكنك مراسلة فريق الإدارة والمطورين مباشرة عبر WhatsApp لمناقشة المتطلبات وتحديد الموعد المناسب.",
                    "Chat directly with our tech team on WhatsApp for rapid feedback and scoping."
                  )}
                </p>
              </div>
              <a
                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent('مرحباً، أود استشارة فريق Nextvora حول تطوير مشروع برمجي مخصص')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                {tr("محادثة عبر WhatsApp", "Chat on WhatsApp")}
              </a>
            </Card>

            <Card className="border rounded-2xl p-6 space-y-3 bg-card">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {tr("مراحل تنفيذ المشروع الخاص", "Project Workflow Steps")}
              </h4>
              <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal list-inside leading-relaxed">
                <li><strong className="text-foreground">{tr("دراسة الطلب", "Review")}:</strong> مراجعة المتطلبات وإعداد المقترح الفني.</li>
                <li><strong className="text-foreground">{tr("جلسة التنسيق", "Meeting")}:</strong> مناقشة النطاق والمخططات عبر زوم أو واتساب.</li>
                <li><strong className="text-foreground">{tr("التطوير المرحلي", "Development")}:</strong> بناء النظام مع تقارير تقدم دورية.</li>
                <li><strong className="text-foreground">{tr("التسليم والاختبار", "Delivery")}:</strong> تسليم الكود المصدري والاستضافة والدعم.</li>
              </ol>
            </Card>
          </div>
        </div>

        {/* Previous Requests Table */}
        {myRequests.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="text-lg font-bold">
              {tr("طلبات المشاريع الخاصة السابقة لك", "Your Previous Project Requests")}
            </h3>
            <div className="grid gap-4">
              {myRequests.map((req) => (
                <Card key={req.id} className="p-5 border border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">{req.project_name}</h4>
                        <Badge variant="outline" className="text-[11px] capitalize">{req.project_type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                      <div className="text-[11px] text-muted-foreground flex gap-3 pt-1">
                        <span>{tr("رقم الطلب", "Ref")}: <strong className="text-foreground" dir="ltr">#{req.request_number}</strong></span>
                        <span>•</span>
                        <span>{new Date(req.created_at).toLocaleDateString(isRtl ? 'ar-MA' : 'en-US')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {getStatusBadge(req.status)}
                    </div>
                  </div>

                  {req.admin_notes && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs">
                      <strong className="text-primary block mb-0.5">{tr("ملاحظات الإدارة:", "Admin Feedback:")}</strong>
                      <p className="text-muted-foreground">{req.admin_notes}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
