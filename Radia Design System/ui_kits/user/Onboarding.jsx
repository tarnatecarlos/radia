/* Radia User Kit — Onboarding (courses) + SOPs (knowledge base). window.Onboarding, window.Sops */
(function () {
  const { useState } = React;
  const { Icon, Card, Button } = RUI;
  const r = RADIA;

  function Onboarding() {
    const prog = { c1: 75, c2: 33, c3: 0, c4: 50 };
    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 18, background: 'var(--accent-soft)', border: '1px solid var(--radia-indigo-100)' }}>
          <span style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="graduation-cap" size={24} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--fg-1)' }}>You're 68% through onboarding</div>
            <div style={{ fontSize: 13, color: 'var(--accent-soft-fg)', marginTop: 2 }}>Finish your mandatory courses to complete setup.</div>
          </div>
          <Button>Resume</Button>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
          {r.courses.map(c => {
            const p = prog[c.id];
            const done = p === 100;
            return (
              <Card key={c.id} hover style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{c.title}</span>
                      {c.is_mandatory && <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--danger)', background: 'var(--danger-soft)', padding: '2px 7px', borderRadius: 'var(--radius-full)' }}>Required</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.5 }}>{c.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--fg-3)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="book-open" size={13} />{c.lessons} lessons</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="clock" size={13} />~{c.lessons * 12} min</span>
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><span style={{ color: 'var(--fg-3)' }}>{done ? 'Completed' : 'Progress'}</span><span style={{ fontWeight: 600, color: done ? 'var(--success)' : 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>{p}%</span></div>
                  <div style={{ height: 7, borderRadius: 'var(--radius-full)', background: 'var(--surface-sunken)', overflow: 'hidden' }}>
                    <div style={{ width: p + '%', height: '100%', borderRadius: 'var(--radius-full)', background: done ? 'var(--success)' : 'var(--accent)' }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  function Sops() {
    const [open, setOpen] = useState(r.sops[0].id);
    const cats = [...new Set(r.sops.map(s => s.category))];
    const catColor = { General: 'var(--fg-2)', Engineering: 'var(--info)', Design: 'var(--radia-violet-600)', HR: 'var(--success)' };
    return (
      <div style={{ padding: 28, display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
          {r.sops.map(s => (
            <div key={s.id} onClick={() => setOpen(s.id)} style={{
              padding: 16, borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              background: open === s.id ? 'var(--surface)' : 'transparent',
              border: `1px solid ${open === s.id ? 'var(--accent)' : 'var(--border)'}`,
              boxShadow: open === s.id ? 'var(--shadow-sm)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: catColor[s.category], background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>{s.category}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>v{s.version}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 8 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 3, lineHeight: 1.4 }}>{s.excerpt}</div>
            </div>
          ))}
        </div>
        <Card style={{ overflowY: 'auto' }}>
          {(() => { const s = r.sops.find(x => x.id === open); const by = r.byId(s.last_updated_by);
            return (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: catColor[s.category], background: 'var(--surface-2)', padding: '3px 9px', borderRadius: 'var(--radius-full)' }}>{s.category}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>Version {s.version}</span>
                </div>
                <h2 style={{ margin: '14px 0 6px', fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em' }}>{s.title}</h2>
                <div style={{ fontSize: 12, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>Updated {r.fmtDate(s.updated_at)} by {by?.first_name} {by?.last_name}</div>
                <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />
                <p style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.7 }}>{s.excerpt} This document is maintained by the {s.category} team and reviewed quarterly. All members are expected to read and acknowledge the latest version.</p>
                <Button variant="secondary" icon="file-text" style={{ marginTop: 16 }}>Open full document</Button>
              </div>
            );
          })()}
        </Card>
      </div>
    );
  }
  window.Onboarding = Onboarding;
  window.Sops = Sops;
})();
