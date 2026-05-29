/* Radia Workspace-Admin Kit — People (member management). window.Members */
(function () {
  const { useState } = React;
  const { Icon, Avatar, RoleBadge, Button, Card } = RUI;
  const r = RADIA;

  function Members() {
    const [rows, setRows] = useState(r.profiles);
    const [q, setQ] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [invite, setInvite] = useState(false);

    const filtered = rows.filter(p =>
      (roleFilter === 'all' || p.role === roleFilter) &&
      (`${p.first_name} ${p.last_name} ${p.title} ${p.email}`.toLowerCase().includes(q.toLowerCase())));

    const counts = { creator: 1, moderator: rows.filter(p => p.role === 'moderator').length, user: rows.filter(p => p.role === 'user').length };

    const Filter = ({ k, label, n }) => (
      <button onClick={() => setRoleFilter(k)} style={{
        padding: '6px 12px', fontSize: 13, fontWeight: 500, borderRadius: 'var(--radius-md)', cursor: 'pointer',
        border: `1px solid ${roleFilter === k ? 'transparent' : 'var(--border)'}`,
        background: roleFilter === k ? 'var(--accent-soft)' : 'var(--surface)',
        color: roleFilter === k ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
      }}>{label}{n != null && <span style={{ marginLeft: 6, color: 'var(--fg-3)' }}>{n}</span>}</button>
    );

    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[
            { l: 'Members', v: rows.length, i: 'users', t: { s: 'var(--accent-soft)', f: 'var(--accent)' } },
            { l: 'Moderators', v: counts.moderator, i: 'shield-check', t: { s: 'var(--info-soft)', f: 'var(--info)' } },
            { l: 'Pending invites', v: 2, i: 'mail', t: { s: 'var(--warning-soft)', f: 'var(--warning)' } },
            { l: 'Onboarding', v: rows.filter(p => !p.onboarding_completed).length, i: 'graduation-cap', t: { s: 'var(--radia-violet-50)', f: 'var(--radia-violet-600)' } },
          ].map(s => (
            <Card key={s.l} pad={16}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500 }}>{s.l}</span>
                <span style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: s.t.s, color: s.t.f, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={s.i} size={16} /></span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{s.v}</div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '8px 12px', width: 260, color: 'var(--fg-3)' }}>
            <Icon name="search" size={15} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search people…" style={{ border: 0, outline: 'none', background: 'transparent', fontSize: 13, fontFamily: 'var(--font-sans)', color: 'var(--fg-1)', width: '100%' }} />
          </div>
          <Filter k="all" label="All" />
          <Filter k="moderator" label="Moderators" n={counts.moderator} />
          <Filter k="user" label="Users" n={counts.user} />
          <Button icon="user-plus" style={{ marginLeft: 'auto' }} onClick={() => setInvite(true)}>Invite member</Button>
        </div>

        <Card pad={0} style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              {['Member', 'Title', 'Role', 'Onboarding', 'Started', ''].map((h, i) => <th key={i} style={{ textAlign: i === 5 ? 'right' : 'left', padding: '11px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar person={p} size={32} />
                      <div><div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div><div style={{ fontSize: 12, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>{p.email}</div></div>
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', color: 'var(--fg-2)' }}>{p.title}</td>
                  <td style={{ padding: '11px 16px' }}><RoleBadge role={p.role} /></td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: p.onboarding_completed ? 'var(--success)' : 'var(--warning)' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor' }} />{p.onboarding_completed ? 'Complete' : 'In progress'}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px', color: 'var(--fg-3)' }}>{r.fmtDate(p.started_date)}</td>
                  <td style={{ padding: '11px 16px', textAlign: 'right' }}>
                    <button style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-3)', padding: 6, borderRadius: 'var(--radius-md)', display: 'inline-flex' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name="more-horizontal" size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {invite && (
          <div onClick={() => setInvite(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div onClick={e => e.stopPropagation()} style={{ width: 420, background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 600 }}>Invite member</h3>
                <button onClick={() => setInvite(false)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-3)', display: 'inline-flex' }}><Icon name="x" size={18} /></button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '4px 0 18px' }}>They'll receive an email to join Radia Corp.</p>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-2)' }}>Email address</label>
              <input placeholder="name@radiacorp.com" style={{ width: '100%', boxSizing: 'border-box', marginTop: 6, fontFamily: 'var(--font-sans)', fontSize: 14, border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '9px 12px', outline: 'none' }} />
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-2)', display: 'block', marginTop: 14 }}>Role</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                {['user', 'moderator'].map(role => <span key={role} style={{ flex: 1, textAlign: 'center', padding: '9px', fontSize: 13, fontWeight: 500, border: `1px solid ${role === 'user' ? 'var(--accent)' : 'var(--border)'}`, color: role === 'user' ? 'var(--accent)' : 'var(--fg-2)', background: role === 'user' ? 'var(--accent-soft)' : 'var(--surface)', borderRadius: 'var(--radius-lg)', cursor: 'pointer', textTransform: 'capitalize' }}>{role}</span>)}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
                <Button variant="secondary" onClick={() => setInvite(false)}>Cancel</Button>
                <Button icon="send" onClick={() => setInvite(false)}>Send invite</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  window.Members = Members;
})();
