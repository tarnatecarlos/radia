/* Radia User Kit — Tasks (Kanban / List / Table, drag between columns). window.Tasks */
(function () {
  const { useState } = React;
  const { Icon, Avatar, Button, StatusPill, PRIORITY } = RUI;
  const r = RADIA;

  const COLS = [
    { key: 'TODO', label: 'To Do', dot: 'var(--radia-slate-400)' },
    { key: 'IN_PROGRESS', label: 'In Progress', dot: 'var(--info)' },
    { key: 'REVIEW', label: 'In Review', dot: 'var(--warning)' },
    { key: 'DONE', label: 'Done', dot: 'var(--success)' },
  ];
  const INTEG = {
    slack: { label: 'Slack', icon: 'message-square', color: 'var(--radia-rose-600)' },
    github: { label: 'GitHub', icon: 'git-branch', color: 'var(--fg-2)' },
    discord: { label: 'Discord', icon: 'disc', color: 'var(--radia-indigo-600)' },
  };

  function TaskCard({ t, onDragStart, dragging }) {
    const a = r.byId(t.assignee_id);
    const badge = t.integration_source ? INTEG[t.integration_source] : null;
    return (
      <div draggable onDragStart={e => onDragStart(e, t.id)}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: 14, cursor: 'grab', boxShadow: dragging ? 'var(--shadow-md)' : 'var(--shadow-xs)',
          opacity: dragging ? 0.5 : 1, transition: 'box-shadow .15s',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {a && <Avatar person={a} size={26} />}
          <span style={{ fontSize: 12, color: 'var(--fg-2)', fontWeight: 500 }}>{a ? `${a.first_name} ${a.last_name}` : 'Unassigned'}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)' }}>{r.fmtShort(t.created_at)}</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-1)', marginTop: 10, lineHeight: 1.3 }}>{t.title}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.description}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-3)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY[t.priority] }} />{t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}
          </span>
          {badge && <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: badge.color, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}><Icon name={badge.icon} size={11} />{badge.label}</span>}
        </div>
      </div>
    );
  }

  function Tasks() {
    const [view, setView] = useState('kanban');
    const [list, setList] = useState(r.tasks);
    const [drag, setDrag] = useState(null);
    const [over, setOver] = useState(null);

    const onDragStart = (e, id) => { e.dataTransfer.effectAllowed = 'move'; setDrag(id); };
    const onDrop = (col) => { setList(p => p.map(t => t.id === drag ? { ...t, status: col } : t)); setDrag(null); setOver(null); };
    const grouped = c => list.filter(t => t.status === c);

    const Tab = ({ k, label, icon }) => (
      <button onClick={() => setView(k)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 13, fontWeight: 500,
        borderRadius: 'var(--radius-md)', border: 0, cursor: 'pointer',
        background: view === k ? 'var(--surface)' : 'transparent', color: view === k ? 'var(--fg-1)' : 'var(--fg-3)',
        boxShadow: view === k ? 'var(--shadow-xs)' : 'none',
      }}><Icon name={icon} size={15} />{label}</button>
    );

    return (
      <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 18, height: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-sunken)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 3 }}>
            <Tab k="table" label="Table" icon="table" /><Tab k="list" label="List" icon="list" /><Tab k="kanban" label="Kanban" icon="layout-grid" />
          </div>
          <Button icon="plus" style={{ marginLeft: 'auto' }}>Create Task</Button>
        </div>

        {view === 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, flex: 1, minHeight: 0 }}>
            {COLS.map(col => (
              <div key={col.key}
                onDragOver={e => { e.preventDefault(); setOver(col.key); }}
                onDragLeave={() => setOver(o => o === col.key ? null : o)}
                onDrop={() => onDrop(col.key)}
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', border: `1px solid ${over === col.key ? 'var(--accent)' : 'var(--border)'}`, background: over === col.key ? 'var(--accent-soft)' : 'var(--surface-2)', transition: 'background .15s, border-color .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.dot }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>{col.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', background: 'var(--surface)', borderRadius: 'var(--radius-full)', padding: '1px 7px' }}>{grouped(col.key).length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, overflowY: 'auto' }}>
                  {grouped(col.key).map(t => <TaskCard key={t.id} t={t} onDragStart={onDragStart} dragging={drag === t.id} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(t => { const a = r.byId(t.assignee_id); return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14, boxShadow: 'var(--shadow-xs)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY[t.priority], flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div><div style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div></div>
                <StatusPill status={t.status} />
                {a && <Avatar person={a} size={28} />}
              </div>
            ); })}
          </div>
        )}

        {view === 'table' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Status', 'Priority', 'Assignee', 'Due'].map(h => <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {list.map(t => { const a = r.byId(t.assignee_id); return (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}><div style={{ fontWeight: 600 }}>{t.title}</div></td>
                    <td style={{ padding: '12px 16px' }}><StatusPill status={t.status} dot={false} /></td>
                    <td style={{ padding: '12px 16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-2)' }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY[t.priority] }} />{t.priority.charAt(0) + t.priority.slice(1).toLowerCase()}</span></td>
                    <td style={{ padding: '12px 16px' }}>{a && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Avatar person={a} size={24} /><span style={{ color: 'var(--fg-2)' }}>{a.first_name} {a.last_name}</span></span>}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--fg-3)' }}>{r.fmtShort(t.due_date)}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }
  window.Tasks = Tasks;
})();
