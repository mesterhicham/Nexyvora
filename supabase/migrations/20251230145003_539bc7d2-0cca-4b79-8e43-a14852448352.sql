-- Placement test questions table
CREATE TABLE public.placement_test_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_index INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  program_weight JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Student test results table
CREATE TABLE public.student_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  assigned_program_id UUID REFERENCES public.programs(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id)
);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('manual', 'stripe', 'paypal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'refunded')),
  
  -- Manual payment fields
  receipt_url TEXT,
  reference_number TEXT,
  notes TEXT,
  
  -- Online payment fields
  transaction_id TEXT,
  gateway_response JSONB,
  
  -- Admin review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Program pricing table
CREATE TABLE public.program_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.placement_test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_pricing ENABLE ROW LEVEL SECURITY;

-- Placement test questions policies
CREATE POLICY "Admins can manage test questions"
ON public.placement_test_questions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view active questions"
ON public.placement_test_questions FOR SELECT
USING (is_active = true);

-- Student test results policies
CREATE POLICY "Students can view own results"
ON public.student_test_results FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can insert own results"
ON public.student_test_results FOR INSERT
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all results"
ON public.student_test_results FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Payments policies
CREATE POLICY "Students can view own payments"
ON public.payments FOR SELECT
USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own payments"
ON public.payments FOR INSERT
WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all payments"
ON public.payments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Program pricing policies
CREATE POLICY "Anyone can view pricing"
ON public.program_pricing FOR SELECT
USING (true);

CREATE POLICY "Admins can manage pricing"
ON public.program_pricing FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));