/* Radia User Kit — Org Chart (redesign focus).
   Clean nodes on a dot-grid canvas, drag-to-pan, wheel zoom, layout toggle,
   click a person to open a detail panel. Exposes window.OrgChart. */
(function () {
  const { useState, useRef, useMemo, useEffect, useCallback } = React;
  const { Icon, Avatar, RoleBadge, Button } = RUI;

  const NODE_W = 208, NODE_H = 128;

  function subtreeW(n, gap) {
    if (!n.children || !n.children.length) return NODE_W;
    return n.children.reduce((s, c) => s + subtreeW(c, gap), 0) + (n.children.length - 1) * gap;
  }
  function subtreeH(n, gap) {
    if (!n.children || !n.children.length) return NODE_H;
    return n.children.reduce((s, c) => s + subtreeH(c, gap), 0) + (n.children.length - 1) * gap;
  }
  function layoutTD(n, x, y, pos) {
    const hGap = 36, vGap = 150;
    pos.set(n.id, { x, y });
    if (!n.children || !n.children.length) return;
    const total = subtreeW(n, hGap);
    let sx = x - total / 2;
    for (const c of n.children) {
      const w = subtreeW(c, hGap);
      layoutTD(c, sx + w / 2, y + vGap, pos);
      sx += w + hGap;
    }
  }
  function layoutLR(n, x, y, pos) {
    const hGap = 280, vGap = 28;
    pos.set(n.id, { x, y });
    if (!n.children || !n.children.length) return;
    const total = subtreeH(n, vGap);
    let sy = y - total / 2;
    for (const c of n.children) {
      const h = subtreeH(c, vGap);
      layoutLR(c, x + hGap, sy + h / 2, pos);
      sy += h + vGap;
    }
  }
  function flatten(n, depth, out, parent) {
    out.push({ p: n, parent, depth });
    (n.children || []).forEach(c => flatten(c, depth + 1, out, n.id));
    return out;
  }

  function Connectors({ flat, pos, mode }) {
    const lines = [];
    for (const node of flat) {
      if (!node.parent) continue;
      const a = pos.get(node.parent), b = pos.get(node.p.id);
      if (!a || !b) continue;
      let d;
      if (mode === 'td') {
        const y1 = a.y + NODE_H / 2, y2 = b.y - NODE_H / 2, my = (y1 + y2) / 2;
        d = `M ${a.x} ${y1} C ${a.x} ${my}, ${b.x} ${my}, ${b.x} ${y2}`;
      } else {
        const x1 = a.x + NODE_W / 2, x2 = b.x - NODE_W / 2, mx = (x1 + x2) / 2;
        d = `M ${x1} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${x2} ${b.y}`;
      }
      lines.push({ d, key: node.parent + node.p.id });
    }
    return (
      <svg style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {lines.map(l => <path key={l.key} d={l.d} stroke="var(--radia-slate-300)" strokeWidth="1.5" fill="none" />)}
      </svg>
    );
  }

  function Node({ node, pos, selected, onSelect, reports }) {
    const { p } = node;
    const c = RADIA.ROLE_COLORS[p.role];
    const [h, setH] = useState(false);
    return (
      <div onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onSelect(p.id); }}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
        style={{
          position: 'absolute', left: pos.x - NODE_W / 2, top: pos.y - NODE_H / 2,
          width: NODE_W, background: 'var(--surface)', cursor: 'pointer',
          border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-xl)', padding: 16,
          boxShadow: selected ? 'var(--shadow-focus), var(--shadow-md)' : (h ? 'var(--shadow-md)' : 'var(--shadow-sm)'),
          transition: 'box-shadow .18s, border-color .18s', userSelect: 'none',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Avatar person={p} size={42} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <RoleBadge role={p.role} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}>
            {reports > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="users" size={12} />{reports}</span>}
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.onboarding_completed ? 'var(--success)' : 'var(--warning)' }} />
          </span>
        </div>
      </div>
    );
  }

  function DetailPanel({ p, onClose }) {
    if (!p) return null;
    const mgr = p.manager_id ? RADIA.byId(p.manager_id) : null;
    const reports = RADIA.profiles.filter(x => x.manager_id === p.id);
    return (
      <div style={{
        position: 'absolute', top: 16, right: 16, bottom: 16, width: 300, zIndex: 30,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)', padding: 20, overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-3)', padding: 4, display: 'inline-flex' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, marginTop: -8 }}>
          <Avatar person={p} size={64} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--fg-1)' }}>{p.first_name} {p.last_name}</div>
            <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>{p.title}</div>
          </div>
          <RoleBadge role={p.role} size="md" />
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field icon="mail" label="Email" value={p.email} mono />
          <Field icon="calendar" label="Started" value={RADIA.fmtDate(p.started_date)} />
          <Field icon="user" label="Reports to" value={mgr ? `${mgr.first_name} ${mgr.last_name}` : '—'} />
          <Field icon="graduation-cap" label="Onboarding" value={p.onboarding_completed ? 'Completed' : 'In progress'} tone={p.onboarding_completed ? 'var(--success)' : 'var(--warning)'} />
        </div>
        {reports.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>Direct reports · {reports.length}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Avatar person={r} size={28} />
                  <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>{r.first_name} {r.last_name}<span style={{ color: 'var(--fg-3)' }}> · {r.title}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  function Field({ icon, label, value, mono, tone }) {
    return (
      <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <span style={{ color: 'var(--fg-3)', marginTop: 1 }}><Icon name={icon} size={15} /></span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{label}</div>
          <div style={{ fontSize: 13, color: tone || 'var(--fg-1)', fontFamily: mono ? 'var(--font-mono)' : 'inherit', wordBreak: 'break-all', fontWeight: tone ? 600 : 400 }}>{value}</div>
        </div>
      </div>
    );
  }

  function OrgChart() {
    const tree = useMemo(() => RADIA.buildTree(), []);
    const flat = useMemo(() => flatten(tree, 0, [], null), [tree]);
    const reportsCount = useMemo(() => {
      const m = {}; RADIA.profiles.forEach(p => { if (p.manager_id) m[p.manager_id] = (m[p.manager_id] || 0) + 1; }); return m;
    }, []);
    const [mode, setMode] = useState('td');
    const pos = useMemo(() => {
      const m = new Map();
      if (mode === 'td') layoutTD(tree, 0, 0, m); else layoutLR(tree, 0, 0, m);
      return m;
    }, [tree, mode]);

    const wrapRef = useRef(null);
    const [view, setView] = useState({ x: 0, y: 0, z: 1 });
    const [sel, setSel] = useState(null);
    const pan = useRef(null);

    const fit = useCallback(() => {
      const el = wrapRef.current; if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < 60 || rect.height < 60) return; // not laid out yet
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      pos.forEach(p => { minX = Math.min(minX, p.x - NODE_W / 2); maxX = Math.max(maxX, p.x + NODE_W / 2); minY = Math.min(minY, p.y - NODE_H / 2); maxY = Math.max(maxY, p.y + NODE_H / 2); });
      const cw = maxX - minX + 120, ch = maxY - minY + 120;
      const z = Math.min(Math.max(Math.min(rect.width / cw, rect.height / ch), 0.35), 1.1);
      setView({ z, x: rect.width / 2 - ((minX + maxX) / 2) * z, y: rect.height / 2 - ((minY + maxY) / 2) * z });
    }, [pos]);

    // Fit on layout change. setTimeout (not rAF — rAF is throttled in background
    // iframes) with a few retries until the canvas has reached its real size.
    useEffect(() => {
      const ids = [0, 80, 200, 400].map(d => setTimeout(fit, d));
      return () => ids.forEach(clearTimeout);
    }, [fit, mode]);

    // Refit when the container resizes.
    useEffect(() => {
      const el = wrapRef.current; if (!el || !window.ResizeObserver) return;
      const ro = new ResizeObserver(() => fit());
      ro.observe(el);
      return () => ro.disconnect();
    }, [fit]);

    useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const onWheel = e => {
        e.preventDefault();
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        setView(v => {
          const nz = Math.min(Math.max(v.z * (e.deltaY < 0 ? 1.1 : 0.9), 0.35), 1.6);
          const s = nz / v.z;
          return { z: nz, x: mx - (mx - v.x) * s, y: my - (my - v.y) * s };
        });
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
      const mv = e => { if (pan.current) setView(v => ({ ...v, x: pan.current.vx + (e.clientX - pan.current.mx), y: pan.current.vy + (e.clientY - pan.current.my) })); };
      const up = () => { pan.current = null; if (wrapRef.current) wrapRef.current.style.cursor = 'grab'; };
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
      return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
    }, []);

    const onDown = e => { pan.current = { mx: e.clientX, my: e.clientY, vx: view.x, vy: view.y }; wrapRef.current.style.cursor = 'grabbing'; };
    const zoom = f => setView(v => ({ ...v, z: Math.min(Math.max(v.z * f, 0.35), 1.6) }));
    const selPerson = sel ? RADIA.byId(sel) : null;

    const Tool = ({ active, icon, label, onClick }) => (
      <button onClick={onClick} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', fontSize: 13, fontWeight: 500,
        borderRadius: 'var(--radius-lg)', cursor: 'pointer',
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'var(--surface)',
        color: active ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
      }}><Icon name={icon} size={15} />{label}</button>
    );

    return (
      <div style={{ padding: 28, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Tool active={mode === 'td'} icon="arrow-down" label="Top-Down" onClick={() => setMode('td')} />
          <Tool active={mode === 'lr'} icon="arrow-right" label="Left-Right" onClick={() => setMode('lr')} />
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--fg-3)' }}>{RADIA.profiles.length} people · {Object.keys(reportsCount).length} managers</span>
        </div>
        <div ref={wrapRef} onMouseDown={onDown} onClick={() => setSel(null)}
          style={{ position: 'relative', flex: 1, borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', overflow: 'hidden', cursor: 'grab', background: 'var(--bg-app)' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle, var(--radia-slate-300) 1px, transparent 1px)', backgroundSize: `${22 * view.z}px ${22 * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px`, opacity: 0.5 }} />
          <div style={{ position: 'absolute', inset: 0, transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: '0 0' }}>
            <Connectors flat={flat} pos={pos} mode={mode} />
            {flat.map(n => { const p = pos.get(n.p.id); return p && <Node key={n.p.id} node={n} pos={p} selected={sel === n.p.id} onSelect={id => setSel(id)} reports={reportsCount[n.p.id] || 0} />; })}
          </div>
          {/* zoom controls */}
          <div style={{ position: 'absolute', bottom: 16, right: selPerson ? 332 : 16, display: 'flex', alignItems: 'center', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 4, boxShadow: 'var(--shadow-md)', transition: 'right .2s' }}>
            <ZBtn icon="zoom-out" onClick={() => zoom(0.85)} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)', minWidth: 42, textAlign: 'center' }}>{Math.round(view.z * 100)}%</span>
            <ZBtn icon="zoom-in" onClick={() => zoom(1.18)} />
            <span style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 2px' }} />
            <ZBtn icon="maximize" onClick={fit} />
          </div>
          <div style={{ position: 'absolute', bottom: 18, left: 18, fontSize: 11, color: 'var(--fg-3)', userSelect: 'none', pointerEvents: 'none' }}>Drag to pan · scroll to zoom · click a person for details</div>
          <DetailPanel p={selPerson} onClose={() => setSel(null)} />
        </div>
      </div>
    );
  }
  function ZBtn({ icon, onClick }) {
    return <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--fg-2)', padding: 7, borderRadius: 'var(--radius-md)', display: 'inline-flex' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><Icon name={icon} size={16} /></button>;
  }

  window.OrgChart = OrgChart;
})();
