"use client";

import { useRef, useState } from "react";
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
import { currentUser } from "@/lib/mock-data";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [workspaceName, setWorkspaceName] = useState("Radia Corp");
  const [subdomain, setSubdomain] = useState("radiacorp");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [firstName, setFirstName] = useState(currentUser.first_name);
  const [lastName, setLastName] = useState(currentUser.last_name);
  const [email, setEmail] = useState(currentUser.email);
  const [title, setTitle] = useState(currentUser.title ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPrefs>({
    emailDigest: true, emailMentions: true, slackUpdates: true,
    slackMilestones: false, inAppAll: true, inAppTasks: true,
  });

  const toggle = (key: keyof NotificationPrefs) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast("Notification preference updated");
  };

  function handleSaveWorkspace() {
    if (!workspaceName.trim()) { toast("Workspace name is required", "error"); return; }
    if (!subdomain.trim()) { toast("Subdomain is required", "error"); return; }
    setSavingWorkspace(true);
    setTimeout(() => {
      setSavingWorkspace(false);
      toast("Workspace settings saved");
    }, 600);
  }

  function handleSaveProfile() {
    if (!firstName.trim() || !lastName.trim()) { toast("Name fields are required", "error"); return; }
    if (!email.trim()) { toast("Email is required", "error"); return; }
    if (newPassword && newPassword.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    if (newPassword && !currentPassword) { toast("Enter current password to change password", "error"); return; }
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      setCurrentPassword(""); setNewPassword("");
      toast("Profile saved successfully");
    }, 600);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please select an image file", "error"); return; }
    if (file.size > 2 * 1024 * 1024) { toast("Image must be under 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = () => { setLogoPreview(reader.result as string); toast("Logo uploaded"); };
    reader.readAsDataURL(file);
  }

  function handleDeleteWorkspace() {
    toast("Workspace deleted", "error");
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
