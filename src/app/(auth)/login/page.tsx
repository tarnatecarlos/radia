"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast("Please enter your email and password", "error");
      return;
    }

    setLoading(true);
    try {
      await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      toast("Welcome back!");

      // If we have an invite token, pass it through to setup
      if (inviteToken) {
        router.push(`/setup?invite=${inviteToken}`);
      } else {
        // Check if setup is already complete to skip the setup page
        const me = await api<{ profile: { setup_completed: boolean } | null }>("/auth/me").catch(() => null);
        router.push(me?.profile?.setup_completed ? "/dashboard" : "/setup");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="radia-card p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Log in to your Radia workspace.</p>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
