import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Users, 
  Cloud, 
  Gem, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

export function WhyChooseUsSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const features = [
    {
      icon: ShieldCheck,
      iconColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: t('landing.whyChooseUs.feat1Title') || (isRtl ? 'تكوينات عالية الجودة' : 'Formation de qualité'),
      desc: t('landing.whyChooseUs.feat1Desc') || (isRtl ? 'محتويات دقيقة ومصممة بعناية على أيدي نخبة من الخبراء في كل مجال.' : 'Contenus créés par des experts dans chaque domaine.'),
    },
    {
      icon: Users,
      iconColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      title: t('landing.whyChooseUs.feat2Title') || (isRtl ? 'مواكبة وتأطير فردي' : 'Accompagnement personnalisé'),
      desc: t('landing.whyChooseUs.feat2Desc') || (isRtl ? 'مدربون وموجهون محترفون يستمعون إليك ويرافقونك في كل خطوة.' : 'Des coachs et mentors à votre écoute à chaque étape.'),
    },
    {
      icon: Cloud,
      iconColor: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400',
      title: t('landing.whyChooseUs.feat3Title') || (isRtl ? 'ولوج مدى الحياة' : 'Accès à vie'),
      desc: t('landing.whyChooseUs.feat3Desc') || (isRtl ? 'راجع تكويناتك ومحاضراتك في أي وقت تريده ودون أي قيود زمنية.' : 'Revenez sur vos formations quand vous le souhaitez.'),
    },
    {
      icon: Gem,
      iconColor: 'text-violet-600 bg-violet-50 dark:bg-violet-950/60 dark:text-violet-400',
      title: t('landing.whyChooseUs.feat4Title') || (isRtl ? 'فرص دخل متنامية' : 'Opportunités de revenus'),
      desc: t('landing.whyChooseUs.feat4Desc') || (isRtl ? 'ابنِ حريتك واستقلالك المالي من خلال نظام التسويق الشبكي المتطور.' : 'Bâtissez votre liberté financière grâce au marketing de réseau.'),
    },
  ];

  return (
    <section id="apropos" className="py-16 sm:py-20 lg:py-28 bg-slate-50/70 dark:bg-slate-900/40 border-y border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Heading, description, CTA */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left rtl:lg:text-right">
            <p className="text-xs sm:text-sm font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              {t('landing.whyChooseUs.tag') || 'POURQUOI NOUS CHOISIR'}
            </p>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              {t('landing.whyChooseUs.title') || (isRtl ? 'تجربة استثنائية وشاملة للنجاح' : 'Une expérience unique et complète')}
            </h2>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('landing.whyChooseUs.subtitle') || (isRtl 
                ? 'في Nexyvora، نؤمن بطاقتك وقدراتك. لذلك نقدم لك أكثر من مجرد تدريب عادي: إنها فرصة حقيقية لإحداث نقلة نوعية في حياتك.'
                : "Chez Nexyvora, nous croyons en votre potentiel. C'est pourquoi nous vous offrons bien plus qu'une formation : une véritable opportunité de changer votre vie.")}
            </p>

            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>{t('landing.whyChooseUs.cta') || (isRtl ? 'انضم إلى Nexyvora' : 'Rejoindre Nexyvora')}</span>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Link>
            </div>
          </div>

          {/* Right Column: 2x2 Feature Grid */}
          <div className="lg:col-span-7">
            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800 shadow-md shadow-slate-200/50 dark:shadow-black/40 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/60 transition-all duration-300 flex flex-col gap-4"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${feat.iconColor}`}>
                    <feat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
