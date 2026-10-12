import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export function MobileInstallBanner() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { isInstalled, promptInstall, isInstallable } = usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(true);

  useEffect(() => {
    // Check if dismissed recently (within 24h)
    const lastDismissed = localStorage.getItem('pwa_banner_dismissed');
    if (lastDismissed) {
      const diff = Date.now() - parseInt(lastDismissed, 10);
      if (diff < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }
    if (!isInstalled && isInstallable) {
      // Small delay before showing so it feels smooth
      const timer = setTimeout(() => setDismissed(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isInstallable]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
  };

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-3xl shadow-2xl border border-purple-100 dark:border-purple-900/50 flex items-center justify-between gap-3 ${isRtl ? 'rtl' : 'ltr'}`}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
            <img src="/icons/icon-192x192.png" alt="App" className="w-8 h-8 rounded-xl object-contain" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <span>Nextvora App</span>
              <Sparkles className="w-3 h-3 text-purple-500" />
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isRtl ? 'ثبّت التطبيق على جهازك لتصفح أسرع' : 'Install the app on your device for faster browsing'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={promptInstall}
            className="h-8 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5 ml-1 rtl:ml-1 ltr:mr-1" />
            <span>{isRtl ? 'تثبيت' : 'Install'}</span>
          </Button>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isRtl ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
