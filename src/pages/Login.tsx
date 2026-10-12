import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock, ArrowLeft } from 'lucide-react';
import { UserRole } from '@/types';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const roles: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: t('login.administrator'), description: t('login.adminDesc') },
    { value: 'teacher', label: t('login.teacher'), description: t('login.teacherDesc') },
    { value: 'student', label: t('login.student'), description: t('login.studentDesc') },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/${selectedRole}`);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              {t('common.backToHome')}
            </Link>
            <LanguageSwitcher variant="compact" />
          </div>

          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('login.welcomeBack')}</h1>
              <p className="text-muted-foreground">{t('login.signInToAccount')}</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">{t('login.selectRole')}</Label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-xl border-2 text-center transition-all duration-200 ${
                    selectedRole === role.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <p className={`font-medium ${selectedRole === role.value ? 'text-primary' : 'text-foreground'}`}>
                    {role.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
                    {role.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.emailAddress')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@academy.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rtl:pl-3 rtl:pr-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('login.password')}</Label>
                <a href="#" className="text-sm text-primary hover:underline">
                  {t('login.forgotPassword')}
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rtl:pl-3 rtl:pr-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              {t('login.signInAs')} {roles.find(r => r.value === selectedRole)?.label}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              {t('login.contactAdmin')}
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Decoration */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground">
          <GraduationCap className="h-24 w-24 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">{t('login.portalTitle')}</h2>
          <p className="text-lg opacity-80 max-w-md">
            {t('login.portalDesc')}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-sm opacity-70">
            <div className="p-4 bg-white/10 rounded-xl">
              <p className="font-semibold text-2xl">300+</p>
              <p>{t('nav.students')}</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl">
              <p className="font-semibold text-2xl">25+</p>
              <p>{t('nav.teachers')}</p>
            </div>
            <div className="p-4 bg-white/10 rounded-xl">
              <p className="font-semibold text-2xl">50+</p>
              <p>{t('nav.modules')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
