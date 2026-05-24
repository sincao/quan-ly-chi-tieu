
-- 1. Drop existing fragmented triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_sync_user_email();
DROP FUNCTION IF EXISTS public.handle_sync_user_names();

-- 2. Ensure the tieugon_id trigger exists on public.profiles
DROP TRIGGER IF EXISTS on_profile_created_id ON public.profiles;
CREATE TRIGGER on_profile_created_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_id();

-- 3. Create a unified sync function for auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_auth_user_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- We use UPSERT logic to handle both creation and updates
  -- This ensures the profile exists even if the frontend insert fails
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    display_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    first_name = CASE 
      WHEN EXCLUDED.first_name <> '' THEN EXCLUDED.first_name 
      ELSE public.profiles.first_name 
    END,
    last_name = CASE 
      WHEN EXCLUDED.last_name <> '' THEN EXCLUDED.last_name 
      ELSE public.profiles.last_name 
    END,
    display_name = CASE 
      WHEN EXCLUDED.display_name <> '' AND EXCLUDED.display_name <> EXCLUDED.email THEN EXCLUDED.display_name 
      ELSE public.profiles.display_name 
    END,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the unified trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_sync ON auth.users;
CREATE TRIGGER on_auth_user_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_sync();
