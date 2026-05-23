-- Update campaigns to support daily savings logic
ALTER TABLE public.campaigns 
RENAME COLUMN target_amount TO daily_savings;

-- Add violation tracking to members
ALTER TABLE public.campaign_members 
ADD COLUMN IF NOT EXISTS last_violation_date DATE;

-- Update creator logic in campaigns
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS description TEXT;
