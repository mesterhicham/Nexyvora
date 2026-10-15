import { useState, useEffect } from 'react';
import { tr } from '@/utils/tr';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/apiService';
import { ShieldCheck, CheckCircle2, Loader2, ArrowRight, ArrowLeft, RefreshCw, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified?: () => void;
}

export function EmailVerificationModal({
  open,
  onOpenChange,
  email,
  onVerified,
}: EmailVerificationModalProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: any;
    if (open && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [open, countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      toast.error(tr("يرجى إدخال رمز التحقق المكون من 6 أرقام", "Please enter the 6-digit OTP code"));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyEmailOtp(email.trim(), code.trim(), 'registration');
      toast.success(res?.message || (tr("تم التحقق من بريدك الإلكتروني بنجاح!", "Email verified successfully!")));
      setIsSuccess(true);
      if (onVerified) onVerified();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || (tr("كود التحقق غير صحيح", "Invalid verification code"));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      const res = await authService.sendEmailOtp(email.trim(), 'registration');
      toast.success(res?.message || (tr("تم إرسال كود تحقق جديد", "New OTP code sent to your email")));
      setCountdown(60);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || (tr("فشل إعادة الإرسال", "Failed to resend code"));
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setCode('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#0B101E] border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className={`space-y-3 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {tr("تفعيل الحساب والتحقق من البريد", "Verify Your Email Address")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 leading-relaxed">
            {isRtl ? (
              <>
                أرسلنا رمز تحقق (OTP) سري إلى <strong className="text-indigo-400 font-mono">{email}</strong>. أدخل الرمز المكون من 6 أرقام لإتمام تفعيل حسابك.
              </>
            ) : (
              <>
                We sent a 6-digit verification code (OTP) to <strong className="text-indigo-400 font-mono">{email}</strong>. Enter the code below to activate your account.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {tr("تم تفعيل حسابك بنجاح! 🎉", "Account Verified Successfully! 🎉")}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {tr("بريدك الإلكتروني موثق الآن بالكامل. يمكنك الاستمتاع بجميع ميزات Nexyvora.", "Your email has been successfully verified. You can now access all Nexyvora features.")}
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all"
            >
              {tr("المتابعة إلى الحساب", "Continue to Dashboard")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 mt-2">
            <div className="space-y-2 text-left rtl:text-right">
              <Label className="text-xs font-semibold text-slate-300">
                {tr("رمز التحقق (OTP)", "Verification Code (OTP)")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="pl-10 rtl:pl-4 rtl:pr-10 h-12 bg-slate-900/80 border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl font-mono text-center tracking-[0.4em] text-xl font-bold focus:border-purple-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">
                {countdown > 0 ? (
                  tr("إعادة الإرسال بعد ${countdown} ثانية", "Resend in ${countdown}s")
                ) : (
                  tr("لم يصلك الرمز؟", "Didn't receive code?")
                )}
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending}
                className="text-purple-400 hover:text-purple-300 disabled:opacity-40 disabled:hover:text-purple-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span>{tr("إعادة إرسال الرمز", "Resend Code")}</span>
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{tr("تأكيد الرمز وتفعيل الحساب", "Verify & Activate")}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
