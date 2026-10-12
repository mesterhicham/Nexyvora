
-- Create formations (courses) table
CREATE TABLE public.formations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create formation content table (videos and PDFs)
CREATE TABLE public.formation_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf')),
  file_url TEXT NOT NULL,
  duration_seconds INTEGER, -- for videos
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create formation enrollments table
CREATE TABLE public.formation_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  payment_id UUID,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(formation_id, student_id)
);

-- Create formation progress table (track video completion)
CREATE TABLE public.formation_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.formation_enrollments(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.formation_content(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(enrollment_id, content_id)
);

-- Create formation payments table
CREATE TABLE public.formation_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id UUID NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  receipt_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_payments ENABLE ROW LEVEL SECURITY;

-- Formations policies
CREATE POLICY "Anyone can view published formations" ON public.formations
  FOR SELECT USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Admins and teachers can manage formations" ON public.formations
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Formation content policies
CREATE POLICY "Enrolled students can view content" ON public.formation_content
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'teacher'::app_role) OR
    EXISTS (
      SELECT 1 FROM formation_enrollments fe
      JOIN students s ON fe.student_id = s.id
      WHERE fe.formation_id = formation_content.formation_id
      AND s.user_id = auth.uid()
      AND fe.payment_status = 'approved'
    )
  );

CREATE POLICY "Admins and teachers can manage content" ON public.formation_content
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Enrollment policies
CREATE POLICY "Students can view own enrollments" ON public.formation_enrollments
  FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid()) OR
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Students can create own enrollments" ON public.formation_enrollments
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage enrollments" ON public.formation_enrollments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Progress policies
CREATE POLICY "Students can view own progress" ON public.formation_progress
  FOR SELECT USING (
    enrollment_id IN (
      SELECT fe.id FROM formation_enrollments fe
      JOIN students s ON fe.student_id = s.id
      WHERE s.user_id = auth.uid()
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Students can update own progress" ON public.formation_progress
  FOR ALL USING (
    enrollment_id IN (
      SELECT fe.id FROM formation_enrollments fe
      JOIN students s ON fe.student_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );

-- Payment policies
CREATE POLICY "Students can view own payments" ON public.formation_payments
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own payments" ON public.formation_payments
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage payments" ON public.formation_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for formation content
INSERT INTO storage.buckets (id, name, public) VALUES ('formation-content', 'formation-content', false);

-- Storage policies for formation content
CREATE POLICY "Admins and teachers can upload formation content" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'formation-content' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Admins and teachers can update formation content" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'formation-content' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Admins and teachers can delete formation content" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'formation-content' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Enrolled students can view formation content files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'formation-content' AND
    (
      has_role(auth.uid(), 'admin'::app_role) OR 
      has_role(auth.uid(), 'teacher'::app_role) OR
      auth.uid() IS NOT NULL
    )
  );

-- Create indexes for performance
CREATE INDEX idx_formation_content_formation_id ON public.formation_content(formation_id);
CREATE INDEX idx_formation_enrollments_student_id ON public.formation_enrollments(student_id);
CREATE INDEX idx_formation_enrollments_formation_id ON public.formation_enrollments(formation_id);
CREATE INDEX idx_formation_progress_enrollment_id ON public.formation_progress(enrollment_id);
CREATE INDEX idx_formation_payments_student_id ON public.formation_payments(student_id);
