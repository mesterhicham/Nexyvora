import React from 'react';
import { tr } from '@/utils/tr';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function ImpersonationBanner() {
  const { isImpersonating, stopImpersonation, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  if (!isImpersonating) return null;

  const handleReturnToAdmin = () => {
    stopImpersonation();
    queryClient.clear();
    toast.success(tr("تمت العودة إلى حساب المدير بنجاح", "Returned to admin account successfully"));
    navigate('/admin/users');
  };

  const studentName = user?.full_name || user?.email || (tr("الطالب", "Student"));

  return (
    <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-sm z-50 relative font-medium">
      <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold">{tr("وضع المحاكاة:", "Impersonation Mode:")}</span>
          <span>{tr("أنت تتصفح الحساب بصفتك", "You are viewing as")}</span>
          <span className="bg-black/20 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            {studentName}
          </span>
        </div>
      </div>

      <Button
        size="sm"
        variant="secondary"
        onClick={handleReturnToAdmin}
        className="bg-white text-amber-800 hover:bg-amber-50 font-bold shadow-sm shrink-0 flex items-center gap-1.5 h-8 text-xs rounded-lg"
      >
        <span>{tr("العودة لحساب المدير", "Return to Admin")}</span>
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </Button>
    </div>
  );
}
