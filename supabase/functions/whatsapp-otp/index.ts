import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  phone_number: string;
  user_id?: string;
}

interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
  user_id?: string;
}

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number for WhatsApp (ensure it starts with country code)
function formatWhatsAppNumber(phone: string): string {
  // Remove any non-digit characters except the leading +
  let cleaned = phone.replace(/[^\\d+]/g, '');
  
  // If it doesn't start with +, assume it needs formatting
  if (!cleaned.startsWith('+')) {
    // If it starts with 00, replace with +
    if (cleaned.startsWith('00')) {
      cleaned = '+' + cleaned.substring(2);
    } else {
      // Otherwise, just add + (user should provide country code)
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "send") {
      // Send OTP
      const { phone_number, user_id }: SendOTPRequest = await req.json();

      if (!phone_number) {
        return new Response(
          JSON.stringify({ error: "Phone number is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if Twilio is configured
      if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
        // For development/testing, simulate OTP sending
        const otp = generateOTP();
        const formattedPhone = formatWhatsAppNumber(phone_number);

        // Store OTP in database
        const { error: insertError } = await supabase
          .from("whatsapp_otp")
          .insert({
            phone_number: formattedPhone,
            otp_code: otp,
            user_id: user_id || null,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          });

        if (insertError) {
          console.error("Error storing OTP:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to generate OTP" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // In development mode, return the OTP for testing
        console.log(`[DEV MODE] OTP for ${formattedPhone}: ${otp}`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "OTP sent successfully",
            dev_mode: true,
            dev_otp: otp // Only included when Twilio is not configured
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Production: Send via Twilio WhatsApp
      const otp = generateOTP();
      const formattedPhone = formatWhatsAppNumber(phone_number);

      // Store OTP in database first
      const { error: insertError } = await supabase
        .from("whatsapp_otp")
        .insert({
          phone_number: formattedPhone,
          otp_code: otp,
          user_id: user_id || null,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        });

      if (insertError) {
        console.error("Error storing OTP:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send WhatsApp message via Twilio
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      const authHeader = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

      const formData = new URLSearchParams();
      formData.append("From", `whatsapp:${twilioWhatsAppNumber}`);
      formData.append("To", `whatsapp:${formattedPhone}`);
      formData.append("Body", `Your EduAcademy verification code is: ${otp}. This code expires in 10 minutes.`);

      const twilioResponse = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!twilioResponse.ok) {
        const errorData = await twilioResponse.text();
        console.error("Twilio error:", errorData);
        return new Response(
          JSON.stringify({ error: "Failed to send WhatsApp message" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else if (action === "verify") {
      // Verify OTP
      const { phone_number, otp_code, user_id }: VerifyOTPRequest = await req.json();

      if (!phone_number || !otp_code) {
        return new Response(
          JSON.stringify({ error: "Phone number and OTP code are required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const formattedPhone = formatWhatsAppNumber(phone_number);

      // Find the OTP record
      const { data: otpRecord, error: fetchError } = await supabase
        .from("whatsapp_otp")
        .select("*")
        .eq("phone_number", formattedPhone)
        .eq("otp_code", otp_code)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !otpRecord) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired OTP" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Mark OTP as verified
      await supabase
        .from("whatsapp_otp")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      // If user_id is provided, update their profile
      if (user_id) {
        await supabase
          .from("profiles")
          .update({ 
            whatsapp_number: formattedPhone,
            whatsapp_verified: true 
          })
          .eq("id", user_id);
      }

      return new Response(
        JSON.stringify({ success: true, message: "OTP verified successfully", verified: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use ?action=send or ?action=verify" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

  } catch (error: any) {
    console.error("Error in whatsapp-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
