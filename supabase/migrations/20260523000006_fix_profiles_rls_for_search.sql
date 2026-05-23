-- Cập nhật policy cho profiles để cho phép tìm kiếm
-- Xoá policy cũ chỉ cho phép xem bản thân
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Tạo policy mới cho phép tất cả người dùng đã đăng nhập có thể xem thông tin cơ bản của người khác
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);
