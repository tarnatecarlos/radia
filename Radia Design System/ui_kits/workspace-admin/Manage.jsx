/* Radia Workspace-Admin Kit — Content management: SOPs authoring, course
   builder, integrations config. window.SopsAdmin, window.CoursesAdmin, window.IntegrationsAdmin */
(function () {
  const { useState } = React;
  const { Icon, Avatar, Button, Card } = RUI;
  const r = RADIA;

  /* ---- SOPs authoring (list + simple editor) ---- */
  function SopsAdmin() {
    const [open, setOpen] = useState(r.sops[0].id);
    const s = r.sops.find(x => x.id === open);
    const by = r.byId(s.last_updated_by);
    return (
      <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <Button icon="plus">New SOP</Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {r.sops.map(x => (
              <div key={x.id} onClick={() => setOpen(x.id)} style={{ padding: 14, borderRadius: 'var(--radius-lg)', cursor: 'pointer', background: open === x.id ? 'var(--surface)' : 'transparent', border: `1px solid ${open === x.id ? 'var(--accent)' : 'var(--border)'}`, boxShadow: open === x.id ? 'var(--shadow-sm)' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{x.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 11, color: 'var(--fg-3)' }}><span>{x.category}</span><span>·</span><span style={{ fontFamily: 'var(--font-mono)' }}>v{x.version}</span><span>·</span><span>{r.fmtShort(x.updated_at)}</span></div>
              </div>
            ))}
          </div>
        </div>
        <Card style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
            <input defaultValue={s.title} key={s.id} style={{ flex: 1, border: 0, outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg-1)' }} />
            <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Draft saved</span>
            <Button variant="secondary" size="sm" icon="eye">Preview</Button>
            <Button size="sm" icon="check">Publish v{s.version + 1}</Button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', borderBottom: '1px solid var(--border)', color: 'var(--fg-3)' }}>
            {['bold', 'italic', 'list', 'link', 'code', 'heading'].map(i => <button key={i} style={{ border: 0, background: 'transparent', padding: 7, borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'inherit', display: 'inline-flex' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name={i} size={16} /></button>)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 16, fontSize: 15, lineHeight: 1.7, color: 'var(--fg-2)' }}>
            <p style={{ marginTop: 0 }}>{s.excerpt}</p>
            <p>This document is maintained by the {s.category} team and reviewed quarterly. Edit the content here; publishing increments the version and notifies all workspace members.</p>
            <p style={{ color: 'var(--fg-3)' }}>Last updated {r.fmtDate(s.updated_at)} by {by?.first_name} {by?.last_name}.</p>
          </div>
        </Card>
      </div>
    );
  }

  /* ---- Course / onboarding builder ---- */
  function CoursesAdmin() {
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)' }}>Build courses and assign them to new hires.</p>
          <Button icon="plus" style={{ marginLeft: 'auto' }}>New course</Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {r.courses.map(c => {
            const assigned = r.profiles.filter(p => !p.onboarding_completed).slice(0, c.is_mandatory ? 2 : 1);
            return (
              <Card key={c.id} hover>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{c.title}</span>
                      {c.is_mandatory && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--danger)', background: 'var(--danger-soft)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>Required</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.5 }}>{c.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="book-open" size={13} />{c.lessons} lessons</span>
                  <div style={{ display: 'flex', marginLeft: 'auto', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex' }}>{assigned.map((p, i) => <span key={p.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar person={p} size={26} ring /></span>)}</div>
                    <Button variant="ghost" size="sm" icon="user-plus">Assign</Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---- Integrations config ---- */
  function IntegrationsAdmin() {
    const [list, setList] = useState(r.integrations);
    const toggle = id => setList(p => p.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-3)' }}>Connect messaging and dev tools to pipe events into tasks via webhooks.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {list.map(it => (
            <Card key={it.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, textTransform: 'capitalize' }}>{it.platform_name[0]}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, textTransform: 'capitalize' }}>{it.platform_name}</div>
                  <div style={{ fontSize: 12, color: it.is_active ? 'var(--success)' : 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: it.is_active ? 'var(--success)' : 'var(--radia-slate-300)' }} />{it.is_active ? 'Connected' : 'Not connected'}
                  </div>
                </div>
                <button onClick={() => toggle(it.id)} title="Toggle" style={{ marginLeft: 'auto', width: 38, height: 22, borderRadius: 'var(--radius-full)', border: 0, cursor: 'pointer', padding: 2, display: 'flex', justifyContent: it.is_active ? 'flex-end' : 'flex-start', background: it.is_active ? 'var(--accent)' : 'var(--radia-slate-300)', transition: 'background .15s' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff' }} />
                </button>
              </div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 10px', wordBreak: 'break-all' }}>
                radiacorp.app/api/webhooks/{it.platform_name}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  window.SopsAdmin = SopsAdmin;
  window.CoursesAdmin = CoursesAdmin;
  window.IntegrationsAdmin = IntegrationsAdmin;
})();
