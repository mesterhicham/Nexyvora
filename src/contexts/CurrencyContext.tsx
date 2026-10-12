import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { currencyService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';

export interface CountryCurrencyRule {
  country_code: string;
  country_name: string;
  country_name_ar: string;
  currency_code: string;
  currency_symbol: string;
  usd_rate: number;
  usdt_rate: number;
  usdt_enabled: boolean | number;
  local_currency_enabled: boolean | number;
  stripe_enabled: boolean | number;
  paypal_enabled: boolean | number;
  payoneer_enabled: boolean | number;
  bank_transfer_enabled: boolean | number;
  is_active: boolean | number;
}

interface CurrencyContextType {
  rule: CountryCurrencyRule | null;
  countryCode: string;
  loading: boolean;
  isAlgeria: boolean;
  isMorocco: boolean;
  hasLocalCurrency: boolean;
  usdtEnabled: boolean;
  currencyCode: string;
  currencySymbol: string;
  usdRate: number;
  convertToLocal: (usdAmount: number) => number;
  formatPrice: (usdAmount: number) => string;
  formatDualPrice: (usdAmount: number) => string;
  formatBalance: (usdAmount: number, showValue?: boolean) => { primary: string; secondary?: string; hasUsdt: boolean };
  refreshRule: () => Promise<void>;
}

const defaultRule: CountryCurrencyRule = {
  country_code: 'GLOBAL',
  country_name: 'Global / Rest of World',
  country_name_ar: 'عالمي',
  currency_code: 'USD',
  currency_symbol: '$',
  usd_rate: 1,
  usdt_rate: 1,
  usdt_enabled: 1,
  local_currency_enabled: 0,
  stripe_enabled: 1,
  paypal_enabled: 1,
  payoneer_enabled: 1,
  bank_transfer_enabled: 1,
  is_active: 1
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rule, setRule] = useState<CountryCurrencyRule | null>(null);
  const [countryCode, setCountryCode] = useState<string>('GLOBAL');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRule = useCallback(async () => {
    try {
      setLoading(true);
      const countryParam = user?.country_code || user?.country || '';
      const res = await currencyService.getMyRule(countryParam ? { country: countryParam } : undefined);
      if (res && res.rule) {
        setRule(res.rule);
        setCountryCode(res.detected_country || res.rule.country_code || 'GLOBAL');
      } else {
        setRule(defaultRule);
        setCountryCode('GLOBAL');
      }
    } catch (err) {
      console.warn('[CurrencyProvider] Failed to fetch currency rule, using fallback default:', err);
      setRule(defaultRule);
      setCountryCode('GLOBAL');
    } finally {
      setLoading(false);
    }
  }, [user?.country, user?.country_code]);

  useEffect(() => {
    fetchRule();
  }, [fetchRule]);

  // Priority check: Use user profile country if logged in, otherwise API detection, fallback to GLOBAL
  const userCountryLower = (user?.country || '').toLowerCase().trim();
  const userCodeUpper = (user?.country_code || '').toUpperCase().trim();
  
  let resolvedCode = 'GLOBAL';
  if (userCodeUpper === 'DZ' || userCountryLower.includes('algeria') || userCountryLower.includes('algérie') || userCountryLower.includes('الجزائر')) {
    resolvedCode = 'DZ';
  } else if (userCodeUpper === 'MA' || userCountryLower.includes('morocco') || userCountryLower.includes('maroc') || userCountryLower.includes('المغرب')) {
    resolvedCode = 'MA';
  } else if (countryCode && countryCode !== 'GLOBAL') {
    resolvedCode = countryCode.toUpperCase();
  } else if (rule?.country_code) {
    resolvedCode = rule.country_code.toUpperCase();
  }

  const isAlgeria = resolvedCode === 'DZ';
  const isMorocco = resolvedCode === 'MA';
  const hasLocalCurrency = isAlgeria || isMorocco;

  // Strict logic:
  // - Algeria: DZD (DA), rate ~ 250, USDT strictly disabled
  // - Morocco: MAD (DH), rate ~ 10, USDT enabled
  // - All other countries: USD ($), rate = 1, NO local currency displayed
  const usdtEnabled = isAlgeria ? false : true;
  const currencyCode = isAlgeria ? 'DZD' : isMorocco ? 'MAD' : 'USD';
  const currencySymbol = isAlgeria ? 'DA' : isMorocco ? 'DH' : '$';
  
  const activeRule = rule || defaultRule;
  const usdRate = isAlgeria 
    ? (Number(activeRule.country_code === 'DZ' ? activeRule.usd_rate : 250) || 250)
    : isMorocco 
    ? (Number(activeRule.country_code === 'MA' ? activeRule.usd_rate : 10) || 10)
    : 1;

  const convertToLocal = (usdAmount: number): number => {
    const amt = Number(usdAmount || 0);
    if (!hasLocalCurrency) {
      return amt;
    }
    return Math.round(amt * usdRate);
  };

  const formatPrice = (usdAmount: number): string => {
    const amt = Number(usdAmount || 0);
    if (isAlgeria) {
      return `${Math.round(amt * usdRate).toLocaleString()} DZD`;
    }
    if (isMorocco) {
      return `${Math.round(amt * usdRate).toLocaleString()} MAD`;
    }
    // Rest of world: strictly USD
    return `$${amt.toLocaleString()}`;
  };

  const formatDualPrice = (usdAmount: number): string => {
    const amt = Number(usdAmount || 0);
    if (isAlgeria) {
      return `${Math.round(amt * usdRate).toLocaleString()} DZD`;
    }
    if (isMorocco) {
      return `${Math.round(amt * usdRate).toLocaleString()} MAD (≈ ${amt.toLocaleString()} USDT)`;
    }
    return `$${amt.toLocaleString()} USD`;
  };

  const formatBalance = (usdAmount: number, showValue = true): { primary: string; secondary?: string; hasUsdt: boolean } => {
    if (!showValue) {
      return {
        primary: `•••••••• ${currencyCode}`,
        secondary: isAlgeria ? undefined : (isMorocco ? '•••••••• USDT' : undefined),
        hasUsdt: !isAlgeria
      };
    }

    const amt = Number(usdAmount || 0);

    // Strict Algeria: DZD only, NO USDT or USD
    if (isAlgeria) {
      return {
        primary: `${Math.round(amt * usdRate).toLocaleString()} DZD`,
        secondary: undefined,
        hasUsdt: false
      };
    }

    // Morocco: Local currency MAD primary, USDT secondary
    if (isMorocco) {
      return {
        primary: `${Math.round(amt * usdRate).toLocaleString()} MAD`,
        secondary: `≈ ${amt.toFixed(2)} USDT`,
        hasUsdt: true
      };
    }

    // Default for all other countries: USD primary, no local currency
    return {
      primary: `$${amt.toFixed(2)}`,
      secondary: undefined,
      hasUsdt: true
    };
  };

  return (
    <CurrencyContext.Provider
      value={{
        rule: activeRule,
        countryCode: resolvedCode,
        loading,
        isAlgeria,
        isMorocco,
        hasLocalCurrency,
        usdtEnabled,
        currencyCode,
        currencySymbol,
        usdRate,
        convertToLocal,
        formatPrice,
        formatDualPrice,
        formatBalance,
        refreshRule: fetchRule,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
