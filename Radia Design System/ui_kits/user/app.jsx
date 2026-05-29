/* Radia User Kit — app shell wiring. */
(function () {
  const { useState } = React;
  const { AppShell, Topbar, Button } = RUI;

  const NAV = [
    { key: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { key: 'tasks', label: 'Tasks', icon: 'check-square', badge: 7 },
    { key: 'orgchart', label: 'Org Chart', icon: 'network' },
    { key: 'onboarding', label: 'Onboarding', icon: 'graduation-cap' },
    { key: 'sops', label: 'SOPs', icon: 'book-open' },
  ];
  const FOOTER = [{ key: 'settings', label: 'Settings', icon: 'settings' }];

  const META = {
    dashboard: { title: 'Dashboard' },
    tasks: { title: 'Tasks', subtitle: 'Your team\u2019s work across every status' },
    orgchart: { title: 'Organization Chart', subtitle: '10 employees across the organization' },
    onboarding: { title: 'Onboarding', subtitle: 'Courses and lessons for your ramp-up' },
    sops: { title: 'SOPs', subtitle: 'Standard operating procedures & knowledge base' },
    settings: { title: 'Settings' },
  };

  function App() {
    const [screen, setScreen] = useState('orgchart');
    const meta = META[screen];
    const noPadTopbar = screen === 'dashboard';
    const Screen = {
      dashboard: window.Dashboard, tasks: window.Tasks, orgchart: window.OrgChart,
      onboarding: window.Onboarding, sops: window.Sops,
      settings: () => <div style={{ padding: 28, color: 'var(--fg-3)' }}>Settings — workspace & personal preferences.</div>,
    }[screen];

    return (
      <AppShell nav={NAV} footerNav={FOOTER} active={screen} onNavigate={setScreen}
        kicker="HR Workspace" showMessages
        topbar={!noPadTopbar && <Topbar title={meta.title} subtitle={meta.subtitle}
          search actions={screen === 'tasks' ? null : <Button variant="secondary" icon="bell" size="sm" style={{ padding: 9 }} />} />}>
        <Screen />
      </AppShell>
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
