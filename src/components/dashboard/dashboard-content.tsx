"use client";

import { useState, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  UserPlus,
  X,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus, Profile, Course, CourseEnrollment, SOP } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/utils";

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function subscribeToDateChanges(onStoreChange: () => void) {
  const intervalId = window.setInterval(onStoreChange, 60 * 60 * 1000);
  return () => window.clearInterval(intervalId);
}

function getCurrentDateSnapshot() {
  return formatLongDate(new Date());
}

function getServerDateSnapshot() {
  return "Today";
}

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

const avatarColorClasses = [
  "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  "bg-sky-600", "bg-violet-600", "bg-teal-600", "bg-slate-500",
];

function getAvatarColor(id: string) {
  const parsed = parseInt(id.replace(/\D/g, ""), 10) || 0;
  return avatarColorClasses[parsed % avatarColorClasses.length];
}

function getOnboardingRows(
  profiles: Profile[],
  enrollments: CourseEnrollment[],
  courses: Course[],
) {
  const incompleteProfiles = profiles.filter((p) => !p.onboarding_completed);
  return incompleteProfiles.map((profile) => {
    const userEnrollments = enrollments.filter((e) => e.profile_id === profile.id);
    let totalLessons = 0;
    let completedLessons = 0;
    for (const enrollment of userEnrollments) {
      const course = courses.find((c) => c.id === enrollment.course_id);
      if (!course?.lessons) continue;
      totalLessons += course.lessons.length;
      completedLessons += enrollment.completed_lessons.length;
    }
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { profile, progress, completedLessons, totalLessons };
  });
}

