import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  Users, 
  TrendingUp, 
  Briefcase, 
  Share2, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

export function ProgramsSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const programs = [
    {
      id: 'online-training',
      title: t('landing.programs.card1Title') || (isRtl ? 'تكوين عبر الإنترنت' : 'Formation en ligne'),
      desc: t('landing.programs.card1Desc') || (isRtl 
        ? 'الوصول إلى وحدات تعليمية تفاعلية شاملة، وفق وتيرتك الخاصة، ومن أي مكان في العالم.'
        : "Accédez à des modules de formation complets et interactifs, à votre rythme, depuis n'importe où."),
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
      icon: GraduationCap,
      badgeColor: 'bg-indigo-600 text-white shadow-indigo-600/30',
      link: '/auth',
    },
    {
      id: 'network-marketing',
      title: t('landing.programs.card2Title') || (isRtl ? 'التسويق الشبكي' : 'Marketing de réseau'),
      desc: t('landing.programs.card2Desc') || (isRtl 
        ? 'تعلم كيفية بناء فريقك وتحقيق مداخيل مستدامة ومتنامية بفضل نظامنا المدروس.'
        : 'Apprenez à construire votre équipe et à générer des revenus durables grâce à notre système.'),
      image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80',
      icon: Users,
      badgeColor: 'bg-blue-600 text-white shadow-blue-600/30',
      link: '/auth',
    },
    {
      id: 'personal-development',
      title: t('landing.programs.card3Title') || (isRtl ? 'التطوير الذاتي والشخصي' : 'Développement personnel'),
      desc: t('landing.programs.card3Desc') || (isRtl 
        ? 'عزز ثقتك بنفسك، طور مهاراتك القيادية واكتسب عقلية رواد الأعمال الناجحين.'
        : 'Renforcez votre confiance, vos compétences et votre mentalité de gagnant.'),
      image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
      icon: TrendingUp,
      badgeColor: 'bg-emerald-600 text-white shadow-emerald-600/30',
      link: '/auth',
    },
    {
      id: 'tools-resources',
      title: t('landing.programs.card4Title') || (isRtl ? 'الأدوات والموارد' : 'Outils & Ressources'),
      desc: t('landing.programs.card4Desc') || (isRtl 
        ? 'استفد من أحدث الأدوات التكنولوجية، والمحتويات الحصرية، والمواكبة المستمرة.'
        : "Bénéficiez d'outils modernes, de supports exclusifs et d'un accompagnement constant."),
      image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
      icon: Briefcase,
      badgeColor: 'bg-amber-500 text-white shadow-amber-500/30',
      link: '/auth',
    },
    {
      id: 'global-community',
      title: t('landing.programs.card5Title') || (isRtl ? 'مجتمع دولي متصل' : 'Une communauté internationale'),
      desc: t('landing.programs.card5Desc') || (isRtl 
        ? 'تواصل، تعلم، وتطور مع آلاف الأعضاء الطموحين من مختلف أنحاء العالم.'
        : 'Échangez, apprenez et évoluez avec des milliers de membres dans le monde entier.'),
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80',
      icon: Share2,
      badgeColor: 'bg-purple-600 text-white shadow-purple-600/30',
      link: '/auth',
    },
  ];

  return (
    <section id="programmes" className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 lg:mb-16 gap-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs sm:text-sm font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              {t('landing.programs.tag') || 'NOS PROGRAMMES'}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('landing.programs.title') || (isRtl ? 'تكوينات مصممة لتحقيق كافة أهدافك' : 'Des formations pour tous vos objectifs')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              {t('landing.programs.subtitle') || (isRtl 
                ? 'سواء كنت ترغب في تطوير مهاراتك، تحقيق مداخيل مالية، أو بناء استقلالك المالي، تقدم لك Nexyvora برامج متطورة تلائم طموحاتك ومستواك.'
                : 'Que vous souhaitiez développer vos compétences, générer des revenus ou bâtir votre indépendance financière, Nexyvora vous propose des programmes adaptés à votre niveau et à vos ambitions.')}
            </p>
          </div>

          <Link
            to="/auth"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group shrink-0"
          >
            <span>{t('landing.programs.viewAll') || (isRtl ? 'عرض جميع البرامج' : 'Voir tous les programmes')}</span>
            {isRtl ? (
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            ) : (
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            )}
          </Link>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {programs.map((prog) => (
            <div
              key={prog.id}
              className="group bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-lg shadow-slate-100/80 dark:shadow-black/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
            >
              
              {/* Card Image Container with overlap badge */}
              <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={prog.image}
                  alt={prog.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                
                {/* Floating circular icon at bottom-start */}
                <div className={`absolute -bottom-5 start-5 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 ${prog.badgeColor} z-10 transition-transform group-hover:scale-110`}>
                  <prog.icon className="w-5 h-5" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 pt-8 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {prog.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                    {prog.desc}
                  </p>
                </div>

                {/* En savoir plus Link */}
                <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800/80">
                  <Link
                    to={prog.link}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
                  >
                    <span>{t('landing.programs.learnMore') || (isRtl ? 'اعرف المزيد' : 'En savoir plus')}</span>
                    {isRtl ? (
                      <ArrowLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </Link>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
