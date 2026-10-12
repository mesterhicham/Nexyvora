import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  Users, 
  Globe, 
  TrendingUp, 
  Sparkles,
  Tv
} from 'lucide-react';

export function HeroSection() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const featureTags = [
    {
      icon: Play,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      label: t('landing.hero.tag1') || (isRtl ? 'تكوينات شاملة' : 'Formations complètes'),
    },
    {
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      label: t('landing.hero.tag2') || (isRtl ? 'مداخيل غير محدودة' : 'Revenus illimités'),
    },
    {
      icon: Globe,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      label: t('landing.hero.tag3') || (isRtl ? 'مجتمع عالمي متكامل' : 'Une communauté mondiale'),
    },
    {
      icon: TrendingUp,
      color: 'text-pink-600 bg-pink-50 border-pink-200',
      label: t('landing.hero.tag4') || (isRtl ? 'مواكبة وتأطير مخصص' : 'Accompagnement personnalisé'),
    },
  ];

  return (
    <section id="home" className="relative pt-28 sm:pt-32 pb-16 lg:pb-24 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      
      {/* Ambient background soft light spheres */}
      <div className="absolute top-10 start-1/4 w-[480px] h-[480px] bg-indigo-200/25 dark:bg-indigo-900/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 end-10 w-[420px] h-[420px] bg-purple-200/25 dark:bg-purple-900/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute -top-10 end-1/3 w-[350px] h-[350px] bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Headlines, descriptions, feature tags, CTAs */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left rtl:lg:text-right">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="p-1 rounded-full bg-indigo-600 text-white">
                <GraduationCap className="w-3.5 h-3.5" />
              </span>
              <span>{t('landing.hero.badge') || (isRtl ? 'مستقبلك يبدأ من هنا' : 'Votre avenir commence ici')}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
              {t('landing.hero.titlePart1') || (isRtl ? 'تعلّم وتدرّب اليوم،' : "Formez-vous aujourd'hui,")}
              <br className="hidden sm:inline" />{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {t('landing.hero.titlePart2') || (isRtl ? 'لتنجح غداً' : 'réussissez demain')}
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              {t('landing.hero.subtitle') || (isRtl 
                ? 'Nexyvora هي أكاديمية رائدة عبر الإنترنت ترافقك في تطويرك الشخصي والمهني من خلال تكوينات عالية الجودة ونظام تسويق شبكي مبتكر ومتميز.'
                : 'Nexyvora est une académie en ligne qui vous accompagne dans votre développement personnel et professionnel grâce à des formations de qualité et un système de marketing de réseau innovant.')}
            </p>

            {/* 4 Feature Badges Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 pt-2 max-w-xl mx-auto lg:mx-0">
              {featureTags.map((tag, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 shadow-2xs backdrop-blur-xs"
                >
                  <div className={`p-1.5 rounded-lg border shrink-0 ${tag.color}`}>
                    <tag.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {tag.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Call to Actions (CTAs) */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-4">
              
              {/* Primary: Découvrir nos programmes */}
              <a
                href="#programmes"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm sm:text-base shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all duration-200"
              >
                <span>{t('landing.hero.ctaPrimary') || (isRtl ? 'اكتشف برامجنا' : 'Découvrir nos programmes')}</span>
                {isRtl ? (
                  <ArrowLeft className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </a>

              {/* Secondary: Voir la vidéo */}
              <a
                href="#video"
                onClick={(e) => {
                  e.preventDefault();
                  const prog = document.getElementById('programmes');
                  prog?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all duration-200 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
                <span>{t('landing.hero.ctaSecondary') || (isRtl ? 'مشاهدة الفيديو' : 'Voir la vidéo')}</span>
              </a>

            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Creative Hero Visual Composition           */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex items-center justify-center">
            
            {/* Ambient Back Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-blue-500/10 rounded-full blur-3xl -z-10 scale-95" />

            {/* Main Stage Container */}
            <div className="relative w-full max-w-[480px] h-[500px] sm:h-[560px]">
              
              {/* Handwritten floating text on top right */}
              <div className="absolute top-1 right-2 sm:right-4 z-20 pointer-events-none transform rotate-3 select-none">
                <span className="font-serif italic font-bold text-lg sm:text-xl text-indigo-600 dark:text-indigo-400 drop-shadow-xs tracking-wide">
                  {t('landing.hero.handwriting') || 'Apprenez Gagnez Évoluez'}
                </span>
                {/* Airplane trail svg */}
                <svg className="w-16 h-8 text-indigo-400/60 mt-0.5 ml-4" viewBox="0 0 70 30" fill="none">
                  <path d="M2 20C15 8 35 6 65 14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M64 11L68 15L62 17L64 11Z" fill="currentColor" />
                </svg>
              </div>

              {/* Central Main Student Portrait */}
              <div className="absolute inset-x-6 sm:inset-x-8 bottom-0 top-12 z-10 rounded-3xl overflow-hidden bg-gradient-to-b from-indigo-950/5 to-indigo-950/20 shadow-2xl border border-white/60 dark:border-slate-800">
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
                  alt="Nexyvora Student"
                  className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-700"
                />
                
                {/* Brand Overlay Badge at bottom of student photo */}
                <div className="absolute bottom-4 inset-x-4 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/40 dark:border-slate-800 flex items-center justify-between shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm">
                      N
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Nexyvora Academy</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Excellence & Réseau</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>En direct</span>
                  </div>
                </div>
              </div>

              {/* Floating Vignette 1: Top Left (Teacher with headset online session) */}
              <div className="absolute -top-3 -left-3 sm:-left-6 z-20 w-32 sm:w-36 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-1 transition-transform duration-300">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80"
                  alt="Mentor Video Session"
                  className="w-full h-20 sm:h-24 object-cover"
                />
                <div className="p-1.5 bg-white/95 dark:bg-slate-900/95 text-center">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Mentorat 1-on-1</p>
                </div>
              </div>

              {/* Floating Vignette 2: Middle Right (Team collaborative meeting) */}
              <div className="absolute top-1/3 -right-3 sm:-right-6 z-20 w-32 sm:w-36 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-1 transition-transform duration-300">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80"
                  alt="Team Collaboration"
                  className="w-full h-20 sm:h-24 object-cover"
                />
                <div className="p-1.5 bg-white/95 dark:bg-slate-900/95 text-center">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Communauté Réseau</p>
                </div>
              </div>

              {/* Floating Vignette 3: Bottom Left (Hands on laptop coding / dashboard) */}
              <div className="absolute bottom-8 -left-4 sm:-left-7 z-20 w-36 sm:w-40 rounded-2xl overflow-hidden shadow-xl border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-1 transition-transform duration-300">
                <img
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80"
                  alt="Hands on Dashboard"
                  className="w-full h-20 sm:h-24 object-cover"
                />
                <div className="p-1.5 bg-white/95 dark:bg-slate-900/95 text-center">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate">Résultats & Croissance</p>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
