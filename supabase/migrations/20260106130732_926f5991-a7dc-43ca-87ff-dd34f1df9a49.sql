-- Create lessons table
CREATE TABLE public.lessons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    materials_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL,
    cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_grade INTEGER DEFAULT 100,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submission_url TEXT,
    submission_text TEXT,
    grade INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
    UNIQUE(assignment_id, student_id)
);

-- Create lesson attendance table
CREATE TABLE public.lesson_attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'absent' CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    marked_by UUID,
    UNIQUE(lesson_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;

-- Lessons policies
CREATE POLICY "Teachers can manage their lessons" ON public.lessons
FOR ALL USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view lessons for their cohort" ON public.lessons
FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role) OR
    cohort_id IN (SELECT cohort_id FROM students WHERE user_id = auth.uid())
);

-- Assignments policies
CREATE POLICY "Teachers can manage their assignments" ON public.assignments
FOR ALL USING (teacher_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view assignments for their cohort" ON public.assignments
FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role) OR
    cohort_id IN (SELECT cohort_id FROM students WHERE user_id = auth.uid())
);

-- Submissions policies
CREATE POLICY "Students can manage their own submissions" ON public.assignment_submissions
FOR ALL USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

CREATE POLICY "Teachers can view and grade submissions" ON public.assignment_submissions
FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role)
);

-- Lesson attendance policies
CREATE POLICY "Teachers can manage lesson attendance" ON public.lesson_attendance
FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Students can view their own attendance" ON public.lesson_attendance
FOR SELECT USING (
    student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);