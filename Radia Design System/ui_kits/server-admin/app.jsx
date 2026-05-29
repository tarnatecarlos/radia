/* Radia Server-Admin Kit — app wiring. */
(function () {
  const { useState } = React;
  const { AppShell, Topbar } = RUI;

  const NAV = [
    { key: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { key: 'requests', label: 'Access Requests', icon: 'user-check', badge: 2 },
    { key: 'admins', label: 'Server Admins', icon: 'shield' },
    { key: 'workspaces', label: 'Workspaces', icon: 'building' },
    { key: 'audit', label: 'Audit Log', icon: 'scroll-text' },
  ];

  const META = {
    overview: { title: 'Server Administration', subtitle: 'Platform-wide health and operations' },
    requests: { title: 'Access Requests', subtitle: 'Review server-level role requests' },
    admins: { title: 'Server Admins', subtitle: 'Users with platform-level access' },
    workspaces: { title: 'Workspaces', subtitle: 'Every workspace on the platform' },
    audit: { title: 'Audit Log', subtitle: 'Server-level activity trail' },
  };

  function App() {
    const [screen, setScreen] = useState('overview');
    const meta = META[screen];
    const Screen = {
      overview: window.Overview, requests: window.AccessRequests, admins: window.ServerAdminsScreen,
      workspaces: window.Workspaces, audit: window.AuditLog,
    }[screen];
    return (
      <AppShell nav={NAV} active={screen} onNavigate={setScreen} kicker="Platform Operations"
        topbar={<Topbar title={meta.title} subtitle={meta.subtitle} />}>
        <Screen />
      </AppShell>
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
