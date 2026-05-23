-- 1. Thêm cột tieugon_id vào bảng profiles (giữ tên cột trong DB để tránh break queries hiện tại, nhưng label hiển thị là ID)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tieugon_id TEXT UNIQUE;

-- 2. Tạo function để sinh ID ngẫu nhiên (chỉ gồm 6 ký tự, không còn tiền tố tg_)
CREATE OR REPLACE FUNCTION generate_tieugon_id() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Xoá tiền tố tg_ cho các ID hiện tại (nếu có)
UPDATE public.profiles 
SET tieugon_id = REPLACE(tieugon_id, 'tg_', '') 
WHERE tieugon_id LIKE 'tg_%';

-- 4. Đảm bảo các profile chưa có ID sẽ được cấp ID mới (không tiền tố)
UPDATE public.profiles 
SET tieugon_id = generate_tieugon_id() 
WHERE tieugon_id IS NULL;

-- 5. Cập nhật trigger để tự động cấp ID mới không tiền tố
CREATE OR REPLACE FUNCTION public.handle_new_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tieugon_id IS NULL THEN
    NEW.tieugon_id := generate_tieugon_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
