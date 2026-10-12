-- Create payment_account_settings table for storing payment receiving account details
CREATE TABLE public.payment_account_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  bank_address TEXT,
  paypal_email TEXT,
  stripe_publishable_key TEXT,
  stripe_account_id TEXT,
  mobile_payment_number TEXT,
  mobile_payment_provider TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_account_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage payment settings
CREATE POLICY "Admins can manage payment account settings"
ON public.payment_account_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone authenticated can view active payment settings (for payment instructions)
CREATE POLICY "Authenticated users can view active payment settings"
ON public.payment_account_settings
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);