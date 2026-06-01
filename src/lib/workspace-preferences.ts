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

function mapPreferences(row: Record<string, unknown>): WorkspacePreferences {
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    members_can_create_tasks: row.members_can_create_tasks as boolean,
    members_can_create_sops: row.members_can_create_sops as boolean,
    members_can_create_courses: row.members_can_create_courses as boolean,
    members_can_manage_integrations: row.members_can_manage_integrations as boolean,
    allowed_integrations: Array.isArray(row.allowed_integrations)
      ? row.allowed_integrations
      : [...DEFAULT_ALLOWED_INTEGRATIONS],
  };
}

export async function getWorkspacePreferences(workspaceId: string): Promise<WorkspacePreferences> {
  const db = getDb();
  const { data: row, error } = await db
    .from("workspace_preferences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!error && row) {
    return mapPreferences(row);
  }

  // Insert default row if missing
  const id = uid();
  const { error: insertErr } = await db
    .from("workspace_preferences")
    .insert({ id, workspace_id: workspaceId });
  if (insertErr) throw new Error(`Failed to create workspace preferences: ${insertErr.message}`);

  const { data: newRow, error: fetchErr } = await db
    .from("workspace_preferences")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr || !newRow) throw new Error("Failed to fetch newly created workspace preferences");

  return mapPreferences(newRow);
}

export function hasPrivilegedWorkspaceRole(role: unknown): boolean {
  return role === "creator" || role === "moderator";
}
