/* Radia Server-Admin Kit — platform operations console.
   window.Overview, window.AccessRequests, window.ServerAdminsScreen, window.Workspaces, window.AuditLog */
(function () {
  const { useState } = React;
  const { Icon, Avatar, RoleBadge, StatusPill, Button, Card } = RUI;
  const r = RADIA;

  function SectionHead({ icon, tone, title, right }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: tone.s, color: tone.f, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></span>
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h3>
        {right}
      </div>
    );
  }

  /* ---- Overview: system health ---- */
  function Overview() {
    const health = [
      { icon: 'database', label: 'Database', status: 'Healthy', sub: '24ms latency', tone: 'var(--success)' },
      { icon: 'activity', label: 'API', status: 'Operational', sub: '120 req/min', tone: 'var(--success)' },
      { icon: 'hard-drive', label: 'Storage', status: '45.2 GB', sub: 'of 100 GB', tone: 'var(--info)', bar: 45.2 },
      { icon: 'clock', label: 'Uptime', status: '99.97%', sub: 'last 30 days', tone: 'var(--radia-violet-600)' },
    ];
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--warning-soft)', border: '1px solid var(--radia-amber-500)', color: 'var(--warning)', borderRadius: 'var(--radius-lg)', padding: '11px 16px', fontSize: 13, fontWeight: 600 }}>
          <Icon name="alert-triangle" size={16} /> Server-level access — actions here affect every workspace on the platform.
        </div>
        <SectionHead icon="activity" tone={{ s: 'var(--success-soft)', f: 'var(--success)' }} title="System Health" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {health.map(h => (
            <Card key={h.label} pad={18}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)' }}><Icon name={h.icon} size={15} /><span style={{ fontSize: 13, fontWeight: 500 }}>{h.label}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                {!h.bar && <span style={{ width: 8, height: 8, borderRadius: '50%', background: h.tone }} />}
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>{h.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4 }}>{h.sub}</div>
              {h.bar && <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--surface-sunken)', marginTop: 10, overflow: 'hidden' }}><div style={{ width: h.bar + '%', height: '100%', background: 'var(--info)', borderRadius: 'var(--radius-full)' }} /></div>}
            </Card>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[{ l: 'Workspaces', v: 1, i: 'building' }, { l: 'Total users', v: 10, i: 'users' }, { l: 'Pending requests', v: r.adminRequests.filter(x => x.status === 'pending').length, i: 'user-check' }].map(s => (
            <Card key={s.l} pad={18}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: 'var(--fg-2)', fontWeight: 500 }}>{s.l}</span><Icon name={s.i} size={16} color="var(--fg-3)" /></div>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 6 }}>{s.v}</div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Access Requests ---- */
  function AccessRequests() {
    const [st, setSt] = useState(() => Object.fromEntries(r.adminRequests.map(x => [x.id, x.status])));
    const set = (id, v) => setSt(p => ({ ...p, [id]: v }));
    const pending = Object.values(st).filter(v => v === 'pending').length;
    return (
      <div style={{ padding: 28 }}>
        <Card pad={24}>
          <SectionHead icon="user-check" tone={{ s: 'var(--warning-soft)', f: 'var(--warning)' }} title="Access Requests"
            right={<span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: 'var(--fg-3)', background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>{pending} pending</span>} />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Requestor', 'Requested role', 'Reason', 'Status', 'Date', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '0 12px 11px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {r.adminRequests.map(req => {
                const p = r.byId(req.profile_id); const status = st[req.id];
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Avatar person={p} size={28} /><span style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</span></div></td>
                    <td style={{ padding: '12px' }}><RoleBadge role={req.requested_role} /></td>
                    <td style={{ padding: '12px', maxWidth: 240, color: 'var(--fg-2)' }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason}</div></td>
                    <td style={{ padding: '12px' }}><StatusPill status={status} /></td>
                    <td style={{ padding: '12px', color: 'var(--fg-3)' }}>{r.fmtShort(req.created_at)}</td>
                    <td style={{ padding: '12px' }}>
                      {status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Button variant="success" size="sm" icon="check" onClick={() => set(req.id, 'approved')}>Approve</Button>
                          <Button variant="danger" size="sm" icon="x" onClick={() => set(req.id, 'rejected')}>Reject</Button>
                        </div>
                      ) : <span style={{ color: 'var(--fg-3)', fontSize: 13 }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  /* ---- Server Admins ---- */
  function ServerAdminsScreen() {
    return (
      <div style={{ padding: 28 }}>
        <Card pad={24}>
          <SectionHead icon="shield" tone={{ s: 'var(--danger-soft)', f: 'var(--danger)' }} title="Server Admins"
            right={<Button size="sm" icon="plus" style={{ marginLeft: 'auto' }}>Grant access</Button>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {r.serverAdmins.map(a => { const p = r.byId(a.profile_id); return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <Avatar person={p} size={42} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}><RoleBadge role={a.server_role} /><span style={{ fontSize: 11, color: 'var(--fg-3)' }}>since {r.fmtShort(a.granted_at)}</span></div>
                </div>
              </div>
            ); })}
          </div>
        </Card>
      </div>
    );
  }

  /* ---- Workspaces ---- */
  function Workspaces() {
    return (
      <div style={{ padding: 28 }}>
        <Card pad={24}>
          <SectionHead icon="building" tone={{ s: 'var(--accent-soft)', f: 'var(--accent)' }} title="Workspaces" />
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Workspace', 'Subdomain', 'Members', 'SOPs', 'Courses', 'Actions'].map(h => <th key={h} style={{ textAlign: 'left', padding: '0 12px 11px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>)}
            </tr></thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 12px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 34, height: 34, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>R</span><span style={{ fontWeight: 600 }}>Radia Corp</span></div></td>
                <td style={{ padding: '14px 12px', color: 'var(--fg-2)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>radiacorp</td>
                <td style={{ padding: '14px 12px', color: 'var(--fg-2)' }}>10</td>
                <td style={{ padding: '14px 12px', color: 'var(--fg-2)' }}>5</td>
                <td style={{ padding: '14px 12px', color: 'var(--fg-2)' }}>4</td>
                <td style={{ padding: '14px 12px' }}><div style={{ display: 'flex', gap: 8 }}><Button variant="secondary" size="sm" icon="pause">Pause</Button><Button variant="danger" size="sm" icon="trash-2">Delete</Button></div></td>
              </tr>
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  /* ---- Audit Log ---- */
  function AuditLog() {
    return (
      <div style={{ padding: 28 }}>
        <Card pad={24}>
          <SectionHead icon="scroll-text" tone={{ s: 'var(--surface-2)', f: 'var(--fg-2)' }} title="Audit Log" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {r.auditLog.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', gap: 12, padding: '13px 0', borderTop: i ? '1px solid var(--border)' : 0 }}>
                <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--fg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="clock" size={14} /></span>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--fg-1)' }}>{e.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 3 }}>{e.actor} · {new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  Object.assign(window, { Overview, AccessRequests, ServerAdminsScreen, Workspaces, AuditLog });
})();
