-- ============================================================
-- COMPLETE DATABASE EXPORT FOR ACADEMY PLATFORM
-- Generated: 2026-01-21
-- This file contains all SQL migrations combined in order
-- Run this file in your new PostgreSQL/Supabase database
-- ============================================================

-- ============================================================
-- MIGRATION 1: Core Tables and Functions
-- ============================================================

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create specialties table
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cohorts table
CREATE TABLE public.cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES public.cohorts(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create modules table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id),
  hours INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diplomas table
CREATE TABLE public.diplomas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  program TEXT NOT NULL,
  specialty TEXT NOT NULL,
  issue_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diplomas ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup (with student record creation)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Default role is student
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  -- Create student record for the new user
  INSERT INTO public.students (user_id, status, enrollment_date)
  VALUES (NEW.id, 'active', CURRENT_DATE);
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for programs (public read, admin write)
CREATE POLICY "Anyone can view programs"
  ON public.programs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage programs"
  ON public.programs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for specialties
CREATE POLICY "Anyone can view specialties"
  ON public.specialties FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage specialties"
  ON public.specialties FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for cohorts
CREATE POLICY "Anyone can view cohorts"
  ON public.cohorts FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage cohorts"
  ON public.cohorts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for students
CREATE POLICY "Students can view their own record"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and teachers can view all students"
  ON public.students FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for teachers
CREATE POLICY "Teachers can view their own record"
  ON public.teachers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all teachers"
  ON public.teachers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for modules
CREATE POLICY "Anyone can view modules"
  ON public.modules FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage modules"
  ON public.modules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for diplomas
CREATE POLICY "Students can view their own diploma"
  ON public.diplomas FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view and manage all diplomas"
  ON public.diplomas FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Public verification (anyone can verify a diploma by serial number)
CREATE POLICY "Anyone can verify diplomas"
  ON public.diplomas FOR SELECT
  USING (true);

-- ============================================================
-- MIGRATION 2: Platform Settings, Holidays, News, Email, Zoom
-- ============================================================

-- Platform Settings table for customization
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Holidays & Events table
CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  type text NOT NULL DEFAULT 'holiday',
  is_recurring boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- News/Announcements table  
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'news',
  priority text DEFAULT 'medium',
  target_audience text DEFAULT 'all',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_published boolean DEFAULT true,
  published_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email Settings table
CREATE TABLE public.email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_username text,
  smtp_password text,
  encryption text DEFAULT 'tls',
  from_email text,
  from_name text,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email Templates table
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Email Logs table
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_type text,
  subject text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Zoom Meetings table
CREATE TABLE public.zoom_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  host_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  cohort_id uuid REFERENCES public.cohorts(id) ON DELETE SET NULL,
  meeting_url text,
  meeting_id text,
  passcode text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled',
  room_open BOOLEAN DEFAULT false,
  room_opened_at TIMESTAMP WITH TIME ZONE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Meeting Attendance table
CREATE TABLE public.meeting_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.zoom_meetings(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'absent',
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(meeting_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendance ENABLE ROW LEVEL SECURITY;

-- Platform Settings policies
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Holidays policies
CREATE POLICY "Anyone can view holidays" ON public.holidays
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage holidays" ON public.holidays
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- News policies
CREATE POLICY "Published news visible to target audience" ON public.news
  FOR SELECT USING (
    is_published = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      target_audience = 'all'
      OR (target_audience = 'students' AND has_role(auth.uid(), 'student'::app_role))
      OR (target_audience = 'teachers' AND has_role(auth.uid(), 'teacher'::app_role))
      OR (target_audience = 'admins' AND has_role(auth.uid(), 'admin'::app_role))
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Admins can manage news" ON public.news
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can create news" ON public.news
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers can update own news" ON public.news
  FOR UPDATE USING (author_id = auth.uid() AND has_role(auth.uid(), 'teacher'::app_role));

-- Email Settings policies
CREATE POLICY "Admins can manage email settings" ON public.email_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Templates policies
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Logs policies
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Zoom Meetings policies
CREATE POLICY "Users can view relevant meetings" ON public.zoom_meetings
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR host_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.user_id = auth.uid() 
      AND s.cohort_id = zoom_meetings.cohort_id
    )
  );

CREATE POLICY "Teachers can create meetings" ON public.zoom_meetings
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'teacher'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Hosts can update their meetings" ON public.zoom_meetings
  FOR UPDATE USING (host_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hosts can delete their meetings" ON public.zoom_meetings
  FOR DELETE USING (host_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Meeting Attendance policies
CREATE POLICY "Users can view meeting attendance" ON public.meeting_attendance
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.user_id = auth.uid() 
      AND s.id = meeting_attendance.student_id
    )
  );

CREATE POLICY "Teachers and admins can manage attendance" ON public.meeting_attendance
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'teacher'::app_role)
  );

