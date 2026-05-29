/* Radia UI Kits — shared primitives + app shell. Exposes window.RUI.
   Requires: React, window.RADIA, window.lucide (Lucide UMD). */
(function () {
  const { useRef, useEffect } = React;

  /* ---- Icon (Lucide, React-safe via imperative innerHTML) ---- */
  function Icon({ name, size = 18, color, style, strokeWidth = 2 }) {
    const ref = useRef(null);
    useEffect(() => {
      if (!ref.current || !window.lucide) return;
      ref.current.innerHTML = `<i data-lucide="${name}"></i>`;
      window.lucide.createIcons({ attrs: { width: size, height: size, 'stroke-width': strokeWidth } });
    }, [name, size, strokeWidth]);
    return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', color: color || 'currentColor', ...style }} />;
  }

  /* ---- Avatar ---- */
  function Avatar({ person, size = 32, ring }) {
    const r = RADIA;
    return (
      <span style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: r.avatarColor(person.id), color: '#fff',
        fontWeight: 600, fontSize: size * 0.36,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: ring ? '0 0 0 2px var(--surface)' : 'none',
        fontFamily: 'var(--font-sans)',
      }}>{r.initials(person)}</span>
    );
  }

  /* ---- RoleBadge ---- */
  function RoleBadge({ role, size = 'sm' }) {
    const c = RADIA.ROLE_COLORS[role];
    if (!c) return null;
    const pad = size === 'sm' ? '2px 8px' : '3px 10px';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: pad,
        borderRadius: 'var(--radius-full)', fontSize: 11, fontWeight: 600,
        background: c.soft, color: c.hue, whiteSpace: 'nowrap',
      }}>{c.label}</span>
    );
  }

  /* ---- StatusPill ---- */
  const STATUS = {
    TODO: { label: 'To Do', dot: 'var(--radia-slate-400)', bg: 'var(--surface-2)', fg: 'var(--fg-2)' },
    IN_PROGRESS: { label: 'In Progress', dot: 'var(--info)', bg: 'var(--info-soft)', fg: 'var(--info)' },
    REVIEW: { label: 'Review', dot: 'var(--warning)', bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    DONE: { label: 'Done', dot: 'var(--success)', bg: 'var(--success-soft)', fg: 'var(--success)' },
    pending: { label: 'Pending', dot: 'var(--warning)', bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    approved: { label: 'Approved', dot: 'var(--success)', bg: 'var(--success-soft)', fg: 'var(--success)' },
    rejected: { label: 'Rejected', dot: 'var(--danger)', bg: 'var(--danger-soft)', fg: 'var(--danger)' },
  };
  function StatusPill({ status, dot = true }) {
    const s = STATUS[status] || STATUS.TODO;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
        borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 600,
        background: s.bg, color: s.fg, whiteSpace: 'nowrap',
      }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />}
        {s.label}
      </span>
    );
  }

  const PRIORITY = { HIGH: 'var(--danger)', MEDIUM: 'var(--warning)', LOW: 'var(--success)' };

  /* ---- Button ---- */
  function Button({ variant = 'primary', icon, children, onClick, size = 'md', style, title }) {
    const base = {
      fontFamily: 'var(--font-sans)', fontWeight: 500, cursor: 'pointer',
      borderRadius: 'var(--radius-lg)', display: 'inline-flex', alignItems: 'center',
      gap: 7, border: '1px solid transparent', transition: 'background .15s, box-shadow .15s, transform .1s',
      fontSize: size === 'sm' ? 13 : 14, padding: size === 'sm' ? '6px 12px' : '9px 16px',
      whiteSpace: 'nowrap', ...style,
    };
    const variants = {
      primary: { background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-xs)' },
      secondary: { background: 'var(--surface)', color: 'var(--fg-1)', borderColor: 'var(--border-strong)' },
      ghost: { background: 'transparent', color: 'var(--fg-2)' },
      danger: { background: 'var(--danger-soft)', color: 'var(--danger)' },
      success: { background: 'var(--success-soft)', color: 'var(--success)' },
    };
    const hover = {
      primary: e => e.currentTarget.style.background = 'var(--accent-hover)',
      secondary: e => e.currentTarget.style.background = 'var(--surface-2)',
      ghost: e => e.currentTarget.style.background = 'var(--surface-2)',
      danger: e => e.currentTarget.style.filter = 'brightness(.97)',
      success: e => e.currentTarget.style.filter = 'brightness(.97)',
    };
    const out = {
      primary: e => e.currentTarget.style.background = 'var(--accent)',
      secondary: e => e.currentTarget.style.background = 'var(--surface)',
      ghost: e => e.currentTarget.style.background = 'transparent',
      danger: e => e.currentTarget.style.filter = 'none',
      success: e => e.currentTarget.style.filter = 'none',
    };
    return (
      <button onClick={onClick} title={title} style={{ ...base, ...variants[variant] }}
        onMouseEnter={hover[variant]} onMouseLeave={out[variant]}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
        {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
        {children}
      </button>
    );
  }

  /* ---- Card ---- */
  function Card({ children, style, pad = 24, hover }) {
    const ref = useRef(null);
    return (
      <div ref={ref} style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', padding: pad,
        transition: 'box-shadow .2s', ...style,
      }}
        onMouseEnter={hover ? () => ref.current.style.boxShadow = 'var(--shadow-md)' : undefined}
        onMouseLeave={hover ? () => ref.current.style.boxShadow = 'var(--shadow-sm)' : undefined}>
        {children}
      </div>
    );
  }

  /* ---- AppShell: sidebar + topbar + content ---- */
  function AppShell({ nav, active, onNavigate, kicker, showMessages, topbar, children, footerNav }) {
    const r = RADIA;
    const NavItem = ({ item }) => {
      const isActive = active === item.key;
      const ref = useRef(null);
      return (
        <div ref={ref} onClick={() => onNavigate(item.key)} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
          borderRadius: 'var(--radius-lg)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          position: 'relative', color: isActive ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
          background: isActive ? 'var(--accent-soft)' : 'transparent',
        }}
          onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
          {isActive && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: '0 3px 3px 0', background: 'var(--accent)' }} />}
          <Icon name={item.icon} size={18} />
          <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
          {item.badge != null && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--fg-3)', background: 'var(--surface-2)', borderRadius: 'var(--radius-full)', padding: '1px 7px' }}>{item.badge}</span>}
        </div>
      );
    };
    return (
      <div style={{ display: 'flex', height: '100%', background: 'var(--bg-app)', fontFamily: 'var(--font-sans)', color: 'var(--fg-1)' }}>
        {/* Sidebar */}
        <aside style={{ width: 240, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>Radia</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 3, letterSpacing: '0.02em' }}>{kicker}</div>
          </div>
          <nav style={{ flex: 1, padding: '4px 12px', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '8px 12px 6px' }}>Menu</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {nav.map(item => <NavItem key={item.key} item={item} />)}
            </div>
            {showMessages && (
              <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)', padding: '0 12px 8px' }}>Messages</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {r.integrations.map(it => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', fontSize: 13, color: it.is_active ? 'var(--fg-2)' : 'var(--fg-3)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: it.is_active ? it.color : 'var(--radia-slate-300)', flexShrink: 0 }} />
                      <span style={{ textTransform: 'capitalize' }}>{it.platform_name}</span>
                      {it.is_active && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--success)' }}>Active</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </nav>
          <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
            {footerNav && footerNav.map(item => <NavItem key={item.key} item={item} />)}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginTop: 4 }}>
              <Avatar person={r.currentUser} size={34} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.currentUser.first_name} {r.currentUser.last_name}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.currentUser.title}</div>
              </div>
            </div>
          </div>
        </aside>
        {/* Main */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {topbar}
          <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
        </main>
      </div>
    );
  }

  /* ---- Topbar ---- */
  function Topbar({ title, subtitle, actions, search }) {
    return (
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 'var(--text-2xl)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg-1)' }}>{title}</h1>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--fg-3)' }}>{subtitle}</p>}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {search && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '7px 12px', width: 220, color: 'var(--fg-3)' }}>
              <Icon name="search" size={15} />
              <span style={{ fontSize: 13 }}>Search…</span>
            </div>
          )}
          {actions}
        </div>
      </header>
    );
  }

  window.RUI = { Icon, Avatar, RoleBadge, StatusPill, Button, Card, AppShell, Topbar, STATUS, PRIORITY };
})();
