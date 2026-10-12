-- Create lesson content table for videos and PDFs
CREATE TABLE public.lesson_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf')),
  file_url TEXT NOT NULL,
  duration_seconds INTEGER, -- for videos
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lesson progress table for tracking video completion
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.lesson_content(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lesson_id, content_id, student_id)
);

-- Enable RLS
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- Lesson content policies
CREATE POLICY "Teachers can manage lesson content"
ON public.lesson_content
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Students can view lesson content for their cohort"
ON public.lesson_content
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role) OR
  EXISTS (
    SELECT 1 FROM lessons l
    JOIN students s ON s.cohort_id = l.cohort_id
    WHERE l.id = lesson_content.lesson_id
    AND s.user_id = auth.uid()
  )
);

-- Lesson progress policies  
CREATE POLICY "Students can manage their own progress"
ON public.lesson_progress
FOR ALL
USING (
  student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers and admins can view all progress"
ON public.lesson_progress
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'teacher'::app_role)
);

-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for submissions
CREATE POLICY "Students can upload their submissions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own submissions"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Teachers and admins can view all submissions"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);