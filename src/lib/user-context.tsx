"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { Profile, Workspace, ServerAdmin, Integration, WorkspacePreferences, ProfileSkill, Certification, ReviewCycle } from "@/lib/types";

interface AuthMeResponse {
  profile: Profile | null;
  workspace: Workspace | null;
  serverAdmins: ServerAdmin[];
  integrations: Integration[];
  preferences: WorkspacePreferences | null;
  profileSkills: ProfileSkill[];
  certifications: Certification[];
  activeReviewCycle: ReviewCycle | null;
}

interface UserState {
  profile: Profile | null;
  workspace: Workspace | null;
  serverAdmins: ServerAdmin[];
  integrations: Integration[];
  preferences: WorkspacePreferences | null;
  profileSkills: ProfileSkill[];
  certifications: Certification[];
  activeReviewCycle: ReviewCycle | null;
  loading: boolean;
}

interface UserContextValue extends UserState {
  refresh: () => Promise<void>;
  loadPerformanceData: () => Promise<void>;
}

const EMPTY_STATE: UserState = {
  profile: null,
  workspace: null,
  serverAdmins: [],
  integrations: [],
  preferences: null,
  profileSkills: [],
  certifications: [],
  activeReviewCycle: null,
  loading: true,
};

const UserContext = createContext<UserContextValue>({
  ...EMPTY_STATE,
  refresh: async () => {},
  loadPerformanceData: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

function stateFromResponse(data: AuthMeResponse): UserState {
  if (!data.profile) return { ...EMPTY_STATE, loading: false };
  return {
    profile: data.profile,
    workspace: data.workspace ?? null,
    serverAdmins: data.serverAdmins ?? [],
    integrations: data.integrations ?? [],
    preferences: data.preferences ?? null,
    profileSkills: data.profileSkills ?? [],
    certifications: data.certifications ?? [],
    activeReviewCycle: data.activeReviewCycle ?? null,
    loading: false,
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(EMPTY_STATE);

  const load = useCallback(async () => {
    try {
      const data = await api<AuthMeResponse>("/auth/me");
      setState(stateFromResponse(data));
    } catch {
      setState({ ...EMPTY_STATE, loading: false });
    }
  }, []);

  const loadPerformanceData = useCallback(async () => {
    try {
      const data = await api<AuthMeResponse>("/auth/me?include=performance");
      setState(prev => ({
        ...prev,
        profileSkills: data.profileSkills ?? [],
        certifications: data.certifications ?? [],
        activeReviewCycle: data.activeReviewCycle ?? null,
      }));
    } catch {
      // Silently fail — perf data is supplementary
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    api<AuthMeResponse>("/auth/me")
      .then((data) => {
        if (cancelled) return;
        setState(stateFromResponse(data));
      })
      .catch(() => {
        if (cancelled) return;
        setState({ ...EMPTY_STATE, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ ...state, refresh: load, loadPerformanceData }),
    [state, load, loadPerformanceData]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
