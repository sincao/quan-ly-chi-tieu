-- Add email to profiles for searchability
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index for faster search
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);
