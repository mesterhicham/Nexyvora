import React from 'react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles,
  Layers,
  WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function InstallModal() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { isModalOpen, setIsModalOpen, deviceType, isInstalled, promptInstall, markAsInstalled, deferredPrompt } = usePWAInstall();

  const isIOSDevice = deviceType === 'mobile-ios' || deviceType === 'tablet-ios';
  const isTabletDevice = deviceType === 'tablet' || deviceType === 'tablet-ios';
  const isMobileDevice = deviceType === 'mobile-android' || deviceType === 'mobile-ios';
  const isDesktopDevice = deviceType === 'desktop';

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogContent className={`sm:max-w-md rounded-3xl p-6 border-slate-100 dark:border-slate-800 ${isRtl ? 'text-right rtl' : 'text-left ltr'}`}>
        <DialogHeader className={`text-center ${isRtl ? 'sm:text-right' : 'sm:text-left'} space-y-3`}>
          <div className={`mx-auto ${isRtl ? 'sm:mx-0' : 'sm:mx-0'} w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25`}>
            <img src="/icons/icon-192x192.png" alt="Nexyvora" className="w-12 h-12 rounded-xl object-contain" />
          </div>

          <DialogTitle className={`text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center ${isRtl ? 'sm:justify-start' : 'sm:justify-start'} gap-2`}>
            <span>{isRtl ? 'تثبيت تطبيق Nexyvora' : 'Install Nexyvora App'}</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </DialogTitle>

          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            {isRtl 
              ? 'احصل على تجربة سريعة ومتكاملة كتطبيق مستقل على جهازك مباشرة' 
              : 'Enjoy a fast, seamless standalone app experience directly on your device'}
          </DialogDescription>
        </DialogHeader>

        {/* Benefits Cards */}
        <div className="grid grid-cols-3 gap-2 my-2 py-2">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
            <Sparkles className="w-5 h-5 mx-auto text-purple-600 mb-1" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isRtl ? 'سرعة فائقة' : 'Ultra Fast'}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
            <Layers className="w-5 h-5 mx-auto text-violet-600 mb-1" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isRtl ? 'نافذة مخصصة' : 'Standalone'}
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
            <WifiOff className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {isRtl ? 'دعم الأوفلاين' : 'Offline Mode'}
            </p>
          </div>
        </div>

        {/* Device-Specific Instructions */}
        <div className={`bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-4 my-2 ${isRtl ? 'text-right' : 'text-left'}`}>
          {/* iOS (iPhone / iPad) */}
          {isIOSDevice && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                {isTabletDevice ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span>
                  {isRtl 
                    ? `خطوات التثبيت على ${isTabletDevice ? 'الآيباد (iPad)' : 'الآيفون (iPhone)'}:` 
                    : `How to install on ${isTabletDevice ? 'iPad' : 'iPhone'}:`}
                </span>
              </div>
              <ol className="text-xs space-y-2 text-slate-600 dark:text-slate-300 list-decimal list-inside pr-1">
                <li className="flex items-center gap-2">
                  <span>{isRtl ? '1. اضغط على زر المشاركة' : '1. Tap the Share button'}</span>
                  <span className="inline-flex p-1 bg-white dark:bg-slate-800 rounded shadow-xs border text-slate-700 dark:text-slate-200"><Share className="w-3.5 h-3.5 text-blue-500" /></span>
                  <span>{isRtl ? 'في متصفح Safari.' : 'in Safari.'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>{isRtl ? '2. مرر للأسفل واضغط على' : '2. Scroll down and tap'}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border">
                    <PlusSquare className="w-3 h-3 text-purple-600" />
                    <span>{isRtl ? 'إضافة إلى الصفحة الرئيسية' : 'Add to Home Screen'}</span>
                  </span>
                </li>
                <li>
                  <span>{isRtl ? '3. اضغط على «إضافة» (Add) في أعلى الزاوية.' : '3. Tap "Add" in the top right corner.'}</span>
                </li>
              </ol>
            </div>
          )}

          {/* Android Tablet & Mobile */}
          {!isIOSDevice && (isMobileDevice || isTabletDevice) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                {isTabletDevice ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span>
                  {isRtl 
                    ? `التثبيت على ${isTabletDevice ? 'اللوحة الإلكترونية (Tablet)' : 'الهاتف (Android)'}:` 
                    : `Installation on ${isTabletDevice ? 'Tablet' : 'Android Phone'}:`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRtl 
                  ? 'اضغط على زر «تثبيت التطبيق الآن» بالأسفل. إذا لم تظهر النافذة التلقائية، يمكنك الضغط على قائمة المتصفح (⋮) في الأعلى ثم اختيار «تثبيت التطبيق» (Install app).'
                  : 'Tap "Install App Now" below. If the prompt does not appear, tap your browser menu (⋮) at top and choose "Install app".'}
              </p>
            </div>
          )}

          {/* Desktop (Windows / Mac / Linux) */}
          {isDesktopDevice && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold text-sm">
                <Monitor className="w-4 h-4" />
                <span>{isRtl ? 'التثبيت على الكمبيوتر (Windows / Mac):' : 'Installation on Computer (Windows / Mac):'}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {isRtl 
                  ? 'يمكنك التثبيت بنقرة واحدة عبر الزر أدناه، أو عبر النقر على أيقونة التثبيت «Install App ⊞» الموجودة في شريط عنوان المتصفح (Edge / Chrome) بالأعلى بجانب رمز المفضلة.'
                  : 'Install with one click using the button below, or click the "Install App ⊞" icon in the address bar of your browser (Edge / Chrome) next to bookmarks.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 mt-4">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {!isIOSDevice && (
              <Button
                onClick={() => {
                  promptInstall();
                }}
                className="w-full sm:flex-1 h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-md shadow-purple-500/25"
              >
                <Download className="w-4 h-4 ml-2 rtl:ml-2 ltr:mr-2" />
                <span>{isRtl ? 'تثبيت التطبيق الآن' : 'Install App Now'}</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto h-11 rounded-2xl border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            >
              {isIOSDevice ? (isRtl ? 'حسناً، فهمت' : 'Got it') : (isRtl ? 'لاحقاً' : 'Later')}
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={() => {
              markAsInstalled();
            }}
            className="w-full text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-xl h-8"
          >
            <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 rtl:ml-1.5 ltr:mr-1.5" />
            <span>{isRtl ? 'قمت بتنزيل / تثبيت التطبيق بالفعل (إخفاء الزر)' : 'I already installed the app (Hide button)'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
