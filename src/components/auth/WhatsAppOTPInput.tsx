import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Phone, Check, Loader2, MessageCircle } from 'lucide-react';
import { authService } from '@/services/apiService';
import { toast } from '@/hooks/use-toast';

interface WhatsAppOTPInputProps {
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  onVerified: (verified: boolean) => void;
  isVerified: boolean;
  error?: string;
}

export function WhatsAppOTPInput({
  phoneNumber,
  onPhoneChange,
  onVerified,
  isVerified,
  error,
}: WhatsAppOTPInputProps) {
  const { t } = useTranslation();
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: t('common.error'),
        description: 'Please enter a valid WhatsApp number with country code',
        variant: 'destructive',
      });
      return;
    }

    setSendingOtp(true);
    try {
      const data = await authService.sendWhatsAppOtp(phoneNumber);

      if (data?.success) {
        setOtpSent(true);
        setCountdown(60); // 60 second cooldown
        
        // For development mode, show the OTP
        if (data.dev_mode && data.dev_otp) {
          setDevOtp(data.dev_otp);
          toast({
            title: 'Development Mode',
            description: `OTP Code: ${data.dev_otp} (Twilio not configured)`,
          });
        } else {
          toast({
            title: t('common.success'),
            description: 'Verification code sent to your WhatsApp',
          });
        }
      }
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      toast({
        title: t('common.error'),
        description: err.message || 'Failed to send verification code',
        variant: 'destructive',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: t('common.error'),
        description: 'Please enter the 6-digit verification code',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingOtp(true);
    try {
      const data = await authService.verifyWhatsAppOtp(phoneNumber, otpCode);

      if (data?.verified) {
        onVerified(true);
        setDevOtp(null);
        toast({
          title: t('common.success'),
          description: 'WhatsApp number verified successfully!',
        });
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      toast({
        title: t('common.error'),
        description: err.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="whatsapp">WhatsApp Number</Label>
      
      <div className="space-y-2">
        <div className="relative">
          <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="whatsapp"
            type="tel"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => {
              onPhoneChange(e.target.value);
              // Reset verification if number changes
              if (isVerified) {
                onVerified(false);
                setOtpSent(false);
                setOtpCode('');
              }
            }}
            className="pl-10 pr-24"
            disabled={isVerified}
          />
          {isVerified ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-xs font-medium">Verified</span>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={sendOTP}
              disabled={sendingOtp || countdown > 0 || !phoneNumber}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
            >
              {sendingOtp ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : countdown > 0 ? (
                `${countdown}s`
              ) : otpSent ? (
                'Resend'
              ) : (
                'Verify'
              )}
            </Button>
          )}
        </div>
        
        {error && <p className="text-sm text-destructive">{error}</p>}
        
        <p className="text-xs text-muted-foreground">
          Include country code (e.g., +1 for USA, +33 for France)
        </p>
      </div>

      {otpSent && !isVerified && (
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <Label>Enter verification code</Label>
          
          {devOtp && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              Dev Mode: Use code <strong>{devOtp}</strong>
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={(value) => setOtpCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <Button
              type="button"
              size="sm"
              onClick={verifyOTP}
              disabled={verifyingOtp || otpCode.length !== 6}
            >
              {verifyingOtp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
