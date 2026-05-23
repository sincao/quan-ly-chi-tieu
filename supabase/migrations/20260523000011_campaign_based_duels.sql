-- 1. Add campaign_id to duels and update challenge_type
ALTER TABLE public.duels 
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE;

ALTER TABLE public.duels 
DROP CONSTRAINT IF EXISTS duels_challenge_type_check;

ALTER TABLE public.duels 
ADD CONSTRAINT duels_challenge_type_check 
CHECK (challenge_type IN ('campaign_savings', 'campaign_violations', 'campaign_streaks'));

-- 2. New Scoring Logic based on Campaign
CREATE OR REPLACE FUNCTION public.sync_duel_scores_campaign(p_duel_id UUID)
RETURNS VOID AS 70456
DECLARE
    duel_rec RECORD;
    camp_rec RECORD;
BEGIN
    SELECT * INTO duel_rec FROM public.duels WHERE id = p_duel_id;
    SELECT * INTO camp_rec FROM public.campaigns WHERE id = duel_rec.campaign_id;

    IF duel_rec.challenge_type = 'campaign_savings' THEN
        -- Calculation: (Days * Daily Savings) - Total Spent
        UPDATE public.duels
        SET creator_score = (
            SELECT (GREATEST(1, EXTRACT(DAY FROM (now() - created_at)))::int * camp_rec.daily_savings) - COALESCE(SUM(amount), 0)
            FROM public.transactions
            WHERE user_id = duel_rec.creator_id
            AND type = 'expense'
            AND date >= camp_rec.created_at::date
        ),
        opponent_score = (
            SELECT (GREATEST(1, EXTRACT(DAY FROM (now() - created_at)))::int * camp_rec.daily_savings) - COALESCE(SUM(amount), 0)
            FROM public.transactions
            WHERE user_id = duel_rec.opponent_id
            AND type = 'expense'
            AND date >= camp_rec.created_at::date
        )
        WHERE id = p_duel_id;

    ELSIF duel_rec.challenge_type = 'campaign_violations' THEN
        -- Calculation: Number of days where total spent > daily_savings
        UPDATE public.duels
        SET creator_score = (
            SELECT COUNT(*) FROM (
                SELECT date, SUM(amount) as day_total
                FROM public.transactions
                WHERE user_id = duel_rec.creator_id AND type = 'expense' AND date >= camp_rec.created_at::date
                GROUP BY date HAVING SUM(amount) > camp_rec.daily_savings
            ) as violations
        ),
        opponent_score = (
            SELECT COUNT(*) FROM (
                SELECT date, SUM(amount) as day_total
                FROM public.transactions
                WHERE user_id = duel_rec.opponent_id AND type = 'expense' AND date >= camp_rec.created_at::date
                GROUP BY date HAVING SUM(amount) > camp_rec.daily_savings
            ) as violations
        )
        WHERE id = p_duel_id;

    ELSIF duel_rec.challenge_type = 'campaign_streaks' THEN
        -- Use current streak from profiles for simplicity in this version
        UPDATE public.duels
        SET creator_score = (SELECT current_streak FROM public.profiles WHERE id = duel_rec.creator_id),
        opponent_score = (SELECT current_streak FROM public.profiles WHERE id = duel_rec.opponent_id)
        WHERE id = p_duel_id;
    END IF;
END;
70456 LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update triggers to use campaign logic
CREATE OR REPLACE FUNCTION public.handle_duel_sync_trigger()
RETURNS TRIGGER AS 70456
BEGIN
    IF TG_TABLE_NAME = 'duels' THEN
        PERFORM public.sync_duel_scores_campaign(NEW.id);
    ELSE
        -- For transactions, update all active duels linked to that user
        DECLARE
            d_id UUID;
        BEGIN
            FOR d_id IN SELECT id FROM public.duels WHERE status = 'active' AND (creator_id = COALESCE(NEW.user_id, OLD.user_id) OR opponent_id = COALESCE(NEW.user_id, OLD.user_id))
            LOOP
                PERFORM public.sync_duel_scores_campaign(d_id);
            END LOOP;
        END;
    END IF;
    RETURN NULL;
END;
70456 LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_duel_sync ON public.duels;
CREATE TRIGGER on_new_duel_sync AFTER INSERT ON public.duels FOR EACH ROW EXECUTE FUNCTION public.handle_duel_sync_trigger();

DROP TRIGGER IF EXISTS on_transaction_for_duel ON public.transactions;
CREATE TRIGGER on_transaction_for_duel AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_duel_sync_trigger();
