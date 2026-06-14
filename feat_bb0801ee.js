// Dashboard (v2) – web-native: KPI strip + chart row + transactions table

function Dashboard({ go, onAdd }) {
  const d = DATA;
  const pctSpent = Math.round((d.budget.spent / d.budget.monthly) * 100);
  const left = d.budget.monthly - d.budget.spent;
  const dailyAvg = Math.round((d.budget.spent / (30 - d.budget.daysLeft)));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{PAGE_META.dashboard.title}</h1>
          <p className="sub">Tháng 5/2026 · còn <b>{d.budget.daysLeft} ngày</b> · đã dùng <b>{pctSpent}%</b> ngân sách</p>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-outline"><Icon name="download" size={14} /> Xuất báo cáo</button>
          <button className="btn btn-primary" onClick={onAdd}><Icon name="plus" size={14} /> Ghi chi tiêu</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="kpi-row">
        <Kpi
          primary
          label="Ngân sách tháng"
          value={fmt(d.budget.monthly)} unit="đ"
          delta={`Đã dùng ${pctSpent}%`} deltaDir="down"
          meta={`Còn ${d.budget.daysLeft} ngày`}
          bar={pctSpent}
        />
        <Kpi
          icon="trend-down" label="Đã chi"
          value={fmt(d.budget.spent)} unit="đ"
          delta="▲ 12%" deltaDir="down"
          meta="so với tháng trước"
          spark={[120, 180, 90, 220, 150, 200, 134]}
          sparkColor="#E11D48"
        />
        <Kpi
          icon="piggy" label="Tiết kiệm"
          value={fmt(d.budget.saved)} unit="đ"
          delta="▲ 24%" deltaDir="up"
          meta="so với tháng trước"
          spark={[40, 80, 60, 100, 90, 140, 200]}
          sparkColor="#16A34A"
        />
        <Kpi
          icon="flame" label={'Streak'}
          value={d.budget.streak} unit=" ngày"
          delta="🔥 Kỷ lục: 19"
          meta={`+${fmt(d.budget.saved)}đ`}
          spark={[0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1].map(v => v + Math.random() * 0.2)}
        />
      </div>

      {/* Roast inline */}
      <RoastInline text={d.roast} />

      {/* Chart row */}
      <div className="dash-row r-1-1" style={{ marginTop: 18 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Tiêu vào đâu?</h3>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Phân loại theo danh mục</div>
            </div>
            <div className="seg">
              <button className="active">Tháng này</button>
              <button>3 tháng</button>
              <button>Năm</button>
            </div>
          </div>
          <div className="donut-card">
            <Donut
              data={d.categories}
              value={fmt(d.budget.spent / 1000) + 'k'}
              label="đã chi"
            />
            <div className="legend">
              {d.categories.map(c => (
                <div className="legend-row" key={c.id}>
                  <span className="sw" style={{ background: c.color }}></span>
                  <span className="nm">{c.label}</span>
                  <span className="am">{fmt(c.amount)}đ<span className="pct">{c.pct}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Chi theo ngày</h3>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Tuần này · {fmt(dailyAvg)}đ / ngày trung bình</div>
            </div>
            <div className="seg">
              <button className="active">Tuần</button>
              <button>Tháng</button>
            </div>
          </div>
          <WeekBars data={d.weekSpend} cats={['food', 'move', 'shop', 'other']} />
          <div style={{ display: 'flex', gap: 14, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-2)', fontSize: 11 }}>
            {[
              { c: '#E11D48', l: 'Ăn uống' },
              { c: '#2563EB', l: 'Di chuyển' },
              { c: '#D97706', l: 'Mua sắm' },
              { c: '#9CA3AF', l: 'Khác' },
            ].map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: it.c }}></span>
                <span style={{ color: 'var(--t2)' }}>{it.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions as a table */}
      <div className="card flush">
        <div className="card-h">
          <div>
            <h3>Giao dịch gần đây</h3>
            <div className="sub">7 ngày qua</div>
          </div>
          <div className="card-h-actions">
            <button className="btn btn-ghost btn-sm">Lọc <Icon name="filter" size={12} /></button>
            <button className="btn btn-ghost btn-sm" onClick={() => go('transactions')}>
              Xem tất cả <Icon name="chevron-right" size={12} />
            </button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 40 }}><input type="checkbox" className="checkbox" /></th>
              <th>Mô tả</th>
              <th>Danh mục</th>
              <th>Ngày</th>
              <th className="num">Số tiền</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {d.transactions.slice(0, 6).map(tx => {
              const cat = catById(tx.cat);
              return (
                <tr key={tx.id}>
                  <td><input type="checkbox" className="checkbox" /></td>
                  <td>
                    <div className="tx-cell">
                      <div className={'tx-cat-ico ' + cat.id}><Icon name={cat.icon} size={14} /></div>
                      <div>
                        <div className="tx-name">{tx.name}</div>
                        {tx.note && <div className="tx-note">{tx.note}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge gray">{cat.label}</span></td>
                  <td style={{ color: 'var(--t2)', fontSize: 12 }}>{tx.date} · {tx.time}</td>
                  <td className={'num ' + (tx.kind === 'save' ? 'amt-save' : 'amt-spend')}>
                    {tx.kind === 'save' ? '+' : '−'}{fmt(tx.amount)}đ
                  </td>
                  <td>
                    <div className="tbl-actions">
                      <button className="icon-btn"><Icon name="more" size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RoastInline({ text, onClose }) {
  const [hidden, setHidden] = React.useState(false);
  if (hidden) return null;
  return (
    <div className="roast" style={{ marginBottom: 0 }}>
      <div className="roast-emo">🫠</div>
      <div className="roast-body">
        <div className="roast-label">App nói xấu bạn</div>
        <div className="roast-text">{text}</div>
        <div className="roast-actions">
          <button className="chip">Đau lòng quá 💔</button>
          <button className="chip">Đúng rồi 🥲</button>
          <button className="chip">Roast khác <Icon name="sparkle" size={11} /></button>
        </div>
      </div>
      <button className="roast-close" onClick={() => setHidden(true)} aria-label="Đóng">
        <Icon name="x" size={14} />
      </button>
    </div>
  );
}

Object.assign(window, { Dashboard });
