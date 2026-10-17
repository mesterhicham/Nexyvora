import { useState, useEffect, useRef } from 'react';
import { tr } from '@/utils/tr';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userService, uploadService, affiliateService } from '@/services/apiService';
import { resolveAssetUrl } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, User, Camera, Lock, Eye, EyeOff, Building2, CreditCard, 
  DollarSign, CheckCircle2, Shield, GraduationCap, UserCheck, 
  Copy, Check, Phone, MapPin, Calendar, Globe, Sparkles, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function ProfileSettings() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { role, user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Query from DB
  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });

  // State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp_number: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    date_of_birth: '',
    // Teacher specific
    specialty: '',
    experience: '',
    degree: '',
    teacher_bio: '',
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Payout Settings State
  const [payoutData, setPayoutData] = useState({
    bankName: '',
    accountHolder: '',
    iban: '',
    swiftCode: '',
    paypalEmail: '',
    payoneerEmail: '',
    stripeAccount: '',
  });
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);

  // Populate formData when profile query finishes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || profile.whatsapp_number || '',
        whatsapp_number: profile.whatsapp_number || profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        bio: profile.bio || '',
        date_of_birth: profile.date_of_birth ? String(profile.date_of_birth).split('T')[0] : '',
        specialty: profile.specialty || '',
        experience: profile.experience || '',
        degree: profile.degree || '',
        teacher_bio: profile.teacher_bio || profile.bio || '',
      });
      if (profile.avatar_url) {
        setAvatarPreview(resolveAssetUrl(profile.avatar_url) || null);
      }
    }
  }, [profile]);

  const [studentRank, setStudentRank] = useState<any>(null);

  // Load student rank if role is student
  useEffect(() => {
    if (userRole === 'student') {
      affiliateService.getRanks()
        .then(res => {
          if (res?.userStats?.currentRank) {
            setStudentRank(res.userStats.currentRank);
          }
        })
        .catch(() => {});
    }
  }, [userRole]);

  // Load payout settings
  useEffect(() => {
    let isMounted = true;
    const fetchPayout = async () => {
      try {
        setLoadingPayout(true);
        const res = await affiliateService.getPayoutSettings();
        if (isMounted && res?.payoutSettings) {
          const s = res.payoutSettings;
          setPayoutData({
            bankName: s.bank_name || '',
            accountHolder: s.account_holder || '',
            iban: s.iban || '',
            swiftCode: s.swift_code || '',
            paypalEmail: s.paypal_email || '',
            payoneerEmail: s.payoneer_email || '',
            stripeAccount: s.stripe_account || '',
          });
        }
      } catch (err) {
        console.warn('Could not load payout settings:', err);
      } finally {
        if (isMounted) setLoadingPayout(false);
      }
    };
    fetchPayout();
    return () => { isMounted = false; };
  }, []);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (refreshProfile) {
        refreshProfile();
      }
      toast.success(tr("تم حفظ التعديلات في قاعدة البيانات بنجاح!", "Profile updated and saved to database successfully!", "Profil mis à jour et enregistré avec succès dans la base de données !"));
    },
    onError: (error: any) => {
      console.error('[updateProfileMutation] Error:', error);
      toast.error(
        tr("فشل حفظ التعديلات: ", "Failed to save profile: ", "Échec de l'enregistrement du profil: ") +
        (error.response?.data?.error || error.message || tr("حدث خطأ غير متوقع", "Unexpected error", "Erreur inattendue"))
      );
    }
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => userService.changePassword(data),
    onSuccess: () => {
      toast.success(tr("تم تغيير كلمة المرور بنجاح!", "Password changed successfully!", "Mot de passe modifié avec succès !"));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(
        tr("فشل تغيير كلمة المرور: ", "Failed to change password: ", "Échec du changement de mot de passe: ") +
        (error.response?.data?.error || error.message)
      );
    }
  });

  // Delete Account Mutation
  const deleteAccountMutation = useMutation({
    mutationFn: userService.deleteAccount,
    onSuccess: () => {
      signOut();
      toast.success(tr("تم حذف الحساب بنجاح", "Account deleted successfully", "Compte supprimé avec succès"));
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || tr("فشل حذف الحساب", "Failed to delete account", "Échec de la suppression du compte"));
    }
  });

  // Input Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayoutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayoutData(prev => ({ ...prev, [name]: value }));
  };

  // Profile Form Submit
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error(tr("يرجى إدخال الاسم الكامل", "Please enter your full name", "Veuillez entrer votre nom complet"));
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  // Password Submit
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword) {
      toast.error(tr("يرجى إدخال كلمة المرور الحالية", "Please enter your current password", "Veuillez entrer votre mot de passe actuel"));
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error(tr("يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل", "New password must be at least 8 characters", "Le nouveau mot de passe doit comporter au moins 8 caractères"));
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(tr("كلمات المرور الجديدة غير متطابقة", "New passwords do not match", "Les nouveaux mots de passe ne correspondent pas"));
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  // Payout Submit
  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPayout(true);
      await affiliateService.updatePayoutSettings(payoutData);
      toast.success(tr("تم حفظ إعدادات استلام الأرباح بنجاح", "Payout settings saved successfully", "Paramètres de paiement enregistrés avec succès"));
    } catch (err: any) {
      toast.error(
        tr("فشل حفظ إعدادات استلام الأرباح: ", "Failed to save payout settings: ", "Échec de l'enregistrement des paramètres: ") +
        (err.response?.data?.error || err.message)
      );
    } finally {
      setSavingPayout(false);
    }
  };

  // Avatar Upload with validation and instant preview
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tr("حجم الصورة يجب أن لا يتجاوز 5 ميغابايت", "Image size must not exceed 5MB", "La taille de l'image ne doit pas dépasser 5 Mo"));
      return;
    }

    // Check type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error(tr("صيغة الملف غير مدعومة. الصيغ المسموحة: JPG, PNG, WEBP, GIF", "Unsupported format. Allowed: JPG, PNG, WEBP, GIF", "Format non supporté. Autorisés: JPG, PNG, WEBP, GIF"));
      return;
    }

    // Immediate local preview
    const localPreviewUrl = URL.createObjectURL(file);
    setAvatarPreview(localPreviewUrl);

    try {
      setAvatarUploading(true);
      const res = await uploadService.uploadFile(file);
      const savedUrl = res.url || res.relativePath || `/uploads/${res.filename}`;

      // Persist avatar_url in the database
      const updated = await updateProfileMutation.mutateAsync({ avatar_url: savedUrl });
      if (updated?.avatar_url) {
        setAvatarPreview(resolveAssetUrl(updated.avatar_url) || savedUrl);
      }
      toast.success(tr("تم رفع وحفظ الصورة الشخصية بنجاح!", "Avatar uploaded and saved successfully!", "Photo de profil mise à jour avec succès !"));
    } catch (error: any) {
      console.error('[handleAvatarUpload] Error:', error);
      toast.error(
        tr("فشل رفع الصورة الشخصية: ", "Failed to upload avatar: ", "Échec du téléchargement de la photo: ") +
        (error.response?.data?.error || error.message || "")
      );
      // Revert preview to previous profile avatar
      if (profile?.avatar_url) {
        setAvatarPreview(resolveAssetUrl(profile.avatar_url) || null);
      } else {
        setAvatarPreview(null);
      }
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Copy referral code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(tr("تم نسخ كود الإحالة!", "Referral code copied!", "Code de parrainage copié !"));
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Loading Skeleton
  if (isLoading || !role) {
    return (
      <DashboardLayout role={role || 'student'}>
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          <p className="text-sm font-semibold text-slate-400">
            {tr("جاري تحميل بيانات الملف الشخصي...", "Loading profile data...", "Chargement des données du profil...")}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state with retry
  if (isError) {
    return (
      <DashboardLayout role={role}>
        <div className="max-w-2xl mx-auto my-12 p-8 bg-slate-900 border border-red-500/30 rounded-2xl text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            {tr("تعذر تحميل الملف الشخصي", "Failed to load profile", "Impossible de charger le profil")}
          </h2>
          <p className="text-sm text-slate-400">
            {tr("حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة مجدداً.", "An error occurred while connecting to the database. Please try again.", "Une erreur est survenue lors de la connexion. Veuillez réessayer.")}
          </p>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tr("إعادة المحاولة", "Retry", "Réessayer")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const userRole = role || profile?.role || 'student';
  const roleBadgeConfig = {
    admin: {
      label: tr("مسؤول النظام (Admin)", "System Administrator", "Administrateur Système"),
      icon: Shield,
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30",
      avatarBg: "from-rose-600 via-red-600 to-amber-600"
    },
    teacher: {
      label: tr("أستاذ معتمد (Instructor)", "Certified Instructor", "Professeur Certifié"),
      icon: GraduationCap,
      badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      avatarBg: "from-violet-600 via-purple-600 to-indigo-600"
    },
    student: {
      label: tr("عضو أكاديمي (Member)", "Academic Member", "Membre Académique"),
      icon: UserCheck,
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      avatarBg: "from-emerald-600 via-teal-600 to-cyan-600"
    }
  }[userRole] || {
    label: tr("عضو", "Member", "Membre"),
    icon: User,
    badgeClass: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    avatarBg: "from-slate-600 to-slate-800"
  };

  const RoleIcon = roleBadgeConfig.icon;

  return (
    <DashboardLayout role={userRole}>
      <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16">
        
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {tr("الملف الشخصي وإعدادات الحساب", "Profile & Account Settings", "Profil et Paramètres du Compte")}
              </h1>
              <Badge variant="outline" className={`gap-1.5 px-3 py-1 font-bold ${roleBadgeConfig.badgeClass}`}>
                <RoleIcon className="h-3.5 w-3.5" />
                <span>{roleBadgeConfig.label}</span>
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {tr(
                "تحكم في معلوماتك الشخصية، وبيانات التواصل، وإعدادات الأمان واستلام الأرباح المحفوظة في حسابك.",
                "Manage your personal details, contact info, security credentials, and payout settings safely stored in your account.",
                "Gérez vos informations personnelles, vos coordonnées, vos identifiants et vos paramètres de paiement."
              )}
            </p>
          </div>
          {profile?.updated_at && (
            <div className="text-xs text-slate-500 font-mono">
              {tr("آخر تحديث:", "Last updated:", "Dernière mise à jour:")} {new Date(profile.updated_at).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* HERO PROFILE CARD */}
        <Card className="border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden relative">
          <div className="h-28 bg-gradient-to-r from-violet-600/30 via-indigo-600/20 to-purple-800/30 border-b border-white/5 relative">
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <Badge className="bg-slate-950/80 backdrop-blur-md text-slate-300 border-white/10 font-mono text-[11px]">
                ID: {profile?.id?.slice(0, 8)}...
              </Badge>
              {profile?.email_verified === 1 ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 gap-1 text-[11px]">
                  <CheckCircle2 className="h-3 w-3" />
                  {tr("حساب موثق", "Verified Account", "Compte Vérifié")}
                </Badge>
              ) : null}
            </div>
          </div>

          <CardContent className="pt-0 pb-6 px-6 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-14 sm:-mt-16">
              
              {/* AVATAR WITH CAMERA UPLOAD */}
              <div className="relative group shrink-0">
                <Avatar className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl ring-4 ring-slate-950 border-2 border-white/15 shadow-2xl bg-slate-900 overflow-hidden">
                  {avatarPreview ? (
                    <AvatarImage 
                      src={avatarPreview} 
                      alt={profile?.full_name || user?.email} 
                      className="object-cover w-full h-full"
                    />
                  ) : null}
                  <AvatarFallback className={`rounded-3xl bg-gradient-to-tr ${roleBadgeConfig.avatarBg} text-white font-black text-3xl shadow-inner`}>
                    {(formData.full_name || profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Upload overlay button */}
                <label 
                  htmlFor="avatar-file-input" 
                  className={`absolute -bottom-1 -right-1 p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white cursor-pointer shadow-lg shadow-purple-600/40 ring-4 ring-slate-950 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${avatarUploading ? 'opacity-70 pointer-events-none' : ''}`}
                  title={tr("تغيير الصورة الشخصية (JPG, PNG, WEBP)", "Change Avatar (JPG, PNG, WEBP)", "Changer la photo (JPG, PNG, WEBP)")}
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </label>
                <input 
                  id="avatar-file-input"
                  ref={fileInputRef}
                  type="file" 
                  accept="image/png, image/jpeg, image/webp, image/gif" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                  disabled={avatarUploading}
                />
              </div>

              {/* USER MAIN DETAILS */}
              <div className="flex-1 text-center sm:text-start space-y-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                      {formData.full_name || profile?.full_name || tr("مستخدم الأكاديمية", "Academy Member", "Membre de l'Académie")}
                    </h2>
                    <p className="text-sm font-medium text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                      <span>{profile?.email || user?.email}</span>
                      <Lock className="h-3 w-3 text-slate-500" title={tr("البريد الإلكتروني مرتبط بتسجيل الدخول", "Email bound to authentication", "Email lié à l'authentification")} />
                    </p>
                  </div>

                  {/* QUICK INFO BADGES */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pt-2 sm:pt-0">
                    {studentRank && (
                      <Badge 
                        variant="outline" 
                        className="gap-1.5 text-xs py-1 border shadow-xs text-white"
                        style={{ 
                          backgroundColor: `${studentRank.color_hex || '#0284c7'}22`, 
                          borderColor: studentRank.color_hex || '#0284c7' 
                        }}
                      >
                        {studentRank.logo_url ? (
                          <img src={studentRank.logo_url} alt="Rank" className="h-4 w-4 object-contain" />
                        ) : (
                          <Award className="h-3.5 w-3.5" style={{ color: studentRank.color_hex }} />
                        )}
                        <span className="font-bold">
                          {isRtl ? (studentRank.name_ar || studentRank.name) : studentRank.name}
                        </span>
                      </Badge>
                    )}
                    {profile?.country && (
                      <Badge variant="outline" className="border-slate-800 bg-slate-950/60 text-slate-300 gap-1 text-xs">
                        <MapPin className="h-3 w-3 text-violet-400" />
                        <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
                      </Badge>
                    )}
                    {profile?.affiliate_code && (
                      <Badge 
                        onClick={() => handleCopyCode(profile.affiliate_code)}
                        className="bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 cursor-pointer gap-1.5 text-xs py-1 transition-colors"
                        title={tr("انقر لنسخ كود الإحالة", "Click to copy referral code", "Cliquer pour copier le code")}
                      >
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span className="font-mono">{profile.affiliate_code}</span>
                        {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-slate-400" />}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* MAIN TABS */}
        <Tabs defaultValue="personal" className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl h-auto gap-1">
            <TabsTrigger 
              value="personal" 
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all gap-1.5"
            >
              <User className="h-4 w-4" />
              <span>{tr("المعلومات الشخصية", "Personal Info", "Informations Personnelles")}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="security" 
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all gap-1.5"
            >
              <Lock className="h-4 w-4" />
              <span>{tr("الأمان وكلمة المرور", "Security & Password", "Sécurité & Mot de Passe")}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="payout" 
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all gap-1.5"
            >
              <CreditCard className="h-4 w-4" />
              <span>{tr("استلام الأرباح", "Payout Settings", "Paiements & Retraits")}</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="account" 
              className="rounded-xl py-2.5 font-bold text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white transition-all gap-1.5"
            >
              <Shield className="h-4 w-4" />
              <span>{tr("إعدادات الحساب", "Account", "Compte")}</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PERSONAL INFORMATION */}
          <TabsContent value="personal" className="space-y-6 focus-visible:outline-none">
            <form onSubmit={handleProfileSubmit}>
              <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-white">
                        {tr("البيانات الشخصية وبيانات الاتصال", "Personal & Contact Details", "Détails Personnels et Contact")}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs sm:text-sm">
                        {tr("يتم حفظ جميع التغييرات مباشرة في قاعدة البيانات المرتبطة بحسابك.", "All updates are safely stored in your permanent database profile.", "Toutes les modifications sont enregistrées dans votre profil.")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* Row 1: Full Name & Email */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-slate-300 font-bold flex items-center gap-1.5">
                        <span>{tr("الاسم الكامل", "Full Name", "Nom Complet")}</span>
                        <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        id="full_name" 
                        name="full_name" 
                        value={formData.full_name} 
                        onChange={handleInputChange} 
                        placeholder={tr("أدخل اسمك الكامل", "Enter your full name", "Entrez votre nom complet")}
                        required
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300 font-bold flex items-center justify-between">
                        <span>{tr("البريد الإلكتروني", "Email Address", "Adresse Email")}</span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {tr("(معتمد للدخول ولا يمكن تغييره هنا)", "(Permanent login email)", "(Email permanent de connexion)")}
                        </span>
                      </Label>
                      <Input 
                        id="email" 
                        name="email" 
                        value={profile?.email || user?.email || ''} 
                        disabled
                        className="bg-slate-950/40 border-slate-800/60 rounded-xl text-slate-400 cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone / WhatsApp & Date of Birth */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-violet-400" />
                        <span>{tr("رقم الهاتف / الواتساب", "Phone / WhatsApp", "Téléphone / WhatsApp")}</span>
                      </Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        type="tel"
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder={tr("مثال: +213555123456 أو +212600123456", "e.g. +213555123456 or +212600123456", "ex: +213555123456")}
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white font-mono"
                      />
                      <p className="text-[11px] text-slate-500">
                        {tr("يُفضل كتابة الرمز الدولي للبلد لتسهيل التواصل الأكاديمي والتنبيهات.", "Include country code (e.g. +213, +212) for WhatsApp academic alerts.", "Inclure l'indicatif du pays pour les notifications.")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-violet-400" />
                        <span>{tr("تاريخ الميلاد", "Date of Birth", "Date de Naissance")}</span>
                      </Label>
                      <Input 
                        id="date_of_birth" 
                        name="date_of_birth" 
                        type="date" 
                        value={formData.date_of_birth} 
                        onChange={handleInputChange} 
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white"
                      />
                    </div>
                  </div>

                  {/* Row 3: Country & City */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-slate-300 font-bold flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-violet-400" />
                        <span>{tr("البلد", "Country", "Pays")}</span>
                      </Label>
                      <Input 
                        id="country" 
                        name="country" 
                        value={formData.country} 
                        onChange={handleInputChange} 
                        placeholder={tr("مثال: الجزائر، المغرب، تونس، الإمارات...", "e.g. Algeria, Morocco, UAE, France...", "ex: Algérie, Maroc, France...")}
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-slate-300 font-bold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-violet-400" />
                        <span>{tr("المدينة", "City", "Ville")}</span>
                      </Label>
                      <Input 
                        id="city" 
                        name="city" 
                        value={formData.city} 
                        onChange={handleInputChange} 
                        placeholder={tr("أدخل مدينتك", "Enter your city", "Entrez votre ville")}
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white"
                      />
                    </div>
                  </div>

                  {/* Row 4: Bio / About */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-300 font-bold">
                      {tr("نبذة تعريفية (Bio)", "Bio / About You", "Biographie")}
                    </Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      rows={3} 
                      value={formData.bio} 
                      onChange={handleInputChange} 
                      placeholder={tr("اكتب نبذة مختصرة عن اهتماماتك أو خبراتك...", "Write a short summary about your background, interests, or goals...", "Écrivez un court résumé sur vous...")}
                      className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-violet-500 text-white resize-none"
                    />
                  </div>

                  {/* ROLE SPECIFIC FIELDS: TEACHER */}
                  {userRole === 'teacher' && (
                    <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-purple-300 border-b border-purple-500/20 pb-2">
                        <GraduationCap className="h-4 w-4 text-purple-400" />
                        <span>{tr("بيانات الأستاذ الأكاديمية (Instructor Academic Details)", "Instructor Academic Details", "Détails Académiques de l'Enseignant")}</span>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="specialty" className="text-xs font-bold text-slate-300">
                            {tr("التخصص الأكاديمي", "Academic Specialty", "Spécialité Académique")}
                          </Label>
                          <Input 
                            id="specialty" 
                            name="specialty" 
                            value={formData.specialty} 
                            onChange={handleInputChange} 
                            placeholder={tr("مثال: البرمجة والذكاء الاصطناعي، التجارة الإلكترونية...", "e.g. Fullstack Development, E-Commerce, AI...", "ex: Développement Web, IA...")}
                            className="bg-slate-950/80 border-slate-800 rounded-xl text-white"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="degree" className="text-xs font-bold text-slate-300">
                            {tr("المؤهل العلمي / الشهادة", "Academic Degree / Qualification", "Diplôme / Qualification")}
                          </Label>
                          <Input 
                            id="degree" 
                            name="degree" 
                            value={formData.degree} 
                            onChange={handleInputChange} 
                            placeholder={tr("مثال: ماستر في علوم الحاسوب، مهندس دولة...", "e.g. Master in Computer Science, State Engineer...", "ex: Master en Informatique...")}
                            className="bg-slate-950/80 border-slate-800 rounded-xl text-white"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label htmlFor="experience" className="text-xs font-bold text-slate-300">
                            {tr("الخبرة المهنية والتدريسية", "Teaching & Professional Experience", "Expérience Professionnelle")}
                          </Label>
                          <Input 
                            id="experience" 
                            name="experience" 
                            value={formData.experience} 
                            onChange={handleInputChange} 
                            placeholder={tr("مثال: أكثر من 7 سنوات في تطوير البرمجيات والتدريب الأكاديمي...", "e.g. 7+ years in Software Engineering and academic instruction...", "ex: Plus de 7 ans d'expérience...")}
                            className="bg-slate-950/80 border-slate-800 rounded-xl text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ROLE SPECIFIC FIELDS: STUDENT */}
                  {userRole === 'student' && profile?.cohort_name && (
                    <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400">{tr("الدفعة والبرنامج المسجل", "Enrolled Cohort & Program", "Cohorte et Programme Inscrits")}</p>
                          <p className="text-sm font-bold text-white">{profile.cohort_name} {profile.program_name ? `— ${profile.program_name}` : ''}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        {profile.student_status || tr("نشط", "Active", "Actif")}
                      </Badge>
                    </div>
                  )}

                  {/* ROLE SPECIFIC FIELDS: ADMIN */}
                  {userRole === 'admin' && (
                    <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-red-300">{tr("صلاحية مسؤول النظام الأعلى (Super Admin)", "Super Administrator Access", "Accès Administrateur Global")}</p>
                        <p className="text-xs text-slate-400">{tr("حسابك يمتلك كامل الصلاحيات لإدارة المستخدمين، الدورات، المدفوعات وإعدادات المنصة.", "Your account has full management privileges across users, courses, finances, and platform settings.", "Votre compte dispose de privilèges complets d'administration.")}</p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t border-slate-800/80 pt-4 pb-5 px-6 sm:px-8 flex items-center justify-between">
                  <p className="text-xs text-slate-500 hidden sm:block">
                    {tr("يتم حفظ البيانات مباشرة في قاعدة البيانات.", "Data is saved directly to the database.", "Données sauvegardées directement.")}
                  </p>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl px-6 py-2.5 shadow-lg shadow-purple-600/20 transition-all active:scale-95 ml-auto"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                        {tr("جاري الحفظ في الخادم...", "Saving to server...", "Enregistrement sur le serveur...")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 rtl:ml-2 h-4 w-4" />
                        {tr("حفظ التغييرات", "Save Changes", "Enregistrer les Modifications")}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 2: SECURITY & PASSWORD */}
          <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
            <form onSubmit={handlePasswordSubmit}>
              <Card className="border border-slate-800 bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-white">
                        {tr("تغيير كلمة المرور وإعدادات الأمان", "Change Password & Security", "Changer le Mot de Passe & Sécurité")}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs sm:text-sm">
                        {tr("احرص على استخدام كلمة مرور قوية تحتوي على 8 أحرف وأرقام ورموز.", "Use a strong password with at least 8 characters, numbers, and symbols.", "Utilisez un mot de passe fort d'au moins 8 caractères.")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 pt-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-slate-300 font-bold">
                      {tr("كلمة المرور الحالية", "Current Password", "Mot de Passe Actuel")}
                    </Label>
                    <div className="relative">
                      <Input 
                        id="currentPassword" 
                        name="currentPassword" 
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordData.currentPassword} 
                        onChange={handlePasswordInputChange} 
                        placeholder={tr("أدخل كلمة المرور الحالية للتأكيد", "Enter current password to verify", "Entrez votre mot de passe actuel")}
                        className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-indigo-500 text-white pr-10 rtl:pr-3 rtl:pl-10"
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 px-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password & Confirm Password */}
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-slate-300 font-bold">
                        {tr("كلمة المرور الجديدة", "New Password", "Nouveau Mot de Passe")}
                      </Label>
                      <div className="relative">
                        <Input 
                          id="newPassword" 
                          name="newPassword" 
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword} 
                          onChange={handlePasswordInputChange} 
                          placeholder={tr("8 أحرف على الأقل", "At least 8 characters", "Au moins 8 caractères")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-indigo-500 text-white pr-10 rtl:pr-3 rtl:pl-10"
                          required
                          minLength={8}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 px-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-slate-300 font-bold">
                        {tr("تأكيد كلمة المرور الجديدة", "Confirm New Password", "Confirmer le Nouveau Mot de Passe")}
                      </Label>
                      <div className="relative">
                        <Input 
                          id="confirmPassword" 
                          name="confirmPassword" 
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword} 
                          onChange={handlePasswordInputChange} 
                          placeholder={tr("أعد كتابة كلمة المرور الجديدة", "Re-type new password", "Répétez le mot de passe")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl focus:border-indigo-500 text-white pr-10 rtl:pr-3 rtl:pl-10"
                          required
                          minLength={8}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 rtl:right-auto rtl:left-0 px-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD MATCH WARNING */}
                  {passwordData.newPassword && passwordData.confirmPassword && (
                    <div className="text-xs font-semibold">
                      {passwordData.newPassword === passwordData.confirmPassword ? (
                        <p className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {tr("كلمات المرور متطابقة", "Passwords match", "Les mots de passe correspondent")}
                        </p>
                      ) : (
                        <p className="text-rose-400 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {tr("كلمات المرور غير متطابقة", "Passwords do not match", "Les mots de passe ne correspondent pas")}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t border-slate-800/80 pt-4 pb-5 px-6 sm:px-8 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={changePasswordMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                        {tr("جاري التحديث...", "Updating...", "Mise à jour...")}
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 rtl:ml-2 h-4 w-4" />
                        {tr("تحديث كلمة المرور", "Update Password", "Mettre à Jour le Mot de Passe")}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 3: PAYOUT SETTINGS */}
          <TabsContent value="payout" className="space-y-6 focus-visible:outline-none">
            <form onSubmit={handlePayoutSubmit}>
              <Card className="border border-emerald-500/20 bg-gradient-to-b from-slate-900/90 to-emerald-950/10 rounded-3xl shadow-xl overflow-hidden">
                <CardHeader className="border-b border-slate-800/80 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-bold text-white">
                        {tr("إعدادات استلام الأرباح والعمولات", "Payout & Commission Settings", "Paramètres de Paiement des Gains")}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs sm:text-sm">
                        {tr("عيّن بيانات حسابك البنكي أو محافظك الرقمية لاستلام أرباحك وعمولاتك بأمان.", "Set your bank account or digital wallets to receive commissions and earnings safely.", "Définissez vos coordonnées bancaires ou vos portefeuilles électroniques.")}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* Bank Account Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                      <Building2 className="h-4 w-4 text-emerald-400" />
                      <span>{tr("التحويل البنكي / الحساب المصرفي (Bank Transfer / IBAN / RIP)", "Bank Transfer / IBAN / RIP", "Virement Bancaire / IBAN / RIP")}</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="bankName" className="text-xs font-bold text-slate-300">
                          {tr("اسم البنك / المؤسسة المالية", "Bank / Financial Institution", "Nom de la Banque")}
                        </Label>
                        <Input 
                          id="bankName" 
                          name="bankName" 
                          value={payoutData.bankName} 
                          onChange={handlePayoutInputChange} 
                          placeholder={tr("مثال: البنك الوطني، بريد الجزائر، BNP...", "e.g. Chase, BNP Paribas, Al Baraka...", "ex: BNP Paribas, Société Générale...")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="accountHolder" className="text-xs font-bold text-slate-300">
                          {tr("اسم صاحب الحساب بالكامل", "Account Holder Full Name", "Nom Complet du Titulaire")}
                        </Label>
                        <Input 
                          id="accountHolder" 
                          name="accountHolder" 
                          value={payoutData.accountHolder} 
                          onChange={handlePayoutInputChange} 
                          placeholder={tr("الاسم المطابق للحساب البنكي", "Name matching bank records", "Nom sur le compte bancaire")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="iban" className="text-xs font-bold text-slate-300">
                          {tr("رقم الحساب أو الآيبان (IBAN / RIP)", "Account Number or IBAN / RIP", "Numéro de Compte ou IBAN / RIP")}
                        </Label>
                        <Input 
                          id="iban" 
                          name="iban" 
                          value={payoutData.iban} 
                          onChange={handlePayoutInputChange} 
                          placeholder={tr("FR76... أو 007999...", "IBAN or account number", "IBAN ou numéro")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="swiftCode" className="text-xs font-bold text-slate-300">
                          {tr("رمز السويفت (SWIFT / BIC)", "SWIFT / BIC Code", "Code SWIFT / BIC")}
                        </Label>
                        <Input 
                          id="swiftCode" 
                          name="swiftCode" 
                          value={payoutData.swiftCode} 
                          onChange={handlePayoutInputChange} 
                          placeholder={tr("اختياري للحوالات الدولية", "Optional for international wires", "Optionnel")}
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Digital Wallets */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                      <span>{tr("المحافظ والمنصات الإلكترونية (PayPal, Payoneer, Stripe)", "Digital Wallets (PayPal, Payoneer, Stripe)", "Portefeuilles Électroniques")}</span>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="paypalEmail" className="text-xs font-bold text-slate-300">PayPal Email</Label>
                        <Input 
                          id="paypalEmail" 
                          name="paypalEmail" 
                          type="email"
                          value={payoutData.paypalEmail} 
                          onChange={handlePayoutInputChange} 
                          placeholder="your-paypal@example.com"
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="payoneerEmail" className="text-xs font-bold text-slate-300">Payoneer Email / ID</Label>
                        <Input 
                          id="payoneerEmail" 
                          name="payoneerEmail" 
                          value={payoutData.payoneerEmail} 
                          onChange={handlePayoutInputChange} 
                          placeholder="your-payoneer@example.com"
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="stripeAccount" className="text-xs font-bold text-slate-300">Stripe Account / Email</Label>
                        <Input 
                          id="stripeAccount" 
                          name="stripeAccount" 
                          value={payoutData.stripeAccount} 
                          onChange={handlePayoutInputChange} 
                          placeholder="acct_... or email"
                          className="bg-slate-950/70 border-slate-800 rounded-xl text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-slate-800/80 pt-4 pb-5 px-6 sm:px-8 flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={savingPayout || loadingPayout}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6 py-2.5 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    {savingPayout ? (
                      <>
                        <Loader2 className="mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                        {tr("جاري الحفظ...", "Saving...", "Enregistrement...")}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 rtl:ml-2 h-4 w-4" />
                        {tr("حفظ إعدادات الأرباح", "Save Payout Settings", "Enregistrer les Paramètres")}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>

          {/* TAB 4: ADVANCED ACCOUNT & DANGER ZONE */}
          <TabsContent value="account" className="space-y-6 focus-visible:outline-none">
            {/* Account Details Card */}
            <Card className="border border-slate-800 bg-slate-900/80 rounded-3xl shadow-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg sm:text-xl">
                  {tr("معلومات وهوية الحساب", "Account Identity & Metadata", "Identité du Compte")}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {tr("معرف حسابك الفريد في نظام أكاديمية Nexyvora", "Your unique account ID on Nexyvora Academy", "Votre identifiant unique sur Nexyvora")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold">{tr("معرف المستخدم (User ID)", "User ID", "ID Utilisateur")}</p>
                    <p className="font-mono text-sm text-slate-300 font-bold mt-0.5">{profile?.id}</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      if (profile?.id) {
                        navigator.clipboard.writeText(profile.id);
                        toast.success(tr("تم نسخ معرف الحساب", "User ID copied", "ID Utilisateur copié"));
                      }
                    }}
                    className="rounded-xl border-slate-700 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5 rtl:ml-1.5" />
                    {tr("نسخ", "Copy", "Copier")}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 text-xs text-slate-400">
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">{tr("تاريخ الإنشاء", "Creation Date", "Date de Création")}</span>
                    <span className="text-slate-300 font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                    <span className="text-slate-500 block mb-1">{tr("حالة الحساب في النظام", "Account Status", "Statut du Compte")}</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      {profile?.user_status || 'active'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border border-red-500/30 bg-red-950/10 rounded-3xl">
              <CardHeader>
                <CardTitle className="text-red-400 text-lg sm:text-xl flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <span>{tr("حذف الحساب (Danger Zone)", "Delete Account (Danger Zone)", "Supprimer le Compte")}</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {tr(
                    "عند حذف حسابك، سيتم إلغاء وصولك لجميع الدورات والبيانات المسجلة. هذا الإجراء نهائي ولا يمكن التراجع عنه.",
                    "Deleting your account will revoke access to all enrolled courses and assets. This action is permanent and cannot be undone.",
                    "La suppression de votre compte est définitive et irréversible."
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="rounded-xl font-bold bg-red-600 hover:bg-red-700">
                      {tr("حذف الحساب نهائياً", "Delete Account Permanently", "Supprimer Définitivement le Compte")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-900 border-slate-800 text-white rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold text-red-400">
                        {tr("هل أنت متأكد تماماً من رغبتك في حذف الحساب؟", "Are you absolutely sure you want to delete your account?", "Êtes-vous sûr de vouloir supprimer votre compte ?")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-400">
                        {tr(
                          "سيتم حذف جميع سجلاتك وملفك الشخصي. لن تتمكن من استرجاع هذا الحساب مجدداً.",
                          "All records and profile information will be permanently deleted. You will not be able to recover this account.",
                          "Toutes vos données seront supprimées. Cette action est irréversible."
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 border-slate-700 text-white rounded-xl">
                        {tr("إلغاء", "Cancel", "Annuler")}
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteAccountMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                      >
                        {tr("نعم، احذف حسابي", "Yes, delete my account", "Oui, supprimer mon compte")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </DashboardLayout>
  );
}
