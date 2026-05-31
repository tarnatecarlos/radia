"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  Lock,
  Mail,
  MessageSquare,
  Save,
  Shield,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { WorkspacePreferences } from "@/lib/types";

interface NotificationPrefs {
  emailDigest: boolean;
  emailMentions: boolean;
  slackUpdates: boolean;
  slackMilestones: boolean;
  inAppAll: boolean;
  inAppTasks: boolean;
}

const NOTIF_KEY_MAP: Record<keyof NotificationPrefs, string> = {
  emailDigest: "email_digest",
  emailMentions: "email_mentions",
  slackUpdates: "slack_updates",
  slackMilestones: "slack_milestones",
  inAppAll: "in_app_all",
  inAppTasks: "in_app_tasks",
};

interface PermissionPrefs {
  members_can_create_tasks: boolean;
  members_can_create_sops: boolean;
  members_can_create_courses: boolean;
  members_can_manage_integrations: boolean;
  allowed_integrations: string[];
}

const INTEGRATION_PLATFORMS = ["slack", "github", "gmail", "discord", "teams", "messenger"];

const DEFAULT_PERMISSION_PREFS: PermissionPrefs = {
  members_can_create_tasks: true,
  members_can_create_sops: false,
  members_can_create_courses: false,
  members_can_manage_integrations: false,
  allowed_integrations: [...INTEGRATION_PLATFORMS],
};

function toPermissionPrefs(preferences: WorkspacePreferences | null): PermissionPrefs {
  if (!preferences) {
    return {
      ...DEFAULT_PERMISSION_PREFS,
      allowed_integrations: [...DEFAULT_PERMISSION_PREFS.allowed_integrations],
    };
  }

  return {
    members_can_create_tasks: preferences.members_can_create_tasks,
    members_can_create_sops: preferences.members_can_create_sops,
    members_can_create_courses: preferences.members_can_create_courses,
    members_can_manage_integrations: preferences.members_can_manage_integrations,
    allowed_integrations: preferences.allowed_integrations,
  };
}

