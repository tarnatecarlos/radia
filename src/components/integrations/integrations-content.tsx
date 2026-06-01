"use client";

import { useState, useEffect, type ComponentType, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, GitBranch, Hash, Key, Mail, MessageSquare, Plus, RefreshCw, Send, Settings, Trash2, Users, X, Zap } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface IntegrationRow {
  id: string;
  workspace_id: string;
  platform_name: string;
  is_active: boolean;
  config: Record<string, string> | null;
  created_at: string;
}

interface IntegrationConfig {
  label: string;
  color: string;
  description: string;
  configFields: { label: string; placeholder: string; type?: string }[];
}

const platformConfig: Record<string, IntegrationConfig> = {
  slack: {
    label: "Slack",
    color: "#E01E5A",
    description: "Send onboarding notifications, task updates, and team announcements to Slack channels.",
    configFields: [
      { label: "Webhook URL", placeholder: "https://hooks.slack.com/services/..." },
      { label: "Default Channel", placeholder: "#general" },
    ],
  },
  github: {
    label: "GitHub",
    color: "#181717",
    description: "Sync pull requests and issues as tasks and webhook-driven workflow actions.",
    configFields: [
      { label: "Repository", placeholder: "owner/repo" },
      { label: "Personal Access Token", placeholder: "ghp_...", type: "password" },
    ],
  },
  gmail: {
    label: "Gmail",
    color: "#EA4335",
    description: "Send automated welcome emails, document requests, and HR notifications via Gmail.",
    configFields: [
      { label: "Sender Email", placeholder: "hr@radiacorp.com" },
      { label: "App Password", placeholder: "xxxx xxxx xxxx xxxx", type: "password" },
    ],
  },
  discord: {
    label: "Discord",
    color: "#5865F2",
    description: "Post onboarding milestones and team updates to Discord channels.",
    configFields: [
      { label: "Bot Token", placeholder: "Bot token...", type: "password" },
      { label: "Channel ID", placeholder: "123456789012345678" },
    ],
  },
  teams: {
    label: "Microsoft Teams",
    color: "#6264A7",
    description: "Integrate Teams notifications and scheduling events into Radia workflows.",
    configFields: [
      { label: "Webhook URL", placeholder: "https://outlook.office.com/webhook/..." },
      { label: "Tenant ID", placeholder: "your-tenant-id" },
    ],
  },
  messenger: {
    label: "Messenger",
    color: "#0084FF",
    description: "Enable direct messaging for quick HR check-ins and onboarding follow-up.",
    configFields: [
      { label: "Page Access Token", placeholder: "EAAx...", type: "password" },
      { label: "Page ID", placeholder: "123456789" },
    ],
  },
};

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  slack: Hash, github: GitBranch, gmail: Mail, discord: MessageSquare, teams: Users, messenger: Send,
};

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_by_name: string;
}

