'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '@/components/ui/Icon';
import { createClient } from '@/lib/supabase/client';
import { getTrips, getTripDetails, addTrip, addTripMember, addTripExpense } from '@/lib/supabase/queries';
import { User } from '@supabase/supabase-js';
import CreateTripModal from './CreateTripModal';
import AddExpenseModal from './AddExpenseModal';

interface SplitBillPageProps {
  user: User;
}

const SplitBillPage: React.FC<SplitBillPageProps> = ({ user }) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [tripData, setTripDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);

  const fetchTrips = async (newId?: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await getTrips(user.id);
      if (error) throw error;
      if (data) {
        setTrips(data);
        if (data.length > 0) {
          const targetId = newId || data[0].id;
          setActiveTripId(targetId);
        }
      }
    } catch (err: any) {
      console.error('fetchTrips error:', err);
      setFetchError(err.message || 'Lỗi khi tải danh sách chuyến đi');
    } finally {
      setLoading(false);
    }
  };

  const fetchTripDetails = async (id: string) => {
    setDetailsLoading(true);
    setFetchError(null);
    try {
      const { trip, error } = await getTripDetails(id);
      if (error) throw error;
      if (trip) {
        setTripDetails(trip);
      } else {
        setFetchError('Không tìm thấy thông tin chi tiết cho chuyến đi này');
      }
    } catch (err: any) {
      console.error('fetchTripDetails error:', err);
      setFetchError(err.message || 'Lỗi khi tải thông tin chi tiết');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user.id]);

  useEffect(() => {
    if (activeTripId) {
      fetchTripDetails(activeTripId);
    }
  }, [activeTripId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  // Logic to calculate balances and transfers
  const { totalCost, balances, transfers, avgPerPerson } = useMemo(() => {
    if (!tripData || !tripData.trip_members || !tripData.trip_expenses) {
      return { totalCost: 0, balances: [], transfers: [], avgPerPerson: 0 };
    }

    const expenses = tripData.trip_expenses;
    const members = tripData.trip_members;
    const total = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const avg = members.length > 0 ? total / members.length : 0;

    // Calculate net balance for each member
    const memberBalances = members.map((m: any) => {
      const paid = expenses
        .filter((e: any) => e.payer_id === m.id)
        .reduce((sum: number, e: any) => sum + Number(e.amount), 0);
      return {
        id: m.id,
        name: m.profiles?.display_name || m.nickname || 'Unknown',
        paid,
        balance: paid - avg,
        isMe: m.user_id === user.id
      };
    });

    // Calculate optimal transfers (Simplified Greedy Debt Settle)
    const debtors = memberBalances
      .filter((m: any) => m.balance < -1) // -1 to handle float precision
      .map((m: any) => ({ ...m }))
      .sort((a: any, b: any) => a.balance - b.balance);
    
    const creditors = memberBalances
      .filter((m: any) => m.balance > 1)
      .map((m: any) => ({ ...m }))
      .sort((a: any, b: any) => b.balance - a.balance);

    const calculatedTransfers: any[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debt = Math.abs(debtors[dIdx].balance);
      const credit = creditors[cIdx].balance;
      const amount = Math.min(debt, credit);

      calculatedTransfers.push({
        from: debtors[dIdx].name,
        to: creditors[cIdx].name,
        toIsMe: creditors[cIdx].isMe,
        fromIsMe: debtors[dIdx].isMe,
        amount
      });

      debtors[dIdx].balance += amount;
      creditors[cIdx].balance -= amount;

      if (Math.abs(debtors[dIdx].balance) < 1) dIdx++;
      if (Math.abs(creditors[cIdx].balance) < 1) cIdx++;
    }

    return { totalCost: total, balances: memberBalances, transfers: calculatedTransfers, avgPerPerson: avg };
  }, [tripData, user.id]);

  if (loading && trips.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="main-inner" style={{ textAlign: 'center', padding: '80px 20px' }}>
         <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Chưa có chuyến đi nào</h1>
         <p style={{ color: 'var(--t3)', marginBottom: '32px' }}>Bắt đầu chuyến hành trình đầu tiên của bạn ngay!</p>
         <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
           + Tạo chuyến mới
         </button>
         <CreateTripModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} userId={user.id} onSuccess={fetchTrips} />
      </div>
    );
  }

  return (
    <div className="main-inner" style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>Chia tiền nhóm</h1>
        <p style={{ fontSize: '13px', color: 'var(--t2)', fontWeight: 500 }}>
          Chia sòng phẳng chi phí cho mỗi chuyến đi – hết cảnh “để tao trả trước” 🤝
        </p>
      </div>

      {/* Tabs */}
      <div className="trips-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {trips.map(trip => (
          <button 
            key={trip.id}
            onClick={() => setActiveTripId(trip.id)}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              background: activeTripId === trip.id ? 'var(--purple-100)' : '#fff',
              border: activeTripId === trip.id ? '1.5px solid var(--purple-500)' : '1px solid var(--line)',
              textAlign: 'left',
              minWidth: '150px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '14px', color: activeTripId === trip.id ? 'var(--purple-700)' : 'var(--ink)', marginBottom: '2px' }}>{trip.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--t3)' }}>
               {trip.start_date || 'N/A'} · {(trip.trip_members?.[0] as any)?.count || 0} người
            </div>
          </button>
        ))}
        <button 
          onClick={() => setCreateModalOpen(true)}
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            background: 'var(--bg-2)',
            border: '1px dashed var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600,
            fontSize: '13px',
            color: 'var(--t3)',
            cursor: 'pointer'
          }}
        >
          <Icon name="plus" size={14} />
          <span>Chuyến mới</span>
        </button>
      </div>

      {fetchError && (
        <div style={{ padding: '20px', background: 'var(--rose-2)', border: '1px solid var(--rose)', borderRadius: '12px', color: 'var(--rose)', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
          <Icon name="x" size={16} style={{ marginRight: '8px' }} />
          {fetchError}
        </div>
      )}

      {detailsLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t3)' }}>Đang tải thông tin chi tiết...</div>
      ) : tripData ? (
        <>
          {/* Hero Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, #7C4DFF 0%, #6938E8 100%)', 
            borderRadius: '16px', 
            padding: '24px',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(124, 77, 255, 0.15)'
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>{tripData.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', opacity: 0.85, fontSize: '13px' }}>
                <Icon name="home" size={14} />
                <span>{tripData.start_date || 'N/A'}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', marginLeft: '4px' }}>
                  {tripData.trip_members?.slice(0, 5).map((m: any, i: number) => (
                    <div 
                      key={m.id}
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.2)',
                        border: '1.5px solid #7C4DFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700,
                        marginLeft: i === 0 ? 0 : '-8px'
                      }}
                    >
                      {(m.profiles?.display_name || m.nickname || '??').substring(0,2).toUpperCase()}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{tripData.trip_members?.length} thành viên</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, opacity: 0.8, marginBottom: '4px', letterSpacing: '0.05em' }}>TỔNG CHI PHÍ CHUYẾN ĐI</div>
              <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', lineHeight: 1 }}>{formatCurrency(totalCost)}</div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', fontSize: '12px', opacity: 0.9, marginBottom: '16px' }}>
                <span><b>{tripData.trip_expenses?.length}</b> khoản chi</span>
                <span>·</span>
                <span>TB <b>{formatCurrency(avgPerPerson)}</b>/người</span>
              </div>
              <button
                onClick={() => setAddExpenseOpen(true)}
                style={{
                  background: '#fff',
                  color: '#7C4DFF',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: 'auto',
                  cursor: 'pointer'
                }}
              >
                <Icon name="plus" size={16} />
                <span>Thêm khoản chi</span>
              </button>
            </div>
          </div>

          {/* Ai chuyển cho ai */}
          <div className="card flush" style={{ marginBottom: '24px' }}>
            <div className="card-h">
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="refresh-cw" size={16} style={{ transform: 'rotate(45deg)' }} /> Ai chuyển cho ai
                </h3>
                <p className="sub">Tối ưu để số lượt chuyển ít nhất</p>
              </div>
              <span className="badge gray">{transfers.length} giao dịch</span>
            </div>
            
            <div className="card-body tight" style={{ padding: 0 }}>
              {transfers.length > 0 ? transfers.map((t: any, i: number) => (
                <div 
                  key={i} 
                  style={{ 
                    padding: '14px 24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    borderBottom: i === transfers.length - 1 ? 'none' : '1px solid var(--line-2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div className="avatar sm" style={{ background: 'var(--purple-600)', color: '#fff', width: '26px', height: '24px', fontSize: '10px' }}>{t.from.substring(0,2).toUpperCase()}</div>
                       <span style={{ fontWeight: 600, fontSize: '14px' }}>{t.from}</span>
                    </div>
                    <Icon name="arrow-right" size={12} style={{ color: 'var(--t3)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <div className="avatar sm" style={{ background: 'var(--purple-600)', color: '#fff', width: '26px', height: '24px', fontSize: '10px' }}>{t.to.substring(0,2).toUpperCase()}</div>
                       <span style={{ fontWeight: 600, fontSize: '14px' }}>{t.to}</span>
                       {t.toIsMe && <span className="badge purple" style={{ fontSize: '9px', padding: '1px 5px' }}>BẠN</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--purple-700)' }}>{formatCurrency(t.amount)}</span>
                    <button className="btn btn-secondary btn-sm" style={{ borderRadius: '8px', padding: '6px 16px' }}>
                      Đánh dấu đã chuyển
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--t3)', fontSize: '14px' }}>Tất cả đã sòng phẳng! 🤝</div>
              )}
            </div>
          </div>

          {/* Số dư mỗi người */}
          <div style={{ marginBottom: '32px' }}>
             <div style={{ marginBottom: '16px', paddingLeft: '4px' }}>
               <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '2px' }}>Số dư mỗi người</h3>
               <p style={{ fontSize: '12px', color: 'var(--t3)' }}>Số dương = nhận lại · số âm = trả thêm</p>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                {balances.map((b: any, i: number) => (
                  <div key={i} className="card" style={{ 
                    padding: '16px', 
                    border: b.balance > 0 ? '1.5px solid var(--green)' : b.balance < -1 ? '1.5px solid var(--rose)' : '1.5px solid var(--line)',
                    background: b.balance > 0 ? 'var(--green-2)' : b.balance < -1 ? 'var(--rose-2)' : '#fff',
                    opacity: 0.95,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <div className="avatar sm" style={{ background: 'var(--purple-600)', color: '#fff', width: '28px', height: '28px', fontSize: '11px' }}>{b.name.substring(0,2).toUpperCase()}</div>
                      <span style={{ fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</span>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 800, 
                      color: b.balance > 0 ? 'var(--green)' : b.balance < -1 ? 'var(--rose)' : 'var(--ink)',
                      marginBottom: '4px',
                      whiteSpace: 'nowrap'
                    }}>
                      {b.balance > 0 ? '+' : ''}{formatCurrency(b.balance)}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--t3)', fontWeight: 500 }}>
                      {b.balance > 0 ? 'nhận lại' : b.balance < -1 ? 'trả thêm' : 'sòng phẳng'}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Danh sách khoản chi */}
          <div className="card flush" style={{ marginBottom: '40px' }}>
            <div className="card-h">
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="list" size={16} /> Danh sách khoản chi
                </h3>
                <p className="sub">Chi tiết các khoản đã thanh toán trong chuyến đi</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-ghost btn-sm">Xuất báo cáo</button>
                <button className="btn btn-outline btn-sm">Xem tất cả</button>
              </div>
            </div>
            <div className="card-body tight" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>TÊN KHOẢN CHI</th>
                    <th>HẠNG MỤC</th>
                    <th>NGƯỜI TRẢ</th>
                    <th>NGÀY</th>
                    <th className="num">SỐ TIỀN</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {tripData.trip_expenses?.map((item: any) => {
                    const payer = tripData.trip_members?.find((m: any) => m.id === item.payer_id);
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.name}</td>
                        <td><span className="badge gray" style={{ fontSize: '11px' }}>{item.category || 'Khác'}</span></td>
                        <td style={{ fontSize: '13px' }}>{payer?.profiles?.display_name || payer?.nickname || '??'}</td>
                        <td style={{ fontSize: '13px', color: 'var(--t3)' }}>{item.date}</td>
                        <td className="num" style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '15px' }}>{formatCurrency(item.amount)}</td>
                        <td>
                          <button className="icon-btn sm"><Icon name="edit" size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {(!tripData.trip_expenses || tripData.trip_expenses.length === 0) && (
                <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--t3)', fontSize: '14px' }}>
                  Chưa có khoản chi nào. Bấm nút "Thêm khoản chi" ở trên để bắt đầu!
                </div>
              )}
            </div>
          </div>
        </>
      ) : !fetchError && (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--t3)' }}>Chọn một chuyến đi để xem chi tiết nhen!</div>
      )}

      <CreateTripModal open={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} userId={user.id} onSuccess={fetchTrips} />
      {activeTripId && tripData && (
        <AddExpenseModal
          open={isAddExpenseOpen}
          onClose={() => setAddExpenseOpen(false)}
          tripId={activeTripId}
          members={tripData.trip_members || []}
          onSuccess={() => fetchTripDetails(activeTripId)}
        />
      )}

      <style jsx>{`
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
        }
        .avatar.sm {
          width: 28px;
          height: 28px;
          font-size: 11px;
        }
        .trips-tabs::-webkit-scrollbar {
          height: 4px;
        }
        .trips-tabs::-webkit-scrollbar-thumb {
          background: var(--line);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default SplitBillPage;
