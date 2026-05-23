import { createClient } from '@/lib/supabase/client';
import { calculateStreak } from '@/lib/finance/calculations';

export async function getDashboardData(userId: string) {
  const supabase = createClient();
  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  let { data: budget } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .eq('month_year', monthYear)
    .maybeSingle();

  if (!budget || !budget.amount_limit) {
    const localBudget = localStorage.getItem(`budget_${userId}_${monthYear}`);
    if (localBudget) {
      budget = { amount_limit: parseInt(localBudget, 10) };
    }
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('user_id', userId)
    .gte('date', monthYear)
    .order('date', { ascending: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const { data: allCategories } = await supabase
    .from('categories')
    .select('*');

  return { budget, transactions, profile, allCategories };
}

export async function addTransaction(transaction: {
  user_id: string;
  category_id: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
  note: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select();
  return { data, error };
}

export async function createMonthlyBudget(userId: string, amount: number) {
  const supabase = createClient();
  
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, tieugon_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      const { data: { user } } = await supabase.auth.getUser();
      const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
      
      await supabase.from('profiles').insert({ 
        id: userId,
        display_name: displayName,
        email: user?.email
      });
    } else if (!profile.email) {
       const { data: { user } } = await supabase.auth.getUser();
       if (user?.email) {
         await supabase.from('profiles').update({ email: user.email }).eq('id', userId);
       }
    }
  } catch (e) {
    console.warn('Profile sync issue:', e);
  }

  const now = new Date();
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  localStorage.setItem(`budget_${userId}_${monthYear}`, amount.toString());

  const { data, error } = await supabase
    .from('budgets')
    .upsert({
      user_id: userId,
      month_year: monthYear,
      amount_limit: amount,
    }, { 
      onConflict: 'user_id, month_year',
      ignoreDuplicates: false 
    })
    .select();
    
  return { data, error };
}

export async function updateProfile(userId: string, updates: { display_name?: string; avatar_url?: string | null; first_name?: string; last_name?: string; email?: string; tieugon_id?: string }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select();
  return { data, error };
}

export async function getSquadData(userId: string) {
  const supabase = createClient();

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*, campaign_members(user_id, profiles(*))')
    .order('created_at', { ascending: false });

  const { data: duels } = await supabase
    .from('duels')
    .select('*, creator:profiles!creator_id(*), opponent:profiles!opponent_id(*)')
    .or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  return { 
    campaigns: campaigns?.map(c => ({
      ...c,
      current: Number(c.current_amount),
      daily_savings: Number(c.daily_savings || (c as any).target_amount || 0),
      members: (c as any).campaign_members || [],
      isJoined: (c as any).campaign_members?.some((m: any) => m.user_id === userId),
      daysLeft: Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    })) || [],
    duels: duels?.map(d => ({
      ...d,
      creator_score: Number(d.creator_score || 0),
      opponent_score: Number(d.opponent_score || 0)
    })) || []
  };
}

export async function createCampaign(campaign: {
  name: string;
  daily_savings: number;
  emoji: string;
  end_date: string;
  creator_id: string;
  description: string;
}) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{
      name: campaign.name,
      daily_savings: campaign.daily_savings,
      emoji: campaign.emoji,
      end_date: campaign.end_date,
      creator_id: campaign.creator_id,
      description: campaign.description
    }])
    .select()
    .single();

  if (error) return { error };

  const { error: memberError } = await supabase
    .from('campaign_members')
    .insert([{
      campaign_id: data.id,
      user_id: campaign.creator_id
    }]);

  return { data, error: memberError };
}

export async function joinCampaign(campaignId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('campaign_members')
    .insert([{ campaign_id: campaignId, user_id: userId }]);
  return { error };
}

export async function leaveCampaign(campaignId: string, userId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('campaign_members')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('user_id', userId);
  return { error };
}

export async function getLeaderboardData() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('survival_score', { ascending: false })
    .limit(20);
    
  return { profiles, error };
}

export async function createCategory(category: { name: string; icon: string; color: string; type: 'income' | 'expense' }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select();
  return { data, error };
}

export async function deleteCategory(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  return { error };
}

export async function getAllProfiles() {
  const supabase = createClient();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name');
    
  return { profiles, error };
}

export async function searchProfiles(query: string) {
  const supabase = createClient();
  const cleanQuery = query.trim();
  if (!cleanQuery) return { data: [], error: null };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`tieugon_id.ilike.%${cleanQuery}%,email.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
    .limit(10);
  return { data, error };
}

export async function sendFriendRequest(userId: string, friendId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .insert([{ user_id: userId, friend_id: friendId, status: 'pending' }])
    .select();
  return { data, error };
}

export async function getFriendships(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_id.eq.${userId},friend_id.eq.${userId}`);
  return { data, error };
}

export async function getCampaignMembers(campaignId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('campaign_members')
    .select('*, profiles(*)')
    .eq('campaign_id', campaignId);
    
  return { data, error };
}

export async function clearAllCampaigns() {
  const supabase = createClient();
  // campaign_members will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  return { error };
}

export async function deleteCampaign(campaignId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);
  return { error };
}

export async function debugSyncAllEmails() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email) {
    await supabase.from('profiles').update({ email: user.email }).eq('id', user.id);
  }
  return { success: true };
}

export async function acceptFriendRequest(requestId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select();
  return { data, error };
}

export async function declineFriendRequest(requestId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('id', requestId);
  return { error };
}

export async function getPendingRequests(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('friendships')
    .select('*, sender:profiles!user_id(*)')
    .eq('friend_id', userId)
    .eq('status', 'pending');
  return { data, error };
}

export async function deleteDuel(duelId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('duels')
    .delete()
    .eq('id', duelId);
  return { error };
}

export async function getDetailedLeaderboard(userId: string) {
  const supabase = createClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Get all profiles
  const { data: profiles } = await supabase.from('profiles').select('*');
  if (!profiles) return { data: [] };

  // 2. Get all transactions for current month (to calculate Income - Expense AND Streaks)
  const { data: transactions } = await supabase.from('transactions')
    .select('user_id, amount, type, date')
    .gte('date', startOfMonth);

  // 3. Get duel stats
  const { data: duels } = await supabase.from('duels')
    .select('creator_id, opponent_id, creator_score, opponent_score, status')
    .eq('status', 'finished');

  const leaderboard = profiles.map(p => {
    const userTrans = transactions?.filter(t => t.user_id === p.id) || [];
    const income = userTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = userTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Logic: Tiết kiệm = Thu nhập - Chi tiêu
    const totalSavings = Math.max(0, income - expense);

    // Logic: Streak = Tính toán từ danh sách giao dịch tháng này
    const liveStreak = calculateStreak(userTrans);

    const userDuels = duels?.filter(d => d.creator_id === p.id || d.opponent_id === p.id) || [];
    const wins = userDuels.filter(d => {
      const isCreator = d.creator_id === p.id;
      const myScore = isCreator ? d.creator_score : d.opponent_score;
      const opScore = isCreator ? d.opponent_score : d.creator_score;
      return myScore < opScore; 
    }).length;
    
    const winRate = userDuels.length > 0 ? Math.round((wins / userDuels.length) * 100) : 0;

    return {
      ...p,
      current_streak: liveStreak,
      monthly_savings: totalSavings,
      win_rate: winRate,
      isMe: p.id === userId
    };
  });

  return { data: leaderboard.sort((a, b) => b.monthly_savings - a.monthly_savings) };
}
