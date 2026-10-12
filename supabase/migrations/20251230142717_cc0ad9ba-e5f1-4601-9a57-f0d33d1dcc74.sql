-- Platform Settings table for customization
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  type text NOT NULL DEFAULT 'text', -- text, color, image, json
  category text NOT NULL DEFAULT 'general', -- branding, theme, ui_texts
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
  type text NOT NULL DEFAULT 'holiday', -- holiday, event, break
  is_recurring boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- News/Announcements table  
CREATE TABLE public.news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'news', -- news, announcement, update, exam_result
  priority text DEFAULT 'medium', -- low, medium, high
  target_audience text DEFAULT 'all', -- all, students, teachers, admins
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
  smtp_password text, -- encrypted
  encryption text DEFAULT 'tls', -- none, ssl, tls
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
  variables jsonb DEFAULT '[]', -- available template variables
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
  recipient_type text, -- student, teacher, admin
  subject text NOT NULL,
  body_html text,
  status text NOT NULL DEFAULT 'pending', -- pending, sent, failed
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
  status text DEFAULT 'scheduled', -- scheduled, started, ended, cancelled
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Meeting Attendance table
CREATE TABLE public.meeting_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.zoom_meetings(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'absent', -- present, absent, late
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

-- Platform Settings policies (admins only for management, public read for non-sensitive)
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage platform settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Holidays policies (public read, admin manage)
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

-- Email Settings policies (admins only)
CREATE POLICY "Admins can manage email settings" ON public.email_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Templates policies (admins only)
CREATE POLICY "Admins can manage email templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Email Logs policies (admins can view all)
CREATE POLICY "Admins can view email logs" ON public.email_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (true);

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