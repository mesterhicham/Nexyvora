import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contentId } = await req.json();

    if (!contentId) {
      return new Response(
        JSON.stringify({ error: 'Content ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching content URL: contentId=${contentId}, user=${user.id}`);

    // Get content details
    const { data: content, error: contentError } = await supabaseAdmin
      .from('formation_content')
      .select('id, file_url, formation_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return new Response(
        JSON.stringify({ error: 'Content not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or teacher (they have full access)
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdminOrTeacher = userRole?.role === 'admin' || userRole?.role === 'teacher';

    if (!isAdminOrTeacher) {
      // For students, verify they have an approved enrollment
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!student) {
        return new Response(
          JSON.stringify({ error: 'Student record not found' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('formation_enrollments')
        .select('id, payment_status')
        .eq('formation_id', content.formation_id)
        .eq('student_id', student.id)
        .eq('payment_status', 'approved')
        .maybeSingle();

      if (!enrollment) {
        console.warn(`SECURITY: User ${user.id} attempted to access content ${contentId} without approved enrollment`);
        return new Response(
          JSON.stringify({ error: 'You do not have access to this content. Payment approval required.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate signed URL with 1 hour expiry
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('formation-content')
      .createSignedUrl(content.file_url, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate content URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Content URL generated: contentId=${contentId}, user=${user.id}, role=${userRole?.role || 'student'}`);

    return new Response(
      JSON.stringify({ url: signedUrlData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-formation-content-url function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
