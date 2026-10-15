import { Link } from 'react-router-dom';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { PlatformLogo } from '@/components/PlatformLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇲🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export function LandingFooter() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = code;
  };

  return (
    <footer id="contact" className="bg-[#0A0F1D] text-slate-300 pt-16 pb-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block">
              <PlatformLogo
                useFullLogo={true}
                variant="full"
                imageClassName="h-9 w-auto brightness-0 invert"
                showText={false}
              />
            </Link>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              {t('landing.footer.slogan') || (tr("تعلّم • شارك • انجح", "Apprendre • Partager • Réussir"))}
            </p>
          </div>

          {/* Navigation Links (2.5 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {t('landing.footer.navTitle') || (tr("التنقل السريع", "Navigation"))}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#home" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.nav.home') || (tr("الرئيسية", "Accueil"))}
                </a>
              </li>
              <li>
                <a href="#programmes" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.nav.programs') || (tr("البرامج", "Programmes"))}
                </a>
              </li>
              <li>
                <a href="#programmes" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.nav.formations') || (tr("التكوينات", "Formations"))}
                </a>
              </li>
              <li>
                <a href="#apropos" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.nav.about') || (tr("من نحن", "À propos"))}
                </a>
              </li>
            </ul>
          </div>

          {/* Help & Support (2.5 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {t('landing.footer.helpTitle') || (tr("المساعدة والدعم", "Aide"))}
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <a href="#home" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.footer.faq') || 'FAQ'}
                </a>
              </li>
              <li>
                <a href="#contact" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.footer.contact') || (tr("اتصل بنا", "Contact"))}
                </a>
              </li>
              <li>
                <Link to="/policies/conditions-generales" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.footer.legal') || (tr("الشروط العامة", "Conditions Générales"))}
                </Link>
              </li>
              <li>
                <Link to="/policies/confidentialite" className="text-slate-400 hover:text-white transition-colors">
                  {t('landing.footer.privacy') || (tr("سياسة الخصوصية", "Politique de confidentialité"))}
                </Link>
              </li>
              <li>
                <Link to="/policies/anti-blanchiment" className="text-slate-400 hover:text-white transition-colors">
                  {tr("مكافحة غسيل الأموال (AML)", "Politique Anti-Blanchiment")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Icons (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-sm font-bold text-white tracking-wide">
              {t('landing.footer.socialTitle') || (tr("تابعنا على", "Suivez-nous"))}
            </h4>
            <div className="flex items-center gap-2.5">
              
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                f
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                ig
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                yt
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                in
              </a>

              {/* Telegram */}
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noreferrer"
                aria-label="Telegram"
                className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-sky-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-xs font-bold"
              >
                tg
              </a>

            </div>
          </div>

        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {t('landing.footer.copyright') || '© 2025 Nexyvora. Tous droits réservés.'}
          </p>

          {/* Language Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors focus:outline-none cursor-pointer">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentLang.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 rounded-2xl p-1 bg-slate-900 border-slate-800 text-white shadow-xl">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-xl cursor-pointer hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                  {i18n.language === lang.code && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>
    </footer>
  );
}
