"use client";

import { useState, useEffect, useCallback, type ComponentType, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, Hash, Mail, MessageSquare, Send, Settings, Users, X, Zap } from "lucide-react";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";
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

export function IntegrationsContent() {
  const { toast } = useToast();
  const { profile, refresh } = useUser();
  const supabase = createClient();

  const [integrationStates, setIntegrationStates] = useState<IntegrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const connectedCount = integrationStates.filter((item) => item.is_active).length;

  const fetchIntegrations = useCallback(async () => {
    if (!profile?.workspace_id) return;
    const { data } = await supabase.from("integrations").select("*").eq("workspace_id", profile.workspace_id);
    if (data) setIntegrationStates(data as IntegrationRow[]);
    setLoading(false);
  }, [profile?.workspace_id, supabase]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const toggleIntegration = async (id: string) => {
    const item = integrationStates.find((i) => i.id === id);
    if (!item) return;
    const next = !item.is_active;

    // Optimistic update
    setIntegrationStates((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: next } : i)));
    toast(next ? `${platformConfig[item.platform_name]?.label} connected` : `${platformConfig[item.platform_name]?.label} disconnected`);

    const { error } = await supabase.from("integrations").update({ is_active: next }).eq("id", id);
    if (error) {
      // Revert on failure
      setIntegrationStates((prev) => prev.map((i) => (i.id === id ? { ...i, is_active: !next } : i)));
      toast("Failed to update integration", "error");
      return;
    }
    await refresh();
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

    const { error } = await supabase.from("integrations").update({ config: configValues }).eq("id", integration.id);
    if (error) {
      toast("Failed to save configuration", "error");
      return;
    }

    toast(`${config?.label} configuration saved`);
    setConfiguring(null);
    setConfigValues({});
  };

  const configuringConfig = configuring ? platformConfig[configuring] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
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
        {integrationStates.map((integration) => {
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
                  onClick={() => toggleIntegration(integration.id)}
                  className={`relative h-6 w-11 rounded-full transition ${integration.is_active ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${integration.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                {integration.is_active ? (
                  <button onClick={() => openConfigure(integration.platform_name)} className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                    <Settings className="h-3.5 w-3.5" />Configure
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500">Not connected</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
