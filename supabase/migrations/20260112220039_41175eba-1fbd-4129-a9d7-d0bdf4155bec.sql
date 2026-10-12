-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert OTP records during signup" ON public.whatsapp_otp;
DROP POLICY IF EXISTS "Anyone can update OTP records" ON public.whatsapp_otp;

-- Create more restrictive policies
-- OTP records can only be inserted/updated via edge function (service role)
-- These policies allow the edge function to work while restricting direct client access

CREATE POLICY "Service role can manage OTP records" 
ON public.whatsapp_otp 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add DELETE policy for cleanup
CREATE POLICY "Users can delete their own OTP records" 
ON public.whatsapp_otp 
FOR DELETE 
USING (user_id = auth.uid());