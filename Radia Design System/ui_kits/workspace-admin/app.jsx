/* Radia Workspace-Admin Kit — app wiring. */
(function () {
  const { useState } = React;
  const { AppShell, Topbar, Button } = RUI;

  const NAV = [
    { key: 'people', label: 'People', icon: 'users' },
    { key: 'sops', label: 'SOPs', icon: 'book-open' },
    { key: 'courses', label: 'Onboarding', icon: 'graduation-cap' },
    { key: 'integrations', label: 'Integrations', icon: 'plug' },
  ];
  const FOOTER = [{ key: 'settings', label: 'Workspace Settings', icon: 'settings' }];

  const META = {
    people: { title: 'People', subtitle: 'Manage members, roles, and onboarding' },
    sops: { title: 'SOPs', subtitle: 'Author and publish standard operating procedures' },
    courses: { title: 'Onboarding', subtitle: 'Build courses and assign them to new hires' },
    integrations: { title: 'Integrations', subtitle: 'Webhook connections for Radia Corp' },
    settings: { title: 'Workspace Settings' },
  };

  function App() {
    const [screen, setScreen] = useState('people');
    const meta = META[screen];
    const Screen = {
      people: window.Members, sops: window.SopsAdmin, courses: window.CoursesAdmin,
      integrations: window.IntegrationsAdmin,
      settings: () => <div style={{ padding: 28, color: 'var(--fg-3)' }}>Workspace name, subdomain, branding, and danger zone.</div>,
    }[screen];
    return (
      <AppShell nav={NAV} footerNav={FOOTER} active={screen} onNavigate={setScreen} kicker="Radia Corp · Admin"
        topbar={<Topbar title={meta.title} subtitle={meta.subtitle} search />}>
        <Screen />
      </AppShell>
    );
  }
  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
