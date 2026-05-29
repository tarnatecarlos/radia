"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  GraduationCap,
  Network,
  Plug,
  Shield,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Moon, Sun } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Team Management",
    description: "Organize your workforce with an interactive org chart and role-based access control.",
    color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
  },
  {
    icon: CheckSquare,
    title: "Task Tracking",
    description: "Kanban boards, list views, and drag-and-drop task management with priority levels.",
    color: "bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300",
  },
  {
    icon: GraduationCap,
    title: "Onboarding Courses",
    description: "Build rich onboarding courses with lessons, progress tracking, and completion certificates.",
    color: "bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300",
  },
  {
    icon: BookOpen,
    title: "SOPs & Knowledge Base",
    description: "Create, version, and organize standard operating procedures with rich text formatting.",
    color: "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300",
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Connect Slack, GitHub, Gmail, Discord, and more to streamline your workflows.",
    color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  {
    icon: Shield,
    title: "Admin Controls",
    description: "Server-level administration with audit logs, access requests, and system health monitoring.",
    color: "bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Radia</span>
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 text-center lg:pt-32">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            <Network className="h-3 w-3" />
            Modern HR Platform
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp} initial="hidden" animate="visible" custom={1}
          className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-slate-100"
        >
          Build teams that{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
            thrive
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp} initial="hidden" animate="visible" custom={2}
          className="mx-auto mt-5 max-w-2xl text-lg text-slate-500 dark:text-slate-400"
        >
          Radia is the all-in-one HR workspace for onboarding, task management, knowledge bases, and team organization. Built for modern teams.
        </motion.p>

        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={3}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Log in to your workspace
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-200 bg-white py-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Everything your HR team needs</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
              From onboarding new hires to managing daily operations — Radia brings it all together in one workspace.
            </p>
          </motion.div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i + 1}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 py-20 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0}>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Ready to get started?</h2>
            <p className="mx-auto mt-3 max-w-md text-slate-500 dark:text-slate-400">
              Create your workspace in seconds. No credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Create your workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Radia</span>
            <span className="h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} Radia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
