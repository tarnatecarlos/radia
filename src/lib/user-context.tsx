"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Profile, Workspace, ServerAdmin, Integration, WorkspacePreferences } from "@/lib/types";

interface AuthMeResponse {
  profile: Profile | null;
  workspace: Workspace | null;
  serverAdmins: ServerAdmin[];
  integrations: Integration[];
  preferences: WorkspacePreferences | null;
}

interface UserContextValue {
  profile: Profile | null;
  workspace: Workspace | null;
  serverAdmins: ServerAdmin[];
  integrations: Integration[];
  preferences: WorkspacePreferences | null;
  loading: boolean;
  /** Re-fetch profile + workspace from DB */
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  profile: null,
  workspace: null,
  serverAdmins: [],
  integrations: [],
  preferences: null,
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
  const [preferences, setPreferences] = useState<WorkspacePreferences | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api<AuthMeResponse>("/auth/me");

      if (!data.profile) {
        setProfile(null);
        setWorkspace(null);
        setServerAdmins([]);
        setIntegrations([]);
        setPreferences(null);
        setLoading(false);
        return;
      }

      setProfile(data.profile);
      setWorkspace(data.workspace ?? null);
      setServerAdmins(data.serverAdmins ?? []);
      setIntegrations(data.integrations ?? []);
      setPreferences(data.preferences ?? null);
      setLoading(false);
    } catch {
      setProfile(null);
      setWorkspace(null);
      setServerAdmins([]);
      setIntegrations([]);
      setPreferences(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    api<AuthMeResponse>("/auth/me")
      .then((data) => {
        if (cancelled) return;

        if (!data.profile) {
          setProfile(null);
          setWorkspace(null);
          setServerAdmins([]);
          setIntegrations([]);
          setPreferences(null);
          setLoading(false);
          return;
        }

        setProfile(data.profile);
        setWorkspace(data.workspace ?? null);
        setServerAdmins(data.serverAdmins ?? []);
        setIntegrations(data.integrations ?? []);
        setPreferences(data.preferences ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setWorkspace(null);
        setServerAdmins([]);
        setIntegrations([]);
        setPreferences(null);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <UserContext.Provider value={{ profile, workspace, serverAdmins, integrations, preferences, loading, refresh: load }}>
      {children}
    </UserContext.Provider>
  );
}
