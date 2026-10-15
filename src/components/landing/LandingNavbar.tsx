import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, ChevronDown, Check } from 'lucide-react';
import { PlatformLogo } from '@/components/PlatformLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'fr', name: 'Français', short: 'Fr', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', short: 'عربي', flag: '🇲🇦' },
  { code: 'en', name: 'English', short: 'En', flag: '🇬🇧' },
];

export function LandingNavbar() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section tracking for nav underline
      const sections = ['home', 'programmes', 'apropos', 'temoignages', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  const navLinks = [
    { id: 'home', label: t('landing.nav.home') || (tr("الرئيسية", "Accueil")), href: '#home' },
    { id: 'programmes', label: t('landing.nav.programs') || (tr("البرامج", "Programmes")), href: '#programmes' },
    { id: 'formations', label: t('landing.nav.formations') || (tr("التكوينات", "Formations")), href: '#programmes' },
    { id: 'apropos', label: t('landing.nav.about') || (tr("من نحن", "À propos")), href: '#apropos' },
    { id: 'temoignages', label: t('landing.nav.testimonials') || (tr("آراء الأعضاء", "Témoignages")), href: '#temoignages' },
    { id: 'contact', label: t('landing.nav.contact') || (tr("اتصل بنا", "Contact")), href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-sm shadow-slate-200/50 dark:shadow-black/50 border-b border-slate-100 dark:border-slate-800 py-3.5'
          : 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-slate-100/60 dark:border-slate-900 py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center group">
            <PlatformLogo 
              useFullLogo={true} 
              variant="full" 
              imageClassName="h-9 sm:h-10 w-auto" 
              showText={false}
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-7 xl:gap-9">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`relative text-sm font-medium transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 py-1 ${
                    isActive 
                      ? 'text-slate-900 dark:text-white font-semibold' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-1.5 inset-x-0 h-0.5 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-in fade-in zoom-in-50 duration-200" />
                  )}
                </a>
              );
            })}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Language Dropdown (Minimal clean like mockup: 🌐 Fr ∨) */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-none cursor-pointer">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>{currentLang.short}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-2xl p-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="flex items-center justify-between text-xs py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{lang.name}</span>
                    </span>
                    {i18n.language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Se connecter (Sign In Pill Outline) */}
            <Link
              to="/auth"
              className="inline-flex items-center justify-center text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all duration-200"
            >
              {t('landing.nav.signIn') || (tr("تسجيل الدخول", "Se connecter"))}
            </Link>

            {/* S'inscrire (Sign Up Pill Solid Purple) */}
            <Link
              to="/auth"
              className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              {t('landing.nav.signUp') || (tr("إنشاء حساب", "S'inscrire"))}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 text-slate-600 rounded-full hover:bg-slate-100 focus:outline-none">
                <Globe className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 rounded-xl">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className="text-xs py-2"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-indigo-600 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/98 dark:bg-slate-950/98 border-b border-slate-200 dark:border-slate-800 px-5 py-6 space-y-4 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 py-1.5"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {t('landing.nav.signIn') || (tr("تسجيل الدخول", "Se connecter"))}
            </Link>
            <Link
              to="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-md shadow-indigo-600/30"
            >
              {t('landing.nav.signUp') || (tr("إنشاء حساب", "S'inscrire"))}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
