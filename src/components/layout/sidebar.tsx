"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  Moon,
  Network,
  Plug,
  Settings,
  Shield,
  Sun,
} from "lucide-react";
import {
  currentUser,
  getRoleBadgeColor,
  getRoleLabel,
  integrations,
  serverAdmins,
} from "@/lib/mock-data";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Org Chart", href: "/org-chart", icon: Network },
  { label: "Onboarding", href: "/onboarding", icon: GraduationCap },
  { label: "SOPs", href: "/sops", icon: BookOpen },
  { label: "Integrations", href: "/integrations", icon: Plug },
];

const platformColors: Record<string, string> = {
  slack: "#E01E5A",
  github: "#181717",
  gmail: "#EA4335",
  discord: "#5865F2",
  teams: "#6264A7",
  messenger: "#0084FF",
};

function initials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const userInitials = initials(currentUser.first_name, currentUser.last_name);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="px-5 pb-4 pt-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Radia
          </span>
          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
        </Link>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">HR Workspace</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
          Menu
        </p>
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
                )}
                <Icon className="h-[18px] w-[18px] flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400 dark:text-slate-500">
            Messages
          </p>
          <div className="space-y-1">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center gap-3 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-300"
              >
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  {integration.is_active && (
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{
                        backgroundColor:
                          platformColors[integration.platform_name] ?? "#4f46e5",
                        animation: "pulse-ring 2.5s ease-out infinite",
                      }}
                    />
                  )}
                  <span
                    className="relative inline-flex h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: integration.is_active
                        ? platformColors[integration.platform_name] ?? "#4f46e5"
                        : isDark
                          ? "#475569"
                          : "#cbd5e1",
                    }}
                  />
                </span>
                <span className="capitalize">{integration.platform_name}</span>
                {integration.is_active && (
                  <span className="ml-auto text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <div className="space-y-1 border-t border-slate-200 px-3 pb-3 pt-2 dark:border-slate-800">
        <Link
          href="/settings"
          className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive("/settings")
              ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          }`}
        >
          {isActive("/settings") && (
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />
          )}
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>

        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          {isDark ? "Light Mode" : "Dark Mode"}
          <span
            className={`ml-auto flex h-4 w-8 items-center rounded-full px-0.5 ${
              isDark ? "justify-end bg-indigo-500" : "justify-start bg-slate-300"
            }`}
          >
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
        </button>

        <div className="mt-1 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {currentUser.first_name} {currentUser.last_name}
            </p>
            <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
              {currentUser.title}
            </p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRoleBadgeColor(currentUser.role)}`}>
            {getRoleLabel(currentUser.role)}
          </span>
        </div>

        {currentUser.role === "creator" &&
          serverAdmins.some((sa) => sa.profile_id === currentUser.id) && (
            <Link
              href="/admin"
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/admin")
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                  : "text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-300 dark:hover:bg-rose-500/15"
              }`}
            >
              {isActive("/admin") && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-rose-600 dark:bg-rose-400" />
              )}
              <Shield className="h-[18px] w-[18px]" />
              Admin Panel
            </Link>
          )}
      </div>
    </div>
  );
}
