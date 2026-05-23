-- 1. Thêm quyền INSERT cho profiles nếu chưa có
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Thêm quyền UPDATE cho profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Tạo function tự động đồng bộ name từ auth metadata sang profiles
CREATE OR REPLACE FUNCTION public.handle_sync_user_names()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', first_name),
    last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', last_name),
    display_name = COALESCE(NEW.raw_user_meta_data->>'display_name', display_name)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger đồng bộ khi metadata thay đổi
DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_metadata_updated
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_sync_user_names();
