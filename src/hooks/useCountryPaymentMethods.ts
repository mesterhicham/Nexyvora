import { useQuery } from '@tanstack/react-query';
import { affiliateService } from '@/services/apiService';

/**
 * A payment method as returned by GET /affiliate/payment-methods.
 * The list is already filtered by the admin "Country Currency" rules of the member's country
 * (USDT / Bank / Stripe / PayPal / Payoneer toggles) and carries that country's bank details.
 */
export interface CountryPaymentMethod {
  id: string;
  name: string;
  name_ar?: string | null;
  type: string;
  provider?: string | null;
  currency?: string | null;
  crypto_currency?: string | null;
  crypto_network?: string | null;
  crypto_wallet_address?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  account_number?: string | null;
  iban?: string | null;
  swift_code?: string | null;
  instructions?: string | null;
  instructions_ar?: string | null;
  require_receipt?: boolean;
  min_deposit?: number;
  enabled_for_deposit?: boolean;
  enabled_for_withdrawal?: boolean;
  country_code?: string;
}

export function isCryptoMethod(m?: Pick<CountryPaymentMethod, 'type' | 'provider'> | null): boolean {
  if (!m) return false;
  const type = (m.type || '').toLowerCase();
  const provider = (m.provider || '').toLowerCase();
  return type === 'crypto' || type === 'nowpayments_crypto' || provider === 'nowpayments';
}

export function isBankMethod(m?: Pick<CountryPaymentMethod, 'type' | 'provider'> | null): boolean {
  if (!m) return false;
  return m.type === 'bank_transfer' || m.provider === 'manual';
}

/** Payment methods allowed for the logged-in member's country. Never falls back to hardcoded methods. */
export function useCountryPaymentMethods(mode: 'deposit' | 'withdrawal' = 'deposit', enabled = true) {
  const query = useQuery({
    queryKey: ['country-payment-methods', mode],
    queryFn: () => affiliateService.getPaymentMethods(mode),
    enabled,
    staleTime: 60_000,
  });
  const methods: CountryPaymentMethod[] = (query.data?.paymentMethods || []).filter((m: CountryPaymentMethod) =>
    mode === 'deposit' ? m.enabled_for_deposit !== false : m.enabled_for_withdrawal !== false
  );
  return {
    methods,
    countryCode: query.data?.detectedCountry as string | undefined,
    loading: query.isLoading,
    error: query.isError,
  };
}
