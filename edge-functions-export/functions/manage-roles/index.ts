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
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, role, setupKey } = await req.json();

    console.log(`Processing action: ${action} for user: ${userId}`);

    if (action === 'check-admin-exists') {
      // Check if any admin exists
      const { data: admins, error } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) {
        console.error('Error checking admins:', error);
        throw error;
      }

      return new Response(
        JSON.stringify({ hasAdmin: admins && admins.length > 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'setup-first-admin') {
      // SECURITY: Require authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized - Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the token and get authenticated user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authenticatedUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !authenticatedUser) {
        return new Response(
          JSON.stringify({ error: 'Invalid authentication token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // SECURITY: Verify user can only make themselves admin (prevent privilege escalation)
      if (authenticatedUser.id !== userId) {
        console.warn(`SECURITY: User ${authenticatedUser.id} attempted to make ${userId} admin`);
        return new Response(
          JSON.stringify({ error: 'Cannot assign admin role to different user' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Only allow if no admin exists
      const { data: admins, error: checkError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (checkError) {
        console.error('Error checking admins:', checkError);
        throw checkError;
      }

      if (admins && admins.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Admin already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user's role to admin (use verified user.id, not request userId)
      const { error: updateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', authenticatedUser.id);

      if (updateError) {
        console.error('Error updating role:', updateError);
        throw updateError;
      }

      // SECURITY: Log the action for audit trail
      console.log(`SECURITY: User ${authenticatedUser.id} (${authenticatedUser.email}) became first admin at ${new Date().toISOString()}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Admin role assigned successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update-role') {
      // Get the requesting user's ID from the authorization header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the requesting user is an admin
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

      if (authError || !requestingUser) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if requesting user is admin
      const { data: adminCheck } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!adminCheck) {
        return new Response(
          JSON.stringify({ error: 'Only admins can update roles' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the current role before updating
      const { data: currentRoleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const oldRole = currentRoleData?.role;

      // Update the target user's role
      const { error: updateError } = await supabaseAdmin
        .from('user_roles')
        .update({ role: role })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating role:', updateError);
        throw updateError;
      }

      // Handle role-specific record management
      if (role === 'student' && oldRole !== 'student') {
        // Create student record if doesn't exist
        const { data: existingStudent } = await supabaseAdmin
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!existingStudent) {
          const { error: studentError } = await supabaseAdmin
            .from('students')
            .insert({ user_id: userId, status: 'active', enrollment_date: new Date().toISOString().split('T')[0] });
          
          if (studentError) {
            console.error('Error creating student record:', studentError);
          } else {
            console.log(`Created student record for user ${userId}`);
          }
        }
      }

      if (role === 'teacher' && oldRole !== 'teacher') {
        // Create teacher record if doesn't exist
        const { data: existingTeacher } = await supabaseAdmin
          .from('teachers')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!existingTeacher) {
          const { error: teacherError } = await supabaseAdmin
            .from('teachers')
            .insert({ user_id: userId, status: 'active', hire_date: new Date().toISOString().split('T')[0] });
          
          if (teacherError) {
            console.error('Error creating teacher record:', teacherError);
          } else {
            console.log(`Created teacher record for user ${userId}`);
          }
        }
      }

      console.log(`User ${userId} role updated from ${oldRole} to ${role}`);

      return new Response(
        JSON.stringify({ success: true, message: `Role updated to ${role}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-roles function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
