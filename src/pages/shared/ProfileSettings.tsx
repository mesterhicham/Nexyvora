import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { userService, uploadService, affiliateService } from '@/services/apiService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Camera, Lock, Eye, EyeOff, Trash2, AlertTriangle, Building2, CreditCard, DollarSign, CheckCircle2 } from 'lucide-react';
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
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });

  const updateProfile = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isRtl ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(
        (isRtl ? 'فشل تحديث الملف الشخصي: ' : 'Failed to update profile: ') +
        (error.response?.data?.error || error.message)
      );
    }
  });

  const changePassword = useMutation({
    mutationFn: userService.changePassword,
    onSuccess: () => {
      toast.success(isRtl ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(
        (isRtl ? 'فشل تغيير كلمة المرور: ' : 'Failed to change password: ') +
        (error.response?.data?.error || error.message)
      );
    }
  });

  const deleteAccount = useMutation({
    mutationFn: userService.deleteAccount,
    onSuccess: () => {
      signOut();
      toast.success('Account deleted successfully');
      navigate('/');
    },
    onError: (error: any) => {
      toast.error('Failed to delete account');
    }
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    date_of_birth: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

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

  useEffect(() => {
    const fetchPayout = async () => {
      try {
        setLoadingPayout(true);
        const res = await affiliateService.getPayoutSettings();
        if (res?.payoutSettings) {
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
        console.error('Failed to load payout settings', err);
      } finally {
        setLoadingPayout(false);
      }
    };
    fetchPayout();
  }, []);

  const handlePayoutInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayoutData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPayout(true);
      await affiliateService.updatePayoutSettings(payoutData);
      toast.success(isRtl ? 'تم حفظ إعدادات استلام الأرباح بنجاح' : 'Payout settings saved successfully');
    } catch (err: any) {
      toast.error(
        (isRtl ? 'فشل حفظ إعدادات استلام الأرباح: ' : 'Failed to save payout settings: ') +
        (err.response?.data?.error || err.message)
      );
    } finally {
      setSavingPayout(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || '',
        bio: profile.bio || '',
        date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(isRtl ? 'كلمات المرور الجديدة غير متطابقة' : 'New passwords do not match');
      return;
    }
    changePassword.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploading(true);
      const res = await uploadService.uploadFile(file);
      await updateProfile.mutateAsync({ avatar_url: res.url });
    } catch (error) {
      toast.error(isRtl ? 'فشل تحميل الصورة الشخصية' : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading || !role) {
    return (
      <DashboardLayout role={role || 'student'}>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <div className="space-y-6 max-w-4xl mx-auto p-6">
        <div>
          <h1 className="text-3xl font-bold">{t('nav.profile')}</h1>
          <p className="text-muted-foreground mt-1">Manage your profile information and settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={`${import.meta.env.VITE_API_URL}${profile?.avatar_url}`} />
                  <AvatarFallback><User className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full cursor-pointer">
                  {avatarUploading ? <Loader2 className="h-4 w-4 text-primary-foreground animate-spin" /> : <Camera className="h-4 w-4 text-primary-foreground" />}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || 'No name set'}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} rows={3} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" value={formData.country} onChange={handleInputChange} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <form onSubmit={handlePasswordSubmit}>
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordInputChange} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="newPassword" type="password" placeholder="New Password" value={passwordData.newPassword} onChange={handlePasswordInputChange} />
                <Input name="confirmPassword" type="password" placeholder="Confirm Password" value={passwordData.confirmPassword} onChange={handlePasswordInputChange} />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
                  {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Payout Settings Card */}
        <form onSubmit={handlePayoutSubmit}>
          <Card className="border border-emerald-500/20 bg-linear-to-b from-emerald-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {isRtl ? 'إعدادات استلام الأرباح' : 'Payout Settings'}
                  </CardTitle>
                  <CardDescription>
                    {isRtl 
                      ? 'قم بتعيين بيانات حسابك البنكي أو محافظك الإلكترونية لاستلام أرباحك وعمولات التسويق.'
                      : 'Set your bank account or electronic wallet details to receive commissions and payout earnings.'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Account Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>{isRtl ? 'التحويل البنكي / الحساب البنكي (Bank Transfer / IBAN)' : 'Bank Transfer / IBAN Account'}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">{isRtl ? 'اسم البنك / المؤسسة المالية' : 'Bank / Institution Name'}</Label>
                    <Input 
                      id="bankName" 
                      name="bankName" 
                      placeholder={isRtl ? 'مثال: البنك الوطني، بريد الجزائر...' : 'e.g. Chase, BNP Paribas, Al Baraka...'}
                      value={payoutData.bankName} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountHolder">{isRtl ? 'اسم صاحب الحساب (بالكامل)' : 'Account Holder Full Name'}</Label>
                    <Input 
                      id="accountHolder" 
                      name="accountHolder" 
                      placeholder={isRtl ? 'الاسم المطابق لبطاقة الهوية أو الحساب' : 'Name matching bank account or ID'}
                      value={payoutData.accountHolder} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="iban">{isRtl ? 'رقم الحساب أو الآيبان (IBAN / RIP)' : 'Account Number or IBAN / RIP'}</Label>
                    <Input 
                      id="iban" 
                      name="iban" 
                      placeholder={isRtl ? 'FR76... أو رقم الحساب' : 'IBAN or Account Number'}
                      value={payoutData.iban} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="swiftCode">{isRtl ? 'رمز السويفت (SWIFT / BIC Code)' : 'SWIFT / BIC Code'}</Label>
                    <Input 
                      id="swiftCode" 
                      name="swiftCode" 
                      placeholder={isRtl ? 'اختياري للحوالات الدولية' : 'Optional for international wires'}
                      value={payoutData.swiftCode} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                </div>
              </div>

              {/* Digital Wallets */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200 border-b pb-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  <span>{isRtl ? 'المحافظ والمنصات الرقمية (PayPal, Payoneer, Stripe)' : 'Digital Wallets & Platforms (PayPal, Payoneer, Stripe)'}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="paypalEmail">{isRtl ? 'بريد حساب PayPal' : 'PayPal Email'}</Label>
                    <Input 
                      id="paypalEmail" 
                      name="paypalEmail" 
                      type="email"
                      placeholder="your-paypal@example.com"
                      value={payoutData.paypalEmail} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payoneerEmail">{isRtl ? 'بريد أو معرف Payoneer' : 'Payoneer Email or ID'}</Label>
                    <Input 
                      id="payoneerEmail" 
                      name="payoneerEmail" 
                      placeholder="your-payoneer@example.com"
                      value={payoutData.payoneerEmail} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stripeAccount">{isRtl ? 'معرف أو بريد Stripe' : 'Stripe Account ID or Email'}</Label>
                    <Input 
                      id="stripeAccount" 
                      name="stripeAccount" 
                      placeholder={isRtl ? 'معرف حساب Stripe أو البريد' : 'Stripe Account ID or email'}
                      value={payoutData.stripeAccount} 
                      onChange={handlePayoutInputChange} 
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={savingPayout || loadingPayout}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {savingPayout ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isRtl ? 'جاري الحفظ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {isRtl ? 'حفظ إعدادات استلام الأرباح' : 'Save Payout Settings'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-destructive">Delete Account</CardTitle></CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive">Delete Account</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button variant="destructive" onClick={() => deleteAccount.mutate()}>Delete my account</Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
