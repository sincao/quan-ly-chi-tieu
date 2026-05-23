-- Add challenge_type to duels table
ALTER TABLE public.duels 
ADD COLUMN IF NOT EXISTS challenge_type TEXT CHECK (challenge_type IN ('spending', 'violation', 'saving')) DEFAULT 'spending';
