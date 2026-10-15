import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

type AppRole = 'admin' | 'teacher' | 'student';

interface User {
  id: string;
  email: string;
  role: AppRole | null;
  full_name?: string;
  avatar_url?: string | null;
  phone?: string;
  whatsapp_number?: string;
  city?: string;
  country?: string;
  country_code?: string;
  affiliateCode?: string;
  referrerId?: string;
  kyc_status?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string | null;
  };
}

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, city?: string, country?: string, whatsappNumber?: string, role?: string, specialty?: string, experience?: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isImpersonating: boolean;
  impersonateUser: (token: string, studentUser: any) => void;
  stopImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/user/profile');
      const profileData = response.data;

      // Get role from stored user if available
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

      const fullUser: User = {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name || storedUser.full_name,
        role: profileData.role || storedUser.role || null,
        avatar_url: profileData.avatar_url || storedUser.avatar_url,
        phone: profileData.phone || profileData.whatsapp_number || storedUser.phone,
        whatsapp_number: profileData.whatsapp_number || profileData.phone || storedUser.whatsapp_number,
        city: profileData.city || storedUser.city,
        country: profileData.country || storedUser.country,
        country_code: profileData.country_code || storedUser.country_code,
        affiliateCode: profileData.affiliate_code || storedUser.affiliateCode,
        referrerId: profileData.referrer_id || storedUser.referrerId,
        kyc_status: profileData.kyc_status || storedUser.kyc_status,
        user_metadata: {
          full_name: profileData.full_name || storedUser.full_name,
          avatar_url: profileData.avatar_url || storedUser.avatar_url
        }
      };

      setUser(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { error: null };
    } catch (error: any) {
      console.error('SignIn Error:', error);
      return { error: new Error(error.response?.data?.error || 'Login failed') };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string, 
    city?: string, 
    country?: string, 
    whatsappNumber?: string,
    role: string = 'student',
    specialty?: string,
    experience?: string,
    referralCode?: string
  ) => {
    try {
      await api.post('/auth/register', { 
        email, 
        password, 
        fullName, 
        city, 
        country, 
        whatsappNumber, 
        role,
        specialty,
        experience,
        referralCode
      });
      // After registration, user needs to login
      return { error: null };
    } catch (error: any) {
      return { error: new Error(error.response?.data?.error || 'Registration failed') };
    }
  };

  const [isImpersonating, setIsImpersonating] = useState(() => !!localStorage.getItem('admin_impersonator_token'));

  const impersonateUser = (token: string, studentUser: any) => {
    const currentToken = localStorage.getItem('token');
    const currentUser = localStorage.getItem('user');
    if (currentToken && !localStorage.getItem('admin_impersonator_token')) {
      localStorage.setItem('admin_impersonator_token', currentToken);
      localStorage.setItem('admin_impersonator_user', currentUser || '{}');
    }
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(studentUser));
    setUser(studentUser);
    setIsImpersonating(true);
  };

  const stopImpersonation = () => {
    const adminToken = localStorage.getItem('admin_impersonator_token');
    const adminUserStr = localStorage.getItem('admin_impersonator_user');
    if (adminToken && adminUserStr) {
      localStorage.setItem('token', adminToken);
      localStorage.setItem('user', adminUserStr);
      localStorage.removeItem('admin_impersonator_token');
      localStorage.removeItem('admin_impersonator_user');
      setUser(JSON.parse(adminUserStr));
      setIsImpersonating(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin_impersonator_token');
    localStorage.removeItem('admin_impersonator_user');
    setIsImpersonating(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role || null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile: fetchProfile,
      isImpersonating,
      impersonateUser,
      stopImpersonation
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
