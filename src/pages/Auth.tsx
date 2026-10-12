import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlatformLogo } from '@/components/PlatformLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AuthHeroVisual } from '@/components/auth/AuthHeroVisual';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { EmailVerificationModal } from '@/components/auth/EmailVerificationModal';
import { authService } from '@/services/apiService';
import { COUNTRIES } from '@/data/countries';
import { toast } from 'sonner';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  MapPin, 
  Globe, 
  MessageCircle, 
  Briefcase, 
  BookOpen, 
  Sparkles, 
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export default function Auth() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role, signIn, signUp, loading: authLoading } = useAuth();

  const mode = searchParams.get('mode');
  const refParam = searchParams.get('ref') || searchParams.get('referralCode');
  const redirectPath = searchParams.get('redirect');

  // View state
  const [isLogin, setIsLogin] = useState(refParam ? false : mode !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('remember_me') === 'true';
  });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);

  // Form Fields
  const [referralCode, setReferralCode] = useState(refParam || '');
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('remembered_email') || '';
  });
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Morocco');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  
  // Submission & Validation States
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
    city?: string;
    country?: string;
    whatsapp?: string;
    specialty?: string;
    experience?: string;
  }>({});

  // Auto redirect if already authenticated
  useEffect(() => {
    if (user && role) {
      if (redirectPath) {
        navigate(redirectPath);
        return;
      }
      const defaultPath = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student';
      navigate(defaultPath);
    }
  }, [user, role, navigate, redirectPath]);

  // Form validation
  const validateForm = () => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch (e: any) {
      newErrors.email = isRtl ? 'صيغة البريد الإلكتروني غير صحيحة' : e.errors[0]?.message || 'Invalid email address';
    }

    try {
      passwordSchema.parse(password);
    } catch (e: any) {
      newErrors.password = isRtl ? 'كلمة المرور يجب أن لا تقل عن 8 أحرف' : e.errors[0]?.message || 'Password must be at least 8 characters';
    }

    if (!isLogin) {
      if (!fullName.trim()) newErrors.fullName = isRtl ? 'الاسم الكامل مطلوب' : 'Full name is required';
      if (!city.trim()) newErrors.city = isRtl ? 'المدينة مطلوبة' : 'City is required';
      if (!country) newErrors.country = isRtl ? 'الدولة مطلوبة' : 'Country is required';
      if (!whatsappNumber.trim()) {
        newErrors.whatsapp = isRtl ? 'رقم الواتساب مطلوب للتواصل' : 'WhatsApp number is required';
      }
      
      if (selectedRole === 'teacher') {
        if (!specialty.trim()) newErrors.specialty = isRtl ? 'التخصص الأكاديمي مطلوب' : 'Specialty is required';
        if (!experience.trim()) newErrors.experience = isRtl ? 'وصف الخبرة مطلوب' : 'Experience description is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (isLogin) {
        // Save remember me preference
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('remembered_email', email.trim());
        } else {
          localStorage.removeItem('remember_me');
          localStorage.removeItem('remembered_email');
        }

        const { error } = await signIn(email.trim(), password);
        if (error) {
          toast.error(error.message || (isRtl ? 'فشل تسجيل الدخول، تأكد من بياناتك' : 'Login failed, please check your credentials'));
        } else {
          toast.success(t('auth.loginSuccess') || (isRtl ? 'تم تسجيل الدخول بنجاح!' : 'Successfully signed in!'));
        }
      } else {
        const { error } = await signUp(
          email.trim(), 
          password, 
          fullName.trim(), 
          city.trim(), 
          country, 
          whatsappNumber.trim(), 
          selectedRole, 
          specialty.trim(), 
          experience.trim(), 
          referralCode.trim()
        );
        if (error) {
          toast.error(error.message || (isRtl ? 'فشل إنشاء الحساب' : 'Signup failed'));
        } else {
          try {
            await authService.sendEmailOtp(email.trim(), 'registration', fullName.trim());
          } catch (otpErr) {
            console.warn('[Auth] Initial OTP dispatch note:', otpErr);
          }
          toast.success(isRtl ? 'تم إنشاء الحساب وإرسال رمز التحقق (OTP) إلى بريدك!' : 'Account created! Verification code sent to your email.');
          setIsEmailVerificationOpen(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070A14] flex flex-col items-center justify-center text-white p-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 animate-pulse-glow" />
          <Loader2 className="absolute h-8 w-8 animate-spin text-indigo-400" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-indigo-300 uppercase">
          {isRtl ? 'جاري التحقق من الجلسة...' : 'Authenticating Session...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[#060912] text-slate-100 flex flex-col lg:flex-row overflow-x-hidden ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* ========================================================= */}
      {/* DESKTOP LEFT SIDE (50% Split) — Premium Dark Visual Exp   */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen shrink-0 border-r rtl:border-r-0 rtl:border-l border-white/[0.08]">
        <AuthHeroVisual compact={false} />
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE (50% Desktop, Full Mobile) — Clean Auth Arena  */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto">
        {/* Ambient background glow for right side */}
        <div className="absolute top-0 right-0 w-[360px] h-[360px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-[320px] h-[320px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Top Bar: Back to Home + Language Selector */}
        <header className="relative z-20 flex items-center justify-between px-6 py-3.5 sm:px-8 sm:py-4 border-b border-white/[0.06] backdrop-blur-md shrink-0">
          <Link 
            to="/" 
            className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            {isRtl ? (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            ) : (
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            )}
            <span>{t('common.backToHome') || (isRtl ? 'الرئيسية' : 'Back to Home')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher 
              variant="default" 
              className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all text-xs" 
            />
          </div>
        </header>

        {/* Main Content Arena */}
        <main className="relative z-10 flex-1 flex flex-col justify-center items-center px-4 py-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[460px] space-y-4">
            
            {/* MOBILE ONLY: Compact 180px–220px Hero Visual Header */}
            <div className="lg:hidden mb-1">
              <AuthHeroVisual compact={true} />
            </div>

            {/* Authentication Glass Card */}
            <div className="relative rounded-3xl bg-[#090E1C]/80 backdrop-blur-2xl border border-white/[0.08] p-6 sm:p-7 shadow-2xl shadow-black/60 transition-all duration-300">
              
              {/* Card Header */}
              <div className="text-center space-y-1.5 mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-white/10 text-indigo-300 shadow-inner mb-1">
                  {isLogin ? <Lock className="w-5 h-5 text-indigo-400" /> : <Sparkles className="w-5 h-5 text-purple-400" />}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {isLogin ? (
                    <>
                      {isRtl ? 'مرحباً بعودتك ' : 'Welcome back '}
                      <span className="inline-block animate-wave">👋</span>
                    </>
                  ) : (
                    <>
                      {isRtl ? 'إنشاء حساب جديد ' : 'Create your account '}
                      <span className="inline-block">✨</span>
                    </>
                  )}
                </h2>

                <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {isLogin 
                    ? (isRtl ? 'سجّل دخولك لمتابعة مسيرتك التعليمية' : 'Sign in to continue your learning journey')
                    : (isRtl ? 'انضم إلى مجتمع الأكاديمية وابدأ التعلم الآن' : 'Join our next-generation learning community today')}
                </p>
              </div>

              {/* Mode Toggle Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950/60 border border-white/[0.08] mb-6">
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setErrors({}); }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    isLogin 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('common.signIn') || (isRtl ? 'تسجيل الدخول' : 'Sign In')}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setErrors({}); }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                    !isLogin 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('auth.signUp') || (isRtl ? 'إنشاء حساب' : 'Create Account')}
                </button>
              </div>

              {/* Referral Banner (If Referred) */}
              {!isLogin && referralCode && (
                <div className="mb-5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="truncate">
                    <span>{isRtl ? 'كود الدعوة الترويجي: ' : 'Referred by code: '}</span>
                    <span className="font-mono font-bold text-white bg-indigo-500/20 px-1.5 py-0.5 rounded-md">{referralCode}</span>
                  </div>
                </div>
              )}

              {/* FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* SIGN UP ADDITIONAL FIELDS */}
                {!isLogin && (
                  <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Full Name */}
                    <div className="space-y-1.5 text-left rtl:text-right">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-slate-300">
                        {t('auth.fullName') || (isRtl ? 'الاسم الكامل' : 'Full Name')} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="fullName"
                          placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-xl text-sm"
                        />
                      </div>
                      {errors.fullName && <p className="text-[11px] text-rose-400 font-medium">{errors.fullName}</p>}
                    </div>

                    {/* Country & City */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 text-left rtl:text-right">
                        <Label htmlFor="country" className="text-xs font-semibold text-slate-300">
                          {isRtl ? 'الدولة' : 'Country'} <span className="text-rose-400">*</span>
                        </Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="h-11 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 text-white rounded-xl text-sm">
                            <SelectValue placeholder={isRtl ? 'اختر الدولة' : 'Select country'} />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 bg-slate-900 border-slate-700 text-white">
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.name} className="focus:bg-slate-800 focus:text-white">
                                {isRtl ? `${c.nameAr} (${c.code})` : `${c.name} (${c.code})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5 text-left rtl:text-right">
                        <Label htmlFor="city" className="text-xs font-semibold text-slate-300">
                          {isRtl ? 'المدينة' : 'City'} <span className="text-rose-400">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            id="city"
                            placeholder={isRtl ? 'المدينة' : 'Your city'}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-xl text-sm"
                          />
                        </div>
                        {errors.city && <p className="text-[11px] text-rose-400 font-medium">{errors.city}</p>}
                      </div>
                    </div>

                    {/* WhatsApp Phone Number */}
                    <div className="space-y-1.5 text-left rtl:text-right">
                      <Label htmlFor="whatsapp" className="text-xs font-semibold text-slate-300">
                        {isRtl ? 'رقم الواتساب للتواصل' : 'WhatsApp Number'} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+212 600 000 000"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 text-white placeholder:text-slate-500 rounded-xl text-sm font-mono"
                        />
                      </div>
                      {errors.whatsapp && <p className="text-[11px] text-rose-400 font-medium">{errors.whatsapp}</p>}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1.5 text-left rtl:text-right">
                      <Label htmlFor="role" className="text-xs font-semibold text-slate-300">
                        {t('login.selectRole') || (isRtl ? 'نوع الحساب' : 'Account Type')}
                      </Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('student')}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            selectedRole === 'student'
                              ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-500/20'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <GraduationCap className="w-4 h-4 text-indigo-400" />
                          <span>{t('roles.student') || (isRtl ? 'طالب / متدرب' : 'Student')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('teacher')}
                          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            selectedRole === 'teacher'
                              ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm shadow-purple-500/20'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <BookOpen className="w-4 h-4 text-purple-400" />
                          <span>{t('roles.teacher') || (isRtl ? 'أستاذ / مدرب' : 'Instructor')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Teacher Specific Fields */}
                    {selectedRole === 'teacher' && (
                      <div className="space-y-3.5 p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/30">
                        <div className="space-y-1.5 text-left rtl:text-right">
                          <Label htmlFor="specialty" className="text-xs font-semibold text-purple-200">
                            {isRtl ? 'التخصص الأكاديمي' : 'Specialty / Domain'} <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <BookOpen className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                            <Input
                              id="specialty"
                              placeholder={isRtl ? 'مثال: تطوير الويب، الذكاء الاصطناعي' : 'Ex: Software Engineering, Data Science'}
                              value={specialty}
                              onChange={(e) => setSpecialty(e.target.value)}
                              className="h-10 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/60 border-purple-500/40 text-white rounded-xl text-xs"
                            />
                          </div>
                          {errors.specialty && <p className="text-[11px] text-rose-400">{errors.specialty}</p>}
                        </div>

                        <div className="space-y-1.5 text-left rtl:text-right">
                          <Label htmlFor="experience" className="text-xs font-semibold text-purple-200">
                            {isRtl ? 'الخبرة الأكاديمية / المهنية' : 'Experience Summary'} <span className="text-rose-400">*</span>
                          </Label>
                          <div className="relative">
                            <Briefcase className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                            <Input
                              id="experience"
                              placeholder={isRtl ? 'مثال: 5 سنوات تدريس جامعي' : 'Ex: 5+ years instructing university cohorts'}
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              className="h-10 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/60 border-purple-500/40 text-white rounded-xl text-xs"
                            />
                          </div>
                          {errors.experience && <p className="text-[11px] text-rose-400">{errors.experience}</p>}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5 text-left rtl:text-right">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-300">
                    {t('login.emailAddress') || (isRtl ? 'البريد الإلكتروني' : 'Email Address')} <span className="text-rose-400">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-500 rounded-xl text-sm transition-all ${
                        errors.email ? 'border-rose-500/80 focus:border-rose-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-400 font-medium">{errors.email}</p>}
                </div>

                {/* Password with Show/Hide Toggle */}
                <div className="space-y-1.5 text-left rtl:text-right">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-300">
                      {t('login.password') || (isRtl ? 'كلمة المرور' : 'Password')} <span className="text-rose-400">*</span>
                    </Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                      >
                        {t('login.forgotPassword') || (isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`h-11 pl-10 pr-10 rtl:pl-10 rtl:pr-10 bg-slate-950/50 border-slate-700/60 hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white placeholder:text-slate-500 rounded-xl text-sm transition-all ${
                        errors.password ? 'border-rose-500/80 focus:border-rose-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-400 font-medium">{errors.password}</p>}
                </div>

                {/* Remember Me Checkbox (In Login Mode) */}
                {isLogin && (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(!!checked)}
                        className="rounded-md border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor="remember-me" className="text-xs text-slate-400 cursor-pointer select-none">
                        {isRtl ? 'تذكر بياناتي في هذا المتصفح' : 'Remember me'}
                      </Label>
                    </div>
                  </div>
                )}

                {/* Primary Action Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="relative group w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {/* Subtle shine shimmer overlay */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shimmer-slide pointer-events-none" />

                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحقق...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{isLogin ? (isRtl ? 'تسجيل الدخول' : 'Sign In') : (isRtl ? 'إنشاء الحساب' : 'Create Account')}</span>
                      {isRtl ? (
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      ) : (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  )}
                </Button>
              </form>

              {/* Bottom Switcher: Have an Account? */}
              <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
                <p className="text-xs text-slate-400">
                  {isLogin ? (
                    <>
                      {t('auth.noAccount') || (isRtl ? 'ليس لديك حساب بعد؟' : "Don't have an account?")}{' '}
                      <button
                        type="button"
                        onClick={() => { setIsLogin(false); setErrors({}); }}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors cursor-pointer"
                      >
                        {t('auth.createAccount') || (isRtl ? 'إنشاء حساب جديد' : 'Create account')}
                      </button>
                    </>
                  ) : (
                    <>
                      {t('auth.haveAccount') || (isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?')}{' '}
                      <button
                        type="button"
                        onClick={() => { setIsLogin(true); setErrors({}); }}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline transition-colors cursor-pointer"
                      >
                        {t('common.signIn') || (isRtl ? 'تسجيل الدخول' : 'Sign In')}
                      </button>
                    </>
                  )}
                </p>
              </div>

            </div>

            {/* Micro Privacy & Security Footer */}
            <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-4">
              <span>{isRtl ? 'اتصال مشفر 256-bit' : '256-bit SSL Encrypted'}</span>
              <span>•</span>
              <Link to="/policies/confidentialite" target="_blank" className="hover:text-slate-300 hover:underline transition-colors">
                {isRtl ? 'سياسة الخصوصية والأمان' : 'Privacy & Security'}
              </Link>
            </div>

          </div>
        </main>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
        defaultEmail={email}
      />

      {/* Email OTP Verification Modal */}
      <EmailVerificationModal
        open={isEmailVerificationOpen}
        onOpenChange={setIsEmailVerificationOpen}
        email={email.trim()}
        onVerified={() => {
          setIsEmailVerificationOpen(false);
          setIsLogin(true);
        }}
      />
    </div>
  );
}
