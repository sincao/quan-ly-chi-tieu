-- Function to update duel scores when a transaction is added/updated/deleted
CREATE OR REPLACE FUNCTION public.handle_duel_score_update()
RETURNS TRIGGER AS $$
DECLARE
    duel_rec RECORD;
BEGIN
    -- Only process expenses for 'spending' type duels
    -- We'll search for active 'spending' duels involving the user of the transaction
    FOR duel_rec IN 
        SELECT * FROM public.duels 
        WHERE status = 'active' 
        AND challenge_type = 'spending'
        AND (creator_id = COALESCE(NEW.user_id, OLD.user_id) OR opponent_id = COALESCE(NEW.user_id, OLD.user_id))
    LOOP
        -- Calculate total spending for creator during duel period
        UPDATE public.duels
        SET creator_score = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions
            WHERE user_id = duel_rec.creator_id
            AND type = 'expense'
            AND date >= duel_rec.created_at::date
            AND date <= duel_rec.end_date::date
        ),
        opponent_score = (
            SELECT COALESCE(SUM(amount), 0)
            FROM public.transactions
            WHERE user_id = duel_rec.opponent_id
            AND type = 'expense'
            AND date >= duel_rec.created_at::date
            AND date <= duel_rec.end_date::date
        )
        WHERE id = duel_rec.id;
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for any transaction changes
DROP TRIGGER IF EXISTS on_transaction_for_duel ON public.transactions;
CREATE TRIGGER on_transaction_for_duel
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_duel_score_update();
