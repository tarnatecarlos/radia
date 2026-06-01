"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogIn,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Profile } from "@/lib/types";

type Step = "welcome" | "choose" | "join" | "create";

interface OrgMatch {
  id: string;
  name: string;
  subdomain: string;
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    }>
      <SetupPageInner />
    </Suspense>
  );
}

function SetupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Join flow
  const [searching, setSearching] = useState(false);
  const [matchedOrgs, setMatchedOrgs] = useState<OrgMatch[]>([]);
  const [searchDone, setSearchDone] = useState(false);

  // Create flow
  const [orgName, setOrgName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const data = await api<{ profile: Profile | null }>("/auth/me");

        if (!data.profile) {
          router.push("/login");
          return;
        }

        // Already completed setup and no invite — go to dashboard
        if (data.profile.setup_completed && !inviteToken) {
          router.push("/dashboard");
          return;
        }

        setProfile(data.profile);

        // If we have an invite token, try to auto-accept it
        if (inviteToken) {
          try {
            await api("/invites", {
              method: "PATCH",
              body: JSON.stringify({ token: inviteToken }),
            });

            // Mark setup complete if not already
            if (!data.profile.setup_completed) {
              await api("/profiles", {
                method: "PATCH",
                body: JSON.stringify({ id: data.profile.id, setup_completed: true }),
              });
            }

            toast("You've joined the workspace!");
            router.push("/dashboard");
            return;
          } catch (err) {
            // Invite failed — show normal setup flow with error
            toast(
              err instanceof Error ? err.message : "Invite could not be accepted",
              "error"
            );
          }
        }

        setLoading(false);
      } catch {
        router.push("/login");
      }
    }
    init();
  }, [router, inviteToken, toast]);

  async function searchOrganizations() {
    if (!profile) return;
    setSearching(true);
    setSearchDone(false);

    const domain = profile.email.split("@")[1];

    try {
      const orgs = await api<OrgMatch[]>("/workspaces/search?domain=" + domain);
      setMatchedOrgs(orgs);
    } catch {
      setMatchedOrgs([]);
    }

    setSearchDone(true);
    setSearching(false);
  }

  async function handleCreateOrg() {
    if (!profile || !orgName.trim()) return;
    setCreating(true);

    try {
      const subdomain = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await api("/workspaces", {
        method: "PATCH",
        body: JSON.stringify({ id: profile.workspace_id, name: orgName.trim(), subdomain: subdomain || `org-${Date.now()}` }),
      });

      await api("/profiles", {
        method: "PATCH",
        body: JSON.stringify({ id: profile.id, setup_completed: true }),
      });

      router.push("/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create organization", "error");
      setCreating(false);
    }
  }

  async function handleSkipSetup() {
    if (!profile) return;
    try {
      await api("/profiles", {
        method: "PATCH",
        body: JSON.stringify({ id: profile.id, setup_completed: true }),
      });
      router.push("/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong", "error");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="mb-8 flex items-center gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
        <span className="mt-0.5 h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {/* ── Step 1: Welcome ──────────────────────── */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="radia-card p-8 text-center"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/20">
                <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </span>
              <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
                Welcome to Radia, {profile?.first_name}!
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                Radia helps teams manage HR, onboarding, tasks, and knowledge — all in one place.
                Let&apos;s get you set up in just a couple of steps.
              </p>

              <div className="mt-8 space-y-3 text-left">
                {[
                  { icon: Users, text: "Manage your team and org chart" },
                  { icon: CheckCircle2, text: "Track tasks and onboarding progress" },
                  { icon: Building2, text: "Build your knowledge base with SOPs" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
                    <item.icon className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep("choose")}
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Choose path ─────────────────── */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="radia-card p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">How would you like to get started?</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Join an existing organization or create a new one.
              </p>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    setStep("join");
                    searchOrganizations();
                  }}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                    <LogIn className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Join an Organization</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Find your team based on your email domain
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-600" />
                </button>

                <button
                  onClick={() => setStep("create")}
                  className="group flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50"
                >
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Create an Organization</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Set up a new workspace for your team
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500 dark:text-slate-600" />
                </button>
              </div>

              <button
                onClick={() => setStep("welcome")}
                className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* ── Step 3a: Join Organization ───────────── */}
          {step === "join" && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="radia-card p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Join an Organization</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Searching for organizations matching your email domain...
              </p>

              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Mail className="h-3.5 w-3.5" />
                {profile?.email}
              </div>

              <div className="mt-6">
                {searching && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Searching for organizations...</p>
                  </div>
                )}

                {searchDone && matchedOrgs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Organizations found ({matchedOrgs.length})
                    </p>
                    {matchedOrgs.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
                          {org.name[0]?.toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{org.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{org.subdomain}.radia.app</p>
                        </div>
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                          Invite required
                        </span>
                      </div>
                    ))}
                    <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/30 dark:bg-sky-500/10">
                      <p className="text-sm text-sky-800 dark:text-sky-200">
                        Contact your workspace admin to send you an invite. Once invited, you&apos;ll be able to access the organization.
                      </p>
                    </div>
                  </div>
                )}

                {searchDone && matchedOrgs.length === 0 && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Users className="h-6 w-6 text-slate-400" />
                    </span>
                    <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      No organizations found
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      There are no organizations matching your email domain yet.
                      Ask your workspace admin to invite you, or create a new organization.
                    </p>
                    <button
                      onClick={() => setStep("create")}
                      className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                      <Building2 className="h-4 w-4" />
                      Create Organization
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("choose")}
                className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Back
              </button>
            </motion.div>
          )}

          {/* ── Step 3b: Create Organization ─────────── */}
          {step === "create" && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="radia-card p-8"
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create an Organization</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Set up your workspace and invite your team.
              </p>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                    Organization Name
                  </span>
                  <input
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
                  />
                </label>

                {/* Payment placeholder */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Pro Plan</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Unlimited members, SOPs, and integrations</p>
                    </div>
                    <span className="ml-auto text-lg font-bold text-slate-900 dark:text-slate-100">
                      $12<span className="text-xs font-normal text-slate-400">/mo</span>
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {["Unlimited team members", "Custom onboarding courses", "All integrations", "Priority support"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateOrg}
                  disabled={!orgName.trim() || creating}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Create Organization & Subscribe
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                  Payment will be set up via Stripe. Free during beta.
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => setStep("choose")}
                  className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Back
                </button>
                <button
                  onClick={handleSkipSetup}
                  className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
