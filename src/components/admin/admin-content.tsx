"use client";

import { useState } from "react";
import {
  Activity, AlertTriangle, Building, Clock, Database, HardDrive, Shield, UserCheck, UserX,
} from "lucide-react";
import {
  adminRequests, getProfileById, getRoleBadgeColor, getRoleLabel, serverAdmins,
} from "@/lib/mock-data";
import type { AdminRequestStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialAuditLog = [
  { id: "al1", action: "Approved access request for Marcus Johnson", actor: "Alex Rivera", timestamp: "2024-07-18T14:32:00Z" },
  { id: "al2", action: "Workspace 'Radia Corp' settings updated", actor: "Alex Rivera", timestamp: "2024-07-17T09:15:00Z" },
  { id: "al3", action: "New integration configured: Gmail", actor: "Sarah Chen", timestamp: "2024-07-16T16:48:00Z" },
];

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
  const [requestStatuses, setRequestStatuses] = useState<Record<string, AdminRequestStatus>>(() => {
    const result: Record<string, AdminRequestStatus> = {};
    adminRequests.forEach((r) => { result[r.id] = r.status; });
    return result;
  });
  const [auditLog, setAuditLog] = useState(initialAuditLog);
  const [workspacePaused, setWorkspacePaused] = useState(false);
  const [showDeleteWorkspace, setShowDeleteWorkspace] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);

  const pendingCount = adminRequests.filter((r) => requestStatuses[r.id] === "pending").length;

  function handleApprove(requestId: string) {
    const request = adminRequests.find((r) => r.id === requestId);
    const profile = request ? getProfileById(request.profile_id) : null;
    setRequestStatuses((prev) => ({ ...prev, [requestId]: "approved" }));
    const name = profile ? `${profile.first_name} ${profile.last_name}` : "User";
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Approved access request for ${name}`, actor: "Alex Rivera", timestamp: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Access request for ${name} approved`);
  }

  function handleReject(requestId: string) {
    const request = adminRequests.find((r) => r.id === requestId);
    const profile = request ? getProfileById(request.profile_id) : null;
    setRequestStatuses((prev) => ({ ...prev, [requestId]: "rejected" }));
    const name = profile ? `${profile.first_name} ${profile.last_name}` : "User";
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Rejected access request for ${name}`, actor: "Alex Rivera", timestamp: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Access request for ${name} rejected`);
  }

  function handlePauseWorkspace() {
    setWorkspacePaused((prev) => !prev);
    const action = workspacePaused ? "resumed" : "paused";
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: `Workspace 'Radia Corp' ${action}`, actor: "Alex Rivera", timestamp: new Date().toISOString() },
      ...prev,
    ]);
    toast(`Workspace ${action}`);
  }

  function handleDeleteWorkspace() {
    setAuditLog((prev) => [
      { id: `al${Date.now()}`, action: "Workspace 'Radia Corp' deleted", actor: "Alex Rivera", timestamp: new Date().toISOString() },
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
              {adminRequests.map((request) => {
                const profile = getProfileById(request.profile_id);
                const status = requestStatuses[request.id];
                return (
                  <tr key={request.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3"><p className="font-semibold text-slate-900 dark:text-slate-100">{profile ? `${profile.first_name} ${profile.last_name}` : "Unknown"}</p></td>
                    <td className="px-3 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getRoleBadgeColor(request.requested_role)}`}>{getRoleLabel(request.requested_role)}</span></td>
                    <td className="max-w-[260px] px-3 py-3 text-slate-600 dark:text-slate-300"><p className="truncate">{request.reason}</p></td>
                    <td className="px-3 py-3"><StatusPill status={status} /></td>
                    <td className="px-3 py-3 text-slate-400 dark:text-slate-500">{formatDate(request.created_at)}</td>
                    <td className="px-3 py-3">
                      {status === "pending" ? (
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
            {serverAdmins.map((admin) => {
              const profile = getProfileById(admin.profile_id);
              return (
                <div key={admin.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{profile ? `${profile.first_name} ${profile.last_name}` : "Unknown"}</p>
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
              <p className="font-semibold text-slate-900 dark:text-slate-100">Radia Corp</p>
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
                  {entry.actor} - {new Date(entry.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
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
        description={workspacePaused ? "This will restore access to the Radia Corp workspace for all members." : "This will temporarily disable access to the Radia Corp workspace for all members. You can resume it at any time."}
        confirmLabel={workspacePaused ? "Resume" : "Pause"}
        variant={workspacePaused ? "default" : "danger"}
      />

      <ConfirmDialog
        open={showDeleteWorkspace}
        onClose={() => setShowDeleteWorkspace(false)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        description="Are you sure you want to permanently delete Radia Corp? All members, tasks, SOPs, courses, and integrations will be removed. This cannot be undone."
        confirmLabel="Delete Workspace"
        variant="danger"
      />
    </div>
  );
}
