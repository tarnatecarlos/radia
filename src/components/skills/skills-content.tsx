"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Filter,
  Plus,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { api } from "@/lib/api";
import { getInitials, formatShortDate } from "@/lib/utils";
import type { Certification, Profile, ProfileSkill, Proficiency, Skill } from "@/lib/types";
import { useToast } from "@/components/ui/toast";

const proficiencyColors: Record<Proficiency, string> = {
  beginner: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  intermediate: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  advanced: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  expert: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const sourceLabels: Record<string, { label: string; color: string }> = {
  manual: { label: "Manual", color: "text-slate-400" },
  certification: { label: "Certification", color: "text-emerald-500" },
  review: { label: "Review", color: "text-indigo-500" },
};

function Skeleton() {
  return (
    <div className="flex h-full flex-col gap-5" aria-label="Loading">
      <div className="h-8 w-48 rounded-lg bg-slate-100 dark:bg-slate-800" />
      {[1, 2, 3].map(i => (
        <div key={i} className="h-20 rounded-xl bg-slate-50 dark:bg-slate-800/50" />
      ))}
    </div>
  );
}

export function SkillsContent() {
  const { profile, loading: userLoading, loadPerformanceData } = useUser();
  const { toast } = useToast();
  const isPrivileged = profile?.role === "creator" || profile?.role === "moderator";

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"matrix" | "catalog" | "certifications">("matrix");

  const [skills, setSkills] = useState<Skill[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProfileSkills, setAllProfileSkills] = useState<Record<string, ProfileSkill[]>>({});
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const [selectedProfile, setSelectedProfile] = useState<string>("all");
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("General");

  const [showAssign, setShowAssign] = useState(false);
  const [assignProfile, setAssignProfile] = useState("");
  const [assignSkill, setAssignSkill] = useState("");
  const [assignProficiency, setAssignProficiency] = useState<Proficiency>("beginner");

  const fetchData = useCallback(async () => {
    try {
      const [skillRes, profRes, certRes] = await Promise.all([
        api<{ skills: Skill[]; profileSkills: ProfileSkill[] }>("/skills?all_profiles=true"),
        api<Profile[]>("/profiles"),
        api<Certification[]>("/certifications"),
      ]);
      setSkills(skillRes.skills || []);
      setProfiles(profRes);
      setCertifications(certRes);

      // Group profile skills by profile_id from the single bulk response
      const psMap: Record<string, ProfileSkill[]> = {};
      for (const ps of skillRes.profileSkills || []) {
        (psMap[ps.profile_id] ??= []).push(ps);
      }
      setAllProfileSkills(psMap);
    } catch {
      toast("Failed to load skills data", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!userLoading && profile) {
      fetchData();
      loadPerformanceData();
    }
  }, [userLoading, profile, fetchData, loadPerformanceData]);

  async function createSkill() {
    if (!newSkillName.trim()) return;
    try {
      await api("/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSkillName, category: newSkillCategory }),
      });
      setShowAddSkill(false);
      setNewSkillName("");
      toast("Skill added to catalog", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create skill", "error");
    }
  }

  async function assignSkillToProfile() {
    if (!assignProfile || !assignSkill) return;
    try {
      await api("/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", profile_id: assignProfile, skill_id: assignSkill, proficiency: assignProficiency }),
      });
      setShowAssign(false);
      setAssignProfile(""); setAssignSkill("");
      toast("Skill assigned", "success");
      fetchData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to assign skill", "error");
    }
  }

  if (userLoading || loading) return <Skeleton />;

  const categories = [...new Set(skills.map(s => s.category))].sort();
  const filteredProfiles = selectedProfile === "all" ? profiles : profiles.filter(p => p.id === selectedProfile);

  const tabs = [
    { key: "matrix" as const, label: "Skills Matrix", icon: Sparkles, count: Object.values(allProfileSkills).flat().length },
    { key: "catalog" as const, label: "Skill Catalog", icon: BookOpen, count: skills.length },
    { key: "certifications" as const, label: "Certifications", icon: Award, count: certifications.length },
  ];

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Skills & Certifications</h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Track competencies across your team</p>
        </div>
        <div className="flex gap-2">
          {isPrivileged && (
            <>
              <button onClick={() => setShowAddSkill(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                <Plus className="h-4 w-4" /> Add Skill
              </button>
              <button onClick={() => setShowAssign(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                <Shield className="h-4 w-4" /> Assign Skill
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            <span className="ml-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold dark:bg-slate-600">{t.count}</span>
          </button>
        ))}
      </div>

      {/* ═══ Skills Matrix ═══ */}
      {tab === "matrix" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <option value="all">All team members</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>

          {filteredProfiles.map(p => {
            const ps = allProfileSkills[p.id] || [];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {getInitials(p.first_name, p.last_name)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{p.first_name} {p.last_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.title || p.role}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{ps.length} skills</span>
                </div>

                {ps.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">No skills recorded</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ps.map(skill => (
                      <div key={skill.id} className="group relative">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${proficiencyColors[skill.proficiency]}`}>
                          {(skill as ProfileSkill & { skill_name?: string }).skill_name ?? skill.skill_id}
                          <span className="text-[10px] opacity-60">{skill.proficiency}</span>
                        </span>
                        {skill.source !== "manual" && (
                          <span className={`ml-1 text-[10px] ${sourceLabels[skill.source]?.color}`}>
                            {sourceLabels[skill.source]?.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ Skill Catalog ═══ */}
      {tab === "catalog" && (
        <div className="space-y-3">
          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No skills in catalog yet</p>
              {isPrivileged && (
                <button onClick={() => setShowAddSkill(true)} className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Add your first skill
                </button>
              )}
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {skills.filter(s => s.category === cat).map(skill => (
                    <span key={skill.id} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══ Certifications ═══ */}
      {tab === "certifications" && (
        <div className="space-y-3">
          {certifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
              <Award className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">No certifications earned yet</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Certifications are auto-issued when employees complete courses</p>
            </div>
          ) : (
            certifications.map(cert => {
              const member = profiles.find(p => p.id === cert.profile_id);
              return (
                <motion.div key={cert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                    <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{cert.course?.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {member ? `${member.first_name} ${member.last_name}` : "Unknown"} &middot; Earned {formatShortDate(cert.issued_at)}
                    </p>
                  </div>
                  {cert.skill && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400">
                      {cert.skill?.name}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ═══ Modal: Add Skill ═══ */}
      <AnimatePresence>
        {showAddSkill && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAddSkill(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Skill</h2>
                <button onClick={() => setShowAddSkill(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <input value={newSkillName} onChange={e => setNewSkillName(e.target.value)} placeholder="Skill name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
                <select value={newSkillCategory} onChange={e => setNewSkillCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {["General", "Engineering", "Design", "HR", "Leadership", "Communication", "Technical", "Compliance"].map(c =>
                    <option key={c} value={c}>{c}</option>
                  )}
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowAddSkill(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={createSkill} disabled={!newSkillName.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Modal: Assign Skill ═══ */}
      <AnimatePresence>
        {showAssign && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowAssign(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Assign Skill</h2>
                <button onClick={() => setShowAssign(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <select value={assignProfile} onChange={e => setAssignProfile(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select employee</option>
                  {profiles.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </select>
                <select value={assignSkill} onChange={e => setAssignSkill(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="">Select skill</option>
                  {skills.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
                <select value={assignProficiency} onChange={e => setAssignProficiency(e.target.value as Proficiency)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {(["beginner", "intermediate", "advanced", "expert"] as Proficiency[]).map(p =>
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  )}
                </select>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setShowAssign(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={assignSkillToProfile} disabled={!assignProfile || !assignSkill} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Assign</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
