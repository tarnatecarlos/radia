/* Radia User Kit — Dashboard. window.Dashboard */
(function () {
  const { Icon, Avatar, Card, Button, StatusPill } = RUI;
  const r = RADIA;

  function Stat({ label, value, icon, tone, sub }) {
    return (
      <Card pad={18} hover>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-2)' }}>{label}</span>
          <span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: tone.soft, color: tone.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8, fontFamily: 'var(--font-mono)', color: 'var(--fg-1)' }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{sub}</div>
      </Card>
    );
  }

  function Dashboard() {
    const active = r.tasks.filter(t => t.status !== 'DONE');
    const recent = [...r.tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const incomplete = r.profiles.filter(p => !p.onboarding_completed);
    const statusVerb = { TODO: 'created', IN_PROGRESS: 'is working on', REVIEW: 'submitted for review', DONE: 'completed' };
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome back, Alex</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--fg-3)' }}>Thursday, July 18, 2024</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <Stat label="Total Employees" value="10" icon="users" sub="+2 this month" tone={{ soft: 'var(--accent-soft)', fg: 'var(--accent)' }} />
          <Stat label="Active Tasks" value={active.length} icon="check-square" sub="3 due this week" tone={{ soft: 'var(--info-soft)', fg: 'var(--info)' }} />
          <Stat label="Onboarding" value="68%" icon="graduation-cap" sub={`${incomplete.length} in progress`} tone={{ soft: 'var(--warning-soft)', fg: 'var(--warning)' }} />
          <Stat label="SOPs Published" value={r.sops.length} icon="book-open" sub="Updated Jun 15" tone={{ soft: 'var(--radia-violet-50)', fg: 'var(--radia-violet-600)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <Card>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>Recent Activity</h3>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recent.map(t => {
                const a = r.byId(t.assignee_id);
                return (
                  <div key={t.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 8, borderRadius: 'var(--radius-md)' }}>
                    {a && <Avatar person={a} size={32} />}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 14, color: 'var(--fg-1)', lineHeight: 1.45 }}><b style={{ fontWeight: 600 }}>{a?.first_name} {a?.last_name}</b> <span style={{ color: 'var(--fg-2)' }}>{statusVerb[t.status]}</span> "{t.title}"</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={12} />{r.timeAgo(t.created_at)}</div>
                    </div>
                    <StatusPill status={t.status} />
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>Onboarding Overview</h3>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {incomplete.map((p, i) => {
                const prog = [40, 25][i] ?? 30;
                return (
                  <div key={p.id}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar person={p} size={28} /><span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-1)' }}>{p.first_name} {p.last_name}</span></div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{prog}%</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 'var(--radius-full)', background: 'var(--surface-sunken)', marginTop: 8, overflow: 'hidden' }}>
                      <div style={{ width: prog + '%', height: '100%', background: 'var(--accent)', borderRadius: 'var(--radius-full)' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 5 }}>{Math.round(prog / 100 * 9)} of 9 lessons completed</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon="plus">Create Task</Button>
          <Button variant="secondary" icon="user-plus">Add Employee</Button>
          <Button variant="secondary" icon="file-text">New SOP</Button>
        </div>
      </div>
    );
  }
  window.Dashboard = Dashboard;
})();
