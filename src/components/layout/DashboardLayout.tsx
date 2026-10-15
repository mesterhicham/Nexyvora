import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav } from './MobileBottomNav';
import { UserRole } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: UserRole;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, role: userRole, loading } = useAuth();
  const navigate = useNavigate();

  const effectiveRole = role || (userRole as UserRole) || 'student';

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar 
        role={effectiveRole} 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      <div className="lg:ms-64 lg:ltr:ml-64 lg:rtl:mr-64 min-w-0 overflow-x-hidden">
        <TopBar role={effectiveRole} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile & PWA Native Navigation Bar */}
      <MobileBottomNav role={effectiveRole} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
    </div>
  );
}
