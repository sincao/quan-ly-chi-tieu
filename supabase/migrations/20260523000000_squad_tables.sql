-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '💰',
    target_amount BIGINT NOT NULL,
    current_amount BIGINT DEFAULT 0,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Campaign Members
CREATE TABLE IF NOT EXISTS public.campaign_members (
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (campaign_id, user_id)
);

-- 3. Duels Table
CREATE TABLE IF NOT EXISTS public.duels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    opponent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    creator_score BIGINT DEFAULT 0,
    opponent_score BIGINT DEFAULT 0,
    stake TEXT,
    status TEXT CHECK (status IN ('active', 'finished')) DEFAULT 'active',
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duels ENABLE ROW LEVEL SECURITY;

-- Policies for Campaigns
CREATE POLICY "Anyone can view campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Users can create campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policies for Campaign Members
CREATE POLICY "Anyone can view campaign members" ON public.campaign_members FOR SELECT USING (true);
CREATE POLICY "Users can join campaigns" ON public.campaign_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave campaigns" ON public.campaign_members FOR DELETE USING (auth.uid() = user_id);

-- Policies for Duels
CREATE POLICY "Users can view their own duels" ON public.duels FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create duels" ON public.duels FOR INSERT WITH CHECK (auth.uid() = creator_id);

