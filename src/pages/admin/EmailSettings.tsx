import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { 
  useEmailSettings, 
  useSaveEmailSettings, 
  useEmailTemplates, 
  useUpdateEmailTemplate,
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  useResetEmailTemplates,
  useTestEmailSettings,
  useEmailLogs 
} from '@/hooks/useAdminFeatures';
import { 
  Settings, 
  Mail, 
  FileText, 
  History, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff, 
  Send, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { FormModal } from '@/components/common/FormModal';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EmailSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { data: settings, isLoading: settingsLoading } = useEmailSettings();
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();
  const { data: logs, isLoading: logsLoading } = useEmailLogs();
  
  const saveSettings = useSaveEmailSettings();
  const updateTemplate = useUpdateEmailTemplate();
  const createTemplate = useCreateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();
  const resetTemplates = useResetEmailTemplates();
  const testEmail = useTestEmailSettings();

  const [showPassword, setShowPassword] = useState(false);
  const [emailForm, setEmailForm] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    encryption: 'tls',
    from_email: '',
    from_name: 'Nextvora Platform',
    is_active: false,
  });
  const [formInitialized, setFormInitialized] = useState(false);

  // Template Editing & Preview State
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    slug: '',
    subject: '',
    body_html: '',
    body_text: '',
    variables: [] as string[],
    is_active: true,
  });
  const [templateViewTab, setTemplateViewTab] = useState<'editor' | 'preview'>('editor');
  const [templateSearch, setTemplateSearch] = useState('');

  // Test Email Modal State
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  // Initialize form with settings
  if (settings && !formInitialized) {
    setEmailForm({
      smtp_host: settings.smtp_host || '',
      smtp_port: settings.smtp_port || 587,
      smtp_username: settings.smtp_username || '',
      smtp_password: settings.smtp_password || '',
      encryption: settings.encryption || 'tls',
      from_email: settings.from_email || '',
      from_name: settings.from_name || 'Nextvora Platform',
      is_active: Boolean(settings.is_active),
    });
    setFormInitialized(true);
  }

  const handleSaveSettings = async () => {
    await saveSettings.mutateAsync(emailForm);
  };

  const handleOpenTestModal = () => {
    setTestRecipient(emailForm.from_email || 'test@nextvora.com');
    setTestModalOpen(true);
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      toast.error(isRtl ? 'الرجاء إدخال البريد الإلكتروني المستلم' : 'Please enter recipient email');
      return;
    }
    if (!emailForm.smtp_host) {
      toast.error(isRtl ? 'يرجى إدخال عنوان خادم SMTP أولاً (مثل smtp.gmail.com)' : 'Please enter SMTP host first');
      return;
    }
    await testEmail.mutateAsync({
      test_email: testRecipient,
      ...emailForm,
    });
    setTestModalOpen(false);
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template);
    setIsCreatingTemplate(false);
    setTemplateForm({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      body_html: template.body_html || '',
      body_text: template.body_text || '',
      variables: Array.isArray(template.variables) ? template.variables : [],
      is_active: template.is_active ?? true,
    });
    setTemplateViewTab('editor');
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setIsCreatingTemplate(true);
    setTemplateForm({
      name: '',
      slug: '',
      subject: '',
      body_html: isRtl ? `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ede9fe; border-radius: 18px;">
  <h2 style="color: #7c3aed;">Nextvora Platform</h2>
  <p>مرحباً {{name}}،</p>
  <p>محتوى الرسالة هنا...</p>
</div>`.trim() : `
<div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ede9fe; border-radius: 18px;">
  <h2 style="color: #7c3aed;">Nextvora Platform</h2>
  <p>Hello {{name}},</p>
  <p>Message content here...</p>
</div>`.trim(),
      body_text: '',
      variables: ['name', 'platform_name'],
      is_active: true,
    });
    setTemplateViewTab('editor');
  };

  const handleSaveTemplate = async () => {
    if (isCreatingTemplate) {
      await createTemplate.mutateAsync(templateForm);
      setIsCreatingTemplate(false);
    } else if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...templateForm });
      setEditingTemplate(null);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm(isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا القالب؟' : 'Are you sure you want to delete this template?')) {
      await deleteTemplate.mutateAsync(id);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm(isRtl ? 'هل تريد استعادة جميع قوالب Nextvora الافتراضية (OTP، الترحيب، العمولات، الإيداع، السحب، وغيرها)؟' : 'Do you want to restore all default Nextvora templates (OTP, Welcome, Commissions, Deposit, Withdrawal, etc.)?')) {
      await resetTemplates.mutateAsync();
    }
  };

  // Generate simulated preview HTML replacing {{variables}} with sample dummy values
  const getPreviewHtml = (html: string) => {
    const dummyValues: Record<string, string> = {
      name: isRtl ? 'محمد أحمد' : 'John Doe',
      otp_code: '492015',
      platform_name: 'Nextvora Academy',
      amount: '150.00',
      currency: 'USD',
      generation: '1',
      source_user: 'ahmed_partner',
      wallet_balance: '650.00',
      transaction_id: 'TXN-9842104',
      new_balance: '800.00',
      date: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US'),
      payment_method: 'USDT (TRC20)',
      transaction_proof: '0x8f3c7a2b9e1d...',
      package_name: isRtl ? 'باقة النخبة الاحترافية (Elite VIP)' : 'Elite VIP Package',
      tier: 'Platinum',
      price: '500.00',
      expires_in: '15',
      reset_link: 'https://nextvora.com/reset-password?token=sample',
      login_url: 'https://nextvora.com/auth',
      referral_link: 'https://nextvora.com/auth?ref=NEXTVORA77',
      wallet_url: 'https://nextvora.com/student/wallet',
      academy_url: 'https://nextvora.com/student/academy',
      dashboard_url: 'https://nextvora.com/student'
    };

    let result = html;
    for (const [k, v] of Object.entries(dummyValues)) {
      const reg = new RegExp(`{{\\s*${k}\\s*}}`, 'g');
      result = result.replace(reg, v);
    }
    return result;
  };

  const getTemplateCategory = (slug: string) => {
    if (slug.includes('otp') || slug.includes('password') || slug.includes('welcome')) {
      return { label: isRtl ? 'تسجيل وهوية' : 'Auth & Identity', color: 'border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-950/40', icon: KeyRound };
    }
    if (slug.includes('commission') || slug.includes('deposit') || slug.includes('withdraw')) {
      return { label: isRtl ? 'معاملات مالية' : 'Financial', color: 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40', icon: DollarSign };
    }
    if (slug.includes('package')) {
      return { label: isRtl ? 'باقات واشتراكات' : 'Packages', color: 'border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40', icon: GraduationCap };
    }
    return { label: isRtl ? 'أمان وتحقق' : 'Security', color: 'border-sky-200 text-sky-700 bg-sky-50 dark:bg-sky-950/40', icon: ShieldCheck };
  };

  const filteredTemplates = templates?.filter(t => 
    t.name?.toLowerCase().includes(templateSearch.toLowerCase()) || 
    t.slug?.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.subject?.toLowerCase().includes(templateSearch.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-12 font-sans">
        {/* Header */}
        <PageHeader
          title={isRtl ? 'إعدادات البريد الإلكتروني والقوالب' : 'Email Settings & Templates'}
          description={isRtl ? 'إدارة خادم SMTP، إعدادات الإرسال، وتخصيص قوالب الرسائل التلقائية (OTP، الأرباح، والعمليات المالية).' : 'Manage SMTP mail server, test delivery, and customize automated email templates (OTP, earnings, and transactions).'}
          breadcrumbs={[{ label: t('nav.dashboard'), href: '/admin' }, { label: isRtl ? 'إعدادات البريد' : 'Email Settings' }]}
          icon={Mail}
        />

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
            <TabsTrigger value="settings" className="rounded-xl flex items-center gap-2 text-xs sm:text-sm">
              <Settings className="h-4 w-4 text-purple-600" />
              <span>{isRtl ? 'خادم البريد (SMTP)' : 'SMTP Configuration'}</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-xl flex items-center gap-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span>{isRtl ? 'قوالب الرسائل التلقائية' : 'Email Templates'}</span>
              {templates && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                  {templates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl flex items-center gap-2 text-xs sm:text-sm">
              <History className="h-4 w-4 text-slate-500" />
              <span>{isRtl ? 'سجل الرسائل المرسلة' : 'Delivery Logs'}</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. SMTP Configuration Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <span>{isRtl ? 'إعدادات خادم SMTP' : 'SMTP Server Settings'}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      {isRtl ? 'أدخل بيانات خادم البريد الإلكتروني الذي ستعتمد عليه Nextvora في إرسال رموز التحقق والإشعارات.' : 'Configure the mail transport credentials used by Nextvora to send OTPs and financial alerts.'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleOpenTestModal} 
                      className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs sm:text-sm flex items-center gap-2 hover:bg-purple-50 hover:text-purple-700"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{isRtl ? 'إرسال بريد تجريبي' : 'Test Email'}</span>
                    </Button>

                    <Button 
                      onClick={handleSaveSettings} 
                      disabled={saveSettings.isPending}
                      className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-sm shadow-purple-500/20 text-xs sm:text-sm font-bold flex items-center gap-2"
                    >
                      {saveSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      <span>{isRtl ? 'حفظ الإعدادات' : 'Save Settings'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {settingsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Quick Presets Bar */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>{isRtl ? 'إعداد سريع حسب المزود (Quick Presets):' : 'Quick SMTP Provider Presets:'}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmailForm(prev => ({
                              ...prev,
                              smtp_host: 'smtp.gmail.com',
                              smtp_port: 465,
                              encryption: 'ssl',
                              from_name: prev.from_name || 'Nextvora Platform',
                              is_active: true
                            }));
                            toast.info(isRtl ? 'تم تحديد إعدادات Gmail (Port 465 SSL). تذكر استخدام كلمة مرور التطبيقات App Password.' : 'Gmail preset applied. Use Google App Password.');
                          }}
                          className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 hover:border-purple-400"
                        >
                          Google / Gmail
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmailForm(prev => ({
                              ...prev,
                              smtp_host: 'smtp.hostinger.com',
                              smtp_port: 465,
                              encryption: 'ssl',
                              from_name: prev.from_name || 'Nextvora Platform',
                              is_active: true
                            }));
                            toast.info(isRtl ? 'تم تحديد إعدادات Hostinger Webmail' : 'Hostinger preset applied');
                          }}
                          className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 hover:border-purple-400"
                        >
                          Hostinger
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmailForm(prev => ({
                              ...prev,
                              smtp_host: 'smtp.titan.email',
                              smtp_port: 465,
                              encryption: 'ssl',
                              from_name: prev.from_name || 'Nextvora Platform',
                              is_active: true
                            }));
                            toast.info(isRtl ? 'تم تحديد إعدادات Titan Mail' : 'Titan Mail preset applied');
                          }}
                          className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 hover:border-purple-400"
                        >
                          Titan / Namecheap
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEmailForm(prev => ({
                              ...prev,
                              smtp_host: 'smtp.office365.com',
                              smtp_port: 587,
                              encryption: 'tls',
                              from_name: prev.from_name || 'Nextvora Platform',
                              is_active: true
                            }));
                            toast.info(isRtl ? 'تم تحديد إعدادات Outlook / Office 365' : 'Office 365 preset applied');
                          }}
                          className="rounded-xl text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 hover:border-purple-400"
                        >
                          Outlook / Office 365
                        </Button>
                      </div>

                      {/* Gmail Guidance Alert */}
                      {emailForm.smtp_host === 'smtp.gmail.com' && (
                        <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                          <p className="font-semibold flex items-center gap-1.5">
                            <KeyRound className="h-3.5 w-3.5 text-purple-600" />
                            <span>{isRtl ? 'تعليمات مهمة لإرسال البريد عبر Gmail:' : 'Important Instructions for Gmail SMTP:'}</span>
                          </p>
                          <p className="text-[11px] leading-relaxed opacity-90">
                            {isRtl ? (
                              <>
                                لا تستخدم كلمة المرور العادية لحساب Google. يجب تفعيل التحقق بخطوتين في حسابك، ثم إنشاء <strong>كلمة مرور تطبيق (App Password)</strong> مكونة من 16 حرفاً من خلال الرابط: {' '}
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-purple-700 dark:text-purple-300">
                                  Google App Passwords
                                </a>
                              </>
                            ) : (
                              <>
                                Do not use your standard Google account password. Enable 2-Step Verification, then create a 16-character <strong>App Password</strong> at: {' '}
                                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline font-bold text-purple-700 dark:text-purple-300">
                                  Google App Passwords
                                </a>
                              </>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'عنوان الخادم (SMTP Host)' : 'SMTP Host'}
                        </Label>
                        <Input
                          value={emailForm.smtp_host}
                          onChange={(e) => setEmailForm({ ...emailForm, smtp_host: e.target.value })}
                          placeholder="smtp.gmail.com / mail.yourdomain.com"
                          className="rounded-2xl border-slate-200 dark:border-slate-800 font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'المنفذ (SMTP Port)' : 'SMTP Port'}
                        </Label>
                        <Input
                          type="number"
                          value={emailForm.smtp_port}
                          onChange={(e) => setEmailForm({ ...emailForm, smtp_port: parseInt(e.target.value) || 587 })}
                          placeholder={isRtl ? "587 أو 465" : "587 or 465"}
                          className="rounded-2xl border-slate-200 dark:border-slate-800 font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'اسم المستخدم / البريد (SMTP Username)' : 'SMTP Username'}
                        </Label>
                        <Input
                          value={emailForm.smtp_username}
                          onChange={(e) => setEmailForm({ ...emailForm, smtp_username: e.target.value })}
                          placeholder="notifications@yourdomain.com"
                          className="rounded-2xl border-slate-200 dark:border-slate-800 font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'كلمة مرور التطبيق (SMTP Password)' : 'SMTP Password'}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            value={emailForm.smtp_password}
                            onChange={(e) => setEmailForm({ ...emailForm, smtp_password: e.target.value })}
                            placeholder="••••••••••••"
                            className="rounded-2xl border-slate-200 dark:border-slate-800 font-mono text-sm ltr:pr-10 rtl:pl-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-1/2 -translate-y-1/2 ltr:right-1 rtl:left-1 h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'نوع التشفير (Encryption)' : 'Encryption'}
                        </Label>
                        <Select
                          value={emailForm.encryption}
                          onValueChange={(value) => setEmailForm({ ...emailForm, encryption: value })}
                        >
                          <SelectTrigger className="rounded-2xl border-slate-200 dark:border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="tls">TLS (Port 587)</SelectItem>
                            <SelectItem value="ssl">SSL (Port 465)</SelectItem>
                            <SelectItem value="none">None (Plain / 25)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'بريد المُرسل (From Email)' : 'Sender Email'}
                        </Label>
                        <Input
                          value={emailForm.from_email}
                          onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                          placeholder="noreply@nextvora.com"
                          className="rounded-2xl border-slate-200 dark:border-slate-800 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isRtl ? 'اسم المُرسل (From Name)' : 'Sender Name'}
                        </Label>
                        <Input
                          value={emailForm.from_name}
                          onChange={(e) => setEmailForm({ ...emailForm, from_name: e.target.value })}
                          placeholder="Nextvora Platform"
                          className="rounded-2xl border-slate-200 dark:border-slate-800 text-sm"
                        />
                      </div>
                    </div>

                    {/* Enable / Disable Delivery Toggle */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="enable-email"
                            checked={emailForm.is_active}
                            onCheckedChange={(checked) => setEmailForm({ ...emailForm, is_active: checked })}
                          />
                          <Label htmlFor="enable-email" className="font-bold text-sm text-slate-900 dark:text-white cursor-pointer">
                            {isRtl ? 'تفعيل الإرسال الحقيقي للبريد الإلكتروني' : 'Enable Active Email Delivery'}
                          </Label>
                        </div>
                        <p className="text-xs text-slate-400">
                          {isRtl 
                            ? 'عند التعطيل، سيتم محاكاة الرسائل وتسجيلها في السجلات دون إرسالها الفعلي لتفادي الأخطاء في بيئة التطوير.' 
                            : 'When disabled, outgoing emails are simulated and logged without performing actual SMTP dispatch.'}
                        </p>
                      </div>

                      <Badge variant={emailForm.is_active ? 'default' : 'secondary'} className="rounded-xl px-3 py-1 font-bold text-xs">
                        {emailForm.is_active ? (isRtl ? 'مفعل نشط' : 'ACTIVE') : (isRtl ? 'معطل / محاكاة' : 'SIMULATED')}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span>{isRtl ? 'قوالب الرسائل التلقائية للنظام' : 'System Automated Email Templates'}</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      {isRtl 
                        ? 'تخصيص الرسائل التي تصل للأعضاء من رمز التحقق (OTP) عند التسجيل، إلى إشعارات الأرباح والمعاملات المالية.' 
                        : 'Customize emails sent to members from OTP verification to commissions and financial operations.'}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResetDefaults}
                      disabled={resetTemplates.isPending}
                      className="rounded-2xl border-slate-200 dark:border-slate-800 text-xs flex items-center gap-1.5 hover:bg-slate-100"
                      title={isRtl ? 'استعادة القوالب الافتراضية الأصلية' : 'Restore Default Templates'}
                    >
                      <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                      <span>{isRtl ? 'استعادة القوالب الأصلية' : 'Reset Defaults'}</span>
                    </Button>

                    <Button 
                      size="sm" 
                      onClick={handleOpenCreateTemplate}
                      className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{isRtl ? 'إضافة قالب جديد' : 'New Template'}</span>
                    </Button>
                  </div>
                </div>

                {/* Filter Search */}
                <div className="pt-3">
                  <Input 
                    placeholder={isRtl ? 'ابحث عن قالب (مثال: OTP، عمولة، سحب، إيداع)...' : 'Search templates (e.g. OTP, Commission, Withdrawal)...'}
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="max-w-md rounded-2xl border-slate-200 dark:border-slate-800 text-xs"
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {templatesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : filteredTemplates?.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-bold">{isRtl ? 'لم يتم العثور على قوالب مطابقة' : 'No templates found'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates?.map((template) => {
                      const category = getTemplateCategory(template.slug);
                      const Icon = category.icon;

                      return (
                        <div
                          key={template.id}
                          className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-200 dark:hover:border-purple-900 transition-all flex flex-col justify-between gap-4 group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl text-[11px] font-bold border ${category.color}`}>
                                <Icon className="h-3 w-3" />
                                {category.label}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <span className={`inline-block w-2 h-2 rounded-full ${template.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {template.is_active ? (isRtl ? 'نشط' : 'Active') : (isRtl ? 'معطل' : 'Inactive')}
                                </span>
                              </div>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                              {template.name}
                            </h4>

                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                              <strong>{isRtl ? 'الموضوع:' : 'Subject:'}</strong> {template.subject}
                            </p>

                            {/* Variable chips */}
                            {Array.isArray(template.variables) && template.variables.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {template.variables.map((v: string) => (
                                  <code key={v} className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded-lg text-purple-600 font-mono">
                                    {`{{${v}}}`}
                                  </code>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
                            <code className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                              {template.slug}
                            </code>

                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditTemplate(template)}
                                className="h-8 rounded-xl border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-purple-50 hover:text-purple-700"
                              >
                                {isRtl ? 'تعديل ومعاينة' : 'Edit & Preview'}
                              </Button>

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Delivery Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="rounded-3xl border-slate-100 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <History className="h-5 w-5 text-slate-500" />
                  <span>{isRtl ? 'سجل الرسائل الصادرة' : 'Email Dispatch History'}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {isRtl ? 'أحدث 100 رسالة تم إرسالها أو محاكاتها عبر منصة Nextvora.' : 'Latest 100 email dispatches and delivery statuses.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5 text-slate-500 font-bold ltr:text-left rtl:text-right">{isRtl ? 'المستلم' : 'Recipient'}</th>
                        <th className="p-3.5 text-slate-500 font-bold ltr:text-left rtl:text-right">{isRtl ? 'عنوان الرسالة' : 'Subject'}</th>
                        <th className="p-3.5 text-slate-500 font-bold ltr:text-left rtl:text-right">{isRtl ? 'القالب' : 'Template'}</th>
                        <th className="p-3.5 text-slate-500 font-bold text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="p-3.5 text-slate-500 font-bold ltr:text-right rtl:text-left">{isRtl ? 'التاريخ والوقت' : 'Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {logsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="p-3.5"><Skeleton className="h-4 w-32 rounded-lg" /></td>
                            <td className="p-3.5"><Skeleton className="h-4 w-44 rounded-lg" /></td>
                            <td className="p-3.5"><Skeleton className="h-4 w-24 rounded-lg" /></td>
                            <td className="p-3.5 text-center"><Skeleton className="h-5 w-16 mx-auto rounded-lg" /></td>
                            <td className="p-3.5"><Skeleton className="h-4 w-28 ml-auto rounded-lg" /></td>
                          </tr>
                        ))
                      ) : logs?.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-slate-400">
                            {isRtl ? 'لم يتم إرسال أي رسائل بريد حتى الآن.' : 'No email logs recorded yet.'}
                          </td>
                        </tr>
                      ) : (
                        logs?.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3.5">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">{log.recipient_name || log.recipient_email}</span>
                              {log.recipient_name && <span className="text-[10px] text-slate-400 block font-mono">{log.recipient_email}</span>}
                            </td>
                            <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 max-w-xs truncate">
                              {log.subject}
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                              {log.template_name || 'Direct'}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === 'sent' 
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : log.status === 'failed'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {log.status === 'sent' ? (isRtl ? 'مرسل بنجاح' : 'Sent') : log.status === 'failed' ? (isRtl ? 'فشل' : 'Failed') : (isRtl ? 'محاكاة' : 'Simulated')}
                              </span>
                            </td>
                            <td className="p-3.5 ltr:text-right rtl:text-left text-slate-400 font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit / Create Template Modal with Live Preview */}
        <Dialog open={Boolean(editingTemplate || isCreatingTemplate)} onOpenChange={() => { setEditingTemplate(null); setIsCreatingTemplate(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <span>
                  {isCreatingTemplate ? (isRtl ? 'إنشاء قالب بريد جديد' : 'Create New Template') : `${isRtl ? 'تعديل قالب:' : 'Edit Template:'} ${editingTemplate?.name}`}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {isRtl ? 'قم بتعديل عنوان الرسالة وكود HTML للقالب. استخدم المتغيرات المدرجة لتخصيص محتوى البريد لكل عضو.' : 'Edit template subject and HTML markup. Use dynamic variables to customize content.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'اسم القالب' : 'Template Name'}</Label>
                  <Input
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder={isRtl ? "كود التحقق لتفعيل الحساب..." : "e.g. Account Verification OTP"}
                    className="rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'المعرف الفريد (Slug)' : 'Unique Slug'}</Label>
                  <Input
                    value={templateForm.slug}
                    onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })}
                    placeholder="registration-otp"
                    disabled={!isCreatingTemplate}
                    className="rounded-xl font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'عنوان الرسالة (Subject)' : 'Email Subject'}</Label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder={isRtl ? "عنوان الرسالة مع المتغيرات..." : "Email subject with variables..."}
                  className="rounded-xl text-sm font-medium"
                />
              </div>

              {/* Variable helpers */}
              <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200 block mb-1.5">
                  {isRtl ? '💡 انقر لإدراج المتغيرات في القالب:' : '💡 Click variable to insert into template:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {templateForm.variables?.map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setTemplateForm({ ...templateForm, body_html: templateForm.body_html + ` {{${v}}} ` })}
                      className="text-xs bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg font-mono hover:bg-purple-100 active:scale-95 transition-all"
                    >
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* View Switch: Code Editor vs Live Preview */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'محتوى الرسالة (HTML Body)' : 'HTML Body'}</span>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTemplateViewTab('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      templateViewTab === 'editor' 
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs' 
                        : 'text-slate-500'
                    }`}
                  >
                    {isRtl ? 'محرر الكود' : 'HTML Editor'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateViewTab('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      templateViewTab === 'preview' 
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-2xs' 
                        : 'text-slate-500'
                    }`}
                  >
                    {isRtl ? 'معاينة حية' : 'Live Preview'}
                  </button>
                </div>
              </div>

              {templateViewTab === 'editor' ? (
                <Textarea
                  value={templateForm.body_html}
                  onChange={(e) => setTemplateForm({ ...templateForm, body_html: e.target.value })}
                  rows={12}
                  className="font-mono text-xs rounded-2xl border-slate-200 dark:border-slate-800 leading-relaxed"
                />
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-100/50 dark:bg-slate-950 overflow-x-auto min-h-[300px]">
                  <div 
                    dangerouslySetInnerHTML={{ __html: getPreviewHtml(templateForm.body_html) }} 
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Switch
                    id="template-active"
                    checked={templateForm.is_active}
                    onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
                  />
                  <Label htmlFor="template-active" className="text-xs font-bold cursor-pointer">
                    {isRtl ? 'تفعيل هذا القالب' : 'Template Active'}
                  </Label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => { setEditingTemplate(null); setIsCreatingTemplate(false); }}
                className="rounded-xl text-xs"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSaveTemplate} 
                disabled={updateTemplate.isPending || createTemplate.isPending}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
              >
                {updateTemplate.isPending || createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {isRtl ? 'حفظ التعديلات' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Test Email Modal */}
        <Dialog open={testModalOpen} onOpenChange={setTestModalOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-600" />
                <span>{isRtl ? 'إرسال بريد تجريبي' : 'Send Test Email'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                {isRtl ? 'أدخل البريد الإلكتروني الذي ترغب في إرسال رسالة الاختبار إليه للتحقق من سلامة إعدادات SMTP.' : 'Enter recipient address to verify your SMTP server delivery.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isRtl ? 'بريد المستلم' : 'Recipient Email'}</Label>
                <Input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="your.email@example.com"
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 space-y-1">
                <p><strong>{isRtl ? 'الخادم المحدد:' : 'Current Host:'}</strong> {emailForm.smtp_host || '(Not set)'}</p>
                <p><strong>{isRtl ? 'المنفذ:' : 'Port:'}</strong> {emailForm.smtp_port}</p>
                <p><strong>{isRtl ? 'مُرسل الرسالة:' : 'From:'}</strong> {emailForm.from_email || emailForm.smtp_username || '(Not set)'}</p>
              </div>

              {(!emailForm.smtp_host || !emailForm.smtp_username || !emailForm.smtp_password) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">{isRtl ? 'بيانات SMTP غير مكتملة' : 'Incomplete SMTP Configuration'}</p>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      {isRtl 
                        ? 'يرجى ملء خادم SMTP واسم المستخدم وكلمة مرور التطبيق، وحفظ الإعدادات أولاً.' 
                        : 'Please enter SMTP Host, Username, and App Password, then save settings before testing.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setTestModalOpen(false)} className="rounded-xl text-xs">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSendTestEmail} 
                disabled={testEmail.isPending}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                {testEmail.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{isRtl ? 'إرسال الآن' : 'Send Now'}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
