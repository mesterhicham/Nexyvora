import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GraduationCap, Shield, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function AdminSetup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminExists();
  }, []);

  useEffect(() => {
    // Redirect if already admin
    if (role === 'admin') {
      navigate('/admin');
    }
  }, [role, navigate]);

  const checkAdminExists = async () => {
    try {
      const data = await authService.checkAdminExists();
      setHasAdmin(data.hasAdmin);
    } catch (error) {
      console.error('Error checking admin:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to check admin status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAdmin = async () => {
    if (!user) {
      toast({
        title: t('auth.error'),
        description: 'Please sign in first',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setProcessing(true);
    try {
      const data = await authService.setupFirstAdmin();

      if (data.error) {
        toast({
          title: t('auth.error'),
          description: data.error,
          variant: 'destructive',
        });
        return;
      }

      setSetupComplete(true);
      toast({
        title: t('auth.success'),
        description: 'You are now an admin!',
      });

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
    } catch (error) {
      console.error('Error setting up admin:', error);
      toast({
        title: t('auth.error'),
        description: 'Failed to set up admin',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background flex flex-col">
      <div className="flex justify-between items-center p-6">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {t('common.backToHome')}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="p-3 bg-primary/10 rounded-xl">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl font-bold font-serif text-foreground">Simply University</span>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border text-center">
            {setupComplete ? (
              <>
                <div className="inline-flex p-4 bg-success/10 rounded-full mb-6">
                  <CheckCircle className="h-12 w-12 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Setup Complete!
                </h2>
                <p className="text-muted-foreground mb-6">
                  You are now an administrator. Redirecting to dashboard...
                </p>
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
              </>
            ) : hasAdmin ? (
              <>
                <div className="inline-flex p-4 bg-warning/10 rounded-full mb-6">
                  <Shield className="h-12 w-12 text-warning" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Admin Already Exists
                </h2>
                <p className="text-muted-foreground mb-6">
                  An administrator has already been set up for this platform.
                  Please contact the existing admin to get access.
                </p>
                <Link to="/auth">
                  <Button className="w-full">{t('common.signIn')}</Button>
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
                  <Shield className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Admin Setup
                </h2>
                <p className="text-muted-foreground mb-6">
                  {user 
                    ? 'Click below to become the first administrator of this platform.'
                    : 'Sign in first, then come back to set up your admin account.'
                  }
                </p>
                {user ? (
                  <div className="space-y-4">
                    <div className="bg-secondary/50 rounded-lg p-4 text-left">
                      <p className="text-sm text-muted-foreground mb-1">Signed in as:</p>
                      <p className="font-medium text-foreground">{user.email}</p>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleSetupAdmin}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Become Admin
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <Link to="/auth">
                    <Button className="w-full" size="lg">
                      {t('common.signIn')} First
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
