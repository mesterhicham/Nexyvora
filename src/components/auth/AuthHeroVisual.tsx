import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { 
  GraduationCap, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Layers, 
  Cpu
} from 'lucide-react';

interface AuthHeroVisualProps {
  compact?: boolean;
}

export function AuthHeroVisual({ compact = false }: AuthHeroVisualProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const cards = [
    {
      id: 'academy',
      icon: GraduationCap,
      title: isRtl ? 'الأكاديمية' : i18n.language === 'fr' ? 'Académie' : 'Academy',
      desc: isRtl ? 'مسارات معتمدة' : i18n.language === 'fr' ? 'Parcours certifiés' : 'Accredited Degrees',
      stat: '98.5%',
      gradient: 'from-violet-500/20 to-purple-500/10',
      borderHover: 'hover:border-violet-500/40',
      glow: 'shadow-violet-500/10',
      iconBg: 'bg-gradient-to-tr from-violet-600 to-purple-500 text-white shadow-violet-500/30'
    },
    {
      id: 'courses',
      icon: BookOpen,
      title: isRtl ? 'المقررات' : i18n.language === 'fr' ? 'Cours' : 'Courses',
      desc: isRtl ? 'تفاعلية وبث مباشر' : i18n.language === 'fr' ? 'Interactifs & direct' : 'Live & Interactive',
      stat: '500+ H',
      gradient: 'from-blue-500/20 to-indigo-500/10',
      borderHover: 'hover:border-blue-500/40',
      glow: 'shadow-blue-500/10',
      iconBg: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-blue-500/30'
    },
    {
      id: 'progress',
      icon: TrendingUp,
      title: isRtl ? 'التقدم' : i18n.language === 'fr' ? 'Progression' : 'Progress',
      desc: isRtl ? 'رصد آني للمهارات' : i18n.language === 'fr' ? 'Suivi en temps réel' : 'Real-time Analytics',
      stat: 'Real-time',
      gradient: 'from-cyan-500/20 to-sky-500/10',
      borderHover: 'hover:border-cyan-500/40',
      glow: 'shadow-cyan-500/10',
      iconBg: 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-cyan-500/30'
    },
    {
      id: 'community',
      icon: Users,
      title: isRtl ? 'المجتمع' : i18n.language === 'fr' ? 'Communauté' : 'Community',
      desc: isRtl ? 'مجموعات وخبراء' : i18n.language === 'fr' ? 'Réseau & mentors' : 'Mentors & Cohorts',
      stat: '10k+ Peers',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      borderHover: 'hover:border-emerald-500/40',
      glow: 'shadow-emerald-500/10',
      iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
    }
  ];

  // Compact version for Mobile Hero Header (180px–220px high)
  if (compact) {
    return (
      <div className="relative w-full h-[200px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#080C17] via-[#0B1124] to-[#0E162E] border border-white/10 p-5 flex flex-col justify-between shadow-2xl">
        {/* Subtle technical grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
        
        {/* Glowing orbs */}
        <div className="absolute top-0 right-1/4 w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlatformLogo 
              variant="icon"
              showText={true}
              textClassName="text-lg font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent"
              imageClassName="h-7 w-7 object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-[10px] font-semibold text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Next-Gen EdTech</span>
          </div>
        </div>

        {/* Center Headline */}
        <div className="relative z-10">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {isRtl ? 'رحلتك التعليمية ' : 'Your Learning Journey '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              {isRtl ? 'تبدأ من هنا.' : 'Starts Here.'}
            </span>
          </h2>
          <p className="text-[11px] text-slate-300/80 line-clamp-1 mt-0.5">
            {isRtl 
              ? 'بوابتك الشاملة للأكاديمية والمقررات والمجتمع التعليمي.'
              : 'Access your academy, courses, progress and community.'}
          </p>
        </div>

        {/* 4 Mini Glass Pills */}
        <div className="relative z-10 grid grid-cols-4 gap-1.5">
          {cards.map((c) => (
            <div 
              key={c.id} 
              className="flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-xs text-[10px] text-slate-200 font-medium truncate"
            >
              <c.icon className="w-3 h-3 text-indigo-400 shrink-0" />
              <span className="truncate">{c.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Desktop Experience (50% Split Layout)
  return (
    <div className="relative w-full h-full min-h-screen bg-[#070A14] flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 overflow-hidden select-none">
      {/* 1. Subtle Technical Grid Background with Radial Fade */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at 50% 40%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black 20%, transparent 80%)'
        }}
      />

      {/* 2. Atmospheric Ambient Light Fields */}
      <div className="absolute -top-32 -left-20 w-[420px] h-[420px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-24 left-1/3 w-[380px] h-[380px] bg-cyan-600/10 rounded-full blur-[110px] pointer-events-none" />

      {/* 3. Top Branding Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PlatformLogo 
            variant="icon"
            showText={true}
            textClassName="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent"
            imageClassName="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          />
        </div>

        {/* Elite Platform Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-inner text-xs font-medium text-slate-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[11px] text-slate-300 tracking-wide">Nexyvora Academy Portal</span>
        </div>
      </div>

      {/* 4. Center 3D Connected Learning Ecosystem Visual */}
      <div className="relative z-10 my-auto py-3 flex flex-col items-center">
        {/* Animated Connected Network SVG & 3D Elements */}
        <div className="relative w-full max-w-[440px] h-[250px] flex items-center justify-center">
          {/* Circular Orbital Wave Rings */}
          <div className="absolute w-[270px] h-[270px] rounded-full border border-indigo-500/15 animate-orbit-slow" />
          <div className="absolute w-[210px] h-[210px] rounded-full border border-purple-500/20 border-dashed animate-orbit-slow" style={{ animationDirection: 'reverse', animationDuration: '45s' }} />
          <div className="absolute w-[150px] h-[150px] rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-xl pointer-events-none" />

          {/* SVG Laser Constellation Network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 460 280" fill="none">
            <defs>
              <linearGradient id="laserGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="laserGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="laserGrad3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Network Connector Lines from Center (230, 140) */}
            {/* To Top-Left (80, 50) */}
            <path d="M 230 140 Q 150 70 80 50" stroke="url(#laserGrad1)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 230 140 Q 150 70 80 50" stroke="#818CF8" strokeWidth="2" fill="none" className="animate-laser-flow" filter="url(#glowFilter)" />

            {/* To Top-Right (380, 55) */}
            <path d="M 230 140 Q 310 80 380 55" stroke="url(#laserGrad2)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 230 140 Q 310 80 380 55" stroke="#38BDF8" strokeWidth="2" fill="none" className="animate-laser-flow" filter="url(#glowFilter)" />

            {/* To Bottom-Left (90, 225) */}
            <path d="M 230 140 Q 150 200 90 225" stroke="url(#laserGrad3)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 230 140 Q 150 200 90 225" stroke="#34D399" strokeWidth="2" fill="none" className="animate-laser-flow" filter="url(#glowFilter)" />

            {/* To Bottom-Right (370, 220) */}
            <path d="M 230 140 Q 310 195 370 220" stroke="url(#laserGrad1)" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
            <path d="M 230 140 Q 310 195 370 220" stroke="#C084FC" strokeWidth="2" fill="none" className="animate-laser-flow" filter="url(#glowFilter)" />

            {/* Cross mesh connecting peripheral hubs */}
            <path d="M 80 50 Q 230 20 380 55" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" fill="none" />
            <path d="M 90 225 Q 230 255 370 220" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" fill="none" />
            <path d="M 80 50 Q 50 140 90 225" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" fill="none" />
            <path d="M 380 55 Q 410 140 370 220" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" fill="none" />
          </svg>

          {/* Central Nexyvora Core Node */}
          <div className="relative z-20 flex flex-col items-center">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-900/90 via-slate-900 to-purple-950/90 border border-indigo-400/40 shadow-[0_0_40px_rgba(99,102,241,0.35)] backdrop-blur-xl group cursor-default">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-50 blur-sm group-hover:opacity-80 transition-opacity" />
              <Sparkles className="w-9 h-9 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
              {/* Micro Corner Tech Accents */}
              <span className="absolute top-1.5 left-1.5 w-1 h-1 rounded-full bg-indigo-400" />
              <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-purple-400" />
              <span className="absolute bottom-1.5 left-1.5 w-1 h-1 rounded-full bg-cyan-400" />
              <span className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full bg-pink-400" />
            </div>
            <div className="mt-2.5 px-3 py-0.5 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md text-[10px] font-mono tracking-wider text-indigo-200 uppercase font-semibold">
              Ecosystem Core
            </div>
          </div>

          {/* Floating Isometric Peripheral Node 1 (Top-Left: Degrees) */}
          <div className="absolute top-3 left-8 z-20 animate-float-slow">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 border border-violet-500/30 backdrop-blur-md shadow-lg shadow-violet-500/10 hover:border-violet-400/60 transition-all">
              <div className="w-7 h-7 rounded-xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-violet-300">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-[11px] font-bold text-white leading-tight">Diplomas</p>
                <p className="text-[9px] text-violet-300/80">Accredited</p>
              </div>
            </div>
          </div>

          {/* Floating Isometric Peripheral Node 2 (Top-Right: Interactive Modules) */}
          <div className="absolute top-4 right-8 z-20 animate-float-reverse">
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 border border-sky-500/30 backdrop-blur-md shadow-lg shadow-sky-500/10 hover:border-sky-400/60 transition-all">
              <div className="w-7 h-7 rounded-xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center text-sky-300">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-[11px] font-bold text-white leading-tight">Mastery</p>
                <p className="text-[9px] text-sky-300/80">Live Video</p>
              </div>
            </div>
          </div>

          {/* Floating Isometric Peripheral Node 3 (Bottom-Left: Adaptive Analytics) */}
          <div className="absolute bottom-5 left-10 z-20 animate-float-reverse" style={{ animationDelay: '1.5s' }}>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-500/10 hover:border-emerald-400/60 transition-all">
              <div className="w-7 h-7 rounded-xl bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-[11px] font-bold text-white leading-tight">Growth</p>
                <p className="text-[9px] text-emerald-300/80">Real-time KPI</p>
              </div>
            </div>
          </div>

          {/* Floating Isometric Peripheral Node 4 (Bottom-Right: Cohort Community) */}
          <div className="absolute bottom-4 right-10 z-20 animate-float-slow" style={{ animationDelay: '2s' }}>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md shadow-lg shadow-purple-500/10 hover:border-purple-400/60 transition-all">
              <div className="w-7 h-7 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left rtl:text-right">
                <p className="text-[11px] font-bold text-white leading-tight">Cohorts</p>
                <p className="text-[9px] text-purple-300/80">10k+ Members</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Headlines */}
        <div className="max-w-lg text-center mt-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {isRtl ? (
              <>
                رحلتك التعليمية{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  تبدأ من هنا.
                </span>
              </>
            ) : i18n.language === 'fr' ? (
              <>
                Votre parcours d'apprentissage{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  commence ici.
                </span>
              </>
            ) : (
              <>
                Your Learning Journey{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Starts Here.
                </span>
              </>
            )}
          </h1>
          <p className="text-sm lg:text-base text-slate-300/85 mt-3 leading-relaxed">
            {isRtl 
              ? 'بوابتك الشاملة للوصول إلى الأكاديمية، المقررات، متابعة تقدمك والمجتمع التعليمي المتكامل من منصة واحدة ذكية.'
              : i18n.language === 'fr'
              ? 'Accédez à votre académie, vos cours, vos progrès et votre communauté éducative depuis une seule plateforme intelligente.'
              : 'Access your academy, courses, progress and educational community from one powerful platform.'}
          </p>
        </div>

        {/* 5. Four Premium Glass Cards */}
        <div className="grid grid-cols-2 gap-3.5 w-full max-w-lg mt-8">
          {cards.map((c) => (
            <div
              key={c.id}
              className={`group relative p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] ${c.borderHover} backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow} overflow-hidden`}
            >
              {/* Subtle card ambient gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <div className="relative z-10 flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-300`}>
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1 text-left rtl:text-right">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="text-sm font-bold text-white truncate">{c.title}</h3>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-white transition-colors">{c.stat}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Footer Trust Indicator */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400/80 border-t border-white/[0.06] pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Enterprise-Grade Security & Encryption</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          © {new Date().getFullYear()} Nexyvora Academy
        </div>
      </div>
    </div>
  );
}
