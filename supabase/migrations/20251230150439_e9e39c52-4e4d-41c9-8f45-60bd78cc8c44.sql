-- Update the handle_new_user function to also create a student record
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