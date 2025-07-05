
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'admin');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role DEFAULT 'user'::app_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usecases table
CREATE TABLE public.usecases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  department TEXT NOT NULL,
  task TEXT NOT NULL,
  generated_usecases JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompt_submissions table
CREATE TABLE public.prompt_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  usecase TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  evaluation JSONB NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usecases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_submissions ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Usecases policies
CREATE POLICY "Users can manage own usecases" ON public.usecases
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usecases" ON public.usecases
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Prompt submissions policies
CREATE POLICY "Users can manage own submissions" ON public.prompt_submissions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.prompt_submissions
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
