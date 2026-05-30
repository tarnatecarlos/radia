"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Building2,
  Lock,
  Mail,
  MessageSquare,
  Save,
  Smartphone,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const { profile, workspace, refresh } = useUser();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    emailDigest: true, emailMentions: true, slackUpdates: true,
    slackMilestones: false, inAppAll: true, inAppTasks: true,
  });

  // Initialize form fields from user context
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setEmail(profile.email);
      setTitle(profile.title ?? "");
    }
  }, [profile]);

  useEffect(() => {
    if (workspace) {
      setWorkspaceName(workspace.name);
      setSubdomain(workspace.subdomain);
      setLogoPreview(workspace.logo_url ?? null);
    }
  }, [workspace]);

  // Fetch notification preferences from Supabase
  useEffect(() => {
    if (!profile) return;
    async function fetchNotifications() {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("profile_id", profile!.id)
        .single();
      if (data) {
        setNotifications({
          emailDigest: data.email_digest ?? true,
          emailMentions: data.email_mentions ?? true,
          slackUpdates: data.slack_updates ?? true,
          slackMilestones: data.slack_milestones ?? false,
          inAppAll: data.in_app_all ?? true,
          inAppTasks: data.in_app_tasks ?? true,
        });
      }
    }
    fetchNotifications();
  }, [profile]);

  const toggle = async (key: keyof NotificationPrefs) => {
    if (!profile) return;
    const newValue = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newValue }));

    const dbKey = NOTIF_KEY_MAP[key];
    const { error } = await supabase
      .from("notification_preferences")
      .update({ [dbKey]: newValue })
      .eq("profile_id", profile.id);

    if (error) {
      // Revert on failure
      setNotifications((prev) => ({ ...prev, [key]: !newValue }));
      toast("Failed to update preference", "error");
    } else {
      toast("Notification preference updated");
    }
  };

  async function handleSaveWorkspace() {
    if (!workspace) return;
    if (!workspaceName.trim()) { toast("Workspace name is required", "error"); return; }
    if (!subdomain.trim()) { toast("Subdomain is required", "error"); return; }
    setSavingWorkspace(true);

    const { error } = await supabase
      .from("workspaces")
      .update({ name: workspaceName, subdomain })
      .eq("id", workspace.id);

    setSavingWorkspace(false);
    if (error) {
      toast("Failed to save workspace settings", "error");
    } else {
      await refresh();
      toast("Workspace settings saved");
    }
  }

  async function handleSaveProfile() {
    if (!profile) return;
    if (!firstName.trim() || !lastName.trim()) { toast("Name fields are required", "error"); return; }
    if (!email.trim()) { toast("Email is required", "error"); return; }
    if (newPassword && newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    if (newPassword && !currentPassword) { toast("Enter current password to change password", "error"); return; }
    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({ first_name: firstName, last_name: lastName, email, title })
      .eq("id", profile.id);

    if (error) {
      setSavingProfile(false);
      toast("Failed to save profile", "error");
      return;
    }

    // Update password if requested
    if (newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        setSavingProfile(false);
        toast(pwError.message || "Failed to update password", "error");
        return;
      }
    }

    await refresh();
    setSavingProfile(false);
    setCurrentPassword("");
    setNewPassword("");
    toast("Profile saved successfully");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !workspace) return;
    if (!file.type.startsWith("image/")) { toast("Please select an image file", "error"); return; }
    if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2MB", "error"); return; }

    const ext = file.name.split(".").pop() ?? "png";
    const filePath = `logos/${workspace.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("workspace-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast("Failed to upload logo", "error");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("workspace-assets")
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from("workspaces")
      .update({ logo_url: logoUrl })
      .eq("id", workspace.id);

    if (updateError) {
      toast("Failed to update logo URL", "error");
      return;
    }

    setLogoPreview(logoUrl);
    await refresh();
    toast("Logo uploaded");
  }

  async function handleDeleteWorkspace() {
    if (!workspace) return;
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspace.id);

    if (error) {
      toast("Failed to delete workspace", "error");
    } else {
      toast("Workspace deleted", "error");
    }
    setShowDeleteConfirm(false);
  }

  return (
    <div className="max-w-4xl space-y-5 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Manage workspace and personal preferences</p>
      </div>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"><Building2 className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspace Settings</h2>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Workspace Name</span>
            <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Subdomain</span>
            <div className="flex items-center gap-2">
              <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
              <span className="text-sm text-slate-400 dark:text-slate-500">.radia.app</span>
            </div>
          </label>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Workspace Logo</span>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-600 text-2xl font-bold text-white">R</span>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                <Upload className="h-4 w-4" />Upload New Logo
              </button>
            </div>
          </div>
          <button onClick={handleSaveWorkspace} disabled={savingWorkspace} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50">
            <Save className="h-4 w-4" />{savingWorkspace ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><User className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">First Name</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Last Name</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
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