function Toggle({
  checked, onChange, label, description,
}: {
  checked: boolean; onChange: () => void; label: string; description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{description}</p>
      </div>
      <button onClick={onChange} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function SettingsContent() {
  const { toast } = useToast();
  const { profile, workspace, preferences, refresh } = useUser();

  const [workspaceDraft, setWorkspaceDraft] = useState<Partial<{ name: string; subdomain: string }>>({});
  const [profileDraft, setProfileDraft] = useState<Partial<{ firstName: string; lastName: string; email: string; title: string }>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [permPrefsDraft, setPermPrefsDraft] = useState<PermissionPrefs | null>(null);
  const [savingPerms, setSavingPerms] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    emailDigest: true, emailMentions: true, slackUpdates: true,
    slackMilestones: false, inAppAll: true, inAppTasks: true,
  });

  const workspaceName = workspaceDraft.name ?? workspace?.name ?? "";
  const subdomain = workspaceDraft.subdomain ?? workspace?.subdomain ?? "";
  const logoPreview = workspace?.logo_url ?? null;
  const firstName = profileDraft.firstName ?? profile?.first_name ?? "";
  const lastName = profileDraft.lastName ?? profile?.last_name ?? "";
  const email = profileDraft.email ?? profile?.email ?? "";
  const title = profileDraft.title ?? profile?.title ?? "";
  const permPrefs = permPrefsDraft ?? toPermissionPrefs(preferences);

  function updatePermissionPrefs(updater: (current: PermissionPrefs) => PermissionPrefs) {
    setPermPrefsDraft((current) => updater(current ?? permPrefs));
  }

  // Fetch notification preferences
  useEffect(() => {
    if (!profile) return;
    async function fetchNotifications() {
      try {
        const data = await api<Record<string, boolean>>("/notifications");
        setNotifications({
          emailDigest: data.email_digest ?? true,
          emailMentions: data.email_mentions ?? true,
          slackUpdates: data.slack_updates ?? true,
          slackMilestones: data.slack_milestones ?? false,
          inAppAll: data.in_app_all ?? true,
          inAppTasks: data.in_app_tasks ?? true,
        });
      } catch {
        // use defaults
      }
    }
    fetchNotifications();
  }, [profile]);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!profile) return;
    const newValue = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newValue }));

    const dbKey = NOTIF_KEY_MAP[key];
    try {
      await api("/notifications", { method: "PATCH", body: JSON.stringify({ [dbKey]: newValue }) });
      toast("Notification preference updated");
    } catch {
      // Revert on failure
      setNotifications((prev) => ({ ...prev, [key]: !newValue }));
      toast("Failed to update preference", "error");
    }
  };

  async function handleSavePermissions() {
    setSavingPerms(true);
    try {
      await api("/preferences", {
        method: "PATCH",
        body: JSON.stringify(permPrefs),
      });
      await refresh();
      setPermPrefsDraft(null);
      toast("Workspace permissions saved");
    } catch {
      toast("Failed to save permissions", "error");
    }
    setSavingPerms(false);
  }

  async function handleSaveWorkspace() {
    if (!workspace) return;
    if (!workspaceName.trim()) { toast("Workspace name is required", "error"); return; }
    if (!subdomain.trim()) { toast("Subdomain is required", "error"); return; }
    setSavingWorkspace(true);

    try {
      await api("/workspaces", { method: "PATCH", body: JSON.stringify({ id: workspace.id, name: workspaceName, subdomain }) });
      await refresh();
      setWorkspaceDraft({});
      toast("Workspace settings saved");
    } catch {
      toast("Failed to save workspace settings", "error");
    }
    setSavingWorkspace(false);
  }

  async function handleSaveProfile() {
    if (!profile) return;
    if (!firstName.trim() || !lastName.trim()) { toast("Name fields are required", "error"); return; }
    if (!email.trim()) { toast("Email is required", "error"); return; }
    if (newPassword && newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    if (newPassword && !currentPassword) { toast("Enter current password to change password", "error"); return; }
    setSavingProfile(true);

    try {
      await api("/profiles", {
        method: "PATCH",
        body: JSON.stringify({ id: profile.id, first_name: firstName, last_name: lastName, email, title }),
      });

      // Update password if requested
      if (newPassword) {
        await api("/auth/password", {
          method: "PATCH",
          body: JSON.stringify({ currentPassword, newPassword }),
        });
      }

      await refresh();
      setProfileDraft({});
      setCurrentPassword("");
      setNewPassword("");
      toast("Profile saved successfully");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save profile", "error");
    }
    setSavingProfile(false);
  }

  async function handleDeleteWorkspace() {
    if (!workspace) return;
    try {
      await api("/workspaces", { method: "DELETE", body: JSON.stringify({ id: workspace.id }) });
      toast("Workspace deleted", "error");
    } catch {
      toast("Failed to delete workspace", "error");
    }
    setShowDeleteConfirm(false);
  }

  return (
    <div className="max-w-4xl space-y-5 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Manage workspace and personal preferences</p>
      </div>

      {profile?.role === "creator" && (
        <section className="radia-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"><Building2 className="h-5 w-5" /></span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspace Settings</h2>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Workspace Name</span>
              <input value={workspaceName} onChange={(e) => setWorkspaceDraft((current) => ({ ...current, name: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Subdomain</span>
              <div className="flex items-center gap-2">
                <input value={subdomain} onChange={(e) => setWorkspaceDraft((current) => ({ ...current, subdomain: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                <span className="text-sm text-slate-400 dark:text-slate-500">.radia.app</span>
              </div>
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Workspace Logo</span>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <span aria-label="Workspace logo" role="img" className="h-16 w-16 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${logoPreview})` }} />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white">R</span>
                )}
                <span className="text-sm text-slate-400 dark:text-slate-500">Logo upload coming soon</span>
              </div>
            </div>
            <button onClick={handleSaveWorkspace} disabled={savingWorkspace} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">
              <Save className="h-4 w-4" />{savingWorkspace ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      )}

      {profile?.role === "creator" && (
        <section className="radia-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"><Shield className="h-5 w-5" /></span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspace Permissions</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Control what workspace members can do. Creators and moderators always have full access.</p>
          <div className="space-y-4">
            <Toggle checked={permPrefs.members_can_create_tasks} onChange={() => updatePermissionPrefs(p => ({ ...p, members_can_create_tasks: !p.members_can_create_tasks }))} label="Members can create tasks" description="Allow all members to create new tasks" />
            <Toggle checked={permPrefs.members_can_create_sops} onChange={() => updatePermissionPrefs(p => ({ ...p, members_can_create_sops: !p.members_can_create_sops }))} label="Members can create SOPs" description="Allow all members to create and edit standard operating procedures" />
            <Toggle checked={permPrefs.members_can_create_courses} onChange={() => updatePermissionPrefs(p => ({ ...p, members_can_create_courses: !p.members_can_create_courses }))} label="Members can create onboarding courses" description="Allow all members to create training courses and lessons" />
            <Toggle checked={permPrefs.members_can_manage_integrations} onChange={() => updatePermissionPrefs(p => ({ ...p, members_can_manage_integrations: !p.members_can_manage_integrations }))} label="Members can manage integrations" description="Allow all members to enable/disable and configure integrations" />

            <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="mb-3 text-sm font-medium text-slate-600 dark:text-slate-300">Allowed Integration Platforms</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {INTEGRATION_PLATFORMS.map((platform) => (
                  <label key={platform} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                    <input
                      type="checkbox"
                      checked={permPrefs.allowed_integrations.includes(platform)}
                      onChange={() => {
                        updatePermissionPrefs(p => ({
                          ...p,
                          allowed_integrations: p.allowed_integrations.includes(platform)
                            ? p.allowed_integrations.filter(x => x !== platform)
                            : [...p.allowed_integrations, platform],
                        }));
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm capitalize text-slate-700 dark:text-slate-200">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={handleSavePermissions} disabled={savingPerms} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">
              <Save className="h-4 w-4" />{savingPerms ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </section>
      )}

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><User className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">First Name</span>
              <input value={firstName} onChange={(e) => setProfileDraft((current) => ({ ...current, firstName: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Last Name</span>
              <input value={lastName} onChange={(e) => setProfileDraft((current) => ({ ...current, lastName: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
            <input value={email} onChange={(e) => setProfileDraft((current) => ({ ...current, email: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Title</span>
            <input value={title} onChange={(e) => setProfileDraft((current) => ({ ...current, title: e.target.value }))} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
          </label>
          <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Change Password</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Current Password</span>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">New Password</span>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
              </label>
            </div>
          </div>
          <button onClick={handleSaveProfile} disabled={savingProfile} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">
            <Save className="h-4 w-4" />{savingProfile ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </section>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><Bell className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notification Preferences</h2>
        </div>
        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</p></div>
            <div className="space-y-3 pl-6">
              <Toggle checked={notifications.emailDigest} onChange={() => toggle("emailDigest")} label="Daily digest" description="Summary of tasks, updates, and announcements" />
              <Toggle checked={notifications.emailMentions} onChange={() => toggle("emailMentions")} label="Mentions and replies" description="When someone mentions you or replies to your comment" />
            </div>
          </div>
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-slate-400" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">Slack</p></div>
            <div className="space-y-3 pl-6">
              <Toggle checked={notifications.slackUpdates} onChange={() => toggle("slackUpdates")} label="Task updates" description="Status changes and assignments" />
              <Toggle checked={notifications.slackMilestones} onChange={() => toggle("slackMilestones")} label="Milestone celebrations" description="Onboarding completions and achievements" />
            </div>
          </div>
          <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
            <div className="mb-3 flex items-center gap-2"><Smartphone className="h-4 w-4 text-slate-400" /><p className="text-sm font-medium text-slate-700 dark:text-slate-200">In-App</p></div>
            <div className="space-y-3 pl-6">
              <Toggle checked={notifications.inAppAll} onChange={() => toggle("inAppAll")} label="All notifications" description="Show all in-app notification banners" />
              <Toggle checked={notifications.inAppTasks} onChange={() => toggle("inAppTasks")} label="Task reminders" description="Due date reminders and overdue alerts" />
            </div>
          </div>
        </div>
      </section>

      <section className="radia-card border-rose-200 bg-rose-50/50 p-6 dark:border-rose-500/40 dark:bg-rose-500/10">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"><AlertTriangle className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Danger Zone</h2>
        </div>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">Permanently delete your workspace and all associated data. This action cannot be undone.</p>
        <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 dark:border-rose-500/50 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-500/10">
          <Trash2 className="h-4 w-4" />Delete Workspace
        </button>
      </section>

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        description="Are you sure you want to permanently delete this workspace? All data including profiles, tasks, SOPs, and courses will be lost forever."
        confirmLabel="Delete Workspace"
        variant="danger"
      />
    </div>
  );
}
