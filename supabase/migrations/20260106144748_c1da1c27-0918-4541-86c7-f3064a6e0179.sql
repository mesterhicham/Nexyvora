-- Fix the views to use SECURITY INVOKER instead of default SECURITY DEFINER

-- Drop and recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.student_formation_quiz_questions;
DROP VIEW IF EXISTS public.student_placement_test_questions;

-- Recreate formation quiz questions view with SECURITY INVOKER
CREATE VIEW public.student_formation_quiz_questions 
WITH (security_invoker = on) AS
SELECT 
  fqq.id,
  fqq.quiz_id,
  fqq.question_text,
  fqq.options,
  fqq.order_index,
  fqq.created_at
FROM public.formation_quiz_questions fqq;

-- Recreate placement test questions view with SECURITY INVOKER
CREATE VIEW public.student_placement_test_questions
WITH (security_invoker = on) AS
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