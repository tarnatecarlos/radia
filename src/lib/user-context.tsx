"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Workspace, ServerAdmin, Integration } from "@/lib/types";

interface UserContextValue {
  profile: Profile | null;
  workspace: Workspace | null;
  serverAdmins: ServerAdmin[];
  integrations: Integration[];
  loading: boolean;
  /** Re-fetch profile + workspace from DB */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  workspace: null,
  serverAdmins: [],
  integrations: [],
  loading: true,
  refresh: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [serverAdmins, setServerAdmins] = useState<ServerAdmin[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setWorkspace(null);
      setServerAdmins([]);
      setIntegrations([]);
      setLoading(false);
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);

    // Fetch workspace, server admins, and integrations in parallel
    const [wsResult, saResult, intResult] = await Promise.all([
      supabase.from("workspaces").select("*").eq("id", profileData.workspace_id).single(),
      supabase.from("server_admins").select("*").eq("profile_id", profileData.id),
      supabase.from("integrations").select("*").eq("workspace_id", profileData.workspace_id),
    ]);

    setWorkspace((wsResult.data as Workspace) ?? null);
    setServerAdmins((saResult.data as ServerAdmin[]) ?? []);
    setIntegrations((intResult.data as Integration[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <UserContext.Provider value={{ profile, workspace, serverAdmins, integrations, loading, refresh: load }}>
      {children}
    </UserContext.Provider>
  );
}
