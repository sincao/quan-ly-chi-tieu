
-- Create dishes table
CREATE TABLE IF NOT EXISTS public.dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create restaurants for dishes
CREATE TABLE IF NOT EXISTS public.dish_restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dish_id UUID REFERENCES public.dishes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    video_link TEXT,
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_restaurants ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Users can manage their own dishes" ON public.dishes;
DROP POLICY IF EXISTS "Users can manage restaurants for their dishes" ON public.dish_restaurants;

-- New detailed policies
CREATE POLICY "Users can view own dishes" ON public.dishes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dishes" ON public.dishes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dishes" ON public.dishes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dishes" ON public.dishes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own dish restaurants" ON public.dish_restaurants FOR SELECT USING (
    dish_id IN (SELECT id FROM public.dishes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert own dish restaurants" ON public.dish_restaurants FOR INSERT WITH CHECK (
    dish_id IN (SELECT id FROM public.dishes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update own dish restaurants" ON public.dish_restaurants FOR UPDATE USING (
    dish_id IN (SELECT id FROM public.dishes WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete own dish restaurants" ON public.dish_restaurants FOR DELETE USING (
    dish_id IN (SELECT id FROM public.dishes WHERE user_id = auth.uid())
);
