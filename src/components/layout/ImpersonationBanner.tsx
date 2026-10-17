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
    <div className="bg-gradient-to-r from-[#170529] via-[#3b0764] to-[#170529] border-b border-amber-500/30 text-white px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 text-sm z-50 relative font-medium">
      <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
        <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-amber-300">{tr("وضع المحاكاة:", "Impersonation Mode:")}</span>
          <span className="text-purple-100">{tr("أنت تتصفح الحساب بصفتك", "You are viewing as")}</span>
          <span className="bg-amber-500/20 text-amber-200 border border-amber-500/40 px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-amber-400" />
            {studentName}
          </span>
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleReturnToAdmin}
        className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black shadow-md shrink-0 flex items-center gap-1.5 h-8 text-xs rounded-xl px-3 transition-all active:scale-95"
      >
        <span>{tr("العودة لحساب المدير", "Return to Admin")}</span>
        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
      </Button>
    </div>
  );
}
