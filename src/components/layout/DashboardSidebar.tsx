import { useState, useMemo } from 'react';
import { tr } from '@/utils/tr';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Award, 
  ClipboardList, 
  Bell, 
  CheckSquare, 
  Download, 
  X, 
  Settings, 
  Newspaper, 
  Mail, 
  Video, 
  CreditCard, 
  MessageCircle,
  LogOut,
  Package,
  Wallet,
  Trophy,
  Sparkles,
  User,
  ArrowDownToLine,
  ArrowUpRight,
  Sliders,
  ShieldCheck,
  Network,
  ArrowLeftRight,
  Flame,
  MessageSquare,
  Coins,
  Crown,
  Globe,
  LifeBuoy,
  Gift
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onToggle: () => void;
}

interface NavLinkItem {
  to: string;
  icon: any;
  label: string;
  category?: string;
  badge?: string | number;
}

export function DashboardSidebar({ role, isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { signOut } = useAuth();
  const { isInstalled, promptInstall } = usePWAInstall();
  const unreadCount = useTotalUnreadCount();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  
  const adminLinks: NavLinkItem[] = [
    // 1. Core
    { to: '/admin', icon: LayoutDashboard, label: t('nav.dashboard', 'Dashboard'), category: tr("الرئيسية", "Main") },
    
    // 2. Academy & Growth
    { to: '/admin/academy', icon: GraduationCap, label: t('nav.academy', 'Academy & Content'), category: tr("الأكاديمية والمسابقات", "Academy & Growth") },
    { to: '/admin/packages', icon: Package, label: t('nav.packages', 'Packages & Subscriptions'), category: tr("الأكاديمية والمسابقات", "Academy & Growth") },
    { to: '/admin/promised-packages', icon: Gift, label: t('nav.promisedPackages', tr("باقات الدعم (Promised)", "Promised Packages")), category: tr("الأكاديمية والمسابقات", "Academy & Growth") },
    { to: '/admin/challenges', icon: Flame, label: t('nav.challenges', 'Challenges & Contests'), category: tr("الأكاديمية والمسابقات", "Academy & Growth") },
    
    // 3. Members & Network
    { to: '/admin/users', icon: Users, label: t('nav.users', 'User Management'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/teachers', icon: GraduationCap, label: t('nav.teachers', tr("إدارة الأساتذة", "Teacher Management")), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/student/community', icon: MessageSquare, label: t('nav.community', 'Nexyvora Community'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/team-tree', icon: Network, label: t('nav.teamTree', 'Team Network Tree'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/kyc', icon: ShieldCheck, label: t('nav.kycApproval', 'KYC Approvals'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/ranks', icon: Award, label: t('nav.leaderRanks', 'Leader Ranks & Badges'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/leader-achievers', icon: Trophy, label: t('nav.leaderAchievers', 'Leader Achievers'), category: tr("المستخدمين والشبكة", "Members & Network") },
    { to: '/admin/support', icon: LifeBuoy, label: t('nav.support', 'Support Tickets'), category: tr("المستخدمين والشبكة", "Members & Network") },
    
    // 4. Financials
    { to: '/admin/wallets', icon: Wallet, label: t('nav.walletManagement', 'Wallets & Balances'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/bonus-pools', icon: Coins, label: t('nav.bonusPool', 'Bonus Pools'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/founders', icon: Crown, label: t('nav.founders', 'Founders Management'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/deposits', icon: ArrowUpRight, label: t('nav.deposits', 'Deposit Requests'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/withdrawals', icon: ArrowDownToLine, label: t('nav.withdrawals', 'Withdrawal Requests'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/payment-settings', icon: CreditCard, label: t('nav.paymentSettings', 'Payment & Payout Methods'), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/currency-settings', icon: Globe, label: t('nav.currencySettings', tr("إعدادات العملات والدفع", "Currency & Payment Settings")), category: tr("المالية والعمليات", "Financials") },
    { to: '/admin/transactions', icon: ArrowLeftRight, label: t('nav.transactions', 'Transactions Log'), category: tr("المالية والعمليات", "Financials") },
    
    // 5. System & Settings
    { to: '/admin/generation-settings', icon: Sliders, label: t('nav.generationSettings', 'Generations & Commissions'), category: tr("النظام والإعدادات", "System & Settings") },
    { to: '/admin/news', icon: Newspaper, label: t('nav.newsCenter', 'News Center'), category: tr("النظام والإعدادات", "System & Settings") },
    { to: '/admin/email-settings', icon: Mail, label: t('nav.emailSettings', 'Email Settings'), category: tr("النظام والإعدادات", "System & Settings") },
    { to: '/admin/policies', icon: ShieldCheck, label: t('nav.policies', tr("الدعم والسياسات", "Support & Politiques")), category: tr("النظام والإعدادات", "System & Settings") },
    { to: '/admin/settings', icon: Settings, label: t('nav.settings', 'Platform Settings'), category: tr("النظام والإعدادات", "System & Settings") },
  ];

  const teacherLinks: NavLinkItem[] = [
    { to: '/teacher', icon: LayoutDashboard, label: t('nav.dashboard', 'Dashboard') },
    { to: '/teacher/modules', icon: BookOpen, label: t('teacher.myModules', 'My Modules') },
    { to: '/teacher/formations', icon: BookOpen, label: t('nav.academy', 'Academy Formations') },
    { to: '/teacher/formation-progress', icon: BarChart3, label: t('reports.studentProgress', 'Student Progress') },
    { to: '/teacher/lessons', icon: FileText, label: t('nav.lessons', 'Lessons') },
    { to: '/teacher/assignments', icon: ClipboardList, label: t('nav.assignments', 'Assignments') },
    { to: '/teacher/attendance', icon: CheckSquare, label: t('nav.attendance', 'Attendance') },
    { to: '/teacher/announcements', icon: Bell, label: t('nav.announcements', 'Announcements') },
    { to: '/teacher/meetings', icon: Video, label: t('student.liveSessions', 'Live Meetings') },
    { to: '/teacher/chat', icon: MessageCircle, label: t('nav.chat', 'Chat') },
    { to: '/student/support', icon: LifeBuoy, label: t('nav.support', 'Support Center') },
  ];

  const studentLinks: NavLinkItem[] = [
    { to: '/student', icon: LayoutDashboard, label: t('nav.dashboard', 'Dashboard') },
    { to: '/student/academy', icon: GraduationCap, label: t('nav.academy', 'Academy') },
    { to: '/student/community', icon: MessageSquare, label: t('nav.community', 'Nexyvora Community') },
    { to: '/student/news', icon: Newspaper, label: t('nav.newsCenter', 'News Center') },
    { to: '/student/packages', icon: Package, label: t('nav.packages', 'Packages') },
    { to: '/student/my-package', icon: Sparkles, label: t('nav.myPackage', 'My Package') },
    { to: '/student/wallet', icon: Wallet, label: t('nav.wallet', 'Wallet') },
    { to: '/student/bonus-pool', icon: Coins, label: t('nav.bonusPool', 'Bonus Pool') },
    { to: '/student/founder', icon: Crown, label: t('nav.founderClub', 'Founder Club') },
    { to: '/student/team', icon: Users, label: t('nav.team', 'My Team') },
    { to: '/student/team-tree', icon: Network, label: t('nav.teamTree', 'Team Tree') },
    { to: '/student/challenges', icon: Trophy, label: t('nav.challenges', 'Challenges') },
    { to: '/student/ranks', icon: Award, label: t('nav.ranks', 'Ranks') },
    { to: '/student/chat', icon: MessageCircle, label: t('nav.chat', 'Chat') },
    { to: '/student/support', icon: LifeBuoy, label: t('nav.support', 'Support Center') },
    { to: '/student/profile', icon: User, label: t('nav.profile', 'Profile') },
  ];

  const rawLinks = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;
  const filteredLinks = rawLinks;

  // Group by category if admin
  const groupedLinks = useMemo(() => {
    if (role !== 'admin') return null;
    const groups: { [cat: string]: NavLinkItem[] } = {};
    adminLinks.forEach(item => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [role, adminLinks]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300" 
          onClick={onToggle}
          aria-label="Close menu"
        />
      )}
      
      {/* Responsive Drawer / Sidebar */}
      <aside className={cn(
        "fixed top-0 bottom-0 z-50 h-full w-[290px] sm:w-[320px] lg:w-64 max-w-[85vw] lg:max-w-none bg-white dark:bg-slate-900 border-r rtl:border-l border-slate-100 dark:border-slate-800 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-[0_4px_24px_rgba(0,0,0,0.03)]",
        "left-0 rtl:left-auto rtl:right-0",
        isOpen ? "translate-x-0" : (isRtl ? "max-lg:translate-x-full" : "max-lg:-translate-x-full"),
        "lg:translate-x-0 lg:transform-none"
      )}>
        <div className="flex flex-col h-full">
          {/* Header with Logo + Theme/Lang quick controls */}
          <div className="flex items-center justify-between px-4 py-4 sm:px-5 sm:py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex-1 min-w-0">
              <PlatformLogo 
                variant="icon"
                showText={true}
                textClassName="text-base font-bold tracking-tight text-slate-900 dark:text-white truncate" 
                imageClassName="h-7 w-7 object-contain" 
              />
            </div>

            {/* Quick Actions (Theme + Lang + Close on mobile) */}
            <div className="flex items-center gap-1 shrink-0">
              <ThemeToggle className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />
              <LanguageSwitcher variant="icon" className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onToggle} 
                className="lg:hidden h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Items (Scrollable) */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-3 scrollbar-thin">
            {groupedLinks ? (
              // Grouped by Category for Admin
              Object.entries(groupedLinks).map(([catTitle, items]) => (
                <div key={catTitle} className="space-y-1">
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {catTitle}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {items.map((link) => {
                      const isActive = location.pathname === link.to;
                      const isChatLink = link.to.endsWith('/chat');
                      return (
                        <li key={link.to}>
                          <Link
                            to={link.to}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                              isActive 
                                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-md shadow-purple-500/25" 
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                            )}
                            onClick={() => window.innerWidth < 1024 && onToggle()}
                          >
                            <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                            <span className="flex-1 truncate">{link.label}</span>
                            {isChatLink && unreadCount > 0 && (
                              <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center text-xs">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Badge>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            ) : (
              // Flat or Filtered List
              <ul className="space-y-1">
                {filteredLinks.length === 0 ? (
                  <li className="px-3 py-6 text-center text-xs text-slate-400">
                    {tr("لا توجد صفحات مطابقة", "No matching pages")}
                  </li>
                ) : (
                  filteredLinks.map((link) => {
                    const isActive = location.pathname === link.to;
                    const isChatLink = link.to.endsWith('/chat');
                    return (
                      <li key={link.to}>
                        <Link
                          to={link.to}
                          className={cn(
                            "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-medium transition-all duration-200",
                            isActive 
                              ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-md shadow-purple-500/25" 
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          )}
                          onClick={() => window.innerWidth < 1024 && onToggle()}
                        >
                          <link.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 dark:text-slate-500")} />
                          <span className="flex-1 truncate">{link.label}</span>
                          {isChatLink && unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-auto h-5 min-w-5 justify-center text-xs">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          )}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            )}
          </nav>

          {/* Bottom Area: Install App, Sign Out */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
            {!isInstalled && (
              <button
                type="button"
                onClick={() => {
                  promptInstall();
                  if (window.innerWidth < 1024) onToggle();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-xs font-semibold shadow-sm shadow-purple-500/20 transition-all duration-200 active:scale-95"
              >
                <Download className="h-4 w-4" />
                <span>{t('common.installApp', 'Install App')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-all duration-200 active:scale-95"
            >
              <LogOut className="h-4 w-4 rtl:rotate-180" />
              <span>{t('common.signOut', 'Log Out')}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
