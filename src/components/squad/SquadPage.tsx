import React, { useState, useEffect } from 'react';
import Icon, { IconName } from '@/components/ui/Icon';
import { 
  getSquadData, joinCampaign, leaveCampaign, getAllProfiles, 
  sendFriendRequest, getFriendships, deleteCampaign,
  getPendingRequests, acceptFriendRequest, declineFriendRequest,
  deleteDuel, getDetailedLeaderboard
} from '@/lib/supabase/queries';
import { User } from '@supabase/supabase-js';
import CreateCampaignModal from './CreateCampaignModal';
import CreateDuelModal from './CreateDuelModal';
import AddFriendModal from './AddFriendModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { useLanguage } from '@/components/providers/LanguageProvider';

interface SquadPageProps {
  user: User;
  subRoute?: string;
}

const SquadPage: React.FC<SquadPageProps> = ({ user, subRoute = 'campaigns' }) => {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [isCreateDuelOpen, setCreateDuelOpen] = useState(false);
  const [isAddFriendOpen, setAddFriendOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [confirm, setConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'primary' | 'danger';
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary'
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [squadData, lbData, friendData, requestData] = await Promise.all([
          getSquadData(user.id),
          getDetailedLeaderboard(user.id),
          getFriendships(user.id),
          getPendingRequests(user.id)
        ]);
        
        setData(squadData);
        if (lbData.data) setProfiles(lbData.data);
        if (friendData.data) setFriendships(friendData.data);
        if (requestData.data) setPendingRequests(requestData.data);
      } catch (err) {
        console.error("Error loading squad data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user.id, refreshKey]);

  const getInitials = (p: any) => {
    if (!p) return '??';
    if (p.last_name && p.first_name) return (p.last_name[0] + p.first_name[0]).toUpperCase();
    if (p.display_name) {
      const parts = p.display_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
      return p.display_name.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const handleJoin = async (id: string) => {
    const { error } = await joinCampaign(id, user.id);
    if (!error) setRefreshKey(prev => prev + 1);
  };

  const handleLeave = async (id: string) => {
    setConfirm({
      open: true,
      title: t('squad.leave'),
      message: locale === 'vi' ? 'Bạn có chắc chắn muốn rời khỏi nhóm không?' : 'Are you sure you want to leave this group?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await leaveCampaign(id, user.id);
        if (!error) setRefreshKey(prev => prev + 1);
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const handleAccept = async (requestId: string) => {
    const { error } = await acceptFriendRequest(requestId);
    if (!error) setRefreshKey(prev => prev + 1);
  };

  const handleDecline = async (requestId: string) => {
    const { error } = await declineFriendRequest(requestId);
    if (!error) setRefreshKey(prev => prev + 1);
  };

  const handleDeleteCampaign = async (id: string) => {
    setConfirm({
      open: true,
      title: t('common.delete'),
      message: locale === 'vi' ? 'Bạn có chắc chắn muốn xóa vĩnh viễn không?' : 'Are you sure you want to delete this permanently?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await deleteCampaign(id);
        if (!error) setRefreshKey(prev => prev + 1);
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const handleDeleteDuel = async (id: string) => {
    setConfirm({
      open: true,
      title: t('common.delete'),
      message: locale === 'vi' ? 'Xóa cuộc đấu này?' : 'Delete this duel?',
      type: 'danger',
      onConfirm: async () => {
        const { error } = await deleteDuel(id);
        if (!error) setRefreshKey(prev => prev + 1);
        setConfirm(c => ({ ...c, open: false }));
      }
    });
  };

  const getFriendStatus = (friendId: string) => {
    const f = friendships.find(fs => 
      (fs.user_id === user.id && fs.friend_id === friendId) || 
      (fs.friend_id === user.id && fs.user_id === friendId)
    );
    if (!f) return 'none';
    if (f.status === 'accepted') return 'friend';
    if (f.user_id === user.id) return 'sent';
    return 'received';
  };

  const campaigns = data?.campaigns || [];
  const duels = data?.duels || [];
  
  const membersList = profiles.filter(p => {
    if (p.id === user.id) return true;
    return getFriendStatus(p.id) === 'friend';
  });

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{t('common.loading')}</div>;

  return (
    <div className="main-inner">
      <div className="page-head">
        <div>
          <h1>
            {subRoute === 'campaigns' && t('squad.title_campaigns')}
            {subRoute === 'duels' && t('squad.title_duels')}
            {subRoute === 'members' && t('squad.title_friends')}
          </h1>
          <p className="sub">
            {subRoute === 'campaigns' && t('squad.sub_campaigns')}
            {subRoute === 'duels' && t('squad.sub_duels')}
            {subRoute === 'members' && t('squad.sub_friends')}
          </p>
        </div>
        <div className="page-head-actions">
          {subRoute === 'campaigns' && (
            <button className="btn btn-primary" onClick={() => setCreateCampaignOpen(true)}>
              <Icon name="plus" size={16} />
              <span>{t('squad.create_campaign')}</span>
            </button>
          )}
          {subRoute === 'duels' && (
            <button className="btn btn-primary" onClick={() => setCreateDuelOpen(true)}>
              <Icon name="zap" size={16} />
              <span>{t('squad.create_duel')}</span>
            </button>
          )}
          {subRoute === 'members' && (
            <button className="btn btn-primary" onClick={() => setAddFriendOpen(true)}>
              <Icon name="user" size={16} />
              <span>{t('squad.add_friend')}</span>
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        {subRoute === 'campaigns' ? (
          <div className="dash-row r-1-1">
            {campaigns.map((c: any) => {
              const dailyAmt = Number(c.daily_savings || 0);
              const startDate = new Date(c.created_at || Date.now());
              const diffTime = Math.abs(new Date().getTime() - startDate.getTime());
              const daysPassed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
              const totalPossible = dailyAmt * (daysPassed + (c.daysLeft || 0));
              const totalCurrent = dailyAmt * daysPassed;
              const pct = totalPossible > 0 ? Math.round((totalCurrent / totalPossible) * 100) : 0;
              const membersCount = c.members?.length || 0;
              const isOwner = c.creator_id === user.id;
              
              return (
                <div key={c.id} className="card flush" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '20px' }}>{c.emoji}</span>
                          <h2 style={{ fontSize: '16px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</h2>
                        </div>
                        <p className="sub" style={{ marginTop: '2px', color: 'var(--t3)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.description || `${t('squad.daily_goal_prefix')} ${dailyAmt.toLocaleString()}đ ${t('squad.daily_goal_suffix')}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge purple" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', flexShrink: 0 }}>{c.daysLeft} {t('common.days')}</span>
                        {isOwner && (
                          <button className="icon-btn sm" style={{ color: 'var(--rose)' }} onClick={() => handleDeleteCampaign(c.id)}>
                            <Icon name="trash" size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '16px', borderTop: '1px solid var(--line-2)', paddingTop: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--t2)', fontWeight: 600 }}>{t('squad.group_progress')}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--purple-700)' }}>{pct}%</span>
                      </div>
                      <div className="bar" style={{ height: '6px' }}><i style={{ width: `${Math.min(100, pct)}%` }}></i></div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '11px' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>{membersCount} {t('common.members_count')}</span>
                      </div>
                    </div>
                  </div>

                  <table className="tbl" style={{ borderTop: '1px solid var(--line-2)', flex: 1 }}>
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: '20px', background: 'transparent', fontSize: '10px' }}>{t('leaderboard.user')}</th>
                        <th className="num" style={{ paddingRight: '20px', background: 'transparent', fontSize: '10px' }}>{t('leaderboard.savings')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(c.members || []).slice(0, 3).map((m: any) => {
                        const isMe = m.user_id === user.id;
                        const isFriend = getFriendStatus(m.user_id) === 'friend';
                        const canSeeDetails = isMe || isFriend;
                        
                        const memberJoinDate = new Date(m.joined_at || c.created_at || Date.now());
                        const mDiff = Math.abs(new Date().getTime() - memberJoinDate.getTime());
                        const memberDays = Math.max(1, Math.floor(mDiff / (1000 * 60 * 60 * 24)));
                        const savedAmt = memberDays * dailyAmt;

                        return (
                          <tr key={m.user_id}>
                            <td style={{ paddingLeft: '20px', paddingTop: '8px', paddingBottom: '8px' }}>
                              <div className="tx-cell">
                                <div className="avatar sm" style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  fontSize: '9px',
                                  background: canSeeDetails ? undefined : 'var(--bg-2)',
                                  color: canSeeDetails ? undefined : 'var(--t4)'
                                }}>
                                  {canSeeDetails ? getInitials(m.profiles) : <Icon name="lock" size={10} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                  <span className="tx-name" style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 700, 
                                    whiteSpace: 'nowrap', 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    maxWidth: '80px',
                                    color: canSeeDetails ? 'inherit' : 'var(--t3)'
                                  }}>
                                    {canSeeDetails ? (m.profiles?.display_name || 'Member') : 'Anonymous'}
                                  </span>
                                  {isMe && <span className="badge purple" style={{ fontSize: '8px', padding: '1px 3px' }}>{t('common.you')}</span>}
                                  {isFriend && <Icon name="users" size={10} style={{ color: 'var(--purple-400)' }} />}
                                </div>
                              </div>
                            </td>
                            <td className="num" style={{ paddingRight: '20px', fontWeight: 700, color: 'var(--green)', fontSize: '12px' }}>
                              {savedAmt.toLocaleString()}đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg)' }}>
                    {!c.isJoined ? (
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleJoin(c.id)}>{t('squad.join')}</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => handleLeave(c.id)}>{t('squad.leave')}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : subRoute === 'duels' ? (
          <div className="dash-row r-1-1">
            {duels.map((d: any) => {
              const isCreator = d.creator_id === user.id;
              const myScore = isCreator ? Number(d.creator_score || 0) : Number(d.opponent_score || 0);
              const opScore = isCreator ? Number(d.opponent_score || 0) : Number(d.creator_score || 0);
              const creatorProfile = d.creator || {};
              const opponentProfile = d.opponent || {};
              const myProfile = isCreator ? creatorProfile : opponentProfile;
              const opProfile = isCreator ? opponentProfile : creatorProfile;
              const opponentName = opProfile.display_name || 'Opponent';
              const timeLeft = Math.max(0, Math.ceil((new Date(d.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
              let amILeading = false;
              let isOpLeading = false;
              let isDraw = myScore === opScore;
              let scoreSuffix = 'đ';
              if (d.challenge_type === 'campaign_savings') {
                 amILeading = myScore > opScore;
                 isOpLeading = opScore > myScore;
              } else {
                 amILeading = myScore < opScore;
                 isOpLeading = opScore < myScore;
                 if (d.challenge_type === 'campaign_violations') scoreSuffix = ' ' + (locale === 'vi' ? 'lỗi' : 'vios');
              }
              return (
                <div key={d.id} className="card flush" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div className="card-h" style={{ borderBottom: 0, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <Icon name="zap" size={16} style={{ color: 'var(--ink)' }} />
                      <h3 style={{ fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge rose" style={{ background: 'var(--rose-2)', color: 'var(--rose)', fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}>{timeLeft} {t('common.days')}</span>
                      {isCreator && <button className="icon-btn sm" style={{ color: 'var(--rose)' }} onClick={() => handleDeleteDuel(d.id)}><Icon name="trash" size={14} /></button>}
                    </div>
                  </div>
                  <div className="duel-vs" style={{ padding: '24px 20px 32px', gap: '12px' }}>
                    <div className="duel-side" style={{ flex: 1 }}>
                      <div className="avatar lg" style={{ width: '56px', height: '56px', background: '#6938E8', color: '#fff', borderRadius: '50%', border: amILeading ? '3px solid var(--green)' : isDraw ? '3px solid var(--line-2)' : '3px solid var(--rose)' }}>{getInitials(myProfile)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px', height: '16px' }}>
                         {amILeading && <><span style={{ color: '#D97706' }}>👑</span> <span style={{ color: '#D97706', fontWeight: 700 }}>{t('squad.leading')}</span></>}
                         {isOpLeading && t('squad.trailing')}
                         {isDraw && t('squad.draw')}
                      </div>
                      <div className="nm" style={{ fontWeight: 700 }}>{myProfile.display_name || t('common.you')}</div>
                      <div className="amt" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--purple-700)' }}>{myScore.toLocaleString()}{scoreSuffix}</div>
                    </div>
                    <div className="vs-pill" style={{ background: 'var(--purple-50)', color: 'var(--purple-400)', height: '24px', padding: '0 8px', alignSelf: 'center', marginTop: '20px' }}>VS</div>
                    <div className="duel-side" style={{ flex: 1 }}>
                      <div className="avatar lg" style={{ width: '56px', height: '56px', background: '#EF4444', color: '#fff', borderRadius: '50%', border: isOpLeading ? '3px solid var(--green)' : isDraw ? '3px solid var(--line-2)' : '3px solid var(--rose)' }}>{getInitials(opProfile)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: '4px', height: '16px' }}>
                         {isOpLeading && <><span style={{ color: '#D97706' }}>👑</span> <span style={{ color: '#D97706', fontWeight: 700 }}>{t('squad.leading')}</span></>}
                         {amILeading && t('squad.trailing')}
                         {isDraw && t('squad.draw')}
                      </div>
                      <div className="nm" style={{ fontWeight: 700 }}>{opponentName}</div>
                      <div className="amt" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--purple-700)' }}>{opScore.toLocaleString()}{scoreSuffix}</div>
                    </div>
                  </div>
                  <div className="duel-foot" style={{ background: 'var(--bg)', padding: '12px 20px', borderTop: '1px solid var(--line-2)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--t2)' }}>{t('common.stake_label')}: <span style={{ fontWeight: 700, color: 'var(--purple-700)' }}>{d.stake}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {pendingRequests.length > 0 && (
              <div className="card flush">
                <div className="card-h" style={{ background: 'var(--purple-50)', borderBottomColor: 'var(--purple-100)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="bell" size={16} style={{ color: 'var(--purple-600)' }} />
                    <h3 style={{ color: 'var(--purple-700)' }}>{t('squad.requests')} ({pendingRequests.length})</h3>
                  </div>
                </div>
                <div className="card-body tight">
                  <table className="tbl">
                    <tbody>
                      {pendingRequests.map((r: any) => (
                        <tr key={r.id}>
                          <td>
                            <div className="tx-cell">
                              <div className="avatar sm" style={{ background: '#6938E8', color: '#fff' }}>{getInitials(r.sender)}</div>
                              <div>
                                <div className="tx-name" style={{ fontSize: '14px', fontWeight: 700 }}>{r.sender?.display_name || 'Anonymous'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--t3)' }}>ID: {r.sender?.tieugon_id}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="btn btn-primary btn-sm" onClick={() => handleAccept(r.id)}>{locale === 'vi' ? 'Chấp nhận' : 'Accept'}</button>
                              <button className="btn btn-outline btn-sm" onClick={() => handleDecline(r.id)}>{locale === 'vi' ? 'Từ chối' : 'Decline'}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="card flush">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>{locale === 'vi' ? 'TÊN' : 'NAME'}</th>
                    <th>{t('squad.joined_campaigns')}</th>
                    <th>{t('leaderboard.streak')}</th>
                    <th>{t('leaderboard.savings')}</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {membersList.map((p: any) => {
                    const campaignCount = campaigns.filter((c: any) => c.members?.some((m: any) => m.user_id === p.id)).length;
                    return (
                      <tr key={p.id}>
                        <td style={{ paddingLeft: '24px' }}>
                          <div className="tx-cell">
                            <div className="avatar sm" style={{ background: p.isMe ? '#6938E8' : 'var(--purple-500)', color: '#fff', fontWeight: 800 }}>{getInitials(p)}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ink)' }}>{p.display_name || 'Anonymous'}</span>
                              {p.isMe && <span className="badge purple" style={{ fontSize: '8px', padding: '1px 4px' }}>{t('common.you')}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge gray" style={{ borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>{campaignCount} {locale === 'vi' ? 'chiến dịch' : 'campaigns'}</span>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--t2)', fontSize: '13px' }}>🔥 {p.current_streak || 0} {t('common.days')}</td>
                        <td style={{ fontWeight: 800, color: 'var(--purple-700)', fontSize: '14px' }}>{Number(p.monthly_savings || 0).toLocaleString()}đ</td>
                        <td style={{ textAlign: 'right', paddingRight: '16px' }}><button className="icon-btn sm" style={{ opacity: 0.3 }}><Icon name="more-horizontal" size={14} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <CreateCampaignModal open={isCreateCampaignOpen} onClose={() => setCreateCampaignOpen(false)} userId={user.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />
      <CreateDuelModal open={isCreateDuelOpen} onClose={() => setCreateDuelOpen(false)} userId={user.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />
      <AddFriendModal open={isAddFriendOpen} onClose={() => setAddFriendOpen(false)} userId={user.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />
      <ConfirmModal open={confirm.open} title={confirm.title} message={confirm.message} type={confirm.type} onConfirm={confirm.onConfirm} onClose={() => setConfirm(c => ({ ...c, open: false }))} />
    </div>
  );
};

export default SquadPage;