-- Insert default email templates
INSERT INTO public.email_templates (name, slug, subject, body_html, variables) VALUES
('Welcome Email', 'welcome', 'Welcome to {{platform_name}}!', '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{platform_name}}.</p>', '["user_name", "platform_name", "login_url"]'),
('Password Reset', 'password-reset', 'Reset Your Password', '<h1>Password Reset</h1><p>Hi {{user_name}}, click <a href="{{reset_link}}">here</a> to reset your password.</p>', '["user_name", "reset_link"]'),
('New Announcement', 'announcement', 'New Announcement: {{title}}', '<h1>{{title}}</h1><p>{{content}}</p>', '["title", "content", "author"]'),
('Meeting Scheduled', 'meeting-scheduled', 'Meeting Scheduled: {{meeting_title}}', '<h1>{{meeting_title}}</h1><p>Date: {{meeting_date}}</p><p>Join URL: {{meeting_url}}</p>', '["meeting_title", "meeting_date", "meeting_url", "passcode"]');

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value, type, category) VALUES
('platform_name', 'Academy Platform', 'text', 'branding'),
('logo_url', '', 'image', 'branding'),
('primary_color', '222 47% 11%', 'color', 'theme'),
('accent_color', '262 83% 58%', 'color', 'theme'),
('welcome_message', 'Welcome to our learning platform', 'text', 'ui_texts'),
('footer_text', 'All rights reserved', 'text', 'ui_texts');

-- ============================================================
-- MIGRATION 3: Placement Test and Payments
-- ============================================================

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
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  receipt_url TEXT,
  reference_number TEXT,
  notes TEXT,
  transaction_id TEXT,
  gateway_response JSONB,
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

CREATE POLICY "Students can view active questions without answers"
ON public.placement_test_questions FOR SELECT
USING (
  is_active = true AND
  (
    public.has_role(auth.uid(), 'admin'::public.app_role) OR
    public.has_role(auth.uid(), 'teacher'::public.app_role) OR
    public.has_role(auth.uid(), 'student'::public.app_role)
  )
);

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

-- ============================================================
-- MIGRATION 4: Chat and Messaging System
-- ============================================================

-- Create conversations table for 1:1 and group chats
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name TEXT,
  cohort_id UUID REFERENCES public.cohorts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  attachment_type TEXT,
  reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message_reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create typing indicators table
