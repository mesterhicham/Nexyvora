import { useTranslation } from 'react-i18next';
import { tr } from '@/utils/tr';
import { Users, GraduationCap, Globe, Star } from 'lucide-react';

export function StatsRibbon() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const stats = [
    {
      icon: Users,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      value: t('landing.stats.membersVal') || '+ 50 000',
      label: t('landing.stats.membersLabel') || (tr("عضو نشط", "Membres actifs")),
      desc: t('landing.stats.membersDesc') || (tr("انضم إلى مجتمع ديناميكي ملهم", "Rejoignez une communauté dynamique")),
    },
    {
      icon: GraduationCap,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      value: t('landing.stats.formationsVal') || '+ 100',
      label: t('landing.stats.formationsLabel') || (tr("تكوين متاح", "Formations disponibles")),
      desc: t('landing.stats.formationsDesc') || (tr("من المبتدئ إلى الخبير المتقدم", "Du débutant à l'expert")),
    },
    {
      icon: Globe,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      value: t('landing.stats.countriesVal') || '+ 20',
      label: t('landing.stats.countriesLabel') || (tr("دولة", "Pays")),
      desc: t('landing.stats.countriesDesc') || (tr("فرصة عالمية بلا حدود", "Une opportunité mondiale")),
    },
    {
      icon: Star,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      value: t('landing.stats.ratingVal') || '4.9/5',
      label: t('landing.stats.ratingLabel') || (tr("رضا الأعضاء", "Satisfaction des membres")),
      desc: t('landing.stats.ratingDesc') || (tr("بناءً على 10,000+ تقييم", "Basé sur 10.000+ avis")),
    },
  ];

  return (
    <div className="relative -mt-6 sm:-mt-10 mb-16 sm:mb-20 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Ribbon Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-black/60 border border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-slate-100 dark:divide-slate-800">
            {stats.map((stat, idx) => (
              <div 
                key={idx} 
                className={`flex items-start gap-4 ${idx !== 0 ? 'pt-4 sm:pt-0 sm:ps-6' : ''}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconBg}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {stat.label}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 leading-normal">
                    {stat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
