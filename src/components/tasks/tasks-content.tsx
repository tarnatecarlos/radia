"use client";

import { useCallback, useRef, useState, type ComponentType, type DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Disc,
  GitBranch,
  GripVertical,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Table,
  Trash2,
  X,
} from "lucide-react";
import { tasks as initialTasks, profiles } from "@/lib/mock-data";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

type ViewMode = "table" | "list" | "kanban";
type ColumnKey = TaskStatus;

const columns: { key: ColumnKey; label: string; dotColor: string }[] = [
  { key: "TODO", label: "To Do", dotColor: "bg-slate-400" },
  { key: "IN_PROGRESS", label: "In Progress", dotColor: "bg-sky-600" },
  { key: "REVIEW", label: "In Review", dotColor: "bg-amber-600" },
  { key: "DONE", label: "Done", dotColor: "bg-emerald-600" },
];

const priorityDot: Record<string, string> = {
  HIGH: "bg-rose-600", MEDIUM: "bg-amber-600", LOW: "bg-emerald-600",
};

const integrationBadge = {
  slack: { label: "Slack", className: "bg-rose-50 text-rose-600 border-rose-200", icon: MessageSquare },
  github: { label: "GitHub", className: "bg-slate-50 text-slate-700 border-slate-200", icon: GitBranch },
  discord: { label: "Discord", className: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: Disc },
} satisfies Record<string, { label: string; className: string; icon: ComponentType<{ className?: string }> }>;

const avatarColorClasses = [
  "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600",
  "bg-sky-600", "bg-violet-600", "bg-teal-600", "bg-slate-500",
];