export function IntegrationsContent() {
  const { toast } = useToast();
  const { profile, preferences, refresh } = useUser();
  const canManage = profile?.role === 'creator' || profile?.role === 'moderator' || !!preferences?.members_can_manage_integrations;
  const isAdmin = profile?.role === 'creator' || profile?.role === 'moderator';

  const [integrationStates, setIntegrationStates] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const filteredIntegrations = canManage
    ? integrationStates
    : integrationStates.filter(i => preferences?.allowed_integrations?.includes(i.platform_name));
  const connectedCount = integrationStates.filter((item) => item.is_active).length;

  useEffect(() => {
    if (!profile?.workspace_id) return;

    let cancelled = false;

    const promises: Promise<void>[] = [
      api<IntegrationRow[]>("/integrations").then((data) => {
        if (!cancelled) setIntegrationStates(data);
      }),
    ];

    if (isAdmin) {
      promises.push(
        api<ApiKeyRow[]>("/api-keys").then((data) => {
          if (!cancelled) setApiKeys(data);
        }).catch(() => {})
      );
    }

    Promise.all(promises)
      .catch(() => {
        if (!cancelled) toast("Failed to load integrations", "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [profile?.workspace_id, isAdmin, toast]);

  const toggleIntegration = async (id: string) => {
    const item = integrationStates.find((i) => i.id === id);
    if (!item) return;
    const next = !item.is_active;

    // Optimistic update
    setIntegrationStates((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: next } : i)));
    toast(next ? `${platformConfig[item.platform_name]?.label} connected` : `${platformConfig[item.platform_name]?.label} disconnected`);

    try {
      await api("/integrations", { method: "PATCH", body: JSON.stringify({ id, is_active: next }) });
      await refresh();
    } catch {
      // Revert on failure
      setIntegrationStates((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !next } : i)));
      toast("Failed to update integration", "error");
    }
  };

  const openConfigure = (platformName: string) => {
    setConfiguring(platformName);
    setConfigValues({});
  };

  const handleSaveConfig = async () => {
    const config = platformConfig[configuring!];
    const hasEmpty = config?.configFields.some((f) => !configValues[f.label]?.trim());
    if (hasEmpty) {
      toast("Please fill in all fields", "error");
      return;
    }

    const integration = integrationStates.find((i) => i.platform_name === configuring);
    if (!integration) return;

    try {
      await api("/integrations", { method: "PATCH", body: JSON.stringify({ id: integration.id, config: configValues }) });
      toast(`${config?.label} configuration saved`);
      setConfiguring(null);
      setConfigValues({});
    } catch {
      toast("Failed to save configuration", "error");
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) { toast("Key name is required", "error"); return; }
    setCreatingKey(true);
    try {
      const data = await api<{ id: string; name: string; key: string; prefix: string; scopes: string[] }>("/api-keys", {
        method: "POST",
        body: JSON.stringify({ name: newKeyName.trim(), scopes: newKeyScopes }),
      });
      setApiKeys((prev) => [{ ...data, key_prefix: data.prefix, created_at: new Date().toISOString(), last_used_at: null, revoked_at: null, created_by_name: `${profile?.first_name} ${profile?.last_name}` }, ...prev]);
      setNewKeyRevealed(data.key);
      setNewKeyName("");
      setNewKeyScopes(["read"]);
      toast("API key created — copy it now, it won't be shown again");
    } catch {
      toast("Failed to create API key", "error");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await api("/api-keys", { method: "DELETE", body: JSON.stringify({ id }) });
      setApiKeys((prev) => prev.map((k) => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k));
      toast("API key revoked");
    } catch {
      toast("Failed to revoke key", "error");
    }
  };

  const handleRotateKey = async (id: string) => {
    try {
      const data = await api<{ id: string; name: string; key: string; prefix: string; scopes: string[] }>("/api-keys", {
        method: "PATCH",
        body: JSON.stringify({ id }),
      });
      // Replace old key with new one in the list
      setApiKeys((prev) => [
        { ...data, key_prefix: data.prefix, created_at: new Date().toISOString(), last_used_at: null, revoked_at: null, created_by_name: `${profile?.first_name} ${profile?.last_name}` },
        ...prev.map((k) => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k),
      ]);
      setNewKeyRevealed(data.key);
      toast("API key rotated — copy the new key now");
    } catch {
      toast("Failed to rotate key", "error");
    }
  };

  const configuringConfig = configuring ? platformConfig[configuring] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (integrationStates.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Integrations</h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">No integrations set up yet</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Zap className="h-7 w-7 text-slate-400 dark:text-slate-500" />
          </span>
          <h3 className="mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">No integrations yet</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Connect your favorite tools like Slack, GitHub, and Gmail to streamline your workflows. Contact your workspace admin to set up integrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Integrations</h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
          {connectedCount} of {integrationStates.length} integrations connected
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredIntegrations.map((integration) => {
          const config = platformConfig[integration.platform_name];
          const Icon = iconMap[integration.platform_name] ?? Zap;
          return (
            <div key={integration.id} className="radia-card flex h-full flex-col gap-4 p-5">
              <div className="flex items-start justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-[var(--integration-accent)]"
                  style={{ backgroundColor: `${config?.color ?? "#4f46e5"}15`, "--integration-accent": config?.color ?? "#4f46e5" } as CSSProperties}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${integration.is_active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                  {integration.is_active ? "Connected" : "Inactive"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{config?.label ?? integration.platform_name}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{config?.description ?? "Connect this platform to Radia."}</p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
                <button
                  onClick={() => canManage && toggleIntegration(integration.id)}
                  disabled={!canManage}
                  className={`relative h-6 w-11 rounded-full transition ${integration.is_active ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"} ${!canManage ? "pointer-events-none opacity-50" : ""}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${integration.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                {integration.is_active ? (
                  canManage ? (
                    <button onClick={() => openConfigure(integration.platform_name)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Settings className="h-3.5 w-3.5" />Configure
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">Connected</span>
                  )
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Not connected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* API Keys Section — Admin/Creator only */}
      {isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">API Keys</h2>
              <p className="mt-0.5 text-sm text-slate-400 dark:text-slate-500">Manage API access tokens for your organization</p>
            </div>
            <button
              onClick={() => { setShowCreateKey(true); setNewKeyRevealed(null); }}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />New Key
            </button>
          </div>

          {/* Revealed key banner */}
          {newKeyRevealed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Copy your API key now — it won&apos;t be shown again.</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-xs text-slate-900 dark:bg-slate-900 dark:text-slate-100">{newKeyRevealed}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(newKeyRevealed); toast("Copied to clipboard"); }}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="radia-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Key</th>
                  <th className="hidden px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 sm:table-cell">Scopes</th>
                  <th className="hidden px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 md:table-cell">Created</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
                      <Key className="mx-auto mb-2 h-6 w-6" />
                      No API keys yet. Create one to enable programmatic access.
                    </td>
                  </tr>
                )}
                {apiKeys.map((key) => (
                  <tr key={key.id} className={key.revoked_at ? "opacity-50" : ""}>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{key.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{key.key_prefix}</td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <div className="flex gap-1">
                        {key.scopes.map((s) => (
                          <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-xs text-slate-400 dark:text-slate-500 md:table-cell">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {key.revoked_at ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">Revoked</span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!key.revoked_at && (
                        <div className="flex gap-1">
                          <button onClick={() => handleRotateKey(key.id)} className="rounded p-1 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10" title="Rotate key">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleRevokeKey(key.id)} className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10" title="Revoke">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create API Key Modal */}
      <AnimatePresence>
        {showCreateKey && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreateKey(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create API Key</h3>
                <button onClick={() => setShowCreateKey(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Key Name *</span>
                  <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. CI/CD Pipeline" className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Scopes</legend>
                  <div className="space-y-2">
                    {["read", "write", "admin"].map((scope) => (
                      <label key={scope} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyScopes.includes(scope)}
                          onChange={(e) => {
                            setNewKeyScopes((prev) =>
                              e.target.checked ? [...prev, scope] : prev.filter((s) => s !== scope)
                            );
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600"
                        />
                        <span className="text-sm text-slate-700 capitalize dark:text-slate-200">{scope}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCreateKey(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleCreateKey} disabled={creatingKey} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    {creatingKey ? "Creating..." : "Create Key"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configure Modal */}
      <AnimatePresence>
        {configuring && configuringConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setConfiguring(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Configure {configuringConfig.label}</h3>
                <button onClick={() => setConfiguring(null)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                {configuringConfig.configFields.map((field) => (
                  <label key={field.label} className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{field.label}</span>
                    <input
                      type={field.type ?? "text"}
                      value={configValues[field.label] ?? ""}
                      onChange={(e) => setConfigValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </label>
                ))}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setConfiguring(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleSaveConfig} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save Configuration</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
