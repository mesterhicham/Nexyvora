import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  GraduationCap, 
  Package, 
  Home, 
  Users, 
  Wallet, 
  MessageCircle,
  Menu,
  ArrowUpRight,
  LayoutDashboard,
  BookOpen,
  Video
} from 'lucide-react';
import { UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  role: UserRole;
  onMenuClick?: () => void;
}

export function MobileBottomNav({ role, onMenuClick }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname;

  // Paths based on role
  const homePath = `/${role}`;
  const isHomeActive = currentPath === homePath || (role === 'admin' && currentPath === '/admin');
  const chatPath = `/${role}/chat`;

  return (
    <>
      {/* Floating Support/Chat Button for Student & Teacher */}
      {role !== 'admin' && (
        <button
          onClick={() => navigate(chatPath)}
          className="fixed bottom-20 right-4 z-40 w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-lg shadow-amber-500/40 flex items-center justify-center active:scale-95 transition-all md:hidden group"
          aria-label={t('nav.chat', 'Support')}
        >
          <MessageCircle className="h-6 w-6 fill-current transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-2 sm:px-3 pt-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
      >
        {role === 'admin' ? (
          /* ADMIN BOTTOM BAR: 4 Core Modules + 1 Full Menu Button */
          <div className="flex items-center justify-around relative max-w-md mx-auto">
            {/* 1. Dashboard Home */}
            <button
              onClick={() => navigate('/admin')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                isHomeActive 
                  ? "text-primary font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <LayoutDashboard className={cn("h-5 w-5 mb-0.5", isHomeActive && "stroke-[2.5]")} />
              <span className="text-[10px] tracking-tight">{t('nav.dashboard', 'Dashboard')}</span>
            </button>

            {/* 2. Users */}
            <button
              onClick={() => navigate('/admin/users')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                currentPath.includes('/admin/users') 
                  ? "text-primary font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <Users className={cn("h-5 w-5 mb-0.5", currentPath.includes('/admin/users') && "stroke-[2.5]")} />
              <span className="text-[10px] tracking-tight">{t('nav.users', 'Members')}</span>
            </button>

            {/* 3. Center Elevated Floating Wallets / Financials Button */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-6">
              <button
                onClick={() => navigate('/admin/wallets')}
                className={cn(
                  "w-13 h-13 rounded-full bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/40 border-4 border-white dark:border-slate-900 flex items-center justify-center active:scale-95 transition-transform",
                  currentPath.includes('/admin/wallets') && "ring-2 ring-purple-500/50"
                )}
                aria-label={t('nav.walletManagement', 'Wallets')}
              >
                <Wallet className="h-6 w-6 stroke-[2.2]" />
              </button>
              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {t('nav.walletManagement', 'Wallets')}
              </span>
            </div>

            {/* 4. Deposits / Finance */}
            <button
              onClick={() => navigate('/admin/deposits')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                currentPath.includes('/admin/deposits') || currentPath.includes('/admin/withdrawals')
                  ? "text-primary font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <ArrowUpRight className={cn("h-5 w-5 mb-0.5", (currentPath.includes('/admin/deposits') || currentPath.includes('/admin/withdrawals')) && "stroke-[2.5]")} />
              <span className="text-[10px] tracking-tight">{t('nav.deposits', 'Deposits')}</span>
            </button>

            {/* 5. All 18 Pages Full Menu Toggle */}
            <button
              onClick={onMenuClick}
              className="flex flex-col items-center justify-center flex-1 py-1 px-0.5 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              <div className="relative">
                <Menu className="h-5 w-5 mb-0.5 stroke-[2.2]" />
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[8px] font-black rounded-full leading-tight">
                  18
                </span>
              </div>
              <span className="text-[10px] font-bold tracking-tight text-purple-600 dark:text-purple-400">
                {t('common.menu', 'Menu')}
              </span>
            </button>
          </div>
        ) : (
          /* STUDENT / TEACHER BOTTOM BAR */
          <div className="flex items-center justify-around relative max-w-md mx-auto">
            {/* 1. Academy / Modules */}
            <button
              onClick={() => navigate(role === 'student' ? '/student/academy' : '/teacher/modules')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                (currentPath.includes('/academy') || currentPath.includes('/modules'))
                  ? "text-blue-600 dark:text-blue-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <GraduationCap className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{t('nav.academy', 'Academy')}</span>
            </button>

            {/* 2. Packages / Formations */}
            <button
              onClick={() => navigate(role === 'student' ? '/student/packages' : '/teacher/formations')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                (currentPath.includes('/packages') || currentPath.includes('/formations'))
                  ? "text-blue-600 dark:text-blue-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {role === 'student' ? <Package className="h-5 w-5 mb-0.5" /> : <BookOpen className="h-5 w-5 mb-0.5" />}
              <span className="text-[10px] tracking-tight">{role === 'student' ? t('nav.packages', 'Packages') : t('nav.academy', 'Formations')}</span>
            </button>

            {/* 3. Center Elevated Floating Home Button */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-6">
              <button
                onClick={() => navigate(homePath)}
                className={cn(
                  "w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/40 border-4 border-white dark:border-slate-900 flex items-center justify-center active:scale-95 transition-transform",
                  isHomeActive && "ring-2 ring-blue-500/50"
                )}
                aria-label={t('nav.home', 'Home')}
              >
                <Home className="h-6 w-6 stroke-[2.2]" />
              </button>
            </div>

            {/* 4. Team / Meetings */}
            <button
              onClick={() => navigate(role === 'student' ? '/student/team' : '/teacher/meetings')}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                (currentPath.includes('/team') || currentPath.includes('/meetings'))
                  ? "text-blue-600 dark:text-blue-400 font-bold" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {role === 'student' ? <Users className="h-5 w-5 mb-0.5" /> : <Video className="h-5 w-5 mb-0.5" />}
              <span className="text-[10px] tracking-tight">{role === 'student' ? t('nav.team', 'Team') : t('student.liveSessions', 'Meetings')}</span>
            </button>

            {/* 5. Menu Toggle or Wallet */}
            {onMenuClick ? (
              <button
                onClick={onMenuClick}
                className="flex flex-col items-center justify-center flex-1 py-1 px-0.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <Menu className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">{t('common.menu', 'Menu')}</span>
              </button>
            ) : (
              <button
                onClick={() => navigate(role === 'student' ? '/student/wallet' : '/teacher/attendance')}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 px-0.5 transition-colors",
                  currentPath.includes('/wallet') 
                    ? "text-blue-600 dark:text-blue-400 font-bold" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                <Wallet className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">{t('nav.wallet', 'Wallet')}</span>
              </button>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
