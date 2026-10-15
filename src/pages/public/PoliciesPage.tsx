import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePlatformSettings } from '@/hooks/useAdminFeatures';
import { DEFAULT_POLICIES } from '@/pages/admin/AdminPolicies';
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Share2, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Lock,
  Mail,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function PoliciesPage() {
  const { policyId } = useParams<{ policyId?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: settingsData } = usePlatformSettings();

  // Find active policy by slug or id, default to first policy ('terms' / 'conditions-generales')
  const activePolicy = DEFAULT_POLICIES.find(
    p => p.slug === policyId || p.id === policyId
  ) || DEFAULT_POLICIES[0];

  // Retrieve stored content from settings or default
  const contentFr = settingsData?.map?.[`${activePolicy.settingKey}_fr`]?.value || 
                    settingsData?.map?.[activePolicy.settingKey]?.value || 
                    activePolicy.defaultContentFr;

  const contentAr = settingsData?.map?.[`${activePolicy.settingKey}_ar`]?.value || 
                    activePolicy.defaultContentAr;

  const displayContent = isRtl ? contentAr : contentFr;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success(tr("تم نسخ الرابط بنجاح!", "Lien copié dans le presse-papiers !"));
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center group">
              <PlatformLogo 
                useFullLogo={true} 
                variant="full" 
                imageClassName="h-9 w-auto" 
                showText={false} 
              />
            </Link>

            <span className="hidden sm:inline-block h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <span>{tr("المركز القانوني والامتثال", "Centre Légal & Conformité")}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{t('common.backToHome') || (tr("الرئيسية", "Accueil"))}</span>
            </Link>

            <Link
              to="/auth"
              className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-sm"
            >
              {t('landing.nav.signIn') || (tr("تسجيل الدخول", "Se connecter"))}
            </Link>
          </div>

        </div>
      </header>

      {/* Hero Banner strip */}
      <section className="bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{tr("السياسات والشروط الرسمية لـ Nexyvora", "Support, Politiques & Conformité Officielle")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {isRtl ? activePolicy.titleAr : activePolicy.titleFr}
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            {isRtl ? activePolicy.descAr : activePolicy.descFr}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Navigation Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                {tr("المستندات والسياسات", "Politiques & Documents")}
              </h2>

              <nav className="mt-3 space-y-1.5">
                {DEFAULT_POLICIES.map((policy) => {
                  const isSelected = activePolicy.id === policy.id;
                  const Icon = policy.icon;

                  return (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => navigate(`/policies/${policy.slug}`)}
                      className={`w-full text-left rtl:text-right p-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{isRtl ? policy.titleAr : policy.titleFr}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 rtl:rotate-180 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Need Legal Support Card */}
            <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-transparent rounded-3xl p-5 border border-indigo-200/50 dark:border-indigo-900/50">
              <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-300 font-bold text-xs sm:text-sm mb-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{tr("هل لديك استفسار قانوني؟", "Question sur nos politiques ?")}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {tr("فريق الدعم والامتثال القانوني في Nexyvora متاح للإجابة على كافة أسئلتكم ومساعدتكم.", "Notre équipe conformité et support est à votre disposition pour toute précision juridique.")}
              </p>
              <a
                href="mailto:support@nexyvora.com"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@nexyvora.com</span>
              </a>
            </div>
          </aside>

          {/* Policy Document Card (8 cols) */}
          <main className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-black/50">
            
            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/40">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {tr("وثيقة رسمية نافذة", "Document officiel en vigueur")}
                </Badge>
                <span className="flex items-center gap-1 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Version 2026.1</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl gap-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{tr("مشاركة", "Partager")}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{tr("طباعة", "Imprimer")}</span>
                </Button>
              </div>
            </div>

            {/* Document Content Render */}
            <article className="mt-8 prose prose-slate dark:prose-invert max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-h1:text-2xl sm:prose-h1:text-3xl prose-h2:text-lg sm:prose-h2:text-xl prose-h2:text-indigo-900 dark:prose-h2:text-indigo-300 prose-p:leading-relaxed prose-li:leading-relaxed">
              <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-800 dark:text-slate-200">
                {displayContent}
              </div>
            </article>

            {/* Seal & Verification Signature Badge */}
            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-300">Nexyvora Legal Compliance Department</p>
                  <p className="text-[11px]">Certifié conforme aux standards internationaux</p>
                </div>
              </div>
              <p className="text-slate-400">© 2026 Nexyvora. Tous droits réservés.</p>
            </div>

          </main>

        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-8 text-center text-xs border-t border-slate-800">
        <p>© 2026 Nexyvora Academy. Support & Politiques Légales.</p>
      </footer>

    </div>
  );
}
