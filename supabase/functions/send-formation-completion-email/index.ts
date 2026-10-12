import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CompletionEmailRequest {
  certificateId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authentication check
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

    const { certificateId }: CompletionEmailRequest = await req.json();

    if (!certificateId) {
      return new Response(
        JSON.stringify({ error: 'Certificate ID is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${user.id} requesting completion email for certificate: ${certificateId}`);

    // Fetch certificate and verify ownership
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('formation_enrollments')
      .select(`
        id,
        student_id,
        formation_id,
        students!inner (
          id,
          user_id
        ),
        formations!inner (
          title
        )
      `)
      .eq('id', certificateId)
      .eq('payment_status', 'approved')
      .single();

    if (enrollmentError || !enrollment) {
      console.error('Enrollment not found or not approved:', enrollmentError);
      return new Response(
        JSON.stringify({ error: 'Certificate not found or not authorized' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user owns this certificate (is the student) or is an admin
    const studentUserId = (enrollment.students as any).user_id;
    
    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (studentUserId !== user.id && !adminRole) {
      console.error('User not authorized for this certificate:', user.id);
      return new Response(
        JSON.stringify({ error: 'Forbidden - not authorized for this certificate' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', studentUserId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'Student profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const studentEmail = profile.email;
    const studentName = profile.full_name || 'Student';
    const formationTitle = (enrollment.formations as any).title;
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`Sending completion email to ${studentEmail} for formation: ${formationTitle}`);

    const emailResponse = await resend.emails.send({
      from: "Formation Certificates <onboarding@resend.dev>",
      to: [studentEmail],
      subject: `🎉 Congratulations! You've completed "${formationTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f2557, #1a365d); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .certificate-box { background: white; border: 2px solid #d4af37; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .certificate-id { font-family: monospace; font-size: 14px; color: #666; }
            .button { display: inline-block; background: #d4af37; color: #0f2557; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Dear <strong>${studentName}</strong>,</p>
              
              <p>We are thrilled to inform you that you have successfully completed the course:</p>
              
              <div class="certificate-box">
                <h2 style="color: #0f2557; margin-bottom: 10px;">${formationTitle}</h2>
                <p style="margin: 5px 0;"><strong>Completion Date:</strong> ${completionDate}</p>
                <p class="certificate-id"><strong>Certificate ID:</strong> ${certificateId}</p>
              </div>
              
              <p>Your dedication and hard work have paid off! You can now download your official certificate from your dashboard.</p>
              
              <p>This certificate recognizes your achievement and can be used to demonstrate your newly acquired skills.</p>
              
              <p style="margin-top: 25px;">Keep up the great work and continue learning!</p>
              
              <p>Best regards,<br><strong>The Learning Platform Team</strong></p>
            </div>
            <div class="footer">
              <p>This email was sent automatically. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Formation completion email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-formation-completion-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
