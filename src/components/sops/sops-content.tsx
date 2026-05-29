"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Edit3, FileText, Plus, Save, Search, Tag, Trash2, X } from "lucide-react";
import { getProfileById, sops as initialSops } from "@/lib/mock-data";
import type { SOP } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RichContent } from "@/components/ui/rich-content";

const categories = ["All", "General", "Engineering", "Design", "HR"] as const;

function extractExcerpt(content: string, max = 120) {
  return content.replace(/#+\s/g, "").replace(/\n/g, " ").slice(0, max);
}

function categoryTone(category: string) {
  if (category === "Engineering") return "bg-sky-50 text-sky-700";
  if (category === "Design") return "bg-violet-50 text-violet-700";
  if (category === "HR") return "bg-emerald-50 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

export function SOPsContent() {
  const { toast } = useToast();
  const [sopList, setSopList] = useState<SOP[]>(() => [...initialSops]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(initialSops[0]?.id ?? null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newContent, setNewContent] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sopList.filter((sop) => {
      const matchesCategory = activeCategory === "All" || sop.category === activeCategory;
      const query = search.trim().toLowerCase();
      const matchesQuery = query.length === 0 || sop.title.toLowerCase().includes(query) || sop.content.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, search, sopList]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  function handleCreate() {
    if (!newTitle.trim()) { toast("Title is required", "error"); return; }
    const sop: SOP = {
      id: `s${Date.now()}`, workspace_id: "w1", title: newTitle.trim(),
      content: newContent.trim() || `# ${newTitle.trim()}\n\nContent goes here...`,
      category: newCategory, version: 1, last_updated_by: "u1",
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    setSopList((prev) => [sop, ...prev]);
    setSelectedId(sop.id);
    toast("SOP created successfully");
    setShowCreate(false); setNewTitle(""); setNewContent(""); setNewCategory("General");
  }

  function startEdit(sop: SOP) {
    setEditingId(sop.id);
    setEditTitle(sop.title);
    setEditContent(sop.content);
    setEditCategory(sop.category);
  }

  function handleSaveEdit() {
    if (!editTitle.trim()) { toast("Title is required", "error"); return; }
    setSopList((prev) => prev.map((s) =>
      s.id === editingId
        ? { ...s, title: editTitle.trim(), content: editContent, category: editCategory, version: s.version + 1, updated_at: new Date().toISOString(), last_updated_by: "u1" }
        : s
    ));
    toast("SOP updated successfully");
    setEditingId(null);
  }

  function handleDelete() {
    if (!deleteId) return;
    setSopList((prev) => prev.filter((s) => s.id !== deleteId));
    if (selectedId === deleteId) setSelectedId(null);
    toast("SOP deleted");
    setDeleteId(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Standard Operating Procedures</h1>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{sopList.length} documents in the knowledge base</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700">
          <Plus className="h-4 w-4" />New SOP
        </button>
      </div>

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search SOPs..." className="radia-input w-full py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500" />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button key={category} onClick={() => setActiveCategory(category)} className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${activeCategory === category ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-2">
          {filtered.map((sop) => (
            <button key={sop.id} onClick={() => { setSelectedId(sop.id); setEditingId(null); }} className={`w-full rounded-lg border p-4 text-left transition ${selected?.id === sop.id ? "border-indigo-300 bg-white shadow-sm dark:border-indigo-500/50 dark:bg-slate-900" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"}`}>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryTone(sop.category)}`}>{sop.category}</span>
                <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">v{sop.version}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{sop.title}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{extractExcerpt(sop.content)}...</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">No SOPs match this filter.</div>
          )}
        </div>

        <div className="radia-card min-h-[520px] p-6">
          {selected ? (
            editingId === selected.id ? (
              /* Edit mode */
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title</span>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Category</span>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                    <option>General</option><option>Engineering</option><option>Design</option><option>HR</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Content (Markdown)</span>
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={16} className="radia-input w-full resize-y px-3 py-2.5 font-mono text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Save className="h-4 w-4" />Save Changes</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                </div>
              </div>
            ) : (
              /* View mode */
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryTone(selected.category)}`}>{selected.category}</span>
                  <span className="font-mono text-xs text-slate-400 dark:text-slate-500">Version {selected.version}</span>
                  <div className="ml-auto flex gap-1">
                    <button onClick={() => startEdit(selected)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(selected.id)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{selected.title}</h2>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Updated {new Date(selected.updated_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  {selected.last_updated_by ? ` by ${getProfileById(selected.last_updated_by)?.first_name ?? "Unknown"}` : ""}
                </p>
                <div className="my-5 h-px bg-slate-200 dark:bg-slate-700" />
                <RichContent content={selected.content} />
                <div className="mt-6 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    This document is maintained by the <strong>{selected.category}</strong> team and reviewed quarterly. All members are expected to read and acknowledge the latest version.
                  </p>
                </div>
              </>
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">Select an SOP to view details.</div>
          )}
        </div>
      </div>

      {/* Create SOP Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Create New SOP</h3>
                <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Title *</span>
                  <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="SOP title..." className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Category</span>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="radia-input w-full px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100">
                    <option>General</option><option>Engineering</option><option>Design</option><option>HR</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">Content (Markdown)</span>
                  <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={8} placeholder="# Title\n\nWrite your SOP content here..." className="radia-input w-full resize-y px-3 py-2.5 font-mono text-sm text-slate-900 dark:text-slate-100" />
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                  <button onClick={handleCreate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create SOP</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete SOP"
        description="Are you sure you want to delete this SOP? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
