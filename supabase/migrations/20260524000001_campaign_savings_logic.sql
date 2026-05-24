
-- Function to calculate savings for a user in a specific campaign context
-- Savings = (Daily Budget * Days Passed) - (Total Expenses in Campaign Period)
-- But we want to show progress per member in the leaderboard.

CREATE OR REPLACE FUNCTION public.get_member_campaign_savings(p_campaign_id UUID, p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_daily_savings BIGINT;
    v_start_date DATE;
    v_end_date DATE;
    v_days_passed INTEGER;
    v_total_expenses BIGINT;
    v_budget_limit BIGINT;
    v_daily_budget BIGINT;
BEGIN
    -- 1. Get campaign info
    SELECT daily_savings, created_at::date, end_date::date 
    INTO v_daily_savings, v_start_date, v_end_date
    FROM public.campaigns WHERE id = p_campaign_id;

    -- 2. Calculate days passed (clamped to campaign duration)
    v_days_passed := GREATEST(1, LEAST(
        (CURRENT_DATE - v_start_date) + 1,
        (v_end_date - v_start_date) + 1
    ));

    -- 3. Get user's daily budget for the current month
    -- Fallback to v_daily_savings if no budget set
    SELECT amount_limit / 30 INTO v_daily_budget
    FROM public.budgets
    WHERE user_id = p_user_id
    AND month_year = date_trunc('month', CURRENT_DATE)::date;

    IF v_daily_budget IS NULL OR v_daily_budget = 0 THEN
        v_daily_budget := v_daily_savings;
    END IF;

    -- 4. Calculate total expenses during the campaign period
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM public.transactions
    WHERE user_id = p_user_id
    AND type = 'expense'
    AND date::date >= v_start_date
    AND date::date <= CURRENT_DATE;

    -- 5. Savings = (Daily Budget * Days) - Expenses
    -- Clamped to 0 as requested in previous tasks
    RETURN GREATEST(0, (v_daily_budget * v_days_passed) - v_total_expenses);
END;
$$ LANGUAGE plpgsql STABLE;

-- Create a view for easy access to campaign member stats
DROP VIEW IF EXISTS public.campaign_member_stats;
CREATE VIEW public.campaign_member_stats AS
SELECT 
    cm.campaign_id,
    cm.user_id,
    cm.joined_at,
    public.get_member_campaign_savings(cm.campaign_id, cm.user_id) as current_savings
FROM 
    public.campaign_members cm;
