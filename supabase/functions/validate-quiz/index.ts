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

    const { action, quizId, enrollmentId, answers } = await req.json();

    console.log(`Processing quiz validation: action=${action}, user=${user.id}`);

    if (action === 'validate-formation-quiz') {
      // Verify the user owns this enrollment
      const { data: enrollment, error: enrollmentError } = await supabaseAdmin
        .from('formation_enrollments')
        .select('id, student_id, students!inner(user_id)')
        .eq('id', enrollmentId)
        .single();

      if (enrollmentError || !enrollment) {
        return new Response(
          JSON.stringify({ error: 'Enrollment not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Type assertion for nested data
      const studentData = enrollment.students as unknown as { user_id: string };
      if (studentData.user_id !== user.id) {
        console.warn(`SECURITY: User ${user.id} attempted to submit quiz for enrollment ${enrollmentId}`);
        return new Response(
          JSON.stringify({ error: 'You do not own this enrollment' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get quiz with questions (server has full access to correct answers)
      const { data: quiz, error: quizError } = await supabaseAdmin
        .from('formation_quizzes')
        .select('id, passing_score, formation_quiz_questions(id, correct_option_index, order_index)')
        .eq('id', quizId)
        .single();

      if (quizError || !quiz) {
        return new Response(
          JSON.stringify({ error: 'Quiz not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sort questions by order_index
      const questions = quiz.formation_quiz_questions.sort((a, b) => a.order_index - b.order_index);

      // Calculate score SERVER-SIDE
      let correctCount = 0;
      questions.forEach((q, index) => {
        if (answers[index] === q.correct_option_index) {
          correctCount++;
        }
      });

      const finalScore = Math.round((correctCount / questions.length) * 100);
      const passed = finalScore >= quiz.passing_score;

      // Store attempt in database
      const { error: attemptError } = await supabaseAdmin
        .from('formation_quiz_attempts')
        .upsert({
          enrollment_id: enrollmentId,
          quiz_id: quizId,
          answers: answers,
          score: finalScore,
          passed: passed,
          completed_at: new Date().toISOString()
        }, {
          onConflict: 'enrollment_id,quiz_id'
        });

      if (attemptError) {
        console.error('Error storing quiz attempt:', attemptError);
        throw attemptError;
      }

      console.log(`Quiz completed: user=${user.id}, quiz=${quizId}, score=${finalScore}, passed=${passed}`);

      return new Response(
        JSON.stringify({ 
          score: finalScore, 
          passed,
          correctAnswers: correctCount,
          totalQuestions: questions.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'validate-placement-test') {
      // Get student record for this user
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError || !student) {
        return new Response(
          JSON.stringify({ error: 'Student record not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already completed
      const { data: existingResult } = await supabaseAdmin
        .from('student_test_results')
        .select('id')
        .eq('student_id', student.id)
        .maybeSingle();

      if (existingResult) {
        return new Response(
          JSON.stringify({ error: 'Placement test already completed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get questions with correct answers (server-side only)
      const { data: questions, error: questionsError } = await supabaseAdmin
        .from('placement_test_questions')
        .select('id, correct_option_index, points, program_weight')
        .eq('is_active', true)
        .order('order_index');

      if (questionsError || !questions) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch questions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate score SERVER-SIDE
      let totalScore = 0;
      let totalPoints = 0;
      const programWeights: Record<string, number> = {};

      questions.forEach((q, index) => {
        const points = q.points || 1;
        totalPoints += points;
        
        if (answers[index] === q.correct_option_index) {
          totalScore += points;
          
          // Accumulate program weights for correct answers
          if (q.program_weight && typeof q.program_weight === 'object') {
            Object.entries(q.program_weight).forEach(([programId, weight]) => {
              programWeights[programId] = (programWeights[programId] || 0) + (weight as number);
            });
          }
        }
      });

      // Determine assigned program based on weights
      let assignedProgramId: string | null = null;
      let maxWeight = 0;
      
      Object.entries(programWeights).forEach(([programId, weight]) => {
        if (weight > maxWeight) {
          maxWeight = weight;
          assignedProgramId = programId;
        }
      });

      // Fallback: if no program weights, use first program
      if (!assignedProgramId) {
        const { data: programs } = await supabaseAdmin
          .from('programs')
          .select('id')
          .limit(1)
          .single();
        assignedProgramId = programs?.id || null;
      }

      // Store test result
      const { error: resultError } = await supabaseAdmin
        .from('student_test_results')
        .insert({
          student_id: student.id,
          answers: answers,
          score: totalScore,
          total_points: totalPoints,
          assigned_program_id: assignedProgramId,
          completed_at: new Date().toISOString()
        });

      if (resultError) {
        console.error('Error storing test result:', resultError);
        throw resultError;
      }

      console.log(`Placement test completed: user=${user.id}, student=${student.id}, score=${totalScore}/${totalPoints}`);

      return new Response(
        JSON.stringify({ 
          score: totalScore,
          totalPoints: totalPoints,
          assignedProgramId: assignedProgramId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in validate-quiz function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
