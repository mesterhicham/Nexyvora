import { Link } from 'react-router-dom';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { Star, ArrowRight, ArrowLeft } from 'lucide-react';

export function TestimonialAndCtaBanner() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <section id="temoignages" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified Dual Card Banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#172554] via-[#1e1b4b] to-[#311042] text-white p-8 sm:p-10 lg:p-12 shadow-2xl shadow-indigo-950/40 border border-white/10">
          
          {/* Ambient Lighting Spheres */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Stylized 'N' Monogram watermark on far right */}
          <div className="absolute -right-6 -bottom-10 opacity-15 pointer-events-none select-none hidden md:block">
            <svg width="240" height="240" viewBox="0 0 100 100" fill="none">
              <path
                d="M20 80V20L50 50V20H80V80L50 50V80H20Z"
                fill="url(#watermark-grad)"
              />
              <defs>
                <linearGradient id="watermark-grad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60A5FA" />
                  <stop offset="0.5" stopColor="#818CF8" />
                  <stop offset="1" stopColor="#C084FC" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="relative z-10 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Testimonial of Karim El Amrani (5 cols) */}
            <div className="lg:col-span-5 flex items-start gap-4 sm:gap-5">
              
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                  alt="Karim El Amrani"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-indigo-400/50 shadow-md"
                />
              </div>

              {/* Quote & Author Details */}
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed italic">
                  "{t('landing.banner.quote') || (tr("لقد مكنتني Nexyvora من اكتساب مهارات احترافية جديدة وتحقيق أولى مداخيلي المالية. اليوم، أنا أبني مستقبلي بالشكل الذي أردته دائماً!", "Nexyvora m'a permis d'acquérir de nouvelles compétences et de générer mes premiers revenus. Aujourd'hui, je construis la vie que je veux !"))}"
                </p>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-white">
                    {t('landing.banner.authorName') || (tr("كريم العمراني", "Karim El Amrani"))}
                  </p>
                  <p className="text-[11px] sm:text-xs text-indigo-200/80">
                    {t('landing.banner.authorRole') || (tr("عضو في Nexyvora منذ 6 أشهر", "Membre Nexyvora depuis 6 mois"))}
                  </p>
                </div>

                {/* 5 Stars Rating */}
                <div className="flex items-center gap-1 text-amber-400 pt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </div>

            </div>

            {/* Subtle Divider (Desktop vertical, Mobile horizontal) */}
            <div className="hidden lg:block lg:col-span-1 h-36 w-px bg-white/15 mx-auto" />
            <div className="lg:hidden w-full h-px bg-white/10 my-2" />

            {/* Right: Final CTA (6 cols) */}
            <div className="lg:col-span-6 space-y-4 text-center sm:text-left rtl:sm:text-right">
              <p className="text-xs font-bold tracking-wider text-indigo-300 uppercase">
                {t('landing.banner.ctaTag') || (tr("جاهز لخوض غمار هذه التجربة؟", "PRÊT À REJOINDRE L'AVENTURE ?"))}
              </p>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {t('landing.banner.ctaTitle') || (tr("مستقبلك الواعد يبدأ الآن", "Votre futur commence maintenant"))}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                {t('landing.banner.ctaSubtitle') || (tr("سجل اليوم وافتح أبواب الوصول إلى كافة برامجنا وفرصنا الاستثنائية.", "Inscrivez-vous dès aujourd’hui et accédez à toutes nos formations et opportunités."))}
              </p>

              <div className="pt-2">
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl shadow-black/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <span>{t('landing.banner.ctaButton') || (tr("سجل الآن وابدأ رحلتك", "S'inscrire maintenant"))}</span>
                  {isRtl ? (
                    <ArrowLeft className="w-4 h-4 text-slate-900 transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-slate-900 transition-transform group-hover:translate-x-1" />
                  )}
                </Link>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
