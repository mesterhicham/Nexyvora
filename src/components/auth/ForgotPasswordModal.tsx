import { useState } from 'react';
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
import { Mail, MessageCircle, ArrowRight, ArrowLeft, Loader2, KeyRound, CheckCircle2, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
}

export function ForgotPasswordModal({ open, onOpenChange, defaultEmail = '' }: ForgotPasswordModalProps) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [email, setEmail] = useState(defaultEmail);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(tr("يرجى إدخال بريد إلكتروني صحيح", "Please enter a valid email address"));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPasswordOtp(email.trim());
      toast.success(res?.message || (tr("تم إرسال كود التحقق إلى بريدك الإلكتروني", "Verification code sent to your email")));
      setStep('verify');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || (tr("فشل إرسال كود التحقق", "Failed to send verification code"));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      const res = await authService.forgotPasswordOtp(email.trim());
      toast.success(res?.message || (tr("تمت إعادة إرسال كود التحقق بنجاح", "Verification code resent successfully")));
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || (tr("فشل إعادة الإرسال", "Failed to resend code"));
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      toast.error(tr("يرجى إدخال كود التحقق المكون من 6 أرقام", "Please enter the 6-digit verification code"));
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error(tr("كلمة المرور يجب أن لا تقل عن 8 أحرف", "Password must be at least 8 characters"));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(tr("كلمتا المرور غير متطابقتين", "Passwords do not match"));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPasswordWithOtp(email.trim(), otpCode.trim(), newPassword);
      toast.success(res?.message || (tr("تم تغيير كلمة المرور بنجاح!", "Password reset successfully!")));
      setStep('success');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || (tr("فشل إعادة تعيين كلمة المرور", "Failed to reset password"));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('request');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-[#0B101E] border border-white/10 text-white rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className={`space-y-3 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {tr("استعادة كلمة المرور عبر البريد", "Reset Password via Email")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400 leading-relaxed">
            {step === 'request' && (tr("أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق (OTP) فوري لتعيين كلمة مرور جديدة.", "Enter your registered email and we will send a 6-digit verification OTP code."))}
            {step === 'verify' && (tr("أدخل رمز التحقق (OTP) المرسل إلى ${email}، ثم عيّن كلمة المرور الجديدة.", "Enter the verification code sent to ${email} and choose a new password."))}
            {step === 'success' && (tr("تم تحديث كلمة المرور الخاصة بحسابك بنجاح.", "Your password has been updated successfully."))}
          </DialogDescription>
        </DialogHeader>

        {step === 'success' ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                {tr("تم تحديث كلمة المرور بنجاح!", "Password Reset Successfully!")}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {tr("يمكنك الآن تسجيل الدخول إلى حسابك بأمان باستخدام كلمة المرور الجديدة.", "You can now sign in securely using your new password.")}
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-md shadow-purple-600/30"
            >
              {tr("العودة لتسجيل الدخول", "Proceed to Sign In")}
            </Button>
          </div>
        ) : step === 'verify' ? (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
            <div className="space-y-2 text-left rtl:text-right">
              <Label className="text-xs font-semibold text-slate-300">
                {tr("رمز التحقق (OTP - 6 أرقام)", "Verification Code (6 Digits)")}
              </Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="pl-10 rtl:pl-4 rtl:pr-10 h-11 bg-slate-900/80 border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl font-mono text-center tracking-widest text-lg font-bold focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 text-left rtl:text-right">
              <Label className="text-xs font-semibold text-slate-300">
                {tr("كلمة المرور الجديدة", "New Password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 rtl:pl-4 rtl:pr-10 h-11 bg-slate-900/80 border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 text-left rtl:text-right">
              <Label className="text-xs font-semibold text-slate-300">
                {tr("تأكيد كلمة المرور", "Confirm Password")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 rtl:pl-4 rtl:pr-10 h-11 bg-slate-900/80 border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('request')}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {tr("← تغيير البريد", "← Change Email")}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
                <span>{tr("إعادة إرسال الرمز", "Resend Code")}</span>
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{tr("تأكيد وتغيير كلمة المرور", "Reset Password")}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRequestOtp} className="space-y-4 mt-2">
            <div className="space-y-2 text-left rtl:text-right">
              <Label htmlFor="reset-email" className="text-xs font-semibold text-slate-300">
                {tr("البريد الإلكتروني", "Email Address")}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rtl:pl-4 rtl:pr-10 h-11 bg-slate-900/80 border-slate-700/60 text-white placeholder:text-slate-500 rounded-xl focus:border-indigo-500 focus:ring-indigo-500/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{tr("إرسال رمز التحقق (OTP)", "Send Verification OTP")}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </Button>

            <div className="pt-2 text-center border-t border-white/[0.08]">
              <p className="text-xs text-slate-400">
                {tr("تحتاج إلى مساعدة فورية؟", "Need urgent help?")}
              </p>
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium mt-1 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{tr("تواصل مع الدعم عبر واتساب", "Contact Support via WhatsApp")}</span>
              </a>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
