"use client";

import { useEffect, useState } from "react";
import {
  Activity, AlertTriangle, Building, Clock, Database, HardDrive, Shield, UserCheck, UserX,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { getRoleBadgeColor, getRoleLabel } from "@/lib/utils/roles";
import type { AdminRequest, AdminRequestStatus, ServerAdmin, Profile } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface AdminRequestWithProfile extends AdminRequest {
  profile?: Profile | null;
}

interface ServerAdminWithProfile extends ServerAdmin {
  profile?: Profile | null;
}

interface AuditLogEntry {
  id: string;
  action: string;
  actor_id?: string;
  created_at: string;
  workspace_id?: string;
  metadata?: Record<string, unknown>;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusPill({ status }: { status: AdminRequestStatus }) {
  if (status === "approved") {
    return (<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><UserCheck className="h-3 w-3" />Approved</span>);
  }
  if (status === "rejected") {
    return (<span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"><UserX className="h-3 w-3" />Rejected</span>);
  }
  return (<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><Clock className="h-3 w-3" />Pending</span>);
}

export function AdminContent() {
  const { toast } = useToast();
  const { profile, workspace } = useUser();

  const [requests, setRequests] = useState<AdminRequestWithProfile[]>([]);
  const [admins, setAdmins] = useState<ServerAdminWithProfile[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, Profile>>({});
  const [workspacePaused, setWorkspacePaused] = useState(false);
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const workspaceName = workspace?.name ?? "Workspace";

  useEffect(() => {
    if (!profile) return;

    async function fetchData() {
      const [adminData, profiles] = await Promise.all([
        api<{ requests: AdminRequestWithProfile[]; admins: ServerAdminWithProfile[]; auditLog: AuditLogEntry[] }>("/admin"),
        api<Profile[]>("/profiles"),
      ]);

      setRequests(adminData.requests);
      setAdmins(adminData.admins);
      setAuditLog(adminData.auditLog);

      const map: Record<string, Profile> = {};
      profiles.forEach((p) => { map[p.id] = p; });
      setProfileMap(map);
    }

    fetchData();
  }, [profile]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  function getProfileName(request: AdminRequestWithProfile): string {
    if (request.profile) return `${request.profile.first_name} ${request.profile.last_name}`;
    const p = profileMap[request.profile_id];
    return p ? `${p.first_name} ${p.last_name}` : "Unknown";
  }

  function getAdminProfileName(admin: ServerAdminWithProfile): string {
    if (admin.profile) return `${admin.profile.first_name} ${admin.profile.last_name}`;
    const p = profileMap[admin.profile_id];
    return p ? `${p.first_name} ${p.last_name}` : "Unknown";
  }

  function getActorName(actorId?: string): string {
    if (!actorId) return "System";
    const p = profileMap[actorId];
    return p ? `${p.first_name} ${p.last_name}` : "Unknown";
  }

  async function handleApprove(requestId: string) {
    if (!profile) return;
    const request = requests.find((r) => r.id === requestId);
    const name = request ? getProfileName(request) : "User";

    await api("/admin", { method: "POST", body: JSON.stringify({ action: "approve_request", requestId }) });

    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "approved" as AdminRequestStatus } : r));
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Approved access request for ${name}`, actor_id: profile.id, created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Access request for ${name} approved`);
  }

  async function handleReject(requestId: string) {
    if (!profile) return;
    const request = requests.find((r) => r.id === requestId);
    const name = request ? getProfileName(request) : "User";

    await api("/admin", { method: "POST", body: JSON.stringify({ action: "reject_request", requestId }) });

    setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "rejected" as AdminRequestStatus } : r));
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Rejected access request for ${name}`, actor_id: profile.id, created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Access request for ${name} rejected`);
  }

  async function handlePauseWorkspace() {
    if (!profile) return;
    setWorkspacePaused((prev) => !prev);
    const action = workspacePaused ? "resumed" : "paused";

    await api("/admin", {
      method: "POST",
      body: JSON.stringify({ action: "audit_log", logAction: `Workspace '${workspaceName}' ${action}`, metadata: {} }),
    });

    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Workspace '${workspaceName}' ${action}`, actor_id: profile.id, created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Workspace ${action}`);
  }

  async function handleDeleteWorkspace() {
    if (!profile) return;

    await api("/admin", {
      method: "POST",
      body: JSON.stringify({ action: "audit_log", logAction: `Workspace '${workspaceName}' deleted`, metadata: {} }),
    });

    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Workspace '${workspaceName}' deleted`, actor_id: profile.id, created_at: new Date().toISOString() },
      ...prev,
    ]);
    toast("Workspace deleted", "error");
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Server Administration</h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Manage server-level access, workspaces, and infrastructure.</p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4" />Server-level access - actions here affect every workspace.
      </div>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"><Activity className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">System Health</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><Database className="h-4 w-4 text-emerald-600" />Database</div>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Healthy</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">24ms latency</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><Activity className="h-4 w-4 text-emerald-600" />API</div>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">Operational</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">120 req/min</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><HardDrive className="h-4 w-4 text-sky-600" />Storage</div>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">45.2 GB / 100 GB</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full w-[45.2%] rounded-full bg-sky-600" /></div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"><Clock className="h-4 w-4 text-violet-600" />Uptime</div>
            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">99.97%</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Last 30 days</p>
          </div>
        </div>
      </section>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"><UserCheck className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Access Requests</h2>
          <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">{pendingCount} pending</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {["Requestor", "Requested Role", "Reason", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-3 pb-3 text-xs font-semibold uppercase tracking-[0.04em] text-slate-400 dark:text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const name = getProfileName(request);
                return (
                  <tr key={request.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3"><p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(request.requested_role)}`}>{getRoleLabel(request.requested_role)}</span></td>
                    <td className="max-w-[260px] px-3 py-3 text-slate-600 dark:text-slate-300"><p className="truncate">{request.reason}</p></td>
                    <td className="px-3 py-3"><StatusPill status={request.status} /></td>
                    <td className="px-3 py-3 text-slate-400 dark:text-slate-500">{formatDate(request.created_at)}</td>
                    <td className="px-3 py-3">
                      {request.status === "pending" ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(request.id)} className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-300">Approve</button>
                          <button onClick={() => handleReject(request.id)} className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300">Reject</button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="radia-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"><Shield className="h-5 w-5" /></span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Server Admins</h2>
          </div>
          <div className="space-y-3">
            {admins.map((admin) => {
              const name = getAdminProfileName(admin);
              return (
                <div key={admin.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeColor(admin.server_role)}`}>{getRoleLabel(admin.server_role)}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">since {formatDate(admin.granted_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="radia-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"><Building className="h-5 w-5" /></span>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Workspaces</h2>
          </div>
          <div className={`rounded-lg border p-4 ${workspacePaused ? "border-amber-300 bg-amber-50/50 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"}`}>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{workspaceName}</p>
              {workspacePaused && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">Paused</span>}
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">10 members - 5 SOPs - 4 courses</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setShowPauseConfirm(true)} className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-300">
                {workspacePaused ? "Resume" : "Pause"}
              </button>
              <button onClick={() => setShowDeleteWorkspace(true)} className="rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300">Delete</button>
            </div>
          </div>
        </section>
      </div>

      <section className="radia-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Clock className="h-5 w-5" /></span>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Audit Log</h2>
        </div>
        <div className="space-y-0">
          {auditLog.map((entry, index) => (
            <div key={entry.id} className={`flex items-start gap-3 py-3 ${index > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}>
              <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Clock className="h-3.5 w-3.5" /></span>
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{entry.action}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {getActorName(entry.actor_id)} - {new Date(entry.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={handlePauseWorkspace}
        title={workspacePaused ? "Resume Workspace" : "Pause Workspace"}
        description={workspacePaused ? `This will restore access to the ${workspaceName} workspace for all members.` : `This will temporarily disable access to the ${workspaceName} workspace for all members. You can resume it at any time.`}
        confirmLabel={workspacePaused ? "Resume" : "Pause"}
        variant={workspacePaused ? "default" : "danger"}
      />

      <ConfirmDialog
        open={showDeleteWorkspace}
        onClose={() => setShowDeleteWorkspace(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        description={`Are you sure you want to permanently delete ${workspaceName}? All members, tasks, SOPs, courses, and integrations will be removed. This cannot be undone.`}
        confirmLabel="Delete Workspace"
        variant="danger"
      />
    </div>
  );
}
