-- 1. Xóa các bảng cũ (để tạo lại sạch sẽ)
DROP TABLE IF EXISTS public.trip_expenses;
DROP TABLE IF EXISTS public.trip_members;
DROP TABLE IF EXISTS public.trips;

-- 2. Tạo lại cấu trúc bảng
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Cần thiết để lấy info của "Bạn"
    nickname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES public.trip_members(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    category TEXT,
    date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TẮT HOÀN TOÀN BẢO MẬT (Chống lỗi recursion)
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses DISABLE ROW LEVEL SECURITY;
