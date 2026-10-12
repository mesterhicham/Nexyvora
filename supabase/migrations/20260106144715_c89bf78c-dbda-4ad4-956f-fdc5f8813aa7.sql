-- Fix email_logs INSERT policy - only allow admin inserts
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

-- Create policy that only allows admins to insert email logs
-- Edge Functions using service role key will bypass RLS
CREATE POLICY "Admins can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Create secure views for quiz questions that hide correct answers from students
-- These views will be used by students to view questions without seeing correct_option_index

-- View for formation quiz questions (hides correct_option_index from students)
CREATE OR REPLACE VIEW public.student_formation_quiz_questions AS
SELECT 
  fqq.id,
  fqq.quiz_id,
  fqq.question_text,
  fqq.options,
  fqq.order_index,
  fqq.created_at
FROM public.formation_quiz_questions fqq;

-- View for placement test questions (hides correct_option_index from students)
CREATE OR REPLACE VIEW public.student_placement_test_questions AS
SELECT 
  ptq.id,
  ptq.question_text,
  ptq.options,
  ptq.order_index,
  ptq.points,
  ptq.program_weight,
  ptq.is_active,
  ptq.created_at,
  ptq.updated_at
FROM public.placement_test_questions ptq
WHERE ptq.is_active = true;

-- Grant SELECT on views to authenticated users
GRANT SELECT ON public.student_formation_quiz_questions TO authenticated;
GRANT SELECT ON public.student_placement_test_questions TO authenticated;