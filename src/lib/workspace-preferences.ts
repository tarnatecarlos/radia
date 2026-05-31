import { getDb, uid } from "@/lib/db";
import type { WorkspacePreferences } from "@/lib/types";

export const DEFAULT_ALLOWED_INTEGRATIONS = [
  "slack",
  "github",
  "gmail",
  "discord",
  "teams",
  "messenger",
];

function parseAllowedIntegrations(value: unknown): string[] {
  if (typeof value !== "string") return [...DEFAULT_ALLOWED_INTEGRATIONS];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      return parsed;
    }
  } catch {
    // Fall back to defaults if a legacy row contains malformed JSON.
  }

  return [...DEFAULT_ALLOWED_INTEGRATIONS];
}

function mapPreferences(row: Record<string, unknown>): WorkspacePreferences {
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    members_can_create_tasks: !!(row.members_can_create_tasks as number),
    members_can_create_sops: !!(row.members_can_create_sops as number),
    members_can_create_courses: !!(row.members_can_create_courses as number),
    members_can_manage_integrations: !!(row.members_can_manage_integrations as number),
    allowed_integrations: parseAllowedIntegrations(row.allowed_integrations),
  };
}

export function getWorkspacePreferences(workspaceId: string): WorkspacePreferences {
  const db = getDb();
  let row = db
    .prepare("SELECT * FROM workspace_preferences WHERE workspace_id = ?")
    .get(workspaceId) as Record<string, unknown> | undefined;

  if (!row) {
    const id = uid();
    db.prepare("INSERT INTO workspace_preferences (id, workspace_id) VALUES (?, ?)").run(id, workspaceId);
    row = db.prepare("SELECT * FROM workspace_preferences WHERE id = ?").get(id) as Record<string, unknown>;
  }

  return mapPreferences(row);
}

export function hasPrivilegedWorkspaceRole(role: unknown): boolean {
  return role === "creator" || role === "moderator";
}
