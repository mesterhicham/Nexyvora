-- Add WhatsApp verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS whatsapp_verified boolean DEFAULT false;

-- Create table for WhatsApp OTP verification
CREATE TABLE public.whatsapp_otp (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.whatsapp_otp ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own OTP records" 
ON public.whatsapp_otp 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Anyone can insert OTP records during signup" 
ON public.whatsapp_otp 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update OTP records" 
ON public.whatsapp_otp 
FOR UPDATE 
USING (true);

-- Create function to clean expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.whatsapp_otp WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;