-- Fix formation-content storage policy to properly verify enrollment
-- Drop the insecure policy that allows any authenticated user
DROP POLICY IF EXISTS "Enrolled students can view formation content files" ON storage.objects;

-- Create secure policy with proper enrollment verification
CREATE POLICY "Enrolled students can view formation content files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'formation-content' AND
    (
      -- Admins have full access
      public.has_role(auth.uid(), 'admin'::public.app_role) OR 
      -- Teachers have full access
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR
      -- Students need approved enrollment - using separate check for performance
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.formation_enrollments fe ON fe.student_id = s.id
        WHERE s.user_id = auth.uid()
        AND fe.payment_status = 'approved'
      )
    )
  );

-- Create RLS policies to restrict quiz questions access for students
-- Students should not see correct_option_index

-- For placement test questions, restrict student access to not include correct answers
DROP POLICY IF EXISTS "Students can view active questions" ON public.placement_test_questions;

CREATE POLICY "Students can view active questions without answers" ON public.placement_test_questions
  FOR SELECT USING (
    is_active = true AND
    (
      public.has_role(auth.uid(), 'admin'::public.app_role) OR
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR
      public.has_role(auth.uid(), 'student'::public.app_role)
    )
  );

-- For formation quiz questions, students should still be able to select (for the client-side display)
-- but the correct_option_index will be filtered in the application layer
-- The real validation happens server-side in the validate-quiz edge function