function getAvatarColor(id: string) {
  return avatarColorClasses[(parseInt(id.replace(/\D/g, ""), 10) || 0) % avatarColorClasses.length];
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`;
}

function formatShortDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusPill({ status }: { status: TaskStatus }) {
  const styles: Record<TaskStatus, string> = {
    TODO: "bg-slate-100 text-slate-600", IN_PROGRESS: "bg-sky-50 text-sky-700",
    REVIEW: "bg-amber-50 text-amber-700", DONE: "bg-emerald-50 text-emerald-700",
  };
  const labels: Record<TaskStatus, string> = {
    TODO: "To Do", IN_PROGRESS: "In Progress", REVIEW: "Review", DONE: "Done",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>{labels[status]}</span>
  );
}

function TaskCard({
  task, isDragging, onDragStart, onDragEnd, onDelete,
}: {
  task: Task; isDragging: boolean;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: () => void; onDelete: (id: string) => void;
}) {
  const badge = task.integration_source && task.integration_source in integrationBadge
    ? integrationBadge[task.integration_source as keyof typeof integrationBadge] : null;

  return (
    <motion.div
      layout draggable
      onDragStartCapture={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
      className={`group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-900 ${
        isDragging ? "scale-[1.02] border-indigo-300 shadow-md dark:border-indigo-500/40" : "hover:shadow-md"
      }`}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="flex items-center gap-2">
        {task.assignee && (
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(task.assignee.id)}`}>
            {getInitials(task.assignee.first_name, task.assignee.last_name)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
            {task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : "Unassigned"}
          </p>
          <p className="text-[11px] text-slate-400">{formatShortDate(task.created_at)}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
          className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{task.title}</p>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
        </span>
        {badge && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}>
            <badge.icon className="h-3 w-3" />{badge.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function TasksContent() {
  const { toast } = useToast();
  const [taskList, setTaskList] = useState<Task[]>(() => [...initialTasks]);
  const [view, setView] = useState<ViewMode>("kanban");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null);
  const dragCounterRef = useRef<Record<string, number>>({});

  // Create task modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM");
  const [newAssignee, setNewAssignee] = useState("");
  const [newStatus, setNewStatus] = useState<TaskStatus>("TODO");

  const handleDragStart = useCallback((e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => setDraggingId(taskId));
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingId(null); setOverColumn(null); dragCounterRef.current = {};
  }, []);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>, colKey: ColumnKey) => {
    e.preventDefault();
    dragCounterRef.current[colKey] = (dragCounterRef.current[colKey] || 0) + 1;
    setOverColumn(colKey);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>, colKey: ColumnKey) => {
    e.preventDefault();
    dragCounterRef.current[colKey] = (dragCounterRef.current[colKey] || 0) - 1;
    if (dragCounterRef.current[colKey] <= 0) {
      dragCounterRef.current[colKey] = 0;
      setOverColumn((prev) => (prev === colKey ? null : prev));
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, targetStatus: ColumnKey) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    setTaskList((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus, updated_at: new Date().toISOString() } : t)));
    setDraggingId(null); setOverColumn(null); dragCounterRef.current = {};
    toast(`Task moved to ${columns.find((c) => c.key === targetStatus)?.label}`);
  }, [toast]);

  const handleDelete = useCallback((id: string) => {
    setTaskList((prev) => prev.filter((t) => t.id !== id));
    toast("Task deleted");
  }, [toast]);

  function handleCreate() {
    if (!newTitle.trim()) { toast("Task title is required", "error"); return; }
    const assignee = profiles.find((p) => p.id === newAssignee);
    const task: Task = {
      id: `t${Date.now()}`, workspace_id: "w1", title: newTitle.trim(),
      description: newDesc.trim() || undefined, status: newStatus,
      priority: newPriority, creator_id: "u1", assignee_id: newAssignee || undefined,
      assignee, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setTaskList((prev) => [task, ...prev]);
    toast("Task created successfully");
    setShowCreate(false); setNewTitle(""); setNewDesc(""); setNewPriority("MEDIUM"); setNewAssignee(""); setNewStatus("TODO");
  }

  const grouped = columns.reduce((acc, col) => {
    acc[col.key] = taskList.filter((t) => t.status === col.key);
    return acc;
  }, {} as Record<ColumnKey, Task[]>);

  return (
    <div className="flex h-full flex-col gap-5">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tasks</h1>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" />Create Task
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="inline-flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {[
          { key: "table", label: "Table", icon: Table },
          { key: "list", label: "List View", icon: List },
          { key: "kanban", label: "Kanban", icon: LayoutGrid },
        ].map((tab) => {
          const active = view === tab.key;
          const Icon = tab.icon;
          return (
            <button key={tab.key} onClick={() => setView(tab.key as ViewMode)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${active ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100" : "text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"}`}>
              <Icon className="h-4 w-4" />{tab.label}
            </button>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "kanban" && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="grid flex-1 auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {columns.map((column, index) => (
              <motion.div key={column.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex flex-col rounded-xl border ${overColumn === column.key ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/50 dark:bg-indigo-500/10" : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"}`}
                onDragEnter={(e) => handleDragEnter(e, column.key)}
                onDragLeave={(e) => handleDragLeave(e, column.key)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.key)}
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{column.label}</span>
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-300">{grouped[column.key].length}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-3">
                  {grouped[column.key].map((task) => (
                    <TaskCard key={task.id} task={task} isDragging={draggingId === task.id} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDelete={handleDelete} />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
            {taskList.map((task, index) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25, delay: index * 0.03 }} className="radia-card group flex items-center gap-4 p-4">
                <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${priorityDot[task.priority]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                  {task.description && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{task.description}</p>}
                </div>
                <StatusPill status={task.status} />
                {task.assignee && (
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${getAvatarColor(task.assignee.id)}`}>
                    {getInitials(task.assignee.first_name, task.assignee.last_name)}
                  </span>
                )}
                <button onClick={() => handleDelete(task.id)} className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {view === "table" && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {["Task", "Status", "Priority", "Assignee", "Due Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em] text-slate-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {taskList.map((task, index) => (
                  <motion.tr key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: index * 0.02 }} className="group border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{task.title}</p>
                      {task.description && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{task.description}</p>}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={task.status} /></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className={`h-2 w-2 rounded-full ${priorityDot[task.priority]}`} />
                        {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-white ${getAvatarColor(task.assignee.id)}`}>
                            {getInitials(task.assignee.first_name, task.assignee.last_name)}
                          </span>
                          <span className="text-slate-700 dark:text-slate-200">{task.assignee.first_name} {task.assignee.last_name}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{task.due_date ? formatShortDate(task.due_date) : "-"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(task.id)} className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:hover:bg-rose-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create Task</h3>
                <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title *</span>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Task title..." className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Description</span>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} placeholder="Optional description..." className="radia-input w-full resize-none px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Status</span>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as TaskStatus)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="REVIEW">Review</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Priority</span>
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as TaskPriority)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Assignee</span>
                    <select value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                      <option value="">Unassigned</option>
                      {profiles.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleCreate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create Task</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
