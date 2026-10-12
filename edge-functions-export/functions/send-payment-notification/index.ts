import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentNotificationRequest {
  paymentId: string;
  status: 'approved' | 'rejected';
  adminNotes?: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Education Platform <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check - verify the caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid or expired token:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('User is not an admin:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { paymentId, status, adminNotes }: PaymentNotificationRequest = await req.json();
    
    console.log(`Admin ${user.id} processing payment notification for payment ${paymentId}, status: ${status}`);

    // Get payment details with student info
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        id,
        amount,
        currency,
        payment_method,
        student_id,
        program_id,
        programs (name)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Failed to fetch payment:', paymentError);
      throw new Error('Payment not found');
    }

    // Get student user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', payment.student_id)
      .single();

    if (studentError || !student) {
      console.error('Failed to fetch student:', studentError);
      throw new Error('Student not found');
    }

    // Get student profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', student.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch profile:', profileError);
      throw new Error('Student profile not found');
    }

    const studentName = profile.full_name || 'Student';
    const studentEmail = profile.email;
    const programName = (payment.programs as any)?.name || 'your program';
    const amount = `${payment.amount} ${payment.currency || 'MAD'}`;

    console.log(`Sending ${status} email to ${studentEmail}`);

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = '✅ Payment Approved - Welcome!';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Approved!</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Dear ${studentName},</p>
            <p style="font-size: 16px; color: #374151;">
              Great news! Your payment of <strong>${amount}</strong> for <strong>${programName}</strong> has been approved.
            </p>
            <div style="background: #ecfdf5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                You now have full access to your courses and learning materials. Log in to start your journey!
              </p>
            </div>
            ${adminNotes ? `<p style="font-size: 14px; color: #6b7280;"><strong>Note from admin:</strong> ${adminNotes}</p>` : ''}
            <p style="font-size: 16px; color: #374151;">
              Best regards,<br>
              The Education Team
            </p>
          </div>
        </div>
      `;
    } else {
      subject = '❌ Payment Rejected - Action Required';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Payment Rejected</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151;">Dear ${studentName},</p>
            <p style="font-size: 16px; color: #374151;">
              Unfortunately, your payment of <strong>${amount}</strong> for <strong>${programName}</strong> could not be approved.
            </p>
            <div style="background: #fef2f2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b;">
                ${adminNotes || 'Please contact the administration for more details or try submitting a new payment.'}
              </p>
            </div>
            <p style="font-size: 16px; color: #374151;">
              If you have questions, please reach out to our support team.
            </p>
            <p style="font-size: 16px; color: #374151;">
              Best regards,<br>
              The Education Team
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await sendEmail(studentEmail, subject, htmlContent);

    console.log("Email sent successfully:", emailResponse);

    // Log the email
    await supabase.from('email_logs').insert({
      recipient_email: studentEmail,
      recipient_name: studentName,
      recipient_type: 'student',
      subject,
      body_html: htmlContent,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-payment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
