"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckSquare,
  Clock,
  FileText,
  GraduationCap,
  Plus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus, Profile, Course, CourseEnrollment } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/lib/user-context";
import { createClient } from "@/lib/supabase/client";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`;
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

type ModalType = "task" | "employee" | "sop" | null;

export function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, loading: userLoading } = useUser();
  const currentDate = formatDate(new Date());

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

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();
    setDataLoading(true);

    const [profilesRes, tasksRes, sopsRes, coursesRes, enrollmentsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("workspace_id", profile.workspace_id),
      supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
        .eq("workspace_id", profile.workspace_id)
        .order("updated_at", { ascending: false }),
      supabase
        .from("sops")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", profile.workspace_id),
      supabase
        .from("courses")
        .select("*, lessons(*)")
        .eq("workspace_id", profile.workspace_id),
      supabase
        .from("course_enrollments")
        .select("*"),
    ]);

    setProfilesList((profilesRes.data as Profile[]) ?? []);
    setTaskList((tasksRes.data as Task[]) ?? []);
    setSopCount(sopsRes.count ?? 0);
    setCoursesList((coursesRes.data as Course[]) ?? []);
    setEnrollmentsList((enrollmentsRes.data as CourseEnrollment[]) ?? []);
    setDataLoading(false);
  }, [profile]);

  useEffect(() => {
    if (!userLoading && profile) {
      fetchData();
    }
  }, [userLoading, profile, fetchData]);

  if (userLoading || dataLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  const activeTasks = taskList.filter((t) => t.status !== "DONE").length;
  const onboardingRows = getOnboardingRows(profilesList, enrollmentsList, coursesList);
  const overallOnboarding = (() => {
    const total = onboardingRows.reduce((s, r) => s + r.totalLessons, 0);
    const done = onboardingRows.reduce((s, r) => s + r.completedLessons, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  })();
  const recentActivity = getRecentActivity(taskList);

  const stats = [
    { label: "Total Employees", value: profilesList.length, icon: Users, tone: "text-indigo-600 bg-indigo-50", sub: `${profilesList.length} active members` },
    { label: "Active Tasks", value: activeTasks, icon: CheckSquare, tone: "text-sky-600 bg-sky-50", sub: `${taskList.filter((t) => t.status === "TODO").length} pending` },
    { label: "Onboarding", value: `${overallOnboarding}%`, icon: GraduationCap, tone: "text-amber-600 bg-amber-50", sub: `${onboardingRows.length} in progress` },
    { label: "SOPs Published", value: sopCount, icon: BookOpen, tone: "text-violet-600 bg-violet-50", sub: "Updated recently" },
  ];

  function resetForms() {
    setTaskTitle(""); setTaskDesc(""); setTaskPriority("MEDIUM"); setTaskAssignee("");
    setEmpFirst(""); setEmpLast(""); setEmpEmail(""); setEmpTitle(""); setEmpManager("");
    setSopTitle(""); setSopCategory("General");
  }

  async function handleCreateTask() {
    if (!taskTitle.trim()) { toast("Task title is required", "error"); return; }
    if (!profile) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        workspace_id: profile.workspace_id,
        title: taskTitle.trim(),
        description: taskDesc.trim() || null,
        status: "TODO",
        priority: taskPriority,
        creator_id: profile.id,
        assignee_id: taskAssignee || null,
      })
      .select("*, assignee:profiles!tasks_assignee_id_fkey(*)")
      .single();

    if (error) {
      toast("Failed to create task", "error");
      return;
    }

    setTaskList((prev) => [data as Task, ...prev]);
    toast("Task created successfully");
    setModal(null); resetForms();
  }

  async function handleAddEmployee() {
    if (!empFirst.trim() || !empLast.trim() || !empEmail.trim()) {
      toast("First name, last name, and email are required", "error"); return;
    }
    if (!profile) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        workspace_id: profile.workspace_id,
        email: empEmail.trim(),
        first_name: empFirst.trim(),
        last_name: empLast.trim(),
        role: "user",
        title: empTitle.trim() || null,
        manager_id: empManager || null,
        onboarding_completed: false,
        started_date: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (error) {
      toast("Failed to add employee", "error");
      return;
    }

    setProfilesList((prev) => [...prev, data as Profile]);
    toast(`${empFirst} ${empLast} added successfully`);
    setModal(null); resetForms();
  }

  async function handleCreateSOP() {
    if (!sopTitle.trim()) { toast("SOP title is required", "error"); return; }
    if (!profile) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("sops")
      .insert({
        workspace_id: profile.workspace_id,
        title: sopTitle.trim(),
        content: "",
        category: sopCategory,
        version: 1,
        last_updated_by: profile.id,
      });

    if (error) {
      toast("Failed to create SOP", "error");
      return;
    }

    toast("SOP created successfully");
    setModal(null); resetForms();
    router.push("/dashboard/sops");
  }

  return (
    <div className="space-y-6 pb-5">
      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={0}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome back, {profile?.first_name ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{currentDate}</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={cardVariants} initial="hidden" animate="visible" custom={index + 1} className="radia-card radia-card-hover p-5">
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{stat.label}</span>
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-2 font-mono text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={6} className="radia-card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h2>
          <div className="mt-4 space-y-1">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                {item.assignee && (
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${getAvatarColor(item.assignee.id)}`}>
                    {getInitials(item.assignee.first_name, item.assignee.last_name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item.text}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                    <Clock className="h-3 w-3" />{timeAgo(item.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={7} className="radia-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Onboarding Overview</h2>
          <div className="mt-4 space-y-5">
            {onboardingRows.map((row) => (
              <div key={row.profile.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(row.profile.id)}`}>
                      {getInitials(row.profile.first_name, row.profile.last_name)}
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {row.profile.first_name} {row.profile.last_name}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-300">{row.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <motion.div className="h-full rounded-full bg-indigo-600" initial={{ width: 0 }} animate={{ width: `${row.progress}%` }} transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{row.completedLessons} of {row.totalLessons} lessons completed</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={8} className="flex flex-wrap gap-3">
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