function getRecentActivity(tasks: Task[]) {
  const statusLabel: Record<string, string> = {
    TODO: "created", IN_PROGRESS: "is working on", REVIEW: "submitted for review", DONE: "completed",
  };
  return [...tasks]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      text: `${task.assignee?.first_name ?? "Someone"} ${task.assignee?.last_name ?? ""} ${statusLabel[task.status] ?? "updated"} "${task.title}"`,
      assignee: task.assignee,
      timestamp: task.updated_at,
      status: task.status,
    }));
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (index: number) => ({
    opacity: 1, y: 0,
    transition: { delay: index * 0.07, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
};

const statusLabels: Record<TaskStatus, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  REVIEW: "Review",
  DONE: "Done",
};

const statusOrder: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

const statusColors: Record<TaskStatus, string> = {
  TODO: "bg-slate-400 dark:bg-slate-500",
  IN_PROGRESS: "bg-sky-600 dark:bg-sky-400",
  REVIEW: "bg-amber-500 dark:bg-amber-400",
  DONE: "bg-emerald-600 dark:bg-emerald-400",
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "bg-emerald-600 dark:bg-emerald-400",
  MEDIUM: "bg-amber-500 dark:bg-amber-400",
  HIGH: "bg-rose-600 dark:bg-rose-400",
};

type ChartRow = {
  label: string;
  value: number;
  total: number;
  color: string;
  caption?: string;
};

function getPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function ChartPanel({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`radia-card p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{eyebrow}</p>}
          <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <BarChart3 className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function BarList({ rows }: { rows: ChartRow[] }) {
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const percent = getPercent(row.value, row.total);
        return (
          <div key={row.label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{row.label}</p>
                {row.caption && <p className="text-xs text-slate-400 dark:text-slate-500">{row.caption}</p>}
              </div>
              <div className="font-mono text-sm font-semibold text-slate-500 dark:text-slate-300">
                {row.value}
                <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">{percent}%</span>
              </div>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className={`h-full rounded-full ${row.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({
  value,
  label,
  caption,
  color = "#4f46e5",
}: {
  value: number;
  label: string;
  caption: string;
  color?: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className="relative flex h-44 w-44 items-center justify-center rounded-full p-4"
        style={{ background: `conic-gradient(${color} ${safeValue}%, var(--surface-sunken) 0)` }}
        role="img"
        aria-label={`${label}: ${safeValue}%`}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
          <span className="font-mono text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{safeValue}%</span>
          <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        </div>
      </div>
      <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">{caption}</p>
    </div>
  );
}

function CompactMetric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/70">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{caption}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    TODO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    IN_PROGRESS: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    REVIEW: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    DONE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

type ModalType = "task" | "employee" | "sop" | null;

export function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, preferences, loading: userLoading } = useUser();
  const currentDate = useSyncExternalStore(
    subscribeToDateChanges,
    getCurrentDateSnapshot,
    getServerDateSnapshot,
  );

  const [taskList, setTaskList] = useState<Task[]>([]);
  const [profilesList, setProfilesList] = useState<Profile[]>([]);
  const [sopCount, setSopCount] = useState(0);
  const [coursesList, setCoursesList] = useState<Course[]>([]);
  const [enrollmentsList, setEnrollmentsList] = useState<CourseEnrollment[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskAssignee, setTaskAssignee] = useState("");

  // Employee form
  const [empFirst, setEmpFirst] = useState("");
  const [empLast, setEmpLast] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empTitle, setEmpTitle] = useState("");
  const [empManager, setEmpManager] = useState("");

  // SOP form
  const [sopTitle, setSopTitle] = useState("");
  const [sopCategory, setSopCategory] = useState("General");

  useEffect(() => {
    if (userLoading || !profile) return;

    let cancelled = false;
    api<{ profiles: Profile[]; tasks: Task[]; sops: { id: string }[]; courses: Course[]; enrollments: CourseEnrollment[] }>("/dashboard")
      .then(({ profiles, tasks, sops: sopsData, courses, enrollments }) => {
        if (cancelled) return;
        setProfilesList(profiles);
        setTaskList(tasks);
        setSopCount(sopsData.length);
        setCoursesList(courses);
        setEnrollmentsList(enrollments);
        setDataLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        toast("Failed to load dashboard", "error");
        setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLoading, profile, toast]);

  if (userLoading || dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  const isAdmin = profile?.role === 'creator' || profile?.role === 'moderator';

  const activeTasks = taskList.filter((t) => t.status !== "DONE").length;
  const completedTasks = taskList.filter((t) => t.status === "DONE").length;
  const onboardingRows = getOnboardingRows(profilesList, enrollmentsList, coursesList);
  const overallOnboarding = (() => {
    const total = onboardingRows.reduce((s, r) => s + r.totalLessons, 0);
    const done = onboardingRows.reduce((s, r) => s + r.completedLessons, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();
  const onboardingProgress = onboardingRows.length === 0 ? 100 : overallOnboarding;
  const taskCompletionRate = getPercent(completedTasks, taskList.length);
  const knowledgeCoverage = Math.min(100, Math.round(((sopCount + coursesList.length) / Math.max(profilesList.length, 1)) * 50));
  const workspaceHealth = Math.round((taskCompletionRate + onboardingProgress + knowledgeCoverage) / 3);
  const atRiskOnboarding = onboardingRows.filter((row) => row.progress < 50).length;
  const recentActivity = getRecentActivity(taskList);
  const taskStatusRows: ChartRow[] = statusOrder.map((status) => ({
    label: statusLabels[status],
    value: taskList.filter((task) => task.status === status).length,
    total: taskList.length,
    color: statusColors[status],
  }));
  const priorityRows: ChartRow[] = (["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((priority) => ({
    label: priorityLabels[priority],
    value: taskList.filter((task) => task.priority === priority).length,
    total: taskList.length,
    color: priorityColors[priority],
    caption: priority === "HIGH" ? "Needs manager attention" : undefined,
  }));
  const roleRows: ChartRow[] = [
    {
      label: "Creators",
      value: profilesList.filter((member) => member.role === "creator").length,
      total: profilesList.length,
      color: "bg-indigo-600 dark:bg-indigo-400",
    },
    {
      label: "Moderators",
      value: profilesList.filter((member) => member.role === "moderator").length,
      total: profilesList.length,
      color: "bg-sky-600 dark:bg-sky-400",
    },
    {
      label: "Members",
      value: profilesList.filter((member) => member.role === "user").length,
      total: profilesList.length,
      color: "bg-slate-500 dark:bg-slate-400",
    },
  ];

  // Member-specific computed data
  const myTasks = taskList.filter(t => t.assignee_id === profile?.id)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const myActiveTasks = myTasks.filter(t => t.status !== 'DONE').length;
  const myCompletedTasks = myTasks.filter(t => t.status === 'DONE').length;
  const myTaskCompletionRate = getPercent(myCompletedTasks, myTasks.length);
  const myOnboardingProgress = (() => {
    const myEnrollments = enrollmentsList.filter(e => e.profile_id === profile?.id);
    let total = 0, completed = 0;
    for (const enrollment of myEnrollments) {
      const course = coursesList.find(c => c.id === enrollment.course_id);
      if (!course?.lessons) continue;
      total += course.lessons.length;
      completed += enrollment.completed_lessons.length;
    }
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  })();
  const myOnboardingScore = coursesList.length === 0 ? 100 : myOnboardingProgress;
  const myFocusScore = Math.round((myTaskCompletionRate + myOnboardingScore) / 2);
  const myStatusRows: ChartRow[] = statusOrder.map((status) => ({
    label: statusLabels[status],
    value: myTasks.filter((task) => task.status === status).length,
    total: myTasks.length,
    color: statusColors[status],
  }));
  const myPriorityRows: ChartRow[] = (["HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((priority) => ({
    label: priorityLabels[priority],
    value: myTasks.filter((task) => task.priority === priority).length,
    total: myTasks.length,
    color: priorityColors[priority],
  }));
  const assignedCourseCount = enrollmentsList.filter((enrollment) => enrollment.profile_id === profile?.id).length;

  function resetForms() {
    setTaskTitle(""); setTaskDesc(""); setTaskPriority("MEDIUM"); setTaskAssignee("");
    setEmpFirst(""); setEmpLast(""); setEmpEmail(""); setEmpTitle(""); setEmpManager("");
    setSopTitle(""); setSopCategory("General");
  }

  async function handleCreateTask() {
    if (!taskTitle.trim()) { toast("Task title is required", "error"); return; }
    if (!profile) return;

    try {
      const data = await api<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          status: "TODO",
          priority: taskPriority,
          assignee_id: taskAssignee || null,
        }),
      });

      setTaskList((prev) => [data, ...prev]);
      toast("Task created successfully");
      setModal(null); resetForms();
    } catch {
      toast("Failed to create task", "error");
    }
  }

  async function handleAddEmployee() {
    if (!empFirst.trim() || !empLast.trim() || !empEmail.trim()) {
      toast("First name, last name, and email are required", "error"); return;
    }
    if (!profile) return;

    try {
      const data = await api<Profile>("/profiles", {
        method: "POST",
        body: JSON.stringify({
          email: empEmail.trim(),
          first_name: empFirst.trim(),
          last_name: empLast.trim(),
          role: "user",
          title: empTitle.trim() || null,
          manager_id: empManager || null,
        }),
      });

      setProfilesList((prev) => [...prev, data]);
      toast(`${empFirst} ${empLast} added successfully`);
      setModal(null); resetForms();
    } catch {
      toast("Failed to add employee", "error");
    }
  }

  async function handleCreateSOP() {
    if (!sopTitle.trim()) { toast("SOP title is required", "error"); return; }
    if (!profile) return;

    try {
      await api("/sops", {
        method: "POST",
        body: JSON.stringify({
          title: sopTitle.trim(),
          content: "",
          category: sopCategory,
        }),
      });

      toast("SOP created successfully");
      setModal(null); resetForms();
      router.push("/dashboard/sops");
    } catch {
      toast("Failed to create SOP", "error");
    }
  }

  return (
    <div className="space-y-6 pb-5">
      {isAdmin ? (
        <>
          {/* Admin Dashboard */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back, {profile?.first_name ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentDate} - workspace health, task flow, and onboarding progress.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
              <ChartPanel title="Workspace health" eyebrow="Live operating score" className="h-full">
                <div className="grid gap-7 md:grid-cols-[220px_1fr] md:items-center">
                  <DonutChart
                    value={workspaceHealth}
                    label="health"
                    caption="Blends task completion, onboarding progress, and knowledge coverage."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CompactMetric label="People" value={profilesList.length} caption="Active members" />
                    <CompactMetric label="Active tasks" value={activeTasks} caption={`${completedTasks} completed`} />
                    <CompactMetric label="Onboarding" value={`${onboardingProgress}%`} caption={`${onboardingRows.length} in progress`} />
                    <CompactMetric label="Knowledge" value={sopCount} caption={`${coursesList.length} courses`} />
                  </div>
                </div>
              </ChartPanel>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
              <ChartPanel title="Task flow by status" eyebrow="Delivery pipeline" className="h-full">
                {taskList.length > 0 ? (
                  <BarList rows={taskStatusRows} />
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    No tasks have been created yet.
                  </p>
                )}
              </ChartPanel>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
              <ChartPanel title="Priority load" eyebrow="Task risk">
                {taskList.length > 0 ? (
                  <BarList rows={priorityRows} />
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    Priority data appears after the first task is created.
                  </p>
                )}
              </ChartPanel>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
              <ChartPanel title="Onboarding progress" eyebrow={`${atRiskOnboarding} below 50%`}>
                {onboardingRows.length > 0 ? (
                  <div className="space-y-4">
                    {onboardingRows.slice(0, 5).map((row) => (
                      <div key={row.profile.id}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-white ${getAvatarColor(row.profile.id)}`}>
                              {getInitials(row.profile.first_name, row.profile.last_name)}
                            </span>
                            <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                              {row.profile.first_name} {row.profile.last_name}
                            </span>
                          </div>
                          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-300">{row.progress}%</span>
                        </div>
                        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <motion.div
                            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${row.progress}%` }}
                            transition={{ duration: 0.55, ease: "easeOut" }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                          {row.completedLessons} of {row.totalLessons} lessons completed
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    Everyone has completed onboarding.
                  </p>
                )}
              </ChartPanel>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5}>
              <ChartPanel title="Team role mix" eyebrow="Access coverage">
                {profilesList.length > 0 ? (
                  <BarList rows={roleRows} />
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    Add employees to see role distribution.
                  </p>
                )}
              </ChartPanel>
            </motion.div>
          </div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={6}>
            <ChartPanel title="Latest task movement" eyebrow="Recent activity">
              <div className="space-y-1">
                {recentActivity.length > 0 ? recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                    {item.assignee && (
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-xs font-semibold text-white ${getAvatarColor(item.assignee.id)}`}>
                        {getInitials(item.assignee.first_name, item.assignee.last_name)}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item.text}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="h-3 w-3" />{timeAgo(item.timestamp)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                )) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    Task movement will appear here once work starts changing.
                  </p>
                )}
              </div>
            </ChartPanel>
          </motion.div>

          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={7} className="flex flex-wrap gap-3">
            {[
              { label: "Create Task", icon: Plus, primary: true, action: () => setModal("task") },
              { label: "Add Employee", icon: UserPlus, primary: false, action: () => setModal("employee") },
              { label: "New SOP", icon: FileText, primary: false, action: () => setModal("sop") },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={action.action}
                  className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    action.primary
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />{action.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </button>
              );
            })}
          </motion.div>
        </>
      ) : (
        <>
          {/* Member Dashboard */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome, {profile?.first_name ?? "there"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {currentDate} - your tasks, onboarding, and reference docs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={1}>
              <ChartPanel title="My work health" eyebrow="Personal operating score" className="h-full">
                <div className="grid gap-7 md:grid-cols-[220px_1fr] md:items-center">
                  <DonutChart
                    value={myFocusScore}
                    label="focus"
                    caption="Blends your completed tasks with onboarding progress."
                    color="#0ea5e9"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CompactMetric label="Active tasks" value={myActiveTasks} caption="Still open" />
                    <CompactMetric label="Completed" value={myCompletedTasks} caption="Finished tasks" />
                    <CompactMetric label="Courses" value={assignedCourseCount} caption={`${myOnboardingScore}% onboarding`} />
                    <CompactMetric label="SOPs" value={sopCount} caption="Available docs" />
                  </div>
                </div>
              </ChartPanel>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={2}>
              <ChartPanel title="My task status" eyebrow="Assigned work" className="h-full">
                {myTasks.length > 0 ? (
                  <BarList rows={myStatusRows} />
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    No tasks are assigned to you yet.
                  </p>
                )}
              </ChartPanel>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]">
            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={3}>
              <ChartPanel title="Priority mix" eyebrow="My task risk">
                {myTasks.length > 0 ? (
                  <BarList rows={myPriorityRows} />
                ) : (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                    Priority data appears when tasks are assigned.
                  </p>
                )}
              </ChartPanel>
            </motion.div>

            <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={4}>
              <ChartPanel title="Assigned task list" eyebrow="Recent updates">
                <div className="space-y-2">
                  {myTasks.slice(0, 6).map((task) => (
                    <div key={task.id} className="grid gap-3 rounded-lg p-2 hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center dark:hover:bg-slate-800">
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${priorityColors[task.priority]}`} />
                          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{task.title}</span>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <Clock className="h-3 w-3" />Updated {timeAgo(task.updated_at)}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{priorityLabels[task.priority]}</span>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                  {myTasks.length === 0 && (
                    <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                      No tasks assigned to you yet.
                    </p>
                  )}
                </div>
              </ChartPanel>
            </motion.div>
          </div>

          {/* Quick actions */}
          <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={5} className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/dashboard/tasks")}
              className="group inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <CheckSquare className="h-4 w-4" />View My Tasks
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
            <button
              onClick={() => router.push("/dashboard/onboarding")}
              className="group inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <GraduationCap className="h-4 w-4" />Continue Onboarding
              <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
            </button>
            {preferences?.members_can_create_tasks && (
              <button
                onClick={() => setModal("task")}
                className="group inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />Create Task
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            )}
            {preferences?.members_can_create_sops && (
              <button
                onClick={() => setModal("sop")}
                className="group inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <FileText className="h-4 w-4" />New SOP
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </button>
            )}
          </motion.div>
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => { setModal(null); resetForms(); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {modal === "task" && "Create Task"}
                  {modal === "employee" && "Add Employee"}
                  {modal === "sop" && "New SOP"}
                </h3>
                <button onClick={() => { setModal(null); resetForms(); }} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modal === "task" && (
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title *</span>
                    <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title..." className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Description</span>
                    <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={3} placeholder="Optional description..." className="radia-input w-full resize-none px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Priority</span>
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Assignee</span>
                      <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                        <option value="">Unassigned</option>
                        {profilesList.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setModal(null); resetForms(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                    <button onClick={handleCreateTask} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Task</button>
                  </div>
                </div>
              )}

              {modal === "employee" && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">First Name *</span>
                      <input value={empFirst} onChange={(e) => setEmpFirst(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Last Name *</span>
                      <input value={empLast} onChange={(e) => setEmpLast(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Email *</span>
                    <input type="email" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title</span>
                    <input value={empTitle} onChange={(e) => setEmpTitle(e.target.value)} placeholder="e.g. Software Engineer" className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Manager</span>
                    <select value={empManager} onChange={(e) => setEmpManager(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <option value="">None</option>
                      {profilesList.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
                    </select>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setModal(null); resetForms(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                    <button onClick={handleAddEmployee} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add Employee</button>
                  </div>
                </div>
              )}

              {modal === "sop" && (
                <div className="mt-4 space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title *</span>
                    <input value={sopTitle} onChange={(e) => setSopTitle(e.target.value)} placeholder="SOP title..." className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Category</span>
                    <select value={sopCategory} onChange={(e) => setSopCategory(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <option>General</option>
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>HR</option>
                    </select>
                  </label>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => { setModal(null); resetForms(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                    <button onClick={handleCreateSOP} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create SOP</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
