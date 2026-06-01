"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, UserPlus, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface InviteInfo {
  workspace_name: string;
  email?: string;
  role: string;
  expired: boolean;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const token = params.token as string;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    async function checkInvite() {
      try {
        // Validate the invite token
        const inviteData = await api<{
          workspace_name: string;
          email: string;
          role: string;
          expired: boolean;
        }>(`/invites?token=${token}`).catch(() => null);

        if (!inviteData || inviteData.expired) {
          setError(inviteData?.expired ? "This invite has expired" : "Invalid invite link");
          setLoading(false);
          return;
        }

        setInfo(inviteData);

        // Check if user is logged in
        const me = await api<{ profile: unknown }>("/auth/me").catch(() => null);
        if (!me?.profile) {
          setNeedsAuth(true);
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch {
        setError("Invalid invite link");
        setLoading(false);
      }
    }
    checkInvite();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      await api("/invites", {
        method: "PATCH",
        body: JSON.stringify({ token }),
      });
      toast("You've joined the workspace!");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to accept invite";
      toast(message, "error");
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
            <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
          </div>
          <div className="radia-card p-8 text-center">
            <UserPlus className="mx-auto h-10 w-10 text-indigo-600" />
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">You&apos;ve been invited!</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Sign up or log in to accept this invitation and join the workspace.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push(`/signup?invite=${token}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <ArrowRight className="h-4 w-4" />
                Sign up
              </button>
              <button
                onClick={() => router.push(`/login?invite=${token}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Log in with existing account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="radia-card max-w-sm p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-rose-500" />
          <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Invalid Invite</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="mb-6 flex items-center justify-center gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
        <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600" />
      </div>
      <div className="radia-card max-w-sm p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-indigo-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">Join Workspace</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          You&apos;ve been invited to join <strong>{info?.workspace_name}</strong> as a{" "}
          <span className="capitalize">{info?.role}</span>.
        </p>
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {accepting ? "Joining..." : "Accept & Join"}
        </button>
      </div>
    </div>
  );
}
