import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  GraduationCap, 
  BookOpen, 
  Video, 
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface AcademyLockedGateProps {
  pendingPackage?: any;
  userPackage?: any;
  reason?: 'no_package' | 'upgrade_required';
}

export function AcademyLockedGate({ pendingPackage, userPackage, reason = 'no_package' }: AcademyLockedGateProps) {
  const navigate = useNavigate();

  const isUpgrade = reason === 'upgrade_required' || (userPackage && Number(userPackage.level) < 2);
  const isPending = !!pendingPackage;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 p-6 sm:p-10 text-center shadow-lg my-4">
      {/* Ambient background blur elements */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-6">
        {/* Lock Icon with animated badge */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/20 via-primary/20 to-violet-500/20 border border-amber-500/30 text-amber-500 dark:text-amber-400 shadow-xl shadow-amber-500/10">
              <Lock className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-amber-500 text-white shadow-xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <Badge variant="outline" className="px-3 py-1 rounded-full text-xs font-bold border-amber-400/60 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isPending 
              ? tr("طلب الاشتراك قيد المراجعة", "Subscription Request Pending")
              : isUpgrade 
                ? tr("محتوى مقفل — يتطلب باقة تعليمية", "Locked Content — Requires Study Package")
                : tr("أكاديمية Nexyvora مقفلة — يلزم تفعيل باقة", "Academy Locked — Package Activation Required")}
          </Badge>
        </div>

        {/* Headings */}
        <div className="space-y-2.5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isPending 
              ? tr("طلب اشتراكك قيد المراجعة حالياً من الإدارة", "Your subscription request is being reviewed by Admin")
              : isUpgrade 
                ? tr("قم بترقية باقتك للوصول إلى الأكاديمية والتكوينات", "Upgrade your package to access the Academy & Formations")
                : tr("الأكاديمية والتكوينات تفتح تلقائياً بعد شراء الباقة", "The Academy & Formations unlock after purchasing a package")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto">
            {isPending ? (
              tr(
                `لقد تم استلام طلبك للاشتراك في باقة (${pendingPackage.package_name_ar || pendingPackage.package_name}). سيتم فتح كامل أقسام الأكاديمية والتكوينات فور تأكيد الإيداع من قبل فريق الإدارة.`,
                `Your request for ${pendingPackage.package_name} is under review. Full access to the Academy & Formations will be activated as soon as admin approves the deposit.`
              )
            ) : isUpgrade ? (
              tr(
                "باقتك الحالية مفعلة ولكنها لا تشمل التكوينات والمقررات الأكاديمية. للوصول إلى دورات الذكاء الاصطناعي والتجارة الرقمية وشهادات التخرج، يرجى الترقية إلى باقة FLOW أو أعلى.",
                "Your current package is active but does not include Academy curriculum. To unlock AI courses and diplomas, please upgrade to FLOW or higher."
              )
            ) : (
              tr(
                "أكاديمية Nexyvora والتكوينات التدريبية والمحاضرات وشهادات التخرج المعتمدة متاحة حصرياً للأعضاء المشتركين في إحدى باقات المنصة.",
                "Nexyvora Academy, training formations, live sessions, and QR-verified diplomas are exclusively available for members with an active package."
              )
            )}
          </p>
        </div>

        {/* Pending Banner if applicable */}
        {isPending && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-start">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {tr("حالة الطلب: قيد التدقيق (Pending)", "Status: Pending Review")}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  {tr("تاريخ تقديم الطلب:", "Submitted on:")} {new Date(pendingPackage.purchased_at).toLocaleString()}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/student/my-package')}
              className="rounded-xl text-xs font-bold shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300"
            >
              {tr("تفاصيل الطلب", "View Details")}
            </Button>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-start">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {tr("دورات تكوينية متخصصة", "Specialized Formations")}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                {tr("تكوينات عملية في التجارة الرقمية، الذكاء الاصطناعي وبناء الوكلاء الأذكياء.", "Hands-on courses in e-commerce, AI, and autonomous agents.")}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
              <Video className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {tr("حصص مباشرة عبر Zoom", "Live Zoom Classes")}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                {tr("لقاءات وورش عمل أسبوعية مباشرة وتفاعلية مع الأساتذة والخبراء.", "Interactive weekly live workshops and coaching calls with instructors.")}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {tr("شهادات ودبلومات معتمدة", "Verified Certifications")}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                {tr("شهادات إتمام رسمية موثقة برمز QR عند إنهاء كافة دروس كل تكوين.", "Official completion diplomas with QR verification upon completing courses.")}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-2xs">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {tr("تفعيل الأرباح والعمولات", "Earnings & Referral Tree")}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                {tr("تفعيل رابط الإحالة الخاص بك والاستفادة من أرباح الأجيال الـ 10.", "Activate your referral link and earn multi-generation commissions.")}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Button
            size="lg"
            onClick={() => navigate('/student/packages')}
            className="w-full sm:w-auto rounded-2xl font-bold bg-primary hover:bg-primary/90 text-white gap-2 shadow-lg shadow-primary/25 px-8 py-6 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isUpgrade 
                ? tr("ترقية باقتك لفتح الأكاديمية", "Upgrade Package To Unlock") 
                : tr("استكشاف وشراء الباقات (Explore Packages)", "Explore & Purchase Packages")}
            </span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/student')}
            className="w-full sm:w-auto rounded-2xl font-bold border-slate-200 dark:border-slate-800 px-6 py-6 text-sm text-slate-600 dark:text-slate-300"
          >
            {tr("العودة إلى لوحة التحكم", "Back to Dashboard")}
          </Button>
        </div>
      </div>
    </div>
  );
}
