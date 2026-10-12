-- Create formation quizzes table
CREATE TABLE public.formation_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  passing_score INTEGER NOT NULL DEFAULT 70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create formation quiz questions table
CREATE TABLE public.formation_quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.formation_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_option_index INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student quiz attempts table
CREATE TABLE public.formation_quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.formation_enrollments(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.formation_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(enrollment_id, quiz_id)
);

-- Add content_type 'quiz' support - update formation_content to support quiz reference
ALTER TABLE public.formation_content 
ADD COLUMN quiz_id UUID REFERENCES public.formation_quizzes(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.formation_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for formation_quizzes
CREATE POLICY "Admins and teachers can manage quizzes"
ON public.formation_quizzes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Enrolled students can view quizzes"
ON public.formation_quizzes FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role) OR
  EXISTS (
    SELECT 1 FROM formation_enrollments fe
    JOIN students s ON fe.student_id = s.id
    WHERE fe.formation_id = formation_quizzes.formation_id
    AND s.user_id = auth.uid()
    AND fe.payment_status = 'approved'
  )
);

-- RLS policies for formation_quiz_questions
CREATE POLICY "Admins and teachers can manage quiz questions"
ON public.formation_quiz_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Enrolled students can view quiz questions"
ON public.formation_quiz_questions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role) OR
  EXISTS (
    SELECT 1 FROM formation_quizzes fq
    JOIN formation_enrollments fe ON fe.formation_id = fq.formation_id
    JOIN students s ON fe.student_id = s.id
    WHERE fq.id = formation_quiz_questions.quiz_id
    AND s.user_id = auth.uid()
    AND fe.payment_status = 'approved'
  )
);

-- RLS policies for formation_quiz_attempts
CREATE POLICY "Students can manage their own attempts"
ON public.formation_quiz_attempts FOR ALL
USING (
  enrollment_id IN (
    SELECT fe.id FROM formation_enrollments fe
    JOIN students s ON fe.student_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and teachers can view all attempts"
ON public.formation_quiz_attempts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));