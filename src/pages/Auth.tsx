import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
  PlaySquare,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2
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
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-white p-6">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 animate-pulse" />
          <Loader2 className="absolute h-8 w-8 animate-spin text-indigo-400" />
        </div>
        <p className="mt-4 text-xs font-mono tracking-widest text-indigo-300 uppercase">
          {isRtl ? 'جاري التحقق من الجلسة...' : 'Authenticating Session...'}
        </p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full bg-[#070913] text-slate-100 relative flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500/30 selection:text-white ${isRtl ? 'rtl' : 'ltr'}`}>
      
      {/* ========================================================= */}
      {/* 3D NEON RIBBON & COSMIC BACKGROUND LAYER                  */}
      {/* ========================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* Luminous 3D Ribbon Loop Image at bottom-left corner */}
        <img
          src="/auth-bg-wave.jpg"
          alt="3D Neon Wave"
          className={`absolute -bottom-16 sm:-bottom-24 select-none object-cover sm:object-contain object-left-bottom pointer-events-none opacity-80 transition-opacity duration-1000 ${
            isRtl 
              ? '-right-16 lg:right-0 w-[550px] lg:w-[800px] max-w-none transform scale-x-[-1]' 
              : '-left-16 lg:left-0 w-[550px] lg:w-[800px] max-w-none'
          }`}
        />

        {/* Ambient Cosmic Radial Glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Delicate Cosmic Orbit Path with Lens Flare Node */}
        <svg 
          className="absolute w-[1600px] h-[1000px] -left-[300px] top-[5%] opacity-30 pointer-events-none" 
          viewBox="0 0 1600 1000" 
          fill="none"
        >
          <ellipse 
            cx="750" 
            cy="480" 
            rx="700" 
            ry="420" 
            stroke="url(#cosmicOrbitGradient)" 
            strokeWidth="1.2" 
            strokeDasharray="4 6" 
          />
          <defs>
            <linearGradient id="cosmicOrbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#c084fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Cosmic Glowing Node Point */}
        <div className="absolute left-[47%] top-[31%] -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_#38bdf8,0_0_24px_#818cf8,0_0_40px_#c084fc]" />
          <div className="absolute -inset-3 bg-indigo-500/25 rounded-full blur-xs" />
        </div>
      </div>

      {/* ========================================================= */}
      {/* TOP FLOATING NAVIGATION BAR                               */}
      {/* ========================================================= */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12 max-w-7xl mx-auto w-full">
        <Link 
          to="/" 
          className="group inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          {isRtl ? (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          ) : (
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          )}
          <span>{t('common.backToHome') || (isRtl ? 'العودة للرئيسية' : 'Back to Home')}</span>
        </Link>

        <div className="flex items-center gap-3">
          <LanguageSwitcher 
            variant="default" 
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-all text-xs" 
          />
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN TWO-COLUMN CONTAINER                                 */}
      {/* ========================================================= */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-4 sm:px-10 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">

          {/* ===================================================== */}
          {/* LEFT COLUMN: BRAND HERO & VALUE PROPOSITION           */}
          {/* ===================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left rtl:text-right">
            
            {/* Nexyvora Brand Header */}
            <div className="flex items-center gap-3.5 mb-8 sm:mb-12">
              <img 
                src="/logo-icon.png" 
                alt="Nexyvora Logo" 
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-[0_0_20px_rgba(56,189,248,0.45)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                  Nexyvora
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide mt-1">
                  Academy Platform
                </p>
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-2 mb-6 relative z-10">
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                {isRtl ? 'أكثر من مجرد تعليم.' : 'More than learning.'}
              </h1>
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.1] bg-gradient-to-r from-sky-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                {isRtl ? 'إنه مستقبلك.' : "It's your future."}
              </h1>
            </div>

            {/* Supporting Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-md sm:max-w-lg leading-relaxed mb-10 sm:mb-14 relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {isRtl 
                ? 'طوّر مهاراتك، وسّع شبكة علاقاتك، وحقق أهدافك المهنية مع نكستفورا.'
                : 'Build your skills, grow your network,\nand achieve your goals with Nexyvora.'}
            </p>

            {/* 4 Feature Badges with Vertical Dividers Exactly like Reference Image */}
            <div className="grid grid-cols-2 sm:grid-cols-4 max-w-xl divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-white/[0.08] relative z-10">
              
              {/* Feature 1: Expert-Led Courses */}
              <div className="group flex flex-col items-start gap-2.5 p-3 first:pl-0 rtl:first:pr-0 cursor-default">
                <div className="text-sky-400 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200 leading-snug">
                  <div>{isRtl ? 'دورات' : 'Expert-Led'}</div>
                  <div className="text-slate-400 font-normal">{isRtl ? 'بإشراف خبراء' : 'Courses'}</div>
                </div>
              </div>

              {/* Feature 2: Interactive Learning */}
              <div className="group flex flex-col items-start gap-2.5 p-3 cursor-default">
                <div className="text-blue-400 group-hover:scale-110 transition-transform">
                  <PlaySquare className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200 leading-snug">
                  <div>{isRtl ? 'تعلم' : 'Interactive'}</div>
                  <div className="text-slate-400 font-normal">{isRtl ? 'عملي تفاعلي' : 'Learning'}</div>
                </div>
              </div>

              {/* Feature 3: Global Community */}
              <div className="group flex flex-col items-start gap-2.5 p-3 cursor-default">
                <div className="text-indigo-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200 leading-snug">
                  <div>{isRtl ? 'مجتمع' : 'Global'}</div>
                  <div className="text-slate-400 font-normal">{isRtl ? 'طلابي عالمي' : 'Community'}</div>
                </div>
              </div>

              {/* Feature 4: Real-World Skills */}
              <div className="group flex flex-col items-start gap-2.5 p-3 last:pr-0 rtl:last:pl-0 cursor-default">
                <div className="text-fuchsia-400 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-200 leading-snug">
                  <div>{isRtl ? 'مهارات' : 'Real-World'}</div>
                  <div className="text-slate-400 font-normal">{isRtl ? 'سوق العمل' : 'Skills'}</div>
                </div>
              </div>

            </div>

          </div>

          {/* ===================================================== */}
          {/* RIGHT COLUMN: THE FLOATING GLASS LOGIN CARD           */}
          {/* ===================================================== */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="relative w-full max-w-[440px] rounded-[30px] sm:rounded-[36px] bg-[#0c1224]/85 backdrop-blur-2xl border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] p-7 sm:p-9 transition-all duration-300">
              
              {/* Subtle ambient aura behind the card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-[38px] blur-xl opacity-60 -z-10 pointer-events-none" />
              
              {/* Card Header Brand Emblem */}
              <div className="text-center mb-6">
                <img 
                  src="/logo-icon.png" 
                  alt="Nexyvora" 
                  className="h-11 w-11 object-contain mx-auto mb-2 drop-shadow-[0_0_16px_rgba(99,102,241,0.5)]"
                />
                <h3 className="text-xl font-bold text-white tracking-tight">Nexyvora</h3>
                <p className="text-xs text-slate-400 font-medium tracking-wide">Academy Platform</p>
              </div>

              {/* Card Welcome Title & Subtitle */}
              <div className="text-left rtl:text-right mb-6">
                <h2 className="text-2xl sm:text-[26px] font-black text-white tracking-tight">
                  {isLogin 
                    ? (isRtl ? 'مرحباً بعودتك' : 'Welcome back')
                    : (isRtl ? 'إنشاء حساب جديد' : 'Create your account')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {isLogin
                    ? (isRtl ? 'سجّل الدخول إلى حسابك وتابع مسيرتك التعليمية' : 'Sign in to your account and continue your journey')
                    : (isRtl ? 'انضم إلى منصة نكستفورا وابدأ رحلتك التعليمية' : 'Join Nexyvora platform and start your journey')}
                </p>
              </div>

              {/* Referral Banner (If Referred in Signup Mode) */}
              {!isLogin && referralCode && (
                <div className="mb-4 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
                  <div className="truncate">
                    <span>{isRtl ? 'كود الإحالة: ' : 'Referral Code: '}</span>
                    <span className="font-mono font-bold text-white">{referralCode}</span>
                  </div>
                </div>
              )}

              {/* Authentication Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* SIGN UP ADDITIONAL FIELDS (Only when isLogin is false) */}
                {!isLogin && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Full Name */}
                    <div className="space-y-1 text-left rtl:text-right">
                      <Label htmlFor="fullName" className="text-xs font-medium text-slate-300">
                        {isRtl ? 'الاسم الكامل' : 'Full Name'} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                        <Input
                          id="fullName"
                          placeholder={isRtl ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white placeholder:text-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all"
                        />
                      </div>
                      {errors.fullName && <p className="text-[11px] text-rose-400">{errors.fullName}</p>}
                    </div>

                    {/* Country & City */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1 text-left rtl:text-right">
                        <Label htmlFor="country" className="text-xs font-medium text-slate-300">
                          {isRtl ? 'الدولة' : 'Country'} <span className="text-rose-400">*</span>
                        </Label>
                        <Select value={country} onValueChange={setCountry}>
                          <SelectTrigger className="h-11 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all">
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

                      <div className="space-y-1 text-left rtl:text-right">
                        <Label htmlFor="city" className="text-xs font-medium text-slate-300">
                          {isRtl ? 'المدينة' : 'City'} <span className="text-rose-400">*</span>
                        </Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                          <Input
                            id="city"
                            placeholder={isRtl ? 'المدينة' : 'City'}
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white placeholder:text-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all"
                          />
                        </div>
                        {errors.city && <p className="text-[11px] text-rose-400">{errors.city}</p>}
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1 text-left rtl:text-right">
                      <Label htmlFor="whatsapp" className="text-xs font-medium text-slate-300">
                        {isRtl ? 'رقم الواتساب للتواصل' : 'WhatsApp Number'} <span className="text-rose-400">*</span>
                      </Label>
                      <div className="relative group">
                        <MessageCircle className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400 group-focus-within:text-emerald-300 transition-colors pointer-events-none" />
                        <Input
                          id="whatsapp"
                          type="tel"
                          placeholder="+212 600 000 000"
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          className="h-11 pl-10 rtl:pl-4 rtl:pr-10 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white placeholder:text-slate-500 rounded-xl text-sm font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all"
                        />
                      </div>
                      {errors.whatsapp && <p className="text-[11px] text-rose-400">{errors.whatsapp}</p>}
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-1 text-left rtl:text-right">
                      <Label className="text-xs font-medium text-slate-300">
                        {isRtl ? 'نوع الحساب' : 'Account Type'}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRole('student')}
                          className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                            selectedRole === 'student'
                              ? 'bg-blue-600/20 border-blue-500 text-white'
                              : 'bg-[#070b18]/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isRtl ? 'طالب' : 'Student'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRole('teacher')}
                          className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all ${
                            selectedRole === 'teacher'
                              ? 'bg-purple-600/20 border-purple-500 text-white'
                              : 'bg-[#070b18]/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                          <span>{isRtl ? 'أستاذ' : 'Instructor'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Teacher specific */}
                    {selectedRole === 'teacher' && (
                      <div className="space-y-2.5 p-3 rounded-xl bg-purple-950/20 border border-purple-500/30">
                        <div className="space-y-1">
                          <Label className="text-xs text-purple-200">
                            {isRtl ? 'التخصص الأكاديمي' : 'Specialty'} <span className="text-rose-400">*</span>
                          </Label>
                          <Input
                            placeholder={isRtl ? 'التخصص الأكاديمي' : 'Academic Domain'}
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="h-9 bg-[#070b18]/80 border-purple-500/40 text-white rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-purple-200">
                            {isRtl ? 'الخبرة الأكاديمية' : 'Experience'} <span className="text-rose-400">*</span>
                          </Label>
                          <Input
                            placeholder={isRtl ? 'سنوات الخبرة' : 'Experience Summary'}
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            className="h-9 bg-[#070b18]/80 border-purple-500/40 text-white rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Email Address */}
                <div className="space-y-1.5 text-left rtl:text-right">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                    {isRtl ? 'البريد الإلكتروني' : 'Email Address'}
                  </Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`h-11 sm:h-12 pl-10 pr-4 rtl:pl-4 rtl:pr-10 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white placeholder:text-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all ${
                        errors.email ? 'border-rose-500/80 focus:border-rose-500' : ''
                      }`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-[11px] text-rose-400 font-medium">{errors.email}</p>}
                </div>

                {/* Password with Show/Hide Toggle */}
                <div className="space-y-1.5 text-left rtl:text-right">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                    {isRtl ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder={isRtl ? 'أدخل كلمة المرور' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`h-11 sm:h-12 pl-10 pr-10 rtl:pl-10 rtl:pr-10 bg-[#070b18]/90 hover:bg-[#0a0f22] border-white/[0.08] hover:border-white/20 text-white placeholder:text-slate-500 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all ${
                        errors.password ? 'border-rose-500/80 focus:border-rose-500' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] text-rose-400 font-medium">{errors.password}</p>}
                </div>

                {/* Remember Me & Forgot Password Row (Login Mode) */}
                {isLogin && (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember-me"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(!!checked)}
                        className="rounded-md border-slate-700 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <Label htmlFor="remember-me" className="text-slate-300 cursor-pointer select-none">
                        {isRtl ? 'تذكرني' : 'Remember me'}
                      </Label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                    >
                      {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                    </button>
                  </div>
                )}

                {/* Primary Button (Blue-to-Purple Gradient matching the image with shimmer sheen) */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#9333EA] hover:from-[#1D4ED8] hover:via-[#4338CA] hover:to-[#7E22CE] text-white font-bold text-sm shadow-[0_4px_24px_rgba(99,102,241,0.45),0_1px_2px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.65)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
                  {loading ? (
                    <div className="relative z-10 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{isRtl ? 'جاري التحقق...' : 'Processing...'}</span>
                    </div>
                  ) : (
                    <div className="relative z-10 flex items-center gap-2">
                      <span>{isLogin ? (isRtl ? 'تسجيل الدخول' : 'Log In') : (isRtl ? 'إنشاء الحساب' : 'Sign Up')}</span>
                      {isRtl ? (
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                      ) : (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  )}
                </Button>

                {/* Subtle "or" Divider Line */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <span className="relative px-3 bg-[#0c1224] text-[11px] text-slate-500 lowercase font-medium">
                    {isRtl ? 'أو' : 'or'}
                  </span>
                </div>

                {/* Security Badge Exactly like Reference Image */}
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-normal pt-2">
                  <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{isRtl ? 'بياناتك آمنة ومحمية بالكامل' : 'Your data is secure and protected'}</span>
                </div>

                {/* Mode Switcher */}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">
                    {isLogin ? (
                      <>
                        {isRtl ? 'ليس لديك حساب بعد؟' : "Don't have an account?"}{' '}
                        <button
                          type="button"
                          onClick={() => { setIsLogin(false); setErrors({}); }}
                          className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors cursor-pointer"
                        >
                          {isRtl ? 'إنشاء حساب جديد' : 'Sign Up'}
                        </button>
                      </>
                    ) : (
                      <>
                        {isRtl ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
                        <button
                          type="button"
                          onClick={() => { setIsLogin(true); setErrors({}); }}
                          className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors cursor-pointer"
                        >
                          {isRtl ? 'تسجيل الدخول' : 'Log In'}
                        </button>
                      </>
                    )}
                  </p>
                </div>

              </form>

            </div>
          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* MICRO FOOTER / LEGAL                                      */}
      {/* ========================================================= */}
      <footer className="relative z-20 py-4 px-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
        <span>© {new Date().getFullYear()} Nexyvora. All rights reserved.</span>
        <span>•</span>
        <Link to="/policies" className="hover:text-slate-300 transition-colors">
          {isRtl ? 'الشروط والسياسات' : 'Terms & Policies'}
        </Link>
      </footer>

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
