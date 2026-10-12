import { Bell, Menu, User, LogOut, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { PlatformLogo } from '@/components/PlatformLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  role: UserRole;
  onMenuClick: () => void;
}

export function TopBar({ role, onMenuClick }: TopBarProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Display name
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Member';
  const roleLabel = role === 'admin' 
    ? t('roles.adminPanel') 
    : role === 'teacher' 
    ? t('roles.teacherPortal') 
    : t('roles.studentPortal');

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-16 sm:h-20 px-3.5 sm:px-6 lg:px-8">
        {/* MOBILE VIEW (< md) */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Menu Button + Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/70 dark:border-slate-800 active:scale-95 flex items-center justify-center"
              title={t('common.menu', 'القائمة')}
              aria-label={t('common.menu', 'القائمة')}
            >
              <Menu className="h-5 w-5 stroke-[2.2]" />
            </button>
            <PlatformLogo 
              variant="icon"
              showText={true} 
              imageClassName="h-7 w-7 object-contain"
              textClassName="text-sm font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent truncate"
            />
          </div>

          {/* Controls on Right: Globe (Language), Bell with 9+ badge, LogOut (Red) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Language Switcher */}
            <LanguageSwitcher variant="icon" className="h-9 w-9 p-0 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800" />

            {/* Notification Bell with 9+ Badge */}
            <button
              onClick={() => navigate(role === 'student' ? '/student' : `/${role}`)}
              className="relative p-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('nav.notifications', 'Notifications')}
            >
              <Bell className="h-5 w-5 stroke-[2.2]" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs">
                9+
              </span>
            </button>

            {/* Sign Out (Red/Coral exit button) */}
            <button
              onClick={handleSignOut}
              className="p-2 rounded-2xl text-[#ef4444] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title={t('common.signOut', 'Sign Out')}
            >
              <LogOut className="h-5 w-5 rtl:rotate-180 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* DESKTOP VIEW (>= md) - Standard admin / portal layout */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Left side: Greeting + Sidebar Toggle */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 shrink-0">
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-1.5 truncate">
                <span className="truncate">{t('admin.welcomePrefix', 'Welcome')}, {displayName}</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate hidden sm:block">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Right side: Install App + Notifications + Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Language Switcher */}
            <LanguageSwitcher variant="default" />

            {/* Install App Button */}
            {!isInstalled && (
              <button
                onClick={promptInstall}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-2xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold shadow-sm shadow-purple-500/20 transition-all active:scale-95"
                title={t('common.installApp', 'Install App on Device')}
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden md:inline">{t('common.installApp', 'Install App')}</span>
              </button>
            )}

            {/* Notification Button */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-2xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 shrink-0">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </Button>

            {/* User Profile Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-purple-500/20">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100 dark:border-slate-800">
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 font-normal truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => navigate(`/${role}/profile`)}
                  className="rounded-xl px-3 py-2 text-sm cursor-pointer"
                >
                  <User className="h-4 w-4 mr-2 rtl:ml-2" />
                  <span>{t('nav.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="rounded-xl px-3 py-2 text-sm text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/40 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2 rtl:ml-2" />
                  <span>{t('common.signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
