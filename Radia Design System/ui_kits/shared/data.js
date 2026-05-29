/* Radia UI Kits — shared mock data + helpers. Ported/condensed from
   radia/src/lib/{mock-data.ts,types.ts}. Exposes window.RADIA. */
(function () {
  const profiles = [
    { id:'u1', email:'alex.rivera@radiacorp.com', first_name:'Alex', last_name:'Rivera', role:'creator', title:'CEO & Founder', manager_id:null, onboarding_completed:true, started_date:'2024-01-15' },
    { id:'u2', email:'sarah.chen@radiacorp.com', first_name:'Sarah', last_name:'Chen', role:'moderator', title:'HR Director', manager_id:'u1', onboarding_completed:true, started_date:'2024-02-01' },
    { id:'u3', email:'marcus.johnson@radiacorp.com', first_name:'Marcus', last_name:'Johnson', role:'moderator', title:'Engineering Lead', manager_id:'u1', onboarding_completed:true, started_date:'2024-02-15' },
    { id:'u4', email:'emily.park@radiacorp.com', first_name:'Emily', last_name:'Park', role:'moderator', title:'Design Lead', manager_id:'u1', onboarding_completed:true, started_date:'2024-03-01' },
    { id:'u5', email:'james.wilson@radiacorp.com', first_name:'James', last_name:'Wilson', role:'user', title:'Senior Engineer', manager_id:'u3', onboarding_completed:true, started_date:'2024-03-15' },
    { id:'u6', email:'lisa.nguyen@radiacorp.com', first_name:'Lisa', last_name:'Nguyen', role:'user', title:'Frontend Developer', manager_id:'u3', onboarding_completed:false, started_date:'2024-06-01' },
    { id:'u7', email:'david.kim@radiacorp.com', first_name:'David', last_name:'Kim', role:'user', title:'UI/UX Designer', manager_id:'u4', onboarding_completed:false, started_date:'2024-06-10' },
    { id:'u8', email:'rachel.garcia@radiacorp.com', first_name:'Rachel', last_name:'Garcia', role:'user', title:'Backend Engineer', manager_id:'u3', onboarding_completed:true, started_date:'2024-04-01' },
    { id:'u9', email:'tom.baker@radiacorp.com', first_name:'Tom', last_name:'Baker', role:'moderator', title:'Marketing Lead', manager_id:'u1', onboarding_completed:true, started_date:'2024-02-20' },
    { id:'u10', email:'anna.lee@radiacorp.com', first_name:'Anna', last_name:'Lee', role:'user', title:'Content Strategist', manager_id:'u9', onboarding_completed:true, started_date:'2024-05-01' },
  ];

  const tasks = [
    { id:'t1', title:'Set up CI/CD pipeline', description:'Configure GitHub Actions for automated deployment to DigitalOcean', status:'DONE', priority:'HIGH', assignee_id:'u3', due_date:'2024-07-15', created_at:'2024-07-01', integration_source:'github' },
    { id:'t2', title:'Design onboarding flow wireframes', description:'Create Figma wireframes for the new employee onboarding experience', status:'REVIEW', priority:'HIGH', assignee_id:'u4', due_date:'2024-07-20', created_at:'2024-07-05' },
    { id:'t3', title:'Write company values SOP', description:'Document core company values and culture guidelines for the knowledge base', status:'IN_PROGRESS', priority:'MEDIUM', assignee_id:'u2', due_date:'2024-07-25', created_at:'2024-07-10' },
    { id:'t4', title:'Implement Slack webhook integration', description:'Build the API route handler for receiving Slack event callbacks', status:'TODO', priority:'MEDIUM', assignee_id:'u5', due_date:'2024-07-30', created_at:'2024-07-12', integration_source:'slack' },
    { id:'t5', title:'Complete security audit checklist', description:'Review RLS policies and ensure all endpoints have proper auth guards', status:'TODO', priority:'HIGH', assignee_id:'u8', due_date:'2024-08-01', created_at:'2024-07-15' },
    { id:'t6', title:'Create marketing launch page', description:'Build a landing page for the Radia product launch announcement', status:'IN_PROGRESS', priority:'LOW', assignee_id:'u10', due_date:'2024-08-05', created_at:'2024-07-16' },
    { id:'t7', title:'Setup GitHub webhook receiver', description:'Create /api/integrations/github/webhook route handler', status:'REVIEW', priority:'MEDIUM', assignee_id:'u5', due_date:'2024-07-22', created_at:'2024-07-08', integration_source:'github' },
    { id:'t8', title:'Onboard Lisa Nguyen', description:'Assign mandatory courses and verify document uploads for new hire', status:'IN_PROGRESS', priority:'HIGH', assignee_id:'u6', due_date:'2024-07-18', created_at:'2024-07-01' },
    { id:'t9', title:'Brand guidelines document', description:'Finalize brand colors, fonts, and logo usage guidelines', status:'DONE', priority:'MEDIUM', assignee_id:'u7', due_date:'2024-07-10', created_at:'2024-06-25' },
    { id:'t10', title:'Configure Discord notifications', description:'Set up Discord bot for onboarding milestone notifications', status:'TODO', priority:'LOW', assignee_id:'u5', due_date:'2024-08-10', created_at:'2024-07-18', integration_source:'discord' },
  ];

  const courses = [
    { id:'c1', title:'Company Orientation', description:'Learn about Radia Corp culture, values, and how we operate day-to-day.', is_mandatory:true, lessons:4 },
    { id:'c2', title:'Engineering Onboarding', description:'Set up your dev environment, learn our coding standards, and make your first PR.', is_mandatory:true, lessons:3 },
    { id:'c3', title:'Security & Compliance', description:'Mandatory security awareness training: data handling, access controls, incident response.', is_mandatory:true, lessons:2 },
    { id:'c4', title:'Design System Guide', description:'Learn our visual design language, component library usage, and brand guidelines.', is_mandatory:false, lessons:2 },
  ];

  const sops = [
    { id:'s1', title:'Employee Handbook', category:'General', version:3, updated_at:'2024-06-15', last_updated_by:'u2', excerpt:'Policies, working hours, communication, time off, and our code of conduct.' },
    { id:'s2', title:'Git Workflow & Branching Strategy', category:'Engineering', version:2, updated_at:'2024-05-20', last_updated_by:'u3', excerpt:'Branch naming, PR process, and conventional commit messages.' },
    { id:'s3', title:'Incident Response Procedure', category:'Engineering', version:1, updated_at:'2024-03-05', last_updated_by:'u3', excerpt:'Severity levels, response steps, and post-mortem expectations.' },
    { id:'s4', title:'Brand Guidelines', category:'Design', version:2, updated_at:'2024-06-01', last_updated_by:'u4', excerpt:'Logo usage, color palette, and typography rules.' },
    { id:'s5', title:'Onboarding Checklist for New Hires', category:'HR', version:1, updated_at:'2024-04-01', last_updated_by:'u2', excerpt:'Day 1, Week 1, and Month 1 milestones for every new hire.' },
  ];

  const integrations = [
    { id:'i1', platform_name:'slack', is_active:true, color:'#E01E5A' },
    { id:'i2', platform_name:'github', is_active:true, color:'#181717' },
    { id:'i3', platform_name:'gmail', is_active:true, color:'#EA4335' },
    { id:'i4', platform_name:'discord', is_active:false, color:'#5865F2' },
    { id:'i5', platform_name:'teams', is_active:false, color:'#6264A7' },
    { id:'i6', platform_name:'messenger', is_active:false, color:'#0084FF' },
  ];

  const adminRequests = [
    { id:'ar1', profile_id:'u1', requested_role:'super_admin', status:'approved', reason:'Platform founder — need full infrastructure access.', created_at:'2024-01-15' },
    { id:'ar2', profile_id:'u3', requested_role:'devops', status:'pending', reason:'Need access to CI/CD pipelines and server logs for deployment management.', created_at:'2024-07-10' },
    { id:'ar3', profile_id:'u2', requested_role:'auditor', status:'rejected', reason:'Want to review platform audit trails for compliance reporting.', created_at:'2024-06-20' },
    { id:'ar4', profile_id:'u4', requested_role:'auditor', status:'pending', reason:'Reviewing design-asset access logs across workspaces.', created_at:'2024-07-19' },
  ];

  const serverAdmins = [
    { id:'sa1', profile_id:'u1', server_role:'super_admin', granted_at:'2024-01-15' },
  ];

  const auditLog = [
    { id:'al1', action:'Approved access request for Marcus Johnson', actor:'Alex Rivera', timestamp:'2024-07-18T14:32:00Z' },
    { id:'al2', action:"Workspace 'Radia Corp' settings updated", actor:'Alex Rivera', timestamp:'2024-07-17T09:15:00Z' },
    { id:'al3', action:'New integration configured: Gmail', actor:'Sarah Chen', timestamp:'2024-07-16T16:48:00Z' },
    { id:'al4', action:'Rejected access request for Sarah Chen', actor:'Alex Rivera', timestamp:'2024-06-22T11:03:00Z' },
  ];

  // ---- helpers ----
  const ROLE_COLORS = {
    creator:    { hue:'var(--radia-role-creator)',    soft:'var(--radia-violet-50)',  label:'Creator' },
    moderator:  { hue:'var(--radia-role-moderator)',  soft:'var(--radia-sky-50)',     label:'Moderator' },
    user:       { hue:'var(--radia-role-user)',       soft:'var(--radia-slate-100)',  label:'User' },
    super_admin:{ hue:'var(--radia-role-superadmin)', soft:'var(--radia-rose-50)',    label:'Super Admin' },
    devops:     { hue:'var(--radia-role-devops)',     soft:'var(--radia-amber-50)',   label:'DevOps' },
    auditor:    { hue:'var(--radia-role-auditor)',    soft:'var(--radia-teal-50)',    label:'Auditor' },
  };

  const AVATAR_HUES = [
    'var(--radia-indigo-600)','var(--radia-emerald-600)','var(--radia-amber-600)',
    'var(--radia-rose-600)','var(--radia-sky-600)','var(--radia-violet-600)',
    'var(--radia-teal-600)','var(--radia-slate-500)',
  ];

  function avatarColor(id) {
    const n = parseInt(String(id).replace(/\D/g, ''), 10) || 0;
    return AVATAR_HUES[n % AVATAR_HUES.length];
  }
  function initials(p) { return `${p.first_name[0]}${p.last_name[0]}`; }
  function byId(id) { return profiles.find(p => p.id === id); }
  function fmtDate(s) { return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
  function fmtShort(s) { return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
  function timeAgo(s) {
    const d = Math.floor((Date.now()-new Date(s).getTime())/86400000);
    if (d<=0) return 'Today'; if (d===1) return 'Yesterday';
    if (d<7) return d+' days ago'; if (d<30) return Math.floor(d/7)+' weeks ago';
    return Math.floor(d/30)+' months ago';
  }
  function buildTree() {
    const root = profiles.find(p => !p.manager_id);
    const kids = pid => profiles.filter(p => p.manager_id===pid).map(p => ({...p, children:kids(p.id)}));
    return {...root, children:kids(root.id)};
  }

  window.RADIA = {
    profiles, tasks, courses, sops, integrations, adminRequests, serverAdmins, auditLog,
    ROLE_COLORS, avatarColor, initials, byId, fmtDate, fmtShort, timeAgo, buildTree,
    workspace: { name:'Radia Corp', subdomain:'radiacorp', members:10 },
    currentUser: profiles[0],
  };
})();