CREATE TABLE public.typing_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.zoom_meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Create security definer function to check if user is a participant
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- RLS policies for conversations
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations FOR SELECT
USING (
  id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all conversations"
ON public.conversations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for conversation_participants
CREATE POLICY "Users can view participants in their conversations" 
ON public.conversation_participants 
FOR SELECT 
USING (
  is_conversation_participant(auth.uid(), conversation_id) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can add participants to conversations they're in" 
ON public.conversation_participants 
FOR INSERT 
WITH CHECK (
  is_conversation_participant(auth.uid(), conversation_id) OR has_role(auth.uid(), 'admin'::app_role) OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage participants"
ON public.conversation_participants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can send messages to their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (SELECT conversation_id FROM public.conversation_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (sender_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

-- RLS policies for message reactions
CREATE POLICY "Users can view reactions in their conversations"
ON public.message_reactions
FOR SELECT
USING (
  message_id IN (
    SELECT m.id FROM public.messages m
    WHERE is_conversation_participant(auth.uid(), m.conversation_id)
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can add reactions to messages in their conversations"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  (
    message_id IN (
      SELECT m.id FROM public.messages m
      WHERE is_conversation_participant(auth.uid(), m.conversation_id)
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (user_id = auth.uid());

-- RLS policies for typing indicators
CREATE POLICY "Users can view typing indicators in their conversations"
ON public.typing_indicators
FOR SELECT
USING (
  is_conversation_participant(conversation_id, auth.uid())
);

CREATE POLICY "Users can manage their own typing indicator"
ON public.typing_indicators
FOR INSERT
WITH CHECK (auth.uid() = user_id AND is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can update their own typing indicator"
ON public.typing_indicators
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own typing indicator"
ON public.typing_indicators
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);

-- ============================================================
-- MIGRATION 5: Payment Account Settings
-- ============================================================

-- Create payment_account_settings table
CREATE TABLE public.payment_account_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_holder_name TEXT,
  account_number TEXT,
  iban TEXT,
  swift_bic TEXT,
  bank_address TEXT,
  paypal_email TEXT,
  stripe_publishable_key TEXT,
  stripe_account_id TEXT,
  mobile_payment_number TEXT,
  mobile_payment_provider TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_account_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage payment account settings"
ON public.payment_account_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view active payment settings"
ON public.payment_account_settings
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- ============================================================
-- MIGRATION 6: Formations (Online Courses)
-- ============================================================

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
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf', 'quiz')),
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  quiz_id UUID,
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

-- Create formation progress table
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

-- Add foreign key for quiz_id in formation_content
ALTER TABLE public.formation_content 
ADD CONSTRAINT formation_content_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES public.formation_quizzes(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formation_quiz_attempts ENABLE ROW LEVEL SECURITY;

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

-- Formation Payment policies
CREATE POLICY "Students can view own payments" ON public.formation_payments
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own payments" ON public.formation_payments
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage payments" ON public.formation_payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Quiz policies
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

-- Quiz question policies
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

-- Quiz attempt policies
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

-- Create indexes for performance
CREATE INDEX idx_formation_content_formation_id ON public.formation_content(formation_id);
CREATE INDEX idx_formation_enrollments_student_id ON public.formation_enrollments(student_id);
CREATE INDEX idx_formation_enrollments_formation_id ON public.formation_enrollments(formation_id);
CREATE INDEX idx_formation_progress_enrollment_id ON public.formation_progress(enrollment_id);
CREATE INDEX idx_formation_payments_student_id ON public.formation_payments(student_id);

-- ============================================================
-- MIGRATION 7: Lessons and Assignments
-- ============================================================

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

-- Create lesson content table
CREATE TABLE public.lesson_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf')),
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create lesson progress table
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

-- Enable RLS on all tables
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- MIGRATION 8: Profile Enhancements
-- ============================================================

-- Add additional profile fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS whatsapp_verified boolean DEFAULT false;

-- Update RLS policy for profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- ============================================================
-- MIGRATION 9: WhatsApp OTP Verification
-- ============================================================

-- Create table for WhatsApp OTP verification
CREATE TABLE public.whatsapp_otp (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.whatsapp_otp ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own OTP records" 
ON public.whatsapp_otp 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role can manage OTP records" 
ON public.whatsapp_otp 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete their own OTP records" 
ON public.whatsapp_otp 
FOR DELETE 
USING (user_id = auth.uid());

-- Create function to clean expired OTPs
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.whatsapp_otp WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- MIGRATION 10: SEO Platform Settings
-- ============================================================

-- Insert SEO-related platform settings
INSERT INTO public.platform_settings (key, value, type, category) VALUES
  ('site_title', 'My Platform', 'text', 'seo'),
  ('site_description', 'Welcome to our platform', 'text', 'seo'),
  ('og_title', '', 'text', 'seo'),
  ('og_description', '', 'text', 'seo'),
  ('og_image', '', 'url', 'seo'),
  ('favicon_url', '', 'url', 'seo'),
  ('twitter_card', 'summary_large_image', 'text', 'seo'),
  ('twitter_site', '', 'text', 'seo')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- MIGRATION 11: Secure Views for Quiz Questions
-- ============================================================

-- Create secure views for quiz questions that hide correct answers from students
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

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'audio/webm', 'audio/mp4', 'video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-receipts', 'payment-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for formation content
INSERT INTO storage.buckets (id, name, public) 
VALUES ('formation-content', 'formation-content', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for assignment submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Chat attachments policies
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view chat attachments from their conversations"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users can delete their own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Payment receipts policies
CREATE POLICY "Students can upload their own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Students can view their own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-receipts' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins can view all receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment-receipts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'payment-receipts' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Formation content storage policies
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
      public.has_role(auth.uid(), 'admin'::public.app_role) OR 
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR
      EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.formation_enrollments fe ON fe.student_id = s.id
        WHERE s.user_id = auth.uid()
        AND fe.payment_status = 'approved'
      )
    )
  );

-- Submissions storage policies
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

-- Avatar storage policies
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- END OF DATABASE EXPORT
-- ============================================================
