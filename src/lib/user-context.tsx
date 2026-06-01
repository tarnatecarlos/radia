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

/**
 * In-memory cache for the /auth/me response.
 * Shared across navigations within the same SPA session so pages
 * don't wait for a round-trip on every sidebar click.
 * TTL: 60 seconds — after that a background refresh is triggered.
 */
let _cache: { data: AuthMeResponse; ts: number } | null = null;
const CACHE_TTL = 60_000;

async function fetchAuthMe(): Promise<AuthMeResponse> {
  if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
    return _cache.data;
  }
  const data = await api<AuthMeResponse>("/auth/me");
  _cache = { data, ts: Date.now() };
  return data;
}

function invalidateCache() {
  _cache = null;
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(() => {
    // Hydrate immediately from cache if available (instant on navigation)
    if (_cache) return stateFromResponse(_cache.data);
    return EMPTY_STATE;
  });

  const load = useCallback(async () => {
    try {
      invalidateCache();
      const data = await fetchAuthMe();
      setState(stateFromResponse(data));
    } catch {
      setState({ ...EMPTY_STATE, loading: false });
    }
  }, []);

  const loadPerformanceData = useCallback(async () => {
    try {
      const data = await api<AuthMeResponse>("/auth/me?include=performance");
      _cache = { data, ts: Date.now() };
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

    // If we have cached data, set it immediately (no loading state)
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) {
      setState(stateFromResponse(_cache.data));
      // Still refresh in background for freshness
      fetchAuthMe()
        .then((data) => { if (!cancelled) setState(stateFromResponse(data)); })
        .catch(() => {});
      return () => { cancelled = true; };
    }

    // No cache — fetch fresh
    fetchAuthMe()
      .then((data) => {
        if (cancelled) return;
        setState(stateFromResponse(data));
      })
      .catch(() => {
        if (cancelled) return;
        setState({ ...EMPTY_STATE, loading: false });
      });

    return () => { cancelled = true; };
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
