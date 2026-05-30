import type { Profile, OrgNode } from "@/lib/types";

export function getRoleLabel(role: string): string {
  switch (role) {
    case "creator": return "Creator";
    case "moderator": return "Moderator";
    case "user": return "User";
    case "super_admin": return "Super Admin";
    case "devops": return "DevOps";
    case "auditor": return "Auditor";
    default: return role;
  }
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "creator": return "bg-violet-500/20 text-violet-300";
    case "moderator": return "bg-blue-500/20 text-blue-300";
    case "user": return "bg-slate-500/20 text-slate-300";
    case "super_admin": return "bg-red-500/20 text-red-300";
    case "devops": return "bg-amber-500/20 text-amber-300";
    case "auditor": return "bg-teal-500/20 text-teal-300";
    default: return "bg-slate-500/20 text-slate-300";
  }
}

export function buildOrgTree(profilesList: Profile[]): OrgNode {
  const root = profilesList.find((p) => !p.manager_id);
  if (!root) throw new Error("No root profile found");

  function getChildren(parentId: string): OrgNode[] {
    return profilesList
      .filter((p) => p.manager_id === parentId)
      .map((p) => ({ ...p, children: getChildren(p.id), depth: 0 }));
  }

  return { ...root, children: getChildren(root.id), depth: 0 };
}
