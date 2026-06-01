"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckSquare,
  GraduationCap,
  Moon,
  Network,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const CURRENT_YEAR = 2026;

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.08,
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  }),
};

const operatingRows = [
  {
    icon: Users,
    title: "Team structure",
    description: "Keep reporting lines, roles, and access visible without sending people through a maze of settings.",
    metric: "42 members",
  },
  {
    icon: CheckSquare,
    title: "Task flow",
    description: "Track ownership from intake to review, with priority and status surfaced where managers actually look.",
    metric: "18 active tasks",
  },
  {
    icon: GraduationCap,
    title: "Onboarding",
    description: "Pair courses, SOPs, and progress checks so new hires can see what is done and what still needs attention.",
    metric: "76% progress",
  },
];

const sceneBars = [
  { label: "Onboarding", value: 76, tone: "bg-indigo-600 dark:bg-indigo-400" },
  { label: "Tasks done", value: 61, tone: "bg-sky-600 dark:bg-sky-400" },
  { label: "SOP coverage", value: 84, tone: "bg-emerald-600 dark:bg-emerald-400" },
];

const taskColumns = [
  { label: "To do", value: 7, tone: "border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-900/80" },
  { label: "In progress", value: 9, tone: "border-sky-200 bg-sky-50/90 dark:border-sky-500/30 dark:bg-sky-500/10" },
  { label: "Review", value: 4, tone: "border-amber-200 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-500/10" },
  { label: "Done", value: 16, tone: "border-emerald-200 bg-emerald-50/90 dark:border-emerald-500/30 dark:bg-emerald-500/10" },
];

const featureRows = [
  {
    icon: BarChart3,
    title: "One operating picture",
    description: "Dashboard charts show task health, onboarding progress, and team coverage at a glance.",
  },
  {
    icon: BookOpen,
    title: "Knowledge that stays close",
    description: "SOPs and courses live beside the work they explain, so managers can close gaps before they become blockers.",
  },
  {
    icon: Shield,
    title: "Controls with context",
    description: "Role-based permissions, admin actions, and workspace settings stay clear without turning the product into a control panel.",
  },
];

function ProductScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-slate-200 dark:bg-slate-800" />
      <div className="absolute -right-24 top-24 hidden h-[560px] w-[880px] rotate-[-3deg] rounded-[2rem] border border-slate-200 bg-white/75 shadow-2xl shadow-slate-200/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-black/30 lg:block">
        <div className="flex h-full">
          <div className="w-52 border-r border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="h-8 w-24 rounded-md bg-slate-900 dark:bg-slate-100" />
            <div className="mt-8 space-y-2">
              {["Dashboard", "Tasks", "People", "SOPs"].map((item, index) => (
                <div
                  key={item}
                  className={`h-9 rounded-lg ${index === 0 ? "bg-indigo-600" : "bg-slate-200/70 dark:bg-slate-800"}`}
                />
              ))}
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-36 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="mt-3 h-8 w-64 rounded bg-slate-900 dark:bg-slate-100" />
              </div>
              <div className="h-10 w-28 rounded-lg bg-indigo-600" />
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {taskColumns.map((column) => (
                <div key={column.label} className={`rounded-xl border p-4 ${column.tone}`}>
                  <div className="h-3 w-16 rounded bg-slate-400/70 dark:bg-slate-600" />
                  <div className="mt-5 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">{column.value}</div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-[1.2fr_0.8fr] gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-4 w-32 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="mt-5 space-y-4">
                  {sceneBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{bar.label}</span>
                        <span className="font-mono">{bar.value}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className={`h-full rounded-full ${bar.tone}`} style={{ width: `${bar.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="h-4 w-24 rounded bg-slate-300 dark:bg-slate-700" />
                <div className="mt-6 flex justify-center">
                  <div className="relative h-32 w-32 rounded-full bg-[conic-gradient(#4f46e5_0_76%,#e2e8f0_76%_100%)] p-4 dark:bg-[conic-gradient(#818cf8_0_76%,#1e293b_76%_100%)]">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-white font-mono text-2xl font-semibold text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                      76%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-4 right-4 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-black/30 lg:hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Workspace health</div>
            <div className="mt-1 font-mono text-3xl font-semibold text-slate-900 dark:text-slate-100">76%</div>
          </div>
          <div className="h-16 w-16 rounded-full bg-[conic-gradient(#4f46e5_0_76%,#e2e8f0_76%_100%)] dark:bg-[conic-gradient(#818cf8_0_76%,#1e293b_76%_100%)]" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {sceneBars.map((bar) => (
            <div key={bar.label} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80">
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                <div className={`h-full rounded-full ${bar.tone}`} style={{ width: `${bar.value}%` }} />
              </div>
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{bar.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Radia home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
              R
            </span>
            <span className="text-lg font-semibold tracking-tight">Radia</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/docs"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Docs
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-950"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative isolate min-h-[calc(100svh-128px)] overflow-hidden border-b border-slate-200 dark:border-slate-800">
          <ProductScene />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f8fafc_0%,rgba(248,250,252,0.96)_32%,rgba(248,250,252,0.64)_58%,rgba(248,250,252,0.2)_100%)] dark:bg-[linear-gradient(90deg,#020617_0%,rgba(2,6,23,0.95)_36%,rgba(2,6,23,0.7)_62%,rgba(2,6,23,0.25)_100%)]" />
          <div className="relative z-10 mx-auto flex min-h-[calc(100svh-128px)] max-w-7xl flex-col justify-center px-5 pb-24 pt-16 sm:px-6 lg:pb-16">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Network className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                HR operations workspace
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="mt-7 max-w-3xl text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white"
            >
              Radia Workspace
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
              className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-slate-600 dark:text-slate-300"
            >
              A calmer command center for people operations: onboarding, tasks, SOPs, and team structure in one chart-aware workspace.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-950"
              >
                Create workspace
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Open dashboard
              </Link>
            </motion.div>

            <motion.dl
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={4}
              className="mt-12 grid max-w-xl grid-cols-3 gap-3 text-sm"
            >
              {[
                ["Task flow", "4 stages"],
                ["Onboarding", "76%"],
                ["Knowledge", "32 SOPs"],
              ].map(([label, value]) => (
                <div key={label} className="border-l border-slate-300 pl-3 dark:border-slate-700">
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
                  <dd className="mt-1 font-mono text-lg font-semibold text-slate-950 dark:text-white">{value}</dd>
                </div>
              ))}
            </motion.dl>
          </div>
        </section>

        <section className="bg-white py-20 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeUp}
                custom={0}
                className="lg:sticky lg:top-28"
              >
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">How teams use Radia</p>
                <h2 className="mt-3 max-w-lg text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                  Run the day from live operating signals.
                </h2>
                <p className="mt-4 max-w-md leading-7 text-slate-600 dark:text-slate-300">
                  The product favors clear charts, ownership, and status over another wall of cards. Managers get the current picture, then move straight into the work.
                </p>
              </motion.div>

              <div className="space-y-4">
                {operatingRows.map((row, index) => {
                  const Icon = row.icon;
                  return (
                    <motion.article
                      key={row.title}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-80px" }}
                      variants={fadeUp}
                      custom={index + 1}
                      className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white sm:grid-cols-[1fr_auto] dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <div className="flex gap-4">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm shadow-slate-200 dark:bg-slate-950 dark:text-indigo-400 dark:shadow-black/20">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-slate-950 dark:text-white">{row.title}</h3>
                          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">{row.description}</p>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-400">{row.metric}</div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-slate-100 py-20 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="mx-auto max-w-7xl px-5 sm:px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={fadeUp}
              custom={0}
              className="max-w-2xl"
            >
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Built for repeat work</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
                Less hunting, more operating.
              </h2>
            </motion.div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {featureRows.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.article
                    key={feature.title}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-80px" }}
                    variants={fadeUp}
                    custom={index + 1}
                    className="rounded-xl bg-white p-6 shadow-sm shadow-slate-200/70 dark:bg-slate-950 dark:shadow-black/20"
                  >
                    <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="mt-5 font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 dark:bg-slate-950">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Start with the operating view.</h2>
              <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
                Create a workspace, invite the team, and let the dashboard show what needs attention first.
              </p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex w-fit items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:ring-offset-slate-950"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
              R
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-200">Radia</span>
          </div>
          <p>Copyright {CURRENT_YEAR} Radia. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
